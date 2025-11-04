import React, { useState } from 'react';
import './TermsPrivacyPage.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

interface TermsPrivacyPageProps {
  onBack: () => void;
  onNavigateToSection?: (sectionId: string) => void;
}

const TermsPrivacyPage: React.FC<TermsPrivacyPageProps> = ({ onBack, onNavigateToSection }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <>
      <Header onLoginClick={() => {}} onPricingClick={() => {}} onHomeClick={onBack} isAuthPage={true} onNavigateToSection={onNavigateToSection} />
      <div className="terms-privacy-page">
        <div className="terms-privacy-container">
          <div className="terms-privacy-header">
            <h1>Условия использования и Политика конфиденциальности</h1>
            <div className="terms-tabs">
              <button
                className={`tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
                onClick={() => setActiveTab('terms')}
              >
                Условия использования
              </button>
              <button
                className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                Политика конфиденциальности
              </button>
            </div>
          </div>

          <div className="terms-privacy-content">
            {activeTab === 'terms' ? (
              <div className="terms-section">
                <h2>Условия использования</h2>

                <h3>1. Общие положения</h3>
                <p>
                  Настоящие Условия использования (далее — "Условия") регулируют порядок использования платформы DonatKZ и всех ее функций. Используя приложение, вы принимаете все положения данных Условий.
                </p>

                <h3>2. Описание услуги</h3>
                <p>
                  DonatKZ предоставляет платформу для приема донатов от зрителей напрямую через платежную систему Kaspi с автоматическим отображением уведомлений на экране во время трансляции.
                </p>

                <h3>3. Права пользователя</h3>
                <p>
                  Пользователь имеет право:
                </p>
                <ul>
                  <li>Использовать приложение в соответствии с его функционалом</li>
                  <li>Создавать учетную запись и управлять своим профилем</li>
                  <li>Получать поддержку через доступные каналы связи</li>
                  <li>Удалить свою учетную запись в любой момент</li>
                </ul>

                <h3>4. Обязанности пользователя</h3>
                <p>
                  Пользователь обязуется:
                </p>
                <ul>
                  <li>Предоставлять корректную информацию при регистрации</li>
                  <li>Не использовать приложение в незаконных целях</li>
                  <li>Не передавать доступ к своей учетной записи третьим лицам</li>
                  <li>Соблюдать законодательство Казахстана</li>
                </ul>

                <h3>5. Ограничение ответственности</h3>
                <p>
                  DonatKZ не несет ответственность за технические сбои третьих сторон (Kaspi, платформы трансляций и т.д.), прямые и косвенные убытки, возникшие в результате использования или невозможности использования сервиса.
                </p>

                <h3>6. Изменение Условий</h3>
                <p>
                  DonatKZ имеет право изменять настоящие Условия в любой момент. Изменения вступают в силу с момента их публикации. Продолжение использования сервиса означает принятие новых Условий.
                </p>
              </div>
            ) : (
              <div className="privacy-section">
                <h2>Политика конфиденциальности</h2>

                <h3>1. Сбор информации</h3>
                <p>
                  При использовании DonatKZ мы собираем следующую информацию:
                </p>
                <ul>
                  <li>Личные данные, предоставленные при регистрации (логин, email, ссылка на канал)</li>
                  <li>Данные о транзакциях через Kaspi</li>
                  <li>Технические данные о использовании приложения</li>
                </ul>

                <h3>2. Использование информации</h3>
                <p>
                  Мы используем собранную информацию для:
                </p>
                <ul>
                  <li>Предоставления услуг и функционала платформы</li>
                  <li>Улучшения качества сервиса</li>
                  <li>Связи с пользователем</li>
                  <li>Соблюдения законодательных требований</li>
                </ul>

                <h3>3. Защита данных</h3>
                <p>
                  DonatKZ предпринимает все необходимые меры для защиты ваших данных, включая:
                </p>
                <ul>
                  <li>Использование шифрования для передачи данных</li>
                  <li>Ограничение доступа к личной информации</li>
                  <li>Регулярные проверки безопасности</li>
                </ul>

                <h3>4. Передача данных третьим лицам</h3>
                <p>
                  Мы не передаем вашу личную информацию третьим лицам без вашего согласия, кроме случаев, требуемых законом. Данные могут быть переданы платежной системе Kaspi для обработки платежей.
                </p>

                <h3>5. Cookies</h3>
                <p>
                  DonatKZ использует cookies для улучшения опыта использования. Вы можете контролировать использование cookies через настройки браузера.
                </p>

                <h3>6. Контакты</h3>
                <p>
                  По вопросам конфиденциальности обращайтесь на адрес: <a href="mailto:privacy@donatkz.com">privacy@donatkz.com</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer isAuthPage={true} onHomeClick={onBack} onNavigateToSection={onNavigateToSection} />
    </>
  );
};

export default TermsPrivacyPage;