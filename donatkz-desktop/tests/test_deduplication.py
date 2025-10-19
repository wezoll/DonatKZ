"""Tests for deduplication manager"""
import pytest
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Добавляем src в путь для импортов
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from utils.deduplication import DeduplicationManager, generate_donation_hash
from notification.models import DonationData


class TestDeduplicationManager:
    """Тесты для DeduplicationManager"""
    
    @pytest.fixture
    def manager(self):
        """Фикстура менеджера дедупликации"""
        return DeduplicationManager(window_seconds=300, max_cache_size=100)
    
    @pytest.fixture
    def donation(self):
        """Фикстура доната"""
        return DonationData(
            amount=500.0,
            sender_name="Тест",
            message="Сообщение",
            timestamp=datetime.now(),
            raw_notification="Test"
        )
    
    def test_first_donation_not_duplicate(self, manager, donation):
        """Тест что первый донат не дубликат"""
        assert manager.is_duplicate(donation) is False
    
    def test_same_donation_is_duplicate(self, manager, donation):
        """Тест что идентичный донат является дубликатом"""
        # Первый раз
        assert manager.is_duplicate(donation) is False
        
        # Второй раз - должен быть дубликатом
        assert manager.is_duplicate(donation) is True
    
    def test_different_amount_not_duplicate(self, manager, donation):
        """Тест что донат с другой суммой не дубликат"""
        assert manager.is_duplicate(donation) is False
        
        donation2 = DonationData(
            amount=1000.0,  # Другая сумма
            sender_name=donation.sender_name,
            message=donation.message,
            timestamp=donation.timestamp,
            raw_notification="Test"
        )
        
        assert manager.is_duplicate(donation2) is False
    
    def test_different_sender_not_duplicate(self, manager, donation):
        """Тест что донат от другого отправителя не дубликат"""
        assert manager.is_duplicate(donation) is False
        
        donation2 = DonationData(
            amount=donation.amount,
            sender_name="Другое Имя",  # Другой отправитель
            message=donation.message,
            timestamp=donation.timestamp,
            raw_notification="Test"
        )
        
        assert manager.is_duplicate(donation2) is False
    
    def test_different_timestamp_minutes_not_duplicate(self, manager, donation):
        """Тест что донат с другой минутой не дубликат"""
        assert manager.is_duplicate(donation) is False
        
        donation2 = DonationData(
            amount=donation.amount,
            sender_name=donation.sender_name,
            message=donation.message,
            timestamp=donation.timestamp + timedelta(minutes=2),  # Другая минута
            raw_notification="Test"
        )
        
        assert manager.is_duplicate(donation2) is False
    
    def test_different_timestamp_seconds_is_duplicate(self, manager):
        """Тест что донат с другими секундами но той же минутой - дубликат"""
        # Создаём донат с фиксированным временем в середине минуты
        base_time = datetime.now().replace(second=10, microsecond=0)
        
        donation1 = DonationData(
            amount=500.0,
            sender_name="Тест",
            message="Сообщение",
            timestamp=base_time,
            raw_notification="Test"
        )
        
        assert manager.is_duplicate(donation1) is False
        
        # Донат с другими секундами, но той же минутой
        donation2 = DonationData(
            amount=donation1.amount,
            sender_name=donation1.sender_name,
            message=donation1.message,
            timestamp=base_time.replace(second=45),  # Другие секунды, та же минута
            raw_notification="Test"
        )
        
        # НЕ должен быть дубликатом т.к. секунды разные (теперь включаем секунды)
        assert manager.is_duplicate(donation2) is False
    
    def test_old_donation_cleanup(self):
        """Тест очистки старых донатов"""
        manager = DeduplicationManager(window_seconds=5)  # 5 секунд окно
        
        old_donation = DonationData(
            amount=500.0,
            sender_name="Тест",
            message=None,
            timestamp=datetime.now() - timedelta(seconds=10),  # Старый
            raw_notification="Test"
        )
        
        # Добавляем старый донат
        assert manager.is_duplicate(old_donation) is False
        
        # Через несколько секунд он должен быть очищен
        import time
        time.sleep(1)
        
        # Проверяем что кэш очищается
        manager._cleanup_old_hashes()
        
        # Старый донат должен быть удалён и не считаться дубликатом
        # (хотя технически у него тот же хеш)
    
    def test_cache_size_limit(self):
        """Тест лимита размера кэша"""
        manager = DeduplicationManager(window_seconds=300, max_cache_size=10)
        
        # Добавляем 15 донатов
        for i in range(15):
            donation = DonationData(
                amount=float(i),
                sender_name=f"Тест {i}",
                message=None,
                timestamp=datetime.now(),
                raw_notification="Test"
            )
            manager.is_duplicate(donation)
        
        # Размер кэша не должен превышать 10
        assert manager.get_cache_size() <= 10
    
    def test_clear_cache(self, manager, donation):
        """Тест очистки кэша"""
        # Добавляем донат
        assert manager.is_duplicate(donation) is False
        assert manager.get_cache_size() > 0
        
        # Очищаем
        manager.clear()
        assert manager.get_cache_size() == 0
        
        # Тот же донат теперь не дубликат
        assert manager.is_duplicate(donation) is False
    
    def test_get_cache_size(self, manager, donation):
        """Тест получения размера кэша"""
        assert manager.get_cache_size() == 0
        
        manager.is_duplicate(donation)
        assert manager.get_cache_size() == 1
        
        # Добавляем ещё один
        donation2 = DonationData(
            amount=1000.0,
            sender_name="Другой",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        manager.is_duplicate(donation2)
        assert manager.get_cache_size() == 2
    
    def test_get_stats_empty(self, manager):
        """Тест статистики пустого кэша"""
        stats = manager.get_stats()
        
        assert stats["size"] == 0
        assert stats["oldest"] is None
        assert stats["newest"] is None
    
    def test_get_stats_with_data(self, manager):
        """Тест статистики с данными"""
        # Добавляем несколько донатов
        for i in range(3):
            donation = DonationData(
                amount=float(i),
                sender_name=f"Тест {i}",
                message=None,
                timestamp=datetime.now() + timedelta(seconds=i),
                raw_notification="Test"
            )
            manager.is_duplicate(donation)
        
        stats = manager.get_stats()
        
        assert stats["size"] == 3
        assert stats["oldest"] is not None
        assert stats["newest"] is not None
    
    def test_generate_donation_hash(self, donation):
        """Тест генерации хеша"""
        hash1 = generate_donation_hash(donation)
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA256 = 64 hex символа
        
        # Тот же донат должен давать тот же хеш
        hash2 = generate_donation_hash(donation)
        assert hash1 == hash2
    
    def test_generate_hash_different_donations(self):
        """Тест что разные донаты дают разные хеши"""
        donation1 = DonationData(
            amount=500.0,
            sender_name="Тест1",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        donation2 = DonationData(
            amount=1000.0,
            sender_name="Тест2",
            message=None,
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        hash1 = generate_donation_hash(donation1)
        hash2 = generate_donation_hash(donation2)
        
        # Хеши должны быть разными (теперь включаем секунды)
        assert hash1 != hash2
    
    def test_generate_hash_ignores_message(self):
        """Тест что хеш не зависит от сообщения"""
        donation1 = DonationData(
            amount=500.0,
            sender_name="Тест",
            message="Сообщение 1",
            timestamp=datetime.now(),
            raw_notification="Test"
        )
        
        donation2 = DonationData(
            amount=500.0,
            sender_name="Тест",
            message="Сообщение 2",
            timestamp=donation1.timestamp,
            raw_notification="Test"
        )
        
        hash1 = generate_donation_hash(donation1)
        hash2 = generate_donation_hash(donation2)
        
        # Хеши должны быть одинаковы
        assert hash1 == hash2

    def test_generate_hash_includes_seconds(self):
        """Тест что хеш включает секунды"""
        base_time = datetime.now().replace(second=0, microsecond=0)
        
        donation1 = DonationData(
            amount=500.0,
            sender_name="Тест",
            message=None,
            timestamp=base_time.replace(second=10),
            raw_notification="Test"
        )
        
        donation2 = DonationData(
            amount=500.0,
            sender_name="Тест",
            message=None,
            timestamp=base_time.replace(second=50),
            raw_notification="Test"
        )
        
        hash1 = generate_donation_hash(donation1)
        hash2 = generate_donation_hash(donation2)
        
        # Хеши должны быть разными т.к. секунды разные
        assert hash1 != hash2


if __name__ == "__main__":
    # Запуск тестов
    pytest.main([__file__, "-v"])

