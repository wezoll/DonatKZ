"""Tests for donation validator"""
import pytest
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Добавляем src в путь для импортов
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from notification.validator import DonationValidator
from notification.models import DonationData


class TestDonationValidator:
    """Тесты для DonationValidator"""
    
    @pytest.fixture
    def validator(self):
        """Фикстура валидатора с дефолтными настройками"""
        return DonationValidator(
            min_amount=100.0,
            max_amount=1_000_000.0
        )
    
    @pytest.fixture
    def valid_donation(self):
        """Фикстура валидного доната"""
        return DonationData(
            amount=500.0,
            sender_name="Тестовый Пользователь",
            message="Тестовое сообщение",
            timestamp=datetime.now(),
            raw_notification="Test"
        )
    
    def test_valid_donation(self, validator, valid_donation):
        """Тест валидного доната"""
        is_valid, error = validator.validate(valid_donation)
        
        assert is_valid is True
        assert error is None
    
    def test_valid_donation_without_message(self, validator):
        """Тест валидного доната без сообщения"""
        donation = DonationData(
            amount=500.0,
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is True
        assert error is None
    
    def test_amount_too_small(self, validator):
        """Тест слишком маленькой суммы"""
        donation = DonationData(
            amount=50.0,  # Меньше минимума (100)
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
        assert "вне допустимого диапазона" in error
    
    def test_amount_too_large(self, validator):
        """Тест слишком большой суммы"""
        donation = DonationData(
            amount=2_000_000.0,  # Больше максимума (1_000_000)
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
        assert "вне допустимого диапазона" in error
    
    def test_amount_at_min_boundary(self, validator):
        """Тест суммы на минимальной границе"""
        donation = DonationData(
            amount=100.0,  # Ровно минимум
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is True
        assert error is None
    
    def test_amount_at_max_boundary(self, validator):
        """Тест суммы на максимальной границе"""
        donation = DonationData(
            amount=1_000_000.0,  # Ровно максимум
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is True
        assert error is None
    
    def test_sender_name_too_short(self, validator):
        """Тест слишком короткого имени"""
        donation = DonationData(
            amount=500.0,
            sender_name="Т",  # Меньше 2 символов
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
        assert "Некорректное имя" in error
    
    def test_sender_name_too_long(self, validator):
        """Тест слишком длинного имени"""
        donation = DonationData(
            amount=500.0,
            sender_name="Т" * 101,  # Больше 100 символов
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
        assert "Некорректное имя" in error
    
    def test_sender_name_empty(self, validator):
        """Тест пустого имени"""
        donation = DonationData(
            amount=500.0,
            sender_name="",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
    
    def test_sender_name_whitespace_only(self, validator):
        """Тест имени из пробелов"""
        donation = DonationData(
            amount=500.0,
            sender_name="   ",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
    
    def test_sender_name_with_too_many_digits(self, validator):
        """Тест имени с большим количеством цифр"""
        donation = DonationData(
            amount=500.0,
            sender_name="123456789",  # Больше 50% цифр
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
    
    def test_sender_name_with_some_digits(self, validator):
        """Тест имени с небольшим количеством цифр (валидно)"""
        donation = DonationData(
            amount=500.0,
            sender_name="Тест123",  # Меньше 50% цифр
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is True
        assert error is None
    
    def test_message_too_long(self, validator):
        """Тест слишком длинного сообщения"""
        donation = DonationData(
            amount=500.0,
            sender_name="Тест",
            message="Т" * 501,  # Больше 500 символов
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
        assert "слишком длинное" in error.lower()
    
    def test_message_at_max_length(self, validator):
        """Тест сообщения максимальной длины"""
        donation = DonationData(
            amount=500.0,
            sender_name="Тест",
            message="Т" * 500,  # Ровно 500 символов
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is True
        assert error is None
    
    def test_timestamp_from_future(self, validator):
        """Тест timestamp из будущего"""
        donation = DonationData(
            amount=500.0,
            sender_name="Тест",
            message=None,
            timestamp=datetime.now() + timedelta(hours=1),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
    
    def test_timestamp_too_old(self, validator):
        """Тест слишком старого timestamp"""
        donation = DonationData(
            amount=500.0,
            sender_name="Тест",
            message=None,
            timestamp=datetime.now() - timedelta(hours=25),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
        assert error is not None
    
    def test_timestamp_recent(self, validator):
        """Тест недавнего timestamp"""
        donation = DonationData(
            amount=500.0,
            sender_name="Тест",
            message=None,
            timestamp=datetime.now() - timedelta(minutes=30),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is True
        assert error is None
    
    def test_is_valid_method(self, validator, valid_donation):
        """Тест упрощённого метода is_valid()"""
        assert validator.is_valid(valid_donation) is True
        
        invalid_donation = DonationData(
            amount=50.0,  # Меньше минимума
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        assert validator.is_valid(invalid_donation) is False
    
    def test_custom_limits(self):
        """Тест кастомных лимитов"""
        custom_validator = DonationValidator(
            min_amount=50.0,
            max_amount=500.0
        )
        
        donation = DonationData(
            amount=100.0,
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = custom_validator.validate(donation)
        assert is_valid is True
        
        # Проверяем что старые лимиты не работают
        donation.amount = 1000.0
        is_valid, error = custom_validator.validate(donation)
        assert is_valid is False
    
    def test_amount_nan(self, validator):
        """Тест NaN суммы"""
        donation = DonationData(
            amount=float('nan'),
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
    
    def test_amount_infinity(self, validator):
        """Тест бесконечной суммы"""
        donation = DonationData(
            amount=float('inf'),
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
    
    def test_amount_negative(self, validator):
        """Тест отрицательной суммы"""
        donation = DonationData(
            amount=-100.0,
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False
    
    def test_amount_zero(self, validator):
        """Тест нулевой суммы"""
        donation = DonationData(
            amount=0.0,
            sender_name="Тест",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        is_valid, error = validator.validate(donation)
        
        assert is_valid is False


if __name__ == "__main__":
    # Запуск тестов
    pytest.main([__file__, "-v"])





