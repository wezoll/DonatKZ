import React, { useState, useEffect } from 'react';
import './NewsPage.css';

interface NewsItem {
  id: number;
  type: 'update' | 'announcement' | 'feature';
  badge?: string;
  title: string;
  description: string;
  timestamp: string;
  icon: 'star' | 'megaphone' | 'news';
}

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([
    {
      id: 1,
      type: 'feature',
      badge: 'Последнее обновление',
      title: 'Новая функция: Рулетка донатов! 🎰',
      description: 'Теперь вы можете создать интерактивную рулетку для ваших зрителей. Настройте призы, шансы выигрыша и увеличьте вовлечённость аудитории!',
      timestamp: '3 часа назад',
      icon: 'star',
    },
    {
      id: 2,
      type: 'update',
      title: 'Обновление: Улучшенная озвучка сообщений',
      description: 'Мы добавили новые голоса для TTS и улучшили качество озвучки. Теперь сообщения донаторов звучат ещё естественнее!',
      timestamp: '1 день назад',
      icon: 'megaphone',
    },
    {
      id: 3,
      type: 'announcement',
      title: 'Новый тарифный план: Premium Plus',
      description: 'Представляем расширенный тарифный план с неограниченным количеством донатов, приоритетной поддержкой и эксклюзивными функциями.',
      timestamp: '3 дня назад',
      icon: 'news',
    },
    {
      id: 4,
      type: 'update',
      title: 'Улучшения в статистике',
      description: 'Добавлены новые графики и метрики для более детального анализа ваших донатов. Отслеживайте динамику по часам, дням и месяцам.',
      timestamp: '5 дней назад',
      icon: 'megaphone',
    },
    {
      id: 5,
      type: 'feature',
      title: 'Интеграция с YouTube',
      description: 'Теперь DonatKZ поддерживает прямую интеграцию с YouTube! Принимайте донаты во время стримов на YouTube без дополнительных настроек.',
      timestamp: '1 неделя назад',
      icon: 'star',
    },
    {
      id: 6,
      type: 'announcement',
      title: 'Техническое обслуживание 15 ноября',
      description: 'Планируется кратковременное техническое обслуживание серверов. Ожидаемое время простоя: 30 минут. Приносим извинения за неудобства.',
      timestamp: '2 недели назад',
      icon: 'news',
    },
  ]);

  const getIconSvg = (icon: 'star' | 'megaphone' | 'news') => {
    switch (icon) {
      case 'star':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case 'megaphone':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11v3a1 1 0 0 0 1 1h2.586a1 1 0 0 0 .707-.293l2.414-2.414a1 1 0 0 1 .707-.293h3.172a1 1 0 0 1 .707.293l2.414 2.414A1 1 0 0 0 16.414 15H19a1 1 0 0 0 1-1v-3" />
            <path d="M12 3v18" />
            <circle cx="12" cy="9" r="3" />
          </svg>
        );
      case 'news':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M7 7h10M7 11h10M7 15h10" />
          </svg>
        );
    }
  };

  return (
    <div className="news-page">
      {/* Заголовок страницы */}
      <div className="news-header">
        <div className="news-header-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M7 7h10M7 11h10M7 15h7" />
          </svg>
        </div>
        <div className="news-header-text">
          <h1 className="news-header-title">Новости DonatKZ</h1>
          <p className="news-header-subtitle">
            Следите за обновлениями, новыми функциями и специальными предложениями
          </p>
        </div>
      </div>

      {/* Последняя новость (выделенная) */}
      {news.length > 0 && news[0].badge && (
        <div className="featured-news">
          <div className="featured-news-badge">{news[0].badge}</div>
          <div className="featured-news-icon">
            {getIconSvg(news[0].icon)}
          </div>
          <h2 className="featured-news-title">{news[0].title}</h2>
          <p className="featured-news-description">{news[0].description}</p>
          <div className="featured-news-footer">
            <div className="featured-news-time">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {news[0].timestamp}
            </div>
            <button className="featured-news-btn">
              Подробнее
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Все новости */}
      <div className="all-news-section">
        <h2 className="all-news-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M7 7h10M7 11h10M7 15h10" />
          </svg>
          Все новости
        </h2>

        <div className="news-list">
          {news.slice(1).map((item) => (
            <div key={item.id} className="news-card">
              <div className="news-card-icon-wrapper">
                <div className={`news-card-icon news-card-icon-${item.type}`}>
                  {getIconSvg(item.icon)}
                </div>
              </div>

              <div className="news-card-content">
                <div className="news-card-header">
                  <span className={`news-card-type news-card-type-${item.type}`}>
                    {item.type === 'update' ? 'Обновление' : 
                     item.type === 'feature' ? 'Новая функция' : 
                     'Объявление'}
                  </span>
                  <button className="news-card-read-btn">
                    Читать
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <h3 className="news-card-title">{item.title}</h3>
                <p className="news-card-description">{item.description}</p>

                <div className="news-card-time">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {item.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsPage;