"""
Пример интеграции Parser + GUI

Демонстрирует как парсер уведомлений Kaspi интегрируется
с GUI приложением.
"""
import tkinter as tk
import sys
from pathlib import Path
from datetime import datetime
import logging

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from config import Config
from utils.logger import setup_logger
from ui.main_window import DonatKZApp
from notification.parser import KaspiNotificationParser
from notification.validator import DonationValidator
from utils.deduplication import DeduplicationManager

# Настройка логирования
logger = setup_logger(
    name="donatkz_integration",
    log_file=Config.LOG_FILE,
    log_level=logging.DEBUG
)


def simulate_kaspi_notifications(app: DonatKZApp):
    """
    Симуляция получения уведомлений от Kaspi
    
    В реальном приложении эти уведомления будут приходить
    через Windows Notification Listener (Этап 4).
    
    Args:
        app: Экземпляр приложения
    """
    # Инициализируем компоненты
    parser = KaspiNotificationParser()
    validator = DonationValidator(
        min_amount=Config.MIN_DONATION_AMOUNT,
        max_amount=Config.MAX_DONATION_AMOUNT
    )
    dedup_manager = DeduplicationManager(window_seconds=300)
    
    # Тестовые уведомления в разных форматах
    test_notifications = [
        "Пополнение: 500 Т\nАспандияр Т.: Рахмет за стрим! 🔥",
        "Перевод: 1,000 ₸ от Айгерим К.: Продолжай в том же духе!",
        "200 ₸ от Максим С. - За контент",
        "Kaspi Gold\nПеревод 5000₸\nОт: Нурлан А.\nСообщение: Отличный стрим!",
        "Вам перевели 300 тенге от Алия Б.: Спасибо за контент",
        # Дубликат (должен быть отклонён)
        "Пополнение: 500 Т\nАспандияр Т.: Рахмет за стрим! 🔥",
        # Невалидная сумма (слишком мало)
        "Перевод: 50 ₸ от Тест: Слишком мало",
        # Нормальный донат
        "Перевод: 2000 ₸ от Дамир К.: За качественный контент"
    ]
    
    def process_notification(index=0):
        """Обработка уведомления с полным pipeline"""
        if index >= len(test_notifications):
            app.add_log_message("INFO", "✅ Все тестовые уведомления обработаны")
            return
        
        notification_text = test_notifications[index]
        
        # Логируем получение уведомления
        app.add_log_message(
            "INFO",
            f"📱 Получено уведомление: {notification_text[:50]}..."
        )
        
        # Шаг 1: Парсинг
        donation = parser.parse(notification_text)
        
        if not donation:
            app.add_log_message(
                "WARNING",
                "⚠️ Не удалось распарсить уведомление"
            )
            app.root.after(2000, lambda: process_notification(index + 1))
            return
        
        app.add_log_message(
            "INFO",
            f"✅ Распарсено: {donation.amount}₸ от {donation.sender_name}"
        )
        
        # Шаг 2: Валидация
        is_valid, error_message = validator.validate(donation)
        
        if not is_valid:
            app.add_log_message(
                "WARNING",
                f"❌ Валидация не пройдена: {error_message}"
            )
            app.root.after(2000, lambda: process_notification(index + 1))
            return
        
        app.add_log_message("INFO", "✅ Валидация пройдена")
        
        # Шаг 3: Дедупликация
        if dedup_manager.is_duplicate(donation):
            app.add_log_message(
                "WARNING",
                f"⚠️ Обнаружен дубликат доната: {donation.amount}₸"
            )
            app.root.after(2000, lambda: process_notification(index + 1))
            return
        
        app.add_log_message("INFO", "✅ Дедупликация пройдена")
        
        # Шаг 4: Добавление в GUI
        app.add_donation_to_dashboard(donation.to_dict())
        
        # Обновление статус бара
        app.update_statusbar(
            f"Последний донат: {donation.amount}₸ от {donation.sender_name}"
        )
        
        # Обновление счётчика
        app.update_donation_counter(
            app.dashboard_tab.get_donations_count()
        )
        
        app.add_log_message(
            "INFO",
            f"✅ Донат добавлен в Dashboard: {donation.amount}₸"
        )
        
        # Шаг 5: Отправка на Mock API (симуляция)
        app.add_log_message(
            "INFO",
            f"📤 Отправка доната на Mock API..."
        )
        
        # Имитация успешной отправки
        app.root.after(500, lambda: app.add_log_message(
            "INFO",
            f"✅ Донат успешно отправлен на сервер"
        ))
        
        # Планируем следующее уведомление через 3 секунды
        app.root.after(3000, lambda: process_notification(index + 1))
    
    # Начинаем через 2 секунды после запуска
    app.root.after(2000, lambda: process_notification(0))


def main():
    """Главная функция"""
    print("=" * 70)
    print("DonatKZ Desktop - Parser + GUI Integration Demo")
    print("=" * 70)
    print("\nЭта демонстрация показывает полный pipeline обработки доната:")
    print("  1. 📱 Получение уведомления (симуляция)")
    print("  2. 🔍 Парсинг текста уведомления")
    print("  3. ✅ Валидация данных")
    print("  4. 🔄 Дедупликация")
    print("  5. 🖥️  Добавление в GUI")
    print("  6. 📤 Отправка на Mock API")
    print("\nБудет обработано 8 тестовых уведомлений с интервалом 3 секунды")
    print("Смотрите вкладку 'Логи' для детальной информации")
    print("=" * 70)
    print("\nЗапуск приложения...\n")
    
    # Создаём окно
    root = tk.Tk()
    
    # Создаём приложение
    app = DonatKZApp(root)
    
    # Welcome сообщения
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "🚀 Запущен режим демонстрации интеграции")
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "📋 Компоненты:")
    app.add_log_message("INFO", "  ✅ KaspiNotificationParser инициализирован")
    app.add_log_message("INFO", "  ✅ DonationValidator инициализирован")
    app.add_log_message("INFO", "  ✅ DeduplicationManager инициализирован")
    app.add_log_message("INFO", "  ✅ Mock API готов к работе")
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "⏳ Ожидание первого уведомления (2 сек)...")
    
    # Обновляем статус
    app.update_status("Интеграция", "yellow")
    app.update_user_email("integration@donatkz.com")
    app.update_statusbar("Ожидание уведомлений...")
    
    # Запускаем симуляцию
    simulate_kaspi_notifications(app)
    
    # Запускаем GUI
    app.run()


if __name__ == "__main__":
    main()






