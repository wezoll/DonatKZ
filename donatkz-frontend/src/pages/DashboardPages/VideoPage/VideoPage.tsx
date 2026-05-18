import React, { useState } from 'react';
import './VideoPage.css';

// ==================== TYPES ====================

interface VideoSettings {
    isEnabled: boolean;
    minAmount: number;       // Минимальная сумма доната для видео
    maxDuration: number;     // Максимальная длительность видео (секунды)
    allowYoutube: boolean;
    allowTwitch: boolean;
    allowTiktok: boolean;
    moderationEnabled: boolean;  // Модерация перед показом
    volume: number;              // Громкость 0-100
    widgetWidth: number;         // Размер виджета
    widgetHeight: number;
}

// ==================== INITIAL DATA ====================

const DEFAULT_SETTINGS: VideoSettings = {
    isEnabled: true,
    minAmount: 1000,
    maxDuration: 60,
    allowYoutube: true,
    allowTwitch: true,
    allowTiktok: false,
    moderationEnabled: true,
    volume: 50,
    widgetWidth: 640,
    widgetHeight: 360,
};

// ==================== COMPONENT ====================

const VideoPage: React.FC = () => {
    const [settings, setSettings] = useState<VideoSettings>(DEFAULT_SETTINGS);
    const [showUrl, setShowUrl] = useState(false);
    const [copied, setCopied] = useState(false);

    const widgetUrl = 'https://donatkz.kz/widgets/video/abc123def';

    const updateSetting = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(widgetUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Duration presets
    const durationPresets = [15, 30, 60, 120, 180, 300];
    const formatDuration = (s: number) => {
        if (s < 60) return `${s} сек`;
        const m = Math.floor(s / 60);
        const rem = s % 60;
        return rem > 0 ? `${m} мин ${rem} сек` : `${m} мин`;
    };

    return (
        <div className="video-page">
            {/* Header */}
            <div className="video-page-header">
                <div>
                    <h1 className="video-page-title">Видео-донаты</h1>
                    <p className="video-page-subtitle">
                        Донатеры смогут отправить ссылку на видео, которое отобразится на стриме
                    </p>
                </div>
            </div>

            {/* Main settings card */}
            <div className="video-settings-container">

                {/* Enable/Disable */}
                <div className="video-card">
                    <div className="video-card-header">
                        <div className="video-card-info">
                            <h3 className="video-card-title">Видео-донаты</h3>
                            <p className="video-card-description">
                                Разрешить донатерам отправлять видео вместе с донатом
                            </p>
                        </div>
                        <label className="notification-toggle">
                            <input
                                type="checkbox"
                                checked={settings.isEnabled}
                                onChange={() => updateSetting('isEnabled', !settings.isEnabled)}
                            />
                            <span className="notification-toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Amount settings */}
                <div className="video-card">
                    <h3 className="video-card-title">Минимальная сумма</h3>
                    <p className="video-card-description">
                        Донатеры смогут отправить видео только если сумма доната от указанной
                    </p>

                    <div className="video-amount-grid">
                        {[500, 1000, 2000, 5000, 10000].map(amount => (
                            <button
                                key={amount}
                                className={`video-preset-btn ${settings.minAmount === amount ? 'active' : ''}`}
                                onClick={() => updateSetting('minAmount', amount)}
                            >
                                {amount.toLocaleString()} ₸
                            </button>
                        ))}
                    </div>

                    <div className="video-custom-amount">
                        <label className="form-label">Или укажите свою сумму (₸)</label>
                        <input
                            type="number"
                            className="form-input"
                            min={100}
                            value={settings.minAmount}
                            onChange={e => updateSetting('minAmount', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                {/* Duration settings */}
                <div className="video-card">
                    <h3 className="video-card-title">Максимальная длительность</h3>
                    <p className="video-card-description">
                        Видео длиннее указанного лимита будет обрезано
                    </p>

                    <div className="video-amount-grid">
                        {durationPresets.map(d => (
                            <button
                                key={d}
                                className={`video-preset-btn ${settings.maxDuration === d ? 'active' : ''}`}
                                onClick={() => updateSetting('maxDuration', d)}
                            >
                                {formatDuration(d)}
                            </button>
                        ))}
                    </div>

                    <div className="video-custom-amount">
                        <label className="form-label">Длительность (сек)</label>
                        <div className="video-range-row">
                            <input
                                type="range"
                                className="setting-range"
                                min={5}
                                max={600}
                                step={5}
                                value={settings.maxDuration}
                                onChange={e => updateSetting('maxDuration', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{formatDuration(settings.maxDuration)}</span>
                        </div>
                    </div>
                </div>

                {/* Allowed sources */}
                <div className="video-card">
                    <h3 className="video-card-title">Разрешённые источники</h3>
                    <p className="video-card-description">
                        Выберите, с каких платформ можно отправлять видео
                    </p>

                    <div className="video-sources-list">
                        <div className="video-source-item">
                            <div className="video-source-info">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF0000">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                                </svg>
                                <span>YouTube</span>
                            </div>
                            <label className="notification-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.allowYoutube}
                                    onChange={() => updateSetting('allowYoutube', !settings.allowYoutube)}
                                />
                                <span className="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div className="video-source-item">
                            <div className="video-source-info">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#9146FF">
                                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                                </svg>
                                <span>Twitch</span>
                            </div>
                            <label className="notification-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.allowTwitch}
                                    onChange={() => updateSetting('allowTwitch', !settings.allowTwitch)}
                                />
                                <span className="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div className="video-source-item">
                            <div className="video-source-info">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                </svg>
                                <span>TikTok</span>
                            </div>
                            <label className="notification-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.allowTiktok}
                                    onChange={() => updateSetting('allowTiktok', !settings.allowTiktok)}
                                />
                                <span className="notification-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Moderation & Volume */}
                <div className="video-card">
                    <h3 className="video-card-title">Дополнительные настройки</h3>

                    <div className="video-settings-rows">
                        <div className="video-setting-row">
                            <div className="video-setting-info">
                                <span className="video-setting-label">Модерация</span>
                                <span className="video-setting-hint">Видео будет сначала показано вам для одобрения</span>
                            </div>
                            <label className="notification-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.moderationEnabled}
                                    onChange={() => updateSetting('moderationEnabled', !settings.moderationEnabled)}
                                />
                                <span className="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div className="video-setting-row">
                            <div className="video-setting-info">
                                <span className="video-setting-label">Громкость</span>
                                <span className="setting-value">{settings.volume}%</span>
                            </div>
                            <div className="video-range-full">
                                <input
                                    type="range"
                                    className="setting-range"
                                    min={0}
                                    max={100}
                                    value={settings.volume}
                                    onChange={e => updateSetting('volume', parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="video-setting-row">
                            <div className="video-setting-info">
                                <span className="video-setting-label">Размер виджета</span>
                            </div>
                            <div className="video-size-inputs">
                                <div className="video-size-field">
                                    <label className="form-label-sm">Ширина</label>
                                    <input
                                        type="number"
                                        className="form-input form-input-sm"
                                        value={settings.widgetWidth}
                                        onChange={e => updateSetting('widgetWidth', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <span className="video-size-x">×</span>
                                <div className="video-size-field">
                                    <label className="form-label-sm">Высота</label>
                                    <input
                                        type="number"
                                        className="form-input form-input-sm"
                                        value={settings.widgetHeight}
                                        onChange={e => updateSetting('widgetHeight', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Widget link */}
                <div className="video-card">
                    <h3 className="video-card-title">Ссылка виджета</h3>
                    <p className="video-card-description">
                        Добавьте эту ссылку как источник Browser Source в OBS
                    </p>

                    <button className="btn-toggle-url" onClick={() => setShowUrl(!showUrl)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {showUrl ? (
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            ) : (
                                <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </>
                            )}
                        </svg>
                        {showUrl ? 'Скрыть ссылку' : 'Показать ссылку виджета'}
                    </button>

                    {showUrl && (
                        <div className="widget-url-container">
                            <input
                                type="text"
                                value={widgetUrl}
                                readOnly
                                className="widget-url-input"
                            />
                            <button
                                className={`widget-copy-btn ${copied ? 'copied' : ''}`}
                                onClick={handleCopyUrl}
                            >
                                {copied ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default VideoPage;
