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
        self.listen_task = None  # Задача слушателя для корректной отмены
        
        # Кэш уже обработанных уведомлений в ТЕКУЩЕЙ СЕССИИ (очищается при перезапуске!)
        # Дедупликация по времени происходит в pipeline через БД
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
        
        # Отменяем задачу слушателя правильно
        if self.loop and not self.loop.is_closed():
            try:
                if self.loop.is_running():
                    # Отменяем задачу через call_soon_threadsafe
                    def cancel_task():
                        if self.listen_task and not self.listen_task.done():
                            self.listen_task.cancel()
                            logger.debug("Задача слушателя отменена")
                    self.loop.call_soon_threadsafe(cancel_task)
            except Exception as e:
                logger.debug(f"Ошибка отмены задачи: {e}")
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=3.0)
        
        logger.info("✅ Слушатель остановлен")
    
    def _run_listener(self):
        """Основной цикл слушателя в отдельном потоке"""
        try:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            
            try:
                # Создаём задачу слушателя
                self.listen_task = self.loop.create_task(self._listen_notifications())
                # Запускаем слушатель до завершения или отмены
                self.loop.run_until_complete(self.listen_task)
            except asyncio.CancelledError:
                logger.debug("Слушатель отменён")
            except Exception as e:
                if "Event loop stopped" not in str(e):
                    logger.warning(f"Ошибка в async слушателе: {e}")
            finally:
                # Отменяем все оставшиеся задачи
                try:
                    pending = [t for t in asyncio.all_tasks(self.loop) if not t.done() and t != self.listen_task]
                    for task in pending:
                        task.cancel()
                    # Ждём отмены всех задач (игнорируем ошибки)
                    if pending:
                        try:
                            self.loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                        except Exception:
                            pass  # Игнорируем ошибки при отмене
                except Exception as e:
                    logger.debug(f"Ошибка отмены задач: {e}")
            
        except Exception as e:
            logger.exception(f"Ошибка в потоке слушателя: {e}")
        finally:
            try:
                if self.loop and not self.loop.is_closed():
                    # Даём немного времени на завершение
                    try:
                        pending = [t for t in asyncio.all_tasks(self.loop) if not t.done()]
                        if pending:
                            self.loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                    except Exception:
                        pass
                    self.loop.close()
            except Exception as e:
                logger.debug(f"Ошибка закрытия loop: {e}")
            finally:
                self.is_running = False
                self.listen_task = None
    
    async def _listen_notifications(self):
        """Асинхронный слушатель уведомлений"""
        self.is_running = True
        # Очищаем кэш при запуске - обрабатываем все уведомления заново
        # Дедупликация происходит в pipeline через БД
        self.last_seen.clear()
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
            logger.info("📋 Обрабатываем ВСЕ уведомления (дедупликация через БД)")
            
            # Polling режим - обрабатываем все уведомления, даже старые
            check_count = 0
            
            logger.info("📱 Ожидание уведомлений от Kaspi...")
            while self.is_running:
                try:
                    # Проверяем флаг перед каждой итерацией
                    if not self.is_running:
                        break
                        
                    check_count += 1
                    notifications = await self.listener.get_notifications_async(NotificationKinds.TOAST)
                    
                    if notifications:
                        logger.debug(f"📬 Найдено {len(notifications)} уведомлений")
                        for notification in notifications:
                            try:
                                notif_id = self._generate_notification_id(notification)
                                
                                # Обрабатываем ВСЕ уведомления, даже старые
                                # Дедупликация происходит в pipeline через БД
                                if notif_id not in self.last_seen:
                                    logger.debug(f"🆕 Новое уведомление для обработки: {notif_id[:16]}...")
                                    self.last_seen.add(notif_id)
                                    await self._process_notification(notification)
                                else:
                                    # Уже обрабатывали в этой сессии - пропускаем
                                    logger.debug(f"🔁 Уведомление уже обработано в этой сессии: {notif_id[:16]}...")
                            except Exception as e:
                                logger.warning(f"⚠️ Ошибка обработки уведомления: {e}")
                    
                    if check_count % 30 == 0:
                        logger.info(f"📱 Polling активен... (обработано уведомлений: {self.total_notifications}, отфильтровано: {self.filtered_notifications})")
                    
                    if len(self.last_seen) > 200:
                        self.last_seen.clear()
                    
                except asyncio.CancelledError:
                    logger.debug("Polling отменён")
                    break
                except Exception as e:
                    logger.warning(f"⚠️ Ошибка polling: {e}")
                
                # Проверяем флаг перед sleep
                if not self.is_running:
                    break
                    
                try:
                    await asyncio.sleep(1.0)
                except asyncio.CancelledError:
                    logger.debug("Sleep отменён")
                    break
            
        except asyncio.CancelledError:
            logger.debug("Слушатель отменён через CancelledError")
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
            should_process = self._should_process_notification(app_id, notification_text)
            if not should_process:
                logger.debug(f"🚫 Уведомление отфильтровано (app_id={app_id}, text={notification_text[:50]}...)")
                return False
            logger.debug(f"✅ Уведомление прошло фильтр (app_id={app_id})")
            
            self.filtered_notifications += 1
            logger.info(f"📱 ✅ УВЕДОМЛЕНИЕ ОТ KASPI: {notification_text[:100]}...")
            
            # Вызываем callback
            if self.callback:
                logger.debug(f"📤 Вызываю callback для уведомления...")
                try:
                    # Сохраняем notification_text в локальную переменную для lambda
                    text_to_send = notification_text
                    
                    if self.root_window:
                        try:
                            # Используем lambda с правильным захватом значения
                            self.root_window.after(0, lambda txt=text_to_send: self.callback(txt))
                            logger.debug(f"✅ Callback запланирован через root.after()")
                        except Exception as e:
                            logger.warning(f"⚠️ Ошибка root.after(), вызываю напрямую: {e}")
                            self.callback(text_to_send)
                    else:
                        logger.debug(f"📞 Вызываю callback напрямую (нет root_window)")
                        self.callback(text_to_send)
                    logger.debug(f"✅ Callback вызван")
                except Exception as e:
                    logger.exception(f"❌ КРИТИЧЕСКАЯ ОШИБКА в callback: {e}")
            else:
                logger.error("❌ Callback не установлен!")
            
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
        Проверка, свежее ли уведомление
        
        По умолчанию не старше 30 минут (настраивается в Config.NOTIFICATION_MAX_AGE_MINUTES)
        Это нужно чтобы при перезапуске приложения не обрабатывать очень старые уведомления
        
        Args:
            notification: UserNotification object
            
        Returns:
            bool: True если уведомление свежее, False если старое
        """
        try:
            from datetime import datetime, timezone, timedelta
            from config import Config
            
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
                    max_age = timedelta(minutes=Config.NOTIFICATION_MAX_AGE_MINUTES)
                    
                    is_recent = age < max_age
                    logger.debug(f"Возраст уведомления: {age.total_seconds():.0f}сек (макс {Config.NOTIFICATION_MAX_AGE_MINUTES}мин), recent={is_recent}")
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


def create_notification_listener(callback, filter_sources=None, root_window=None):
    """Создание слушателя уведомлений"""
    if not WINSDK_AVAILABLE:
        logger.error("❌ winsdk недоступен. Установите: pip install winsdk")
        raise RuntimeError("winsdk недоступен")
    
    logger.info("Используем Windows слушатель")
    return WindowsNotificationListener(callback, filter_sources=filter_sources, root_window=root_window)
