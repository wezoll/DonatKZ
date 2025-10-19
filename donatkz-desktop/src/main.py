"""Main entry point for DonatKZ Desktop Application"""
import tkinter as tk
import sys
import logging
from pathlib import Path

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent))

from config import Config
from utils.logger import setup_logger
from ui.main_window import DonatKZApp

# Настройка логирования
logger = setup_logger(
    name="donatkz",
    log_file=Config.LOG_FILE,
    log_level=Config.get_log_level(),
    max_bytes=Config.LOG_MAX_BYTES,
    backup_count=Config.LOG_BACKUP_COUNT
)


def main():
    """
    Главная функция приложения
    """
    logger.info("=" * 60)
    logger.info(f"Запуск {Config.WINDOW_TITLE} {Config.WINDOW_VERSION}")
    logger.info("=" * 60)
    
    app = None
    root = None
    
    try:
        logger.info("Создание главного окна Tkinter...")
        # Создаём главное окно Tkinter
        root = tk.Tk()
        logger.info("Главное окно Tkinter создано")
        
        logger.info("Создание приложения DonatKZApp...")
        # Создаём приложение
        app = DonatKZApp(root)
        logger.info("Приложение DonatKZApp создано")
        
        # Добавляем welcome сообщение в логи
        app.add_log_message("INFO", f"Приложение запущено")
        app.add_log_message("INFO", f"Режим: {'Mock API' if Config.USE_MOCK_API else 'Real API'}")
        app.add_log_message("INFO", f"API URL: {Config.API_BASE_URL}")
        
        # Обновляем статус
        app.update_status("Активен", "green")
        app.update_statusbar("Готов к работе")
        
        logger.info("GUI инициализирован успешно")
        
        # Запускаем главный цикл
        app.run()
        
    except KeyboardInterrupt:
        logger.info("Приложение прервано пользователем")
    except Exception as e:
        logger.exception(f"Критическая ошибка при запуске приложения: {e}")
        
        # Показываем окно с ошибкой
        try:
            from tkinter import messagebox
            messagebox.showerror(
                "Ошибка запуска",
                f"Не удалось запустить приложение:\n\n{e}\n\nПроверьте логи в {Config.LOG_FILE}"
            )
        except:
            pass
        
        sys.exit(1)
    finally:
        # Очищаем ресурсы
        try:
            if app:
                app.cleanup()
        except Exception as e:
            logger.debug(f"Ошибка при очистке ресурсов: {e}")
    
    logger.info("Приложение закрыто")


if __name__ == "__main__":
    main()


