"""
Windows Notification Listener

Перехватывает уведомления Windows через UserNotificationListener API (winsdk)
и фильтрует их по источнику (Kaspi.kz).
"""
import asyncio
import hashlib
import logging
import threading
import xml.etree.ElementTree as ET
from typing import Callable, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from winsdk.windows.ui.notifications.management import (
        UserNotificationListener,
        UserNotificationListenerAccessStatus
    )
    from winsdk.windows.ui.notifications import NotificationKinds, KnownNotificationBindings
    WINSDK_AVAILABLE = True
    logger.info("✅ Windows API доступен (winsdk)")
except ImportError as e:
    WINSDK_AVAILABLE = False
    logger.warning(f"❌ winsdk недоступен. Установите: pip install winsdk. Ошибка: {e}")


class WindowsNotificationListener:
    """Слушатель уведомлений Windows через UserNotificationListener API"""
    
    def __init__(self, callback: Callable[[str], None], filter_sources: Optional[list] = None, root_window=None):
        self.callback = callback
        self.filter_sources = filter_sources or ["kz.kaspi.mobile", "kaspi.kz", "kaspi"]
        self.root_window = root_window
        self.is_running = False
        self.thread = None
        self.loop = None
        self.listener = None
        self.total_notifications = 0
        self.filtered_notifications = 0
        
        # Кэш уже обработанных уведомлений (сохраняется между перезапусками!)
        self.last_seen = set()
        
        logger.info(f"WindowsNotificationListener инициализирован")
    
    def start(self) -> bool:
        """Запуск слушателя"""
        if not WINSDK_AVAILABLE:
            logger.error("winsdk недоступен")
            return False
        
        if self.is_running:
            return True
        
        try:
            self.thread = threading.Thread(target=self._run_listener, daemon=True, name="NotificationListener")
            self.thread.start()
            
            import time
            time.sleep(1.0)
            
            if self.is_running:
                logger.info("✅ Windows Notification Listener запущен")
                return True
            else:
                logger.error("❌ Не удалось запустить слушатель")
                return False
                
        except Exception as e:
            logger.exception(f"Ошибка запуска слушателя: {e}")
            return False
    
    def stop(self):
        """Остановка слушателя"""
        if not self.is_running:
            return
        
        logger.info("Остановка Windows Notification Listener...")
        self.is_running = False
        
        if self.loop and self.loop.is_running():
            self.loop.call_soon_threadsafe(self.loop.stop)
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)
        
        logger.info("✅ Слушатель остановлен")
    
    def _run_listener(self):
        """Основной цикл слушателя в отдельном потоке"""
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            
            try:
                self.loop.run_until_complete(self._listen_notifications())
            except Exception as e:
                logger.warning(f"Ошибка в async слушателе: {e}")
            
        except Exception as e:
            logger.exception(f"Ошибка в потоке слушателя: {e}")
        finally:
            try:
                if self.loop and not self.loop.is_closed():
                    self.loop.close()
            except Exception as e:
                logger.debug(f"Ошибка закрытия loop: {e}")
            finally:
                self.is_running = False
    
    async def _listen_notifications(self):
        """Асинхронный слушатель уведомлений"""
        self.is_running = True
        logger.info("🔍 Начинаем прослушивание уведомлений...")
        
        try:
            self.listener = UserNotificationListener.current
            logger.info("📱 UserNotificationListener получен")
            
            # Проверяем доступ
            access_status = await self._check_access()
            if not access_status:
                logger.error("❌ Доступ к уведомлениям запрещен")
                return
            
            logger.info("✅ Доступ к уведомлениям получен")
            
            # Polling режим (используем self.last_seen чтобы кэш сохранялся при перезапусках!)
            check_count = 0
            
            logger.info("📱 Ожидание уведомлений от Kaspi...")
            while self.is_running:
                try:
                    check_count += 1
                    notifications = await self.listener.get_notifications_async(NotificationKinds.TOAST)
                    
                    if notifications:
                        for notification in notifications:
                            try:
                                notif_id = self._generate_notification_id(notification)
                                
                                # Проверяем возраст уведомления - игнорируем старые (>5 минут)
                                if not self._is_notification_recent(notification):
                                    logger.debug("Игнорируем старое уведомление (>5 минут)")
                                    continue
                                
                                if notif_id not in self.last_seen:
                                    self.last_seen.add(notif_id)
                                    await self._process_notification(notification)
                            except Exception as e:
                                logger.debug(f"Ошибка обработки: {e}")
                    
                    if check_count % 30 == 0:
                        logger.debug(f"📱 Polling активен... ({check_count} проверок)")
                    
                    if len(self.last_seen) > 200:
                        self.last_seen.clear()
                    
                except Exception as e:
                    logger.warning(f"⚠️ Ошибка polling: {e}")
                
                await asyncio.sleep(1.0)
            
        except Exception as e:
            logger.exception(f"Ошибка в слушателе: {e}")
        finally:
            self.is_running = False
            logger.info("Слушатель завершён")
    
    async def _check_access(self) -> bool:
        """Проверка доступа к уведомлениям"""
        try:
            current_status = self.listener.get_access_status()
            logger.info(f"Статус доступа: {current_status}")
            
            if current_status == UserNotificationListenerAccessStatus.ALLOWED:
                logger.info("✅ Доступ разрешен")
                return True
            elif current_status == UserNotificationListenerAccessStatus.DENIED:
                logger.error("❌ Доступ запрещен")
                return False
            else:  # UNSPECIFIED
                logger.info("📱 Запрашиваем доступ...")
                try:
                    access_status = await self.listener.request_access_async()
                    if access_status == UserNotificationListenerAccessStatus.ALLOWED:
                        logger.info("✅ Доступ предоставлен")
                        return True
                    else:
                        logger.error("❌ Доступ запрещен")
                        return False
                except Exception as e:
                    logger.warning(f"⚠️ Не удалось запросить доступ: {e}")
                    return False
                    
        except Exception as e:
            logger.exception(f"Ошибка проверки доступа: {e}")
            return False
    
    def _generate_notification_id(self, notification) -> str:
        """Генерирует стабильный ID на основе содержимого"""
        try:
            data_parts = []
            
            try:
                if notification.app_info and notification.app_info.id:
                    data_parts.append(str(notification.app_info.id))
            except:
                pass
            
            try:
                text = self._extract_notification_text(notification)
                if text:
                    data_parts.append(text)
            except:
                pass
            
            try:
                if hasattr(notification, 'creation_time') and notification.creation_time:
                    data_parts.append(str(notification.creation_time))
            except:
                pass
            
            if data_parts:
                combined = "|".join(data_parts)
                notif_id = hashlib.sha256(combined.encode('utf-8')).hexdigest()[:16]
                logger.debug(f"ID уведомления: {notif_id}")
                return notif_id
        
        except Exception as e:
            logger.debug(f"Ошибка генерации ID: {e}")
        
        fallback_id = hashlib.sha256(str(datetime.now().timestamp()).encode()).hexdigest()[:16]
        return fallback_id
    
    async def _process_notification(self, notification) -> bool:
        """Обработка уведомления"""
        try:
            self.total_notifications += 1
            
            # Получаем app_id
            app_id = ""
            try:
                if notification.app_info:
                    app_id = notification.app_info.id or ""
            except:
                pass
            
            # Извлекаем текст
            notification_text = self._extract_notification_text(notification)
            
            if not notification_text:
                logger.debug("Не удалось извлечь текст")
                return False
            
            # Фильтруем
            if not self._should_process_notification(app_id, notification_text):
                logger.debug(f"Отфильтровано: {notification_text[:50]}...")
                return False
            
            self.filtered_notifications += 1
            logger.info(f"📱 Получено уведомление: {notification_text[:100]}...")
            
            # Вызываем callback
            if self.callback:
                if self.root_window:
                    try:
                        self.root_window.after(0, self.callback, notification_text)
                    except Exception as e:
                        logger.warning(f"Ошибка callback: {e}")
                        self.callback(notification_text)
                else:
                    self.callback(notification_text)
            
            return True
            
        except Exception as e:
            logger.exception(f"Ошибка обработки: {e}")
            return False
    
    def _extract_notification_text(self, notification) -> str:
        """Извлечение текста из уведомления"""
        try:
            texts = []
            
            try:
                if notification.notification and notification.notification.visual:
                    visual = notification.notification.visual
                    
                    binding = None
                    for attr_name in ['TOAST_GENERIC', 'toast_generic', 'ToastGeneric', 'TOAST']:
                        try:
                            binding = visual.get_binding(getattr(KnownNotificationBindings, attr_name, None))
                            if binding:
                                break
                        except:
                            continue
                    
                    if not binding:
                        for value in [0, 1, 2, 3]:
                            try:
                                binding = visual.get_binding(value)
                                if binding:
                                    break
                            except:
                                continue
                    
                    if binding:
                        text_elements = binding.get_text_elements()
                        if text_elements:
                            for text_elem in text_elements:
                                if text_elem.text:
                                    texts.append(text_elem.text)
                    
                    if not texts:
                        try:
                            xml_str = visual.get_xml_as_string()
                            if xml_str:
                                extracted = self._extract_text_from_xml(xml_str)
                                if extracted:
                                    texts.append(extracted)
                        except:
                            pass
                            
            except:
                pass
            
            result = " ".join(filter(None, texts))
            
            # Добавляем время
            notification_timestamp = self._extract_notification_timestamp(notification)
            if notification_timestamp:
                result = f"{result} {notification_timestamp}"
            
            return result
            
        except Exception as e:
            logger.warning(f"Ошибка извлечения текста: {e}")
            return ""
    
    def _extract_notification_timestamp(self, notification) -> str:
        """Извлечение времени из уведомления"""
        try:
            if hasattr(notification, 'creation_time'):
                creation_time = notification.creation_time
                if creation_time:
                    if hasattr(creation_time, 'hour') and hasattr(creation_time, 'minute'):
                        # Добавляем коррекцию временной зоны (если time в UTC, нужно добавить смещение)
                        hour = creation_time.hour
                        minute = creation_time.minute
                        
                        # Получаем текущее смещение временной зоны
                        from datetime import datetime, timezone
                        local_tz = datetime.now(timezone.utc).astimezone().tzinfo
                        offset = local_tz.utcoffset(datetime.now())
                        if offset:
                            tz_hours = int(offset.total_seconds() / 3600)
                            hour = (hour + tz_hours) % 24
                        
                        timestamp_str = f"{hour:02d}:{minute:02d}"
                        logger.debug(f"Время из уведомления: {timestamp_str}")
                        return timestamp_str
            
            if hasattr(notification, 'timestamp'):
                timestamp = notification.timestamp
                if timestamp:
                    if hasattr(timestamp, 'hour') and hasattr(timestamp, 'minute'):
                        # Та же коррекция
                        hour = timestamp.hour
                        minute = timestamp.minute
                        
                        from datetime import datetime, timezone
                        local_tz = datetime.now(timezone.utc).astimezone().tzinfo
                        offset = local_tz.utcoffset(datetime.now())
                        if offset:
                            tz_hours = int(offset.total_seconds() / 3600)
                            hour = (hour + tz_hours) % 24
                        
                        timestamp_str = f"{hour:02d}:{minute:02d}"
                        logger.debug(f"Время: {timestamp_str}")
                        return timestamp_str
        except Exception as e:
            logger.debug(f"Ошибка извлечения времени: {e}")
        
        return ""
    
    def _is_notification_recent(self, notification) -> bool:
        """
        Проверка, свежее ли уведомление (не старше 5 минут)
        
        Это нужно чтобы при перезапуске приложения не обрабатывать старые уведомления
        
        Args:
            notification: UserNotification object
            
        Returns:
            bool: True если уведомление свежее, False если старое
        """
        try:
            from datetime import datetime, timezone, timedelta
            
            # Пробуем получить время создания уведомления
            creation_time = None
            if hasattr(notification, 'creation_time'):
                creation_time = notification.creation_time
            elif hasattr(notification, 'timestamp'):
                creation_time = notification.timestamp
            
            if creation_time:
                # Если это строка - пробуем парсить
                if isinstance(creation_time, str):
                    try:
                        creation_time = datetime.fromisoformat(creation_time)
                    except:
                        logger.debug("Не удалось парсить время уведомления")
                        return True  # Если не можем определить - обрабатываем
                
                # Если это datetime объект - проверяем возраст
                if hasattr(creation_time, 'timestamp'):
                    now = datetime.now()
                    # Если есть timezone info - конвертируем в локальное время
                    if hasattr(creation_time, 'tzinfo') and creation_time.tzinfo:
                        creation_time = creation_time.astimezone().replace(tzinfo=None)
                    
                    age = now - creation_time
                    max_age = timedelta(minutes=5)  # 5 минут
                    
                    is_recent = age < max_age
                    logger.debug(f"Возраст уведомления: {age.total_seconds():.0f}сек, recent={is_recent}")
                    return is_recent
        
        except Exception as e:
            logger.debug(f"Ошибка проверки возраста уведомления: {e}")
        
        # Если не можем определить - обрабатываем (лучше обработать лишний раз)
        return True
    
    def _extract_text_from_xml(self, xml_str: str) -> str:
        """Извлечение текста из XML"""
        try:
            root = ET.fromstring(xml_str)
            texts = []
            
            for text_elem in root.findall('.//text'):
                if text_elem.text:
                    texts.append(text_elem.text)
            
            return " ".join(texts)
            
        except Exception as e:
            logger.debug(f"Ошибка парсинга XML: {e}")
            return ""
    
    def _should_process_notification(self, app_id: str, notification_text: str) -> bool:
        """Проверка нужно ли обрабатывать"""
        if not notification_text:
            return False
        
        text_lower = notification_text.lower()
        app_id_lower = app_id.lower() if app_id else ""
        
        # Проверяем app_id
        for source in self.filter_sources:
            if source.lower() in app_id_lower:
                return True
        
        # Проверяем текст
        keywords = ["пополнение", "перевод", "₸", "тенге"]
        for keyword in keywords:
            if keyword in text_lower:
                return True
        
        return False


class MockNotificationListener:
    """Заглушка для тестирования"""
    def __init__(self, callback, **kwargs):
        self.callback = callback
    
    def start(self):
        return True
    
    def stop(self):
        pass


def create_notification_listener(callback, use_mock=False, filter_sources=None, mock_interval=5.0, root_window=None):
    """Создание слушателя"""
    if use_mock or not WINSDK_AVAILABLE:
        logger.info("Используем Mock слушатель")
        return MockNotificationListener(callback, filter_sources=filter_sources)
    
    logger.info("Используем Windows слушатель")
    return WindowsNotificationListener(callback, filter_sources=filter_sources, root_window=root_window)
