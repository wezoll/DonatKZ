"""Validator for donation data"""
import logging
from typing import Optional, Tuple

from .models import DonationData

logger = logging.getLogger(__name__)


class DonationValidator:
    """
    Валидатор данных донатов
    
    Проверяет:
    - Корректность суммы (диапазон)
    - Длину имени отправителя
    - Длину сообщения
    - Реалистичность данных
    """
    
    def __init__(
        self,
        min_amount: float = 100.0,
        max_amount: float = 1_000_000.0,
        min_name_length: int = 2,
        max_name_length: int = 100,
        max_message_length: int = 500
    ):
        """
        Инициализация валидатора
        
        Args:
            min_amount: Минимальная сумма доната
            max_amount: Максимальная сумма доната
            min_name_length: Минимальная длина имени
            max_name_length: Максимальная длина имени
            max_message_length: Максимальная длина сообщения
        """
        self.min_amount = min_amount
        self.max_amount = max_amount
        self.min_name_length = min_name_length
        self.max_name_length = max_name_length
        self.max_message_length = max_message_length
        
        logger.debug(
            f"Инициализирован валидатор: "
            f"сумма {min_amount}-{max_amount}₸, "
            f"имя {min_name_length}-{max_name_length} символов"
        )
    
    def validate(self, donation: DonationData) -> Tuple[bool, Optional[str]]:
        """
        Валидация доната
        
        Args:
            donation: Данные доната для валидации
            
        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message)
        """
        # Проверка суммы
        if not self._validate_amount(donation.amount):
            error = f"Сумма {donation.amount}₸ вне допустимого диапазона ({self.min_amount}-{self.max_amount}₸)"
            logger.warning(error)
            return False, error
        
        # Проверка имени отправителя
        if not self._validate_sender_name(donation.sender_name):
            error = f"Некорректное имя отправителя: '{donation.sender_name}'"
            logger.warning(error)
            return False, error
        
        # Проверка сообщения
        if donation.message and not self._validate_message(donation.message):
            error = f"Сообщение слишком длинное: {len(donation.message)} символов (макс {self.max_message_length})"
            logger.warning(error)
            return False, error
        
        # Проверка реалистичности
        if not self._is_realistic(donation):
            error = f"Донат выглядит нереалистичным: {donation}"
            logger.warning(error)
            return False, error
        
        logger.debug(f"Донат прошёл валидацию: {donation}")
        return True, None
    
    def _validate_amount(self, amount: float) -> bool:
        """
        Проверка суммы доната
        
        Args:
            amount: Сумма для проверки
            
        Returns:
            bool: True если сумма валидна
        """
        if not isinstance(amount, (int, float)):
            return False
        
        if amount < self.min_amount or amount > self.max_amount:
            return False
        
        # Проверка на NaN и Infinity
        if amount != amount or amount == float('inf') or amount == float('-inf'):
            return False
        
        return True
    
    def _validate_sender_name(self, name: str) -> bool:
        """
        Проверка имени отправителя
        
        Args:
            name: Имя для проверки
            
        Returns:
            bool: True если имя валидно
        """
        if not isinstance(name, str):
            return False
        
        # Проверка длины
        name_length = len(name.strip())
        if name_length < self.min_name_length or name_length > self.max_name_length:
            return False
        
        # Проверка на пустую строку или только пробелы
        if not name.strip():
            return False
        
        # Проверка на подозрительные символы (слишком много цифр)
        digit_count = sum(c.isdigit() for c in name)
        if digit_count > len(name) * 0.5:  # Больше 50% цифр - подозрительно
            return False
        
        return True
    
    def _validate_message(self, message: str) -> bool:
        """
        Проверка сообщения
        
        Args:
            message: Сообщение для проверки
            
        Returns:
            bool: True если сообщение валидно
        """
        if not isinstance(message, str):
            return False
        
        # Проверка длины
        if len(message) > self.max_message_length:
            return False
        
        return True
    
    def _is_realistic(self, donation: DonationData) -> bool:
        """
        Проверка реалистичности доната
        
        Отсеивает очевидно нереалистичные данные
        
        Args:
            donation: Донат для проверки
            
        Returns:
            bool: True если донат выглядит реалистично
        """
        # Проверка на круглые суммы больше определённого порога
        # (слишком много нулей может быть ошибкой парсинга)
        if donation.amount > 100000:
            # Проверяем, не является ли это числом типа 1000000 (все нули)
            amount_str = str(int(donation.amount))
            if amount_str.endswith('00000'):  # 5+ нулей подряд
                logger.warning(f"Подозрительно круглая большая сумма: {donation.amount}")
                # Пропускаем, но логируем
        
        # Проверка timestamp (не из будущего)
        from datetime import datetime, timedelta
        if donation.timestamp > datetime.now() + timedelta(minutes=5):
            logger.warning("Донат из будущего")
            return False
        
        # Проверка на слишком старый timestamp (больше 24 часов)
        if donation.timestamp < datetime.now() - timedelta(hours=24):
            logger.warning("Донат слишком старый")
            return False
        
        return True
    
    def is_valid(self, donation: DonationData) -> bool:
        """
        Упрощённая проверка валидности (только bool)
        
        Args:
            donation: Донат для проверки
            
        Returns:
            bool: True если валиден
        """
        is_valid, _ = self.validate(donation)
        return is_valid
