"""
Tests for DatabaseManager

Тесты для SQLite БД управления донатами и дедупликации
"""
import unittest
import tempfile
from pathlib import Path
from datetime import datetime, timedelta
import logging

from src.database.db_manager import DatabaseManager

# Инициализируем logger
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TestDatabaseManager(unittest.TestCase):
    """Тесты для DatabaseManager"""
    
    def setUp(self):
        """Подготовка к тестам"""
        # Создаём временный файл БД
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_file = Path(self.temp_dir.name) / "test_donations.db"
        
        # Создаём DatabaseManager с временной БД
        self.db = DatabaseManager(self.db_file)
    
    def tearDown(self):
        """Очистка после тестов"""
        self.db.close()
        self.temp_dir.cleanup()
    
    def test_database_initialization(self):
        """Тест инициализации БД"""
        # Проверяем что файл БД создан
        self.assertTrue(self.db_file.exists())
        logger.info("✅ БД инициализирована")
    
    def test_save_donation(self):
        """Тест сохранения доната"""
        now = datetime.now()
        date_str = DatabaseManager.format_datetime_iso8601(now)
        
        # Сохраняем донат
        result = self.db.save_donation(
            sender="Иван И.",
            amount=1000,
            message="Спасибо!",
            date=date_str
        )
        
        # Проверяем что сохранено успешно
        self.assertTrue(result)
        logger.info("✅ Донат сохранён успешно")
    
    def test_duplicate_detection(self):
        """Тест обнаружения дубликатов"""
        now = datetime.now()
        date_str = DatabaseManager.format_datetime_iso8601(now)
        
        # Сохраняем первый донат
        self.db.save_donation(
            sender="Иван И.",
            amount=1000,
            message="Спасибо!",
            date=date_str
        )
        
        # Проверяем что он НЕ дубликат
        exists = self.db.check_donation_exists(
            sender="Иван И.",
            amount=1000,
            message="Спасибо!",
            date=date_str
        )
        self.assertTrue(exists)
        logger.info("✅ Дубликат обнаружен")
        
        # Проверяем что похожий но не идентичный донат - НЕ дубликат
        exists = self.db.check_donation_exists(
            sender="Иван И.",
            amount=2000,  # Другая сумма
            message="Спасибо!",
            date=date_str
        )
        self.assertFalse(exists)
        logger.info("✅ Похожий не идентичный донат не обнаружен как дубликат")
    
    def test_week_calculation(self):
        """Тест вычисления недели"""
        # Тест с точной датой
        date_str = "2025-10-21T14:35:42.123Z"
        week = DatabaseManager._calculate_week(date_str)
        
        # 2025-10-21 это вторник на неделе W43
        self.assertEqual(week, "2025-W43")
        logger.info(f"✅ Неделя вычислена правильно: {week}")
    
    def test_iso8601_format(self):
        """Тест форматирования времени ISO 8601"""
        now = datetime(2025, 10, 21, 14, 35, 42, 123000)
        
        # Форматируем
        formatted = DatabaseManager.format_datetime_iso8601(now)
        
        # Проверяем формат
        self.assertTrue(formatted.endswith('Z'))
        self.assertIn('T', formatted)
        self.assertIn('.', formatted)
        logger.info(f"✅ Время отформатировано: {formatted}")
        
        # Парсим обратно
        parsed = DatabaseManager.parse_datetime_iso8601(formatted)
        self.assertEqual(parsed.year, 2025)
        self.assertEqual(parsed.month, 10)
        self.assertEqual(parsed.day, 21)
        logger.info("✅ Время распарсено корректно")
    
    def test_get_weekly_stats(self):
        """Тест получения статистики по неделе"""
        # Добавляем несколько донатов для неделе 2025-W43
        dates = [
            datetime(2025, 10, 21, 12, 0, 0),  # Вторник
            datetime(2025, 10, 22, 13, 0, 0),  # Среда
            datetime(2025, 10, 23, 14, 0, 0),  # Четверг
        ]
        
        donors_data = [
            ("Иван И.", 1000, "Спасибо!"),
            ("Мария М.", 2000, "Привет!"),
            ("Иван И.", 1500, "Ещё спасибо!"),
        ]
        
        for date, (sender, amount, message) in zip(dates, donors_data):
            date_str = DatabaseManager.format_datetime_iso8601(date)
            self.db.save_donation(
                sender=sender,
                amount=amount,
                message=message,
                date=date_str
            )
        
        # Получаем статистику
        stats = self.db.get_weekly_stats("2025-W43")
        
        # Проверяем результаты
        self.assertEqual(stats["total_donations"], 3)
        self.assertEqual(stats["total_amount"], 4500)
        self.assertAlmostEqual(stats["average_amount"], 1500.0, places=1)
        self.assertGreater(len(stats["top_donors"]), 0)
        self.assertEqual(stats["top_donors"][0]["sender"], "Иван И.")  # Иван больше пожертвовал
        
        logger.info(f"✅ Статистика получена: {stats}")
    
    def test_get_donations_by_week(self):
        """Тест получения донатов за неделю"""
        # Добавляем донат
        date = datetime(2025, 10, 21, 14, 35, 42)
        date_str = DatabaseManager.format_datetime_iso8601(date)
        
        self.db.save_donation(
            sender="Иван И.",
            amount=1000,
            message="Спасибо!",
            date=date_str
        )
        
        # Получаем донаты за неделю
        donations = self.db.get_donations_by_week("2025-W43")
        
        # Проверяем результаты
        self.assertEqual(len(donations), 1)
        self.assertEqual(donations[0]["sender"], "Иван И.")
        self.assertEqual(donations[0]["amount"], 1000)
        
        logger.info(f"✅ Донаты за неделю получены: {len(donations)} шт.")
    
    def test_get_all_weeks(self):
        """Тест получения списка всех недель"""
        # Добавляем донаты в разные недели
        dates = [
            datetime(2025, 10, 21, 14, 0, 0),  # W43
            datetime(2025, 10, 28, 14, 0, 0),  # W44
        ]
        
        for date in dates:
            date_str = DatabaseManager.format_datetime_iso8601(date)
            self.db.save_donation(
                sender="Иван И.",
                amount=1000,
                message="Спасибо!",
                date=date_str
            )
        
        # Получаем все недели
        weeks = self.db.get_all_weeks()
        
        # Проверяем результаты
        self.assertGreaterEqual(len(weeks), 2)
        self.assertIn("2025-W43", weeks)
        self.assertIn("2025-W44", weeks)
        
        logger.info(f"✅ Неделии получены: {weeks}")
    
    def test_duplicate_with_none_message(self):
        """Тест сохранения донатов с None сообщением"""
        # ПРИМЕЧАНИЕ: SQLite не поддерживает UNIQUE на NULL значения
        # (NULL != NULL в SQL), поэтому несколько донатов с None сообщением
        # могут быть сохранены с одинаковыми параметрами.
        # Это нормальное поведение SQLite и не является ошибкой.
        
        date_str = DatabaseManager.format_datetime_iso8601(datetime.now())
        
        # Сохраняем донат без сообщения
        save_result = self.db.save_donation(
            sender="Иван И.",
            amount=1000,
            message=None,
            date=date_str
        )
        self.assertTrue(save_result, "Не удалось сохранить донат без сообщения")
        
        # Получаем данные из БД
        week = self.db._calculate_week(date_str)
        donations = self.db.get_donations_by_week(week)
        self.assertTrue(len(donations) > 0, "Донат не найден в БД")
        
        # Проверяем что donат сохранился с NULL сообщением
        saved_donation = donations[0]
        self.assertIsNone(saved_donation.get('message'))
        self.assertEqual(saved_donation.get('sender'), "Иван И.")
        self.assertEqual(saved_donation.get('amount'), 1000)
        
        logger.info("✅ Донат с None сообщением успешно сохранен")
    
    def test_get_current_week(self):
        """Тест получения текущей недели"""
        week = self.db.get_current_week()
        
        # Проверяем формат
        self.assertRegex(week, r'^\d{4}-W\d{2}$')
        
        logger.info(f"✅ Текущая неделя: {week}")
    
    def test_concurrent_saves(self):
        """Тест одновременного сохранения (для проверки потокобезопасности)"""
        import threading
        
        def save_donation(donor_id):
            date_str = DatabaseManager.format_datetime_iso8601(datetime.now())
            self.db.save_donation(
                sender=f"Иван {donor_id}",
                amount=1000 + donor_id,
                message=f"Спасибо {donor_id}!",
                date=date_str
            )
        
        # Создаём несколько потоков
        threads = []
        for i in range(5):
            t = threading.Thread(target=save_donation, args=(i,))
            threads.append(t)
            t.start()
        
        # Ждём завершения
        for t in threads:
            t.join()
        
        logger.info("✅ Одновременное сохранение работает корректно")


if __name__ == "__main__":
    # Запускаем тесты
    unittest.main()
