"""Dashboard tab with statistics and donations list"""
import tkinter as tk
from tkinter import ttk
from datetime import datetime
import logging
import webbrowser

from .widgets import StatCard, ScrollableTreeview, ButtonGroup, show_info

logger = logging.getLogger(__name__)


class DashboardTab:
    """
    Вкладка Dashboard
    
    Отображает:
    - Статистику за сегодня (количество, сумма, средняя)
    - Список последних донатов
    - Кнопки действий (открыть панель, тестовый донат)
    """
    
    def __init__(self, parent):
        """
        Инициализация Dashboard
        
        Args:
            parent: Родительский виджет (Notebook)
        """
        self.frame = ttk.Frame(parent)
        
        # Данные
        self.donations = []  # Список донатов за сегодня
        self.gui_app = None  # Будет установлено из main_window
        
        # Создаём UI
        self._create_statistics_section()
        self._create_donations_list_section()
        self._create_actions_section()
        
        logger.debug("Dashboard вкладка инициализирована")
        
        # Загружаем начальную статистику с API через небольшую задержку
        # (чтобы дать время главному окну установить gui_app)
        self.frame.after(3000, self._load_stats_from_api)
    
    def set_gui_app(self, gui_app):
        """Установить ссылку на главное приложение"""
        self.gui_app = gui_app
    
    def _create_statistics_section(self):
        """Создание секции статистики"""
        # Заголовок
        header = ttk.Label(
            self.frame,
            text="📊 Статистика сегодня",
            font=("Segoe UI", 12, "bold")
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        # Рамка для карточек статистики
        stats_frame = ttk.Frame(self.frame)
        stats_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Три карточки статистики
        self.donations_count_card = StatCard(
            stats_frame,
            title="Донатов",
            value="0"
        )
        self.donations_count_card.pack(
            side=tk.LEFT, padx=10, pady=10, fill=tk.BOTH, expand=True
        )
        
        self.total_amount_card = StatCard(
            stats_frame,
            title="Сумма",
            value="0₸"
        )
        self.total_amount_card.pack(
            side=tk.LEFT, padx=10, pady=10, fill=tk.BOTH, expand=True
        )
        
        self.average_amount_card = StatCard(
            stats_frame,
            title="Средняя",
            value="0₸"
        )
        self.average_amount_card.pack(
            side=tk.LEFT, padx=10, pady=10, fill=tk.BOTH, expand=True
        )
    
    def _create_donations_list_section(self):
        """Создание секции списка донатов"""
        # Заголовок
        header = ttk.Label(
            self.frame,
            text="📝 Последние донаты",
            font=("Segoe UI", 12, "bold")
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        # Рамка для списка
        list_frame = ttk.LabelFrame(self.frame, text="", padding=10)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Treeview для отображения донатов
        columns = ("Время", "Сумма", "Отправитель", "Сообщение")
        column_widths = {
            "Время": 80,
            "Сумма": 100,
            "Отправитель": 150,
            "Сообщение": 300
        }
        
        self.donations_tree = ScrollableTreeview(
            list_frame,
            columns=columns,
            column_widths=column_widths,
            height=12
        )
        self.donations_tree.pack(fill=tk.BOTH, expand=True)
    
    def _create_actions_section(self):
        """Создание секции с кнопками действий"""
        actions_frame = ttk.Frame(self.frame)
        actions_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Кнопки
        self.open_panel_btn = ttk.Button(
            actions_frame,
            text="🌐 Открыть панель в браузере",
            command=self._open_web_panel
        )
        self.open_panel_btn.pack(side=tk.LEFT, padx=5)
        
        self.test_donation_btn = ttk.Button(
            actions_frame,
            text="🧪 Тестовый донат",
            command=self._send_test_donation
        )
        self.test_donation_btn.pack(side=tk.LEFT, padx=5)
        
        # Кнопка очистки списка (справа)
        self.clear_btn = ttk.Button(
            actions_frame,
            text="🗑️ Очистить",
            command=self._clear_donations
        )
        self.clear_btn.pack(side=tk.RIGHT, padx=5)
    
    def add_donation(self, donation_data: dict):
        """
        Добавить донат в список
        
        Args:
            donation_data: Словарь с данными доната {
                "amount": float,
                "senderName": str,
                "message": str,
                "timestamp": str (ISO format)
            }
        """
        try:
            # Парсим timestamp
            if isinstance(donation_data.get("timestamp"), str):
                timestamp = datetime.fromisoformat(donation_data["timestamp"])
            else:
                timestamp = datetime.now()
            
            # Форматируем время
            time_str = timestamp.strftime("%H:%M")
            
            # Форматируем сумму
            amount = donation_data.get("amount", 0)
            amount_str = f"{amount:,.0f}₸"
            
            # Получаем данные
            sender = donation_data.get("senderName", "Неизвестно")
            message = donation_data.get("message", "")
            
            # Добавляем в начало списка (последние сверху)
            self.donations_tree.insert((time_str, amount_str, sender, message), position=0)
            
            # Сохраняем в список
            self.donations.append({
                "timestamp": timestamp,
                "amount": amount,
                "sender": sender,
                "message": message
            })
            
            # Обновляем статистику из локальных данных
            self._update_statistics()
            
            # Также обновляем статистику с API для синхронизации
            # (запускаем через небольшую задержку чтобы Backend успел обновить статистику)
            if hasattr(self, 'frame'):
                self.frame.after(2000, self._load_stats_from_api)
            
            logger.info(f"Донат добавлен в Dashboard: {amount}₸ от {sender}")
            
        except Exception as e:
            logger.error(f"Ошибка при добавлении доната: {e}")
    
    def _update_statistics(self):
        """Обновить карточки статистики из локальных данных"""
        if not self.donations:
            # Пробуем загрузить статистику с API
            self._load_stats_from_api()
            return
        
        # Подсчёт статистики из локальных данных
        count = len(self.donations)
        total = sum(d["amount"] for d in self.donations)
        average = total / count if count > 0 else 0
        
        # Обновление карточек
        self.donations_count_card.update_value(str(count))
        self.total_amount_card.update_value(f"{total:,.0f}₸")
        self.average_amount_card.update_value(f"{average:,.0f}₸")
    
    def _load_stats_from_api(self):
        """Загрузить статистику с Backend API"""
        if not self.gui_app:
            return
        
        import threading
        import asyncio
        from database.db_manager import DatabaseManager
        from config import Config
        from api import create_api_client
        
        def load_stats():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                # Получаем device_token из БД
                db_manager = DatabaseManager(Config.DONATIONS_DB_FILE)
                device_token = db_manager.get_setting("device_token")
                
                if not device_token:
                    logger.debug("Device token не найден, статистика с API не загружена")
                    return
                
                # Создаём API клиент
                api_client = create_api_client(use_mock=False)
                
                # Получаем статистику
                async def fetch_stats():
                    await api_client._ensure_session()
                    return await api_client.get_donations_stats(device_token)
                
                result = loop.run_until_complete(fetch_stats())
                
                # Логируем полный ответ API для отладки
                logger.debug(f"📊 Полный ответ API: {result}")
                
                if "error" not in result:
                    # Пробуем разные варианты ключей, которые может возвращать API
                    # Вариант 1: Прямые ключи верхнего уровня
                    count_today = None
                    amount_today = None
                    
                    # Пробуем извлечь count_today
                    if "countToday" in result:
                        count_today = result["countToday"]
                    elif "count_today" in result:
                        count_today = result["count_today"]
                    elif "count" in result:
                        count_today = result["count"]
                    
                    # Пробуем извлечь amount_today
                    if "amountToday" in result:
                        amount_today = result["amountToday"]
                    elif "amount_today" in result:
                        amount_today = result["amount_today"]
                    elif "amount" in result:
                        amount_today = result["amount"]
                    elif "total" in result:
                        amount_today = result["total"]
                    
                    # Если данные вложены в другие ключи (например, в "stats")
                    if (count_today is None or amount_today is None) and "stats" in result:
                        stats = result["stats"]
                        if count_today is None:
                            if "countToday" in stats:
                                count_today = stats["countToday"]
                            elif "count_today" in stats:
                                count_today = stats["count_today"]
                            elif "count" in stats:
                                count_today = stats["count"]
                        
                        if amount_today is None:
                            if "amountToday" in stats:
                                amount_today = stats["amountToday"]
                            elif "amount_today" in stats:
                                amount_today = stats["amount_today"]
                            elif "amount" in stats:
                                amount_today = stats["amount"]
                            elif "total" in stats:
                                amount_today = stats["total"]
                    
                    # Преобразуем в правильные типы
                    try:
                        count_today = int(count_today) if count_today is not None else 0
                        amount_today = float(amount_today) if amount_today is not None else 0.0
                    except (ValueError, TypeError) as e:
                        logger.warning(f"⚠️ Ошибка преобразования типов: {e}, count_today={result.get('countToday')}, amount_today={result.get('amountToday')}")
                        count_today = 0
                        amount_today = 0.0
                    
                    # Рассчитываем среднюю из данных за сегодня или используем общую
                    if count_today > 0:
                        average_today = amount_today / count_today
                    else:
                        # Пробуем извлечь среднюю из API
                        average_today = None
                        if "averageAmount" in result:
                            average_today = result["averageAmount"]
                        elif "average_amount" in result:
                            average_today = result["average_amount"]
                        elif "average" in result:
                            average_today = result["average"]
                        
                        # Если средняя вложена в "stats"
                        if average_today is None and "stats" in result:
                            stats = result["stats"]
                            if "averageAmount" in stats:
                                average_today = stats["averageAmount"]
                            elif "average_amount" in stats:
                                average_today = stats["average_amount"]
                            elif "average" in stats:
                                average_today = stats["average"]
                        
                        try:
                            average_today = float(average_today) if average_today is not None else 0.0
                        except (ValueError, TypeError):
                            average_today = 0.0
                    
                    logger.info(f"📊 Извлеченные данные: count={count_today}, amount={amount_today}, average={average_today}")
                    
                    # Сохраняем значения для безопасного обновления в главном потоке
                    # Используем частичное применение вместо lambda для избежания проблем с замыканием
                    c = int(count_today)
                    a = float(amount_today)
                    avg = float(average_today)
                    
                    # Обновляем в главном потоке через метод с правильными параметрами
                    def update_ui():
                        self._update_stats_from_api_result(c, a, avg)
                    
                    self.frame.after(0, update_ui)
                    
                    logger.info(f"✅ Статистика загружена с API: {count_today} донатов, {amount_today}₸")
                else:
                    logger.warning(f"⚠️ Ошибка загрузки статистики: {result.get('error')}")
                
                # Закрываем сессию
                loop.run_until_complete(api_client.close())
                
            except Exception as e:
                logger.exception(f"❌ Ошибка загрузки статистики с API: {e}")
            finally:
                loop.close()
        
        thread = threading.Thread(target=load_stats, daemon=True)
        thread.start()
    
    def _update_stats_from_api_result(self, count: int, total: float, average: float):
        """Обновить статистику из результата API"""
        logger.info(f"🔄 Обновление статистики в UI: count={count}, total={total}, average={average}")
        
        # Обновляем все три карточки
        try:
            self.donations_count_card.update_value(str(count))
            logger.debug(f"✅ Карточка 'Донатов' обновлена: {count}")
        except Exception as e:
            logger.error(f"❌ Ошибка обновления карточки 'Донатов': {e}")
        
        try:
            self.total_amount_card.update_value(f"{total:,.0f}₸")
            logger.debug(f"✅ Карточка 'Сумма' обновлена: {total:,.0f}₸")
        except Exception as e:
            logger.error(f"❌ Ошибка обновления карточки 'Сумма': {e}")
        
        try:
            self.average_amount_card.update_value(f"{average:,.0f}₸")
            logger.debug(f"✅ Карточка 'Средняя' обновлена: {average:,.0f}₸")
        except Exception as e:
            logger.error(f"❌ Ошибка обновления карточки 'Средняя': {e}")
    
    
    def _open_web_panel(self):
        """Открыть веб-панель в браузере"""
        url = "http://localhost:3000"  # TODO: Получать из конфигурации
        logger.info(f"Открытие веб-панели: {url}")
        
        try:
            webbrowser.open(url)
        except Exception as e:
            logger.error(f"Ошибка при открытии браузера: {e}")
            show_info(
                "Ошибка",
                f"Не удалось открыть браузер.\nURL: {url}"
            )
    
    def _send_test_donation(self):
        """Отправить тестовый донат"""
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from notification.models import DonationData
        
        logger.info("Создание тестового доната")
        
        # Создаём тестовый донат
        test_donation = {
            "amount": 500.0,
            "senderName": "Тестовый Пользователь",
            "message": "Это тестовый донат 🎉",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Test notification"
        }
        
        # Добавляем в список
        self.add_donation(test_donation)
        
        show_info("Успешно", "Тестовый донат добавлен!")
    
    def _clear_donations(self):
        """Очистить список донатов"""
        from .widgets import ask_yes_no
        
        if not self.donations:
            show_info("Информация", "Список донатов уже пуст")
            return
        
        # Подтверждение
        if ask_yes_no(
            "Подтверждение",
            f"Вы уверены что хотите очистить список?\n({len(self.donations)} донатов)"
        ):
            self.donations.clear()
            self.donations_tree.clear()
            self._update_statistics()
            logger.info("Список донатов очищен")
            show_info("Успешно", "Список донатов очищен")
    
    def get_donations_count(self) -> int:
        """
        Получить количество донатов
        
        Returns:
            int: Количество донатов
        """
        return len(self.donations)
    
    def get_total_amount(self) -> float:
        """
        Получить общую сумму
        
        Returns:
            float: Сумма всех донатов
        """
        return sum(d["amount"] for d in self.donations)


