"""
Auth Manager

Управление авторизацией, JWT токенами и Windows Credential Manager.
"""
import logging
import json
import base64
from typing import Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path

try:
    import win32cred
    import win32con
    WINDOWS_CREDENTIALS_AVAILABLE = True
except ImportError:
    WINDOWS_CREDENTIALS_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Windows Credentials недоступны. Установите pywin32: pip install pywin32")

from api import create_api_client
from config import Config

logger = logging.getLogger(__name__)


class AuthManager:
    """
    Менеджер авторизации
    
    Управляет:
    - JWT токенами (access/refresh)
    - Windows Credential Manager
    - Автоматическим обновлением токенов
    - Сохранением учётных данных
    """
    
    def __init__(self, use_mock_api: bool = True):
        """
        Инициализация менеджера авторизации
        
        Args:
            use_mock_api: Использовать Mock API
        """
        self.use_mock_api = use_mock_api
        self.api_client = None
        
        # Токены
        self.access_token = None
        self.refresh_token = None
        self.token_expires_at = None
        
        # Пользователь
        self.user_info = None
        self.is_authenticated = False
        
        # Настройки
        self.credentials_target = "DonatKZ_Desktop"
        self.settings_file = Path("data/auth_settings.json")
        
        logger.info("AuthManager инициализирован")
        logger.info(f"Mock API: {use_mock_api}")
        logger.info(f"Windows Credentials: {WINDOWS_CREDENTIALS_AVAILABLE}")
    
    def initialize(self) -> bool:
        """
        Инициализация менеджера
        
        Returns:
            bool: True если инициализация успешна
        """
        try:
            # Создаём API клиент
            self.api_client = create_api_client(use_mock=self.use_mock_api)
            
            # Загружаем сохранённые токены
            self._load_saved_tokens()
            
            # Проверяем валидность токенов
            if self.access_token and self._is_token_valid():
                self.is_authenticated = True
                logger.info("✅ Авторизация восстановлена из сохранённых токенов")
                return True
            
            logger.info("ℹ️ Требуется авторизация")
            return False
            
        except Exception as e:
            logger.exception(f"Ошибка инициализации AuthManager: {e}")
            return False
    
    def login(self, email: str, password: str, remember: bool = False) -> Tuple[bool, Any]:
        """
        Авторизация пользователя
        
        Args:
            email: Email пользователя
            password: Пароль
            remember: Запомнить пользователя
            
        Returns:
            Tuple[bool, Any]: (успех, результат или ошибка)
        """
        try:
            logger.info(f"Попытка авторизации: {email}")
            
            # Проверяем что API клиент инициализирован
            if not self.api_client:
                logger.error("API клиент не инициализирован")
                return False, "API клиент не инициализирован"
            
            # Выполняем авторизацию через API
            import asyncio
            result = asyncio.run(self.api_client.login(email, password))
            
            if result.get("success"):
                # Сохраняем токены
                self.access_token = result.get("access_token")
                self.refresh_token = result.get("refresh_token")
                self.user_info = result.get("user", {})
                
                # Вычисляем время истечения токена
                self.token_expires_at = self._calculate_token_expiry()
                
                # Сохраняем токены
                self._save_tokens()
                
                # Сохраняем учётные данные если нужно
                if remember:
                    self._save_credentials(email, password)
                
                self.is_authenticated = True
                
                logger.info(f"✅ Авторизация успешна: {self.user_info.get('email', email)}")
                return True, result
            else:
                error_msg = result.get("error", "Неизвестная ошибка авторизации")
                logger.warning(f"❌ Ошибка авторизации: {error_msg}")
                return False, error_msg
                
        except Exception as e:
            logger.exception(f"Ошибка авторизации: {e}")
            return False, str(e)
    
    def logout(self) -> bool:
        """
        Выход из аккаунта
        
        Returns:
            bool: True если выход успешен
        """
        try:
            logger.info("Выход из аккаунта...")
            
            # Очищаем токены
            self.access_token = None
            self.refresh_token = None
            self.token_expires_at = None
            self.user_info = None
            self.is_authenticated = False
            
            # Удаляем сохранённые токены
            self._clear_saved_tokens()
            
            # Удаляем учётные данные
            self._clear_credentials()
            
            logger.info("✅ Выход выполнен")
            return True
            
        except Exception as e:
            logger.exception(f"Ошибка выхода: {e}")
            return False
    
    def refresh_access_token(self) -> bool:
        """
        Обновление access token через refresh token
        
        Returns:
            bool: True если обновление успешно
        """
        try:
            if not self.refresh_token:
                logger.warning("Нет refresh token для обновления")
                return False
            
            logger.info("Обновление access token...")
            
            # Проверяем что API клиент инициализирован
            if not self.api_client:
                logger.error("API клиент не инициализирован")
                return False
            
            # Обновляем токен через API
            import asyncio
            result = asyncio.run(self.api_client.refresh_token(self.refresh_token))
            
            if result.get("success"):
                self.access_token = result.get("access_token")
                self.token_expires_at = self._calculate_token_expiry()
                
                # Сохраняем обновлённые токены
                self._save_tokens()
                
                logger.info("✅ Access token обновлён")
                return True
            else:
                logger.warning(f"❌ Не удалось обновить токен: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.exception(f"Ошибка обновления токена: {e}")
            return False
    
    def get_valid_token(self) -> Optional[str]:
        """
        Получение валидного access token
        
        Returns:
            str: Валидный токен или None
        """
        try:
            # Если токен валиден, возвращаем его
            if self.access_token and self._is_token_valid():
                return self.access_token
            
            # Если токен истёк, пытаемся обновить
            if self.refresh_token:
                if self.refresh_access_token():
                    return self.access_token
            
            # Если не удалось обновить, требуется повторная авторизация
            logger.warning("Требуется повторная авторизация")
            return None
            
        except Exception as e:
            logger.exception(f"Ошибка получения токена: {e}")
            return None
    
    def get_user_info(self) -> Optional[Dict[str, Any]]:
        """
        Получение информации о пользователе
        
        Returns:
            dict: Информация о пользователе или None
        """
        return self.user_info
    
    def get_saved_email(self) -> Optional[str]:
        """
        Получение сохранённого email
        
        Returns:
            str: Email или None
        """
        try:
            if not WINDOWS_CREDENTIALS_AVAILABLE:
                return None
            
            # Читаем из Windows Credential Manager
            cred = win32cred.CredRead(self.credentials_target, win32cred.CRED_TYPE_GENERIC)
            if cred:
                data = json.loads(cred['CredentialBlob'].decode('utf-8'))
                return data.get('email')
            
            return None
            
        except Exception as e:
            logger.debug(f"Не удалось получить сохранённый email: {e}")
            return None
    
    def _is_token_valid(self) -> bool:
        """
        Проверка валидности токена
        
        Returns:
            bool: True если токен валиден
        """
        if not self.access_token or not self.token_expires_at:
            return False
        
        # Проверяем время истечения
        return datetime.now() < self.token_expires_at
    
    def _calculate_token_expiry(self) -> datetime:
        """
        Вычисление времени истечения токена
        
        Returns:
            datetime: Время истечения
        """
        # По умолчанию токен действует 1 час
        return datetime.now() + timedelta(hours=1)
    
    def _save_tokens(self):
        """Сохранение токенов"""
        try:
            if not self.access_token:
                return
            
            # Создаём директорию если не существует
            self.settings_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Сохраняем токены
            tokens_data = {
                "access_token": self.access_token,
                "refresh_token": self.refresh_token,
                "expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
                "user_info": self.user_info
            }
            
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                json.dump(tokens_data, f, indent=2, ensure_ascii=False)
            
            logger.debug("Токены сохранены")
            
        except Exception as e:
            logger.warning(f"Не удалось сохранить токены: {e}")
    
    def _load_saved_tokens(self):
        """Загрузка сохранённых токенов"""
        try:
            if not self.settings_file.exists():
                return
            
            with open(self.settings_file, 'r', encoding='utf-8') as f:
                tokens_data = json.load(f)
            
            self.access_token = tokens_data.get("access_token")
            self.refresh_token = tokens_data.get("refresh_token")
            self.user_info = tokens_data.get("user_info")
            
            # Восстанавливаем время истечения
            expires_str = tokens_data.get("expires_at")
            if expires_str:
                self.token_expires_at = datetime.fromisoformat(expires_str)
            
            logger.debug("Токены загружены")
            
        except Exception as e:
            logger.warning(f"Не удалось загрузить токены: {e}")
    
    def _clear_saved_tokens(self):
        """Очистка сохранённых токенов"""
        try:
            if self.settings_file.exists():
                self.settings_file.unlink()
            logger.debug("Сохранённые токены очищены")
        except Exception as e:
            logger.warning(f"Не удалось очистить токены: {e}")
    
    def _save_credentials(self, email: str, password: str):
        """
        Сохранение учётных данных в Windows Credential Manager
        
        Args:
            email: Email пользователя
            password: Пароль
        """
        try:
            if not WINDOWS_CREDENTIALS_AVAILABLE:
                logger.warning("Windows Credential Manager недоступен")
                return
            
            # Подготавливаем данные
            cred_data = {
                "email": email,
                "password": password
            }
            
            # Сохраняем в Windows Credential Manager
            win32cred.CredWrite({
                'Type': win32cred.CRED_TYPE_GENERIC,
                'TargetName': self.credentials_target,
                'UserName': email,
                'CredentialBlob': json.dumps(cred_data).encode('utf-8'),
                'Comment': 'DonatKZ Desktop App Credentials'
            })
            
            logger.debug("Учётные данные сохранены")
            
        except Exception as e:
            logger.warning(f"Не удалось сохранить учётные данные: {e}")
    
    def _clear_credentials(self):
        """Очистка учётных данных"""
        try:
            if not WINDOWS_CREDENTIALS_AVAILABLE:
                return
            
            # Удаляем из Windows Credential Manager
            win32cred.CredDelete(self.credentials_target, win32cred.CRED_TYPE_GENERIC)
            logger.debug("Учётные данные очищены")
            
        except Exception as e:
            logger.debug(f"Не удалось очистить учётные данные: {e}")
    
    def get_auth_status(self) -> Dict[str, Any]:
        """
        Получение статуса авторизации
        
        Returns:
            dict: Статус авторизации
        """
        return {
            "is_authenticated": self.is_authenticated,
            "has_access_token": self.access_token is not None,
            "has_refresh_token": self.refresh_token is not None,
            "token_valid": self._is_token_valid(),
            "user_info": self.user_info,
            "expires_at": self.token_expires_at
        }
