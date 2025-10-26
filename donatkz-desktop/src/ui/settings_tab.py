"""Settings tab for application configuration"""
import tkinter as tk
from tkinter import ttk
import logging
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from .widgets import (
    LabeledEntry, 
    LabeledCheckbutton, 
    ButtonGroup, 
    show_info, 
    show_error, 
    ask_yes_no,
    SimpleTooltip
)
from config import Config

logger = logging.getLogger(__name__)


class SettingsTab:
    """
    Вкладка Настройки
    
    Позволяет настроить:
    - Подключение к API
    - Уведомления
    - Лимиты донатов
    """
    
    def __init__(self, parent):
        """
        Инициализация Settings
        
        Args:
            parent: Родительский виджет (Notebook)
        """
        self.frame = ttk.Frame(parent)
        self.current_api_url = None
        
        # Создаём прокручиваемый canvas для настроек
        self._create_scrollable_frame()
        
        # Создаём секции настроек
        self._create_connection_section()
        self._create_notifications_section()
        self._create_donations_section()
        self._create_actions_section()
        
        # Загружаем текущие настройки
        self.load_settings()
        
        logger.debug("Settings вкладка инициализирована")
    
    def _create_scrollable_frame(self):
        """Создание прокручиваемого фрейма"""
        # Canvas для прокрутки
        canvas = tk.Canvas(self.frame)
        scrollbar = ttk.Scrollbar(self.frame, orient="vertical", command=canvas.yview)
        self.scrollable_frame = ttk.Frame(canvas)
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
    
    def _create_connection_section(self):
        """Создание секции подключения"""
        # Заголовок
        header = ttk.Label(
            self.scrollable_frame,
            text="🔌 Подключение",
            font=("Segoe UI", 12, "bold")
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        # Рамка
        frame = ttk.LabelFrame(self.scrollable_frame, text="", padding=10)
        frame.pack(fill=tk.X, padx=10, pady=5)
        
        # API URL с индикатором обновления
        api_url_frame = ttk.Frame(frame)
        api_url_frame.pack(fill=tk.X, pady=5)
        
        self.api_url_entry = LabeledEntry(
            api_url_frame,
            label_text="API URL:",
            entry_width=40
        )
        self.api_url_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # Привязываем событие изменения текста
        self.api_url_entry.entry.bind("<KeyRelease>", self._on_api_url_changed)
        
        # Индикатор обновления
        self.api_update_indicator = ttk.Label(
            api_url_frame,
            text="✅",
            font=("Segoe UI", 10),
            foreground="green"
        )
        self.api_update_indicator.pack(side=tk.LEFT, padx=(5, 0))
        
        # Подсказка для индикатора
        SimpleTooltip(
            self.api_update_indicator,
            "✅ = Сохранено | ⚠️ = Нужно сохранить"
        )
        
        # Mock API чекбокс
        self.mock_api_check = LabeledCheckbutton(
            frame,
            label_text="✅ Использовать Mock API (для разработки)",
            default=False
        )
        self.mock_api_check.pack(fill=tk.X, pady=5)
        
        # Статус подключения
        self.connection_status = ttk.Label(
            frame,
            text="Статус: 🟢 Подключено",
            font=("Segoe UI", 9)
        )
        self.connection_status.pack(anchor=tk.W, pady=5)
    
    def _create_notifications_section(self):
        """Создание секции уведомлений"""
        # Заголовок
        header = ttk.Label(
            self.scrollable_frame,
            text="🔔 Уведомления",
            font=("Segoe UI", 12, "bold")
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        # Рамка
        frame = ttk.LabelFrame(self.scrollable_frame, text="", padding=10)
        frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Phone Link статус (только для отображения)
        self.phone_link_check = LabeledCheckbutton(
            frame,
            label_text="📱 Phone Link активен",
            default=True
        )
        self.phone_link_check.pack(fill=tk.X, pady=2)
        self.phone_link_check.checkbutton.config(state=tk.DISABLED)
        
        # Звуковые уведомления
        self.sound_check = LabeledCheckbutton(
            frame,
            label_text="🔊 Звуковые уведомления",
            default=True
        )
        self.sound_check.pack(fill=tk.X, pady=2)
        
        # Всплывающие окна
        self.popup_check = LabeledCheckbutton(
            frame,
            label_text="💬 Всплывающие окна при донате",
            default=True
        )
        self.popup_check.pack(fill=tk.X, pady=2)
    
    def _create_donations_section(self):
        """Создание секции настроек донатов"""
        # Заголовок
        header = ttk.Label(
            self.scrollable_frame,
            text="💰 Донаты",
            font=("Segoe UI", 12, "bold")
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        # Рамка
        frame = ttk.LabelFrame(self.scrollable_frame, text="", padding=10)
        frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Минимальная сумма
        min_frame = ttk.Frame(frame)
        min_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(min_frame, text="Минимальная сумма:", width=20).pack(side=tk.LEFT)
        self.min_amount_entry = ttk.Entry(min_frame, width=15)
        self.min_amount_entry.pack(side=tk.LEFT, padx=5)
        ttk.Label(min_frame, text="₸").pack(side=tk.LEFT)
        
        # Максимальная сумма
        max_frame = ttk.Frame(frame)
        max_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(max_frame, text="Максимальная сумма:", width=20).pack(side=tk.LEFT)
        self.max_amount_entry = ttk.Entry(max_frame, width=15)
        self.max_amount_entry.pack(side=tk.LEFT, padx=5)
        ttk.Label(max_frame, text="₸").pack(side=tk.LEFT)
    
    def _create_actions_section(self):
        """Создание секции с кнопками действий"""
        actions_frame = ttk.Frame(self.scrollable_frame)
        actions_frame.pack(fill=tk.X, padx=10, pady=20)
        
        # Кнопки слева
        left_buttons = ttk.Frame(actions_frame)
        left_buttons.pack(side=tk.LEFT)
        
        self.save_btn = ttk.Button(
            left_buttons,
            text="💾 Сохранить",
            command=self.save_settings
        )
        self.save_btn.pack(side=tk.LEFT, padx=5)
        
        self.cancel_btn = ttk.Button(
            left_buttons,
            text="❌ Отмена",
            command=self.load_settings
        )
        self.cancel_btn.pack(side=tk.LEFT, padx=5)
        
        # Кнопка выхода справа
        self.logout_btn = ttk.Button(
            actions_frame,
            text="🚪 Выйти из аккаунта",
            command=self.logout
        )
        self.logout_btn.pack(side=tk.RIGHT, padx=5)
    
    def load_settings(self):
        """Загрузить текущие настройки"""
        try:
            # Пробуем загрузить из файла
            if Config.SETTINGS_FILE.exists():
                with open(Config.SETTINGS_FILE, 'r', encoding='utf-8') as f:
                    settings = json.load(f)
            else:
                # Настройки по умолчанию
                settings = self._get_default_settings()
            
            # Заполняем поля
            self.api_url_entry.set(settings.get("api_url", Config.API_BASE_URL))
            self.current_api_url = self.api_url_entry.get()
            self.mock_api_check.set(settings.get("use_mock_api", Config.USE_MOCK_API))
            self.sound_check.set(settings.get("sound_enabled", True))
            self.popup_check.set(settings.get("popup_enabled", True))
            
            self.min_amount_entry.delete(0, tk.END)
            self.min_amount_entry.insert(0, str(settings.get("min_amount", Config.MIN_DONATION_AMOUNT)))
            
            self.max_amount_entry.delete(0, tk.END)
            self.max_amount_entry.insert(0, str(settings.get("max_amount", Config.MAX_DONATION_AMOUNT)))
            
            logger.info("Настройки загружены")
            
        except Exception as e:
            logger.error(f"Ошибка загрузки настроек: {e}")
            show_error("Ошибка", f"Не удалось загрузить настройки: {e}")
    
    def _on_api_url_changed(self, event=None):
        """Обработчик изменения API URL"""
        current = self.api_url_entry.get()
        if current != self.current_api_url:
            # URL изменился - показываем оранжевый индикатор
            self.api_update_indicator.config(text="⚠️", foreground="orange")
        else:
            # URL вернулся к сохранённому - показываем зелёный индикатор
            self.api_update_indicator.config(text="✅", foreground="green")
    
    def save_settings(self):
        """Сохранить настройки"""
        try:
            # Валидация
            min_amount = float(self.min_amount_entry.get())
            max_amount = float(self.max_amount_entry.get())
            
            if min_amount < 0 or max_amount < 0:
                show_error("Ошибка", "Суммы должны быть положительными")
                return
            
            if min_amount > max_amount:
                show_error("Ошибка", "Минимальная сумма не может быть больше максимальной")
                return
            
            # Собираем настройки
            settings = {
                "api_url": self.api_url_entry.get(),
                "use_mock_api": self.mock_api_check.get(),
                "sound_enabled": self.sound_check.get(),
                "popup_enabled": self.popup_check.get(),
                "min_amount": min_amount,
                "max_amount": max_amount
            }
            
            # Сохраняем в файл
            Config.SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(Config.SETTINGS_FILE, 'w', encoding='utf-8') as f:
                json.dump(settings, f, indent=2, ensure_ascii=False)
            
            logger.info("Настройки сохранены")
            
            # Обновляем текущий API URL и индикатор
            self.current_api_url = self.api_url_entry.get()
            self.api_update_indicator.config(text="✅", foreground="green")
            
            show_info("Успешно", "Настройки сохранены и обновлены!")
            
        except ValueError as e:
            show_error("Ошибка", "Неверный формат суммы. Введите число.")
        except Exception as e:
            logger.error(f"Ошибка сохранения настроек: {e}")
            show_error("Ошибка", f"Не удалось сохранить настройки: {e}")
    
    def logout(self):
        """Выход из аккаунта"""
        if ask_yes_no(
            "Выход из аккаунта",
            "Вы уверены что хотите выйти из аккаунта?"
        ):
            logger.info("Выход из аккаунта")
            # TODO: Очистить токены и вернуться к окну авторизации (Этап 6)
            show_info("Информация", "Функция выхода будет реализована в Этапе 6")
    
    def _get_default_settings(self) -> dict:
        """
        Получить настройки по умолчанию
        
        Returns:
            dict: Настройки по умолчанию
        """
        return {
            "api_url": Config.API_BASE_URL,
            "use_mock_api": Config.USE_MOCK_API,
            "sound_enabled": True,
            "popup_enabled": True,
            "min_amount": Config.MIN_DONATION_AMOUNT,
            "max_amount": Config.MAX_DONATION_AMOUNT
        }


