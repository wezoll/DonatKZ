"""Main application window"""
import tkinter as tk
from tkinter import ttk
import logging
import time

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from .dashboard_tab import DashboardTab
from .settings_tab import SettingsTab
from .logs_tab import LogsTab
from .statistics_tab import StatisticsTab
from .notification_integration import NotificationIntegration
from core.pipeline_manager import PipelineManager
from auth import AuthManager, LoginWindow
from tray import TrayManager, PhoneLinkMonitor
from config import Config

logger = logging.getLogger(__name__)


class DonatKZApp:
    """
    Главное окно приложения DonatKZ Desktop
    
    Содержит:
    - Верхнюю панель со статусом и информацией о пользователе
    - Notebook с вкладками (Dashboard, Настройки, Логи)
    - Статус бар внизу
    - Интеграцию с Notification Listener
    """
    
    def __init__(self, root: tk.Tk):
        """
        Инициализация главного окна
        
        Args:
            root: Корневое Tk окно
        """
        self.root = root
        self.root.title(f"{Config.WINDOW_TITLE} {Config.WINDOW_VERSION}")
        
        # Инициализируем время последней активности
        self.last_activity = time.time()
        
        # Инициализируем переменные
        self.login_window = None
        
        # Логируем инициализацию
        logger.info("Инициализация главного окна...")
        
        # Устанавливаем размер и минимальные размеры окна
        logger.info("Устанавливаем размер окна...")
        self.root.geometry(
            f"{Config.WINDOW_DEFAULT_WIDTH}x{Config.WINDOW_DEFAULT_HEIGHT}"
        )
        self.root.minsize(Config.WINDOW_MIN_WIDTH, Config.WINDOW_MIN_HEIGHT)
        logger.info("Размер окна установлен")
        
        # Центрируем окно на экране
        logger.info("Центрируем окно...")
        self._center_window()
        logger.info("Окно отцентровано")
        
        # Настройка иконки (если есть)
        logger.info("Настройка иконки...")
        try:
            # self.root.iconbitmap("assets/icon.ico")
            pass
        except Exception as e:
            logger.warning(f"Не удалось загрузить иконку: {e}")
        logger.info("Иконка настроена")
        
        # Создаём интерфейс
        logger.info("📋 Создаём header...")
        self._create_header()
        logger.info("✅ Header создан")
        
        logger.info("📋 Создаём notebook...")
        self._create_notebook()
        logger.info("✅ Notebook создан")
        
        logger.info("📋 Создаём statusbar...")
        self._create_statusbar()
        logger.info("✅ Statusbar создан")
        
        # Инициализируем компоненты напрямую
        logger.info("🔧 ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТОВ...")
        
        # Инициализируем AuthManager
        self.auth_manager = AuthManager()
        
        # Инициализируем PhoneLinkMonitor
        self.phone_link_monitor = PhoneLinkMonitor()
        
        # Инициализируем TrayManager
        self.tray_manager = TrayManager(
            self.root,
            on_show=self._on_tray_show,
            on_hide=self._on_tray_hide,
            on_quit=self._on_tray_quit
        )
        
        # Запускаем TrayManager
        logger.info("🔧 Запуск TrayManager...")
        self.tray_manager.start()
        logger.info("✅ TrayManager запущен")
        
        # Инициализируем NotificationIntegration
        self.notification_integration = NotificationIntegration(self)
        
        # Инициализируем PipelineManager
        self.pipeline_manager = PipelineManager(self)
        
        # Инициализируем DatabaseManager для вкладки статистики
        # (используется из pipeline_manager)
        self.root.after(500, self._setup_statistics_tab)
        
        logger.info("✅ КОМПОНЕНТЫ ИНИЦИАЛИЗИРОВАНЫ!")
        
        # АВТОЗАПУСК СЛУШАТЕЛЯ УВЕДОМЛЕНИЙ
        logger.info("🔍 Запуск слушателя уведомлений...")
        self.root.after(1000, self._auto_start_listener)
        
        # Обработка закрытия окна (сворачивание в трей вместо закрытия)
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Проверяем начальный статус Phone Link
        logger.info("📱 Проверяем начальный статус Phone Link...")
        self._check_initial_phone_link_status()
        
        logger.info("Главное окно инициализировано")
    
    def _center_window(self):
        """Центрирование окна на экране"""
        self.root.update_idletasks()
        
        # Получаем размеры экрана и окна
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        window_width = self.root.winfo_width()
        window_height = self.root.winfo_height()
        
        # Вычисляем позицию
        x = (screen_width - window_width) // 2
        y = (screen_height - window_height) // 2
        
        self.root.geometry(f"+{x}+{y}")
    
    def _create_header(self):
        """Создание верхней панели со статусом"""
        header_frame = ttk.Frame(self.root)
        header_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Статус подключения
        self.status_label = ttk.Label(
            header_frame,
            text="🟢 Активен",
            font=("Segoe UI", 10, "bold")
        )
        self.status_label.pack(side=tk.LEFT, padx=5)
        
        # Разделитель
        ttk.Separator(header_frame, orient=tk.VERTICAL).pack(
            side=tk.LEFT, fill=tk.Y, padx=10
        )
        
        # Email пользователя (будет заполнен после авторизации)
        self.email_label = ttk.Label(
            header_frame,
            text="Не авторизован",
            font=("Segoe UI", 9)
        )
        self.email_label.pack(side=tk.LEFT, padx=5)
        
        # Кнопка настроек (справа)
        self.settings_button = ttk.Button(
            header_frame,
            text="⚙️",
            width=3,
            command=self._open_settings
        )
        self.settings_button.pack(side=tk.RIGHT, padx=5)
        
        # Индикатор Phone Link
        self.phone_link_label = ttk.Label(
            header_frame,
            text="📱 Phone Link: Проверка...",
            font=("Arial", 9),
            foreground="orange"
        )
        self.phone_link_label.pack(side=tk.RIGHT, padx=10)
        
        # Кнопка авторизации
        self.auth_button = ttk.Button(
            header_frame,
            text="🔑",
            width=3,
            command=self._show_login
        )
        self.auth_button.pack(side=tk.RIGHT, padx=5)
        
        # Кнопка запуска/остановки слушателя
        self.listener_button = ttk.Button(
            header_frame,
            text="🔍",
            width=3,
            command=self._toggle_listener
        )
        self.listener_button.pack(side=tk.RIGHT, padx=5)
    
    def _create_notebook(self):
        """Создание Notebook с вкладками"""
        # Создаём стиль для вкладок
        style = ttk.Style()
        style.configure("TNotebook.Tab", padding=[20, 10])
        
        # Notebook
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Создаём вкладки
        self.dashboard_tab = DashboardTab(self.notebook)
        self.settings_tab = SettingsTab(self.notebook)
        self.logs_tab = LogsTab(self.notebook)
        self.statistics_tab = StatisticsTab(self.notebook)
        
        # Добавляем вкладки в Notebook
        self.notebook.add(self.dashboard_tab.frame, text="📊 Dashboard")
        self.notebook.add(self.settings_tab.frame, text="⚙️ Настройки")
        self.notebook.add(self.logs_tab.frame, text="📋 Логи")
        self.notebook.add(self.statistics_tab.frame, text="📈 Статистика")
        
        # Биндим событие смены вкладки
        self.notebook.bind("<<NotebookTabChanged>>", self._on_tab_changed)
    
    def _create_statusbar(self):
        """Создание статус бара внизу окна"""
        statusbar_frame = ttk.Frame(self.root)
        statusbar_frame.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Разделитель
        ttk.Separator(statusbar_frame, orient=tk.HORIZONTAL).pack(
            fill=tk.X, side=tk.TOP
        )
        
        # Статус бар
        self.statusbar = ttk.Label(
            statusbar_frame,
            text="Готов к работе",
            relief=tk.FLAT,
            padding=(5, 2)
        )
        self.statusbar.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # Счётчик донатов за сессию (справа)
        self.donation_counter = ttk.Label(
            statusbar_frame,
            text="Донатов: 0",
            relief=tk.FLAT,
            padding=(5, 2)
        )
        self.donation_counter.pack(side=tk.RIGHT, padx=5)
    
    def _open_settings(self):
        """Открытие вкладки настроек"""
        self.notebook.select(1)  # Индекс вкладки Settings
    
    def _show_login(self):
        """Показать окно авторизации"""
        if self.login_window is None or not self.login_window.window.winfo_exists():
            self.login_window = LoginWindow(
                parent=self.root,
                auth_manager=self.auth_manager,
                on_success=self._on_login_success,
                on_cancel=self._on_login_cancel
            )
        else:
            self.login_window.show()
    
    def _on_login_success(self):
        """Обработка успешной авторизации"""
        try:
            # Получаем информацию о пользователе
            user_info = self.auth_manager.get_user_info()
            if user_info:
                email = user_info.get("email", "Пользователь")
                self.update_user_email(email)
                self.add_log_message("INFO", f"✅ Авторизация успешна: {email}")
            
            # Обновляем статус
            self.update_status("Авторизован", "green")
            
            # Инициализируем pipeline если нужно
            if self.pipeline_manager is None:
                self._initialize_pipeline_async()
            
        except Exception as e:
            logger.exception(f"Ошибка обработки успешной авторизации: {e}")
            self.add_log_message("ERROR", f"❌ Ошибка авторизации: {e}")
    
    def _on_login_cancel(self):
        """Обработка отмены авторизации"""
        self.add_log_message("INFO", "ℹ️ Авторизация отменена")
    
    def _initialize_pipeline_async(self):
        """Асинхронная инициализация pipeline"""
        import threading
        import asyncio
        
        def init_pipeline():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(self.initialize_full_pipeline())
            finally:
                loop.close()
        
        thread = threading.Thread(target=init_pipeline, daemon=True)
        thread.start()
    
    def _toggle_listener(self):
        """Переключение слушателя уведомлений"""
        if self.pipeline_manager.is_running:
            # Останавливаем
            self.pipeline_manager.stop()
            self.listener_button.config(text="🔍")
            self.add_log_message("INFO", "⏹️ Слушатель остановлен")
        else:
            # Получаем настройку Mock режима из настроек
            try:
                use_mock = self.settings_tab.mock_api_check.var.get()
                self.add_log_message("DEBUG", f"🔍 Получена настройка use_mock: {use_mock}")
            except Exception as e:
                # Если не удалось получить настройку, используем по умолчанию False (Real режим)
                use_mock = False
                self.add_log_message("WARNING", f"⚠️ Ошибка получения настройки: {e}, используем Real режим")
            
            # Запускаем с правильным режимом (используем pipeline_manager вместо notification_integration!)
            self.add_log_message("DEBUG", f"🔍 Запускаем pipeline с use_mock={use_mock}")
            self.pipeline_manager.use_mock_listener = use_mock
            
            # Инициализируем pipeline если нужно
            if not self.pipeline_manager.donation_pipeline:
                self._initialize_and_start_pipeline()
            else:
                self.pipeline_manager.start()
                self.listener_button.config(text="⏹️")
            
            # Логируем режим
            mode = "Mock" if use_mock else "Real"
            self.add_log_message("INFO", f"🔍 Слушатель запущен в режиме: {mode}")
            
            # Если Real режим, предупреждаем о Phone Link
            if not use_mock:
                self.add_log_message("WARNING", "⚠️ Убедитесь что Phone Link активен и подключен к телефону!")

    async def initialize_full_pipeline(self):
        """Инициализация полного pipeline"""
        try:
            if self.pipeline_manager is None:
                self.pipeline_manager = PipelineManager(
                    gui_app=self,
                    use_mock_listener=True,
                    use_mock_api=True
                )
                
                await self.pipeline_manager.initialize()
                
                if self.pipeline_manager.start():
                    self.add_log_message("INFO", "🚀 Полный pipeline запущен!")
                    self.update_status("Pipeline активен", "green")
                    return True
                else:
                    self.add_log_message("ERROR", "❌ Не удалось запустить pipeline")
                    return False
            else:
                self.add_log_message("INFO", "ℹ️ Pipeline уже инициализирован")
                return True
                
        except Exception as e:
            logger.exception(f"Ошибка инициализации pipeline: {e}")
            self.add_log_message("ERROR", f"❌ Ошибка pipeline: {e}")
            return False
    
    def _initialize_system_tray(self):
        """Инициализация System Tray"""
        try:
            # Создаём TrayManager
            self.tray_manager = TrayManager(
                main_window=self.root,
                on_show=self._on_tray_show,
                on_hide=self._on_tray_hide,
                on_quit=self._on_tray_quit
            )
            
            # Создаём PhoneLinkMonitor
            self.phone_link_monitor = PhoneLinkMonitor(
                on_status_change=self._on_phone_link_status_change,
                check_interval=3.0
            )
            
            # Запускаем мониторинг Phone Link
            if self.phone_link_monitor.start():
                self.add_log_message("INFO", "📱 Phone Link мониторинг запущен")
            else:
                self.add_log_message("WARNING", "⚠️ Phone Link мониторинг недоступен")
            
            # Запускаем System Tray
            if self.tray_manager.start():
                self.add_log_message("INFO", "🖥️ System Tray запущен")
                self.add_log_message("INFO", "💡 Приложение можно свернуть в трей")
            else:
                self.add_log_message("WARNING", "⚠️ System Tray недоступен")
            
        except Exception as e:
            logger.exception(f"Ошибка инициализации System Tray: {e}")
            self.add_log_message("ERROR", f"❌ Ошибка System Tray: {e}")
    
    def _on_tray_show(self):
        """Callback: показать окно из трея"""
        try:
            self.show()
            logger.info("Окно показано из трея")
        except Exception as e:
            logger.exception(f"Ошибка показа окна из трея: {e}")
    
    def _on_tray_hide(self):
        """Callback: скрыть окно в трей"""
        try:
            self.root.withdraw()
            logger.info("Окно скрыто в трей")
        except Exception as e:
            logger.exception(f"Ошибка скрытия окна в трей: {e}")
    
    def _on_tray_quit(self):
        """Callback: выход из приложения через трей"""
        try:
            logger.info("Выход из приложения через трей")
            self.cleanup()
            self.root.quit()
        except Exception as e:
            logger.exception(f"Ошибка выхода из приложения: {e}")
    
    def _on_phone_link_status_change(self, status: str):
        """
        Обработка изменения статуса Phone Link
        
        Args:
            status: Новый статус Phone Link
        """
        try:
            # Простая логика: либо работает (зеленый), либо не работает (красный)
            if "Работает" in status or "Подключено" in status or "успеш" in status.lower():
                self.phone_link_label.config(
                    text="📱 Phone Link: Работает",
                    foreground="green"
                )
            else:
                # Все остальное - красный
                self.phone_link_label.config(
                    text="📱 Phone Link: Не работает",
                    foreground="red"
                )
            
            # Обновляем трей
            if self.tray_manager:
                self.tray_manager.update_phone_link_status(status)
            
            # Логируем изменение
            self.add_log_message("INFO", f"📱 Phone Link статус: {status}")
            
        except Exception as e:
            logger.exception(f"Ошибка обработки статуса Phone Link: {e}")
    
    def update_phone_link_status(self, status: str):
        """
        Обновление статуса Phone Link извне
        
        Args:
            status: Статус Phone Link
        """
        # Используем root.after() для thread-safe обновления GUI
        self.root.after(0, lambda: self._on_phone_link_status_change(status))
    
    def _on_tab_changed(self, event):
        """
        Обработчик смены вкладки
        
        Args:
            event: Событие смены вкладки
        """
        current_tab = self.notebook.select()
        tab_text = self.notebook.tab(current_tab, "text")
        logger.debug(f"Переключение на вкладку: {tab_text}")
    
    def _check_initial_phone_link_status(self):
        """Проверка начального статуса Phone Link при запуске"""
        try:
            # Проверяем доступ к winsdk и можем ли мы получить слушатель
            from notification.listener import WINSDK_AVAILABLE
            
            if WINSDK_AVAILABLE:
                # Пробуем получить UserNotificationListener - это скажет нам работает ли Phone Link
                try:
                    from winsdk.windows.ui.notifications.management import UserNotificationListener
                    listener = UserNotificationListener.current
                    if listener:
                        # Phone Link доступен!
                        self.update_phone_link_status("Работает")
                    else:
                        self.update_phone_link_status("Не работает")
                except:
                    # winsdk доступен но Phone Link не работает
                    self.update_phone_link_status("Не работает")
            else:
                # winsdk не установлен - Phone Link не доступен
                self.update_phone_link_status("Не работает")
        except Exception as e:
            logger.warning(f"Ошибка проверки статуса Phone Link: {e}")
            self.update_phone_link_status("Не работает")
    
    def on_closing(self):
        """
        Обработчик закрытия окна
        
        Сворачивает окно в трей вместо закрытия.
        Для полного выхода используйте меню трея.
        """
        logger.info("📱 Сворачивание окна в трей...")
        
        try:
            # Скрываем окно в трей (вместо закрытия)
            self._on_tray_hide()
            
        except Exception as e:
            logger.exception(f"Ошибка при сворачивании в трей: {e}")
            # Если ошибка - просто скрываем
            self.root.withdraw()
    
    def cleanup(self):
        """Очистка ресурсов приложения"""
        try:
            logger.info("Очистка ресурсов приложения...")
            
            # Останавливаем все фоновые процессы
            if self.notification_integration:
                self.notification_integration.stop_listener()
            
            if self.pipeline_manager:
                self.pipeline_manager.stop()
            
            if self.phone_link_monitor:
                self.phone_link_monitor.stop()
            
            if self.tray_manager:
                self.tray_manager.stop()
            
            logger.info("Ресурсы очищены")
            
        except Exception as e:
            logger.exception(f"Ошибка при очистке ресурсов: {e}")
    
    def _initialize_components(self):
        """Инициализация компонентов приложения"""
        try:
            logger.info("🔧 НАЧАЛО ИНИЦИАЛИЗАЦИИ КОМПОНЕНТОВ...")
            logger.info("Инициализация компонентов...")
            
            # Инициализируем AuthManager
            logger.info("🔧 Инициализация AuthManager...")
            self.auth_manager = AuthManager()
            logger.info("✅ AuthManager инициализирован")
            
            # Инициализируем PhoneLinkMonitor
            logger.info("🔧 Инициализация PhoneLinkMonitor...")
            self.phone_link_monitor = PhoneLinkMonitor()
            logger.info("✅ PhoneLinkMonitor инициализирован")
            
            # Инициализируем TrayManager
            logger.info("🔧 Инициализация TrayManager...")
            self.tray_manager = TrayManager(self)
            logger.info("✅ TrayManager инициализирован")
            
            # Инициализируем NotificationIntegration
            logger.info("🔧 Инициализация NotificationIntegration...")
            self.notification_integration = NotificationIntegration(self)
            logger.info("✅ NotificationIntegration инициализирован")
            
            # Инициализируем PipelineManager
            logger.info("🔧 Инициализация PipelineManager...")
            self.pipeline_manager = PipelineManager(self)
            logger.info("✅ PipelineManager инициализирован")
            
            logger.info("🎉 ВСЕ КОМПОНЕНТЫ ИНИЦИАЛИЗИРОВАНЫ УСПЕШНО!")
            
        except Exception as e:
            logger.exception(f"❌ ОШИБКА ИНИЦИАЛИЗАЦИИ КОМПОНЕНТОВ: {e}")
            raise
    
    def _on_donation_received(self, donation_data):
        """Обработка полученного доната"""
        try:
            logger.info(f"Получен донат: {donation_data}")
            # Здесь можно добавить логику обработки доната
            # Например, обновление статистики, отправка на сервер и т.д.
        except Exception as e:
            logger.exception(f"Ошибка обработки доната: {e}")
    
    def _start_heartbeat(self):
        """Запуск heartbeat для предотвращения вылетов"""
        try:
            logger.info("Запуск heartbeat...")
            
            def heartbeat():
                try:
                    # Проверяем, что окно ещё существует
                    if self.root and self.root.winfo_exists():
                        # Обновляем время последней активности
                        self.last_activity = time.time()
                        
                        # Логируем heartbeat каждую минуту для отладки
                        current_time = int(time.time())
                        if current_time % 60 == 0:
                            logger.info("💓 Heartbeat: приложение работает")
                        
                        # Планируем следующий heartbeat через 30 секунд
                        self.root.after(30000, heartbeat)
                    else:
                        logger.warning("Окно больше не существует, останавливаем heartbeat")
                except Exception as e:
                    logger.exception(f"Ошибка в heartbeat: {e}")
            
            # Запускаем первый heartbeat
            self.root.after(1000, heartbeat)
            
        except Exception as e:
            logger.exception(f"Ошибка запуска heartbeat: {e}")
    
    def show(self):
        """Показать окно (если было скрыто)"""
        self.root.deiconify()
        self.root.lift()
        self.root.focus_force()
    
    def update_status(self, status: str, color: str = "green"):
        """
        Обновить статус подключения
        
        Args:
            status: Текст статуса
            color: Цвет индикатора (green, yellow, red)
        """
        color_indicators = {
            "green": "🟢",
            "yellow": "🟡",
            "red": "🔴"
        }
        indicator = color_indicators.get(color, "⚪")
        self.status_label.config(text=f"{indicator} {status}")
    
    def update_user_email(self, email: str):
        """
        Обновить отображаемый email пользователя
        
        Args:
            email: Email пользователя
        """
        self.email_label.config(text=email)
    
    def update_statusbar(self, message: str):
        """
        Обновить текст в статус баре
        
        Args:
            message: Сообщение для отображения
        """
        self.statusbar.config(text=message)
    
    def update_donation_counter(self, count: int):
        """
        Обновить счётчик донатов
        
        Args:
            count: Количество донатов
        """
        self.donation_counter.config(text=f"Донатов: {count}")
    
    def add_donation_to_dashboard(self, donation_data: dict):
        """
        Добавить донат в Dashboard
        
        Args:
            donation_data: Данные доната
        """
        self.dashboard_tab.add_donation(donation_data)
    
    def add_log_message(self, level: str, message: str):
        """
        Добавить лог сообщение
        
        Args:
            level: Уровень (INFO, WARNING, ERROR)
            message: Текст сообщения
        """
        self.logs_tab.add_log(level, message)
    
    def _setup_statistics_tab(self):
        """Инициализация вкладки статистики с DatabaseManager"""
        try:
            if (hasattr(self.pipeline_manager, 'donation_pipeline') and 
                self.pipeline_manager.donation_pipeline):
                db_manager = self.pipeline_manager.donation_pipeline.get_db_manager()
                self.statistics_tab.set_db_manager(db_manager)
                logger.info("✅ DatabaseManager установлен в StatisticsTab")
        except Exception as e:
            logger.warning(f"⚠️ Не удалось инициализировать StatisticsTab: {e}")
    
    def refresh_statistics_on_donation(self):
        """Обновить статистику на вкладке при новом донате"""
        try:
            if hasattr(self.statistics_tab, 'refresh_on_new_donation'):
                self.statistics_tab.refresh_on_new_donation()
        except Exception as e:
            logger.debug(f"Ошибка обновления статистики: {e}")

    def _auto_start_listener(self):
        """Автоматический запуск слушателя уведомлений после инициализации"""
        try:
            # Получаем настройку Mock режима из настроек
            try:
                use_mock = self.settings_tab.mock_api_check.var.get()
                self.add_log_message("DEBUG", f"🔍 Получена настройка use_mock для автозапуска: {use_mock}")
            except Exception as e:
                # Если не удалось получить настройку, используем по умолчанию False (Real режим)
                use_mock = False
                self.add_log_message("WARNING", f"⚠️ Ошибка получения настройки для автозапуска: {e}, используем Real режим")
            
            # Запускаем с правильным режимом (используем pipeline_manager вместо notification_integration!)
            self.add_log_message("DEBUG", f"🔍 Автоматический запуск pipeline с use_mock={use_mock}")
            self.pipeline_manager.use_mock_listener = use_mock
            self.pipeline_manager.use_mock_api = False  # ВСЕГДА используем реальный API, не mock!
            
            # Инициализируем и запускаем pipeline
            self._initialize_and_start_pipeline()
            self.listener_button.config(text="⏹️")
            
            # Логируем режим
            mode = "Mock" if use_mock else "Real"
            self.add_log_message("INFO", f"🔍 Слушатель запущен в режиме: {mode} (автоматически)")
            
            # Если Real режим, предупреждаем о Phone Link
            if not use_mock:
                self.add_log_message("WARNING", "⚠️ Убедитесь что Phone Link активен и подключен к телефону!")
        except Exception as e:
            logger.exception(f"Ошибка автоматического запуска слушателя: {e}")
    
    def _initialize_and_start_pipeline(self):
        """Асинхронная инициализация и запуск pipeline"""
        import threading
        import asyncio
        
        def init_and_start():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                # Инициализируем pipeline если еще не инициализирован
                if not self.pipeline_manager.donation_pipeline:
                    logger.info("🚀 Инициализирую Pipeline Manager...")
                    self.add_log_message("INFO", "🚀 Инициализирую Pipeline Manager...")
                    
                    loop.run_until_complete(self.pipeline_manager.initialize())
                    
                    logger.info("✅ Pipeline Manager инициализирован")
                    self.add_log_message("INFO", "✅ Pipeline Manager инициализирован")
                    
                    # Проверяем инициализацию API
                    if self.pipeline_manager.donation_pipeline and self.pipeline_manager.donation_pipeline.api_client:
                        logger.info("✅ API клиент инициализирован")
                        self.add_log_message("INFO", "✅ API клиент инициализирован")
                    else:
                        logger.warning("⚠️ API клиент НЕ инициализирован!")
                        self.add_log_message("WARNING", "⚠️ API клиент НЕ инициализирован!")
                else:
                    logger.info("ℹ️ Pipeline уже инициализирован")
                    self.add_log_message("INFO", "ℹ️ Pipeline уже инициализирован")
                
                # Запускаем pipeline
                logger.info("🚀 Запускаю Pipeline...")
                self.add_log_message("INFO", "🚀 Запускаю Pipeline...")
                self.pipeline_manager.start()
                
                logger.info("✅ Pipeline запущен!")
                self.add_log_message("INFO", "✅ Pipeline запущен!")
                
            except Exception as e:
                logger.exception(f"Ошибка инициализации pipeline: {e}")
                self.add_log_message("ERROR", f"❌ Ошибка: {e}")
            finally:
                loop.close()
        
        thread = threading.Thread(target=init_and_start, daemon=True)
        thread.start()

    def run(self):
        """Запуск главного цикла приложения"""
        try:
            logger.info("Запуск главного цикла Tkinter")
            
            # Запускаем heartbeat для предотвращения вылетов
            self._start_heartbeat()
            
            # Добавляем обработчик закрытия окна
            self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
            
            # Запускаем главный цикл Tkinter
            self.root.mainloop()
            
        except Exception as e:
            logger.exception(f"Ошибка в главном цикле: {e}")
        finally:
            logger.info("Главный цикл завершён")