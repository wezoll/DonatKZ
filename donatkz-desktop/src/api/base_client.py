"""Base API client interface"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime


class BaseAPIClient(ABC):
    """
    Базовый интерфейс для API клиента DonatKZ
    
    Определяет контракт для взаимодействия с backend API.
    Имплементации: MockDonatKZAPI (для разработки), DonatKZAPI (продакшн)
    """
    
    @abstractmethod
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Авторизация пользователя
        
        Args:
            email: Email пользователя
            password: Пароль
            
        Returns:
            dict: {
                "success": bool,
                "access_token": str,
                "refresh_token": str,
                "user": {
                    "id": int,
                    "email": str,
                    "username": str
                }
            }
            
        Raises:
            Exception: При ошибке авторизации
        """
        pass
    
    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Обновление access token через refresh token
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            dict: {
                "success": bool,
                "access_token": str,
                "refresh_token": str
            }
            
        Raises:
            Exception: При ошибке обновления токена
        """
        pass
    
    @abstractmethod
    async def send_donation(self, donation_data: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """
        Отправка доната на сервер
        
        Args:
            donation_data: Данные доната {
                "amount": float,
                "senderName": str,
                "message": str,
                "timestamp": str (ISO format),
                "rawText": str
            }
            access_token: Access token для авторизации
            
        Returns:
            dict: {
                "success": bool,
                "id": int,
                "message": str
            }
            
        Raises:
            Exception: При ошибке отправки
        """
        pass
    
    @abstractmethod
    async def get_settings(self, access_token: str) -> Dict[str, Any]:
        """
        Получение настроек пользователя с сервера
        
        Args:
            access_token: Access token для авторизации
            
        Returns:
            dict: {
                "success": bool,
                "settings": {
                    "minAmount": float,
                    "maxAmount": float,
                    "soundEnabled": bool,
                    "notificationsEnabled": bool
                }
            }
            
        Raises:
            Exception: При ошибке получения настроек
        """
        pass
    
    @abstractmethod
    async def update_settings(self, settings: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """
        Обновление настроек пользователя
        
        Args:
            settings: Новые настройки
            access_token: Access token для авторизации
            
        Returns:
            dict: {
                "success": bool,
                "message": str
            }
            
        Raises:
            Exception: При ошибке обновления
        """
        pass
    
    @abstractmethod
    async def get_stats(self, access_token: str, date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Получение статистики донатов
        
        Args:
            access_token: Access token для авторизации
            date: Дата для статистики (по умолчанию сегодня)
            
        Returns:
            dict: {
                "success": bool,
                "stats": {
                    "count": int,
                    "total": float,
                    "average": float,
                    "donations": List[dict]
                }
            }
            
        Raises:
            Exception: При ошибке получения статистики
        """
        pass
    
    @abstractmethod
    async def ping(self) -> Dict[str, Any]:
        """
        Проверка доступности API
        
        Returns:
            dict: {
                "success": bool,
                "message": str,
                "timestamp": str
            }
            
        Raises:
            Exception: При ошибке подключения
        """
        pass
    
    @abstractmethod
    async def close(self):
        """
        Закрытие соединения и освобождение ресурсов
        """
        pass






