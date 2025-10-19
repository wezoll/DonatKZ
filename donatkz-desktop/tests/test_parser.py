"""Tests for Kaspi notification parser"""
import pytest
from datetime import datetime
import sys
from pathlib import Path

# Добавляем src в путь для импортов
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from notification.parser import KaspiNotificationParser
from notification.models import DonationData


class TestKaspiNotificationParser:
    """Тесты для KaspiNotificationParser"""
    
    @pytest.fixture
    def parser(self):
        """Фикстура парсера"""
        return KaspiNotificationParser()
    
    def test_format1_with_message(self, parser):
        """Тест формата: Пополнение: 100 Т\nАспандияр Т.: Рахмет"""
        text = "Пополнение: 100 Т\nАспандияр Т.: Рахмет"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 100.0
        assert donation.sender_name == "Аспандияр Т."
        assert donation.message == "Рахмет"
        assert donation.raw_notification == text
    
    def test_format1_with_tenge_symbol(self, parser):
        """Тест с символом ₸"""
        text = "Пополнение: 500 ₸\nАйгерим К.: Спасибо за контент"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 500.0
        assert donation.sender_name == "Айгерим К."
        assert donation.message == "Спасибо за контент"
    
    def test_format2_basic(self, parser):
        """Тест формата: Перевод: 500 ₸ от Айгерим К."""
        text = "Перевод: 500 ₸ от Айгерим К."
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 500.0
        assert donation.sender_name == "Айгерим К."
        assert donation.message is None
    
    def test_format2_with_message(self, parser):
        """Тест формата 2 с сообщением"""
        text = "Перевод: 1000 ₸ от Максим С.: Продолжай в том же духе"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 1000.0
        assert donation.sender_name == "Максим С."
        assert donation.message == "Продолжай в том же духе"
    
    def test_format3_simple(self, parser):
        """Тест формата: 1000 ₸ от Максим С. - Спасибо за стрим"""
        text = "1000 ₸ от Максим С. - Спасибо за стрим"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 1000.0
        assert donation.sender_name == "Максим С."
        assert donation.message == "Спасибо за стрим"
    
    def test_format3_without_message(self, parser):
        """Тест формата 3 без сообщения"""
        text = "200 ₸ от Иван И."
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 200.0
        assert donation.sender_name == "Иван И."
    
    def test_format4_kaspi_gold(self, parser):
        """Тест формата: Kaspi Gold\nПеревод 200₸\nОт: Иван И.\nСообщение: Привет"""
        text = "Kaspi Gold\nПеревод 200₸\nОт: Иван И.\nСообщение: Привет"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 200.0
        assert donation.sender_name == "Иван И."
        assert donation.message == "Привет"
    
    def test_format4_without_message(self, parser):
        """Тест формата 4 без сообщения"""
        text = "Kaspi Gold\nПеревод 300₸\nОт: Дамир К."
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 300.0
        assert donation.sender_name == "Дамир К."
    
    def test_format5_vam_pereveli(self, parser):
        """Тест формата: Вам перевели 1000 тенге от Алия Б."""
        text = "Вам перевели 1000 тенге от Алия Б."
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 1000.0
        assert donation.sender_name == "Алия Б."
    
    def test_format6_poluchon_perevod(self, parser):
        """Тест формата: Получен перевод 500₸\nОтправитель: Дамир К.\nКомментарий: Спасибо"""
        text = "Получен перевод 500₸\nОтправитель: Дамир К.\nКомментарий: Спасибо"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 500.0
        assert donation.sender_name == "Дамир К."
        assert donation.message == "Спасибо"
    
    def test_amount_with_comma(self, parser):
        """Тест суммы с запятой: 1,500"""
        text = "Перевод: 1,500 ₸ от Тестовый Пользователь"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 1500.0
    
    def test_amount_with_dot_thousands(self, parser):
        """Тест суммы с точкой как разделителем тысяч: 1.500"""
        text = "Перевод: 2.500 ₸ от Тест Тестович"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 2500.0
    
    def test_amount_with_spaces(self, parser):
        """Тест суммы с пробелами: 10 000"""
        text = "Перевод: 10 000 ₸ от Богатый Человек"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 10000.0
    
    def test_large_amount(self, parser):
        """Тест большой суммы"""
        text = "Перевод: 500000 ₸ от Меценат"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 500000.0
    
    def test_small_amount(self, parser):
        """Тест маленькой суммы"""
        text = "Перевод: 50 ₸ от Студент"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 50.0
    
    def test_decimal_amount(self, parser):
        """Тест суммы с копейками"""
        text = "Перевод: 150,50 ₸ от Точный Человек"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.amount == 150.5
    
    def test_long_sender_name(self, parser):
        """Тест длинного имени"""
        text = "Перевод: 100 ₸ от Очень Длинное Имя Отправителя"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.sender_name == "Очень Длинное Имя Отправителя"
    
    def test_cyrillic_and_latin_mix(self, parser):
        """Тест смешанного имени (кириллица + латиница)"""
        text = "Перевод: 200 ₸ от Aspan Torekhanov"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.sender_name == "Aspan Torekhanov"
    
    def test_long_message(self, parser):
        """Тест длинного сообщения"""
        message = "Это очень длинное сообщение с благодарностью за отличный контент"
        text = f"Перевод: 300 ₸ от Зритель: {message}"
        
        donation = parser.parse(text)
        
        assert donation is not None
        assert donation.message == message
    
    def test_message_with_emoji(self, parser):
        """Тест сообщения с эмодзи"""
        text = "Перевод: 100 ₸ от Зритель: Спасибо 🔥🔥"
        
        donation = parser.parse(text)
        
        assert donation is not None
        # Эмодзи могут быть обрезаны или сохранены - проверяем что парсится
        assert "Спасибо" in donation.message
    
    def test_empty_text(self, parser):
        """Тест пустого текста"""
        donation = parser.parse("")
        assert donation is None
    
    def test_whitespace_only(self, parser):
        """Тест текста из пробелов"""
        donation = parser.parse("   \n\t  ")
        assert donation is None
    
    def test_invalid_format(self, parser):
        """Тест невалидного формата"""
        text = "Это просто случайный текст без донатов"
        donation = parser.parse(text)
        assert donation is None
    
    def test_partial_match(self, parser):
        """Тест частичного совпадения"""
        text = "Перевод без суммы от кого-то"
        donation = parser.parse(text)
        assert donation is None
    
    def test_to_dict_method(self, parser):
        """Тест метода to_dict()"""
        text = "Перевод: 500 ₸ от Тест: Сообщение"
        donation = parser.parse(text)
        
        assert donation is not None
        
        data = donation.to_dict()
        
        assert isinstance(data, dict)
        assert data["amount"] == 500.0
        assert data["senderName"] == "Тест"
        assert data["message"] == "Сообщение"
        assert "timestamp" in data
        assert data["rawText"] == text
    
    def test_donation_str_method(self, parser):
        """Тест метода __str__()"""
        text = "Перевод: 100 ₸ от Зритель: Привет"
        donation = parser.parse(text)
        
        assert donation is not None
        
        str_repr = str(donation)
        assert "100" in str_repr or "100.0" in str_repr
        assert "Зритель" in str_repr
        assert "Привет" in str_repr
    
    def test_timestamp_is_recent(self, parser):
        """Тест что timestamp актуальный"""
        text = "Перевод: 100 ₸ от Тест"
        donation = parser.parse(text)
        
        assert donation is not None
        
        # Проверяем что timestamp не более 1 секунды назад
        time_diff = (datetime.now() - donation.timestamp).total_seconds()
        assert time_diff < 1.0
    
    def test_multiple_currency_symbols(self, parser):
        """Тест разных валютных символов"""
        texts = [
            "Перевод: 100 Т от Тест",
            "Перевод: 100 T от Тест",
            "Перевод: 100 ₸ от Тест",
            "Перевод: 100 тенге от Тест",
        ]
        
        for text in texts:
            donation = parser.parse(text)
            assert donation is not None, f"Failed to parse: {text}"
            assert donation.amount == 100.0
    
    def test_test_pattern_method(self, parser):
        """Тест вспомогательного метода test_pattern()"""
        text = "Перевод: 500 ₸ от Тест"
        
        result = parser.test_pattern(text)
        
        assert isinstance(result, dict)
        assert result["matched"] is True
        assert result["pattern_index"] is not None
        assert result["groups"] is not None
        assert result["donation"] is not None
    
    def test_test_pattern_no_match(self, parser):
        """Тест test_pattern() с невалидным текстом"""
        text = "Невалидный текст"
        
        result = parser.test_pattern(text)
        
        assert result["matched"] is False
        assert result["pattern_index"] is None
    
    def test_special_characters_in_name(self, parser):
        """Тест спецсимволов в имени"""
        text = "Перевод: 100 ₸ от О'Брайен М."
        donation = parser.parse(text)
        
        # Может распарситься или нет в зависимости от паттерна
        # Проверяем что не крашится
        assert donation is None or isinstance(donation, DonationData)
    
    def test_newline_variations(self, parser):
        """Тест разных вариантов переноса строк"""
        texts = [
            "Пополнение: 100 Т\nИмя: Тест",
            "Пополнение: 100 Т\\nИмя: Тест",
        ]
        
        for text in texts:
            donation = parser.parse(text)
            # Проверяем что не крашится, результат может варьироваться
            assert donation is None or isinstance(donation, DonationData)
    
    def test_amount_parsing_edge_cases(self, parser):
        """Тест граничных случаев парсинга суммы"""
        # Тестируем внутренний метод _parse_amount
        assert parser._parse_amount("100") == 100.0
        assert parser._parse_amount("1,500") == 1500.0
        assert parser._parse_amount("2.500") == 2500.0
        assert parser._parse_amount("10 000") == 10000.0
        assert parser._parse_amount("150,50") == 150.5
        assert parser._parse_amount("  200  ") == 200.0
    
    def test_sender_name_cleaning(self, parser):
        """Тест очистки имени отправителя"""
        # Тестируем внутренний метод _clean_sender_name
        assert parser._clean_sender_name("  Имя  ") == "Имя"
        assert parser._clean_sender_name("Имя...") == "Имя"
        assert parser._clean_sender_name("Имя,") == "Имя"
        assert parser._clean_sender_name("  Длинное   Имя  ") == "Длинное Имя"
    
    def test_message_cleaning(self, parser):
        """Тест очистки сообщения"""
        # Тестируем внутренний метод _clean_message
        assert parser._clean_message("  Текст  ") == "Текст"
        assert parser._clean_message("Текст...") == "Текст"
        assert parser._clean_message("   ") is None
        assert parser._clean_message("") is None
        assert parser._clean_message("Длинное   сообщение") == "Длинное сообщение"


if __name__ == "__main__":
    # Запуск тестов
    pytest.main([__file__, "-v"])



