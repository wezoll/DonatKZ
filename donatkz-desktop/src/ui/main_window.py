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
from .notification_integration import NotificationIntegration
from core.pipeline_manager import PipelineManager
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
        
        # Настройка иконки окна
        logger.info("Настройка иконки окна...")
        self._set_window_icon()
        logger.info("Иконка настроена")
    
    def _set_window_icon(self):
        """Установка иконки окна из PNG файла"""
        try:
            from pathlib import Path
            from PIL import Image
            import tempfile
            
            logo_path = Config.LOGO_PATH
            
            if not logo_path.exists():
                logger.debug(f"Логотип не найден: {logo_path}")
                return
            
            # Загружаем PNG
            try:
                logo_image = Image.open(logo_path)
                
                # Конвертируем PNG в ICO для Windows
                # Создаём временный ICO файл
                with tempfile.NamedTemporaryFile(suffix='.ico', delete=False) as tmp_file:
                    ico_path = tmp_file.name
                    
                    # Масштабируем изображение до основного размера (256x256)
                    main_size = (256, 256)
                    if logo_image.size != main_size:
                        logo_image = logo_image.resize(main_size, Image.Resampling.LANCZOS)
                    
                    # Конвертируем в RGBA если нужно
                    if logo_image.mode != 'RGBA':
                        logo_image = logo_image.convert('RGBA')
                    
                    # Сохраняем как ICO (PIL автоматически создаст несколько размеров)
                    logo_image.save(ico_path, format='ICO')
                
                # Устанавливаем иконку через iconbitmap (работает на Windows)
                self.root.iconbitmap(ico_path)
                
                # Удаляем временный файл после установки (через небольшую задержку)
                def cleanup():
                    try:
                        Path(ico_path).unlink()
                    except:
                        pass
                self.root.after(1000, cleanup)  # Удаляем через 1 секунду
                
                logger.info(f"✅ Иконка окна установлена из {logo_path.name}")
                    
            except Exception as e:
                logger.warning(f"Не удалось установить иконку: {e}")
                
        except Exception as e:
            logger.warning(f"Ошибка установки иконки окна: {e}")
        
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
        
        # Инициализируем PhoneLinkMonitor
        self.phone_link_monitor = PhoneLinkMonitor()
        
        # Инициализируем TrayManager
        self.tray_manager = TrayManager(
            main_window=self,
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
        
        logger.info("✅ КОМПОНЕНТЫ ИНИЦИАЛИЗИРОВАНЫ!")
        
        # АВТОЗАПУСК СЛУШАТЕЛЯ УВЕДОМЛЕНИЙ
        logger.info("🔍 Запуск слушателя уведомлений...")
        self.root.after(1000, self._auto_start_listener)
        
        # Обработка закрытия окна (сворачивание в трей вместо закрытия)
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Проверяем начальный статус Phone Link
        logger.info("📱 Проверяем начальный статус Phone Link...")
        self._check_initial_phone_link_status()
        
        # Загружаем информацию о пользователе из БД
        logger.info("👤 Загружаем информацию о пользователе...")
        self.root.after(500, self._load_user_info_from_db)
    
    def _load_initial_stats(self):
        """Загрузить начальную статистику с API"""
        try:
            logger.info("📊 Загружаем начальную статистику с Backend...")
            self.dashboard_tab._load_stats_from_api()
        except Exception as e:
            logger.exception(f"❌ Ошибка загрузки начальной статистики: {e}")
        
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
        
        # Информация о пользователе (будет заполнена после авторизации)
        self.user_label = ttk.Label(
            header_frame,
            text="Не авторизован",
            font=("Segoe UI", 9)
        )
        self.user_label.pack(side=tk.LEFT, padx=5)
        
        # Индикатор Phone Link
        self.phone_link_label = ttk.Label(
            header_frame,
            text="📱 Phone Link: Проверка...",
            font=("Arial", 9),
            foreground="orange"
        )
        self.phone_link_label.pack(side=tk.RIGHT, padx=10)
        
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
        
        # Создаём вкладку Dashboard
        self.dashboard_tab = DashboardTab(self.notebook)
        # Устанавливаем ссылку на главное приложение
        self.dashboard_tab.set_gui_app(self)
        self.notebook.add(self.dashboard_tab.frame, text="📊 Dashboard")
        
        # Вкладка Настройки (pipeline_manager передаём после инициализации)
        self.settings_tab = SettingsTab(self.notebook, pipeline=None)
        self.notebook.add(self.settings_tab.frame, text="⚙️ Настройки")
        
        # Вкладка Логи
        self.logs_tab = LogsTab(self.notebook)
        self.notebook.add(self.logs_tab.frame, text="📝 Логи")
        
        # Загружаем статистику с API после инициализации
        self.root.after(2000, self._load_initial_stats)
    
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
            # Обновляем статус в трее
            if self.tray_manager:
                self.tray_manager.update_listener_status("Остановлен")
        else:
            # Режим Real (единственный доступный)
            
            # Инициализируем pipeline если нужно
            if not self.pipeline_manager.donation_pipeline:
                self._initialize_and_start_pipeline()
            else:
                self.pipeline_manager.start()
                self.listener_button.config(text="⏹️")
                # Обновляем статус в трее
                if self.tray_manager:
                    self.tray_manager.update_listener_status("Запущен")
            
            logger.info("🔍 Слушатель запущен в режиме: Real")

    async def initialize_full_pipeline(self):
        """Инициализация полного pipeline"""
        try:
            if self.pipeline_manager is None:
                self.pipeline_manager = PipelineManager(gui_app=self)
                
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
                # Обновляем статус в трее
                if self.tray_manager:
                    self.tray_manager.update_listener_status("Остановлен")
            
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
    
    def _load_user_info_from_db(self):
        """Загрузить информацию о пользователе из БД и обновить UI"""
        try:
            # Получаем DatabaseManager из pipeline_manager
            if (hasattr(self.pipeline_manager, 'donation_pipeline') and 
                self.pipeline_manager.donation_pipeline):
                db_manager = self.pipeline_manager.donation_pipeline.get_db_manager()
            else:
                # Fallback - создаём новый
                from database.db_manager import DatabaseManager
                from config import Config
                db_manager = DatabaseManager(Config.DONATIONS_DB_FILE)
            
            # Загружаем данные из БД
            username = db_manager.get_setting("username")
            subscription_tier = db_manager.get_setting("subscription_tier")
            email = db_manager.get_setting("email")
            
            if username:
                # Формируем текст для отображения
                tier_text = subscription_tier or "FREE"
                tier_emoji = {
                    "FREE": "🆓",
                    "BASIC": "⭐",
                    "PREMIUM": "💎"
                }.get(tier_text, "🆓")
                
                user_text = f"👤 {username} | {tier_emoji} {tier_text}"
                self.user_label.config(text=user_text)
                
                logger.info(f"✅ Загружена информация о пользователе: {username} ({tier_text})")
                self.add_log_message("INFO", f"✅ Авторизован: {username} ({tier_text})")
                
                # Обновляем статус
                self.update_status("Авторизован", "green")
            else:
                logger.warning("⚠️ Информация о пользователе не найдена в БД")
                self.user_label.config(text="Не авторизован")
                
        except Exception as e:
            logger.exception(f"❌ Ошибка загрузки информации о пользователе: {e}")
    
    def update_user_info(self, username: str = None, email: str = None, subscription_tier: str = None):
        """
        Обновить отображаемую информацию о пользователе
        
        Args:
            username: Имя пользователя
            email: Email пользователя
            subscription_tier: Тариф подписки
        """
        if username:
            tier_text = subscription_tier or "FREE"
            tier_emoji = {
                "FREE": "🆓",
                "BASIC": "⭐",
                "PREMIUM": "💎"
            }.get(tier_text, "🆓")
            
            user_text = f"👤 {username} | {tier_emoji} {tier_text}"
            self.user_label.config(text=user_text)
    
    def update_user_email(self, email: str):
        """
        Обновить отображаемый email пользователя (legacy метод)
        
        Args:
            email: Email пользователя
        """
        # Для обратной совместимости просто перезагружаем данные из БД
        self._load_user_info_from_db()
    
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
        Добавить лог сообщение (legacy метод для обратной совместимости)
        
        Args:
            level: Уровень (INFO, WARNING, ERROR)
            message: Текст сообщения
        """
        # Просто логируем в файл, GUI логов больше нет
        logger.log(getattr(logging, level, logging.INFO), message)
    
    def _auto_start_listener(self):
        """Автоматический запуск слушателя уведомлений после инициализации"""
        try:
            logger.info("🚀 Автозапуск слушателя уведомлений...")
            self.add_log_message("INFO", "🚀 Автозапуск слушателя...")
            
            # Режим Real (единственный доступный)
            
            # Инициализируем и запускаем pipeline
            self._initialize_and_start_pipeline()
            self.listener_button.config(text="⏹️")
            
            self.add_log_message("INFO", "🔍 Слушатель запущен в режиме: Real (автоматически)")
            self.add_log_message("INFO", "⚠️ Убедитесь что Phone Link активен и подключен к телефону!")
            
        except Exception as e:
            logger.exception(f"❌ КРИТИЧЕСКАЯ ОШИБКА автозапуска слушателя: {e}")
            self.add_log_message("ERROR", f"❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")
    
    def _initialize_and_start_pipeline(self):
        """Асинхронная инициализация и запуск pipeline"""
        import threading
        import asyncio
        
        def init_and_start():
            loop = None
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                # Инициализируем pipeline если еще не инициализирован
                if not self.pipeline_manager.donation_pipeline:
                    logger.info("🚀 Инициализирую Pipeline Manager...")
                    self.add_log_message("INFO", "🚀 Инициализирую Pipeline Manager...")
                    
                    # Инициализируем БЕЗ email/password (используем device_token из БД)
                    loop.run_until_complete(self.pipeline_manager.initialize())
                    
                    logger.info("✅ Pipeline Manager инициализирован")
                    self.add_log_message("INFO", "✅ Pipeline Manager инициализирован")
                    
                    # Проверяем инициализацию
                    if not self.pipeline_manager.donation_pipeline:
                        logger.error("❌ Donation Pipeline НЕ создан после initialize()!")
                        self.add_log_message("ERROR", "❌ Donation Pipeline НЕ создан!")
                        return
                    
                    if not self.pipeline_manager.notification_listener:
                        logger.error("❌ Notification Listener НЕ создан после initialize()!")
                        self.add_log_message("ERROR", "❌ Notification Listener НЕ создан!")
                        return
                    
                    logger.info("✅ Все компоненты созданы")
                    self.add_log_message("INFO", "✅ Все компоненты созданы")
                    
                    # Передаём donation_pipeline в settings_tab для reload после сохранения
                    try:
                        if hasattr(self, 'settings_tab'):
                            self.root.after(0, lambda: setattr(
                                self.settings_tab, '_pipeline',
                                self.pipeline_manager.donation_pipeline
                            ))
                    except Exception:
                        pass
                else:
                    logger.info("ℹ️ Pipeline уже инициализирован")
                    self.add_log_message("INFO", "ℹ️ Pipeline уже инициализирован")
                
                # Запускаем pipeline
                logger.info("🚀 Запускаю Pipeline...")
                self.add_log_message("INFO", "🚀 Запускаю Pipeline...")
                
                start_result = self.pipeline_manager.start()
                
                if start_result:
                    logger.info("✅ Pipeline запущен!")
                    self.add_log_message("INFO", "✅ Pipeline запущен!")
                    
                    # Обновляем статус в трее
                    if self.tray_manager:
                        self.tray_manager.update_listener_status("Запущен")
                    
                    # Проверяем что слушатель действительно запущен
                    if self.pipeline_manager.notification_listener:
                        listener_running = getattr(self.pipeline_manager.notification_listener, 'is_running', False)
                        logger.info(f"📱 Слушатель уведомлений: {'✅ запущен' if listener_running else '❌ НЕ запущен'}")
                        self.add_log_message("INFO", f"📱 Слушатель: {'✅ запущен' if listener_running else '❌ НЕ запущен'}")
                        
                        if not listener_running:
                            logger.error("❌ Слушатель создан, но НЕ запущен!")
                            self.add_log_message("ERROR", "❌ Слушатель создан, но НЕ запущен!")
                            if self.tray_manager:
                                self.tray_manager.update_listener_status("Ошибка")
                    else:
                        logger.error("❌ Notification Listener не создан!")
                        self.add_log_message("ERROR", "❌ Notification Listener не создан!")
                        if self.tray_manager:
                            self.tray_manager.update_listener_status("Ошибка")
                else:
                    logger.error("❌ Не удалось запустить Pipeline!")
                    self.add_log_message("ERROR", "❌ Не удалось запустить Pipeline!")
                
            except Exception as e:
                logger.exception(f"❌ КРИТИЧЕСКАЯ ОШИБКА инициализации pipeline: {e}")
                self.add_log_message("ERROR", f"❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")
            finally:
                if loop and not loop.is_closed():
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