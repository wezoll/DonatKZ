import React, { useState, useEffect } from 'react';
import './StatisticsPage.css';
import { statisticsApi, type StatisticsWidget, type Donation } from '../../../api/statistics.api';

// Используем StatisticsWidget напрямую из API
type Widget = StatisticsWidget;

interface BackgroundStyle {
  enabled: boolean;
  color: string;
  opacity: number;
}

interface TextStyle {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  transform: 'none' | 'uppercase' | 'lowercase';
  alignment: 'left' | 'center' | 'right';
}

const StatisticsPage: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'design'>('settings');
  const [isCreatingWidget, setIsCreatingWidget] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState<{ [key: string]: boolean }>({});
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [styleModalType, setStyleModalType] = useState<'main' | 'secondary'>('main');
  const [previewDonations, setPreviewDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка виджетов пользователя при монтировании
  useEffect(() => {
    loadWidgets();
  }, []);

  // Загрузка донатов для превью при изменении выбранного виджета
  useEffect(() => {
    if (selectedWidget) {
      loadPreviewDonations();
    }
  }, [selectedWidget?.period, selectedWidget?.dataType, selectedWidget?.elementsCount]);

  const loadWidgets = () => {
    setIsLoading(true);
    statisticsApi.getAllWidgets()
      .then((data) => {
        setWidgets(data);
      })
      .catch((error) => {
        console.error('Failed to load widgets:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loadPreviewDonations = () => {
    if (!selectedWidget) return;

    statisticsApi.getDonationsForWidget(
      selectedWidget.period,
      selectedWidget.dataType,
      selectedWidget.elementsCount
    )
      .then((donations) => {
        const mapped = donations.map((d) => ({
          name: d.senderName,
          amount: d.amount,
          message: d.message || '',
        }));
        setPreviewDonations(mapped);
      })
      .catch((error) => {
        console.error('Failed to load preview donations:', error);
        // Fallback к моковым данным
        setPreviewDonations([
          { name: 'Нурдаулет С.', amount: 503, message: 'Спасибо за стрим!' },
          { name: 'Алдияр Б.', amount: 639, message: 'Продолжай в том же духе' },
          { name: 'Бекзат М.', amount: 444, message: 'Крутой контент' },
          { name: 'Ерке С.', amount: 355, message: 'Держи на развитие' },
          { name: 'Алмас Ж.', amount: 246, message: 'Удачи!' },
        ]);
      });
  };

  const handleAddWidget = () => {
    const defaultMainText = JSON.stringify({
      fontFamily: 'Montserrat',
      fontSize: 18,
      textColor: '#FFFFFF',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      transform: 'none',
      alignment: 'center',
    });

    const defaultSecondaryText = JSON.stringify({
      fontFamily: 'Montserrat',
      fontSize: 14,
      textColor: '#CCCCCC',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      transform: 'none',
      alignment: 'center',
    });

    const defaultHeaderBg = JSON.stringify({
      enabled: false,
      color: '#1C1C1C',
      opacity: 90,
    });

    const defaultItemBg = JSON.stringify({
      enabled: true,
      color: '#1C1C1C',
      opacity: 90,
    });

    const newWidget: any = {
      id: Date.now(),
      title: 'Новый виджет',
      widgetUrl: '',
      // Settings (плоская структура)
      headerText: '',
      displayType: 'list',
      dataType: 'recent',
      period: 'all-time',
      elementsCount: 5,
      widgetSpeed: 80,
      template: '{username} - {amount}',
      secondTemplate: '{message}',
      // Design (плоская структура)
      position: 'center',
      mainTextStyle: defaultMainText,
      secondaryTextStyle: defaultSecondaryText,
      headerBackground: defaultHeaderBg,
      itemBackground: defaultItemBg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setWidgets([...widgets, newWidget]);
    setSelectedWidget(newWidget);
    setIsCreatingWidget(true);
  };

  const handleDeleteWidget = (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот виджет?')) return;

    statisticsApi.deleteWidget(id)
      .then(() => {
        setWidgets(widgets.filter((w) => w.id !== id));
        if (selectedWidget?.id === id) {
          setSelectedWidget(null);
          setIsCreatingWidget(false);
        }
      })
      .catch((error) => {
        console.error('Failed to delete widget:', error);
        alert('Не удалось удалить виджет');
      });
  };

  const handleSelectWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setIsCreatingWidget(true);
  };

  const handleBackToList = () => {
    if (!selectedWidget) {
      setIsCreatingWidget(false);
      return;
    }

    // Проверяем, это новый виджет (не сохранён на сервере) или существующий
    const isNewWidget = !widgets.find((w) => w.id === selectedWidget.id && w.widgetUrl);

    if (isNewWidget) {
      // Создаём новый виджет
      const createRequest = {
        title: selectedWidget.title,
        headerText: selectedWidget.headerText || '',
        displayType: selectedWidget.displayType,
        dataType: selectedWidget.dataType,
        period: selectedWidget.period,
        elementsCount: selectedWidget.elementsCount,
        widgetSpeed: selectedWidget.widgetSpeed || 80,
        template: selectedWidget.template,
        secondTemplate: selectedWidget.secondTemplate || '',
        position: selectedWidget.position,
        mainTextStyle: selectedWidget.mainTextStyle,
        secondaryTextStyle: selectedWidget.secondaryTextStyle,
        headerBackground: selectedWidget.headerBackground,
        itemBackground: selectedWidget.itemBackground,
      };

      statisticsApi.createWidget(createRequest)
        .then((createdWidget) => {
          setWidgets(widgets.map((w) => w.id === selectedWidget.id ? createdWidget : w));
          setIsCreatingWidget(false);
          setSelectedWidget(null);
        })
        .catch((error) => {
          console.error('Failed to create widget:', error);
          alert('Не удалось создать виджет');
        });
    } else {
      // Обновляем существующий виджет
      const updateRequest = {
        title: selectedWidget.title,
        headerText: selectedWidget.headerText,
        displayType: selectedWidget.displayType,
        dataType: selectedWidget.dataType,
        period: selectedWidget.period,
        elementsCount: selectedWidget.elementsCount,
        widgetSpeed: selectedWidget.widgetSpeed,
        template: selectedWidget.template,
        secondTemplate: selectedWidget.secondTemplate,
        position: selectedWidget.position,
        mainTextStyle: selectedWidget.mainTextStyle,
        secondaryTextStyle: selectedWidget.secondaryTextStyle,
        headerBackground: selectedWidget.headerBackground,
        itemBackground: selectedWidget.itemBackground,
      };

      statisticsApi.updateWidget(selectedWidget.id, updateRequest)
        .then((updatedWidget) => {
          const mappedWidget = {
            ...updatedWidget,
            url: updatedWidget.widgetUrl,
          };
          setWidgets(widgets.map((w) => w.id === selectedWidget.id ? mappedWidget : w));
          setIsCreatingWidget(false);
          setSelectedWidget(null);
        })
        .catch((error) => {
          console.error('Failed to update widget:', error);
          alert('Не удалось обновить виджет');
        });
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    if (!selectedWidget) return;

    const updatedWidget = {
      ...selectedWidget,
      [key]: value,
    };

    setSelectedWidget(updatedWidget);
    setWidgets(widgets.map((w) => (w.id === selectedWidget.id ? updatedWidget : w)));
  };

  const handleDesignChange = (key: string, value: any) => {
    if (!selectedWidget) return;

    const updatedWidget = {
      ...selectedWidget,
      [key]: value,
    };

    setSelectedWidget(updatedWidget);
    setWidgets(widgets.map((w) => (w.id === selectedWidget.id ? updatedWidget : w)));
  };

  const handleTextStyleChange = (type: 'main' | 'secondary', key: keyof TextStyle, value: any) => {
    if (!selectedWidget) return;

    const textKey = type === 'main' ? 'mainTextStyle' : 'secondaryTextStyle';
    const currentStyle = parseTextStyle(selectedWidget[textKey]);
    
    const updatedStyle = {
      ...currentStyle,
      [key]: value,
    };

    const updatedWidget = {
      ...selectedWidget,
      [textKey]: JSON.stringify(updatedStyle),
    };

    setSelectedWidget(updatedWidget);
    setWidgets(widgets.map((w) => (w.id === selectedWidget.id ? updatedWidget : w)));
  };

  const handleBackgroundChange = (type: 'header' | 'item', key: keyof BackgroundStyle, value: any) => {
    if (!selectedWidget) return;

    const bgKey = type === 'header' ? 'headerBackground' : 'itemBackground';
    const currentStyle = parseBackgroundStyle(selectedWidget[bgKey]);
    
    const updatedStyle = {
      ...currentStyle,
      [key]: value,
    };

    const updatedWidget = {
      ...selectedWidget,
      [bgKey]: JSON.stringify(updatedStyle),
    };

    setSelectedWidget(updatedWidget);
    setWidgets(widgets.map((w) => (w.id === selectedWidget.id ? updatedWidget : w)));
  };

  const handleCopyUrl = (url: string, widgetId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(widgetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShowUrl = (widgetId: string) => {
    setShowUrl(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

  const openStyleModal = (type: 'main' | 'secondary') => {
    setStyleModalType(type);
    setIsStyleModalOpen(true);
  };

  const parseTextStyle = (textStyleJson: string): TextStyle => {
    try {
      return JSON.parse(textStyleJson);
    } catch {
      return {
        fontFamily: 'Montserrat',
        fontSize: 18,
        textColor: '#FFFFFF',
        isBold: false,
        isItalic: false,
        isUnderline: false,
        transform: 'none',
        alignment: 'center',
      };
    }
  };

  const parseBackgroundStyle = (bgStyleJson: string): BackgroundStyle => {
    try {
      return JSON.parse(bgStyleJson);
    } catch {
      return {
        enabled: true,
        color: '#1C1C1C',
        opacity: 90,
      };
    }
  };

  const getTextStyle = (textStyleJson: string) => {
    const textStyle = parseTextStyle(textStyleJson);
    return {
      fontFamily: textStyle.fontFamily,
      fontSize: `${textStyle.fontSize}px`,
      color: textStyle.textColor,
      fontWeight: textStyle.isBold ? 'bold' : 'normal',
      fontStyle: textStyle.isItalic ? 'italic' : 'normal',
      textDecoration: textStyle.isUnderline ? 'underline' : 'none',
      textTransform: textStyle.transform as any,
      textAlign: textStyle.alignment as any,
    };
  };

  const getBackgroundStyle = (bgStyleJson: string) => {
    const bgStyle = parseBackgroundStyle(bgStyleJson);
    
    if (!bgStyle.enabled) {
      return {
        background: 'transparent',
        border: 'none',
      };
    }
    
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 28, g: 28, b: 28 };
    };
    
    const rgb = hexToRgb(bgStyle.color);
    
    return {
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgStyle.opacity / 100})`,
      border: '1px solid #88b702',
    };
  };

  const getPeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      'current-stream': 'Текущий стрим',
      'last-stream': 'Прошлый стрим',
      'all-time': 'Всё время',
      'today': 'Сегодня',
      'week': 'Неделя',
      'month': 'Месяц',
      'year': 'Год',
    };
    return labels[period] || period;
  };

  const getDataTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'recent': 'Последние донаты',
      'largest': 'Крупнейшие',
      'most': 'Наибольшие',
    };
    return labels[type] || type;
  };

  const formatAmount = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const renderListPreview = () => {
    const count = selectedWidget?.elementsCount || 5;
    const headerBg = selectedWidget ? parseBackgroundStyle(selectedWidget.headerBackground) : { enabled: false, color: '#1C1C1C', opacity: 90 };
    const itemBg = selectedWidget ? parseBackgroundStyle(selectedWidget.itemBackground) : { enabled: true, color: '#1C1C1C', opacity: 90 };
    
    return (
      <div className="preview-list">
        {selectedWidget?.headerText && (
          <div 
            className="preview-header-text" 
            style={{
              ...getTextStyle(selectedWidget.mainTextStyle),
              ...getBackgroundStyle(selectedWidget.headerBackground),
              padding: headerBg.enabled ? '16px 20px' : '0',
              borderRadius: headerBg.enabled ? '12px' : '0',
            }}
          >
            {selectedWidget.headerText}
          </div>
        )}
        {previewDonations.slice(0, count).map((d, i) => (
          <div 
            key={i} 
            className="preview-list-item"
            style={{
              ...getBackgroundStyle(selectedWidget!.itemBackground),
              padding: itemBg.enabled ? '16px 20px' : '8px 0',
              borderRadius: itemBg.enabled ? '12px' : '0',
            }}
          >
            <div style={getTextStyle(selectedWidget!.mainTextStyle)}>
              {selectedWidget?.template
                .replace('{username}', d.name)
                .replace('{amount}', `${formatAmount(d.amount)} ₸`)
                .replace('{message}', d.message)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  React.useEffect(() => {
    if (selectedWidget?.displayType === 'slider') {
      const speed = selectedWidget.widgetSpeed || 80;
      const duration = 5000 * (100 / speed);
      const interval = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % (selectedWidget.elementsCount || 5));
      }, duration);
      return () => clearInterval(interval);
    }
  }, [selectedWidget?.displayType, selectedWidget?.widgetSpeed, selectedWidget?.elementsCount]);

  const renderSliderPreview = () => {
    const count = selectedWidget?.elementsCount || 5;
    const currentDonation = previewDonations[currentSlideIndex % Math.min(count, previewDonations.length)];
    const headerBg = selectedWidget ? parseBackgroundStyle(selectedWidget.headerBackground) : { enabled: false, color: '#1C1C1C', opacity: 90 };
    const itemBg = selectedWidget ? parseBackgroundStyle(selectedWidget.itemBackground) : { enabled: true, color: '#1C1C1C', opacity: 90 };
    
    return (
      <div className="preview-slider">
        {selectedWidget?.headerText && (
          <div 
            className="preview-header-text" 
            style={{
              ...getTextStyle(selectedWidget.mainTextStyle),
              ...getBackgroundStyle(selectedWidget.headerBackground),
              padding: headerBg.enabled ? '16px 20px' : '0',
              borderRadius: headerBg.enabled ? '12px' : '0',
            }}
          >
            {selectedWidget.headerText}
          </div>
        )}
        <div 
          className="preview-slider-item fade-in"
          style={{
            ...getBackgroundStyle(selectedWidget!.itemBackground),
            padding: itemBg.enabled ? '16px 20px' : '8px 0',
            borderRadius: itemBg.enabled ? '12px' : '0',
          }}
        >
          <div style={getTextStyle(selectedWidget!.mainTextStyle)}>
            {selectedWidget?.template
              .replace('{username}', currentDonation.name)
              .replace('{amount}', `${formatAmount(currentDonation.amount)} ₸`)
              .replace('{message}', currentDonation.message)}
          </div>
          {selectedWidget?.secondTemplate && (
            <div style={getTextStyle(selectedWidget!.secondaryTextStyle)} className="preview-secondary">
              {selectedWidget.secondTemplate
                .replace('{username}', currentDonation.name)
                .replace('{amount}', `${formatAmount(currentDonation.amount)} ₸`)
                .replace('{message}', currentDonation.message)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTickerPreview = () => {
    const speed = selectedWidget?.widgetSpeed || 80;
    const count = selectedWidget?.elementsCount || 5;
    const displayDonations = previewDonations.slice(0, count);
    const headerBg = selectedWidget ? parseBackgroundStyle(selectedWidget.headerBackground) : { enabled: false, color: '#1C1C1C', opacity: 90 };
    const itemBg = selectedWidget ? parseBackgroundStyle(selectedWidget.itemBackground) : { enabled: true, color: '#1C1C1C', opacity: 90 };
    
    return (
      <div className="preview-ticker">
        {selectedWidget?.headerText && (
          <div 
            className="preview-header-text" 
            style={{
              ...getTextStyle(selectedWidget.mainTextStyle),
              ...getBackgroundStyle(selectedWidget.headerBackground),
              padding: headerBg.enabled ? '16px 20px' : '0',
              borderRadius: headerBg.enabled ? '12px' : '0',
            }}
          >
            {selectedWidget.headerText}
          </div>
        )}
        <div 
          className="preview-ticker-container"
          style={{
            ...getBackgroundStyle(selectedWidget!.itemBackground),
            padding: selectedWidget!.itemBackground.enabled ? '16px 0' : '8px 0',
            borderRadius: selectedWidget!.itemBackground.enabled ? '12px' : '0',
          }}
        >
          <div 
            className="preview-ticker-content"
            style={{
              ...getTextStyle(selectedWidget!.mainText),
              animationDuration: `${150 / speed}s`,
            }}
          >
            {displayDonations.map((d, i) => (
              <span key={i} className="ticker-item">
                {selectedWidget?.template
                  .replace('{username}', d.name)
                  .replace('{amount}', `${formatAmount(d.amount)} ₸`)
                  .replace('{message}', d.message)} •{' '}
              </span>
            ))}
            {displayDonations.map((d, i) => (
              <span key={`dup-${i}`} className="ticker-item">
                {selectedWidget?.template
                  .replace('{username}', d.name)
                  .replace('{amount}', `${formatAmount(d.amount)} ₸`)
                  .replace('{message}', d.message)} •{' '}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isCreatingWidget) {
    return (
      <div className="statistics-page">
        <div className="statistics-container">
          <div className="statistics-header">
            <h2 className="section-title">Мои виджеты</h2>
            <button className="btn-add-widget" onClick={handleAddWidget}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Добавить виджет
            </button>
          </div>

          {widgets.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <h3>У вас пока нет виджетов</h3>
              <p>Создайте первый виджет для отображения донатов на стриме</p>
            </div>
          ) : (
            <div className="widgets-grid">
              {widgets.map((widget) => (
                <div key={widget.id} className="widget-card">
                  <div className="widget-card-header">
                    <h3 className="widget-card-title">{widget.title}</h3>
                    <div className="widget-card-actions">
                      <button
                        className="widget-action-btn"
                        onClick={() => handleSelectWidget(widget)}
                        title="Редактировать"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="widget-action-btn delete"
                        onClick={() => handleDeleteWidget(widget.id)}
                        title="Удалить"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="widget-card-body">
                    <div className="widget-info-row">
                      <span className="widget-info-label">Тип:</span>
                      <span className="widget-info-value">
                        {widget.displayType === 'list' ? 'Список' :
                         widget.displayType === 'slider' ? 'Слайдер' : 'Бегущая строка'}
                      </span>
                    </div>
                    <div className="widget-info-row">
                      <span className="widget-info-label">Период:</span>
                      <span className="widget-info-value">{getPeriodLabel(widget.period)}</span>
                    </div>

                    <button 
                      className="btn-toggle-url"
                      onClick={() => toggleShowUrl(widget.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {showUrl[widget.id] ? (
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                      {showUrl[widget.id] ? 'Скрыть ссылку' : 'Показать ссылку'}
                    </button>

                    {showUrl[widget.id] && (
                      <div className="widget-url-container">
                        <input
                          type="text"
                          value={widget.widgetUrl}
                          readOnly
                          className="widget-url-input"
                        />
                        <button
                          className={`widget-copy-btn ${copiedId === widget.id ? 'copied' : ''}`}
                          onClick={() => handleCopyUrl(widget.widgetUrl, widget.id)}
                        >
                          {copiedId === widget.id ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="widget-editor-layout">
        <div className="editor-sidebar">
          <button className="btn-back" onClick={handleBackToList}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Назад
          </button>

          <div className="editor-tabs">
            <button
              className={`editor-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              НАСТРОЙКИ
            </button>
            <button
              className={`editor-tab ${activeTab === 'design' ? 'active' : ''}`}
              onClick={() => setActiveTab('design')}
            >
              ДИЗАЙН
            </button>
          </div>

          <div className="editor-content">
            {activeTab === 'settings' && (
              <div className="settings-panel">
                <div className="setting-group">
                  <label className="setting-label">Название</label>
                  <input
                    type="text"
                    className="setting-input"
                    value={selectedWidget?.name || ''}
                    onChange={(e) => handleSettingChange('name', e.target.value)}
                    placeholder="Донаты за всё время"
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">Текст над виджетом (необязательно)</label>
                  <input
                    type="text"
                    className="setting-input"
                    value={selectedWidget?.headerText || ''}
                    onChange={(e) => handleSettingChange('headerText', e.target.value)}
                    placeholder="ТОП СТРИМА"
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">Тип данных</label>
                  <select
                    className="setting-select"
                    value={selectedWidget?.dataType || 'recent'}
                    onChange={(e) => handleSettingChange('dataType', e.target.value)}
                  >
                    <option value="recent">Последние донаты</option>
                    <option value="largest">Крупнейшие</option>
                    <option value="most">Наибольшие</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Период</label>
                  <select
                    className="setting-select"
                    value={selectedWidget?.period || 'all-time'}
                    onChange={(e) => handleSettingChange('period', e.target.value)}
                  >
                    <option value="current-stream">Текущий стрим</option>
                    <option value="last-stream">Прошлый стрим</option>
                    <option value="all-time">Всё время</option>
                    <option value="today">Сегодня</option>
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                    <option value="year">Год</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    Количество элементов
                    <span className="setting-value">{selectedWidget?.elementsCount || 5}</span>
                  </label>
                  <input
                    type="range"
                    className="setting-range"
                    min="1"
                    max="20"
                    value={selectedWidget?.elementsCount || 5}
                    onChange={(e) => handleSettingChange('elementsCount', parseInt(e.target.value))}
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">Способ отображения</label>
                  <select
                    className="setting-select"
                    value={selectedWidget?.displayType || 'list'}
                    onChange={(e) => handleSettingChange('displayType', e.target.value)}
                  >
                    <option value="list">Список</option>
                    <option value="slider">Слайдер</option>
                    <option value="ticker">Бегущая строка</option>
                  </select>
                </div>

                {(selectedWidget?.displayType === 'ticker' || 
                  selectedWidget?.displayType === 'slider') && (
                  <div className="setting-group">
                    <label className="setting-label">
                      Скорость виджета
                      <span className="setting-value">{selectedWidget?.widgetSpeed || 80}%</span>
                    </label>
                    <input
                      type="range"
                      className="setting-range"
                      min="10"
                      max="200"
                      value={selectedWidget?.widgetSpeed || 80}
                      onChange={(e) => handleSettingChange('widgetSpeed', parseInt(e.target.value))}
                    />
                  </div>
                )}

                <div className="setting-group">
                  <label className="setting-label">Шаблон строки</label>
                  <input
                    type="text"
                    className="setting-input code"
                    value={selectedWidget?.template || ''}
                    onChange={(e) => handleSettingChange('template', e.target.value)}
                    placeholder="{username} - {amount}"
                  />
                  <div className="setting-hint">
                    Доступные теги: {'{username}'}, {'{amount}'}, {'{message}'}
                  </div>
                </div>

                {selectedWidget?.displayType === 'slider' && (
                  <div className="setting-group">
                    <label className="setting-label">Шаблон второй строки</label>
                    <input
                      type="text"
                      className="setting-input code"
                      value={selectedWidget?.secondTemplate || ''}
                      onChange={(e) => handleSettingChange('secondTemplate', e.target.value)}
                      placeholder="{message}"
                    />
                    <div className="setting-hint">
                      Доступные теги: {'{username}'}, {'{amount}'}, {'{message}'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'design' && (
              <div className="design-panel">
                <div className="setting-group">
                  <label className="setting-label">Вертикальное положение</label>
                  <select
                    className="setting-select"
                    value={selectedWidget?.position || 'center'}
                    onChange={(e) => handleDesignChange('position', e.target.value)}
                  >
                    <option value="top">Вверху</option>
                    <option value="center">В центре</option>
                    <option value="bottom">Внизу</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Основной текст</label>
                  <button 
                    className="btn-style-editor"
                    onClick={() => openStyleModal('main')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                    </svg>
                    Стилизовать шрифт
                  </button>
                </div>

                {selectedWidget?.displayType === 'slider' && (
                  <div className="setting-group">
                    <label className="setting-label">Доп. текст</label>
                    <button 
                      className="btn-style-editor"
                      onClick={() => openStyleModal('secondary')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                      </svg>
                      Стилизовать шрифт
                    </button>
                  </div>
                )}

                {selectedWidget?.headerText && (
                  <>
                    <div className="setting-divider">Фон заголовка</div>
                    
                    <div className="setting-group">
                      <label className="setting-label checkbox-label">
                        <input
                          type="checkbox"
                          checked={parseBackgroundStyle(selectedWidget.headerBackground).enabled}
                          onChange={(e) => handleBackgroundChange('header', 'enabled', e.target.checked)}
                          className="setting-checkbox"
                        />
                        <span>Включить фон заголовка</span>
                      </label>
                    </div>

                    {selectedWidget.headerBackground.enabled && (
                      <>
                        <div className="setting-group">
                          <label className="setting-label">Цвет фона</label>
                          <div className="color-picker">
                            <input
                              type="color"
                              value={parseBackgroundStyle(selectedWidget.headerBackground).color}
                              onChange={(e) => handleBackgroundChange('header', 'color', e.target.value)}
                            />
                            <input
                              type="text"
                              className="setting-input"
                              value={parseBackgroundStyle(selectedWidget.headerBackground).color}
                              onChange={(e) => handleBackgroundChange('header', 'color', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="setting-group">
                          <label className="setting-label">
                            Прозрачность фона
                            <span className="setting-value">{selectedWidget.headerBackground.opacity}%</span>
                          </label>
                          <input
                            type="range"
                            className="setting-range"
                            min="0"
                            max="100"
                            value={parseBackgroundStyle(selectedWidget.headerBackground).opacity}
                            onChange={(e) => handleBackgroundChange('header', 'opacity', parseInt(e.target.value))}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="setting-divider">Фон элементов</div>

                <div className="setting-group">
                  <label className="setting-label checkbox-label">
                    <input
                      type="checkbox"
                      checked={parseBackgroundStyle(selectedWidget?.itemBackground).enabled}
                      onChange={(e) => handleBackgroundChange('item', 'enabled', e.target.checked)}
                      className="setting-checkbox"
                    />
                    <span>Включить фон элементов</span>
                  </label>
                </div>

                {selectedWidget?.itemBackground.enabled && (
                  <>
                    <div className="setting-group">
                      <label className="setting-label">Цвет фона</label>
                      <div className="color-picker">
                        <input
                          type="color"
                          value={parseBackgroundStyle(selectedWidget.itemBackground).color}
                          onChange={(e) => handleBackgroundChange('item', 'color', e.target.value)}
                        />
                        <input
                          type="text"
                          className="setting-input"
                          value={parseBackgroundStyle(selectedWidget.itemBackground).color}
                          onChange={(e) => handleBackgroundChange('item', 'color', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="setting-group">
                      <label className="setting-label">
                        Прозрачность фона
                        <span className="setting-value">{selectedWidget.itemBackground.opacity}%</span>
                      </label>
                      <input
                        type="range"
                        className="setting-range"
                        min="0"
                        max="100"
                        value={parseBackgroundStyle(selectedWidget.itemBackground).opacity}
                        onChange={(e) => handleBackgroundChange('item', 'opacity', parseInt(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button className="btn-create-widget" onClick={handleBackToList}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Создать виджет
          </button>
        </div>

        <div className="editor-preview">
          <div className="preview-header">
            <h3 className="preview-title">Виджет: {selectedWidget?.title || 'Новый виджет'}</h3>
          </div>
          <div 
            className={`preview-area position-${selectedWidget?.position}`}
          >
            {selectedWidget?.displayType === 'list' && renderListPreview()}
            {selectedWidget?.displayType === 'slider' && renderSliderPreview()}
            {selectedWidget?.displayType === 'ticker' && renderTickerPreview()}
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
                  value={parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).fontFamily}
                  onChange={(e) => handleTextStyleChange(styleModalType, 'fontFamily', e.target.value)}
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
                    value={parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).textColor}
                    onChange={(e) => handleTextStyleChange(styleModalType, 'textColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="setting-input"
                    value={parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).textColor}
                    onChange={(e) => handleTextStyleChange(styleModalType, 'textColor', e.target.value)}
                  />
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Стиль текста</label>
                <div className="style-buttons">
                  <button
                    className={`style-btn ${parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).isBold ? 'active' : ''}`}
                    onClick={() => handleTextStyleChange(
                      styleModalType, 
                      'isBold', 
                      !parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).isBold
                    )}
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    className={`style-btn ${parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).isItalic ? 'active' : ''}`}
                    onClick={() => handleTextStyleChange(
                      styleModalType,
                      'isItalic',
                      !parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).isItalic
                    )}
                  >
                    <em>I</em>
                  </button>
                  <button
                    className={`style-btn ${parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).isUnderline ? 'active' : ''}`}
                    onClick={() => handleTextStyleChange(
                      styleModalType,
                      'isUnderline',
                      !parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).isUnderline
                    )}
                  >
                    <u>U</u>
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Трансформация</label>
                <select
                  className="setting-select"
                  value={parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).transform}
                  onChange={(e) => handleTextStyleChange(styleModalType, 'transform', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="uppercase">Uppercase</option>
                  <option value="lowercase">Lowercase</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">Горизонт. выравнивание</label>
                <select
                  className="setting-select"
                  value={parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).alignment}
                  onChange={(e) => handleTextStyleChange(styleModalType, 'alignment', e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  Размер текста
                  <span className="setting-value">
                    {parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).fontSize}px
                  </span>
                </label>
                <input
                  type="range"
                  className="setting-range"
                  min="12"
                  max="48"
                  value={parseTextStyle(selectedWidget?.[styleModalType === 'main' ? 'mainTextStyle' : 'secondaryTextStyle']).fontSize}
                  onChange={(e) => handleTextStyleChange(styleModalType, 'fontSize', parseInt(e.target.value))}
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
};

export default StatisticsPage;