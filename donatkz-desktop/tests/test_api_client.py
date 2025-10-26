"""Tests for API clients"""
import pytest
import asyncio
from datetime import datetime
import sys
from pathlib import Path

# Добавляем src в путь для импортов
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from api.mock_client import MockDonatKZAPI
from api.factory import create_api_client, create_mock_api_client


class TestMockAPIClient:
    """Тесты для MockDonatKZAPI"""
    
    @pytest.fixture
    def client(self):
        """Фикстура Mock API клиента"""
        return MockDonatKZAPI()
    
    @pytest.mark.asyncio
    async def test_init(self, client):
        """Тест инициализации клиента"""
        assert client.base_url == "http://localhost:8080/api"
        assert client.network_delay_min == 0.1
        assert client.network_delay_max == 0.5
        assert client.request_count == 0
        assert len(client.mock_donations) == 0
    
    @pytest.mark.asyncio
    async def test_login_success(self, client):
        """Тест успешной авторизации"""
        response = await client.login("test@example.com", "password123")
        
        assert response["success"] is True
        assert "access_token" in response
        assert "refresh_token" in response
        assert "user" in response
        assert response["user"]["email"] == "test@example.com"
        assert "mock_access_token" in response["access_token"]
        assert client.request_count == 1
    
    @pytest.mark.asyncio
    async def test_login_creates_new_user(self, client):
        """Тест что логин создаёт нового пользователя"""
        email = "newuser@example.com"
        response = await client.login(email, "password")
        
        assert response["success"] is True
        assert email in client.mock_users
        assert client.mock_users[email]["email"] == email
    
    @pytest.mark.asyncio
    async def test_login_existing_user(self, client):
        """Тест логина существующего пользователя"""
        email = "test@example.com"
        
        # Первый логин
        response1 = await client.login(email, "pass1")
        user_id1 = response1["user"]["id"]
        
        # Второй логин того же пользователя
        response2 = await client.login(email, "pass2")
        user_id2 = response2["user"]["id"]
        
        # ID должен быть тот же
        assert user_id1 == user_id2
    
    @pytest.mark.asyncio
    async def test_refresh_token(self, client):
        """Тест обновления токена"""
        response = await client.refresh_token("old_refresh_token")
        
        assert response["success"] is True
        assert "access_token" in response
        assert "refresh_token" in response
        assert "mock_access_token" in response["access_token"]
        assert "mock_refresh_token" in response["refresh_token"]
        assert client.request_count == 1
    
    @pytest.mark.asyncio
    async def test_send_donation(self, client):
        """Тест отправки доната"""
        donation_data = {
            "amount": 500.0,
            "senderName": "Тест Пользователь",
            "message": "Спасибо",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Test notification"
        }
        
        response = await client.send_donation(donation_data, "mock_token")
        
        assert response["success"] is True
        assert "id" in response
        assert response["id"] == 1
        assert "message" in response
        
        # Проверяем что донат сохранён
        assert len(client.mock_donations) == 1
        saved = client.mock_donations[0]
        assert saved["amount"] == 500.0
        assert saved["senderName"] == "Тест Пользователь"
        assert saved["id"] == 1
        assert client.request_count == 1
    
    @pytest.mark.asyncio
    async def test_send_multiple_donations(self, client):
        """Тест отправки нескольких донатов"""
        donations = [
            {"amount": 100.0, "senderName": "User1", "message": "Msg1", "timestamp": datetime.now().isoformat(), "rawText": "Raw1"},
            {"amount": 200.0, "senderName": "User2", "message": "Msg2", "timestamp": datetime.now().isoformat(), "rawText": "Raw2"},
            {"amount": 300.0, "senderName": "User3", "message": "Msg3", "timestamp": datetime.now().isoformat(), "rawText": "Raw3"}
        ]
        
        for i, donation in enumerate(donations, 1):
            response = await client.send_donation(donation, "token")
            assert response["id"] == i
        
        assert len(client.mock_donations) == 3
        assert client.request_count == 3
    
    @pytest.mark.asyncio
    async def test_get_settings(self, client):
        """Тест получения настроек"""
        response = await client.get_settings("mock_token")
        
        assert response["success"] is True
        assert "settings" in response
        settings = response["settings"]
        assert settings["minAmount"] == 100.0
        assert settings["maxAmount"] == 1000000.0
        assert settings["soundEnabled"] is True
        assert settings["notificationsEnabled"] is True
        assert client.request_count == 1
    
    @pytest.mark.asyncio
    async def test_update_settings(self, client):
        """Тест обновления настроек"""
        new_settings = {
            "minAmount": 200.0,
            "maxAmount": 500000.0,
            "soundEnabled": False
        }
        
        response = await client.update_settings(new_settings, "mock_token")
        
        assert response["success"] is True
        assert "message" in response
        
        # Проверяем что настройки обновлены
        assert client.mock_settings["minAmount"] == 200.0
        assert client.mock_settings["maxAmount"] == 500000.0
        assert client.mock_settings["soundEnabled"] is False
        # Не указанные настройки должны остаться
        assert client.mock_settings["notificationsEnabled"] is True
        assert client.request_count == 1
    
    @pytest.mark.asyncio
    async def test_get_stats_empty(self, client):
        """Тест получения статистики без донатов"""
        response = await client.get_stats("mock_token")
        
        assert response["success"] is True
        assert "stats" in response
        stats = response["stats"]
        assert stats["count"] == 0
        assert stats["total"] == 0
        assert stats["average"] == 0
        assert len(stats["donations"]) == 0
        assert client.request_count == 1
    
    @pytest.mark.asyncio
    async def test_get_stats_with_donations(self, client):
        """Тест получения статистики с донатами"""
        # Добавляем донаты
        today = datetime.now().date().isoformat()
        donations = [
            {"amount": 100.0, "senderName": "User1", "message": "Msg1", "timestamp": f"{today}T10:00:00", "rawText": "Raw1"},
            {"amount": 200.0, "senderName": "User2", "message": "Msg2", "timestamp": f"{today}T11:00:00", "rawText": "Raw2"},
            {"amount": 300.0, "senderName": "User3", "message": "Msg3", "timestamp": f"{today}T12:00:00", "rawText": "Raw3"}
        ]
        
        for donation in donations:
            await client.send_donation(donation, "token")
        
        # Получаем статистику
        response = await client.get_stats("token")
        
        assert response["success"] is True
        stats = response["stats"]
        assert stats["count"] == 3
        assert stats["total"] == 600.0
        assert stats["average"] == 200.0
        assert len(stats["donations"]) == 3
    
    @pytest.mark.asyncio
    async def test_get_stats_filters_by_date(self, client):
        """Тест что статистика фильтруется по дате"""
        # Добавляем донаты с разными датами
        today = datetime.now().date().isoformat()
        yesterday = datetime(2025, 10, 17).date().isoformat()
        
        donations = [
            {"amount": 100.0, "senderName": "User1", "message": "Msg1", "timestamp": f"{today}T10:00:00", "rawText": "Raw1"},
            {"amount": 200.0, "senderName": "User2", "message": "Msg2", "timestamp": f"{yesterday}T11:00:00", "rawText": "Raw2"}
        ]
        
        for donation in donations:
            await client.send_donation(donation, "token")
        
        # Получаем статистику за сегодня
        response = await client.get_stats("token", datetime.now())
        
        # Должен быть только 1 донат за сегодня
        stats = response["stats"]
        assert stats["count"] == 1
        assert stats["total"] == 100.0
    
    @pytest.mark.asyncio
    async def test_ping(self, client):
        """Тест проверки доступности"""
        response = await client.ping()
        
        assert response["success"] is True
        assert response["message"] == "pong"
        assert "timestamp" in response
        assert client.request_count == 1
    
    @pytest.mark.asyncio
    async def test_close(self, client):
        """Тест закрытия клиента"""
        # Добавляем несколько запросов
        await client.ping()
        await client.ping()
        
        # Закрываем
        await client.close()
        
        # Проверяем что счётчики сохранены
        assert client.request_count == 2
    
    @pytest.mark.asyncio
    async def test_network_delay_simulation(self, client):
        """Тест имитации задержки сети"""
        import time
        
        start = time.time()
        await client.ping()
        elapsed = time.time() - start
        
        # Проверяем что была задержка
        assert elapsed >= client.network_delay_min
        assert elapsed <= client.network_delay_max + 0.1  # +0.1 для погрешности
    
    @pytest.mark.asyncio
    async def test_get_mock_donations(self, client):
        """Тест получения mock донатов"""
        # Добавляем донаты
        donation = {
            "amount": 100.0,
            "senderName": "User",
            "message": "Msg",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Raw"
        }
        await client.send_donation(donation, "token")
        
        # Получаем донаты
        donations = client.get_mock_donations()
        assert len(donations) == 1
        assert donations[0]["amount"] == 100.0
    
    @pytest.mark.asyncio
    async def test_clear_mock_donations(self, client):
        """Тест очистки mock донатов"""
        # Добавляем донаты
        donation = {
            "amount": 100.0,
            "senderName": "User",
            "message": "Msg",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Raw"
        }
        await client.send_donation(donation, "token")
        
        assert len(client.mock_donations) == 1
        
        # Очищаем
        client.clear_mock_donations()
        assert len(client.mock_donations) == 0
    
    @pytest.mark.asyncio
    async def test_get_request_count(self, client):
        """Тест получения счётчика запросов"""
        assert client.get_request_count() == 0
        
        await client.ping()
        assert client.get_request_count() == 1
        
        await client.ping()
        assert client.get_request_count() == 2
    
    @pytest.mark.asyncio
    async def test_reset_request_count(self, client):
        """Тест сброса счётчика запросов"""
        await client.ping()
        await client.ping()
        assert client.get_request_count() == 2
        
        client.reset_request_count()
        assert client.get_request_count() == 0
    
    @pytest.mark.asyncio
    async def test_custom_network_delay(self):
        """Тест кастомной задержки сети"""
        client = MockDonatKZAPI(
            network_delay_min=0.01,
            network_delay_max=0.02
        )
        
        import time
        start = time.time()
        await client.ping()
        elapsed = time.time() - start
        
        # Проверяем что задержка соответствует настройкам
        assert elapsed >= 0.01
        assert elapsed <= 0.03


class TestAPIFactory:
    """Тесты для factory функций"""
    
    def test_create_api_client_mock_default(self):
        """Тест создания Mock клиента по умолчанию"""
        # В Config.USE_MOCK_API = true по умолчанию
        client = create_api_client()
        
        assert isinstance(client, MockDonatKZAPI)
        assert client.base_url == "http://localhost:8080/api"
    
    def test_create_api_client_mock_explicit(self):
        """Тест явного создания Mock клиента"""
        client = create_api_client(use_mock=True)
        
        assert isinstance(client, MockDonatKZAPI)
    
    def test_create_api_client_with_custom_url(self):
        """Тест создания клиента с кастомным URL"""
        custom_url = "http://custom-api.com/api"
        client = create_api_client(use_mock=True, base_url=custom_url)
        
        assert isinstance(client, MockDonatKZAPI)
        assert client.base_url == custom_url
    
    def test_create_mock_api_client_explicit(self):
        """Тест явного создания Mock клиента"""
        client = create_mock_api_client()
        
        assert isinstance(client, MockDonatKZAPI)
    
    def test_create_mock_api_client_custom_delays(self):
        """Тест создания Mock клиента с кастомными задержками"""
        client = create_mock_api_client(
            network_delay_min=0.01,
            network_delay_max=0.02
        )
        
        assert isinstance(client, MockDonatKZAPI)
        assert client.network_delay_min == 0.01
        assert client.network_delay_max == 0.02


if __name__ == "__main__":
    # Запуск тестов
    pytest.main([__file__, "-v"])





