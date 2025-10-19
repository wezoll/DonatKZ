"""Logs tab with real-time logging"""
import tkinter as tk
from tkinter import ttk
from datetime import datetime
import logging
from tkinter import filedialog

from .widgets import ButtonGroup, show_info, show_error

logger = logging.getLogger(__name__)


class LogsTab:
    """
    Вкладка Логи
    
    Отображает логи приложения в real-time с фильтрацией по уровням
    """
    
    def __init__(self, parent):
        """
        Инициализация Logs
        
        Args:
            parent: Родительский виджет (Notebook)
        """
        self.frame = ttk.Frame(parent)
        
        # Создаём UI
        self._create_filters_section()
        self._create_logs_display()
        self._create_actions_section()
        
        logger.debug("Logs вкладка инициализирована")
    
    def _create_filters_section(self):
        """Создание секции фильтров"""
        filters_frame = ttk.Frame(self.frame)
        filters_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Заголовок
        ttk.Label(
            filters_frame,
            text="Уровни:",
            font=("Segoe UI", 10)
        ).pack(side=tk.LEFT, padx=5)
        
        # Чекбоксы для фильтрации
        self.show_info_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            filters_frame,
            text="INFO",
            variable=self.show_info_var,
            command=self._apply_filters
        ).pack(side=tk.LEFT, padx=5)
        
        self.show_warning_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            filters_frame,
            text="WARNING",
            variable=self.show_warning_var,
            command=self._apply_filters
        ).pack(side=tk.LEFT, padx=5)
        
        self.show_error_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            filters_frame,
            text="ERROR",
            variable=self.show_error_var,
            command=self._apply_filters
        ).pack(side=tk.LEFT, padx=5)
        
        self.show_debug_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            filters_frame,
            text="DEBUG",
            variable=self.show_debug_var,
            command=self._apply_filters
        ).pack(side=tk.LEFT, padx=5)
        
        # Кнопка очистки справа
        ttk.Button(
            filters_frame,
            text="🗑️ Очистить",
            command=self.clear_logs
        ).pack(side=tk.RIGHT, padx=5)
    
    def _create_logs_display(self):
        """Создание области отображения логов"""
        # Рамка
        frame = ttk.LabelFrame(self.frame, text="📋 Логи приложения", padding=5)
        frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Text виджет для логов
        self.logs_text = tk.Text(
            frame,
            wrap=tk.WORD,
            font=("Consolas", 9),
            state=tk.DISABLED,
            bg="#f8f9fa",
            fg="#212529"
        )
        
        # Вертикальный скроллбар
        scrollbar = ttk.Scrollbar(
            frame,
            orient=tk.VERTICAL,
            command=self.logs_text.yview
        )
        self.logs_text.configure(yscrollcommand=scrollbar.set)
        
        # Размещение
        self.logs_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Настройка цветовых тегов для уровней логирования
        self.logs_text.tag_config("INFO", foreground="#007bff")
        self.logs_text.tag_config("WARNING", foreground="#ffc107")
        self.logs_text.tag_config("ERROR", foreground="#dc3545")
        self.logs_text.tag_config("DEBUG", foreground="#6c757d")
        
        # Хранилище всех логов (для фильтрации)
        self.all_logs = []  # [(level, message), ...]
    
    def _create_actions_section(self):
        """Создание секции с кнопками действий"""
        actions_frame = ttk.Frame(self.frame)
        actions_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Кнопки
        self.export_btn = ttk.Button(
            actions_frame,
            text="📥 Экспортировать логи",
            command=self.export_logs
        )
        self.export_btn.pack(side=tk.LEFT, padx=5)
        
        self.copy_btn = ttk.Button(
            actions_frame,
            text="📋 Копировать все",
            command=self.copy_logs
        )
        self.copy_btn.pack(side=tk.LEFT, padx=5)
        
        # Автоскролл чекбокс (справа)
        self.autoscroll_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            actions_frame,
            text="Автоскролл",
            variable=self.autoscroll_var
        ).pack(side=tk.RIGHT, padx=5)
    
    def add_log(self, level: str, message: str):
        """
        Добавить лог сообщение
        
        Args:
            level: Уровень (INFO, WARNING, ERROR, DEBUG)
            message: Текст сообщения
        """
        # Сохраняем в хранилище
        self.all_logs.append((level, message))
        
        # Проверяем фильтры
        if not self._should_show_level(level):
            return
        
        # Форматируем сообщение
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_line = f"[{timestamp}] [{level}] {message}\n"
        
        # Добавляем в Text виджет
        self.logs_text.config(state=tk.NORMAL)
        self.logs_text.insert(tk.END, log_line, level)
        
        # Автоскролл
        if self.autoscroll_var.get():
            self.logs_text.see(tk.END)
        
        self.logs_text.config(state=tk.DISABLED)
        
        # Ограничиваем количество строк (последние 1000)
        lines = int(self.logs_text.index('end-1c').split('.')[0])
        if lines > 1000:
            self.logs_text.config(state=tk.NORMAL)
            self.logs_text.delete('1.0', '2.0')
            self.logs_text.config(state=tk.DISABLED)
    
    def _should_show_level(self, level: str) -> bool:
        """
        Проверить нужно ли показывать лог этого уровня
        
        Args:
            level: Уровень лога
            
        Returns:
            bool: True если показывать
        """
        if level == "INFO":
            return self.show_info_var.get()
        elif level == "WARNING":
            return self.show_warning_var.get()
        elif level == "ERROR":
            return self.show_error_var.get()
        elif level == "DEBUG":
            return self.show_debug_var.get()
        return True
    
    def _apply_filters(self):
        """Применить фильтры (перерисовать логи)"""
        # Очищаем дисплей
        self.logs_text.config(state=tk.NORMAL)
        self.logs_text.delete('1.0', tk.END)
        self.logs_text.config(state=tk.DISABLED)
        
        # Добавляем отфильтрованные логи
        for level, message in self.all_logs:
            if self._should_show_level(level):
                timestamp = datetime.now().strftime("%H:%M:%S")
                log_line = f"[{timestamp}] [{level}] {message}\n"
                
                self.logs_text.config(state=tk.NORMAL)
                self.logs_text.insert(tk.END, log_line, level)
                self.logs_text.config(state=tk.DISABLED)
        
        # Скроллим вниз
        if self.autoscroll_var.get():
            self.logs_text.see(tk.END)
    
    def clear_logs(self):
        """Очистить логи"""
        from .widgets import ask_yes_no
        
        if not self.all_logs:
            show_info("Информация", "Логи уже пусты")
            return
        
        if ask_yes_no("Подтверждение", "Очистить все логи?"):
            self.all_logs.clear()
            
            self.logs_text.config(state=tk.NORMAL)
            self.logs_text.delete('1.0', tk.END)
            self.logs_text.config(state=tk.DISABLED)
            
            logger.info("Логи очищены")
            show_info("Успешно", "Логи очищены")
    
    def export_logs(self):
        """Экспортировать логи в файл"""
        try:
            # Диалог выбора файла
            filename = filedialog.asksaveasfilename(
                defaultextension=".txt",
                filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
                initialfile=f"donatkz_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            )
            
            if not filename:
                return
            
            # Сохраняем логи
            with open(filename, 'w', encoding='utf-8') as f:
                content = self.logs_text.get('1.0', tk.END)
                f.write(content)
            
            logger.info(f"Логи экспортированы: {filename}")
            show_info("Успешно", f"Логи сохранены в:\n{filename}")
            
        except Exception as e:
            logger.error(f"Ошибка экспорта логов: {e}")
            show_error("Ошибка", f"Не удалось экспортировать логи: {e}")
    
    def copy_logs(self):
        """Копировать логи в буфер обмена"""
        try:
            content = self.logs_text.get('1.0', tk.END)
            
            self.logs_text.clipboard_clear()
            self.logs_text.clipboard_append(content)
            
            logger.info("Логи скопированы в буфер обмена")
            show_info("Успешно", "Логи скопированы в буфер обмена")
            
        except Exception as e:
            logger.error(f"Ошибка копирования логов: {e}")
            show_error("Ошибка", f"Не удалось скопировать логи: {e}")



