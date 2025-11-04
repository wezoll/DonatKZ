"""
Демонстрация авторизации

Показывает полный цикл авторизации:
1. Окно логина
2. AuthManager с JWT токенами
3. Windows Credential Manager
4. Refresh token механизм
5. Интеграция с главным окном
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
from auth import AuthManager, LoginWindow

# Настройка логирования
logger = setup_logger(
    name="donatkz_auth_demo",
    log_file=Config.LOG_FILE,
    log_level=logging.DEBUG
)


def main():
    """Главная функция демо авторизации"""
    print("=" * 70)
    print("DonatKZ Desktop - Auth Demo")
    print("=" * 70)
    print("\nЭта демонстрация показывает авторизацию:")
    print("  1. 🔑 Окно логина с полями email/password")
    print("  2. 🔐 AuthManager с JWT токенами")
    print("  3. 💾 Windows Credential Manager")
    print("  4. 🔄 Refresh token механизм")
    print("  5. 🖥️  Интеграция с главным окном")
    print("\nВсе компоненты авторизации интегрированы!")
    print("=" * 70)
    print("\nЗапуск приложения...\n")
    
    # Создаём окно
    root = tk.Tk()
    
    # Создаём приложение
    app = DonatKZApp(root)
    
    # Welcome сообщения
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "🔑 Запущен режим демонстрации авторизации")
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "💡 Нажмите кнопку 🔑 для авторизации")
    app.add_log_message("INFO", "💡 Используйте тестовые данные:")
    app.add_log_message("INFO", "   Email: test@example.com")
    app.add_log_message("INFO", "   Password: password")
    app.add_log_message("INFO", "💡 Авторизация работает с Mock API")
    
    # Запускаем GUI
    app.run()


if __name__ == "__main__":
    main()




