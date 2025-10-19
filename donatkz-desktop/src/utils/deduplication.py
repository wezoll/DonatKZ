"""Deduplication manager for donations"""
import hashlib
from datetime import datetime, timedelta
from typing import Dict, TYPE_CHECKING
import logging

if TYPE_CHECKING:
    from notification.models import DonationData

logger = logging.getLogger(__name__)


def generate_donation_hash(donation: "DonationData") -> str:
    """
    Генерация уникального хеша для доната
    
    Хеш основан на:
    - Сумме доната
    - Имени отправителя
    - Timestamp с точностью ДО СЕКУНДЫ (включая секунды!)
    
    Args:
        donation: Данные доната
        
    Returns:
        str: SHA256 хеш
    """
    # Timestamp с точностью до СЕКУНДЫ (включаем секунды, убираем только микросекунды)
    ts = donation.timestamp.replace(microsecond=0)
    
    # Создаём строку для хеширования
    data = f"{donation.amount}_{donation.sender_name}_{ts.isoformat()}"
    
    # Генерируем SHA256 хеш
    hash_value = hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    return hash_value


class DeduplicationManager:
    """
    Менеджер дедупликации донатов
    
    Phone Link может дублировать уведомления, поэтому необходимо
    фильтровать повторяющиеся донаты в течение определённого окна времени.
    """
    
    def __init__(
        self,
        window_seconds: int = 300,
        max_cache_size: int = 100
    ):
        """
        Инициализация менеджера
        
        Args:
            window_seconds: Окно времени для дедупликации (по умолчанию 5 минут)
            max_cache_size: Максимальное количество хешей в кэше
        """
        self.window_seconds = window_seconds
        self.max_cache_size = max_cache_size
        
        # Хранилище: {hash: timestamp}
        self.recent_hashes: Dict[str, datetime] = {}
        
        # Хранилище хешей которые уже залогировали как дубликаты (чтоб не спамить)
        self._logged_duplicates: set = set()
        
        logger.info(
            f"Инициализирован DeduplicationManager "
            f"(окно: {window_seconds}с, кэш: {max_cache_size})"
        )
    
    def is_duplicate(self, donation: "DonationData") -> bool:
        """
        Проверка, является ли донат дубликатом
        
        Args:
            donation: Данные доната
            
        Returns:
            bool: True если это дубликат
        """
        # Очистка старых хешей перед проверкой
        self._cleanup_old_hashes()
        
        # Генерируем хеш
        hash_value = generate_donation_hash(donation)
        
        # Проверяем наличие в кэше
        if hash_value in self.recent_hashes:
            # Это дубликат - логируем только первый раз
            if hash_value not in self._logged_duplicates:
                self._logged_duplicates.add(hash_value)
                logger.warning(
                    f"⚠️ Обнаружен дубликат: {donation.amount}₸ от {donation.sender_name}"
                )
            return True
        
        # ВАЖНО: Сохраняем СИСТЕМНОЕ ВРЕМЯ когда мы обнаружили донат, НЕ время доната!
        # Это нужно чтобы отслеживать период дедупликации в реальном времени
        detection_time = datetime.now()
        self.recent_hashes[hash_value] = detection_time
        
        # Проверка размера кэша
        if len(self.recent_hashes) > self.max_cache_size:
            self._trim_cache()
        
        logger.debug(f"Новый донат (не дубликат): {donation.amount}₸ от {donation.sender_name}")
        return False
    
    def _cleanup_old_hashes(self):
        """
        Очистка устаревших хешей из кэша
        
        Удаляет хеши, которые старше window_seconds
        """
        now = datetime.now()
        cutoff_time = now - timedelta(seconds=self.window_seconds)
        
        # Фильтруем старые хеши
        old_count = len(self.recent_hashes)
        self.recent_hashes = {
            h: ts for h, ts in self.recent_hashes.items()
            if ts >= cutoff_time
        }
        
        # Также очищаем logged_duplicates если они старше
        self._logged_duplicates = {
            h for h in self._logged_duplicates
            if h in self.recent_hashes
        }
        
        removed = old_count - len(self.recent_hashes)
        if removed > 0:
            logger.debug(f"Очищено {removed} старых хешей из кэша дедупликации")
    
    def _trim_cache(self):
        """
        Обрезка кэша до максимального размера
        
        Удаляет самые старые хеши если кэш переполнен
        """
        if len(self.recent_hashes) <= self.max_cache_size:
            return
        
        # Сортируем по timestamp и оставляем только последние max_cache_size
        sorted_hashes = sorted(
            self.recent_hashes.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Сохраняем только последние max_cache_size
        to_remove = set(h for h, ts in sorted_hashes[self.max_cache_size:])
        self.recent_hashes = dict(sorted_hashes[:self.max_cache_size])
        
        # Очищаем logged_duplicates для удаленных хешей
        self._logged_duplicates -= to_remove
        
        logger.debug(f"Кэш обрезан до {self.max_cache_size} элементов")
    
    def clear(self):
        """Очистка всего кэша"""
        self.recent_hashes.clear()
        self._logged_duplicates.clear()
        logger.info("Кэш дедупликации очищен")
    
    def get_cache_size(self) -> int:
        """
        Получить текущий размер кэша
        
        Returns:
            int: Количество хешей в кэше
        """
        return len(self.recent_hashes)
    
    def get_stats(self) -> dict:
        """
        Получить статистику кэша
        
        Returns:
            dict: Статистика (размер, старейший/новейший timestamp)
        """
        if not self.recent_hashes:
            return {
                "size": 0,
                "oldest": None,
                "newest": None
            }
        
        timestamps = list(self.recent_hashes.values())
        
        return {
            "size": len(self.recent_hashes),
            "oldest": min(timestamps).isoformat(),
            "newest": max(timestamps).isoformat()
        }

