"""Factory for creating API clients"""
import logging
import sys
from pathlib import Path
from typing import Union

# Добавляем src в путь если нужно
src_path = Path(__file__).parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from .base_client import BaseAPIClient
from .mock_client import MockDonatKZAPI
from .client import DonatKZAPI

# Импортируем Config напрямую
try:
    from config import Config
except ImportError:
    # Fallback для тестов
    class Config:
        USE_MOCK_API = True
        API_BASE_URL = "http://localhost:8080/api"
        API_TIMEOUT_SECONDS = 30
        MAX_RETRY_ATTEMPTS = 3

logger = logging.getLogger(__name__)


def create_api_client(
    use_mock: bool = None,
    base_url: str = None
) -> BaseAPIClient:
    """
    Factory функция для создания API клиента
    
    Выбирает между Mock API (для разработки) и Real API (для продакшена)
    на основе конфигурации.
    
    Args:
        use_mock: Использовать Mock API (если None - берётся из Config)
        base_url: Базовый URL API (если None - берётся из Config)
        
    Returns:
        BaseAPIClient: Экземпляр Mock или Real API клиента
        
    Examples:
        >>> # Автоматический выбор на основе Config
        >>> client = create_api_client()
        
        >>> # Явное указание Mock API
        >>> client = create_api_client(use_mock=True)
        
        >>> # Явное указание Real API с кастомным URL
        >>> client = create_api_client(use_mock=False, base_url="https://api.donatkz.com")
    """
    # Определяем параметры
    if use_mock is None:
        use_mock = Config.USE_MOCK_API
    
    if base_url is None:
        base_url = Config.API_BASE_URL
    
    # Создаём клиент
    if use_mock:
        logger.info("[FACTORY] Creating Mock API client")
        return MockDonatKZAPI(
            base_url=base_url,
            network_delay_min=0.1,
            network_delay_max=0.5
        )
    else:
        logger.info("[FACTORY] Creating Real API client")
        return DonatKZAPI(
            base_url=base_url,
            timeout=Config.API_TIMEOUT_SECONDS,
            max_retries=Config.MAX_RETRY_ATTEMPTS
        )


def create_mock_api_client(
    base_url: str = None,
    network_delay_min: float = 0.1,
    network_delay_max: float = 0.5
) -> MockDonatKZAPI:
    """
    Явное создание Mock API клиента с кастомными параметрами
    
    Args:
        base_url: Базовый URL API
        network_delay_min: Минимальная задержка сети (секунды)
        network_delay_max: Максимальная задержка сети (секунды)
        
    Returns:
        MockDonatKZAPI: Экземпляр Mock API клиента
    """
    if base_url is None:
        base_url = Config.API_BASE_URL
    
    logger.info("[FACTORY] Creating Mock API client (explicit)")
    return MockDonatKZAPI(
        base_url=base_url,
        network_delay_min=network_delay_min,
        network_delay_max=network_delay_max
    )


def create_real_api_client(
    base_url: str = None,
    timeout: int = None,
    max_retries: int = None
) -> DonatKZAPI:
    """
    Явное создание Real API клиента с кастомными параметрами
    
    Args:
        base_url: Базовый URL API
        timeout: Таймаут запросов (секунды)
        max_retries: Максимальное количество повторных попыток
        
    Returns:
        DonatKZAPI: Экземпляр Real API клиента
        
    Note:
        Real API клиент будет полностью реализован в Этапе 8
    """
    if base_url is None:
        base_url = Config.API_BASE_URL
    
    if timeout is None:
        timeout = Config.API_TIMEOUT_SECONDS
    
    if max_retries is None:
        max_retries = Config.MAX_RETRY_ATTEMPTS
    
    logger.info("[FACTORY] Creating Real API client (explicit)")
    return DonatKZAPI(
        base_url=base_url,
        timeout=timeout,
        max_retries=max_retries
    )

