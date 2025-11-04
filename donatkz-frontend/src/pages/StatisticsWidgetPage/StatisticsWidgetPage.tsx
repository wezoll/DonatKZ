import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './StatisticsWidgetPage.css';
import { statisticsApi, type StatisticsWidget, type TextStyle, type BackgroundStyle } from '../../api/statistics.api';

const StatisticsWidgetPage: React.FC = () => {
  const { apiKey, id } = useParams<{ apiKey: string; id: string }>();
  const widgetId = id ? parseInt(id) : null;
  
  const [widget, setWidget] = useState<StatisticsWidget | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Загрузка виджета и донатов
  useEffect(() => {
    if (!apiKey || !widgetId) {
      setError('API Key or Widget ID is missing');
      return;
    }

    const loadWidget = () => {
      statisticsApi.getWidgetForDisplay(apiKey, widgetId)
        .then((data) => {
          setWidget(data);
          setError(null);
          
          // Загружаем донаты через публичный endpoint
          return statisticsApi.getDonationsForWidgetDisplay(apiKey, widgetId);
        })
        .then((donationData) => {
          const mapped = donationData.map((d) => ({
            name: d.senderName,
            amount: d.amount,
            message: d.message || '',
          }));
          setDonations(mapped);
        })
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.error('Failed to load widget:', err);
          }
          setError('Failed to load widget');
        });
    };

    loadWidget();

    // Обновлять каждые 30 секунд
    const interval = setInterval(loadWidget, 30000);

    return () => clearInterval(interval);
  }, [apiKey, widgetId]);

  // Слайдер - автоматическая смена слайдов
  useEffect(() => {
    if (widget?.displayType === 'slider' && donations.length > 0) {
      const speed = widget.widgetSpeed || 80;
      const duration = 5000 * (100 / speed);
      const interval = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % donations.length);
      }, duration);
      return () => clearInterval(interval);
    }
  }, [widget?.displayType, widget?.widgetSpeed, donations.length]);

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

  const formatAmount = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  if (error) {
    return (
      <div className="statistics-widget-error">
        {error}
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="statistics-widget-loading">
        Загрузка виджета...
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="statistics-widget-empty">
        Нет данных для отображения
      </div>
    );
  }

  const headerBg = parseBackgroundStyle(widget.headerBackground);
  const itemBg = parseBackgroundStyle(widget.itemBackground);

  // СПИСОК
  if (widget.displayType === 'list') {
    return (
      <div className={`statistics-widget-container position-${widget.position}`}>
        <div className="statistics-widget-list">
          {widget.headerText && (
            <div 
              className="widget-header-text" 
              style={{
                ...getTextStyle(widget.mainTextStyle),
                ...getBackgroundStyle(widget.headerBackground),
                padding: headerBg.enabled ? '16px 20px' : '0',
                borderRadius: headerBg.enabled ? '12px' : '0',
              }}
            >
              {widget.headerText}
            </div>
          )}
          {donations.map((d, i) => (
            <div 
              key={i} 
              className="widget-list-item"
              style={{
                ...getBackgroundStyle(widget.itemBackground),
                padding: itemBg.enabled ? '16px 20px' : '8px 0',
                borderRadius: itemBg.enabled ? '12px' : '0',
                marginBottom: '12px',
              }}
            >
              <div style={getTextStyle(widget.mainTextStyle)}>
                {widget.template
                  .replace('{username}', d.name)
                  .replace('{amount}', `${formatAmount(d.amount)} ₸`)
                  .replace('{message}', d.message)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // СЛАЙДЕР
  if (widget.displayType === 'slider') {
    const currentDonation = donations[currentSlideIndex % donations.length];
    
    return (
      <div className={`statistics-widget-container position-${widget.position}`}>
        <div className="statistics-widget-slider">
          {widget.headerText && (
            <div 
              className="widget-header-text" 
              style={{
                ...getTextStyle(widget.mainTextStyle),
                ...getBackgroundStyle(widget.headerBackground),
                padding: headerBg.enabled ? '16px 20px' : '0',
                borderRadius: headerBg.enabled ? '12px' : '0',
                marginBottom: '12px',
              }}
            >
              {widget.headerText}
            </div>
          )}
          <div 
            className="widget-slider-item fade-in"
            style={{
              ...getBackgroundStyle(widget.itemBackground),
              padding: itemBg.enabled ? '16px 20px' : '8px 0',
              borderRadius: itemBg.enabled ? '12px' : '0',
            }}
          >
            <div style={getTextStyle(widget.mainTextStyle)}>
              {widget.template
                .replace('{username}', currentDonation.name)
                .replace('{amount}', `${formatAmount(currentDonation.amount)} ₸`)
                .replace('{message}', currentDonation.message)}
            </div>
            {widget.secondTemplate && (
              <div style={{
                ...getTextStyle(widget.secondaryTextStyle),
                marginTop: '8px',
                opacity: 0.8,
              }}>
                {widget.secondTemplate
                  .replace('{username}', currentDonation.name)
                  .replace('{amount}', `${formatAmount(currentDonation.amount)} ₸`)
                  .replace('{message}', currentDonation.message)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // БЕГУЩАЯ СТРОКА
  if (widget.displayType === 'ticker') {
    const speed = widget.widgetSpeed || 80;
    
    return (
      <div className={`statistics-widget-container position-${widget.position}`}>
        <div className="statistics-widget-ticker">
          {widget.headerText && (
            <div 
              className="widget-header-text" 
              style={{
                ...getTextStyle(widget.mainTextStyle),
                ...getBackgroundStyle(widget.headerBackground),
                padding: headerBg.enabled ? '16px 20px' : '0',
                borderRadius: headerBg.enabled ? '12px' : '0',
                marginBottom: '12px',
              }}
            >
              {widget.headerText}
            </div>
          )}
          <div 
            className="widget-ticker-container"
            style={{
              ...getBackgroundStyle(widget.itemBackground),
              padding: itemBg.enabled ? '16px 0' : '8px 0',
              borderRadius: itemBg.enabled ? '12px' : '0',
              overflow: 'hidden',
            }}
          >
            <div 
              className="widget-ticker-content"
              style={{
                ...getTextStyle(widget.mainTextStyle),
                animationDuration: `${150 / speed}s`,
              }}
            >
              {donations.map((d, i) => (
                <span key={i} className="ticker-item">
                  {widget.template
                    .replace('{username}', d.name)
                    .replace('{amount}', `${formatAmount(d.amount)} ₸`)
                    .replace('{message}', d.message)} •{' '}
                </span>
              ))}
              {donations.map((d, i) => (
                <span key={`dup-${i}`} className="ticker-item">
                  {widget.template
                    .replace('{username}', d.name)
                    .replace('{amount}', `${formatAmount(d.amount)} ₸`)
                    .replace('{message}', d.message)} •{' '}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StatisticsWidgetPage;

