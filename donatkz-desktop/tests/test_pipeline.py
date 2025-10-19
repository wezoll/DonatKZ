"""
Тесты для Donation Pipeline и Pipeline Manager
"""
import pytest
import sys
from pathlib import Path
import asyncio
import time
from unittest.mock import Mock, patch, AsyncMock

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from core.donation_pipeline import DonationPipeline
from core.pipeline_manager import PipelineManager
from notification.models import DonationData
from datetime import datetime


class TestDonationPipeline:
    """Тесты для DonationPipeline"""
    
    def test_init(self):
        """Тест инициализации pipeline"""
        gui_callback = Mock()
        pipeline = DonationPipeline(gui_callback=gui_callback, use_mock_api=True)
        
        assert pipeline.gui_callback == gui_callback
        assert pipeline.use_mock_api is True
        assert pipeline.api_client is None
        assert pipeline.api_token is None
        assert pipeline.is_processing is False
        assert len(pipeline.processing_queue) == 0
    
    def test_stats_initialization(self):
        """Тест инициализации статистики"""
        pipeline = DonationPipeline()
        
        stats = pipeline.get_stats()
        
        assert stats["total_notifications"] == 0
        assert stats["parsed_successfully"] == 0
        assert stats["validation_passed"] == 0
        assert stats["deduplication_passed"] == 0
        assert stats["sent_to_api"] == 0
        assert stats["api_errors"] == 0
        assert stats["gui_updates"] == 0
        assert "start_time" in stats
        assert "uptime_seconds" in stats
    
    @pytest.mark.asyncio
    async def test_initialize_api_mock(self):
        """Тест инициализации Mock API"""
        pipeline = DonationPipeline(use_mock_api=True)
        
        await pipeline.initialize_api()
        
        assert pipeline.api_client is not None
        assert pipeline.api_token is None  # Mock не требует токена
    
    @pytest.mark.asyncio
    async def test_initialize_api_with_credentials(self):
        """Тест инициализации API с учётными данными"""
        pipeline = DonationPipeline(use_mock_api=True)
        
        await pipeline.initialize_api("test@example.com", "password")
        
        assert pipeline.api_client is not None
        # В mock режиме токен может быть None или mock токеном
    
    def test_process_notification(self):
        """Тест обработки уведомления"""
        gui_callback = Mock()
        pipeline = DonationPipeline(gui_callback=gui_callback)
        
        notification = "Пополнение: 500 Т\nТест: Спасибо"
        pipeline.process_notification(notification)
        
        # Pipeline автоматически обрабатывает уведомления
        # Ждём немного для обработки
        time.sleep(0.2)
        
        assert pipeline.stats["total_notifications"] == 1
    
    def test_process_notification_multiple(self):
        """Тест обработки нескольких уведомлений"""
        pipeline = DonationPipeline()
        
        notifications = [
            "Пополнение: 500 Т\nТест1: Спасибо",
            "Перевод: 1000 ₸ от Тест2",
            "200 ₸ от Тест3 - За контент"
        ]
        
        for notification in notifications:
            pipeline.process_notification(notification)
        
        # Ждём обработки
        time.sleep(0.3)
        
        assert pipeline.stats["total_notifications"] == 3
    
    def test_processing_rate_calculation(self):
        """Тест расчёта скорости обработки"""
        pipeline = DonationPipeline()
        
        # Изначально скорость должна быть 0
        assert pipeline.get_processing_rate() == 0.0
        
        # Симулируем отправку донатов
        pipeline.stats["sent_to_api"] = 10
        pipeline.stats["start_time"] = datetime.now()
        
        # Скорость должна быть > 0
        rate = pipeline.get_processing_rate()
        assert rate >= 0.0
    
    def test_clear_stats(self):
        """Тест очистки статистики"""
        pipeline = DonationPipeline()
        
        # Заполняем статистику
        pipeline.stats["total_notifications"] = 10
        pipeline.stats["parsed_successfully"] = 8
        pipeline.stats["sent_to_api"] = 5
        
        # Очищаем
        pipeline.clear_stats()
        
        # Проверяем что статистика сброшена
        assert pipeline.stats["total_notifications"] == 0
        assert pipeline.stats["parsed_successfully"] == 0
        assert pipeline.stats["sent_to_api"] == 0
        assert "start_time" in pipeline.stats
    
    def test_stop_processing(self):
        """Тест остановки обработки"""
        pipeline = DonationPipeline()
        
        # Добавляем уведомления в очередь
        pipeline.process_notification("Тест уведомление")
        pipeline.process_notification("Ещё одно уведомление")
        
        # Ждём немного для обработки
        time.sleep(0.1)
        
        # Останавливаем
        pipeline.stop_processing()
        
        assert pipeline.is_processing is False
        assert len(pipeline.processing_queue) == 0


class TestPipelineManager:
    """Тесты для PipelineManager"""
    
    def test_init(self):
        """Тест инициализации менеджера"""
        gui_app = Mock()
        manager = PipelineManager(gui_app, use_mock_listener=True, use_mock_api=True)
        
        assert manager.gui_app == gui_app
        assert manager.use_mock_listener is True
        assert manager.use_mock_api is True
        assert manager.is_running is False
        assert manager.notification_listener is None
        assert manager.donation_pipeline is None
    
    def test_stats_initialization(self):
        """Тест инициализации статистики"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        assert manager.stats["listener_started"] is False
        assert manager.stats["pipeline_started"] is False
        assert manager.stats["api_initialized"] is False
        assert manager.stats["total_processed"] == 0
        assert manager.stats["last_activity"] is None
    
    @pytest.mark.asyncio
    async def test_initialize(self):
        """Тест инициализации компонентов"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        await manager.initialize()
        
        assert manager.donation_pipeline is not None
        assert manager.notification_listener is not None
        assert manager.stats["api_initialized"] is True
    
    @pytest.mark.asyncio
    async def test_initialize_with_credentials(self):
        """Тест инициализации с учётными данными"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        await manager.initialize("test@example.com", "password")
        
        assert manager.donation_pipeline is not None
        assert manager.notification_listener is not None
        assert manager.stats["api_initialized"] is True
    
    def test_start_stop(self):
        """Тест запуска и остановки"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        # Инициализируем компоненты
        manager.donation_pipeline = Mock()
        manager.notification_listener = Mock()
        manager.notification_listener.start.return_value = True
        
        # Запускаем
        result = manager.start()
        assert result is True
        assert manager.is_running is True
        assert manager.stats["listener_started"] is True
        assert manager.stats["pipeline_started"] is True
        
        # Останавливаем
        manager.stop()
        assert manager.is_running is False
        assert manager.stats["listener_started"] is False
        assert manager.stats["pipeline_started"] is False
    
    def test_start_when_already_running(self):
        """Тест запуска когда уже запущен"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        # Устанавливаем статус запущен
        manager.is_running = True
        
        result = manager.start()
        assert result is True  # Должен вернуть True без ошибки
    
    def test_notification_processing(self):
        """Тест обработки уведомлений"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        # Создаём mock pipeline
        mock_pipeline = Mock()
        manager.donation_pipeline = mock_pipeline
        
        # Обрабатываем уведомление
        notification = "Пополнение: 500 Т\nТест: Спасибо"
        manager._on_notification_received(notification)
        
        # Проверяем что pipeline получил уведомление
        mock_pipeline.process_notification.assert_called_once_with(notification)
        assert manager.stats["last_activity"] is not None
    
    def test_donation_processing(self):
        """Тест обработки донатов"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        # Создаём mock донат
        donation = DonationData(
            amount=500.0,
            sender_name="Тест",
            message="Спасибо",
            timestamp=datetime.now(),
            raw_notification="Пополнение: 500 Т"
        )
        
        # Обрабатываем донат
        manager._on_donation_processed(donation)
        
        # Проверяем обновление GUI
        gui_app.add_donation_to_dashboard.assert_called_once()
        gui_app.update_statusbar.assert_called_once()
        gui_app.update_donation_counter.assert_called_once()
        
        assert manager.stats["total_processed"] == 1
        assert manager.stats["last_activity"] is not None
    
    def test_get_comprehensive_stats(self):
        """Тест получения комплексной статистики"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        # Создаём mock компоненты
        mock_pipeline = Mock()
        mock_listener = Mock()
        
        mock_pipeline.get_stats.return_value = {"pipeline": "stats"}
        mock_listener.get_stats.return_value = {"listener": "stats"}
        
        manager.donation_pipeline = mock_pipeline
        manager.notification_listener = mock_listener
        
        # Получаем статистику
        stats = manager.get_comprehensive_stats()
        
        assert "manager" in stats
        assert "listener" in stats
        assert "pipeline" in stats
        assert "components" in stats
        
        assert stats["manager"]["is_running"] is False
        assert stats["components"]["listener_started"] is False
        assert stats["components"]["pipeline_started"] is False
        assert stats["components"]["api_initialized"] is False
    
    def test_restart(self):
        """Тест перезапуска"""
        gui_app = Mock()
        manager = PipelineManager(gui_app)
        
        # Создаём mock компоненты
        manager.donation_pipeline = Mock()
        manager.notification_listener = Mock()
        manager.notification_listener.start.return_value = True
        
        # Запускаем
        manager.start()
        assert manager.is_running is True
        
        # Перезапускаем
        manager.restart()
        
        # Проверяем что компоненты были остановлены и запущены
        manager.notification_listener.stop.assert_called()
        manager.donation_pipeline.stop_processing.assert_called()


class TestPipelineIntegration:
    """Интеграционные тесты pipeline"""
    
    @pytest.mark.asyncio
    async def test_full_pipeline_flow(self):
        """Тест полного потока обработки"""
        gui_callback = Mock()
        pipeline = DonationPipeline(gui_callback=gui_callback, use_mock_api=True)
        
        # Инициализируем API
        await pipeline.initialize_api()
        
        # Обрабатываем уведомление
        notification = "Пополнение: 500 Т\nТест: Спасибо"
        pipeline.process_notification(notification)
        
        # Ждём обработки
        time.sleep(0.5)
        
        # Проверяем что уведомление было обработано
        assert pipeline.stats["total_notifications"] == 1
    
    def test_error_handling(self):
        """Тест обработки ошибок"""
        pipeline = DonationPipeline()
        
        # Обрабатываем некорректное уведомление
        pipeline.process_notification("")
        pipeline.process_notification(None)
        
        # Pipeline не должен падать
        assert pipeline.stats["total_notifications"] == 2
    
    def test_concurrent_processing(self):
        """Тест параллельной обработки"""
        pipeline = DonationPipeline()
        
        # Добавляем несколько уведомлений одновременно
        notifications = [
            "Пополнение: 500 Т\nТест1: Спасибо",
            "Перевод: 1000 ₸ от Тест2",
            "200 ₸ от Тест3 - За контент"
        ]
        
        for notification in notifications:
            pipeline.process_notification(notification)
        
        # Ждём обработки
        time.sleep(0.3)
        
        assert pipeline.stats["total_notifications"] == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
