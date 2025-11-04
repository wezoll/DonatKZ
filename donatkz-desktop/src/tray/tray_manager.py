"""
System Tray Manager

Управление иконкой в системном трее Windows с контекстным меню
и интеграцией с главным окном приложения.
"""
import tkinter as tk
import logging
import threading
from typing import Optional, Callable, Dict, Any
from pathlib import Path

try:
    import pystray
    from pystray import MenuItem as item
    from PIL import Image, ImageDraw
    TRAY_AVAILABLE = True
except ImportError:
    TRAY_AVAILABLE = False
    # Создаём заглушки для тестов
    class MockImage:
        @staticmethod
        def new(*args, **kwargs):
            return MockImage()
        @staticmethod
        def ellipse(*args, **kwargs):
            pass
        @staticmethod
        def text(*args, **kwargs):
            pass
    Image = MockImage
    ImageDraw = MockImage
    logging.warning("System Tray недоступен. Установите pystray: pip install pystray pillow")

logger = logging.getLogger(__name__)


class TrayManager:
    """
    Менеджер системного трея
    
    Управляет:
    - Иконкой в трее Windows
    - Контекстным меню
    - Показать/скрыть главное окно
    - Статусом приложения
    - Интеграцией с Phone Link
    """
    
    def __init__(
        self,
        main_window,
        on_show: Optional[Callable] = None,
        on_hide: Optional[Callable] = None,
        on_quit: Optional[Callable] = None
    ):
        """
        Инициализация менеджера трея
        
        Args:
            main_window: Главное окно приложения (может быть tk.Tk или DonatKZApp)
            on_show: Callback при показе окна
            on_hide: Callback при скрытии окна
            on_quit: Callback при выходе
        """
        # Если это tk.Tk, сохраняем как есть, иначе пытаемся получить root
        if hasattr(main_window, 'root'):
            self.root_window = main_window.root
            self.app_window = main_window
        else:
            self.root_window = main_window
            self.app_window = main_window
        
        self.on_show = on_show
        self.on_hide = on_hide
        self.on_quit = on_quit
        
        # Состояние
        self.is_running = False
        self.icon = None
        self.thread = None
        
        # Статус
        self.app_status = "Неактивен"
        self.phone_link_status = "Неизвестно"
        self.listener_status = "Остановлен"
        
        # Иконки
        self.icon_images = {}
        self._create_icons()
        
        logger.info("TrayManager инициализирован")
        logger.info(f"System Tray доступен: {TRAY_AVAILABLE}")
    
    def _create_icons(self):
        """Создание иконок для трея из логотипа"""
        try:
            from pathlib import Path
            from config import Config
            
            # Размеры иконок для трея
            icon_size = (64, 64)
            
            logo_path = Config.LOGO_PATH
            
            if logo_path.exists():
                # Загружаем логотип
                logo_image = Image.open(logo_path)
                
                # Конвертируем в RGBA если нужно
                if logo_image.mode != 'RGBA':
                    logo_image = logo_image.convert('RGBA')
                
                # Масштабируем до нужного размера
                logo_resized = logo_image.resize(icon_size, Image.Resampling.LANCZOS)
                
                # Используем логотип для всех статусов
                self.icon_images["active"] = logo_resized.copy()
                self.icon_images["inactive"] = logo_resized.copy()
                self.icon_images["warning"] = logo_resized.copy()
                self.icon_images["working"] = logo_resized.copy()
                
                logger.info(f"✅ Иконки трея загружены из {logo_path.name}")
            else:
                logger.warning(f"Логотип не найден: {logo_path}, используем дефолтные иконки")
                self._create_default_icons(icon_size)
            
        except Exception as e:
            logger.exception(f"Ошибка создания иконок: {e}")
            # Fallback - создаём дефолтные иконки
            self._create_default_icons((64, 64))
    
    def _create_default_icons(self, icon_size):
        """Создание дефолтных иконок (fallback)"""
        try:
            # Зелёная иконка (активен)
            green_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
            green_draw = ImageDraw.Draw(green_icon)
            green_draw.ellipse([8, 8, 56, 56], fill=(0, 255, 0, 255))
            green_draw.text((32, 32), "D", fill=(255, 255, 255, 255), anchor="mm")
            self.icon_images["active"] = green_icon
            
            # Красная иконка (неактивен)
            red_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
            red_draw = ImageDraw.Draw(red_icon)
            red_draw.ellipse([8, 8, 56, 56], fill=(255, 0, 0, 255))
            red_draw.text((32, 32), "D", fill=(255, 255, 255, 255), anchor="mm")
            self.icon_images["inactive"] = red_icon
            
            # Жёлтая иконка (предупреждение)
            yellow_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
            yellow_draw = ImageDraw.Draw(yellow_icon)
            yellow_draw.ellipse([8, 8, 56, 56], fill=(255, 255, 0, 255))
            yellow_draw.text((32, 32), "D", fill=(0, 0, 0, 255), anchor="mm")
            self.icon_images["warning"] = yellow_icon
            
            # Синяя иконка (работает)
            blue_icon = Image.new('RGBA', icon_size, (0, 0, 0, 0))
            blue_draw = ImageDraw.Draw(blue_icon)
            blue_draw.ellipse([8, 8, 56, 56], fill=(0, 0, 255, 255))
            blue_draw.text((32, 32), "D", fill=(255, 255, 255, 255), anchor="mm")
            self.icon_images["working"] = blue_icon
            
            logger.debug("Дефолтные иконки для трея созданы")
            
        except Exception as e:
            logger.exception(f"Ошибка создания дефолтных иконок: {e}")
            # Последний fallback - простые цветные квадраты
            self.icon_images = {
                "active": Image.new('RGBA', icon_size, (0, 255, 0, 255)),
                "inactive": Image.new('RGBA', icon_size, (255, 0, 0, 255)),
                "warning": Image.new('RGBA', icon_size, (255, 255, 0, 255)),
                "working": Image.new('RGBA', icon_size, (0, 0, 255, 255))
            }
    
    def start(self):
        """Запуск иконки в трее"""
        if not TRAY_AVAILABLE:
            logger.warning("System Tray недоступен")
            return False
        
        if self.is_running:
            logger.warning("Tray уже запущен")
            return True
        
        try:
            # Создаём меню
            menu = self._create_menu()
            
            # Создаём иконку
            self.icon = pystray.Icon(
                "DonatKZ",
                self.icon_images["inactive"],
                "DonatKZ Desktop",
                menu
            )
            
            # Запускаем в отдельном потоке
            self.thread = threading.Thread(
                target=self._run_icon,
                daemon=True,
                name="TrayIcon"
            )
            self.thread.start()
            
            self.is_running = True
            logger.info("✅ Иконка в трее запущена")
            return True
            
        except Exception as e:
            logger.exception(f"Ошибка запуска трея: {e}")
            return False
    
    def stop(self):
        """Остановка иконки в трее"""
        if not self.is_running or not self.icon:
            return
        
        try:
            self.icon.stop()
            self.is_running = False
            logger.info("✅ Иконка в трее остановлена")
        except Exception as e:
            logger.exception(f"Ошибка остановки трея: {e}")
    
    def _run_icon(self):
        """Запуск иконки в отдельном потоке"""
        try:
            self.icon.run()
        except Exception as e:
            logger.exception(f"Ошибка в потоке трея: {e}")
    
    def _create_menu(self):
        """Создание контекстного меню"""
        try:
            menu = pystray.Menu(
                # Показать/скрыть окно
                item(
                    "Показать окно",
                    self._on_show_window,
                    default=True
                ),
                item(
                    "Скрыть окно",
                    self._on_hide_window
                ),
                pystray.Menu.SEPARATOR,
                
                # Статус
                item(
                    f"Статус: {self.app_status}",
                    None,
                    enabled=False
                ),
                item(
                    f"Phone Link: {self.phone_link_status}",
                    None,
                    enabled=False
                ),
                item(
                    f"Слушатель: {self.listener_status}",
                    None,
                    enabled=False
                ),
                pystray.Menu.SEPARATOR,
                
                # Управление
                item(
                    "Запустить слушатель",
                    self._on_start_listener
                ),
                item(
                    "Остановить слушатель",
                    self._on_stop_listener
                ),
                pystray.Menu.SEPARATOR,
                
                # Выход
                item(
                    "Выход",
                    self._on_quit
                )
            )
            
            return menu
            
        except Exception as e:
            logger.exception(f"Ошибка создания меню: {e}")
            return pystray.Menu(
                item("Показать окно", self._on_show_window),
                item("Выход", self._on_quit)
            )
    
    def _on_show_window(self, icon=None, item=None):
        """Обработка показа окна"""
        try:
            if self.on_show:
                self.on_show()
            else:
                # Используем root_window напрямую
                self.root_window.deiconify()
                self.root_window.lift()
                self.root_window.focus_force()
            
            logger.info("✅ Окно показано из трея")
        except Exception as e:
            logger.exception(f"Ошибка показа окна: {e}")
    
    def _on_hide_window(self, icon=None, item=None):
        """Обработка скрытия окна"""
        try:
            if self.on_hide:
                self.on_hide()
            else:
                # Используем root_window напрямую
                self.root_window.withdraw()
            
            logger.info("✅ Окно скрыто в трей")
        except Exception as e:
            logger.exception(f"Ошибка скрытия окна: {e}")
    
    def _on_start_listener(self, icon=None, item=None):
        """Обработка запуска слушателя"""
        try:
            if hasattr(self.app_window, 'pipeline_manager'):
                if not self.app_window.pipeline_manager.is_running:
                    # Инициализируем если нужно
                    if not self.app_window.pipeline_manager.donation_pipeline:
                        # Нужна асинхронная инициализация - запускаем в отдельном потоке
                        import threading
                        import asyncio
                        
                        def init_and_start():
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                            try:
                                loop.run_until_complete(self.app_window.pipeline_manager.initialize())
                                self.app_window.pipeline_manager.start()
                                self.update_listener_status("Запущен")
                                logger.info("✅ Слушатель запущен из трея")
                            except Exception as e:
                                logger.exception(f"Ошибка запуска слушателя: {e}")
                            finally:
                                loop.close()
                        
                        thread = threading.Thread(target=init_and_start, daemon=True)
                        thread.start()
                    else:
                        self.app_window.pipeline_manager.start()
                        self.update_listener_status("Запущен")
                        logger.info("✅ Слушатель запущен из трея")
                else:
                    logger.info("ℹ️ Слушатель уже запущен")
        except Exception as e:
            logger.exception(f"Ошибка запуска слушателя: {e}")
    
    def _on_stop_listener(self, icon=None, item=None):
        """Обработка остановки слушателя"""
        try:
            if hasattr(self.app_window, 'pipeline_manager'):
                if self.app_window.pipeline_manager.is_running:
                    self.app_window.pipeline_manager.stop()
                    self.update_listener_status("Остановлен")
                    logger.info("✅ Слушатель остановлен из трея")
                else:
                    logger.info("ℹ️ Слушатель уже остановлен")
        except Exception as e:
            logger.exception(f"Ошибка остановки слушателя: {e}")
    
    def _on_quit(self, icon=None, item=None):
        """Обработка выхода"""
        try:
            if self.on_quit:
                self.on_quit()
            else:
                self.root_window.quit()
            
            logger.info("✅ Выход из приложения через трей")
        except Exception as e:
            logger.exception(f"Ошибка выхода: {e}")
    
    def update_status(self, status: str):
        """
        Обновление статуса приложения
        
        Args:
            status: Новый статус
        """
        self.app_status = status
        self._update_icon()
        logger.debug(f"Статус обновлён: {status}")
    
    def update_phone_link_status(self, status: str):
        """
        Обновление статуса Phone Link
        
        Args:
            status: Новый статус Phone Link
        """
        self.phone_link_status = status
        self._update_icon()
        logger.debug(f"Phone Link статус обновлён: {status}")
    
    def update_listener_status(self, status: str):
        """
        Обновление статуса слушателя
        
        Args:
            status: Новый статус слушателя
        """
        self.listener_status = status
        self._update_icon()
        logger.debug(f"Слушатель статус обновлён: {status}")
    
    def _update_icon(self):
        """Обновление иконки в трее"""
        if not self.icon:
            return
        
        try:
            # Определяем цвет иконки на основе статуса
            if self.phone_link_status == "Работает" and self.listener_status == "Запущен":
                icon_type = "active"
            elif self.phone_link_status == "Не работает":
                icon_type = "warning"
            elif self.listener_status == "Остановлен":
                icon_type = "inactive"
            else:
                icon_type = "working"
            
            # Обновляем иконку
            self.icon.icon = self.icon_images[icon_type]
            
            # Обновляем меню
            self.icon.menu = self._create_menu()
            
        except Exception as e:
            logger.exception(f"Ошибка обновления иконки: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """
        Получение статуса трея
        
        Returns:
            dict: Статус трея
        """
        return {
            "is_running": self.is_running,
            "app_status": self.app_status,
            "phone_link_status": self.phone_link_status,
            "listener_status": self.listener_status,
            "tray_available": TRAY_AVAILABLE
        }
