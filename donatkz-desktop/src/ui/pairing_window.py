"""
Pairing Window

Окно ввода 6-значного кода для привязки устройства к аккаунту
"""
import tkinter as tk
from tkinter import ttk, messagebox
import logging
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class PairingWindow:
    """
    Окно привязки устройства к аккаунту
    
    Позволяет пользователю ввести 6-значный код с сайта DonatKZ
    для привязки Desktop App к аккаунту
    """
    
    def __init__(
        self,
        parent: tk.Tk,
        on_pair_success: Optional[Callable] = None,
        on_cancel: Optional[Callable] = None
    ):
        """
        Инициализация окна привязки
        
        Args:
            parent: Родительское окно
            on_pair_success: Callback при успешной привязке
            on_cancel: Callback при отмене
        """
        self.parent = parent
        self.on_pair_success = on_pair_success
        self.on_cancel = on_cancel
        
        self.window = None
        self.code_entry = None
        self.status_label = None
        self.pair_button = None
        self.cancel_button = None
        self.is_loading = False
        
    def show(self):
        """Показать окно привязки"""
        if self.window:
            self.window.lift()
            return
        
        self._create_window()
    
    def _create_window(self):
        """Создание окна"""
        # Всегда используем parent как главное окно
        self.window = self.parent
        
        self.window.title("Привязка устройства")
        self.window.geometry("400x300")
        self.window.resizable(False, False)
        
        # Создаём элементы UI
        self._create_widgets()
        
        # Фокус на поле ввода
        self.code_entry.focus()
        
        # Обработка закрытия окна
        self.window.protocol("WM_DELETE_WINDOW", self._on_window_close)
        
        # Обработка Enter
        self.code_entry.bind('<Return>', lambda e: self._on_pair())
        
        # Центрируем окно
        self._center_window()
        
        logger.info("Окно привязки отображено")
    
    def _center_window(self):
        """Центрирование окна на экране"""
        self.window.update_idletasks()
        
        screen_width = self.window.winfo_screenwidth()
        screen_height = self.window.winfo_screenheight()
        window_width = self.window.winfo_width()
        window_height = self.window.winfo_height()
        
        x = (screen_width - window_width) // 2
        y = (screen_height - window_height) // 2
        
        self.window.geometry(f"+{x}+{y}")
    
    def _create_widgets(self):
        """Создание элементов UI"""
        # Основной фрейм
        main_frame = ttk.Frame(self.window, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Заголовок
        title_label = ttk.Label(
            main_frame,
            text="Привязка к аккаунту DonatKZ",
            font=("Arial", 14, "bold")
        )
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # Описание
        desc_label = ttk.Label(
            main_frame,
            text="Введите 6-значный код с сайта для привязки устройства",
            wraplength=350
        )
        desc_label.grid(row=1, column=0, columnspan=2, pady=(0, 20))
        
        # Метка "Код"
        code_label = ttk.Label(main_frame, text="Код (6 символов):")
        code_label.grid(row=2, column=0, sticky=tk.W, pady=(0, 5))
        
        # Поле ввода кода
        self.code_entry = ttk.Entry(main_frame, font=("Arial", 14, "bold"), width=15)
        self.code_entry.grid(row=3, column=0, columnspan=2, pady=(0, 10))
        
        # Валидация ввода (только буквы и цифры, макс 6 символов)
        vcmd = (self.window.register(self._validate_code_input), '%P')
        self.code_entry.config(validate='key', validatecommand=vcmd)
        
        # Статус
        self.status_label = ttk.Label(main_frame, text="", foreground="gray")
        self.status_label.grid(row=4, column=0, columnspan=2, pady=(0, 20))
        
        # Кнопки
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=5, column=0, columnspan=2)
        
        self.pair_button = ttk.Button(
            button_frame,
            text="Привязать",
            command=self._on_pair,
            width=15
        )
        self.pair_button.grid(row=0, column=0, padx=5)
        
        self.cancel_button = ttk.Button(
            button_frame,
            text="Отмена",
            command=self._on_cancel,
            width=15
        )
        self.cancel_button.grid(row=0, column=1, padx=5)
    
    def _validate_code_input(self, value: str) -> bool:
        """
        Валидация ввода кода
        
        Args:
            value: Новое значение
            
        Returns:
            bool: True если валидно
        """
        # Разрешаем только буквы и цифры, макс 6 символов
        if len(value) > 6:
            return False
        
        if value and not value.isalnum():
            return False
        
        return True
    
    def _on_pair(self):
        """Обработка нажатия кнопки 'Привязать'"""
        # Получаем код
        code = self.code_entry.get().strip().upper()
        
        # Проверяем длину
        if len(code) != 6:
            self._set_status("Код должен содержать 6 символов", "red")
            return
        
        # Запускаем привязку
        self._perform_pairing(code)
    
    def _perform_pairing(self, code: str):
        """
        Выполнение привязки в отдельном потоке
        
        Args:
            code: 6-значный код
        """
        if self.is_loading:
            return
        
        self.is_loading = True
        self._set_loading(True)
        self._set_status("Ожидание...", "blue")
        
        # Импортируем в функции чтобы избежать circular imports
        import threading
        
        def pair_thread():
            try:
                import asyncio
                from device.device_manager import DeviceManager
                from database.db_manager import DatabaseManager
                from config import Config
                from api import create_api_client
                
                # Создаём необходимые объекты
                db_manager = DatabaseManager(Config.DONATIONS_DB_FILE)
                device_manager = DeviceManager(db_manager)
                
                # Получаем Device ID
                device_id = device_manager.get_or_create_device_id()
                
                # Создаём API клиент
                api_client = create_api_client(use_mock=False)
                
                # Выполняем привязку
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                try:
                    result = loop.run_until_complete(
                        api_client.device_pair(code, device_id, "Desktop App")
                    )
                    
                    # Проверяем результат
                    if "error" in result:
                        self.window.after(0, lambda: self._on_pair_result(False, result["error"]))
                    else:
                        # Сохраняем информацию о привязке
                        device_manager.save_pairing_info(result)
                        self.window.after(0, lambda: self._on_pair_result(True, result))
                        
                finally:
                    loop.run_until_complete(api_client.close())
                    loop.close()
                    
            except Exception as e:
                logger.exception(f"Ошибка привязки: {e}")
                self.window.after(0, lambda: self._on_pair_result(False, str(e)))
        
        thread = threading.Thread(target=pair_thread, daemon=True)
        thread.start()
    
    def _on_pair_result(self, success: bool, result):
        """
        Обработка результата привязки
        
        Args:
            success: Успешность привязки
            result: Результат или ошибка
        """
        self.is_loading = False
        self._set_loading(False)
        
        if success:
            # Показываем успешное сообщение
            user_info = result if isinstance(result, dict) else {}
            username = user_info.get("username", "пользователь")
            
            self._set_status("✅ Успешно привязано!", "green")
            
            # Обновляем callback через немного
            self.window.after(1000, self._on_success)
        else:
            self._set_status("❌ Ошибка привязки", "red")
            messagebox.showerror("Ошибка привязки", str(result))
            self.code_entry.focus()
    
    def _on_success(self):
        """Обработка успешной привязки"""
        if self.on_pair_success:
            self.on_pair_success()
        
        self.window.quit()
    
    def _on_cancel(self):
        """Обработка отмены"""
        if self.on_cancel:
            self.on_cancel()
        else:
            self.window.quit()
    
    def _on_window_close(self):
        """Обработка закрытия окна"""
        if not self.is_loading:
            self._on_cancel()
    
    def _set_loading(self, loading: bool):
        """Установка состояния загрузки"""
        if loading:
            self.pair_button.config(state="disabled")
            self.cancel_button.config(state="disabled")
            self.code_entry.config(state="disabled")
        else:
            self.pair_button.config(state="normal")
            self.cancel_button.config(state="normal")
            self.code_entry.config(state="normal")
    
    def _set_status(self, text: str, color: str = "gray"):
        """
        Установка статуса
        
        Args:
            text: Текст статуса
            color: Цвет текста
        """
        self.status_label.config(text=text, foreground=color)

