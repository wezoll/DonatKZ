"""
Voice Manager — TTS озвучка донатов через Microsoft Neural Voice (edge-tts)

Архитектура:
- VoiceManager принимает текст через speak()
- Очередь (queue) обеспечивает последовательное воспроизведение
- Фоновый поток синтезирует аудио через edge-tts и воспроизводит через pygame
"""
import asyncio
import logging
import queue
import tempfile
import threading
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Попытка импорта зависимостей
try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
    logger.info("✅ edge-tts доступен")
except ImportError:
    EDGE_TTS_AVAILABLE = False
    logger.warning("❌ edge-tts недоступен. Установите: pip install edge-tts")

try:
    import pygame
    PYGAME_AVAILABLE = True
    logger.info("✅ pygame доступен")
except ImportError:
    PYGAME_AVAILABLE = False
    logger.warning("❌ pygame недоступен. Установите: pip install pygame")


# Доступные голоса
VOICES = {
    "ru-RU-SvetlanaNeural": "Светлана (женский)",
    "ru-RU-DmitryNeural": "Дмитрий (мужской)",
}

DEFAULT_VOICE = "ru-RU-SvetlanaNeural"
DEFAULT_VOLUME = 0.8
DEFAULT_MIN_AMOUNT = 0  # Озвучивать донаты от 0₸


class VoiceManager:
    """
    Менеджер голосовой озвучки донатов.

    Использует edge-tts для синтеза и pygame для воспроизведения.
    Поддерживает очередь — донаты не перебивают друг друга.
    """

    def __init__(self):
        self._enabled: bool = False
        self._voice: str = DEFAULT_VOICE
        self._volume: float = DEFAULT_VOLUME
        self._min_amount: int = DEFAULT_MIN_AMOUNT

        # Очередь текстов для озвучивания
        self._queue: queue.Queue = queue.Queue()
        self._worker_thread: Optional[threading.Thread] = None
        self._running: bool = False

        # Инициализация pygame mixer
        self._pygame_initialized = False
        self._init_pygame()

        logger.info("VoiceManager инициализирован")

    # ——————————————————————————————————————
    # Публичный API
    # ——————————————————————————————————————

    def set_enabled(self, enabled: bool):
        """Включить / выключить озвучку"""
        self._enabled = enabled
        if enabled and not self._running:
            self._start_worker()
        logger.info(f"Озвучка: {'включена' if enabled else 'отключена'}")

    def set_voice(self, voice: str):
        """Задать голос (из VOICES)"""
        if voice in VOICES:
            self._voice = voice
            logger.debug(f"Голос: {voice}")
        else:
            logger.warning(f"Неизвестный голос: {voice}, использую {self._voice}")

    def set_volume(self, volume: float):
        """Громкость 0.0 — 1.0"""
        self._volume = max(0.0, min(1.0, volume))
        logger.debug(f"Громкость: {self._volume}")

    def set_min_amount(self, amount: int):
        """Минимальная сумма для озвучки"""
        self._min_amount = amount

    def is_enabled(self) -> bool:
        return self._enabled and EDGE_TTS_AVAILABLE and PYGAME_AVAILABLE

    def speak(self, text: str, amount: int = 0):
        """
        Добавить текст в очередь озвучивания.

        Args:
            text: Текст для озвучивания
            amount: Сумма доната (для фильтра по минимальной сумме)
        """
        if not self.is_enabled():
            return

        if amount > 0 and amount < self._min_amount:
            logger.debug(f"Сумма {amount}₸ меньше минимума {self._min_amount}₸, пропуск")
            return

        self._queue.put(text)
        logger.debug(f"Добавлено в очередь озвучки: {text[:50]}...")

        # Убеждаемся что воркер запущен
        if not self._running:
            self._start_worker()

    def stop(self):
        """Остановить воркер и очистить очередь"""
        self._running = False
        # Добавляем sentinel для разблокировки потока
        self._queue.put(None)
        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=3.0)
        logger.info("VoiceManager остановлен")

    # ——————————————————————————————————————
    # Внутренняя логика
    # ——————————————————————————————————————

    def _init_pygame(self):
        """Инициализация pygame mixer"""
        if not PYGAME_AVAILABLE:
            return
        try:
            pygame.mixer.pre_init(frequency=24000, size=-16, channels=1, buffer=4096)
            pygame.mixer.init()
            self._pygame_initialized = True
            logger.info("✅ pygame mixer инициализирован")
        except Exception as e:
            logger.error(f"❌ Ошибка инициализации pygame mixer: {e}")

    def _start_worker(self):
        """Запустить фоновый поток обработки очереди"""
        if self._running:
            return
        self._running = True
        self._worker_thread = threading.Thread(
            target=self._worker_loop,
            daemon=True,
            name="VoiceTTS"
        )
        self._worker_thread.start()
        logger.debug("VoiceTTS воркер запущен")

    def _worker_loop(self):
        """Основной цикл воркера"""
        # Каждый поток создаёт свой event loop для edge-tts
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            while self._running:
                try:
                    text = self._queue.get(timeout=1.0)
                    if text is None:  # sentinel
                        break
                    loop.run_until_complete(self._synthesize_and_play(text))
                except queue.Empty:
                    continue
                except Exception as e:
                    logger.error(f"Ошибка в VoiceTTS воркере: {e}")
        finally:
            loop.close()
            self._running = False
            logger.debug("VoiceTTS воркер завершён")

    async def _synthesize_and_play(self, text: str):
        """Синтез через edge-tts и воспроизведение через pygame"""
        if not EDGE_TTS_AVAILABLE or not self._pygame_initialized:
            return

        tmp_path = None
        try:
            # Создаём временный mp3 файл
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tmp_path = tmp.name

            # Синтез речи
            communicate = edge_tts.Communicate(text, self._voice)
            await communicate.save(tmp_path)

            # Воспроизведение через pygame
            pygame.mixer.music.load(tmp_path)
            pygame.mixer.music.set_volume(self._volume)
            pygame.mixer.music.play()

            # Ждём окончания воспроизведения
            while pygame.mixer.music.get_busy():
                await asyncio.sleep(0.1)

            logger.info(f"✅ Озвучено: {text[:50]}...")

        except Exception as e:
            logger.error(f"Ошибка синтеза/воспроизведения: {e}")
        finally:
            # Удаляем временный файл
            if tmp_path and os.path.exists(tmp_path):
                try:
                    pygame.mixer.music.unload()
                    os.unlink(tmp_path)
                except Exception:
                    pass
