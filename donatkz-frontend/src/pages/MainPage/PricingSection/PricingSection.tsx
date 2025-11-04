import React, { useState } from 'react';
import './PricingSection.css';
import freeTrialImg from '../../../assets/images/free_trial.png';
import basicImg from '../../../assets/images/basic.png';
import premiumImg from '../../../assets/images/premium.png';

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  image: string;
  features: string[];
}

interface PricingSectionProps {
  onAuthRequired?: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onAuthRequired }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'FREE TRIAL',
      monthlyPrice: 0,
      yearlyPrice: 0,
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
      ]
    },
    {
      id: 'basic',
      name: 'BASIC',
      monthlyPrice: 4999,
      yearlyPrice: 49999,
      description: 'ТАРИФ "BASIC"',
      image: basicImg,
      features: [
        'Автоуведомления о донатах',
        'Менять гифки, музыку и время показа',
        'Помощь в установке'
      ]
    },
    {
      id: 'premium',
      name: 'PREMIUM',
      monthlyPrice: 9999,
      yearlyPrice: 99999,
      description: 'ТАРИФ "PREMIUM"',
      image: premiumImg,
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
      ]
    }
  ];

  const handleBuyClick = (planId: string) => {
    setShowAuthModal(true);
  };

  const handleCloseModal = () => {
    setShowAuthModal(false);
  };

  const handleGoToLogin = () => {
    if (onAuthRequired) {
      onAuthRequired();
    }
    setShowAuthModal(false);
  };

  const price = (plan: PricingPlan) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const period = billingPeriod === 'monthly' ? '/ мес' : '/ год';

  return (
    <>
      <section className="pricing-section" id="pricing">
        <div className="pricing-container">
          <div className="pricing-header">
            <h2 className="pricing-title">Тарифы</h2>

            <div className="billing-toggle">
              <button
                className={`billing-toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingPeriod('monthly')}
              >
                НА МЕСЯЦ
              </button>
              <button
                className={`billing-toggle-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingPeriod('yearly')}
              >
                НА ГОД
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {plans.map((plan) => (
              <div key={plan.id} className="pricing-card">
                <div className="pricing-header-card">
                  <div className="pricing-logo">
                    <img src={plan.image} alt={plan.name} />
                  </div>
                  <p className="pricing-name">{plan.description}</p>
                </div>

                <div className="pricing-price">
                  <span className="price-value">
                    {plan.monthlyPrice === 0 && plan.yearlyPrice === 0 ? '0' : formatPrice(price(plan))}
                  </span>
                  <span className="price-currency">₸</span>
                  <span className="price-period">
                    {plan.monthlyPrice === 0 && plan.yearlyPrice === 0 ? '/ 3 дня' : period}
                  </span>
                </div>

                <button
                  className="pricing-cta"
                  onClick={() => handleBuyClick(plan.id)}
                >
                  ПРИОБРЕСТИ
                </button>

                <div className="pricing-features">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="pricing-feature">
                      <span className="pricing-check">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showAuthModal && (
        <div className="auth-modal-backdrop" onClick={handleCloseModal}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 className="modal-title">НЕОБХОДИМО АВТОРИЗОВАТЬСЯ</h2>
            <button className="modal-login-btn" onClick={handleGoToLogin}>
              ВОЙТИ
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PricingSection;