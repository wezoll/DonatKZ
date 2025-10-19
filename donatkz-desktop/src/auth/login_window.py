"""
Login Window

Tkinter окно авторизации с полями email/password
и интеграцией с AuthManager.
"""
import tkinter as tk
from tkinter import ttk, messagebox
import logging
import threading
import webbrowser
from typing import Optional, Callable

from .auth_manager import AuthManager

logger = logging.getLogger(__name__)


class LoginWindow:
    """
    Окно авторизации
    
    Центрированное окно 400x300px с полями email/password,
    чекбоксом "Запомнить меня" и кнопками входа/регистрации.
    """
    
    def __init__(
        self,
        parent,
        auth_manager: AuthManager,
        on_success: Optional[Callable] = None,
        on_cancel: Optional[Callable] = None
    ):
        """
        Инициализация окна авторизации
        
        Args:
            parent: Родительское окно
            auth_manager: Менеджер авторизации
            on_success: Callback при успешной авторизации
            on_cancel: Callback при отмене
        """
        self.parent = parent
        self.auth_manager = auth_manager
        self.on_success = on_success
        self.on_cancel = on_cancel
        
        # Создаём окно
        self.window = tk.Toplevel(parent)
        self.window.title("DonatKZ - Вход")
        self.window.geometry("400x300")
        self.window.resizable(False, False)
        
        # Центрируем окно
        self._center_window()
        
        # Настройка закрытия окна
        self.window.protocol("WM_DELETE_WINDOW", self._on_cancel)
        
        # Создаём интерфейс
        self._create_ui()
        
        # Загружаем сохранённые данные
        self._load_saved_credentials()
        
        logger.info("LoginWindow инициализировано")
    
    def _center_window(self):
        """Центрирование окна на экране"""
        self.window.update_idletasks()
        
        # Получаем размеры экрана и окна
        screen_width = self.window.winfo_screenwidth()
        screen_height = self.window.winfo_screenheight()
        window_width = 400
        window_height = 300
        
        # Вычисляем позицию
        x = (screen_width - window_width) // 2
        y = (screen_height - window_height) // 2
        
        self.window.geometry(f"{window_width}x{window_height}+{x}+{y}")
    
    def _create_ui(self):
        """Создание интерфейса"""
        # Главный фрейм
        main_frame = ttk.Frame(self.window, padding=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Заголовок
        title_label = ttk.Label(
            main_frame,
            text="DonatKZ",
            font=("Segoe UI", 20, "bold")
        )
        title_label.pack(pady=(0, 20))
        
        subtitle_label = ttk.Label(
            main_frame,
            text="Вход в аккаунт",
            font=("Segoe UI", 12)
        )
        subtitle_label.pack(pady=(0, 30))
        
        # Форма авторизации
        form_frame = ttk.Frame(main_frame)
        form_frame.pack(fill=tk.X, pady=(0, 20))
        
        # Email
        email_label = ttk.Label(form_frame, text="Email:")
        email_label.pack(anchor=tk.W, pady=(0, 5))
        
        self.email_entry = ttk.Entry(form_frame, width=40, font=("Segoe UI", 10))
        self.email_entry.pack(fill=tk.X, pady=(0, 15))
        
        # Пароль
        password_label = ttk.Label(form_frame, text="Пароль:")
        password_label.pack(anchor=tk.W, pady=(0, 5))
        
        self.password_entry = ttk.Entry(
            form_frame, 
            width=40, 
            show="*", 
            font=("Segoe UI", 10)
        )
        self.password_entry.pack(fill=tk.X, pady=(0, 15))
        
        # Чекбокс "Запомнить меня"
        self.remember_var = tk.BooleanVar()
        remember_check = ttk.Checkbutton(
            form_frame,
            text="Запомнить меня",
            variable=self.remember_var
        )
        remember_check.pack(anchor=tk.W, pady=(0, 20))
        
        # Кнопки
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.pack(fill=tk.X, pady=(0, 20))
        
        # Кнопка входа
        self.login_button = ttk.Button(
            buttons_frame,
            text="Войти",
            command=self._on_login,
            style="Accent.TButton"
        )
        self.login_button.pack(side=tk.LEFT, padx=(0, 10))
        
        # Кнопка отмены
        cancel_button = ttk.Button(
            buttons_frame,
            text="Отмена",
            command=self._on_cancel
        )
        cancel_button.pack(side=tk.LEFT)
        
        # Ссылка на регистрацию
        register_frame = ttk.Frame(main_frame)
        register_frame.pack(fill=tk.X)
        
        register_label = ttk.Label(
            register_frame,
            text="Нет аккаунта?",
            font=("Segoe UI", 9)
        )
        register_label.pack(side=tk.LEFT)
        
        register_link = ttk.Label(
            register_frame,
            text="Регистрация",
            font=("Segoe UI", 9, "underline"),
            foreground="blue",
            cursor="hand2"
        )
        register_link.pack(side=tk.LEFT, padx=(5, 0))
        register_link.bind("<Button-1>", self._on_register_click)
        
        # Статус
        self.status_label = ttk.Label(
            main_frame,
            text="",
            font=("Segoe UI", 9),
            foreground="gray"
        )
        self.status_label.pack(pady=(10, 0))
        
        # Биндим Enter для входа
        self.window.bind("<Return>", lambda e: self._on_login())
        self.window.bind("<Escape>", lambda e: self._on_cancel())
        
        # Фокус на поле email
        self.email_entry.focus()
    
    def _load_saved_credentials(self):
        """Загрузка сохранённых учётных данных"""
        try:
            saved_email = self.auth_manager.get_saved_email()
            if saved_email:
                self.email_entry.insert(0, saved_email)
                self.remember_var.set(True)
                # Фокус на поле пароля
                self.password_entry.focus()
            else:
                # Фокус на поле email
                self.email_entry.focus()
        except Exception as e:
            logger.warning(f"Не удалось загрузить сохранённые данные: {e}")
    
    def _on_login(self):
        """Обработка нажатия кнопки входа"""
        email = self.email_entry.get().strip()
        password = self.password_entry.get()
        remember = self.remember_var.get()
        
        # Валидация
        if not email:
            messagebox.showerror("Ошибка", "Введите email")
            self.email_entry.focus()
            return
        
        if not password:
            messagebox.showerror("Ошибка", "Введите пароль")
            self.password_entry.focus()
            return
        
        if "@" not in email:
            messagebox.showerror("Ошибка", "Введите корректный email")
            self.email_entry.focus()
            return
        
        # Блокируем UI
        self._set_loading(True)
        self._set_status("Выполняется вход...")
        
        # Запускаем авторизацию в отдельном потоке
        thread = threading.Thread(
            target=self._perform_login,
            args=(email, password, remember),
            daemon=True
        )
        thread.start()
    
    def _perform_login(self, email: str, password: str, remember: bool):
        """
        Выполнение авторизации в отдельном потоке
        
        Args:
            email: Email пользователя
            password: Пароль
            remember: Запомнить пользователя
        """
        try:
            # Выполняем авторизацию
            success, result = self.auth_manager.login(email, password, remember)
            
            # Обновляем UI в главном потоке
            self.window.after(0, lambda: self._on_login_result(success, result))
            
        except Exception as e:
            logger.exception(f"Ошибка авторизации: {e}")
            self.window.after(0, lambda: self._on_login_result(False, str(e)))
    
    def _on_login_result(self, success: bool, result):
        """
        Обработка результата авторизации
        
        Args:
            success: Успешность авторизации
            result: Результат или сообщение об ошибке
        """
        self._set_loading(False)
        
        if success:
            self._set_status("Вход выполнен успешно!")
            
            # Небольшая задержка для показа статуса
            self.window.after(1000, self._on_success)
        else:
            self._set_status("")
            messagebox.showerror("Ошибка входа", str(result))
            self.password_entry.focus()
    
    def _on_success(self):
        """Обработка успешной авторизации"""
        if self.on_success:
            self.on_success()
        
        self.window.destroy()
    
    def _on_cancel(self):
        """Обработка отмены"""
        if self.on_cancel:
            self.on_cancel()
        
        self.window.destroy()
    
    def _on_register_click(self, event):
        """Обработка клика по ссылке регистрации"""
        try:
            # Открываем страницу регистрации в браузере
            webbrowser.open("https://donatkz.com/register")
        except Exception as e:
            logger.error(f"Не удалось открыть браузер: {e}")
            messagebox.showinfo(
                "Регистрация",
                "Перейдите на сайт https://donatkz.com/register для регистрации"
            )
    
    def _set_loading(self, loading: bool):
        """
        Установка состояния загрузки
        
        Args:
            loading: True если загрузка, False если нет
        """
        if loading:
            self.login_button.config(text="Вход...", state=tk.DISABLED)
            self.email_entry.config(state=tk.DISABLED)
            self.password_entry.config(state=tk.DISABLED)
            self.remember_var.set(False)  # Отключаем чекбокс
        else:
            self.login_button.config(text="Войти", state=tk.NORMAL)
            self.email_entry.config(state=tk.NORMAL)
            self.password_entry.config(state=tk.NORMAL)
    
    def _set_status(self, message: str):
        """
        Установка статусного сообщения
        
        Args:
            message: Текст сообщения
        """
        self.status_label.config(text=message)
    
    def show(self):
        """Показать окно"""
        self.window.deiconify()
        self.window.lift()
        self.window.focus_force()
    
    def hide(self):
        """Скрыть окно"""
        self.window.withdraw()
    
    def destroy(self):
        """Уничтожить окно"""
        self.window.destroy()

