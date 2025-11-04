import React, { useState, useEffect } from 'react';
import './ReviewsSection.css';

interface Review {
  id: number;
  text: string;
  author: string;
  role: string;
  avatar: string;
}

const ReviewsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const reviews: Review[] = [
        {
            id: 1,
            text: 'Отличный сервис для стримеров! Все настраивается легко и быстро. Донаты приходят моментально, а уведомления выглядят профессионально.',
            author: 'Бекзат Мубарак',
            role: 'Стример, Twitch',
            avatar: 'https://i.pravatar.cc/150?img=12'
        },
        {
            id: 2,
            text: 'Использую DonatKZ уже полгода. Очень доволен функционалом и поддержкой. Особенно нравится возможность кастомизации виджетов.',
            author: 'Адиль Саматов',
            role: 'Контент-криейтор, YouTube',
            avatar: 'https://i.pravatar.cc/400?img=68'
        },
        {
            id: 3,
            text: 'Лучшая платформа для приема донатов в Казахстане! Удобный интерфейс, быстрые выплаты и отзывчивая поддержка.',
            author: 'Жаркын Исмагулов',
            role: 'Геймер, Twitch',
            avatar: 'https://i.pravatar.cc/150?img=33'
        },
        {
            id: 4,
            text: 'Рекомендую всем стримерам! Простая интеграция с OBS, много настроек и красивые алерты. Зрители в восторге.',
            author: 'Алдияр Байдилда',
            role: 'Стример, YouTube',
            avatar: 'https://i.pravatar.cc/400?img=54'
        },
        {
            id: 5,
            text: 'Перешел с другого сервиса и не пожалел. DonatKZ работает стабильно, комиссии адекватные, а функций больше чем у конкурентов.',
            author: 'Акжол Егинбай',
            role: 'Стример, Twitch',
            avatar: 'https://i.pravatar.cc/150?img=15'
        }
    ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, reviews.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-container">
        <h2 className="reviews-title">Наши пользователи</h2>

        <div className="reviews-swiper">
          <button className="swiper-nav swiper-prev" onClick={prevSlide}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="reviews-slider">
            <div 
              className="reviews-track"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-quote">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path d="M10 20C10 13.3726 15.3726 8 22 8V12C17.5817 12 14 15.5817 14 20H18V28H10V20Z" fill="#88b702" opacity="0.3"/>
                      <path d="M24 20C24 13.3726 29.3726 8 36 8V12C31.5817 12 28 15.5817 28 20H32V28H24V20Z" fill="#88b702" opacity="0.3"/>
                    </svg>
                  </div>
                  <p className="review-text">{review.text}</p>
                  <div className="review-author">
                    <img src={review.avatar} alt={review.author} className="author-avatar" />
                    <div className="author-info">
                      <h4 className="author-name">{review.author}</h4>
                      <p className="author-role">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="swiper-nav swiper-next" onClick={nextSlide}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="swiper-pagination">
          {reviews.map((_, index) => (
            <button
              key={index}
              className={`pagination-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Перейти к отзыву ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;