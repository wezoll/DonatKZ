"""Configuration management"""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()


class Config:
    """
    Конфигурация приложения
    
    Загружает настройки из переменных окружения (.env файл)
    """
    
    # Пути
    BASE_DIR = Path(__file__).parent.parent
    LOGS_DIR = BASE_DIR / "logs"
    DATA_DIR = BASE_DIR / "data"
    
    # API Settings
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8080")
    USE_MOCK_API: bool = os.getenv("USE_MOCK_API", "false").lower() == "true"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "DEBUG")
    LOG_FILE: Path = LOGS_DIR / "donatkz.log"
    LOG_MAX_BYTES: int = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT: int = 5
    
    # Donation Limits
    MIN_DONATION_AMOUNT: float = float(os.getenv("MIN_DONATION_AMOUNT", "100"))
    MAX_DONATION_AMOUNT: float = float(os.getenv("MAX_DONATION_AMOUNT", "2000000"))
    
    # Deduplication
    DEDUPLICATION_WINDOW_SECONDS: int = int(
        os.getenv("DEDUPLICATION_WINDOW_SECONDS", "60")
    )
    DEDUPLICATION_MAX_CACHE_SIZE: int = 100
    
    # Notification Settings
    NOTIFICATION_MAX_AGE_MINUTES: int = int(
        os.getenv("NOTIFICATION_MAX_AGE_MINUTES", "1440")
    )
    
    # Retry Settings
    MAX_RETRY_ATTEMPTS: int = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))
    RETRY_DELAY_SECONDS: float = float(os.getenv("RETRY_DELAY_SECONDS", "2"))
    RETRY_EXPONENTIAL_BASE: float = 2.0
    
    # API Timeouts
    API_TIMEOUT_SECONDS: int = 30
    API_CONNECT_TIMEOUT_SECONDS: int = 10
    
    # Rate Limiting
    MAX_REQUESTS_PER_SECOND: float = 1.0
    
    # GUI Settings
    WINDOW_TITLE: str = "DonatKZ Desktop"
    WINDOW_VERSION: str = "v0.1.0"
    WINDOW_DEFAULT_WIDTH: int = 800
    WINDOW_DEFAULT_HEIGHT: int = 600
    WINDOW_MIN_WIDTH: int = 600
    WINDOW_MIN_HEIGHT: int = 400
    
    # Settings file
    SETTINGS_FILE: Path = DATA_DIR / "settings.json"
    
    # Database
    DATABASE_FILE: Path = DATA_DIR / "donations_queue.db"
    DATABASE_MAX_QUEUE_SIZE: int = 1000
    
    # Donations Database (новая БД для хранения всех донатов)
    DONATIONS_DB_FILE: Path = BASE_DIR / "donations.db"
    DONATIONS_DB_TIMEOUT: int = 30
    
    # Logo/Icon
    LOGO_PATH: Path = BASE_DIR / "DONATKZ_LOGO.png"
    
    # Windows Credential Manager
    CREDENTIAL_TARGET_NAME: str = "DonatKZ_Desktop_App"
    
    # WebSocket
    WEBSOCKET_RECONNECT_DELAY: int = 5
    WEBSOCKET_PING_INTERVAL: int = 30
    
    @classmethod
    def init_directories(cls):
        """Создание необходимых директорий"""
        cls.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_log_level(cls) -> int:
        """
        Получить числовой уровень логирования
        
        Returns:
            int: Уровень логирования (logging.DEBUG, INFO, etc)
        """
        import logging
        return getattr(logging, cls.LOG_LEVEL.upper(), logging.DEBUG)
    
    @classmethod
    def is_development(cls) -> bool:
        return cls.USE_MOCK_API
    
    @classmethod
    def get_api_url(cls, endpoint: str = "") -> str:
        """
        Получить полный URL API endpoint
        
        Args:
            endpoint: Путь endpoint (например "/donations")
            
        Returns:
            str: Полный URL
        """
        base = cls.API_BASE_URL.rstrip("/")
        endpoint = endpoint.lstrip("/")
        return f"{base}/{endpoint}" if endpoint else base
    
    def __repr__(self) -> str:
        """Строковое представление конфигурации"""
        return (
            f"Config("
            f"API={self.API_BASE_URL}, "
            f"MOCK={self.USE_MOCK_API}, "
            f"LOG_LEVEL={self.LOG_LEVEL}"
            f")"
        )


# Инициализация директорий при импорте
Config.init_directories()


