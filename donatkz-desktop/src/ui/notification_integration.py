"""
Интеграция Notification Listener с GUI

Обеспечивает связь между Windows Notification Listener
и Tkinter GUI через thread-safe callbacks.
"""
import logging
import threading
from typing import Optional, Callable

from notification.parser import KaspiNotificationParser
from notification.validator import DonationValidator
from utils.deduplication import DeduplicationManager
from notification import create_notification_listener
from config import Config

logger = logging.getLogger(__name__)


class NotificationIntegration:
    """
    Интеграция уведомлений с GUI
    
    Обрабатывает уведомления от Windows Notification Listener
    и передаёт их в GUI через thread-safe механизмы.
    """
    
    def __init__(self, gui_app):
        """
        Инициализация интеграции
        
        Args:
            gui_app: Экземпляр главного GUI приложения
        """
        self.gui_app = gui_app
        self.root = gui_app.root
        
        # Компоненты обработки
        self.parser = KaspiNotificationParser()
        self.validator = DonationValidator(
            min_amount=Config.MIN_DONATION_AMOUNT,
            max_amount=Config.MAX_DONATION_AMOUNT
        )
        self.dedup_manager = DeduplicationManager(
            window_seconds=Config.DEDUPLICATION_WINDOW_SECONDS
        )
        
        # Слушатель уведомлений
        self.listener = None
        self.is_running = False
        
        # Статистика
        self.total_notifications = 0
        self.parsed_donations = 0
        self.validated_donations = 0
        self.sent_to_api = 0
        
        logger.info("NotificationIntegration инициализирована")
    
    def start_listener(self, use_mock: bool = True):
        """
        Запуск слушателя уведомлений
        
        Args:
            use_mock: Использовать mock слушатель (для разработки)
        """
        if self.is_running:
            logger.warning("Слушатель уже запущен")
            return
        
        try:
            # Создаём слушатель
            self.listener = create_notification_listener(
                callback=self._on_notification_received,
                use_mock=use_mock,
                filter_sources=["kaspi", "kz.kaspi.mobile", "kaspi.kz"],
                mock_interval=5.0,
                root_window=self.root
            )
            
            # Запускаем слушатель
            if self.listener.start():
                self.is_running = True
                
                # Обновляем GUI
                mode_name = "Mock" if use_mock else "Windows (Real)"
                self._update_gui_status(f"Активен ({mode_name})", "green")
                self._add_log("INFO", f"🔍 Слушатель уведомлений запущен ({mode_name})")
                
                # Обновляем статус Phone Link
                if use_mock:
                    self.gui_app.update_phone_link_status("Тестовый режим")
                else:
                    self.gui_app.update_phone_link_status("Работает")
                
                # Если это Real режим, добавляем предупреждение
                if not use_mock:
                    self._add_log("WARNING", "⚠️ Убедитесь что Phone Link активен и подключен к телефону!")
                    logger.warning("⚠️ Real режим включен - Phone Link должен быть активен")
                
                logger.info("✅ Notification Listener запущен")
            else:
                self._add_log("ERROR", "❌ Не удалось запустить слушатель")
                self.gui_app.update_phone_link_status("Ошибка подключения")
                logger.error("Не удалось запустить слушатель")
                
        except Exception as e:
            logger.exception(f"Ошибка запуска слушателя: {e}")
            self._add_log("ERROR", f"❌ Ошибка запуска: {e}")
    
    def stop_listener(self):
        """Остановка слушателя уведомлений"""
        if not self.is_running:
            return
        
        try:
            if self.listener:
                self.listener.stop()
            
            self.is_running = False
            
            # Обновляем GUI
            self._update_gui_status("Остановлен", "red")
            self._add_log("INFO", "⏹️ Слушатель уведомлений остановлен")
            
            # НЕ обновляем статус Phone Link - он остается в том же состоянии
            # (Phone Link не перестал работать просто потому что мы отключили слушатель!)
            
            logger.info("✅ Notification Listener остановлен")
            
        except Exception as e:
            logger.exception(f"Ошибка остановки слушателя: {e}")
            self._add_log("ERROR", f"❌ Ошибка остановки: {e}")
    
    def _on_notification_received(self, notification_text: str):
        """
        Обработка полученного уведомления
        
        Этот метод вызывается из потока слушателя.
        ВСЕ обновления GUI должны происходить через root.after()!
        
        Args:
            notification_text: Текст уведомления
        """
        try:
            self.total_notifications += 1
            
            # Логируем получение уведомления
            self._add_log("INFO", f"📱 Получено уведомление: {notification_text[:50]}...")
            
            # Парсинг уведомления
            donation = self.parser.parse(notification_text)
            
            if not donation:
                self._add_log("WARNING", "⚠️ Не удалось распарсить уведомление")
                return
            
            self.parsed_donations += 1
            self._add_log("INFO", f"✅ Распарсено: {donation.amount}₸ от {donation.sender_name}")
            
            # Валидация
            is_valid, error_message = self.validator.validate(donation)
            
            if not is_valid:
                self._add_log("WARNING", f"❌ Валидация не пройдена: {error_message}")
                return
            
            self.validated_donations += 1
            self._add_log("INFO", "✅ Валидация пройдена")
            
            # Дедупликация
            if self.dedup_manager.is_duplicate(donation):
                self._add_log("WARNING", f"⚠️ Обнаружен дубликат доната: {donation.amount}₸")
                return
            
            self._add_log("INFO", "✅ Дедупликация пройдена")
            
            # Добавление в GUI (через after() для thread safety)
            self.root.after(0, lambda: self._add_donation_to_gui(donation))
            
        except Exception as e:
            logger.exception(f"Ошибка обработки уведомления: {e}")
            self._add_log("ERROR", f"❌ Ошибка обработки: {e}")
    
    def _add_donation_to_gui(self, donation):
        """
        Добавление доната в GUI
        
        Вызывается в главном потоке через root.after()
        
        Args:
            donation: Объект DonationData
        """
        try:
            # Добавляем в Dashboard
            self.gui_app.add_donation_to_dashboard(donation.to_dict())
            
            # Обновляем статус бар
            self.gui_app.update_statusbar(
                f"Последний донат: {donation.amount}₸ от {donation.sender_name}"
            )
            
            # Обновляем счётчик
            self.gui_app.update_donation_counter(
                self.gui_app.dashboard_tab.get_donations_count()
            )
            
            # Логируем успех
            self._add_log("INFO", f"✅ Донат добавлен в Dashboard: {donation.amount}₸")
            
            # TODO: Отправка на API (Этап 5)
            self._simulate_api_send(donation)
            
        except Exception as e:
            logger.exception(f"Ошибка добавления доната в GUI: {e}")
            self._add_log("ERROR", f"❌ Ошибка GUI: {e}")
    
    def _simulate_api_send(self, donation):
        """
        Симуляция отправки на API
        
        В Этапе 5 будет заменено на реальную отправку
        
        Args:
            donation: Объект DonationData
        """
        try:
            # Имитируем отправку в отдельном потоке
            def send_to_api():
                import time
                time.sleep(0.5)  # Имитация задержки сети
                
                # Вызываем callback в главном потоке
                self.root.after(0, lambda: self._on_api_success(donation))
            
            threading.Thread(target=send_to_api, daemon=True).start()
            
        except Exception as e:
            logger.exception(f"Ошибка симуляции API: {e}")
            self._add_log("ERROR", f"❌ Ошибка API: {e}")
    
    def _on_api_success(self, donation):
        """
        Обработка успешной отправки на API
        
        Args:
            donation: Объект DonationData
        """
        self.sent_to_api += 1
        self._add_log("INFO", f"📤 Донат отправлен на сервер: {donation.amount}₸")
    
    def _update_gui_status(self, status: str, color: str):
        """
        Обновление статуса в GUI
        
        Args:
            status: Текст статуса
            color: Цвет индикатора
        """
        # Вызываем через after() для thread safety
        self.root.after(0, lambda: self.gui_app.update_status(status, color))
    
    def _add_log(self, level: str, message: str):
        """
        Добавление лога в GUI
        
        Args:
            level: Уровень лога
            message: Сообщение
        """
        # Вызываем через after() для thread safety
        self.root.after(0, lambda: self.gui_app.add_log_message(level, message))
    
    def get_stats(self) -> dict:
        """
        Получить статистику интеграции
        
        Returns:
            dict: Статистика
        """
        listener_stats = self.listener.get_stats() if self.listener else {}
        
        return {
            "is_running": self.is_running,
            "total_notifications": self.total_notifications,
            "parsed_donations": self.parsed_donations,
            "validated_donations": self.validated_donations,
            "sent_to_api": self.sent_to_api,
            "listener_stats": listener_stats
        }
    
    def restart_listener(self, use_mock: bool = True):
        """
        Перезапуск слушателя
        
        Args:
            use_mock: Использовать mock слушатель
        """
        logger.info("Перезапуск слушателя уведомлений...")
        
        # Останавливаем текущий
        self.stop_listener()
        
        # Небольшая задержка
        import time
        time.sleep(1.0)
        
        # Запускаем заново
        self.start_listener(use_mock)
        
        self._add_log("INFO", "🔄 Слушатель перезапущен")
