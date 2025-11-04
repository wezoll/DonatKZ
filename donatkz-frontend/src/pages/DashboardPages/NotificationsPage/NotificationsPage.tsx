import React, { useState, useEffect } from "react";
import { notificationsApi, type Notification, type TextStyle } from "../../../api/notifications.api";
import { websocketApi } from "../../../api/websocket.api";
import "./NotificationsPage.css";

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetUrl, setWidgetUrl] = useState<string>("");
  const [isWidgetUrlVisible, setIsWidgetUrlVisible] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [newNotifName, setNewNotifName] = useState("");
  const [newNotifAmount, setNewNotifAmount] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"image" | "sound" | "text">("image");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [styleModalType, setStyleModalType] = useState<"title" | "message">("title");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [customGifsList, setCustomGifsList] = useState<Array<{ id: string; url: string; name: string; file: File }>>([]);
  const [customSoundsList, setCustomSoundsList] = useState<Array<{ id: string; url: string; name: string; file: File }>>([]);

  // Settings state
  const [selectedGif, setSelectedGif] = useState<string>("");
  const [customGif, setCustomGif] = useState<File | null>(null);
  const [selectedSound, setSelectedSound] = useState<string>("");
  const [customSound, setCustomSound] = useState<File | null>(null);
  const [displayDuration, setDisplayDuration] = useState(7);
  const [volume, setVolume] = useState(100);
  const [enterAnimation, setEnterAnimation] = useState<"left" | "right" | "top" | "bottom">("left");
  const [exitAnimation, setExitAnimation] = useState<"left" | "right" | "top" | "bottom">("left");
  const [titleTemplate, setTitleTemplate] = useState("{username} - {amount}!");
  const [messageTemplate, setMessageTemplate] = useState("{message}");
  const [titleTextStyle, setTitleTextStyle] = useState<TextStyle>({
    fontFamily: "Montserrat",
    fontSize: 32,
    textColor: "#FFD700",
    isBold: true,
    isItalic: false,
    isUnderline: false,
    transform: "none",
    alignment: "center",
  });
  const [messageTextStyle, setMessageTextStyle] = useState<TextStyle>({
    fontFamily: "Montserrat",
    fontSize: 20,
    textColor: "#FFFFFF",
    isBold: false,
    isItalic: false,
    isUnderline: false,
    transform: "none",
    alignment: "center",
  });

  const presetGifs = [
    { id: "gif1", url: "/gifs/donate1.gif", name: "Игровой автомат" },
    { id: "gif2", url: "/gifs/donate2.gif", name: "Мр. Крабс" },
    { id: "gif3", url: "/gifs/donate3.gif", name: "Медведь" },
    { id: "gif4", url: "/gifs/donate4.gif", name: "Нян-кэт" },
    { id: "gif5", url: "/gifs/donate5.gif", name: "Денежная пушка" },
  ];

  const presetSounds = [
    { id: "sound1", url: "/sounds/donate1_sound.mp3", name: "Звук 1" },
    { id: "sound2", url: "/sounds/donate2_sound.mp3", name: "Звук 2" },
    { id: "sound3", url: "/sounds/donate3_sound.mp3", name: "Звук 3" },
    { id: "sound4", url: "/sounds/donate4_sound.mp3", name: "Звук 4" },
    { id: "sound5", url: "/sounds/donate5_sound.mp3", name: "Звук 5" },
  ];

  // Загрузка уведомлений при монтировании
  useEffect(() => {
    loadNotifications();
    loadWidgetUrl();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWidgetUrl = async () => {
    try {
      const data = await websocketApi.getApiKey();
      const url = websocketApi.getWidgetUrl(data.apiKey);
      setWidgetUrl(url);
    } catch (error) {
      console.error("Failed to load widget URL:", error);
    }
  };

  const handleAddNotification = async () => {
    if (!newNotifName || !newNotifAmount) return;

    try {
      const newNotification = await notificationsApi.create({
        name: newNotifName,
        minAmount: parseFloat(newNotifAmount),
        isEnabled: true,
        gifUrl: presetGifs[0].url,
        gifType: "preset",
        soundUrl: presetSounds[0].url,
        soundType: "preset",
        displayDuration: 7,
        volume: 100,
        enterAnimation: "left",
        exitAnimation: "left",
        titleTemplate: "{username} - {amount}!",
        messageTemplate: "{message}",
        titleText: {
          fontFamily: "Montserrat",
          fontSize: 32,
          textColor: "#FFD700",
          isBold: true,
          isItalic: false,
          isUnderline: false,
          transform: "none",
          alignment: "center",
        },
        messageText: {
          fontFamily: "Montserrat",
          fontSize: 20,
          textColor: "#FFFFFF",
          isBold: false,
          isItalic: false,
          isUnderline: false,
          transform: "none",
          alignment: "center",
        },
      });

      setNotifications([...notifications, newNotification]);
      setIsAddModalOpen(false);
      setNewNotifName("");
      setNewNotifAmount("");
    } catch (error) {
      console.error("Failed to create notification:", error);
      alert("Ошибка при создании уведомления");
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm("Вы уверены что хотите удалить это уведомление?")) return;

    try {
      await notificationsApi.delete(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("Ошибка при удалении уведомления");
    }
  };

  const handleToggleNotification = async (id: number) => {
    try {
      const updated = await notificationsApi.toggle(id);
      setNotifications(notifications.map((n) => (n.id === id ? updated : n)));
    } catch (error) {
      console.error("Failed to toggle notification:", error);
      alert("Ошибка при переключении уведомления");
    }
  };

  const handleCustomizeNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setEditAmount(notification.minAmount);
    setSelectedGif(notification.gifUrl);
    setSelectedSound(notification.soundUrl);
    setDisplayDuration(notification.displayDuration);
    setVolume(notification.volume);
    setEnterAnimation(notification.enterAnimation);
    setExitAnimation(notification.exitAnimation);
    setTitleTemplate(notification.titleTemplate);
    setMessageTemplate(notification.messageTemplate);
    setTitleTextStyle(notification.titleText);
    setMessageTextStyle(notification.messageText);
    setIsCustomizeModalOpen(true);
  };

  const handleBackToList = () => {
    setIsCustomizeModalOpen(false);
    setSelectedNotification(null);
    setCustomGif(null);
    setCustomSound(null);
  };

  const handleSaveCustomization = async () => {
    if (!selectedNotification) return;

    try {
      const updated = await notificationsApi.update(selectedNotification.id, {
        name: selectedNotification.name,
        minAmount: editAmount,
        isEnabled: selectedNotification.isEnabled,
        gifUrl: customGif ? URL.createObjectURL(customGif) : selectedGif,
        gifType: customGif ? "custom" : "preset",
        soundUrl: customSound ? URL.createObjectURL(customSound) : selectedSound,
        soundType: customSound ? "custom" : "preset",
        displayDuration,
        volume,
        enterAnimation,
        exitAnimation,
        titleTemplate,
        messageTemplate,
        titleText: titleTextStyle,
        messageText: messageTextStyle,
      });

      setNotifications(notifications.map((n) => (n.id === selectedNotification.id ? updated : n)));
      handleBackToList();
    } catch (error) {
      console.error("Failed to update notification:", error);
      alert("Ошибка при сохранении изменений");
    }
  };

  const handleCopyUrl = (url: string, notifId: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(notifId.toString());
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShowUrl = (notifId: number) => {
    setShowUrl((prev) => ({
      ...prev,
      [notifId]: !prev[notifId],
    }));
  };

  const handleGifFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newCustomGif = {
        id: `custom-gif-${Date.now()}`,
        url: URL.createObjectURL(file),
        name: file.name,
        file: file,
      };

      setCustomGifsList([...customGifsList, newCustomGif]);
      setCustomGif(file);
      setSelectedGif(newCustomGif.url);
    }
  };

  const handleSoundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newCustomSound = {
        id: `custom-sound-${Date.now()}`,
        url: URL.createObjectURL(file),
        name: file.name,
        file: file,
      };

      setCustomSoundsList([...customSoundsList, newCustomSound]);
      setCustomSound(file);
      setSelectedSound(newCustomSound.url);
    }
  };

  const getAnimationLabel = (animation: string) => {
    const labels: { [key: string]: string } = {
      left: "Слева направо",
      right: "Справа налево",
      top: "Сверху вниз",
      bottom: "Снизу вверх",
    };
    return labels[animation] || animation;
  };

  const getTextStyle = (textStyle: TextStyle) => {
    return {
      fontFamily: textStyle.fontFamily,
      fontSize: `${textStyle.fontSize}px`,
      color: textStyle.textColor,
      fontWeight: textStyle.isBold ? "bold" : "normal",
      fontStyle: textStyle.isItalic ? "italic" : "normal",
      textDecoration: textStyle.isUnderline ? "underline" : "none",
      textTransform: textStyle.transform as any,
      textAlign: textStyle.alignment as any,
    };
  };

  const handlePlaySound = (soundUrl: string) => {
    const audio = new Audio(soundUrl);
    audio.volume = volume / 100;
    audio.play().catch((err) => {
      console.error("Ошибка воспроизведения:", err);
      alert("Не удалось воспроизвести звук. " + err.message);
    });
  };

  const handleTextStyleChange = (type: "title" | "message", key: keyof TextStyle, value: any) => {
    const currentTextStyle = type === "title" ? titleTextStyle : messageTextStyle;
    const updatedTextStyle = {
      ...currentTextStyle,
      [key]: value,
    };

    if (type === "title") {
      setTitleTextStyle(updatedTextStyle);
    } else {
      setMessageTextStyle(updatedTextStyle);
    }
  };

  const openStyleModal = (type: "title" | "message") => {
    setStyleModalType(type);
    setIsStyleModalOpen(true);
  };

  const formatPreviewText = (
    template: string,
    username: string = "Нурдаулет",
    amount: number = 500,
    message: string = "Спасибо за стрим!"
  ) => {
    return template
      .replace("{username}", username)
      .replace("{amount}", `${amount} ₸`)
      .replace("{message}", message);
  };

  const handlePlayPreview = () => {
    setIsPreviewPlaying(true);

    if (selectedSound) {
      const audio = new Audio(selectedSound);
      audio.volume = volume / 100;
      audio.play().catch((err) => console.error("Error playing audio:", err));
    }

    setTimeout(() => {
      setIsPreviewPlaying(false);
    }, displayDuration * 1000);
  };

  // Рендер редактора
  if (isCustomizeModalOpen && selectedNotification) {
    return (
      <div className="notification-page">
        <div className="notification-editor-layout">
          <div className="editor-sidebar">
            <button className="btn-back" onClick={handleBackToList}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Назад
            </button>

            <div className="editor-header">
              <h2 className="editor-title">{selectedNotification.name}</h2>
            </div>

            <div className="editor-tabs">
              <button className={`editor-tab ${activeTab === "image" ? "active" : ""}`} onClick={() => setActiveTab("image")}>
                ИЗОБРАЖЕНИЕ
              </button>
              <button className={`editor-tab ${activeTab === "sound" ? "active" : ""}`} onClick={() => setActiveTab("sound")}>
                ЗВУК
              </button>
              <button className={`editor-tab ${activeTab === "text" ? "active" : ""}`} onClick={() => setActiveTab("text")}>
                ТЕКСТ
              </button>
            </div>

            <div className="editor-content">
              {activeTab === "image" && (
                <div className="settings-panel">
                  <div className="setting-group">
                    <label className="setting-label">Минимальная сумма (₸)</label>
                    <input
                      type="number"
                      className="setting-input"
                      value={editAmount}
                      onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                      placeholder="500"
                    />
                    <div className="setting-hint">Уведомление будет показываться для донатов от этой суммы</div>
                  </div>

                  <div className="setting-divider">Выбор гифки</div>

                  <div className="setting-group">
                    <label className="setting-label">Предустановленные</label>
                    <div className="preset-grid">
                      {presetGifs.map((gif) => (
                        <button
                          key={gif.id}
                          className={`preset-item ${selectedGif === gif.url && !customGif ? "active" : ""}`}
                          onClick={() => {
                            setSelectedGif(gif.url);
                            setCustomGif(null);
                          }}
                        >
                          <div className="preset-preview">
                            <img src={gif.url} alt={gif.name} />
                          </div>
                          <span className="preset-name">{gif.name}</span>
                        </button>
                      ))}
                      {customGifsList.map((gif) => (
                        <button
                          key={gif.id}
                          className={`preset-item ${selectedGif === gif.url ? "active" : ""}`}
                          onClick={() => {
                            setSelectedGif(gif.url);
                            setCustomGif(gif.file);
                          }}
                        >
                          <div className="preset-preview">
                            {gif.file.type.startsWith("video/") ? (
                              <video src={gif.url} muted loop />
                            ) : (
                              <img src={gif.url} alt={gif.name} />
                            )}
                          </div>
                          <span className="preset-name">{gif.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Или загрузите свою</label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="gif-upload"
                        accept=".gif,.mp4,.webm"
                        onChange={handleGifFileChange}
                        className="file-input"
                      />
                      <label htmlFor="gif-upload" className="file-upload-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {customGif ? customGif.name : "Выбрать файл"}
                      </label>
                    </div>
                    <div className="setting-hint">Поддерживаются форматы: GIF, MP4, WEBM</div>
                  </div>

                  <div className="setting-divider">Настройки показа</div>

                  <div className="setting-group">
                    <label className="setting-label">
                      Время показа:
                      <span className="setting-value">{displayDuration} сек</span>
                    </label>
                    <input
                      type="range"
                      className="setting-range"
                      min="3"
                      max="30"
                      value={displayDuration}
                      onChange={(e) => setDisplayDuration(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Анимация входа:</label>
                    <select
                      className="setting-select"
                      value={enterAnimation}
                      onChange={(e) => setEnterAnimation(e.target.value as any)}
                    >
                      <option value="left">Слева направо</option>
                      <option value="right">Справа налево</option>
                      <option value="top">Сверху вниз</option>
                      <option value="bottom">Снизу вверх</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Анимация выхода:</label>
                    <select
                      className="setting-select"
                      value={exitAnimation}
                      onChange={(e) => setExitAnimation(e.target.value as any)}
                    >
                      <option value="left">Влево</option>
                      <option value="right">Вправо</option>
                      <option value="top">Вверх</option>
                      <option value="bottom">Вниз</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "sound" && (
                <div className="settings-panel">
                  <div className="setting-group">
                    <label className="setting-label">Минимальная сумма (₸)</label>
                    <input
                      type="number"
                      className="setting-input"
                      value={editAmount}
                      onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                      placeholder="500"
                    />
                    <div className="setting-hint">Уведомление будет показываться для донатов от этой суммы</div>
                  </div>

                  <div className="setting-divider">Выбор звука</div>

                  <div className="setting-group">
                    <label className="setting-label">Предустановленные</label>
                    <div className="preset-list">
                      {presetSounds.map((sound) => (
                        <div key={sound.id} className="preset-sound-wrapper">
                          <button
                            className={`preset-sound-item ${selectedSound === sound.url && !customSound ? "active" : ""}`}
                            onClick={() => {
                              setSelectedSound(sound.url);
                              setCustomSound(null);
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                            <span>{sound.name}</span>
                          </button>
                          <button
                            className="btn-play-sound"
                            onClick={() => handlePlaySound(sound.url)}
                            title="Прослушать"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {customSoundsList.map((sound) => (
                        <div key={sound.id} className="preset-sound-wrapper">
                          <button
                            className={`preset-sound-item ${selectedSound === sound.url ? "active" : ""}`}
                            onClick={() => {
                              setSelectedSound(sound.url);
                              setCustomSound(sound.file);
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                            <span>{sound.name}</span>
                          </button>
                          <button
                            className="btn-play-sound"
                            onClick={() => handlePlaySound(sound.url)}
                            title="Прослушать"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Или загрузите свой</label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="sound-upload"
                        accept=".mp3,.wav,.ogg"
                        onChange={handleSoundFileChange}
                        className="file-input"
                      />
                      <label htmlFor="sound-upload" className="file-upload-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {customSound ? customSound.name : "Выбрать файл"}
                      </label>
                    </div>
                    <div className="setting-hint">Поддерживаются форматы: MP3, WAV, OGG</div>
                  </div>

                  <div className="setting-divider">Настройки звука</div>

                  <div className="setting-group">
                    <label className="setting-label">
                      Громкость:
                      <span className="setting-value">{volume}%</span>
                    </label>
                    <input
                      type="range"
                      className="setting-range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {activeTab === "text" && (
                <div className="settings-panel">
                  <div className="setting-group">
                    <label className="setting-label">Минимальная сумма (₸)</label>
                    <input
                      type="number"
                      className="setting-input"
                      value={editAmount}
                      onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                      placeholder="500"
                    />
                    <div className="setting-hint">Уведомление будет показываться для донатов от этой суммы</div>
                  </div>

                  <div className="setting-divider">Шаблон заголовка</div>

                  <div className="setting-group">
                    <label className="setting-label">Текст заголовка</label>
                    <input
                      type="text"
                      className="setting-input setting-input-code"
                      value={titleTemplate}
                      onChange={(e) => setTitleTemplate(e.target.value)}
                      placeholder="{username} - {amount}!"
                    />
                    <div className="setting-hint">
                      Доступные теги: {"{username}"}, {"{amount}"}, {"{message}"}
                    </div>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Стиль заголовка</label>
                    <button className="btn-style-editor" onClick={() => openStyleModal("title")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                      </svg>
                      Стилизовать шрифт
                    </button>
                  </div>

                  <div className="setting-divider">Шаблон сообщения</div>

                  <div className="setting-group">
                    <label className="setting-label">Текст сообщения</label>
                    <input
                      type="text"
                      className="setting-input setting-input-code"
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      placeholder="{message}"
                    />
                    <div className="setting-hint">
                      Доступные теги: {"{username}"}, {"{amount}"}, {"{message}"}
                    </div>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Стиль сообщения</label>
                    <button className="btn-style-editor" onClick={() => openStyleModal("message")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                      </svg>
                      Стилизовать шрифт
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="btn-create-widget" onClick={handleSaveCustomization}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Сохранить изменения
            </button>
          </div>

          <div className="editor-preview">
            <div className="preview-header">
              <h3 className="preview-title">Превью уведомления</h3>
              <button className="btn-play-preview" onClick={handlePlayPreview} disabled={isPreviewPlaying}>
                {isPreviewPlaying ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Воспроизведение...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Запустить превью
                  </>
                )}
              </button>
            </div>
            <div className="preview-area preview-notification">
              <div className="notification-preview-card">
                <div className={`notification-preview-gif ${isPreviewPlaying ? "playing" : ""}`}>
                  {customGif ? (
                    customGif.type.startsWith("video/") ? (
                      <video autoPlay loop muted>
                        <source src={URL.createObjectURL(customGif)} />
                      </video>
                    ) : (
                      <img src={URL.createObjectURL(customGif)} alt="Custom GIF" />
                    )
                  ) : selectedGif ? (
                    <img src={selectedGif} alt="Notification GIF" />
                  ) : (
                    <div className="placeholder-gif">Выберите гифку</div>
                  )}
                </div>
                <div className="notification-preview-text">
                  <div className="notification-title-text" style={getTextStyle(titleTextStyle)}>
                    {formatPreviewText(titleTemplate, "Имя", editAmount)}
                  </div>
                  {messageTemplate && (
                    <div className="notification-message-text" style={getTextStyle(messageTextStyle)}>
                      {formatPreviewText(messageTemplate, "Имя", editAmount, "Сообщение")}
                    </div>
                  )}
                </div>
                <div className="notification-preview-info">
                  <div className="notification-preview-duration">Показ: {displayDuration} сек</div>
                  <div className="notification-preview-animation">
                    {getAnimationLabel(enterAnimation)} → {getAnimationLabel(exitAnimation)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Style Modal */}
        {isStyleModalOpen && (
          <div className="style-modal-overlay" onClick={() => setIsStyleModalOpen(false)}>
            <div className="style-modal" onClick={(e) => e.stopPropagation()}>
              <div className="style-modal-header">
                <h3>Стилизовать шрифт</h3>
                <button className="btn-close-modal" onClick={() => setIsStyleModalOpen(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="style-modal-content">
                <div className="setting-group">
                  <label className="setting-label">Шрифт</label>
                  <select
                    className="setting-select"
                    value={styleModalType === "title" ? titleTextStyle.fontFamily : messageTextStyle.fontFamily}
                    onChange={(e) => handleTextStyleChange(styleModalType, "fontFamily", e.target.value)}
                  >
                    <option value="Montserrat">Montserrat</option>
                    <option value="Rubik">Rubik</option>
                    <option value="Arial">Arial</option>
                    <option value="Roboto">Roboto</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Цвет текста</label>
                  <div className="color-picker">
                    <input
                      type="color"
                      value={styleModalType === "title" ? titleTextStyle.textColor : messageTextStyle.textColor}
                      onChange={(e) => handleTextStyleChange(styleModalType, "textColor", e.target.value)}
                    />
                    <input
                      type="text"
                      className="setting-input"
                      value={styleModalType === "title" ? titleTextStyle.textColor : messageTextStyle.textColor}
                      onChange={(e) => handleTextStyleChange(styleModalType, "textColor", e.target.value)}
                    />
                  </div>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Стиль текста</label>
                  <div className="style-buttons">
                    <button
                      className={`style-btn ${
                        (styleModalType === "title" ? titleTextStyle.isBold : messageTextStyle.isBold) ? "active" : ""
                      }`}
                      onClick={() =>
                        handleTextStyleChange(
                          styleModalType,
                          "isBold",
                          !(styleModalType === "title" ? titleTextStyle.isBold : messageTextStyle.isBold)
                        )
                      }
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      className={`style-btn ${
                        (styleModalType === "title" ? titleTextStyle.isItalic : messageTextStyle.isItalic) ? "active" : ""
                      }`}
                      onClick={() =>
                        handleTextStyleChange(
                          styleModalType,
                          "isItalic",
                          !(styleModalType === "title" ? titleTextStyle.isItalic : messageTextStyle.isItalic)
                        )
                      }
                    >
                      <em>I</em>
                    </button>
                    <button
                      className={`style-btn ${
                        (styleModalType === "title" ? titleTextStyle.isUnderline : messageTextStyle.isUnderline)
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleTextStyleChange(
                          styleModalType,
                          "isUnderline",
                          !(styleModalType === "title" ? titleTextStyle.isUnderline : messageTextStyle.isUnderline)
                        )
                      }
                    >
                      <u>U</u>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Трансформация</label>
                  <select
                    className="setting-select"
                    value={styleModalType === "title" ? titleTextStyle.transform : messageTextStyle.transform}
                    onChange={(e) => handleTextStyleChange(styleModalType, "transform", e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    Размер текста
                    <span className="setting-value">
                      {styleModalType === "title" ? titleTextStyle.fontSize : messageTextStyle.fontSize}px
                    </span>
                  </label>
                  <input
                    type="range"
                    className="setting-range"
                    min="12"
                    max="64"
                    value={styleModalType === "title" ? titleTextStyle.fontSize : messageTextStyle.fontSize}
                    onChange={(e) => handleTextStyleChange(styleModalType, "fontSize", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <button className="btn-save-style" onClick={() => setIsStyleModalOpen(false)}>
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Основной рендер списка
  return (
    <div className="notification-page">
      <div className="notification-page-header">
        <h1 className="notification-page-title">Уведомления</h1>
        <button className="add-notification-btn" onClick={() => setIsAddModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Добавить уведомление
        </button>
      </div>

      {/* Widget URL блок */}
      {widgetUrl && (
        <div className="widget-url-banner">
          <div className="widget-url-header">
            <div className="widget-url-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <h3 className="widget-url-title">Ссылка виджета для OBS</h3>
              <p className="widget-url-subtitle">Добавьте эту ссылку в OBS как Browser Source</p>
            </div>
          </div>
          <div className="widget-url-input-group">
            <input 
              type={isWidgetUrlVisible ? "text" : "password"} 
              value={widgetUrl} 
              readOnly 
              className="widget-url-input-field" 
            />
            <button
              className="widget-url-toggle-btn"
              onClick={() => setIsWidgetUrlVisible(!isWidgetUrlVisible)}
              title={isWidgetUrlVisible ? "Скрыть" : "Показать"}
            >
              {isWidgetUrlVisible ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            <button
              className={`widget-url-copy-btn ${copiedId === 'widgetUrl' ? 'copied' : ''}`}
              onClick={() => {
                navigator.clipboard.writeText(widgetUrl);
                setCopiedId('widgetUrl');
                setTimeout(() => setCopiedId(null), 2000);
              }}
            >
              {copiedId === 'widgetUrl' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Скопировано
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Копировать
                </>
              )}
            </button>
          </div>
          <p className="widget-url-hint">
            💡 Настройте уведомления ниже для разных сумм. Когда придёт донат, виджет автоматически покажет подходящее уведомление.
          </p>
        </div>
      )}

      <div className="notifications-container">
        {isLoading ? (
          <div className="empty-notifications-state">
            <p>Загрузка...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-notifications-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>У вас пока нет уведомлений</p>
            <button className="add-notification-btn-empty" onClick={() => setIsAddModalOpen(true)}>
              Создать первое уведомление
            </button>
          </div>
        ) : (
          <div className="notifications-grid">
            {notifications.map((notification) => (
              <div key={notification.id} className="notification-card">
                <div className="notification-card-header">
                  <div className="notification-card-info">
                    <h3 className="notification-card-title">{notification.name}</h3>
                    <p className="notification-card-amount">От {notification.minAmount} ₸</p>
                  </div>
                  <div className="notification-card-actions">
                    <label className="notification-toggle">
                      <input
                        type="checkbox"
                        checked={notification.isEnabled}
                        onChange={() => handleToggleNotification(notification.id)}
                      />
                      <span className="notification-toggle-slider"></span>
                    </label>
                    <button
                      className="notification-action-btn"
                      onClick={() => handleCustomizeNotification(notification)}
                      title="Редактировать"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="notification-action-btn delete"
                      onClick={() => handleDeleteNotification(notification.id)}
                      title="Удалить"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="notification-card-body">
                  <div className="notification-info-row">
                    <span className="notification-info-label">Статус:</span>
                    <span className={`notification-status ${notification.isEnabled ? "active" : "inactive"}`}>
                      {notification.isEnabled ? "Включено" : "Выключено"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Добавить уведомление</h2>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Название</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: Донат 500₸"
                  value={newNotifName}
                  onChange={(e) => setNewNotifName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Сумма (₸)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="500"
                  value={newNotifAmount}
                  onChange={(e) => setNewNotifAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => setIsAddModalOpen(false)}>
                Отмена
              </button>
              <button className="modal-btn modal-btn-save" onClick={handleAddNotification}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
