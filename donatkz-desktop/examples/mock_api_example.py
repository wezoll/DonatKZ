"""
Пример использования Mock API клиента

Демонстрирует все возможности Mock API для разработки без backend сервера.
"""
import asyncio
import sys
from pathlib import Path

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from api import create_api_client, MockDonatKZAPI
from notification.models import DonationData
from datetime import datetime


async def main():
    """Главная функция с примерами"""
    
    print("=" * 60)
    print("DonatKZ Mock API - Примеры использования")
    print("=" * 60)
    
    # Создание Mock API клиента
    print("\n1. Создание клиента...")
    client = create_api_client(use_mock=True)
    print(f"✓ Mock API клиент создан: {client.base_url}")
    
    # Авторизация
    print("\n2. Авторизация...")
    login_response = await client.login("test@example.com", "password123")
    print(f"✓ Авторизация успешна!")
    print(f"  User: {login_response['user']['email']}")
    print(f"  Access Token: {login_response['access_token'][:30]}...")
    
    access_token = login_response["access_token"]
    
    # Проверка доступности API
    print("\n3. Ping API...")
    ping_response = await client.ping()
    print(f"✓ API доступен: {ping_response['message']}")
    
    # Отправка донатов
    print("\n4. Отправка донатов...")
    donations_data = [
        {
            "amount": 500.0,
            "senderName": "Аспандияр Т.",
            "message": "Рахмет за стрим!",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Пополнение: 500 Т\nАспандияр Т.: Рахмет за стрим!"
        },
        {
            "amount": 1000.0,
            "senderName": "Айгерим К.",
            "message": "Продолжай в том же духе",
            "timestamp": datetime.now().isoformat(),
            "rawText": "Перевод: 1000 ₸ от Айгерим К."
        },
        {
            "amount": 200.0,
            "senderName": "Максим С.",
            "message": "За контент",
            "timestamp": datetime.now().isoformat(),
            "rawText": "200 ₸ от Максим С. - За контент"
        }
    ]
    
    for donation_data in donations_data:
        response = await client.send_donation(donation_data, access_token)
        print(f"✓ Донат отправлен: {donation_data['amount']}₸ от {donation_data['senderName']} (ID: {response['id']})")
    
    # Получение статистики
    print("\n5. Получение статистики...")
    stats_response = await client.get_stats(access_token)
    stats = stats_response["stats"]
    print(f"✓ Статистика:")
    print(f"  Донатов: {stats['count']}")
    print(f"  Сумма: {stats['total']}₸")
    print(f"  Средняя: {stats['average']:.2f}₸")
    
    # Получение настроек
    print("\n6. Получение настроек...")
    settings_response = await client.get_settings(access_token)
    settings = settings_response["settings"]
    print(f"✓ Настройки:")
    print(f"  Min Amount: {settings['minAmount']}₸")
    print(f"  Max Amount: {settings['maxAmount']}₸")
    print(f"  Sound: {settings['soundEnabled']}")
    
    # Обновление настроек
    print("\n7. Обновление настроек...")
    new_settings = {
        "minAmount": 200.0,
        "soundEnabled": False
    }
    update_response = await client.update_settings(new_settings, access_token)
    print(f"✓ Настройки обновлены: {update_response['message']}")
    
    # Проверка обновлённых настроек
    settings_response = await client.get_settings(access_token)
    settings = settings_response["settings"]
    print(f"  Новые настройки:")
    print(f"  Min Amount: {settings['minAmount']}₸ (изменено)")
    print(f"  Sound: {settings['soundEnabled']} (изменено)")
    
    # Обновление токена
    print("\n8. Обновление токена...")
    refresh_token = login_response["refresh_token"]
    refresh_response = await client.refresh_token(refresh_token)
    print(f"✓ Токен обновлён")
    print(f"  New Access Token: {refresh_response['access_token'][:30]}...")
    
    # Статистика запросов
    print("\n9. Статистика запросов...")
    print(f"✓ Всего запросов: {client.get_request_count()}")
    print(f"✓ Донатов в базе: {len(client.get_mock_donations())}")
    
    # Закрытие клиента
    print("\n10. Закрытие клиента...")
    await client.close()
    print("✓ Клиент закрыт")
    
    print("\n" + "=" * 60)
    print("Все примеры выполнены успешно! ✅")
    print("=" * 60)


async def example_with_parser():
    """Пример интеграции Mock API с парсером"""
    
    print("\n" + "=" * 60)
    print("Пример: Mock API + Parser Integration")
    print("=" * 60)
    
    from notification.parser import KaspiNotificationParser
    from notification.validator import DonationValidator
    
    # Инициализация
    client = create_api_client(use_mock=True)
    parser = KaspiNotificationParser()
    validator = DonationValidator()
    
    # Авторизация
    login_response = await client.login("streamer@example.com", "pass")
    access_token = login_response["access_token"]
    print(f"✓ Авторизован как {login_response['user']['email']}")
    
    # Имитация получения уведомлений Kaspi
    notifications = [
        "Пополнение: 500 Т\nАйдын М.: Спасибо!",
        "Перевод: 1000 ₸ от Нурлан К.: За контент",
        "Kaspi Gold\nПеревод 200₸\nОт: Айгерим Б.\nСообщение: Продолжай"
    ]
    
    print(f"\n Обработка {len(notifications)} уведомлений...")
    
    success_count = 0
    for notification_text in notifications:
        # Парсинг
        donation = parser.parse(notification_text)
        if not donation:
            print(f"✗ Не удалось распарсить уведомление")
            continue
        
        # Валидация
        is_valid, error = validator.validate(donation)
        if not is_valid:
            print(f"✗ Донат не прошёл валидацию: {error}")
            continue
        
        # Отправка через Mock API
        donation_data = donation.to_dict()
        response = await client.send_donation(donation_data, access_token)
        
        print(f"✓ {donation.amount}₸ от {donation.sender_name} → Отправлено (ID: {response['id']})")
        success_count += 1
    
    print(f"\n✅ Обработано {success_count}/{len(notifications)} донатов")
    
    # Статистика
    stats = await client.get_stats(access_token)
    print(f"📊 Всего за сегодня: {stats['stats']['count']} донатов на {stats['stats']['total']}₸")
    
    await client.close()


if __name__ == "__main__":
    # Запуск основных примеров
    asyncio.run(main())
    
    # Запуск примера с парсером
    asyncio.run(example_with_parser())





