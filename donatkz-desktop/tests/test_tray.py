"""
Тесты для System Tray модуля
"""
import pytest
import sys
from pathlib import Path
import time
import threading
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Добавляем src в путь
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from tray.tray_manager import TrayManager
from tray.phone_link_monitor import PhoneLinkMonitor


class TestTrayManager:
    """Тесты для TrayManager"""
    
    def test_init(self):
        """Тест инициализации TrayManager"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        assert tray_manager.main_window == main_window
        assert tray_manager.is_running is False
        assert tray_manager.icon is None
        assert tray_manager.thread is None
        assert tray_manager.app_status == "Неактивен"
        assert tray_manager.phone_link_status == "Неизвестно"
        assert tray_manager.listener_status == "Остановлен"
    
    def test_init_with_callbacks(self):
        """Тест инициализации с callback'ами"""
        main_window = Mock()
        on_show = Mock()
        on_hide = Mock()
        on_quit = Mock()
        
        tray_manager = TrayManager(
            main_window,
            on_show=on_show,
            on_hide=on_hide,
            on_quit=on_quit
        )
        
        assert tray_manager.on_show == on_show
        assert tray_manager.on_hide == on_hide
        assert tray_manager.on_quit == on_quit
    
    def test_create_icons(self):
        """Тест создания иконок"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        # Проверяем что иконки созданы
        assert "active" in tray_manager.icon_images
        assert "inactive" in tray_manager.icon_images
        assert "warning" in tray_manager.icon_images
        assert "working" in tray_manager.icon_images
    
    def test_update_status(self):
        """Тест обновления статуса"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        # Обновляем статус
        tray_manager.update_status("Активен")
        
        assert tray_manager.app_status == "Активен"
    
    def test_update_phone_link_status(self):
        """Тест обновления статуса Phone Link"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        # Обновляем статус Phone Link
        tray_manager.update_phone_link_status("Работает")
        
        assert tray_manager.phone_link_status == "Работает"
    
    def test_update_listener_status(self):
        """Тест обновления статуса слушателя"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        # Обновляем статус слушателя
        tray_manager.update_listener_status("Запущен")
        
        assert tray_manager.listener_status == "Запущен"
    
    def test_get_status(self):
        """Тест получения статуса"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        status = tray_manager.get_status()
        
        assert "is_running" in status
        assert "app_status" in status
        assert "phone_link_status" in status
        assert "listener_status" in status
        assert "tray_available" in status
    
    def test_callback_handlers(self):
        """Тест обработчиков callback'ов"""
        main_window = Mock()
        on_show = Mock()
        on_hide = Mock()
        on_quit = Mock()
        
        tray_manager = TrayManager(
            main_window,
            on_show=on_show,
            on_hide=on_hide,
            on_quit=on_quit
        )
        
        # Тест показа окна
        tray_manager._on_show_window()
        on_show.assert_called_once()
        
        # Тест скрытия окна
        tray_manager._on_hide_window()
        on_hide.assert_called_once()
        
        # Тест выхода
        tray_manager._on_quit()
        on_quit.assert_called_once()
    
    def test_callback_handlers_without_callbacks(self):
        """Тест обработчиков без callback'ов"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        # Тест показа окна без callback
        tray_manager._on_show_window()
        main_window.deiconify.assert_called_once()
        main_window.lift.assert_called_once()
        main_window.focus_force.assert_called_once()
        
        # Тест скрытия окна без callback
        tray_manager._on_hide_window()
        main_window.withdraw.assert_called_once()
        
        # Тест выхода без callback
        tray_manager._on_quit()
        main_window.quit.assert_called_once()


class TestPhoneLinkMonitor:
    """Тесты для PhoneLinkMonitor"""
    
    def test_init(self):
        """Тест инициализации PhoneLinkMonitor"""
        monitor = PhoneLinkMonitor()
        
        assert monitor.on_status_change is None
        assert monitor.check_interval == 5.0
        assert monitor.is_running is False
        assert monitor.current_status == "Неизвестно"
        assert monitor.last_check is None
        assert monitor.monitor_thread is None
    
    def test_init_with_callback(self):
        """Тест инициализации с callback"""
        callback = Mock()
        monitor = PhoneLinkMonitor(
            on_status_change=callback,
            check_interval=2.0
        )
        
        assert monitor.on_status_change == callback
        assert monitor.check_interval == 2.0
    
    def test_stats_initialization(self):
        """Тест инициализации статистики"""
        monitor = PhoneLinkMonitor()
        
        assert monitor.stats["checks_total"] == 0
        assert monitor.stats["status_changes"] == 0
        assert monitor.stats["phone_link_active"] == 0
        assert monitor.stats["phone_link_inactive"] == 0
        assert monitor.stats["start_time"] is None
    
    def test_get_status(self):
        """Тест получения статуса"""
        monitor = PhoneLinkMonitor()
        
        status = monitor.get_status()
        assert status == "Неизвестно"
    
    def test_get_stats(self):
        """Тест получения статистики"""
        monitor = PhoneLinkMonitor()
        
        stats = monitor.get_stats()
        
        assert "checks_total" in stats
        assert "status_changes" in stats
        assert "phone_link_active" in stats
        assert "phone_link_inactive" in stats
        assert "current_status" in stats
        assert "is_running" in stats
        assert "last_check" in stats
        assert "uptime_seconds" in stats
        assert "check_interval" in stats
    
    def test_set_check_interval(self):
        """Тест установки интервала проверки"""
        monitor = PhoneLinkMonitor()
        
        # Устанавливаем новый интервал
        monitor.set_check_interval(10.0)
        assert monitor.check_interval == 10.0
        
        # Тест некорректного интервала
        monitor.set_check_interval(-1.0)
        assert monitor.check_interval == 10.0  # Не должен измениться
    
    def test_force_check(self):
        """Тест принудительной проверки"""
        monitor = PhoneLinkMonitor()
        
        with patch.object(monitor, '_check_phone_link_status', return_value="Работает"):
            status = monitor.force_check()
            assert status == "Работает"
    
    def test_update_status(self):
        """Тест обновления статуса"""
        callback = Mock()
        monitor = PhoneLinkMonitor(on_status_change=callback)
        
        # Обновляем статус
        monitor._update_status("Работает")
        
        assert monitor.current_status == "Работает"
        assert monitor.stats["status_changes"] == 1
        callback.assert_called_once_with("Работает")
    
    def test_update_status_without_callback(self):
        """Тест обновления статуса без callback"""
        monitor = PhoneLinkMonitor()
        
        # Обновляем статус
        monitor._update_status("Работает")
        
        assert monitor.current_status == "Работает"
        assert monitor.stats["status_changes"] == 1
    
    def test_check_phone_link_status_no_registry(self):
        """Тест проверки статуса без реестра"""
        monitor = PhoneLinkMonitor()
        
        with patch('tray.phone_link_monitor.WINDOWS_REGISTRY_AVAILABLE', False):
            status = monitor._check_phone_link_status()
            assert status == "Недоступно"
    
    def test_check_phone_link_status_with_registry(self):
        """Тест проверки статуса с реестром"""
        monitor = PhoneLinkMonitor()
        
        with patch('tray.phone_link_monitor.WINDOWS_REGISTRY_AVAILABLE', True):
            with patch('winreg.OpenKey') as mock_open_key:
                mock_key = Mock()
                mock_open_key.return_value.__enter__.return_value = mock_key
                mock_key.QueryValueEx.return_value = (True, 0)
                
                status = monitor._check_phone_link_status()
                assert status == "Работает"
    
    def test_check_phone_link_process(self):
        """Тест проверки процессов Phone Link"""
        monitor = PhoneLinkMonitor()
        
        with patch('psutil.process_iter') as mock_process_iter:
            # Создаём mock процесс Phone Link
            mock_proc = Mock()
            mock_proc.info = {'name': 'Phone Link'}
            mock_process_iter.return_value = [mock_proc]
            
            result = monitor._check_phone_link_process()
            assert result is True
    
    def test_check_phone_link_process_no_psutil(self):
        """Тест проверки процессов без psutil"""
        monitor = PhoneLinkMonitor()
        
        with patch('tray.phone_link_monitor.psutil.process_iter', side_effect=ImportError):
            result = monitor._check_phone_link_process()
            assert result is False


class TestTrayIntegration:
    """Интеграционные тесты System Tray"""
    
    def test_tray_manager_with_phone_link_monitor(self):
        """Тест интеграции TrayManager с PhoneLinkMonitor"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        # Создаём PhoneLinkMonitor
        phone_monitor = PhoneLinkMonitor(
            on_status_change=tray_manager.update_phone_link_status
        )
        
        # Обновляем статус через монитор
        phone_monitor._update_status("Работает")
        
        # Проверяем что статус обновился в трее
        assert tray_manager.phone_link_status == "Работает"
    
    def test_full_integration(self):
        """Тест полной интеграции"""
        main_window = Mock()
        
        # Создаём TrayManager
        tray_manager = TrayManager(main_window)
        
        # Создаём PhoneLinkMonitor
        phone_monitor = PhoneLinkMonitor(
            on_status_change=tray_manager.update_phone_link_status,
            check_interval=1.0
        )
        
        # Запускаем мониторинг
        phone_monitor.start()
        
        # Проверяем что мониторинг запущен
        assert phone_monitor.is_running is True
        
        # Останавливаем мониторинг
        phone_monitor.stop()
        
        # Проверяем что мониторинг остановлен
        assert phone_monitor.is_running is False
    
    def test_error_handling(self):
        """Тест обработки ошибок"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        # Тест обработки ошибок в callback'ах
        def faulty_callback():
            raise ValueError("Test error")
        
        tray_manager.on_show = faulty_callback
        
        # Callback не должен падать
        tray_manager._on_show_window()
    
    def test_concurrent_updates(self):
        """Тест параллельных обновлений"""
        main_window = Mock()
        tray_manager = TrayManager(main_window)
        
        # Параллельные обновления статуса
        def update_status(status):
            tray_manager.update_status(status)
            tray_manager.update_phone_link_status(status)
            tray_manager.update_listener_status(status)
        
        # Запускаем обновления в разных потоках
        threads = []
        for i in range(5):
            thread = threading.Thread(target=update_status, args=(f"Status {i}",))
            threads.append(thread)
            thread.start()
        
        # Ждём завершения
        for thread in threads:
            thread.join()
        
        # Проверяем что статус обновился
        assert tray_manager.app_status == "Status 4"
        assert tray_manager.phone_link_status == "Status 4"
        assert tray_manager.listener_status == "Status 4"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
