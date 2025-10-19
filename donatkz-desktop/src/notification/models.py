"""Data models for donation notifications"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class DonationData:
    """
    Модель данных для доната из уведомления Kaspi
    
    Attributes:
        amount: Сумма доната в тенге
        sender_name: Имя отправителя
        message: Опциональное сообщение от отправителя
        timestamp: Время получения уведомления
        raw_notification: Исходный текст уведомления
    """
    amount: float
    sender_name: str
    message: Optional[str]
    timestamp: datetime
    raw_notification: str
    
    def to_dict(self) -> dict:
        """
        Конвертация в словарь для отправки на API
        
        Returns:
            dict: Данные доната в формате API
        """
        return {
            "amount": self.amount,
            "senderName": self.sender_name,
            "message": self.message or "",
            "timestamp": self.timestamp.isoformat(),
            "rawText": self.raw_notification
        }
    
    def __str__(self) -> str:
        """Читаемое строковое представление"""
        msg_part = f' - "{self.message}"' if self.message else ""
        return f"{self.amount}₸ от {self.sender_name}{msg_part}"
