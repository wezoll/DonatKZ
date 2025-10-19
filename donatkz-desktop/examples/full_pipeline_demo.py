"""
Демонстрация полного pipeline обработки донатов

Показывает полный цикл:
1. Windows Notification Listener
2. Donation Pipeline (Parser + Validator + Deduplication)
3. Mock API отправка
4. GUI обновления
"""
import tkinter as tk
import sys
from pathlib import Path
import asyncio
import logging

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from config import Config
from utils.logger import setup_logger
from ui.main_window import DonatKZApp
from core.pipeline_manager import PipelineManager

# Настройка логирования
logger = setup_logger(
    name="donatkz_full_pipeline",
    log_file=Config.LOG_FILE,
    log_level=logging.DEBUG
)


async def initialize_pipeline(app: DonatKZApp):
    """
    Инициализация полного pipeline
    
    Args:
        app: Экземпляр GUI приложения
    """
    try:
        # Создаём менеджер pipeline
        pipeline_manager = PipelineManager(
            gui_app=app,
            use_mock_listener=True,
            use_mock_api=True
        )
        
        # Инициализируем компоненты
        await pipeline_manager.initialize()
        
        # Запускаем полный pipeline
        if pipeline_manager.start():
            app.add_log_message("INFO", "🚀 Полный pipeline запущен!")
            app.add_log_message("INFO", "📊 Компоненты:")
            app.add_log_message("INFO", "  ✅ Windows Notification Listener (Mock)")
            app.add_log_message("INFO", "  ✅ Donation Pipeline")
            app.add_log_message("INFO", "  ✅ KaspiNotificationParser")
            app.add_log_message("INFO", "  ✅ DonationValidator")
            app.add_log_message("INFO", "  ✅ DeduplicationManager")
            app.add_log_message("INFO", "  ✅ Mock API Client")
            app.add_log_message("INFO", "  ✅ GUI Integration")
            app.add_log_message("INFO", "=" * 50)
            app.add_log_message("INFO", "💡 Слушатель будет получать тестовые уведомления Kaspi")
            app.add_log_message("INFO", "💡 Все донаты будут обработаны через полный pipeline")
            
            # Обновляем статус
            app.update_status("Pipeline активен", "green")
            app.update_user_email("pipeline@donatkz.com")
            app.update_statusbar("Полный pipeline работает...")
            
            return pipeline_manager
        else:
            app.add_log_message("ERROR", "❌ Не удалось запустить pipeline")
            return None
            
    except Exception as e:
        logger.exception(f"Ошибка инициализации pipeline: {e}")
        app.add_log_message("ERROR", f"❌ Ошибка инициализации: {e}")
        return None


def main():
    """Главная функция демо"""
    print("=" * 70)
    print("DonatKZ Desktop - Full Pipeline Demo")
    print("=" * 70)
    print("\nЭта демонстрация показывает полный pipeline:")
    print("  1. 🔍 Windows Notification Listener (Mock)")
    print("  2. 📱 Перехват уведомлений Kaspi")
    print("  3. 🔍 Парсинг через KaspiNotificationParser")
    print("  4. ✅ Валидация через DonationValidator")
    print("  5. 🔄 Дедупликация через DeduplicationManager")
    print("  6. 📤 Отправка на Mock API")
    print("  7. 🖥️  Обновление GUI в real-time")
    print("\nВсе компоненты интегрированы в единый pipeline!")
    print("=" * 70)
    print("\nЗапуск приложения...\n")
    
    # Создаём окно
    root = tk.Tk()
    
    # Создаём приложение
    app = DonatKZApp(root)
    
    # Welcome сообщения
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "🚀 Запущен режим демонстрации полного pipeline")
    app.add_log_message("INFO", "=" * 50)
    app.add_log_message("INFO", "⏳ Инициализация компонентов...")
    
    # Инициализируем pipeline асинхронно
    def init_pipeline():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        pipeline_manager = loop.run_until_complete(initialize_pipeline(app))
        loop.close()
        return pipeline_manager
    
    # Запускаем инициализацию в отдельном потоке
    import threading
    init_thread = threading.Thread(target=init_pipeline, daemon=True)
    init_thread.start()
    
    # Запускаем GUI
    app.run()


if __name__ == "__main__":
    main()

