"""
Database Manager for Donations

Управление SQLite БД для постоянного хранения донатов и дедупликации.
"""
import sqlite3
import logging
from pathlib import Path
from typing import Optional, List, Dict, Tuple
from datetime import datetime, timedelta, date
import hashlib
from threading import Lock

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Менеджер для работы с SQLite БД донатов
    
    Обеспечивает:
    - Инициализацию таблицы donations_weekly
    - Проверку дубликатов перед сохранением
    - Сохранение новых донатов
    - Получение статистики по неделям
    """
    
    def __init__(self, db_file: Path):
        """
        Инициализация DatabaseManager
        
        Args:
            db_file: Путь к файлу БД (donations.db)
        """
        self.db_file = db_file
        self.lock = Lock()  # Для потокобезопасности
        
        # Убеждаемся что директория существует
        self.db_file.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"DatabaseManager инициализирован: {self.db_file}")
        
        # Инициализируем БД при создании объекта
        self.init_db()
    
    def init_db(self):
        """
        Инициализация базы данных
        
        Создаёт таблицу donations_weekly если её ещё нет.
        Это должно быть вызвано один раз при первом запуске приложения.
        """
        try:
            with self.lock:
                conn = sqlite3.connect(str(self.db_file), timeout=30)
                cursor = conn.cursor()
                
                # Создаём таблицу если её нет
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS donations_weekly (
                        id              INTEGER PRIMARY KEY AUTOINCREMENT,
                        week            TEXT NOT NULL,
                        sender          TEXT NOT NULL,
                        amount          INTEGER NOT NULL CHECK (amount > 0),
                        message         TEXT,
                        date            TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
                        content_hash    TEXT UNIQUE NOT NULL,
                        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Индексы для быстрого поиска
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_donations_weekly_week 
                    ON donations_weekly(week)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_donations_weekly_date 
                    ON donations_weekly(date)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_donations_weekly_sender 
                    ON donations_weekly(sender)
                """)
                
                conn.commit()
                conn.close()
                
                logger.info("✅ База данных инициализирована")
                return True
                
        except Exception as e:
            logger.exception(f"❌ Ошибка инициализации БД: {e}")
            return False
    
    def check_donation_exists(
        self, 
        sender: str, 
        amount: int, 
        message: Optional[str], 
        date: str
    ) -> bool:
        """
        Проверка наличия донатов в БД (дедупликация)
        
        Проверяет по хэшу контента (sender + amount + message)
        БЕЗ зависимости от времени!
        
        Args:
            sender: Имя отправителя
            amount: Сумма в тенге
            message: Сообщение (может быть None)
            date: Время в ISO 8601 формате (для логирования)
            
        Returns:
            bool: True если запись найдена (дубликат), False если новая
        """
        try:
            # Генерируем хэш по содержимому (БЕЗ времени!)
            content_hash = self._generate_content_hash(sender, amount, message)
            
            with self.lock:
                conn = sqlite3.connect(str(self.db_file), timeout=30)
                cursor = conn.cursor()
                
                # Проверяем по хэшу (независимо от времени)
                cursor.execute("""
                    SELECT id FROM donations_weekly 
                    WHERE content_hash = ?
                """, (content_hash,))
                
                result = cursor.fetchone()
                conn.close()
                
                exists = result is not None
                
                if exists:
                    logger.debug(f"🔍 Найден дубликат: {sender} {amount}₸ (hash={content_hash[:8]}...)")
                else:
                    logger.debug(f"✅ Новый донат: {sender} {amount}₸ (hash={content_hash[:8]}...)")
                
                return exists
                
        except Exception as e:
            logger.exception(f"❌ Ошибка проверки дубликата: {e}")
            return False
    
    def save_donation(
        self, 
        sender: str, 
        amount: int, 
        message: Optional[str], 
        date: str,
        week: Optional[str] = None
    ) -> bool:
        """
        Сохранение донатов в БД
        
        Args:
            sender: Имя отправителя
            amount: Сумма в тенге
            message: Сообщение (может быть None)
            date: Время в ISO 8601 формате ("2025-10-21T14:35:42.123Z")
            week: Неделя в формате "YYYY-Www" (опционально, вычисляется автоматически)
            
        Returns:
            bool: True если успешно сохранено, False если ошибка
        """
        try:
            # Если week не задана - вычисляем автоматически
            if not week:
                week = self._calculate_week(date)
            
            # Генерируем хэш контента
            content_hash = self._generate_content_hash(sender, amount, message)
            
            with self.lock:
                conn = sqlite3.connect(str(self.db_file), timeout=30)
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO donations_weekly (week, sender, amount, message, date, content_hash)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (week, sender, amount, message, date, content_hash))
                
                conn.commit()
                donation_id = cursor.lastrowid
                conn.close()
                
                logger.info(f"✅ Донат сохранён в БД: {sender} {amount}₸ (ID: {donation_id})")
                return True
                
        except sqlite3.IntegrityError:
            # UNIQUE constraint violation - это означает дубликат по хэшу
            logger.debug(f"⚠️ Попытка добавить дубликат: {sender} {amount}₸")
            return False
        except Exception as e:
            logger.exception(f"❌ Ошибка сохранения доната в БД: {e}")
            return False
    
    def get_donations_by_week(self, week: str) -> List[Dict]:
        """
        Получение всех донатов за неделю
        
        Args:
            week: Неделя в формате "YYYY-Www" (например "2025-W42")
            
        Returns:
            List[Dict]: Список донатов с полями (id, week, sender, amount, message, date)
        """
        try:
            with self.lock:
                conn = sqlite3.connect(str(self.db_file), timeout=30)
                conn.row_factory = sqlite3.Row  # Для удобного доступа к полям
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, week, sender, amount, message, date
                    FROM donations_weekly
                    WHERE week = ?
                    ORDER BY date DESC
                """, (week,))
                
                rows = cursor.fetchall()
                conn.close()
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            logger.exception(f"❌ Ошибка получения донатов за неделю {week}: {e}")
            return []
    
    def get_weekly_stats(self, week: str) -> Dict:
        """
        Получение статистики по неделе
        
        Args:
            week: Неделя в формате "YYYY-Www"
            
        Returns:
            Dict с полями: total_amount, count, average, top_donors, by_day
        """
        try:
            with self.lock:
                conn = sqlite3.connect(str(self.db_file), timeout=30)
                cursor = conn.cursor()
                
                # Общая статистика
                cursor.execute("""
                    SELECT 
                        COUNT(*) as count,
                        SUM(amount) as total_amount,
                        AVG(amount) as average,
                        MIN(amount) as min_amount,
                        MAX(amount) as max_amount
                    FROM donations_weekly
                    WHERE week = ?
                """, (week,))
                
                row = cursor.fetchone()
                
                stats = {
                    "week": week,
                    "total_donations": row[0] or 0,
                    "total_amount": row[1] or 0,
                    "average_amount": round(row[2] or 0, 2),
                    "min_amount": row[3] or 0,
                    "max_amount": row[4] or 0,
                }
                
                # Топ доноры
                cursor.execute("""
                    SELECT sender, COUNT(*) as count, SUM(amount) as total
                    FROM donations_weekly
                    WHERE week = ?
                    GROUP BY sender
                    ORDER BY total DESC
                    LIMIT 5
                """, (week,))
                
                stats["top_donors"] = [
                    {"sender": row[0], "count": row[1], "total": row[2]}
                    for row in cursor.fetchall()
                ]
                
                # Статистика по дням недели
                cursor.execute("""
                    SELECT 
                        CAST(strftime('%w', date) AS INTEGER) as day_of_week,
                        COUNT(*) as count,
                        SUM(amount) as total
                    FROM donations_weekly
                    WHERE week = ?
                    GROUP BY day_of_week
                    ORDER BY day_of_week
                """, (week,))
                
                days_names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
                stats["by_day"] = [
                    {"day": days_names[row[0]], "count": row[1], "total": row[2]}
                    for row in cursor.fetchall()
                ]
                
                conn.close()
                return stats
                
        except Exception as e:
            logger.exception(f"❌ Ошибка получения статистики за {week}: {e}")
            return {"error": str(e)}
    
    def get_current_week(self) -> str:
        """
        Получить текущую неделю в формате ISO 8601
        
        Returns:
            str: Неделя в формате "YYYY-Www"
        """
        return self._calculate_week(datetime.now().isoformat())
    
    @staticmethod
    def _calculate_week(date_str: str) -> str:
        """
        Вычисление номера недели в ISO 8601 формате
        
        Args:
            date_str: Дата в ISO 8601 формате (может быть полный timestamp)
            
        Returns:
            str: Неделя в формате "YYYY-Www" (например "2025-W42")
        """
        try:
            # Парсим дату
            if isinstance(date_str, str):
                # Убираем миллисекунды и Z если есть
                if 'T' in date_str:
                    date_str = date_str.split('.')[0]  # Убираем миллисекунды
                date_str = date_str.replace('Z', '')
                
                # Пробуем разные форматы
                for fmt in ['%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
                    try:
                        dt = datetime.strptime(date_str, fmt)
                        break
                    except ValueError:
                        continue
                else:
                    # Если ничего не подошло - используем текущее время
                    dt = datetime.now()
            else:
                dt = date_str if isinstance(date_str, datetime) else datetime.now()
            
            # Используем isocalendar() для ISO 8601 недели
            iso_cal = dt.isocalendar()
            year = iso_cal[0]
            week = iso_cal[1]
            
            return f"{year}-W{week:02d}"
            
        except Exception as e:
            logger.warning(f"Ошибка вычисления недели из '{date_str}': {e}")
            # Fallback на текущую неделю
            iso_cal = datetime.now().isocalendar()
            return f"{iso_cal[0]}-W{iso_cal[1]:02d}"
    
    def get_donations_by_date_range(
        self, 
        start_date: str, 
        end_date: str
    ) -> List[Dict]:
        """
        Получение донатов за период
        
        Args:
            start_date: Начальная дата в ISO 8601
            end_date: Конечная дата в ISO 8601
            
        Returns:
            List[Dict]: Список донатов
        """
        try:
            with self.lock:
                conn = sqlite3.connect(str(self.db_file), timeout=30)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, week, sender, amount, message, date
                    FROM donations_weekly
                    WHERE date >= ? AND date <= ?
                    ORDER BY date DESC
                """, (start_date, end_date))
                
                rows = cursor.fetchall()
                conn.close()
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            logger.exception(f"❌ Ошибка получения донатов за период: {e}")
            return []
    
    def get_all_weeks(self) -> List[str]:
        """
        Получить список всех недель с донатами
        
        Returns:
            List[str]: Список недель в формате "YYYY-Www"
        """
        try:
            with self.lock:
                conn = sqlite3.connect(str(self.db_file), timeout=30)
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT DISTINCT week
                    FROM donations_weekly
                    ORDER BY week DESC
                """)
                
                weeks = [row[0] for row in cursor.fetchall()]
                conn.close()
                
                return weeks
                
        except Exception as e:
            logger.exception(f"❌ Ошибка получения списка недель: {e}")
            return []
    
    @staticmethod
    def format_datetime_iso8601(dt: datetime) -> str:
        """
        Форматирование datetime в ISO 8601 с миллисекундами
        
        Args:
            dt: datetime объект
            
        Returns:
            str: Время в формате "2025-10-21T14:35:42.123Z"
        """
        return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    
    @staticmethod
    def parse_datetime_iso8601(date_str: str) -> datetime:
        """
        Парсинг ISO 8601 строки в datetime
        
        Args:
            date_str: Строка в формате "2025-10-21T14:35:42.123Z"
            
        Returns:
            datetime объект
        """
        try:
            # Убираем Z и парсим
            date_str = date_str.replace('Z', '')
            if '.' in date_str:
                # Есть миллисекунды
                return datetime.fromisoformat(date_str)
            else:
                return datetime.fromisoformat(date_str)
        except Exception as e:
            logger.warning(f"Ошибка парсинга даты '{date_str}': {e}")
            return datetime.now()
    
    def clear_donations_older_than(self, days: int) -> int:
        """
        Удаление донатов старше чем N дней (опционально для очистки)
        
        Args:
            days: Количество дней
            
        Returns:
            int: Количество удалённых записей
        """
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            with self.lock:
                conn = sqlite3.connect(str(self.db_file), timeout=30)
                cursor = conn.cursor()
                
                cursor.execute("""
                    DELETE FROM donations_weekly
                    WHERE date < ?
                """, (cutoff_date,))
                
                deleted = cursor.rowcount
                conn.commit()
                conn.close()
                
                logger.info(f"🗑️  Удалено {deleted} донатов старше {days} дней")
                return deleted
                
        except Exception as e:
            logger.exception(f"❌ Ошибка удаления донатов: {e}")
            return 0
    
    def close(self):
        """Закрытие БД (если нужно явное закрытие)"""
        logger.debug("DatabaseManager закрыт")

    @staticmethod
    def _generate_content_hash(sender: str, amount: int, message: Optional[str]) -> str:
        """
        Генерирование хэша контента для дедупликации
        
        Хэш зависит ТОЛЬКО от: sender + amount + message
        Не зависит от времени!
        
        Args:
            sender: Имя отправителя
            amount: Сумма
            message: Сообщение (или None)
            
        Returns:
            str: SHA256 хэш
        """
        # Нормализуем пустые сообщения
        msg = message or ""
        
        # Создаём строку для хэширования
        content = f"{sender}|{amount}|{msg}"
        
        # Генерируем SHA256
        hash_obj = hashlib.sha256(content.encode('utf-8'))
        return hash_obj.hexdigest()


