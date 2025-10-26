"""Logging configuration"""
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Optional

try:
    import colorlog
    HAS_COLORLOG = True
except ImportError:
    HAS_COLORLOG = False


def setup_logger(
    name: str = "donatkz",
    log_file: Optional[Path] = None,
    log_level: int = logging.DEBUG,
    max_bytes: int = 10 * 1024 * 1024,
    backup_count: int = 5
) -> logging.Logger:
    """
    Настройка логгера с цветным выводом и ротацией файлов
    
    Args:
        name: Имя логгера
        log_file: Путь к файлу логов (если None - только консоль)
        log_level: Уровень логирования
        max_bytes: Максимальный размер файла лога
        backup_count: Количество backup файлов
        
    Returns:
        logging.Logger: Настроенный логгер
    """
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    # Очистка существующих handlers
    logger.handlers.clear()
    
    # Формат для файлов
    file_formatter = logging.Formatter(
        fmt='[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Формат для консоли (цветной если доступен colorlog)
    if HAS_COLORLOG:
        console_formatter = colorlog.ColoredFormatter(
            fmt='%(log_color)s[%(asctime)s] [%(levelname)s] %(reset)s%(message)s',
            datefmt='%H:%M:%S',
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            }
        )
    else:
        console_formatter = logging.Formatter(
            fmt='[%(asctime)s] [%(levelname)s] %(message)s',
            datefmt='%H:%M:%S'
        )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler (если указан путь)
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    logger.info(f"Логгер '{name}' инициализирован (уровень: {logging.getLevelName(log_level)})")
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Получить существующий логгер
    
    Args:
        name: Имя логгера
        
    Returns:
        logging.Logger: Логгер
    """
    return logging.getLogger(name)


class TkinterLogHandler(logging.Handler):
    """
    Custom logging handler для отображения логов в Tkinter Text виджете
    
    Использование:
        handler = TkinterLogHandler(text_widget)
        logger.addHandler(handler)
    """
    
    def __init__(self, text_widget):
        """
        Инициализация handler
        
        Args:
            text_widget: Tkinter Text виджет для вывода логов
        """
        super().__init__()
        self.text_widget = text_widget
        
        # Формат
        formatter = logging.Formatter(
            fmt='[%(asctime)s] [%(levelname)s] %(message)s',
            datefmt='%H:%M:%S'
        )
        self.setFormatter(formatter)
    
    def emit(self, record):
        """
        Вывод лог записи в Text виджет
        
        Args:
            record: LogRecord
        """
        try:
            msg = self.format(record)
            level = record.levelname
            
            # ВАЖНО: используем after() для thread safety
            self.text_widget.after(0, lambda: self._insert_log(msg, level))
        except Exception:
            self.handleError(record)
    
    def _insert_log(self, msg: str, level: str):
        """
        Вставка лога в виджет (должна вызываться в main thread)
        
        Args:
            msg: Текст сообщения
            level: Уровень (INFO, WARNING, ERROR)
        """
        import tkinter as tk
        
        # Включаем редактирование
        self.text_widget.config(state=tk.NORMAL)
        
        # Вставляем с тегом уровня для цветного отображения
        self.text_widget.insert(tk.END, msg + '\n', level)
        
        # Автоскролл к концу
        self.text_widget.see(tk.END)
        
        # Отключаем редактирование
        self.text_widget.config(state=tk.DISABLED)





