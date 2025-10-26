"""
Pipeline Manager

Управляет полным pipeline обработки донатов и интегрирует
все компоненты приложения.
"""
import logging
import asyncio
from typing import Optional, Callable, Dict, Any
from datetime import datetime

from .donation_pipeline import DonationPipeline
from notification import create_notification_listener
from config import Config

logger = logging.getLogger(__name__)


class PipelineManager:
    """
    Менеджер полного pipeline
    
    Управляет:
    - Notification Listener
    - Donation Pipeline
    - GUI интеграцией
    - Статистикой
    """
    
    def __init__(
        self,
        gui_app,
        use_mock_listener: bool = True,
        use_mock_api: bool = True
    ):
        """
        Инициализация менеджера
        
        Args:
            gui_app: Экземпляр GUI приложения
            use_mock_listener: Использовать mock слушатель
            use_mock_api: Использовать mock API
        """
        self.gui_app = gui_app
        self.use_mock_listener = use_mock_listener
        self.use_mock_api = use_mock_api
        
        # Компоненты
        self.notification_listener = None
        self.donation_pipeline = None
        
        # Статус
        self.is_running = False
        self.start_time = None
        
        # Статистика
        self.stats = {
            "listener_started": False,
            "pipeline_started": False,
            "api_initialized": False,
            "total_processed": 0,
            "last_activity": None
        }
        
        logger.info("PipelineManager инициализирован")
        logger.info(f"Mock Listener: {use_mock_listener}, Mock API: {use_mock_api}")
    
    async def initialize(self, email: str = None, password: str = None):
        """
        Инициализация всех компонентов
        
        Args:
            email: Email для API авторизации
            password: Пароль для API авторизации
        """
        try:
            logger.info("🚀 Инициализация Pipeline Manager...")
            
            # 1. Создаём Donation Pipeline
            self.donation_pipeline = DonationPipeline(
                gui_callback=self._on_donation_processed,
                use_mock_api=self.use_mock_api
            )
            
            # 2. Инициализируем API
            await self.donation_pipeline.initialize_api(email, password)
            self.stats["api_initialized"] = True
            
            # 3. Создаём Notification Listener
            self.notification_listener = create_notification_listener(
                callback=self._on_notification_received,
                use_mock=self.use_mock_listener,
                filter_sources=["kaspi", "kz.kaspi.mobile", "kaspi.kz"]
            )
            
            logger.info("✅ Pipeline Manager инициализирован")
            
        except Exception as e:
            logger.exception(f"Ошибка инициализации Pipeline Manager: {e}")
            raise
    
    def start(self) -> bool:
        """
        Запуск полного pipeline
        
        Returns:
            bool: True если запуск успешен
        """
        try:
            if self.is_running:
                logger.warning("Pipeline уже запущен")
                return True
            
            logger.info("🚀 Запуск полного pipeline...")
            
            # 1. Запускаем слушатель
            if self.notification_listener.start():
                self.stats["listener_started"] = True
                logger.info("✅ Notification Listener запущен")
            else:
                logger.error("❌ Не удалось запустить слушатель")
                return False
            
            # 2. Pipeline уже готов к работе
            self.stats["pipeline_started"] = True
            self.is_running = True
            self.start_time = datetime.now()
            
            # 3. Обновляем GUI
            self._update_gui_status("Активен", "green")
            self._add_log("INFO", "🚀 Полный pipeline запущен")
            self._add_log("INFO", f"📊 Компоненты: Listener ✅, Pipeline ✅, API ✅")
            
            logger.info("✅ Полный pipeline запущен")
            return True
            
        except Exception as e:
            logger.exception(f"Ошибка запуска pipeline: {e}")
            self._add_log("ERROR", f"❌ Ошибка запуска: {e}")
            return False
    
    def stop(self):
        """Остановка полного pipeline"""
        try:
            if not self.is_running:
                return
            
            logger.info("⏹️ Остановка полного pipeline...")
            
            # 1. Останавливаем слушатель
            if self.notification_listener:
                self.notification_listener.stop()
                self.stats["listener_started"] = False
                logger.info("✅ Notification Listener остановлен")
            
            # 2. Останавливаем pipeline
            if self.donation_pipeline:
                self.donation_pipeline.stop_processing()
                self.stats["pipeline_started"] = False
                logger.info("✅ Donation Pipeline остановлен")
            
            self.is_running = False
            
            # 3. Обновляем GUI
            self._update_gui_status("Остановлен", "red")
            self._add_log("INFO", "⏹️ Полный pipeline остановлен")
            
            logger.info("✅ Полный pipeline остановлен")
            
        except Exception as e:
            logger.exception(f"Ошибка остановки pipeline: {e}")
            self._add_log("ERROR", f"❌ Ошибка остановки: {e}")
    
    def _on_notification_received(self, notification_text: str):
        """
        Обработка полученного уведомления
        
        Args:
            notification_text: Текст уведомления
        """
        try:
            self.stats["last_activity"] = datetime.now()
            
            # Передаём в pipeline
            if self.donation_pipeline:
                self.donation_pipeline.process_notification(notification_text)
            
            self._add_log("INFO", f"📱 Уведомление получено: {notification_text[:50]}...")
            
        except Exception as e:
            logger.exception(f"Ошибка обработки уведомления: {e}")
            self._add_log("ERROR", f"❌ Ошибка обработки: {e}")
    
    def _on_donation_processed(self, donation):
        """
        Обработка обработанного доната
        
        Args:
            donation: Объект DonationData
        """
        try:
            self.stats["total_processed"] += 1
            self.stats["last_activity"] = datetime.now()
            
            # Обновляем GUI
            self.gui_app.add_donation_to_dashboard(donation.to_dict())
            self.gui_app.update_statusbar(
                f"Последний донат: {donation.amount}₸ от {donation.sender_name}"
            )
            self.gui_app.update_donation_counter(
                self.gui_app.dashboard_tab.get_donations_count()
            )
            
            self._add_log("INFO", f"✅ Донат обработан: {donation.amount}₸ от {donation.sender_name}")
            
        except Exception as e:
            logger.exception(f"Ошибка обновления GUI: {e}")
            self._add_log("ERROR", f"❌ Ошибка GUI: {e}")
    
    def get_comprehensive_stats(self) -> Dict[str, Any]:
        """
        Получить комплексную статистику
        
        Returns:
            dict: Полная статистика системы
        """
        pipeline_stats = self.donation_pipeline.get_stats() if self.donation_pipeline else {}
        listener_stats = self.notification_listener.get_stats() if self.notification_listener else {}
        
        uptime = datetime.now() - self.start_time if self.start_time else None
        
        return {
            "manager": {
                "is_running": self.is_running,
                "uptime_seconds": uptime.total_seconds() if uptime else 0,
                "start_time": self.start_time,
                "last_activity": self.stats["last_activity"],
                "total_processed": self.stats["total_processed"]
            },
            "listener": listener_stats,
            "pipeline": pipeline_stats,
            "components": {
                "listener_started": self.stats["listener_started"],
                "pipeline_started": self.stats["pipeline_started"],
                "api_initialized": self.stats["api_initialized"]
            }
        }
    
    def restart(self):
        """Перезапуск pipeline"""
        logger.info("🔄 Перезапуск pipeline...")
        
        # Останавливаем
        self.stop()
        
        # Небольшая задержка
        import time
        time.sleep(1.0)
        
        # Запускаем заново
        self.start()
        
        self._add_log("INFO", "🔄 Pipeline перезапущен")
    
    def _update_gui_status(self, status: str, color: str):
        """Обновление статуса в GUI"""
        self.gui_app.update_status(status, color)
    
    def _add_log(self, level: str, message: str):
        """Добавление лога в GUI"""
        self.gui_app.add_log_message(level, message)
    
    async def close(self):
        """Закрытие менеджера"""
        self.stop()
        
        if self.donation_pipeline:
            await self.donation_pipeline.close()
        
        logger.info("PipelineManager закрыт")



