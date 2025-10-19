"""
Phone Link Monitor

Мониторинг состояния "Связь с телефоном" Windows
и отображение статуса в GUI и трее.
"""
import logging
import time
import threading
from typing import Optional, Callable, Dict, Any
from datetime import datetime, timedelta

try:
    import winreg
    WINDOWS_REGISTRY_AVAILABLE = True
except ImportError:
    WINDOWS_REGISTRY_AVAILABLE = False
    logging.warning("Windows Registry недоступен")

logger = logging.getLogger(__name__)


class PhoneLinkMonitor:
    """
    Монитор состояния Phone Link
    
    Отслеживает:
    - Статус "Связь с телефоном" Windows
    - Активность Phone Link приложения
    - Уведомления от Phone Link
    - Интеграцию с TrayManager
    """
    
    def __init__(
        self,
        on_status_change: Optional[Callable[[str], None]] = None,
        check_interval: float = 5.0
    ):
        """
        Инициализация монитора
        
        Args:
            on_status_change: Callback при изменении статуса
            check_interval: Интервал проверки в секундах
        """
        self.on_status_change = on_status_change
        self.check_interval = check_interval
        
        # Состояние
        self.is_running = False
        self.current_status = "Неизвестно"
        self.last_check = None
        self.monitor_thread = None
        
        # Статистика
        self.stats = {
            "checks_total": 0,
            "status_changes": 0,
            "phone_link_active": 0,
            "phone_link_inactive": 0,
            "start_time": None
        }
        
        logger.info("PhoneLinkMonitor инициализирован")
        logger.info(f"Windows Registry доступен: {WINDOWS_REGISTRY_AVAILABLE}")
    
    def start(self):
        """Запуск мониторинга"""
        if self.is_running:
            logger.warning("PhoneLinkMonitor уже запущен")
            return True
        
        try:
            self.is_running = True
            self.stats["start_time"] = datetime.now()
            
            # Запускаем мониторинг в отдельном потоке
            self.monitor_thread = threading.Thread(
                target=self._monitor_loop,
                daemon=True,
                name="PhoneLinkMonitor"
            )
            self.monitor_thread.start()
            
            logger.info("✅ PhoneLinkMonitor запущен")
            return True
            
        except Exception as e:
            logger.exception(f"Ошибка запуска PhoneLinkMonitor: {e}")
            self.is_running = False
            return False
    
    def stop(self):
        """Остановка мониторинга"""
        if not self.is_running:
            return
        
        try:
            self.is_running = False
            
            if self.monitor_thread and self.monitor_thread.is_alive():
                self.monitor_thread.join(timeout=2.0)
            
            logger.info("✅ PhoneLinkMonitor остановлен")
            
        except Exception as e:
            logger.exception(f"Ошибка остановки PhoneLinkMonitor: {e}")
    
    def _monitor_loop(self):
        """Основной цикл мониторинга"""
        while self.is_running:
            try:
                # Проверяем статус Phone Link
                status = self._check_phone_link_status()
                
                # Обновляем статистику
                self.stats["checks_total"] += 1
                self.last_check = datetime.now()
                
                # Проверяем изменение статуса
                if status != self.current_status:
                    self._update_status(status)
                
                # Небольшая задержка
                time.sleep(self.check_interval)
                
            except Exception as e:
                logger.exception(f"Ошибка в цикле мониторинга: {e}")
                time.sleep(self.check_interval)
    
    def _check_phone_link_status(self) -> str:
        """
        Проверка статуса Phone Link
        
        Returns:
            str: Статус Phone Link
        """
        try:
            # Сначала проверяем окна (если окно видно - точно работает)
            if self._check_phone_link_window():
                self.stats["phone_link_active"] += 1
                return "Работает"
            
            # Если окна нет, проверяем процессы
            if self._check_phone_link_process():
                self.stats["phone_link_active"] += 1
                return "Свёрнут"  # Процесс работает, но окно скрыто
            
            # Если ничего не найдено
            self.stats["phone_link_inactive"] += 1
            return "Не работает"
            
        except Exception as e:
            logger.debug(f"Ошибка проверки Phone Link: {e}")
            return "Ошибка"
    
    def _check_phone_link_process(self) -> bool:
        """
        Проверка процессов Phone Link
        
        Returns:
            bool: True если Phone Link запущен
        """
        try:
            import psutil
            
            # Ищем процессы Phone Link
            phone_link_processes = [
                "Phone Link",
                "Your Phone",
                "Microsoft.YourPhone",
                "PhoneExperienceHost",
                "YourPhoneApp"
            ]
            
            for proc in psutil.process_iter(['name']):
                try:
                    proc_name = proc.info['name']
                    if any(phone_name.lower() in proc_name.lower() for phone_name in phone_link_processes):
                        return True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            return False
            
        except ImportError:
            logger.debug("psutil недоступен для проверки процессов")
            return False
        except Exception as e:
            logger.debug(f"Ошибка проверки процессов: {e}")
            return False
    
    def _check_phone_link_window(self) -> bool:
        """
        Проверка окна Phone Link
        
        Returns:
            bool: True если окно Phone Link найдено
        """
        try:
            import win32gui
            
            def enum_windows_callback(hwnd, windows):
                if win32gui.IsWindowVisible(hwnd):
                    window_text = win32gui.GetWindowText(hwnd)
                    if any(keyword in window_text.lower() for keyword in ['связь с телефоном', 'phone link', 'your phone']):
                        windows.append((hwnd, window_text))
                return True
            
            windows = []
            win32gui.EnumWindows(enum_windows_callback, windows)
            
            return len(windows) > 0
            
        except ImportError:
            logger.debug("win32gui недоступен для проверки окон")
            return False
        except Exception as e:
            logger.debug(f"Ошибка проверки окон: {e}")
            return False
    
    def _update_status(self, new_status: str):
        """
        Обновление статуса
        
        Args:
            new_status: Новый статус
        """
        old_status = self.current_status
        self.current_status = new_status
        self.stats["status_changes"] += 1
        
        logger.info(f"Phone Link статус изменился: {old_status} → {new_status}")
        
        # Вызываем callback
        if self.on_status_change:
            try:
                self.on_status_change(new_status)
            except Exception as e:
                logger.exception(f"Ошибка в callback статуса: {e}")
    
    def get_status(self) -> str:
        """
        Получение текущего статуса
        
        Returns:
            str: Текущий статус
        """
        return self.current_status
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Получение статистики мониторинга
        
        Returns:
            dict: Статистика
        """
        uptime = datetime.now() - self.stats["start_time"] if self.stats["start_time"] else None
        
        return {
            **self.stats,
            "current_status": self.current_status,
            "is_running": self.is_running,
            "last_check": self.last_check,
            "uptime_seconds": uptime.total_seconds() if uptime else 0,
            "check_interval": self.check_interval
        }
    
    def force_check(self) -> str:
        """
        Принудительная проверка статуса
        
        Returns:
            str: Текущий статус
        """
        try:
            status = self._check_phone_link_status()
            self._update_status(status)
            return status
        except Exception as e:
            logger.exception(f"Ошибка принудительной проверки: {e}")
            return "Ошибка"
    
    def set_check_interval(self, interval: float):
        """
        Установка интервала проверки
        
        Args:
            interval: Интервал в секундах
        """
        if interval > 0:
            self.check_interval = interval
            logger.info(f"Интервал проверки установлен: {interval} сек")
        else:
            logger.warning("Некорректный интервал проверки")
