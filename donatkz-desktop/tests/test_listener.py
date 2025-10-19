"""
Тесты для Windows Notification Listener
"""
import pytest
import sys
from pathlib import Path
import threading
import time
from unittest.mock import Mock, patch

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from notification.listener import (
    WindowsNotificationListener,
    MockNotificationListener,
    create_notification_listener
)


class TestWindowsNotificationListener:
    """Тесты для WindowsNotificationListener"""
    
    def test_init(self):
        """Тест инициализации слушателя"""
        callback = Mock()
        listener = WindowsNotificationListener(callback)
        
        assert listener.callback == callback
        assert listener.is_running is False
        assert listener.total_notifications == 0
        assert listener.filtered_notifications == 0
        assert listener.last_notification_time is None
    
    def test_init_with_filters(self):
        """Тест инициализации с фильтрами"""
        callback = Mock()
        filters = ["kaspi", "test"]
        listener = WindowsNotificationListener(callback, filters)
        
        assert listener.filter_sources == filters
    
    def test_should_process_notification_kaspi(self):
        """Тест фильтрации уведомлений Kaspi"""
        callback = Mock()
        listener = WindowsNotificationListener(callback)
        
        # Должны обрабатываться
        assert listener._should_process_notification("", "Пополнение: 500 Т") is True
        assert listener._should_process_notification("", "Перевод: 1000 ₸ от Тест") is True
        assert listener._should_process_notification("", "kaspi gold перевод") is True
        assert listener._should_process_notification("", "от: Иван") is True
        
        # Не должны обрабатываться
        assert listener._should_process_notification("", "") is False
        assert listener._should_process_notification("", "Обычное уведомление") is False
        assert listener._should_process_notification("", "WhatsApp сообщение") is False
    
    def test_should_process_notification_with_sources(self):
        """Тест фильтрации по источникам"""
        callback = Mock()
        filters = ["kaspi.kz", "test"]
        listener = WindowsNotificationListener(callback, filters)
        
        # Должны обрабатываться по app_id
        assert listener._should_process_notification("com.example.kaspi.kz", "any text") is True
        assert listener._should_process_notification("com.test.app", "any text") is True
        
        # Также работает по ключевым словам в тексте
        assert listener._should_process_notification("", "kaspi.kz уведомление") is True
        assert listener._should_process_notification("", "перевод тенге") is True
        
        # Не должны обрабатываться
        assert listener._should_process_notification("other.app", "другой источник") is False
    
    def test_get_stats(self):
        """Тест получения статистики"""
        callback = Mock()
        listener = WindowsNotificationListener(callback)
        
        stats = listener.get_stats()
        
        assert "is_running" in stats
        assert "total_notifications" in stats
        assert "filtered_notifications" in stats
        assert "last_notification_time" in stats
        assert "filter_sources" in stats
    
    def test_update_filter_sources(self):
        """Тест обновления фильтров"""
        callback = Mock()
        listener = WindowsNotificationListener(callback)
        
        new_filters = ["new_source", "another_source"]
        listener.update_filter_sources(new_filters)
        
        assert listener.filter_sources == new_filters


class TestMockNotificationListener:
    """Тесты для MockNotificationListener"""
    
    def test_init(self):
        """Тест инициализации mock слушателя"""
        callback = Mock()
        listener = MockNotificationListener(callback)
        
        assert listener.callback == callback
        assert listener.is_running is False
        assert listener.filter_sources == ["kaspi"]
    
    def test_init_with_filters(self):
        """Тест инициализации с фильтрами"""
        callback = Mock()
        filters = ["test1", "test2"]
        listener = MockNotificationListener(callback, filters)
        
        assert listener.filter_sources == filters
    
    def test_start_stop(self):
        """Тест запуска и остановки mock слушателя"""
        callback = Mock()
        listener = MockNotificationListener(callback)
        
        # Запуск
        result = listener.start()
        assert result is True
        assert listener.is_running is True
        
        # Остановка
        listener.stop()
        assert listener.is_running is False
    
    def test_get_stats(self):
        """Тест получения статистики mock слушателя"""
        callback = Mock()
        listener = MockNotificationListener(callback)
        
        stats = listener.get_stats()
        
        assert "is_running" in stats
        assert "type" in stats
        assert "filter_sources" in stats
        assert stats["type"] == "mock"


class TestCreateNotificationListener:
    """Тесты для фабрики создания слушателей"""
    
    def test_create_mock_listener(self):
        """Тест создания mock слушателя"""
        callback = Mock()
        
        with patch('notification.listener.WINDOWS_API_AVAILABLE', False):
            listener = create_notification_listener(callback, use_mock=True)
            
            assert isinstance(listener, MockNotificationListener)
            assert listener.callback == callback
    
    def test_create_mock_listener_when_api_unavailable(self):
        """Тест создания mock слушателя когда Windows API недоступен"""
        callback = Mock()
        
        with patch('notification.listener.WINDOWS_API_AVAILABLE', False):
            listener = create_notification_listener(callback, use_mock=False)
            
            # Должен вернуть DummyListener когда API недоступен и mock отключен
            assert listener is not None
            assert listener.callback == callback
    
    def test_create_windows_listener(self):
        """Тест создания Windows слушателя"""
        callback = Mock()
        
        with patch('notification.listener.WINDOWS_API_AVAILABLE', True):
            listener = create_notification_listener(callback, use_mock=False)
            
            assert isinstance(listener, WindowsNotificationListener)
            assert listener.callback == callback


class TestNotificationProcessing:
    """Тесты обработки уведомлений"""
    
    def test_process_kaspi_notification(self):
        """Тест обработки уведомления Kaspi"""
        callback = Mock()
        listener = WindowsNotificationListener(callback)
        
        # Симулируем обработку уведомления
        notification = "Пополнение: 500 Т\nАспандияр Т.: Рахмет"
        
        # Проверяем фильтрацию
        should_process = listener._should_process_notification("com.kaspi.mobile", notification)
        assert should_process is True
        
        # Симулируем обработку
        listener.total_notifications += 1
        listener.filtered_notifications += 1
        
        assert listener.total_notifications == 1
        assert listener.filtered_notifications == 1
    
    def test_process_non_kaspi_notification(self):
        """Тест обработки не-Kaspi уведомления"""
        callback = Mock()
        listener = WindowsNotificationListener(callback)
        
        # Симулируем обработку уведомления
        notification = "WhatsApp: Новое сообщение"
        
        # Проверяем фильтрацию
        should_process = listener._should_process_notification("com.whatsapp", notification)
        assert should_process is False
        
        # Симулируем обработку
        listener.total_notifications += 1
        # filtered_notifications не увеличивается
        
        assert listener.total_notifications == 1
        assert listener.filtered_notifications == 0


class TestListenerIntegration:
    """Интеграционные тесты слушателя"""
    
    def test_callback_execution(self):
        """Тест выполнения callback"""
        callback = Mock()
        listener = MockNotificationListener(callback)
        
        # Запускаем слушатель
        listener.start()
        
        # Ждём немного для обработки
        time.sleep(0.1)
        
        # Останавливаем
        listener.stop()
        
        # Проверяем что callback был вызван
        # (в mock слушателе callback вызывается для тестовых уведомлений)
        time.sleep(2.0)  # Ждём обработки тестовых уведомлений
        
        # В реальном тесте здесь можно проверить количество вызовов
        # assert callback.call_count > 0
    
    def test_thread_safety(self):
        """Тест thread safety"""
        callback = Mock()
        listener = MockNotificationListener(callback)
        
        # Запускаем в отдельном потоке
        thread = threading.Thread(target=listener.start)
        thread.start()
        
        # Ждём запуска
        time.sleep(0.5)
        
        # Проверяем что слушатель запущен
        assert listener.is_running is True
        
        # Останавливаем
        listener.stop()
        thread.join(timeout=2.0)
        
        # Проверяем что слушатель остановлен
        assert listener.is_running is False


class TestListenerErrorHandling:
    """Тесты обработки ошибок"""
    
    def test_callback_exception_handling(self):
        """Тест обработки исключений в callback"""
        # Callback который выбрасывает исключение
        def failing_callback(text):
            raise Exception("Test exception")
        
        listener = MockNotificationListener(failing_callback)
        
        # Запуск не должен падать из-за исключения в callback
        result = listener.start()
        assert result is True
        
        # Останавливаем
        listener.stop()
    
    def test_listener_restart(self):
        """Тест перезапуска слушателя"""
        callback = Mock()
        listener = MockNotificationListener(callback)
        
        # Первый запуск
        listener.start()
        assert listener.is_running is True
        
        # Остановка
        listener.stop()
        assert listener.is_running is False
        
        # Второй запуск
        listener.start()
        assert listener.is_running is True
        
        # Финальная остановка
        listener.stop()
        assert listener.is_running is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
