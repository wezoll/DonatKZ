"""Real API client for production"""
import aiohttp
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .base_client import BaseAPIClient

logger = logging.getLogger(__name__)


class DonatKZAPI(BaseAPIClient):
    """
    Реальный API клиент для взаимодействия с backend сервером
    
    Использует aiohttp для асинхронных HTTP запросов.
    Поддерживает JWT авторизацию, retry механизм, таймауты.
    
    TODO: Полная реализация будет в Этапе 8
    """
    
    def __init__(
        self,
        base_url: str,
        timeout: int = 30,
        max_retries: int = 3
    ):
        """
        Инициализация Real API клиента
        
        Args:
            base_url: Базовый URL API
            timeout: Таймаут запросов (секунды)
            max_retries: Максимальное количество повторных попыток
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.max_retries = max_retries
        self.session: Optional[aiohttp.ClientSession] = None
        
        logger.info(f"[REAL API] Инициализирован с base_url={base_url}")
    
    async def _ensure_session(self):
        """Создание сессии если её нет"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(timeout=self.timeout)
    
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Авторизация пользователя
        
        TODO: Реализация в Этапе 8
        """
        raise NotImplementedError("Real API client will be implemented in Stage 8")
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Обновление access token
        
        TODO: Реализация в Этапе 8
        """
        raise NotImplementedError("Real API client will be implemented in Stage 8")
    
    async def device_pair(self, code: str, device_id: str, device_name: str = "Desktop App") -> Dict[str, Any]:
        """
        Привязка устройства к аккаунту через 6-значный код
        
        Args:
            code: 6-значный код с сайта
            device_id: UUID устройства
            device_name: Название устройства
            
        Returns:
            dict: Данные о привязке или ошибка
        """
        try:
            await self._ensure_session()
            
            url = f"{self.base_url}/api/device/pair"
            payload = {
                "code": code.upper(),
                "deviceId": device_id,
                "deviceName": device_name
            }
            
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info("✅ Устройство успешно привязано")
                    return result
                else:
                    error_data = await response.json()
                    logger.error(f"❌ Ошибка привязки устройства: {error_data.get('message')}")
                    return {"error": error_data.get("message", "Неизвестная ошибка")}
                    
        except Exception as e:
            logger.exception(f"❌ Ошибка привязки устройства: {e}")
            return {"error": str(e)}
    
    async def device_validate(self, device_token: str) -> Dict[str, Any]:
        """
        Проверка валидности device token
        
        Args:
            device_token: Device Token
            
        Returns:
            dict: Данные о пользователе или ошибка
        """
        try:
            await self._ensure_session()
            
            url = f"{self.base_url}/api/device/validate"
            headers = {"Authorization": f"Bearer {device_token}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info("✅ Device token валидный")
                    return result
                else:
                    error_data = await response.json()
                    logger.warning(f"⚠️ Device token невалидный: {error_data.get('message')}")
                    return {"error": error_data.get("message", "Неизвестная ошибка")}
                    
        except Exception as e:
            logger.exception(f"❌ Ошибка валидации токена: {e}")
            return {"error": str(e)}
    
    async def send_donation(self, donation_data: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """
        Отправка доната на Backend
        
        Args:
            donation_data: Данные доната
            access_token: Device Token
            
        Returns:
            dict: Результат отправки
        """
        try:
            await self._ensure_session()
            
            url = f"{self.base_url}/api/donations"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            async with self.session.post(url, json=donation_data, headers=headers) as response:
                if response.status == 201:
                    result = await response.json()
                    logger.info(f"✅ Донат отправлен на Backend")
                    return result
                else:
                    error_data = await response.json()
                    logger.error(f"❌ Ошибка отправки доната: {error_data.get('message')}")
                    return {"error": error_data.get("message", "Неизвестная ошибка")}
                    
        except Exception as e:
            logger.exception(f"❌ Ошибка отправки доната: {e}")
            return {"error": str(e)}
    
    async def get_settings(self, access_token: str) -> Dict[str, Any]:
        """
        Получение настроек пользователя
        
        TODO: Реализация в Этапе 8
        """
        raise NotImplementedError("Real API client will be implemented in Stage 8")
    
    async def update_settings(self, settings: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """
        Обновление настроек пользователя
        
        TODO: Реализация в Этапе 8
        """
        raise NotImplementedError("Real API client will be implemented in Stage 8")
    
    async def get_donations_stats(self, access_token: str) -> Dict[str, Any]:
        """
        Получение статистики донатов
        
        Args:
            access_token: Device Token
            
        Returns:
            dict: Статистика донатов или ошибка
        """
        try:
            await self._ensure_session()
            
            url = f"{self.base_url}/api/donations/stats"
            headers = {"Authorization": f"Bearer {access_token}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info("✅ Статистика получена с Backend")
                    return result
                else:
                    error_data = await response.json()
                    logger.warning(f"⚠️ Ошибка получения статистики: {error_data.get('message')}")
                    return {"error": error_data.get("message", "Неизвестная ошибка")}
                    
        except Exception as e:
            logger.exception(f"❌ Ошибка получения статистики: {e}")
            return {"error": str(e)}
    
    async def get_stats(self, access_token: str, date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Получение статистики донатов (legacy метод)
        
        Использует get_donations_stats
        """
        return await self.get_donations_stats(access_token)
    
    async def ping(self) -> Dict[str, Any]:
        """
        Проверка доступности API
        
        TODO: Реализация в Этапе 8
        """
        raise NotImplementedError("Real API client will be implemented in Stage 8")
    
    async def close(self):
        """Закрытие сессии"""
        if self.session and not self.session.closed:
            await self.session.close()
            logger.info("[REAL API] Session closed")





