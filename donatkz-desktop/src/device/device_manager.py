"""
Device Manager

Управление Device ID и привязкой устройства к аккаунту через Backend API
"""
import logging
import uuid
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)


class DeviceManager:
    """
    Менеджер устройства для Desktop App
    
    Управляет:
    - Генерацией и хранением Device ID (UUID)
    - Привязкой устройства к аккаунту через 6-значный код
    - Хранением Device Token от Backend
    - Информацией о пользователе и подписке
    """
    
    def __init__(self, db_manager):
        """
        Инициализация DeviceManager
        
        Args:
            db_manager: DatabaseManager для работы с БД
        """
        self.db_manager = db_manager
        self._device_id = None
        self._device_token = None
        self._user_info = None
        
        logger.info("DeviceManager инициализирован")
    
    def get_or_create_device_id(self) -> str:
        """
        Получить Device ID или создать новый если его нет
        
        Returns:
            str: Device ID (UUID)
        """
        # Если уже загружен в памяти, возвращаем его
        if self._device_id:
            return self._device_id
        
        # Пытаемся загрузить из БД
        device_id = self.db_manager.get_setting("device_id")
        
        if device_id:
            logger.info(f"Device ID загружен из БД: {device_id}")
            self._device_id = device_id
            return device_id
        
        # Если нет в БД - генерируем новый UUID
        device_id = str(uuid.uuid4()).upper()
        logger.info(f"Сгенерирован новый Device ID: {device_id}")
        
        # Сохраняем в БД
        self.db_manager.set_setting("device_id", device_id)
        self._device_id = device_id
        
        return device_id
    
    def get_device_id(self) -> Optional[str]:
        """
        Получить Device ID (без создания нового)
        
        Returns:
            str: Device ID или None
        """
        if self._device_id:
            return self._device_id
        
        self._device_id = self.db_manager.get_setting("device_id")
        return self._device_id
    
    def get_device_token(self) -> Optional[str]:
        """
        Получить Device Token
        
        Returns:
            str: Device Token или None
        """
        if self._device_token:
            return self._device_token
        
        self._device_token = self.db_manager.get_setting("device_token")
        return self._device_token
    
    def save_pairing_info(self, pairing_data: Dict[str, Any]) -> bool:
        """
        Сохранить информацию о привязке устройства
        
        Args:
            pairing_data: Данные ответа от POST /api/device/pair
            
        Returns:
            bool: True если успешно сохранено
        """
        try:
            # Сохраняем токен
            device_token = pairing_data.get("deviceToken")
            if device_token:
                self.db_manager.set_setting("device_token", device_token)
                self._device_token = device_token
            
            # Сохраняем информацию о пользователе
            username = pairing_data.get("username")
            email = pairing_data.get("email")
            subscription_tier = pairing_data.get("subscriptionTier")
            
            if username:
                self.db_manager.set_setting("username", username)
            if email:
                self.db_manager.set_setting("email", email)
            if subscription_tier:
                self.db_manager.set_setting("subscription_tier", subscription_tier)
            
            self._user_info = {
                "username": username,
                "email": email,
                "subscriptionTier": subscription_tier,
                "subscriptionExpiresAt": pairing_data.get("subscriptionExpiresAt"),
                "pairedAt": pairing_data.get("pairedAt")
            }
            
            logger.info("✅ Информация о привязке сохранена")
            return True
            
        except Exception as e:
            logger.exception(f"❌ Ошибка сохранения информации о привязке: {e}")
            return False
    
    def get_user_info(self) -> Optional[Dict[str, Any]]:
        """
        Получить информацию о пользователе
        
        Returns:
            dict: Информация о пользователе или None
        """
        if self._user_info:
            return self._user_info
        
        # Загружаем из БД если нет в памяти
        username = self.db_manager.get_setting("username")
        email = self.db_manager.get_setting("email")
        subscription_tier = self.db_manager.get_setting("subscription_tier")
        
        if username:
            self._user_info = {
                "username": username,
                "email": email,
                "subscriptionTier": subscription_tier
            }
            return self._user_info
        
        return None
    
    def clear_pairing(self) -> bool:
        """
        Отвязать устройство от аккаунта
        
        Returns:
            bool: True если успешно
        """
        try:
            # Удаляем токен и информацию о пользователе
            self.db_manager.delete_setting("device_token")
            self.db_manager.delete_setting("username")
            self.db_manager.delete_setting("email")
            self.db_manager.delete_setting("subscription_tier")
            
            self._device_token = None
            self._user_info = None
            
            logger.info("✅ Устройство отвязано от аккаунта")
            return True
            
        except Exception as e:
            logger.exception(f"❌ Ошибка отвязки устройства: {e}")
            return False
    
    def is_paired(self) -> bool:
        """
        Проверка привязано ли устройство к аккаунту
        
        Returns:
            bool: True если привязано
        """
        return self.get_device_token() is not None
    
    def update_user_info(self, user_info: Dict[str, Any]) -> bool:
        """
        Обновить информацию о пользователе (после validate)
        
        Args:
            user_info: Информация от GET /api/device/validate
            
        Returns:
            bool: True если успешно
        """
        try:
            self._user_info = user_info
            
            # Обновляем в БД если нужно
            if user_info.get("username"):
                self.db_manager.set_setting("username", user_info["username"])
            if user_info.get("email"):
                self.db_manager.set_setting("email", user_info["email"])
            if user_info.get("subscriptionTier"):
                self.db_manager.set_setting("subscription_tier", user_info["subscriptionTier"])
            
            return True
            
        except Exception as e:
            logger.exception(f"❌ Ошибка обновления информации о пользователе: {e}")
            return False

