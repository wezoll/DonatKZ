"""Reusable UI widgets and components"""
import tkinter as tk
from tkinter import ttk
from typing import Callable, Optional


class StatCard(ttk.Frame):
    """
    Карточка для отображения статистики
    
    Используется в Dashboard для показа количества донатов, суммы и т.д.
    """
    
    def __init__(
        self,
        parent,
        title: str,
        value: str = "0",
        **kwargs
    ):
        """
        Инициализация карточки статистики
        
        Args:
            parent: Родительский виджет
            title: Заголовок карточки
            value: Начальное значение
            **kwargs: Дополнительные аргументы для Frame
        """
        super().__init__(parent, relief=tk.RIDGE, borderwidth=2, **kwargs)
        
        # Заголовок
        self.title_label = ttk.Label(
            self,
            text=title,
            font=("Segoe UI", 10),
            anchor=tk.CENTER
        )
        self.title_label.pack(pady=(10, 5), padx=10)
        
        # Значение
        self.value_label = ttk.Label(
            self,
            text=value,
            font=("Segoe UI", 20, "bold"),
            anchor=tk.CENTER
        )
        self.value_label.pack(pady=(5, 10), padx=10)
    
    def update_value(self, value: str):
        """
        Обновить значение карточки
        
        Args:
            value: Новое значение
        """
        self.value_label.config(text=value)


class LabeledEntry(ttk.Frame):
    """
    Entry с подписью слева
    
    Удобный виджет для форм настроек
    """
    
    def __init__(
        self,
        parent,
        label_text: str,
        entry_width: int = 30,
        **kwargs
    ):
        """
        Инициализация labeled entry
        
        Args:
            parent: Родительский виджет
            label_text: Текст подписи
            entry_width: Ширина поля ввода
            **kwargs: Дополнительные аргументы для Frame
        """
        super().__init__(parent, **kwargs)
        
        # Label
        self.label = ttk.Label(self, text=label_text, width=20, anchor=tk.W)
        self.label.pack(side=tk.LEFT, padx=(0, 10))
        
        # Entry
        self.entry = ttk.Entry(self, width=entry_width)
        self.entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
    
    def get(self) -> str:
        """Получить значение из Entry"""
        return self.entry.get()
    
    def set(self, value: str):
        """
        Установить значение в Entry
        
        Args:
            value: Значение для установки
        """
        self.entry.delete(0, tk.END)
        self.entry.insert(0, value)
    
    def clear(self):
        """Очистить Entry"""
        self.entry.delete(0, tk.END)


class LabeledCheckbutton(ttk.Frame):
    """
    Checkbutton с подписью
    """
    
    def __init__(
        self,
        parent,
        label_text: str,
        default: bool = False,
        **kwargs
    ):
        """
        Инициализация labeled checkbutton
        
        Args:
            parent: Родительский виджет
            label_text: Текст подписи
            default: Начальное состояние
            **kwargs: Дополнительные аргументы для Frame
        """
        super().__init__(parent, **kwargs)
        
        # Variable для хранения состояния
        self.var = tk.BooleanVar(value=default)
        
        # Checkbutton
        self.checkbutton = ttk.Checkbutton(
            self,
            text=label_text,
            variable=self.var
        )
        self.checkbutton.pack(anchor=tk.W, padx=5, pady=2)
    
    def get(self) -> bool:
        """Получить состояние чекбокса"""
        return self.var.get()
    
    def set(self, value: bool):
        """
        Установить состояние чекбокса
        
        Args:
            value: True или False
        """
        self.var.set(value)


class ScrollableTreeview(ttk.Frame):
    """
    Treeview со скроллбаром
    
    Удобный виджет для отображения таблиц и списков
    """
    
    def __init__(
        self,
        parent,
        columns: tuple,
        column_widths: Optional[dict] = None,
        height: int = 10,
        **kwargs
    ):
        """
        Инициализация scrollable treeview
        
        Args:
            parent: Родительский виджет
            columns: Кортеж с именами колонок
            column_widths: Словарь {column: width}
            height: Высота в строках
            **kwargs: Дополнительные аргументы для Frame
        """
        super().__init__(parent, **kwargs)
        
        # Treeview
        self.tree = ttk.Treeview(
            self,
            columns=columns,
            show="headings",
            height=height
        )
        
        # Настройка колонок
        for col in columns:
            self.tree.heading(col, text=col)
            if column_widths and col in column_widths:
                self.tree.column(col, width=column_widths[col])
        
        # Вертикальный скроллбар
        scrollbar = ttk.Scrollbar(
            self,
            orient=tk.VERTICAL,
            command=self.tree.yview
        )
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Размещение
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    
    def insert(self, values: tuple, position: str = "end"):
        """
        Вставить строку
        
        Args:
            values: Значения для колонок
            position: Позиция вставки ("end" или индекс)
        """
        self.tree.insert("", position, values=values)
    
    def clear(self):
        """Очистить все строки"""
        for item in self.tree.get_children():
            self.tree.delete(item)
    
    def get_all_items(self) -> list:
        """
        Получить все элементы
        
        Returns:
            list: Список кортежей со значениями
        """
        items = []
        for item in self.tree.get_children():
            items.append(self.tree.item(item)["values"])
        return items


class ButtonGroup(ttk.Frame):
    """
    Группа кнопок в ряд
    """
    
    def __init__(
        self,
        parent,
        buttons: list,
        **kwargs
    ):
        """
        Инициализация группы кнопок
        
        Args:
            parent: Родительский виджет
            buttons: Список кортежей (text, command)
            **kwargs: Дополнительные аргументы для Frame
        """
        super().__init__(parent, **kwargs)
        
        self.buttons = []
        for text, command in buttons:
            btn = ttk.Button(self, text=text, command=command)
            btn.pack(side=tk.LEFT, padx=5, pady=5)
            self.buttons.append(btn)
    
    def enable_button(self, index: int):
        """
        Включить кнопку
        
        Args:
            index: Индекс кнопки
        """
        if 0 <= index < len(self.buttons):
            self.buttons[index].config(state=tk.NORMAL)
    
    def disable_button(self, index: int):
        """
        Выключить кнопку
        
        Args:
            index: Индекс кнопки
        """
        if 0 <= index < len(self.buttons):
            self.buttons[index].config(state=tk.DISABLED)


def show_info(title: str, message: str):
    """
    Показать информационное окно
    
    Args:
        title: Заголовок
        message: Сообщение
    """
    from tkinter import messagebox
    messagebox.showinfo(title, message)


def show_warning(title: str, message: str):
    """
    Показать предупреждение
    
    Args:
        title: Заголовок
        message: Сообщение
    """
    from tkinter import messagebox
    messagebox.showwarning(title, message)


def show_error(title: str, message: str):
    """
    Показать ошибку
    
    Args:
        title: Заголовок
        message: Сообщение
    """
    from tkinter import messagebox
    messagebox.showerror(title, message)


def ask_yes_no(title: str, message: str) -> bool:
    """
    Показать диалог Да/Нет
    
    Args:
        title: Заголовок
        message: Сообщение
        
    Returns:
        bool: True если Да, False если Нет
    """
    from tkinter import messagebox
    return messagebox.askyesno(title, message)



