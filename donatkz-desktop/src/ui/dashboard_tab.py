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
        
        # Создаём UI
        self._create_statistics_section()
        self._create_donations_list_section()
        self._create_actions_section()
        
        logger.debug("Dashboard вкладка инициализирована")
    
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
            
            # Обновляем статистику
            self._update_statistics()
            
            logger.info(f"Донат добавлен в Dashboard: {amount}₸ от {sender}")
            
        except Exception as e:
            logger.error(f"Ошибка при добавлении доната: {e}")
    
    def _update_statistics(self):
        """Обновить карточки статистики"""
        if not self.donations:
            self.donations_count_card.update_value("0")
            self.total_amount_card.update_value("0₸")
            self.average_amount_card.update_value("0₸")
            return
        
        # Подсчёт статистики
        count = len(self.donations)
        total = sum(d["amount"] for d in self.donations)
        average = total / count if count > 0 else 0
        
        # Обновление карточек
        self.donations_count_card.update_value(str(count))
        self.total_amount_card.update_value(f"{total:,.0f}₸")
        self.average_amount_card.update_value(f"{average:,.0f}₸")
    
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


