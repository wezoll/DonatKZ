import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import { useAuth } from '../../../context/AuthContext';
import { settingsApi } from '../../../api/settings.api';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface VoiceSettings {
  enabled: boolean;
  voice: string;
  volume: number;
  minAmount: number;
}

interface ModerationSettings {
  autoFilter: boolean;
  bannedWords: string[];
}

type SettingsTab = 'profile' | 'voice' | 'moderation' | 'security';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form states
  const [email, setEmail] = useState<string>('');
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [voice, setVoice] = useState<VoiceSettings>({
    enabled: false,
    voice: 'robot',
    volume: 80,
    minAmount: 500,
  });

  const [moderation, setModeration] = useState<ModerationSettings>({
    autoFilter: false,
    bannedWords: [],
  });

  const [widgetApiKey, setWidgetApiKey] = useState<string>('');
  const [isWidgetKeyVisible, setIsWidgetKeyVisible] = useState(false);
  const [desktopApiKey, setDesktopApiKey] = useState<string>('');
  const [isDesktopKeyVisible, setIsDesktopKeyVisible] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load all settings on mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      // Load user profile
      if (user) {
        setEmail(user.email);
      }

      // Load voice settings
      const voiceData = await settingsApi.getVoiceSettings();
      setVoice({
        enabled: voiceData.voiceEnabled,
        voice: voiceData.voiceType,
        volume: voiceData.voiceVolume,
        minAmount: Number(voiceData.voiceMinAmount),
      });

      // Load moderation settings
      const moderationData = await settingsApi.getModerationSettings();
      setModeration({
        autoFilter: moderationData.moderationEnabled,
        bannedWords: moderationData.bannedWords,
      });

      // Load widget API key
      const widgetData = await settingsApi.getWidgetApiKey();
      setWidgetApiKey(widgetData.apiKey);

    } catch (error) {
      console.error('Failed to load settings:', error);
      setSubmitStatus({
        success: false,
        message: 'Не удалось загрузить настройки',
      });
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Профиль', icon: 'user' },
    { id: 'voice' as SettingsTab, label: 'Озвучка', icon: 'volume' },
    { id: 'moderation' as SettingsTab, label: 'Модерация', icon: 'shield' },
    { id: 'security' as SettingsTab, label: 'Безопасность', icon: 'lock' },
  ];

  const voiceOptions = [
    { value: 'robot', label: 'Робот' },
    { value: 'female', label: 'Женский' },
    { value: 'male', label: 'Мужской' },
  ];

  const getTabIcon = (icon: string) => {
    switch (icon) {
      case 'user':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'volume':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        );
      case 'shield':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case 'lock':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const generateWidgetApiKey = async () => {
    try {
      setIsSubmitting(true);
      const response = await settingsApi.regenerateWidgetApiKey();
      setWidgetApiKey(response.apiKey);
      setIsWidgetKeyVisible(true);
      setSubmitStatus({
        success: true,
        message: 'Widget API ключ успешно обновлен',
      });
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch (error: any) {
      console.error('Failed to regenerate widget API key:', error);
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || 'Не удалось обновить Widget API ключ',
      });
      setTimeout(() => setSubmitStatus(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleWidgetKeyVisibility = () => {
    setIsWidgetKeyVisible(!isWidgetKeyVisible);
  };

  const generateDesktopApiKey = async () => {
    try {
      setIsSubmitting(true);
      const response = await settingsApi.generateDesktopApiKey();
      setDesktopApiKey(response.code);
      setIsDesktopKeyVisible(true);
      setSubmitStatus({
        success: true,
        message: 'Desktop API ключ успешно сгенерирован',
      });
      setTimeout(() => setSubmitStatus(null), 3000);

      // Auto-check status every 2 seconds
      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await settingsApi.checkDesktopCodeStatus(response.code);
          if (statusResponse.isPaired) {
            clearInterval(checkInterval);
            setSubmitStatus({
              success: true,
              message: 'Устройство успешно привязано!',
            });
            setTimeout(() => {
              setDesktopApiKey('');
              setIsDesktopKeyVisible(false);
              setSubmitStatus(null);
            }, 3000);
          }
        } catch (error) {
          console.error('Failed to check code status:', error);
        }
      }, 2000);

      // Stop checking after 5 minutes
      setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Failed to generate desktop API key:', error);
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || 'Не удалось сгенерировать Desktop API ключ',
      });
      setTimeout(() => setSubmitStatus(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSubmitStatus({
      success: true,
      message: `${label} скопирован в буфер обмена`,
    });
    setTimeout(() => setSubmitStatus(null), 2000);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSubmitStatus({
        success: false,
        message: 'Пароли не совпадают',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await settingsApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setSubmitStatus({
        success: true,
        message: 'Пароль успешно изменён',
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || 'Не удалось изменить пароль',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  const handleVoiceToggle = () => {
    setVoice((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const handleVoiceChange = (field: keyof VoiceSettings, value: any) => {
    setVoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModerationToggle = () => {
    setModeration((prev) => ({
      ...prev,
      autoFilter: !prev.autoFilter,
    }));
  };

  const handleAddWord = () => {
    if (newWord.trim() && !moderation.bannedWords.includes(newWord.trim())) {
      setModeration((prev) => ({
        ...prev,
        bannedWords: [...prev.bannedWords, newWord.trim()],
      }));
      setNewWord('');
    }
  };

  const handleRemoveWord = (word: string) => {
    setModeration((prev) => ({
      ...prev,
      bannedWords: prev.bannedWords.filter((w) => w !== word),
    }));
  };

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      if (activeTab === 'profile') {
        // Save email
        await settingsApi.updateEmail(email);
      } else if (activeTab === 'voice') {
        // Save voice settings
        await settingsApi.updateVoiceSettings({
          voiceEnabled: voice.enabled,
          voiceMinAmount: voice.minAmount,
          voiceLanguage: 'ru-RU', // TODO: Make this configurable
          voiceType: voice.voice,
          voiceVolume: voice.volume,
        });
      } else if (activeTab === 'moderation') {
        // Save moderation settings
        await settingsApi.updateModerationSettings({
          moderationEnabled: moderation.autoFilter,
          bannedWords: moderation.bannedWords,
        });
      }

      setSubmitStatus({
        success: true,
        message: 'Настройки успешно сохранены',
      });
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || 'Не удалось сохранить настройки',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  return (
    <div className="settings-page">
      {/* Tabs Navigation */}
      <div className="settings-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {getTabIcon(tab.icon)}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h2 className="settings-section-title">Настройки профиля</h2>
            <p className="settings-section-subtitle">
              Управление основной информацией вашего аккаунта
            </p>

            <div className="form-group">
              <label className="form-label">Имя пользователя</label>
              <input
                type="text"
                value={user?.username || ''}
                className="form-input"
                disabled
              />
              <p className="form-hint">Логин нельзя изменить</p>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Введите email"
              />
            </div>

            <button onClick={handleSaveSettings} className="save-button" disabled={isSubmitting}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && (
          <div className="settings-section">
            <h2 className="settings-section-title">Озвучка донатов</h2>
            <p className="settings-section-subtitle">
              Автоматическое озвучивание сообщений донатов
            </p>

            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <h3 className="setting-title">Включить озвучку</h3>
                  <p className="setting-description">Автоматическое озвучивание сообщений донатов</p>
                </div>
                <button
                  className={`toggle-button ${voice.enabled ? 'active' : ''}`}
                  onClick={handleVoiceToggle}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>
            </div>

            {voice.enabled && (
              <>
                <div className="settings-divider"></div>

                <div className="form-group">
                  <label className="form-label">Голос озвучки</label>
                  <select
                    value={voice.voice}
                    onChange={(e) => handleVoiceChange('voice', e.target.value)}
                    className="form-select"
                  >
                    {voiceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">Выберите голос для озвучивания сообщений</p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Громкость озвучки <span className="value-badge">{voice.volume}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voice.volume}
                    onChange={(e) => handleVoiceChange('volume', parseInt(e.target.value))}
                    className="form-range"
                    style={{
                      background: `linear-gradient(to right, #88b702 0%, #88b702 ${voice.volume}%, #252525 ${voice.volume}%, #252525 100%)`
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Минимальная сумма для озвучки (₸)</label>
                  <input
                    type="number"
                    value={voice.minAmount}
                    onChange={(e) => handleVoiceChange('minAmount', parseInt(e.target.value))}
                    className="form-input"
                    min="0"
                  />
                  <p className="form-hint">Донаты ниже этой суммы не будут озвучиваться</p>
                </div>
              </>
            )}

            <button onClick={handleSaveSettings} className="save-button" disabled={isSubmitting}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {isSubmitting ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="settings-section">
            <h2 className="settings-section-title">Модерация сообщений</h2>
            <p className="settings-section-subtitle">
              Управление цензурой и фильтрацией сообщений донатов
            </p>

            <div className="moderation-card">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="setting-title">Автоматическая фильтрация</h3>
                    <p className="setting-description">
                      Слова из списка будут автоматически заменены на *** в сообщениях донатов
                    </p>
                  </div>
                </div>
                <button
                  className={`toggle-button ${moderation.autoFilter ? 'active' : ''}`}
                  onClick={handleModerationToggle}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>
            </div>

            <div className="settings-divider"></div>

            <h3 className="subsection-title">Добавить слово или фразу</h3>
            <div className="word-input-group">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                placeholder="Введите слово или фразу..."
                className="form-input"
              />
              <button onClick={handleAddWord} className="add-word-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Добавить
              </button>
            </div>

            <div className="banned-words-list">
              <div className="list-header">
                <h4 className="list-title">Список запрещённых слов</h4>
                <span className="word-count">{moderation.bannedWords.length} слов</span>
              </div>

              {moderation.bannedWords.length === 0 ? (
                <div className="empty-state">
                  <p>Список пуст. Добавьте слова для фильтрации.</p>
                </div>
              ) : (
                <div className="words-grid">
                  {moderation.bannedWords.map((word) => (
                    <div key={word} className="word-tag">
                      <span>{word}</span>
                      <button
                        onClick={() => handleRemoveWord(word)}
                        className="remove-word-button"
                        aria-label="Удалить"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSaveSettings} className="save-button" disabled={isSubmitting}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {isSubmitting ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h2 className="settings-section-title">Безопасность</h2>
            <p className="settings-section-subtitle">
              Управление паролем и API ключом для подключения
            </p>

            {submitStatus && (
              <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
                {submitStatus.message}
              </div>
            )}

            {/* API Keys Section */}
            <div className="api-keys-container">
              {/* Widget API Key */}
              <div className="api-key-section">
                <h3 className="subsection-title">Widget API ключ</h3>
                <p className="form-hint" style={{ marginBottom: '16px' }}>
                  32-символьный ключ для использования в ссылках виджетов доната. Вы можете изменить его в любое время.
                </p>

                <div className="api-key-display">
                  <div className="api-key-value widget-key">
                    {isWidgetKeyVisible 
                      ? widgetApiKey 
                      : widgetApiKey.replace(/./g, '•')}
                  </div>
                  <div className="api-key-actions">
                    <button 
                      onClick={toggleWidgetKeyVisibility} 
                      className="visibility-button"
                      title={isWidgetKeyVisible ? 'Скрыть ключ' : 'Показать ключ'}
                    >
                      {isWidgetKeyVisible ? (
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
                      onClick={() => copyToClipboard(widgetApiKey, 'Widget API ключ')} 
                      className="copy-button"
                      disabled={!isWidgetKeyVisible}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Копировать
                    </button>
                    <button 
                      onClick={generateWidgetApiKey} 
                      className="regenerate-button"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                      Обновить
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-divider"></div>

              {/* Desktop API Key */}
              <div className="api-key-section">
                <h3 className="subsection-title">Desktop API ключ</h3>
                <p className="form-hint" style={{ marginBottom: '16px' }}>
                  Одноразовый 6-значный код для подключения десктоп приложения к вашему аккаунту
                </p>

                {desktopApiKey && isDesktopKeyVisible ? (
                  <div className="api-key-display">
                    <div className="api-key-value desktop-key">{desktopApiKey}</div>
                    <div className="api-key-actions">
                      <button 
                        onClick={() => copyToClipboard(desktopApiKey, 'Desktop API ключ')} 
                        className="copy-button"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Копировать
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={generateDesktopApiKey} className="generate-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                    Сгенерировать код подключения
                  </button>
                )}
              </div>
            </div>

            <div className="settings-divider"></div>

            {/* Password Change Section */}
            <h3 className="subsection-title">Изменение пароля</h3>

            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  Новый пароль
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : 'Изменить пароль'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;