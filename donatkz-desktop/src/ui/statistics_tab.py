"""Statistics tab with weekly donations data from database"""
import tkinter as tk
from tkinter import ttk
import logging
from datetime import datetime
from typing import Optional

from .widgets import StatCard, ScrollableTreeview, show_info

logger = logging.getLogger(__name__)


class StatisticsTab:
    """
    Вкладка Статистика
    
    Отображает:
    - Статистику по неделям из БД
    - Топ 5 доноров
    - Граф по дням недели
    """
    
    def __init__(self, parent):
        """
        Инициализация вкладки статистики
        
        Args:
            parent: Родительский виджет (Notebook)
        """
        self.frame = ttk.Frame(parent)
        self.db_manager = None  # Будет установлен позже
        
        # Создаём UI
        self._create_week_selector_section()
        self._create_statistics_section()
        self._create_top_donors_section()
        self._create_daily_chart_section()
        
        logger.debug("Statistics вкладка инициализирована")
    
    def set_db_manager(self, db_manager):
        """
        Установить DatabaseManager
        
        Args:
            db_manager: DatabaseManager объект
        """
        self.db_manager = db_manager
        logger.debug("DatabaseManager установлен для StatisticsTab")
        
        # Обновляем данные при установке
        self.refresh_statistics()
    
    def _create_week_selector_section(self):
        """Создание секции выбора недели"""
        selector_frame = ttk.Frame(self.frame)
        selector_frame.pack(fill=tk.X, padx=10, pady=(10, 5))
        
        # Метка
        label = ttk.Label(selector_frame, text="Неделя:")
        label.pack(side=tk.LEFT, padx=5)
        
        # Комбобокс для выбора недели
        self.week_var = tk.StringVar()
        self.week_combo = ttk.Combobox(
            selector_frame,
            textvariable=self.week_var,
            state="readonly",
            width=15
        )
        self.week_combo.pack(side=tk.LEFT, padx=5)
        self.week_combo.bind("<<ComboboxSelected>>", lambda e: self.refresh_statistics())
        
        # Кнопка обновления
        refresh_btn = ttk.Button(
            selector_frame,
            text="🔄 Обновить",
            command=self.refresh_statistics
        )
        refresh_btn.pack(side=tk.LEFT, padx=5)
        
        # Кнопка текущей недели
        current_week_btn = ttk.Button(
            selector_frame,
            text="📅 Эта неделя",
            command=self._select_current_week
        )
        current_week_btn.pack(side=tk.LEFT, padx=5)
    
    def _create_statistics_section(self):
        """Создание секции основной статистики"""
        header = ttk.Label(
            self.frame,
            text="📊 Статистика недели",
            font=("Segoe UI", 12, "bold")
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        stats_frame = ttk.Frame(self.frame)
        stats_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Карточки статистики
        self.week_donations_card = StatCard(
            stats_frame,
            title="Донатов",
            value="0"
        )
        self.week_donations_card.pack(
            side=tk.LEFT, padx=10, pady=10, fill=tk.BOTH, expand=True
        )
        
        self.week_total_card = StatCard(
            stats_frame,
            title="Всего",
            value="0₸"
        )
        self.week_total_card.pack(
            side=tk.LEFT, padx=10, pady=10, fill=tk.BOTH, expand=True
        )
        
        self.week_average_card = StatCard(
            stats_frame,
            title="Средняя",
            value="0₸"
        )
        self.week_average_card.pack(
            side=tk.LEFT, padx=10, pady=10, fill=tk.BOTH, expand=True
        )
        
        self.week_max_card = StatCard(
            stats_frame,
            title="Максимум",
            value="0₸"
        )
        self.week_max_card.pack(
            side=tk.LEFT, padx=10, pady=10, fill=tk.BOTH, expand=True
        )
    
    def _create_top_donors_section(self):
        """Создание секции топ доноров"""
        header = ttk.Label(
            self.frame,
            text="🏆 Топ 5 доноров",
            font=("Segoe UI", 12, "bold")
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        list_frame = ttk.LabelFrame(self.frame, text="", padding=10)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Treeview для топ доноров
        columns = ("Место", "Доноры", "Кол-во", "Сумма")
        column_widths = {
            "Место": 50,
            "Доноры": 150,
            "Кол-во": 80,
            "Сумма": 100
        }
        
        self.top_donors_tree = ScrollableTreeview(
            list_frame,
            columns=columns,
            column_widths=column_widths,
            height=8
        )
        self.top_donors_tree.pack(fill=tk.BOTH, expand=True)
    
    def _create_daily_chart_section(self):
        """Создание секции графика по дням"""
        header = ttk.Label(
            self.frame,
            text="📈 Статистика по дням",
            font=("Segoe UI", 12, "bold")
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        chart_frame = ttk.LabelFrame(self.frame, text="", padding=10)
        chart_frame.pack(fill=tk.BOTH, expand=False, padx=10, pady=5)
        
        # Treeview для дневной статистики
        columns = ("День", "Кол-во", "Сумма", "График")
        column_widths = {
            "День": 50,
            "Кол-во": 80,
            "Сумма": 100,
            "График": 300
        }
        
        self.daily_tree = ScrollableTreeview(
            chart_frame,
            columns=columns,
            column_widths=column_widths,
            height=7
        )
        self.daily_tree.pack(fill=tk.BOTH, expand=True)
    
    def refresh_statistics(self):
        """Обновить статистику из БД"""
        if not self.db_manager:
            logger.warning("DatabaseManager не установлен")
            return
        
        try:
            # Получаем список всех недель
            all_weeks = self.db_manager.get_all_weeks()
            
            if not all_weeks:
                logger.info("Нет данных в БД")
                self._clear_statistics()
                return
            
            # Обновляем список недель в комбобоксе
            self.week_combo["values"] = all_weeks
            
            # Выбираем текущую неделю или первую доступную
            current_week = self.db_manager.get_current_week()
            if current_week in all_weeks:
                self.week_combo.set(current_week)
            elif all_weeks:
                self.week_combo.set(all_weeks[0])
            
            # Получаем выбранную неделю
            selected_week = self.week_combo.get()
            if not selected_week:
                return
            
            # Получаем статистику за неделю
            stats = self.db_manager.get_weekly_stats(selected_week)
            
            # Обновляем карточки
            self.week_donations_card.update_value(str(stats.get("total_donations", 0)))
            self.week_total_card.update_value(f"{stats.get('total_amount', 0):,.0f}₸")
            self.week_average_card.update_value(f"{stats.get('average_amount', 0):,.0f}₸")
            self.week_max_card.update_value(f"{stats.get('max_amount', 0):,.0f}₸")
            
            # Обновляем топ доноров
            self._update_top_donors(stats.get("top_donors", []))
            
            # Обновляем график по дням
            self._update_daily_chart(stats.get("by_day", []))
            
            logger.info(f"✅ Статистика обновлена для {selected_week}")
            
        except Exception as e:
            logger.exception(f"❌ Ошибка обновления статистики: {e}")
            show_info("Ошибка", f"Ошибка загрузки статистики: {e}")
    
    def _update_top_donors(self, top_donors: list):
        """
        Обновить список топ доноров
        
        Args:
            top_donors: Список топ доноров
        """
        self.top_donors_tree.clear()
        
        for idx, donor in enumerate(top_donors, 1):
            sender = donor.get("sender", "Неизвестно")
            count = donor.get("count", 0)
            total = donor.get("total", 0)
            
            self.top_donors_tree.insert(
                (str(idx), sender, str(count), f"{total:,.0f}₸"),
                position=idx - 1
            )
    
    def _update_daily_chart(self, by_day: list):
        """
        Обновить график по дням
        
        Args:
            by_day: Статистика по дням
        """
        self.daily_tree.clear()
        
        # Находим максимум для нормализации
        max_total = max([day.get("total", 0) for day in by_day], default=1)
        
        for day_data in by_day:
            day = day_data.get("day", "?")
            count = day_data.get("count", 0)
            total = day_data.get("total", 0)
            
            # Создаём простой ASCII график
            if max_total > 0:
                bar_length = int((total / max_total) * 30)
                chart = "█" * bar_length
            else:
                chart = ""
            
            self.daily_tree.insert(
                (day, str(count), f"{total:,.0f}₸", chart)
            )
    
    def _clear_statistics(self):
        """Очистить все статистические данные"""
        self.week_donations_card.update_value("0")
        self.week_total_card.update_value("0₸")
        self.week_average_card.update_value("0₸")
        self.week_max_card.update_value("0₸")
        
        self.top_donors_tree.clear()
        self.daily_tree.clear()
    
    def _select_current_week(self):
        """Выбрать текущую неделю"""
        if not self.db_manager:
            return
        
        current_week = self.db_manager.get_current_week()
        
        # Проверяем есть ли текущая неделя в списке
        all_weeks = list(self.week_combo["values"])
        if current_week in all_weeks:
            self.week_combo.set(current_week)
            self.refresh_statistics()
        else:
            show_info("Информация", f"Нет данных за неделю {current_week}")
    
    def refresh_on_new_donation(self):
        """Обновить статистику при новом донате"""
        # Просто вызываем refresh если выбрана текущая неделя
        if self.db_manager:
            selected_week = self.week_combo.get()
            current_week = self.db_manager.get_current_week()
            
            if selected_week == current_week:
                self.refresh_statistics()
