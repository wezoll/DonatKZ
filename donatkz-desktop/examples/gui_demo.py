"""
Демонстрация работы GUI с симуляцией донатов

Запускает приложение и автоматически добавляет тестовые донаты
для демонстрации функциональности.
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

# Настройка логирования
logger = setup_logger(
    name="donatkz_demo",
    log_file=Config.LOG_FILE,
    log_level=logging.DEBUG
)


def simulate_donations(app: DonatKZApp):
    """
    Симуляция получения донатов
    
    Args:
        app: Экземпляр приложения
    """
    # Тестовые донаты
    test_donations = [
        {
            "amount": 500.0,
            "senderName": "Аспандияр Т.",
            "message": "Рахмет за стрим! 🔥",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Пополнение: 500 Т"
        },
        {
            "amount": 1000.0,
            "senderName": "Айгерим К.",
            "message": "Продолжай в том же духе!",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Перевод: 1000 ₸ от Айгерим К."
        },
        {
            "amount": 200.0,
            "senderName": "Максим С.",
            "message": "За контент",
            "timestamp": datetime.now().isoformat(),
            "rawText": "200 ₸ от Максим С."
        },
        {
            "amount": 5000.0,
            "senderName": "Нурлан А.",
            "message": "Отличный стрим! Так держать!",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Перевод: 5000 ₸ от Нурлан А."
        },
        {
            "amount": 300.0,
            "senderName": "Алия Б.",
            "message": "Спасибо за контент",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Перевод: 300 ₸ от Алия Б."
        }
    ]
    
    def add_next_donation(index=0):
        """Рекурсивно добавляем донаты с задержкой"""
        if index < len(test_donations):
            donation = test_donations[index]
            
            # Добавляем донат
            app.add_donation_to_dashboard(donation)
            
            # Обновляем статус бар
            app.update_statusbar(
                f"Последний донат: {donation['amount']}₸ от {donation['senderName']}"
            )
            
            # Обновляем счётчик
            app.update_donation_counter(index + 1)
            
            # Добавляем лог
            app.add_log_message(
                "INFO",
                f"Получен донат: {donation['amount']}₸ от {donation['senderName']}"
            )
            
            # Планируем следующий донат через 2 секунды
            app.root.after(2000, lambda: add_next_donation(index + 1))
    
    # Начинаем через 1 секунду после запуска
    app.root.after(1000, lambda: add_next_donation(0))


def main():
    """Главная функция демо"""
    print("=" * 60)
    print("DonatKZ Desktop - GUI Demo")
    print("=" * 60)
    print("\nЭта демонстрация:")
    print("1. Запустит GUI приложения")
    print("2. Автоматически добавит 5 тестовых донатов")
    print("3. Покажет работу всех вкладок")
    print("\nПриложение запускается...")
    print("=" * 60)
    
    # Создаём окно
    root = tk.Tk()
    
    # Создаём приложение
    app = DonatKZApp(root)
    
    # Добавляем welcome логи
    app.add_log_message("INFO", "🚀 Запущен режим демонстрации")
    app.add_log_message("INFO", "Через 1 секунду начнётся симуляция донатов")
    app.add_log_message("DEBUG", "Будет добавлено 5 тестовых донатов с интервалом 2 секунды")
    
    # Обновляем статус
    app.update_status("Демо режим", "yellow")
    app.update_user_email("demo@donatkz.com")
    app.update_statusbar("Ожидание первого доната...")
    
    # Запускаем симуляцию
    simulate_donations(app)
    
    # Запускаем GUI
    app.run()


if __name__ == "__main__":
    main()



