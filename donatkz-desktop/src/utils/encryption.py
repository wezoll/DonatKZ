"""Encryption utilities using Windows DPAPI"""
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Windows DPAPI для шифрования
try:
    import win32crypt
    HAS_WIN32CRYPT = True
except ImportError:
    HAS_WIN32CRYPT = False
    logger.warning("win32crypt не доступен - шифрование отключено")


def encrypt_data(data: str) -> Optional[str]:
    """
    Шифрование данных с использованием Windows DPAPI
    
    Args:
        data: Строка для шифрования
        
    Returns:
        str: Base64 зашифрованные данные или None при ошибке
    """
    if not HAS_WIN32CRYPT:
        logger.warning("Шифрование недоступно - возвращаем данные как есть")
        return data
    
    try:
        # Шифруем используя DPAPI
        encrypted_bytes = win32crypt.CryptProtectData(
            data.encode('utf-8'),
            None,  # description
            None,  # optional entropy
            None,  # reserved
            None,  # prompt struct
            0      # flags
        )
        
        # Кодируем в base64 для удобства хранения
        encrypted_b64 = base64.b64encode(encrypted_bytes).decode('utf-8')
        
        logger.debug("Данные успешно зашифрованы")
        return encrypted_b64
        
    except Exception as e:
        logger.error(f"Ошибка шифрования данных: {e}")
        return None


def decrypt_data(encrypted_data: str) -> Optional[str]:
    """
    Расшифровка данных с использованием Windows DPAPI
    
    Args:
        encrypted_data: Base64 зашифрованные данные
        
    Returns:
        str: Расшифрованная строка или None при ошибке
    """
    if not HAS_WIN32CRYPT:
        logger.warning("Расшифровка недоступна - возвращаем данные как есть")
        return encrypted_data
    
    try:
        # Декодируем из base64
        encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
        
        # Расшифровываем используя DPAPI
        decrypted_bytes = win32crypt.CryptUnprotectData(
            encrypted_bytes,
            None,  # optional entropy
            None,  # reserved
            None,  # prompt struct
            0      # flags
        )[1]  # CryptUnprotectData возвращает tuple (description, data)
        
        # Декодируем в строку
        decrypted_str = decrypted_bytes.decode('utf-8')
        
        logger.debug("Данные успешно расшифрованы")
        return decrypted_str
        
    except Exception as e:
        logger.error(f"Ошибка расшифровки данных: {e}")
        return None


def is_encryption_available() -> bool:
    """
    Проверка доступности шифрования
    
    Returns:
        bool: True если Windows DPAPI доступен
    """
    return HAS_WIN32CRYPT



