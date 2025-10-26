"""
Демонстрация интеграции Notification Listener с GUI

Показывает полный pipeline:
1. Windows Notification Listener (Mock)
2. Парсинг уведомлений Kaspi
3. Валидация и дедупликация
4. Обновление GUI в real-time
"""
import tkinter as tk
import sys
from pathlib import Path
import logging

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from config import Config
from utils.logger import setup_logger
from ui.main_window import DonatKZApp

# Настройка логирования
logger = setup_logger(
    name="donatkz_listener_demo",
    log_file=Config.LOG_FILE,
    log_level=logging.DEBUG
)


def main():
    """Главная функция демо"""
    print("=" * 70)
    print("DonatKZ Desktop - Notification Listener Integration Demo")
    print("=" * 70)
    print("\nЭта демонстрация показывает:")
    print("  1. 🔍 Windows Notification Listener (Mock)")
    print("  2. 📱 Перехват уведомлений Kaspi")
    print("  3. 🔍 Парсинг текста уведомления")
    print("  4. ✅ Валидация данных")
    print("  5. 🔄 Дедупликация")
    print("  6. 🖥️  Обновление GUI в real-time")
    print("  7. 📤 Отправка на Mock API")
    print("\nНажмите кнопку 🔍 в верхней панели для запуска слушателя")
    print("Смотрите вкладку 'Логи' для детальной информации")
    print("=" * 70)
    print("\nЗапуск приложения...\n")
    
    # Создаём окно
    root = tk.Tk()
    
    # Создаём приложение
    app = DonatKZApp(root)
    
    # Welcome сообщения
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "🚀 Запущен режим демонстрации Notification Listener")
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "📋 Компоненты:")
    app.add_log_message("INFO", "  ✅ WindowsNotificationListener готов")
    app.add_log_message("INFO", "  ✅ KaspiNotificationParser готов")
    app.add_log_message("INFO", "  ✅ DonationValidator готов")
    app.add_log_message("INFO", "  ✅ DeduplicationManager готов")
    app.add_log_message("INFO", "  ✅ Mock API готов")
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "💡 Нажмите кнопку 🔍 для запуска слушателя")
    app.add_log_message("INFO", "💡 Слушатель будет получать тестовые уведомления Kaspi")
    
    # Обновляем статус
    app.update_status("Готов к запуску", "yellow")
    app.update_user_email("listener@donatkz.com")
    app.update_statusbar("Нажмите 🔍 для запуска слушателя...")
    
    # Запускаем GUI
    app.run()


if __name__ == "__main__":
    main()



