import React, { useState, useEffect, useRef } from 'react';
import './TariffPage.css';
import { useAuth } from '../../../context/AuthContext';
import freeTrialImg from '../../../assets/images/free_trial.png';
import basicImg from '../../../assets/images/basic.png';
import premiumImg from '../../../assets/images/premium.png';

interface TariffPlan {
  id: string;
  name: string;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  duration: string;
  description: string;
  image: string;
  features: string[];
  isActive?: boolean;
  badge?: string;
}

interface UserTariff {
  planId: string;
  startDate: string;
  endDate: string;
  billingPeriod: 'monthly' | 'yearly';
  daysUsed: number;
  totalDays: number;
}

interface TariffPageProps {
  onNavigateToPayment?: (planId: string) => void;
}

const TariffPage: React.FC<TariffPageProps> = ({ onNavigateToPayment }) => {
  const { user } = useAuth();
  const [userTariff, setUserTariff] = useState<UserTariff>({
    planId: 'free',
    startDate: '01.11.2025',
    endDate: '03.11.2025',
    billingPeriod: 'monthly',
    daysUsed: 1,
    totalDays: 3,
  });

  const tariffsRef = useRef<HTMLDivElement>(null);

  // Загрузить данные тарифа из профиля пользователя
  useEffect(() => {
    if (user) {
      const tier = user.subscriptionTier || 'FREE';
      const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
      
      // Вычислить даты и дни
      const now = new Date();
      const startDate = user.createdAt ? new Date(user.createdAt) : now;
      const endDate = expiresAt || new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // По умолчанию 3 дня
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      setUserTariff({
        planId: tier.toLowerCase(),
        startDate: startDate.toLocaleDateString('ru-RU'),
        endDate: endDate.toLocaleDateString('ru-RU'),
        billingPeriod: 'monthly',
        daysUsed: Math.max(1, daysUsed),
        totalDays: Math.max(1, totalDays),
      });
    }
  }, [user]);

  const plans: TariffPlan[] = [
    {
      id: 'free',
      name: 'FREE TRIAL',
      displayName: 'FREE TRIAL',
      monthlyPrice: 0,
      yearlyPrice: 0,
      duration: 'ПРОБНЫЙ ПЕРИОД',
      description: 'ПРОБНЫЙ ПЕРИОД',
      image: freeTrialImg,
      features: [
        'Доступны все функции',
        'Менять гифки, музыку и время показа',
        'Цензура в сообщениях вкл/выкл',
        'Автообновление статистики',
        'Кастомная статистика',
        'Заказ музыки/видео (автопоказ)',
        'Рулетка с заданиями',
        'Прогресс-бар (цель сбора)',
        'Озвучивание доната',
        'Хоткей',
        'Личная страница'
      ],
      isActive: true,
    },
    {
      id: 'basic',
      name: 'BASIC',
      displayName: 'BASIC',
      monthlyPrice: 4999,
      yearlyPrice: 49999,
      duration: '1 МЕСЯЦ',
      description: 'ТАРИФ "BASIC"',
      image: basicImg,
      features: [
        'Автоуведомления о донатах',
        'Менять гифки, музыку и время показа',
        'Помощь в установке'
      ],
    },
    {
      id: 'premium',
      name: 'PREMIUM',
      displayName: 'PREMIUM',
      monthlyPrice: 9999,
      yearlyPrice: 99999,
      duration: '1 МЕСЯЦ',
      description: 'ТАРИФ "PREMIUM"',
      image: premiumImg,
      badge: 'BEST',
      features: [
        'Доступны все функции',
        'Менять гифки, музыку и время показа',
        'Цензура в сообщениях вкл/выкл',
        'Автообновление статистики',
        'Кастомная статистика',
        'Заказ музыки/видео (автопоказ)',
        'Рулетка с заданиями',
        'Прогресс-бар (цель сбора)',
        'Озвучивание доната',
        'Хоткей',
        'Личная страница'
      ],
    },
  ];

  const currentPlan = plans.find((plan) => plan.id === userTariff.planId);
  const daysRemaining = userTariff.totalDays - userTariff.daysUsed;
  const progressPercentage = ((userTariff.daysUsed / userTariff.totalDays) * 100).toFixed(0);

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getPriceDisplay = () => {
    if (!currentPlan) return '';
    if (currentPlan.monthlyPrice === 0) return '0 ₸ / 3 дня';
    
    const price = userTariff.billingPeriod === 'monthly' 
      ? currentPlan.monthlyPrice 
      : currentPlan.yearlyPrice;
    const period = userTariff.billingPeriod === 'monthly' ? '/ мес' : '/ год';
    
    return `${formatPrice(price)} ₸ ${period}`;
  };

  const scrollToTariffs = () => {
    tariffsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectPlan = (planId: string) => {
    if (onNavigateToPayment) {
      onNavigateToPayment(planId);
    }
  };

  const handleExtendPlan = () => {
    if (onNavigateToPayment && currentPlan) {
      onNavigateToPayment(currentPlan.id);
    }
  };

  return (
    <div className="tariff-page">
      {/* Активный тариф */}
      <div className="active-tariff-section">
        <h2 className="section-title">Активный тариф</h2>
        <div className="active-tariff-card">
          <div className="tariff-info">
            <h3 className="tariff-name">{currentPlan?.displayName}</h3>
            <p className="tariff-price">{getPriceDisplay()}</p>
          </div>

          <div className="tariff-dates">
            <div className="date-box">
              <span className="date-label">Дата начала</span>
              <span className="date-value">{userTariff.startDate}</span>
            </div>
            <div className="date-box">
              <span className="date-label">Дата окончания</span>
              <span className="date-value">{userTariff.endDate}</span>
            </div>
          </div>

          <div className="tariff-remaining">
            <span className="remaining-label">Осталось</span>
            <span className="remaining-value">{daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}</span>
          </div>

          <div className="tariff-progress-bar">
            <div 
              className="tariff-progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="tariff-actions">
            <button className="tariff-btn tariff-btn-extend" onClick={handleExtendPlan}>
              ПРОДЛИТЬ
            </button>
            <button className="tariff-btn tariff-btn-change" onClick={scrollToTariffs}>
              ИЗМЕНИТЬ
            </button>
          </div>
        </div>
      </div>

      {/* Все доступные тарифы */}
      <div className="all-tariffs-section" ref={tariffsRef}>
        <h2 className="section-title">Доступные тарифы</h2>
        <div className="tariff-cards-grid">
          {plans.map((plan) => (
            <div key={plan.id} className={`tariff-plan-card ${plan.isActive ? 'active-plan' : ''}`}>
              {plan.isActive && (
                <div className="active-badge">Текущий тариф</div>
              )}
              
              <div className="plan-image-wrapper">
                <img src={plan.image} alt={plan.name} className="plan-image" />
              </div>
              
              <div className="plan-header">
                <h3 className="plan-name-small">{plan.displayName}</h3>
                <div className="plan-price">
                  <span className="price-amount">₸{formatPrice(plan.monthlyPrice)}</span>
                </div>
                <p className="plan-duration">{plan.duration}</p>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index} className="plan-feature">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                className={`plan-select-btn ${plan.isActive ? 'active-plan-btn' : ''}`}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={plan.isActive}
              >
                {plan.isActive ? 'Активен' : 'Выбрать план'}
                {!plan.isActive && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TariffPage;