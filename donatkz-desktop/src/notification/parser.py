"""Parser for Kaspi notification text"""
import re
from datetime import datetime
from typing import Optional
import logging

from .models import DonationData

logger = logging.getLogger(__name__)


class KaspiNotificationParser:
    """
    Парсер уведомлений Kaspi для извлечения данных о донатах
    
    Поддерживает множество форматов уведомлений:
    - "Пополнение: 100 Т\nАспандияр Т.: Рахмет"
    - "Перевод: 500 ₸ от Айгерим К."
    - "1000 ₸ от Максим С. - Спасибо за стрим"
    - "Kaspi Gold\nПеревод 200₸\nОт: Иван И.\nСообщение: Привет"
    """
    
    # Паттерны для разных форматов уведомлений Kaspi
    # ВАЖНО: Порядок имеет значение - более специфичные паттерны должны быть первыми
    PATTERNS = [
        # Формат 0: "Kaspi.kz Kaspi Gold Пополнение: 100 ₸\nАспандияр Т." (СПЕЦИФИЧНЫЙ - новый формат)
        # ИСПРАВЛЕНО: Захватывает только имя БЕЗ остального текста после (комментариев)
        r'Kaspi\.kz\s+Kaspi\s+Gold\s+Пополнение:\s*(\d+(?:[,\.]\d+)?)\s*[₸ТT]+\s*\n+\s*([А-Яа-яЁё]+(?:\s+[А-Яа-яЁё\.]+)?)(?:\n|\\n|$)',
        
        # Формат 1a: "Пополнение: 100 Т\nАспандияр Т.: Рахмет" (с двоеточием после имени)
        r'Пополнение:\s*(\d+(?:[,\.]\d+)?)\s*[ТT₸тенге]+\s*(?:\n|\\n)?(.+?):\s*(.+)',
        
        # Формат 1b: "Пополнение: 100 Т\nАспандияр Т. Рахмет" (НОВОЕ - БЕЗ двоеточия после имени)
        r'Пополнение:\s*(\d+(?:[,\.]\d+)?)\s*[ТT₸тенге]+\s*(?:\n|\\n)?([А-Яа-яЁё\s\.]+?)\s+([А-Яа-яЁё\s]+?)(?:\n|\\n|$)',
        
        # Формат 4: "Kaspi Gold\nПеревод 200₸\nОт: Иван И.\nСообщение: Привет" (СПЕЦИФИЧНЫЙ - перед общим "Перевод:")
        r'Kaspi.*?\n.*?Перевод\s*(\d+(?:[,\.]\d+)?)\s*[₸ТT]\s*\n+\s*От:\s*(.+?)\s*(?:\n+\s*Сообщение:\s*(.+?))?(?:\n|$)',
        
        # Формат 6: "Получен перевод 500₸\nОтправитель: Дамир К.\nКомментарий: Спасибо" (СПЕЦИФИЧНЫЙ)
        r'Получен\s+перевод\s+(\d+(?:[,\.]\d+)?)\s*[₸ТT]\s*\n+\s*Отправитель:\s*(.+?)\s*(?:\n+\s*Комментарий:\s*(.+?))?(?:\n|$)',
        
        # Формат 8: "Перевод на сумму 1500 ₸\nОт: Нурлан А.\n" (СПЕЦИФИЧНЫЙ - с "на сумму")
        r'Перевод\s+на\s+сумму\s+(\d+(?:[,\.]\d+)?)\s*[₸ТT]\s*\n.*?От:\s*(.+?)(?:\n.*?(.+))?',
        
        # Формат 2: "Перевод: 500 ₸ от Айгерим К." (ОБЩИЙ - после специфичных)
        r'Перевод:\s*(\d+(?:[,\.\s]\d+)*)\s*[₸ТTтенге]+\s*от\s*(.+?)(?:\n|\\n)?(?::\s*(.+))?$',
        
        # Формат 5: "Вам перевели 1000 тенге от Алия Б."
        r'Вам\s+перевели\s+(\d+(?:[,\.\s]\d+)*)\s*(?:тенге|₸|Т|T)\s+от\s+(.+?)(?:\n|\\n)?(?::\s*(.+))?$',
        
        # Формат 3: "1000 ₸ от Максим С. - Спасибо за стрим"
        r'(\d+(?:[,\.]\d+)?)\s*[₸ТT]\s*от\s*(.+?)(?:\s*[-–]\s*(.+))?$',
        
        # Формат 7: Простой формат "500₸ от Имя"
        r'^(\d+(?:[,\.]\d+)?)\s*[₸ТT]\s+от\s+(.+?)(?:\s*[-–:]\s*(.+))?$',
    ]
    
    def __init__(self):
        """Инициализация парсера"""
        self.compiled_patterns = [
            re.compile(pattern, re.IGNORECASE | re.DOTALL | re.MULTILINE)
            for pattern in self.PATTERNS
        ]
        logger.debug(f"Инициализирован парсер с {len(self.compiled_patterns)} паттернами")
    
    def parse(self, notification_text: str) -> Optional[DonationData]:
        """
        Парсинг текста уведомления
        
        Args:
            notification_text: Текст уведомления от Kaspi
            
        Returns:
            DonationData если парсинг успешен, None если не удалось распарсить
        """
        if not notification_text or not notification_text.strip():
            logger.warning("Получен пустой текст уведомления")
            return None
        
        # ВАЖНО: Извлекаем время ДО очистки текста!
        extracted_time = self._extract_time_from_notification(notification_text)
        
        # Очистка текста от лишних пробелов и переносов
        # ТАКЖЕ убираем время из конца текста (добавленное слушателем)
        text = notification_text.strip()
        # Убираем время в формате HH:MM из конца текста
        text = re.sub(r'\s+\d{1,2}:\d{2}\s*$', '', text)
        
        logger.debug(f"Попытка парсинга: {text[:100]}...")
        
        # Пробуем каждый паттерн
        for idx, pattern in enumerate(self.compiled_patterns):
            match = pattern.search(text)
            if match:
                logger.debug(f"Совпадение найдено с паттерном #{idx + 1}")
                try:
                    donation = self._extract_donation_data_from_match(match, text, extracted_time)
                    if donation:
                        logger.info(f"Успешно распарсен донат: {donation}")
                        return donation
                except Exception as e:
                    logger.error(f"Ошибка при извлечении данных из match: {e}")
                    continue
        
        logger.warning(f"Не удалось распарсить уведомление: {text[:100]}...")
        return None
    
    def _extract_time_from_notification(self, raw_text: str) -> datetime:
        """
        Попытка извлечь время из текста уведомления
        Если не найдено - возвращает текущее время
        
        Ищет время в формате HH:MM (например "19:58")
        
        Args:
            raw_text: Текст уведомления
            
        Returns:
            datetime объект с время из уведомления или текущее время
        """
        try:
            # Ищем время в формате HH:MM
            time_match = re.search(r'(\d{1,2}):(\d{2})', raw_text)
            if time_match:
                hours = int(time_match.group(1))
                minutes = int(time_match.group(2))
                
                # Валидируем часы и минуты
                if 0 <= hours <= 23 and 0 <= minutes <= 59:
                    now = datetime.now()
                    # Создаем время с часами и минутами из уведомления, текущие секунды
                    donation_time = now.replace(hour=hours, minute=minutes, second=0, microsecond=0)
                    
                    # Если время в будущем - это скорее всего из вчера
                    if donation_time > now:
                        # Используем вчерашнюю дату
                        from datetime import timedelta
                        donation_time = donation_time - timedelta(days=1)
                    
                    logger.debug(f"Извлекли время из уведомления: {donation_time.strftime('%H:%M:%S')}")
                    return donation_time
        except Exception as e:
            logger.debug(f"Не удалось извлечь время из уведомления: {e}")
        
        # Если не удалось - возвращаем текущее время
        return datetime.now()
    
    def _extract_donation_data_from_match(self, match: re.Match, raw_text: str, extracted_time: datetime) -> Optional[DonationData]:
        """
        Извлечение данных о донате из regex match
        
        Args:
            match: Результат regex match
            raw_text: Исходный текст уведомления
            
        Returns:
            DonationData или None
        """
        groups = match.groups()
        
        if len(groups) < 2:
            logger.warning("Недостаточно групп в regex match")
            return None
        
        # Извлекаем сумму (группа 1)
        amount_str = groups[0]
        amount = self._parse_amount(amount_str)
        if amount is None:
            logger.warning(f"Не удалось распарсить сумму: {amount_str}")
            return None
        
        # Извлекаем имя отправителя (группа 2)
        sender_name = self._clean_sender_name(groups[1])
        if not sender_name:
            logger.warning("Не удалось извлечь имя отправителя")
            return None
        
        # Извлекаем сообщение (группа 3, опционально)
        message = None
        if len(groups) >= 3 and groups[2]:
            message = self._clean_message(groups[2])
        
        return DonationData(
            amount=amount,
            sender_name=sender_name,
            message=message,
            timestamp=extracted_time,
            raw_notification=raw_text
        )
    
    def _parse_amount(self, amount_str: str) -> Optional[float]:
        """
        Парсинг строки с суммой в float
        
        Поддерживает форматы:
        - "1000" -> 1000.0
        - "1,500" -> 1500.0
        - "1.500" -> 1500.0
        - "1 500" -> 1500.0
        
        Args:
            amount_str: Строка с суммой
            
        Returns:
            float сумма или None если не удалось распарсить
        """
        try:
            # Убираем все пробелы сначала
            cleaned = amount_str.strip()
            
            # Проверяем если есть пробелы внутри числа (например "10 000")
            if " " in cleaned:
                # Убираем все пробелы - это разделители тысяч
                cleaned = cleaned.replace(" ", "")
            
            # Заменяем запятую и точку на пустую строку если это разделитель тысяч
            # Определяем: если после запятой/точки больше 2 цифр - это разделитель тысяч
            if "," in cleaned:
                parts = cleaned.split(",")
                if len(parts) == 2 and len(parts[1]) <= 2:
                    # Это десятичная дробь
                    cleaned = cleaned.replace(",", ".")
                else:
                    # Это разделитель тысяч
                    cleaned = cleaned.replace(",", "")
            
            # То же для точки (в некоторых локалях точка = разделитель тысяч)
            if "." in cleaned:
                parts = cleaned.split(".")
                if len(parts) == 2 and len(parts[1]) > 2:
                    # Это разделитель тысяч
                    cleaned = cleaned.replace(".", "")
            
            # Если пустая строка после очистки
            if not cleaned:
                return None
            
            amount = float(cleaned)
            return amount
        except (ValueError, AttributeError) as e:
            logger.error(f"Ошибка парсинга суммы '{amount_str}': {e}")
            return None
    
    def _clean_sender_name(self, name: str) -> str:
        """
        Очистка имени отправителя
        
        Args:
            name: Сырое имя
            
        Returns:
            Очищенное имя
        """
        if not name:
            return ""
        
        # Убираем лишние пробелы (включая в начале и конце)
        cleaned = " ".join(name.strip().split())
        
        # Убираем возможные артефакты в начале и конце, НО сохраняем точки после инициалов
        # Удаляем только в конце строки, если это не часть инициала
        while cleaned and (cleaned[-1] in ',;:!?-–' or cleaned.endswith('...') or cleaned.endswith('..')):
            cleaned = cleaned.rstrip('.,;:!?-–')
        
        # Удаляем артефакты в начале
        cleaned = cleaned.lstrip('.,;:!?-–')
        cleaned = cleaned.strip()  # Финальная очистка пробелов
        
        return cleaned
    
    def _clean_message(self, message: str) -> Optional[str]:
        """
        Очистка сообщения
        
        Args:
            message: Сырое сообщение
            
        Returns:
            Очищенное сообщение или None
        """
        if not message:
            return None
        
        # Убираем лишние пробелы и переносы
        cleaned = " ".join(message.strip().split())
        
        # Убираем артефакты
        cleaned = cleaned.strip(".,;:!?-–")
        
        # Если после очистки ничего не осталось
        if not cleaned or len(cleaned) < 1:
            return None
        
        return cleaned
    
    def test_pattern(self, notification_text: str) -> dict:
        """
        Тестирование парсера на конкретном тексте (для отладки)
        
        Args:
            notification_text: Текст для теста
            
        Returns:
            dict с результатами теста
        """
        result = {
            "text": notification_text,
            "matched": False,
            "pattern_index": None,
            "groups": None,
            "donation": None
        }
        
        # Извлекаем время из текста
        extracted_time = self._extract_time_from_notification(notification_text)
        
        for idx, pattern in enumerate(self.compiled_patterns):
            match = pattern.search(notification_text)
            if match:
                result["matched"] = True
                result["pattern_index"] = idx
                result["groups"] = match.groups()
                
                try:
                    donation = self._extract_donation_data_from_match(match, notification_text, extracted_time)
                    if donation:
                        result["donation"] = donation.to_dict()
                except Exception as e:
                    result["error"] = str(e)
                
                break
        
        return result
