"""
Тесты для модуля авторизации
"""
import pytest
import sys
from pathlib import Path
import json
import tempfile
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from auth.auth_manager import AuthManager
from auth.login_window import LoginWindow


class TestAuthManager:
    """Тесты для AuthManager"""
    
    def test_init(self):
        """Тест инициализации AuthManager"""
        manager = AuthManager(use_mock_api=True)
        
        assert manager.use_mock_api is True
        assert manager.access_token is None
        assert manager.refresh_token is None
        assert manager.token_expires_at is None
        assert manager.user_info is None
        assert manager.is_authenticated is False
        assert manager.credentials_target == "DonatKZ_Desktop"
    
    def test_init_with_real_api(self):
        """Тест инициализации с реальным API"""
        manager = AuthManager(use_mock_api=False)
        
        assert manager.use_mock_api is False
    
    def test_initialize_success(self):
        """Тест успешной инициализации"""
        manager = AuthManager(use_mock_api=True)
        
        with patch('auth.auth_manager.create_api_client') as mock_create:
            mock_client = Mock()
            mock_create.return_value = mock_client
            
            result = manager.initialize()
            
            assert result is True
            assert manager.api_client == mock_client
    
    def test_initialize_with_saved_tokens(self):
        """Тест инициализации с сохранёнными токенами"""
        manager = AuthManager(use_mock_api=True)
        
        # Создаём временный файл с токенами
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            tokens_data = {
                "access_token": "test_access_token",
                "refresh_token": "test_refresh_token",
                "expires_at": (datetime.now() + timedelta(hours=1)).isoformat(),
                "user_info": {"email": "test@example.com", "id": 1}
            }
            json.dump(tokens_data, f)
            temp_file = f.name
        
        try:
            with patch.object(manager, 'settings_file', Path(temp_file)):
                with patch('auth.auth_manager.create_api_client'):
                    result = manager.initialize()
                    
                    assert result is True
                    assert manager.access_token == "test_access_token"
                    assert manager.refresh_token == "test_refresh_token"
                    assert manager.user_info == {"email": "test@example.com", "id": 1}
                    assert manager.is_authenticated is True
        finally:
            Path(temp_file).unlink(missing_ok=True)
    
    def test_login_success(self):
        """Тест успешной авторизации"""
        manager = AuthManager(use_mock_api=True)
        
        # Mock API клиент
        mock_client = Mock()
        mock_client.login.return_value = {
            "success": True,
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token",
            "user": {"email": "test@example.com", "id": 1}
        }
        manager.api_client = mock_client
        
        # Выполняем авторизацию
        success, result = manager.login("test@example.com", "password", remember=True)
        
        assert success is True
        assert manager.access_token == "test_access_token"
        assert manager.refresh_token == "test_refresh_token"
        assert manager.user_info == {"email": "test@example.com", "id": 1}
        assert manager.is_authenticated is True
        mock_client.login.assert_called_once_with("test@example.com", "password")
    
    def test_login_failure(self):
        """Тест неудачной авторизации"""
        manager = AuthManager(use_mock_api=True)
        
        # Mock API клиент
        mock_client = Mock()
        mock_client.login.return_value = {
            "success": False,
            "error": "Invalid credentials"
        }
        manager.api_client = mock_client
        
        # Выполняем авторизацию
        success, result = manager.login("test@example.com", "wrong_password")
        
        assert success is False
        assert result == "Invalid credentials"
        assert manager.is_authenticated is False
    
    def test_logout(self):
        """Тест выхода из аккаунта"""
        manager = AuthManager(use_mock_api=True)
        
        # Устанавливаем состояние авторизации
        manager.access_token = "test_token"
        manager.refresh_token = "test_refresh"
        manager.user_info = {"email": "test@example.com"}
        manager.is_authenticated = True
        
        # Выполняем выход
        result = manager.logout()
        
        assert result is True
        assert manager.access_token is None
        assert manager.refresh_token is None
        assert manager.user_info is None
        assert manager.is_authenticated is False
    
    def test_refresh_access_token_success(self):
        """Тест успешного обновления токена"""
        manager = AuthManager(use_mock_api=True)
        
        # Устанавливаем refresh token
        manager.refresh_token = "test_refresh_token"
        
        # Mock API клиент
        mock_client = Mock()
        mock_client.refresh_token.return_value = {
            "success": True,
            "access_token": "new_access_token"
        }
        manager.api_client = mock_client
        
        # Обновляем токен
        result = manager.refresh_access_token()
        
        assert result is True
        assert manager.access_token == "new_access_token"
        mock_client.refresh_token.assert_called_once_with("test_refresh_token")
    
    def test_refresh_access_token_failure(self):
        """Тест неудачного обновления токена"""
        manager = AuthManager(use_mock_api=True)
        
        # Устанавливаем refresh token
        manager.refresh_token = "invalid_refresh_token"
        
        # Mock API клиент
        mock_client = Mock()
        mock_client.refresh_token.return_value = {
            "success": False,
            "error": "Invalid refresh token"
        }
        manager.api_client = mock_client
        
        # Обновляем токен
        result = manager.refresh_access_token()
        
        assert result is False
        mock_client.refresh_token.assert_called_once_with("invalid_refresh_token")
    
    def test_get_valid_token_valid(self):
        """Тест получения валидного токена"""
        manager = AuthManager(use_mock_api=True)
        
        # Устанавливаем валидный токен
        manager.access_token = "test_token"
        manager.token_expires_at = datetime.now() + timedelta(hours=1)
        
        # Получаем токен
        token = manager.get_valid_token()
        
        assert token == "test_token"
    
    def test_get_valid_token_expired(self):
        """Тест получения истёкшего токена"""
        manager = AuthManager(use_mock_api=True)
        
        # Устанавливаем истёкший токен
        manager.access_token = "expired_token"
        manager.token_expires_at = datetime.now() - timedelta(hours=1)
        manager.refresh_token = "test_refresh_token"
        
        # Mock обновления токена
        with patch.object(manager, 'refresh_access_token', return_value=True):
            token = manager.get_valid_token()
            
            assert token == "expired_token"  # Должен обновиться
    
    def test_get_user_info(self):
        """Тест получения информации о пользователе"""
        manager = AuthManager(use_mock_api=True)
        
        # Устанавливаем информацию о пользователе
        user_info = {"email": "test@example.com", "id": 1, "name": "Test User"}
        manager.user_info = user_info
        
        # Получаем информацию
        result = manager.get_user_info()
        
        assert result == user_info
    
    def test_get_auth_status(self):
        """Тест получения статуса авторизации"""
        manager = AuthManager(use_mock_api=True)
        
        # Устанавливаем состояние
        manager.access_token = "test_token"
        manager.refresh_token = "test_refresh"
        manager.user_info = {"email": "test@example.com"}
        manager.is_authenticated = True
        manager.token_expires_at = datetime.now() + timedelta(hours=1)
        
        # Получаем статус
        status = manager.get_auth_status()
        
        assert status["is_authenticated"] is True
        assert status["has_access_token"] is True
        assert status["has_refresh_token"] is True
        assert status["token_valid"] is True
        assert status["user_info"] == {"email": "test@example.com"}
        assert status["expires_at"] == manager.token_expires_at
    
    def test_token_validation(self):
        """Тест валидации токена"""
        manager = AuthManager(use_mock_api=True)
        
        # Валидный токен
        manager.access_token = "test_token"
        manager.token_expires_at = datetime.now() + timedelta(hours=1)
        assert manager._is_token_valid() is True
        
        # Истёкший токен
        manager.token_expires_at = datetime.now() - timedelta(hours=1)
        assert manager._is_token_valid() is False
        
        # Нет токена
        manager.access_token = None
        assert manager._is_token_valid() is False


class TestLoginWindow:
    """Тесты для LoginWindow"""
    
    def test_init(self):
        """Тест инициализации окна авторизации"""
        parent = Mock()
        auth_manager = Mock()
        
        with patch('auth.login_window.tk.Toplevel') as mock_toplevel:
            mock_window = Mock()
            mock_toplevel.return_value = mock_window
            
            window = LoginWindow(parent, auth_manager)
            
            assert window.parent == parent
            assert window.auth_manager == auth_manager
            mock_toplevel.assert_called_once_with(parent)
    
    def test_ui_creation(self):
        """Тест создания UI"""
        parent = Mock()
        auth_manager = Mock()
        
        with patch('auth.login_window.tk.Toplevel') as mock_toplevel:
            mock_window = Mock()
            mock_toplevel.return_value = mock_window
            
            window = LoginWindow(parent, auth_manager)
            
            # Проверяем что окно настроено
            mock_window.title.assert_called_with("DonatKZ - Вход")
            mock_window.geometry.assert_called()
            mock_window.resizable.assert_called_with(False, False)
    
    def test_validation(self):
        """Тест валидации полей"""
        parent = Mock()
        auth_manager = Mock()
        
        with patch('auth.login_window.tk.Toplevel'):
            window = LoginWindow(parent, auth_manager)
            
            # Тест пустого email
            window.email_entry = Mock()
            window.email_entry.get.return_value = ""
            window.password_entry = Mock()
            window.password_entry.get.return_value = "password"
            
            with patch('auth.login_window.messagebox.showerror') as mock_error:
                window._on_login()
                mock_error.assert_called()
    
    def test_login_success(self):
        """Тест успешной авторизации"""
        parent = Mock()
        auth_manager = Mock()
        auth_manager.login.return_value = (True, {"user": {"email": "test@example.com"}})
        
        with patch('auth.login_window.tk.Toplevel'):
            window = LoginWindow(parent, auth_manager)
            window.email_entry = Mock()
            window.email_entry.get.return_value = "test@example.com"
            window.password_entry = Mock()
            window.password_entry.get.return_value = "password"
            window.remember_var = Mock()
            window.remember_var.get.return_value = True
            
            # Mock threading
            with patch('auth.login_window.threading.Thread') as mock_thread:
                mock_thread_instance = Mock()
                mock_thread.return_value = mock_thread_instance
                
                window._on_login()
                
                # Проверяем что поток запущен
                mock_thread.assert_called_once()
                mock_thread_instance.start.assert_called_once()
    
    def test_login_failure(self):
        """Тест неудачной авторизации"""
        parent = Mock()
        auth_manager = Mock()
        auth_manager.login.return_value = (False, "Invalid credentials")
        
        with patch('auth.login_window.tk.Toplevel'):
            window = LoginWindow(parent, auth_manager)
            window.email_entry = Mock()
            window.email_entry.get.return_value = "test@example.com"
            window.password_entry = Mock()
            window.password_entry.get.return_value = "wrong_password"
            window.remember_var = Mock()
            window.remember_var.get.return_value = False
            
            # Mock threading
            with patch('auth.login_window.threading.Thread') as mock_thread:
                mock_thread_instance = Mock()
                mock_thread.return_value = mock_thread_instance
                
                window._on_login()
                
                # Проверяем что поток запущен
                mock_thread.assert_called_once()
                mock_thread_instance.start.assert_called_once()
    
    def test_register_click(self):
        """Тест клика по ссылке регистрации"""
        parent = Mock()
        auth_manager = Mock()
        
        with patch('auth.login_window.tk.Toplevel'):
            window = LoginWindow(parent, auth_manager)
            
            # Mock webbrowser
            with patch('auth.login_window.webbrowser.open') as mock_open:
                window._on_register_click(None)
                mock_open.assert_called_once_with("https://donatkz.com/register")
    
    def test_loading_state(self):
        """Тест состояния загрузки"""
        parent = Mock()
        auth_manager = Mock()
        
        with patch('auth.login_window.tk.Toplevel'):
            window = LoginWindow(parent, auth_manager)
            
            # Mock UI элементы
            window.login_button = Mock()
            window.email_entry = Mock()
            window.password_entry = Mock()
            window.remember_var = Mock()
            
            # Тест включения загрузки
            window._set_loading(True)
            window.login_button.config.assert_called()
            window.email_entry.config.assert_called()
            window.password_entry.config.assert_called()
            
            # Тест выключения загрузки
            window._set_loading(False)
            window.login_button.config.assert_called()
            window.email_entry.config.assert_called()
            window.password_entry.config.assert_called()


class TestAuthIntegration:
    """Интеграционные тесты авторизации"""
    
    def test_full_auth_flow(self):
        """Тест полного потока авторизации"""
        manager = AuthManager(use_mock_api=True)
        
        # Mock API клиент
        mock_client = Mock()
        mock_client.login.return_value = {
            "success": True,
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token",
            "user": {"email": "test@example.com", "id": 1}
        }
        manager.api_client = mock_client
        
        # Инициализация
        result = manager.initialize()
        assert result is True
        
        # Авторизация
        success, auth_result = manager.login("test@example.com", "password")
        assert success is True
        assert manager.is_authenticated is True
        
        # Получение токена
        token = manager.get_valid_token()
        assert token == "test_access_token"
        
        # Получение информации о пользователе
        user_info = manager.get_user_info()
        assert user_info == {"email": "test@example.com", "id": 1}
        
        # Выход
        logout_result = manager.logout()
        assert logout_result is True
        assert manager.is_authenticated is False
    
    def test_token_refresh_flow(self):
        """Тест потока обновления токена"""
        manager = AuthManager(use_mock_api=True)
        
        # Устанавливаем истёкший токен
        manager.access_token = "expired_token"
        manager.token_expires_at = datetime.now() - timedelta(hours=1)
        manager.refresh_token = "test_refresh_token"
        
        # Mock API клиент
        mock_client = Mock()
        mock_client.refresh_token.return_value = {
            "success": True,
            "access_token": "new_access_token"
        }
        manager.api_client = mock_client
        
        # Получаем валидный токен (должен обновиться)
        token = manager.get_valid_token()
        
        assert token == "new_access_token"
        assert manager.access_token == "new_access_token"
        mock_client.refresh_token.assert_called_once_with("test_refresh_token")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
