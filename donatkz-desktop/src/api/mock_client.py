"""Mock API client for development"""
import asyncio
import random
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from .base_client import BaseAPIClient

logger = logging.getLogger(__name__)


class MockDonatKZAPI(BaseAPIClient):
    """
    Mock API клиент для разработки без реального backend сервера
    
    Возвращает успешные ответы для всех запросов с имитацией задержки сети.
    Все запросы логируются в консоль для отладки.
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:8080/api",
        network_delay_min: float = 0.1,
        network_delay_max: float = 0.5
    ):
        """
        Инициализация Mock API клиента
        
        Args:
            base_url: Базовый URL API (не используется, только для совместимости)
            network_delay_min: Минимальная задержка имитации сети (секунды)
            network_delay_max: Максимальная задержка имитации сети (секунды)
        """
        self.base_url = base_url
        self.network_delay_min = network_delay_min
        self.network_delay_max = network_delay_max
        
        # Mock база данных
        self.mock_users = {
            "test@example.com": {
                "id": 1,
                "email": "test@example.com",
                "username": "test_user",
                "password": "password123"
            }
        }
        
        self.mock_donations: List[Dict[str, Any]] = []
        self.mock_settings = {
            "minAmount": 100.0,
            "maxAmount": 1000000.0,
            "soundEnabled": True,
            "notificationsEnabled": True
        }
        
        self.request_count = 0
        
        logger.info(f"[MOCK API] Инициализирован с base_url={base_url}")
    
    async def _simulate_network_delay(self):
        """Имитация задержки сети"""
        delay = random.uniform(self.network_delay_min, self.network_delay_max)
        await asyncio.sleep(delay)
    
    def _log_request(self, method: str, endpoint: str, data: Optional[Dict] = None):
        """
        Логирование запроса
        
        Args:
            method: HTTP метод
            endpoint: Endpoint
            data: Данные запроса
        """
        self.request_count += 1
        logger.info(f"[MOCK API] [{self.request_count}] {method} {endpoint}")
        if data:
            # Логируем без паролей и токенов
            safe_data = {k: v for k, v in data.items() if k not in ['password', 'access_token', 'refresh_token']}
            if safe_data:
                logger.debug(f"[MOCK API] Request data: {safe_data}")
    
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Mock авторизация
        
        Принимает любой email/password и возвращает успешный ответ
        """
        self._log_request("POST", "/auth/login", {"email": email})
        await self._simulate_network_delay()
        
        # Проверяем mock пользователя
        user = self.mock_users.get(email)
        if not user:
            # Создаём нового пользователя на лету
            user = {
                "id": len(self.mock_users) + 1,
                "email": email,
                "username": email.split("@")[0],
                "password": password
            }
            self.mock_users[email] = user
        
        response = {
            "success": True,
            "access_token": f"mock_access_token_{random.randint(1000, 9999)}",
            "refresh_token": f"mock_refresh_token_{random.randint(1000, 9999)}",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"]
            }
        }
        
        logger.info(f"[MOCK API] Login successful for {email}")
        return response
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Mock обновление токена
        
        Всегда возвращает новые токены
        """
        self._log_request("POST", "/auth/refresh")
        await self._simulate_network_delay()
        
        response = {
            "success": True,
            "access_token": f"mock_access_token_{random.randint(1000, 9999)}",
            "refresh_token": f"mock_refresh_token_{random.randint(1000, 9999)}"
        }
        
        logger.info("[MOCK API] Token refreshed")
        return response
    
    async def send_donation(self, donation_data: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """
        Mock отправка доната
        
        Сохраняет донат в mock базу и возвращает успешный ответ
        """
        self._log_request("POST", "/donations", donation_data)
        await self._simulate_network_delay()
        
        # Добавляем ID и сохраняем в mock базу
        donation_id = len(self.mock_donations) + 1
        donation_with_id = {
            "id": donation_id,
            **donation_data,
            "created_at": datetime.now().isoformat()
        }
        self.mock_donations.append(donation_with_id)
        
        response = {
            "success": True,
            "id": donation_id,
            "message": "Donation received successfully"
        }
        
        logger.info(
            f"[MOCK API] Donation saved: {donation_data['amount']}₸ "
            f"from {donation_data.get('senderName', 'Unknown')}"
        )
        return response
    
    async def get_settings(self, access_token: str) -> Dict[str, Any]:
        """
        Mock получение настроек
        
        Возвращает mock настройки
        """
        self._log_request("GET", "/settings")
        await self._simulate_network_delay()
        
        response = {
            "success": True,
            "settings": self.mock_settings.copy()
        }
        
        logger.info("[MOCK API] Settings retrieved")
        return response
    
    async def update_settings(self, settings: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """
        Mock обновление настроек
        
        Сохраняет настройки в mock базу
        """
        self._log_request("PUT", "/settings", settings)
        await self._simulate_network_delay()
        
        # Обновляем mock настройки
        self.mock_settings.update(settings)
        
        response = {
            "success": True,
            "message": "Settings updated successfully"
        }
        
        logger.info(f"[MOCK API] Settings updated: {settings}")
        return response
    
    async def get_stats(self, access_token: str, date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Mock получение статистики
        
        Возвращает статистику по сохранённым донатам
        """
        target_date = date or datetime.now()
        self._log_request("GET", f"/stats?date={target_date.date()}")
        await self._simulate_network_delay()
        
        # Фильтруем донаты по дате
        target_date_str = target_date.date().isoformat()
        today_donations = [
            d for d in self.mock_donations
            if d.get("timestamp", "").startswith(target_date_str)
        ]
        
        count = len(today_donations)
        total = sum(d.get("amount", 0) for d in today_donations)
        average = total / count if count > 0 else 0
        
        response = {
            "success": True,
            "stats": {
                "count": count,
                "total": total,
                "average": average,
                "donations": today_donations[-10:]  # Последние 10
            }
        }
        
        logger.info(f"[MOCK API] Stats retrieved: {count} donations, {total}₸ total")
        return response
    
    async def ping(self) -> Dict[str, Any]:
        """
        Mock проверка доступности
        
        Всегда возвращает успешный ответ
        """
        self._log_request("GET", "/ping")
        await self._simulate_network_delay()
        
        response = {
            "success": True,
            "message": "pong",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.debug("[MOCK API] Ping successful")
        return response
    
    async def close(self):
        """
        Закрытие клиента
        
        Для Mock API ничего не делает, т.к. нет реальных соединений
        """
        logger.info(
            f"[MOCK API] Closing client. "
            f"Total requests: {self.request_count}, "
            f"Donations: {len(self.mock_donations)}"
        )
    
    # Дополнительные методы для отладки
    
    def get_mock_donations(self) -> List[Dict[str, Any]]:
        """
        Получить все mock донаты (для тестирования)
        
        Returns:
            List[dict]: Список всех донатов
        """
        return self.mock_donations.copy()
    
    def clear_mock_donations(self):
        """Очистить mock донаты (для тестирования)"""
        self.mock_donations.clear()
        logger.debug("[MOCK API] Mock donations cleared")
    
    def get_request_count(self) -> int:
        """
        Получить количество запросов (для тестирования)
        
        Returns:
            int: Количество запросов
        """
        return self.request_count
    
    def reset_request_count(self):
        """Сбросить счётчик запросов (для тестирования)"""
        self.request_count = 0
        logger.debug("[MOCK API] Request count reset")





