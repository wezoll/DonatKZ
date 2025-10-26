"""
Демонстрация System Tray

Показывает полную интеграцию с системным треем Windows:
1. Иконка в трее с контекстным меню
2. Мониторинг Phone Link
3. Управление приложением из трея
4. Индикатор статуса в GUI
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
    name="donatkz_tray_demo",
    log_file=Config.LOG_FILE,
    log_level=logging.DEBUG
)


def main():
    """Главная функция демо System Tray"""
    print("=" * 70)
    print("DonatKZ Desktop - System Tray Demo")
    print("=" * 70)
    print("\nЭта демонстрация показывает System Tray:")
    print("  1. 🖥️ Иконка в системном трее Windows")
    print("  2. 📱 Мониторинг Phone Link")
    print("  3. 🎛️ Контекстное меню трея")
    print("  4. 👁️ Показать/скрыть окно из трея")
    print("  5. 📊 Индикатор статуса в GUI")
    print("\nВсе компоненты System Tray интегрированы!")
    print("=" * 70)
    print("\nЗапуск приложения...\n")
    
    # Создаём окно
    root = tk.Tk()
    
    # Создаём приложение
    app = DonatKZApp(root)
    
    # Welcome сообщения
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "🖥️ Запущен режим демонстрации System Tray")
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "💡 Иконка в трее: Ищите 'D' в системном трее")
    app.add_log_message("INFO", "💡 Phone Link: Индикатор в заголовке окна")
    app.add_log_message("INFO", "💡 Управление: Правый клик по иконке в трее")
    app.add_log_message("INFO", "💡 Сворачивание: Закройте окно - оно свернётся в трей")
    app.add_log_message("INFO", "💡 Восстановление: Двойной клик по иконке в трее")
    
    # Запускаем GUI
    app.run()


if __name__ == "__main__":
    main()



