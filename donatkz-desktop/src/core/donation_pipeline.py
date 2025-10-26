"""
Donation Processing Pipeline

Полный pipeline обработки донатов:
1. Получение уведомления
2. Парсинг через KaspiNotificationParser
3. Валидация через DonationValidator
4. Дедупликация через базу данных
5. Отправка на API
6. Обновление GUI
"""
import asyncio
import logging
from typing import Callable, Optional, Dict, Any, List
from datetime import datetime
import threading
import time
from pathlib import Path

from notification.parser import KaspiNotificationParser
from notification.validator import DonationValidator
from notification.models import DonationData
from utils.deduplication import DeduplicationManager
from database.db_manager import DatabaseManager
from api import create_api_client
from config import Config

logger = logging.getLogger(__name__)


class DonationPipeline:
    """
    Pipeline обработки донатов
    
    Обрабатывает уведомления от Notification Listener
    и передаёт их через полный цикл обработки.
    """
    
    def __init__(
        self,
        gui_callback: Optional[Callable[[DonationData], None]] = None,
        use_mock_api: bool = True
    ):
        """
        Инициализация pipeline
        
        Args:
            gui_callback: Callback для обновления GUI
            use_mock_api: Использовать Mock API
        """
        self.gui_callback = gui_callback
        self.use_mock_api = use_mock_api
        
        # Компоненты pipeline
        self.parser = KaspiNotificationParser()
        self.validator = DonationValidator(
            min_amount=Config.MIN_DONATION_AMOUNT,
            max_amount=Config.MAX_DONATION_AMOUNT
        )
        self.dedup_manager = DeduplicationManager(
            window_seconds=Config.DEDUPLICATION_WINDOW_SECONDS
        )
        
        # Инициализируем DatabaseManager
        self.db_manager = DatabaseManager(Config.DONATIONS_DB_FILE)
        
        # API клиент
        self.api_client = None
        self.api_token = None
        
        # ВАЖНО: Создаём один persistent event loop для всех асинхронных операций
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        
        # Статистика
        self.stats = {
            "total_notifications": 0,
            "parsed_successfully": 0,
            "validation_passed": 0,
            "deduplication_passed": 0,
            "sent_to_api": 0,
            "api_errors": 0,
            "gui_updates": 0,
            "db_duplicates": 0,
            "start_time": datetime.now()
        }
        
        # Очередь для обработки
        self.processing_queue = []
        self.is_processing = False
        self.processing_thread = None
        
        logger.info("DonationPipeline инициализирован с DatabaseManager")
        logger.info(f"Mock API: {use_mock_api}")
    
    async def initialize_api(self, email: str = None, password: str = None):
        """
        Инициализация API клиента
        
        Args:
            email: Email для авторизации (опционально)
            password: Пароль для авторизации (опционально)
        """
        try:
            # Создаём API клиент
            self.api_client = create_api_client(use_mock=self.use_mock_api)
            
            if email and password:
                # Авторизация
                login_result = await self.api_client.login(email, password)
                if login_result.get("success"):
                    self.api_token = login_result.get("access_token")
                    logger.info("✅ API авторизация успешна")
                else:
                    logger.warning("⚠️ API авторизация не удалась")
            else:
                logger.info("ℹ️ API без авторизации (Mock режим)")
                
        except Exception as e:
            logger.exception(f"Ошибка инициализации API: {e}")
            self.api_client = None
    
    def process_notification(self, notification_text: str):
        """
        Обработка уведомления
        
        Args:
            notification_text: Текст уведомления
        """
        try:
            self.stats["total_notifications"] += 1
            logger.info(f"📱 Обработка уведомления: {notification_text[:50]}...")
            
            # Добавляем в очередь обработки
            self.processing_queue.append(notification_text)
            
            # Запускаем обработку если не запущена
            if not self.is_processing:
                self._start_processing()
                
        except Exception as e:
            logger.exception(f"Ошибка добавления в очередь: {e}")
    
    def _start_processing(self):
        """Запуск обработки очереди"""
        if self.is_processing:
            return
        
        self.is_processing = True
        self.processing_thread = threading.Thread(
            target=self._process_queue,
            daemon=True,
            name="DonationPipeline"
        )
        self.processing_thread.start()
        logger.debug("Обработка очереди запущена")
    
    def _process_queue(self):
        """Обработка очереди уведомлений"""
        while self.is_processing and self.processing_queue:
            try:
                # Берём первое уведомление из очереди
                notification_text = self.processing_queue.pop(0)
                
                # Обрабатываем синхронно
                self.loop.run_until_complete(self._process_single_notification(notification_text))
                
                # Небольшая задержка между обработкой
                time.sleep(0.1)
                
            except Exception as e:
                logger.exception(f"Ошибка обработки очереди: {e}")
                time.sleep(1.0)  # Задержка при ошибке
        
        self.is_processing = False
        logger.debug("Обработка очереди завершена")
    
    async def _process_single_notification(self, notification_text: str):
        """
        Обработка одного уведомления
        
        Args:
            notification_text: Текст уведомления
        """
        try:
            # Шаг 1: Парсинг
            donation = self.parser.parse(notification_text)
            
            if not donation:
                logger.warning("⚠️ Не удалось распарсить уведомление")
                return
            
            self.stats["parsed_successfully"] += 1
            logger.info(f"✅ Распарсено: {donation.amount}₸ от {donation.sender_name}")
            
            # Шаг 2: Валидация
            is_valid, error_message = self.validator.validate(donation)
            
            if not is_valid:
                logger.warning(f"❌ Валидация не пройдена: {error_message}")
                return
            
            self.stats["validation_passed"] += 1
            logger.info("✅ Валидация пройдена")
            
            # Шаг 3: Дедупликация (в памяти)
            if self.dedup_manager.is_duplicate(donation):
                logger.warning(f"⚠️ Обнаружен дубликат доната в памяти: {donation.amount}₸")
                return
            
            # Шаг 4: Дедупликация (в БД) - НОВОЕ!
            # Форматируем дату в ISO 8601
            donation_date = DatabaseManager.format_datetime_iso8601(donation.timestamp)
            
            # Преобразуем сумму в целое число для хранения в БД
            donation_amount = int(donation.amount)
            
            # Проверяем наличие в БД
            if self.db_manager.check_donation_exists(
                sender=donation.sender_name,
                amount=donation_amount,
                message=donation.message,
                date=donation_date
            ):
                logger.warning(f"⚠️ Обнаружен дубликат в БД: {donation.amount}₸")
                self.stats["db_duplicates"] += 1
                return
            
            self.stats["deduplication_passed"] += 1
            logger.info("✅ Дедупликация пройдена (БД)")
            
            # Шаг 5: Отправка на API
            api_success = await self._send_to_api(donation)
            
            if api_success:
                self.stats["sent_to_api"] += 1
                logger.info("✅ Донат отправлен на API")
            else:
                self.stats["api_errors"] += 1
                logger.error("❌ Ошибка отправки на API")
            
            # Шаг 6: Сохранение в БД (НОВОЕ!)
            # Сохраняем независимо от результата API (для локальной статистики)
            self.db_manager.save_donation(
                sender=donation.sender_name,
                amount=donation_amount,
                message=donation.message,
                date=donation_date
            )
            
            # Шаг 7: Обновление GUI
            if self.gui_callback:
                self.gui_callback(donation)
                self.stats["gui_updates"] += 1
                logger.info("✅ GUI обновлён")
            
        except Exception as e:
            logger.exception(f"Ошибка обработки уведомления: {e}")
    
    async def _send_to_api(self, donation: DonationData) -> bool:
        """
        Отправка доната на API
        
        Args:
            donation: Объект доната
            
        Returns:
            bool: True если отправка успешна
        """
        try:
            if not self.api_client:
                logger.warning("API клиент не инициализирован")
                return False
            
            # Подготавливаем данные для API
            api_data = {
                "amount": donation.amount,
                "senderName": donation.sender_name,
                "message": donation.message or "",
                "timestamp": donation.timestamp.isoformat(),
                "rawText": donation.raw_notification
            }
            
            # Отправляем
            result = await self.api_client.send_donation(api_data, self.api_token)
            
            return result.get("success", False)
            
        except Exception as e:
            logger.exception(f"Ошибка отправки на API: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Получить статистику pipeline
        
        Returns:
            dict: Статистика обработки
        """
        uptime = datetime.now() - self.stats["start_time"]
        
        return {
            **self.stats,
            "uptime_seconds": uptime.total_seconds(),
            "queue_size": len(self.processing_queue),
            "is_processing": self.is_processing,
            "api_connected": self.api_client is not None,
            "api_token_valid": self.api_token is not None
        }
    
    def get_processing_rate(self) -> float:
        """
        Получить скорость обработки (донатов в минуту)
        
        Returns:
            float: Скорость обработки
        """
        uptime_minutes = self.get_stats()["uptime_seconds"] / 60
        if uptime_minutes == 0:
            return 0.0
        
        return self.stats["sent_to_api"] / uptime_minutes
    
    def clear_stats(self):
        """Очистить статистику"""
        self.stats = {
            "total_notifications": 0,
            "parsed_successfully": 0,
            "validation_passed": 0,
            "deduplication_passed": 0,
            "sent_to_api": 0,
            "api_errors": 0,
            "gui_updates": 0,
            "db_duplicates": 0,
            "start_time": datetime.now()
        }
        logger.info("Статистика очищена")
    
    def stop_processing(self):
        """Остановка обработки"""
        self.is_processing = False
        self.processing_queue.clear()
        
        if self.processing_thread and self.processing_thread.is_alive():
            self.processing_thread.join(timeout=2.0)
        
        logger.info("Обработка pipeline остановлена")
    
    async def close(self):
        """Закрытие pipeline"""
        self.stop_processing()
        
        if self.db_manager:
            self.db_manager.close()
        
        if self.api_client:
            await self.api_client.close()
        
        # Закрываем event loop
        if self.loop and not self.loop.is_closed():
            self.loop.close()
            logger.info("Event loop закрыт")
        
        logger.info("DonationPipeline закрыт")
    
    def get_db_manager(self) -> DatabaseManager:
        """
        Получить DatabaseManager для доступа к статистике
        
        Returns:
            DatabaseManager: Менеджер БД
        """
        return self.db_manager

