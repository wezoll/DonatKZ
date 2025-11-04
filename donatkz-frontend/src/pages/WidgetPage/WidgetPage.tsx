import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { websocketService, DonationWebSocketMessage } from '../../services/websocket.service';
import './WidgetPage.css';

/**
 * Страница виджета для OBS
 * Прозрачная страница которая показывает донаты в реальном времени
 */
const WidgetPage: React.FC = () => {
  const { apiKey } = useParams<{ apiKey: string }>();
  const [currentDonation, setCurrentDonation] = useState<DonationWebSocketMessage | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<DonationWebSocketMessage[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!apiKey) {
      if (import.meta.env.DEV) console.error('❌ API Key не указан в URL');
      return;
    }

    if (import.meta.env.DEV) {
      console.log('🎬 Widget initialized with API Key:', apiKey.substring(0, 8) + '...');
    }

    // Подключаемся к WebSocket
    websocketService.connect(
      apiKey,
      (donation) => {
        if (import.meta.env.DEV) {
          console.log('💰 Donation received in widget:', donation);
        }
        
        // Добавляем донат в очередь
        setQueue((prev) => [...prev, donation]);
      },
      (error) => {
        if (import.meta.env.DEV) {
          console.error('❌ WebSocket error:', error);
        }
      }
    );

    // Отключаемся при размонтировании
    return () => {
      websocketService.disconnect();
    };
  }, [apiKey]);

  // Обработка очереди донатов
  useEffect(() => {
    if (queue.length > 0 && !isPlaying) {
      const nextDonation = queue[0];
      playDonation(nextDonation);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, isPlaying]);

  const playDonation = (donation: DonationWebSocketMessage) => {
    if (!donation.notificationSettings) {
      console.warn('⚠️ No notification settings in donation, skipping');
      return;
    }

    setIsPlaying(true);
    setCurrentDonation(donation);

    const settings = donation.notificationSettings;

    // Воспроизводим звук с настройками громкости
    if (settings.soundUrl && audioRef.current) {
      audioRef.current.src = settings.soundUrl;
      audioRef.current.volume = settings.volume / 100;
      audioRef.current.play().catch((err) => {
        console.warn('⚠️ Failed to play sound:', err);
      });
    }

    // Скрываем через время из настроек
    const duration = settings.displayDuration || 7;
    setTimeout(() => {
      setIsPlaying(false);
      setCurrentDonation(null);
    }, duration * 1000);
  };

  // Форматировать текст по шаблону
  const formatText = (template: string, donation: DonationWebSocketMessage): string => {
    return template
      .replace('{username}', donation.senderName)
      .replace('{amount}', donation.formattedAmount)
      .replace('{message}', donation.message || '');
  };

  // Получить стили для текста
  const getTextStyle = (textStyle: any) => {
    if (!textStyle) return {};
    
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

  if (!apiKey) {
    return (
      <div className="widget-error">
        <p>❌ API Key не указан</p>
      </div>
    );
  }

  const settings = currentDonation?.notificationSettings;

  return (
    <div className="widget-container">
      {/* Звук уведомления (src устанавливается динамически в playDonation) */}
      <audio ref={audioRef} />

      {/* Отображение доната */}
      {isPlaying && currentDonation && settings && (
        <div className={`donation-alert ${isPlaying ? 'show' : ''}`}>
          <div className="donation-gif">
            <img src={settings.gifUrl} alt="Donation animation" />
          </div>
          
          <div className="donation-content">
            <div className="donation-title" style={getTextStyle(settings.titleText)}>
              {formatText(settings.titleTemplate, currentDonation)}
            </div>
            
            {settings.messageTemplate && (
              <div className="donation-message" style={getTextStyle(settings.messageText)}>
                {formatText(settings.messageTemplate, currentDonation)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetPage;

