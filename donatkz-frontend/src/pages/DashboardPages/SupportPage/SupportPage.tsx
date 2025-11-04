import React, { useState } from 'react';
import './SupportPage.css';
import { TELEGRAM_API_URL, TELEGRAM_CHAT_ID, isTelegramConfigured } from './telegramConfig.tsx';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface ContactInfo {
  id: string;
  label: string;
  value: string;
  icon: 'email' | 'support' | 'telegram';
  link: string;
}

const SupportPage: React.FC = () => {
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const contacts: ContactInfo[] = [
    {
      id: 'telegram',
      label: 'Telegram',
      value: '@donatkz_support',
      icon: 'telegram',
      link: 'https://t.me/donatkz_support',
    },
    {
      id: 'email',
      label: 'Email',
      value: 'support@donatkz.com',
      icon: 'email',
      link: 'mailto:support@donatkz.com',
    },
    {
      id: 'docs',
      label: 'База знаний',
      value: 'docs.donatkz.com',
      icon: 'support',
      link: 'https://docs.donatkz.com',
    },
  ];

  const faqItems: FaqItem[] = [
    {
      id: 'faq-1',
      question: 'Как подключить Kaspi к моему аккаунту?',
      answer:
        'Перейдите в раздел "Управление" → "Интеграции" → "Kaspi". Введите номер телефона, привязанный к Kaspi, и следуйте инструкциям для подтверждения. После этого все донаты будут автоматически отслеживаться.',
    },
    {
      id: 'faq-2',
      question: 'Как добавить виджет на стрим?',
      answer:
        'В разделе "Управление" скопируйте ссылку виджета. Откройте OBS/Streamlabs, добавьте источник "Браузер" и вставьте скопированную ссылку. Настройте размер и положение виджета на экране.',
    },
    {
      id: 'faq-3',
      question: 'Какая комиссия за транзакции?',
      answer:
        'DonatKZ не берёт комиссию за транзакции. Вы получаете 100% от суммы доната. Единственная комиссия — это стандартная комиссия платёжной системы Kaspi при переводе средств.',
    },
    {
      id: 'faq-4',
      question: 'Можно ли кастомизировать алерты?',
      answer:
        'Да! В тарифах BASIC и PREMIUM доступна полная кастомизация: можно менять гифки, музыку, время показа, цвета, шрифты и анимации. В FREE TRIAL доступны базовые настройки.',
    },
    {
      id: 'faq-5',
      question: 'Как быстро приходят донаты?',
      answer:
        'Донаты отображаются на стриме практически мгновенно — в течение 1-3 секунд после отправки через Kaspi. Система автоматически отслеживает все поступления в реальном времени.',
    },
    {
      id: 'faq-6',
      question: 'Что делать, если донат не отобразился?',
      answer:
        'Проверьте подключение к интернету и настройки виджета в OBS. Если проблема сохраняется, обратитесь в поддержку через форму обратной связи или Telegram с указанием времени и суммы доната.',
    },
  ];

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sendToTelegram = async (data: typeof formData) => {
    // Проверка конфига
    if (!isTelegramConfigured()) {
      throw new Error(
        'Система отправки сообщений не настроена. ' +
        'Пожалуйста, свяжитесь с администратором или используйте Telegram.'
      );
    }

    const text = `🚀 Новое обращение в поддержку! 🚀

📝 <b>Тема:</b> ${escapeHtml(data.subject)}
💬 <b>Сообщение:</b> ${escapeHtml(data.message)}

⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;

    try {
      const response = await fetch(TELEGRAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Telegram API Error:', error);
        throw new Error(
          error.description || 
          `Ошибка отправки (${response.status}). Попробуйте позже.`
        );
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error sending message to Telegram:', error);
      
      // Проверка на CORS и другие сетевые ошибки
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        throw new Error(
          'Ошибка соединения. Используйте Telegram для связи: @donatkz_support'
        );
      }
      
      throw error;
    }
  };

  // Функция для экранирования HTML специальных символов
  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await sendToTelegram(formData);

      setSubmitStatus({
        success: true,
        message: 'Ваше обращение успешно отправлено! Мы ответим в течение 24 часов.',
      });

      setFormData({
        subject: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        message:
          'Произошла ошибка при отправке. Пожалуйста, попробуйте позже или свяжитесь с нами через Telegram.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContactIcon = (icon: string) => {
    switch (icon) {
      case 'telegram':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        );
      case 'email':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        );
      case 'support':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="support-page">
      {/* Контакты */}
      <div className="support-contacts-section">
        <div className="support-contacts-grid">
          {contacts.map((contact) => (
            <div key={contact.id} className="support-contact-card">
              <div className="contact-icon">{getContactIcon(contact.icon)}</div>
              <h3 className="contact-label">{contact.label}</h3>
              <p className="contact-value">{contact.value}</p>
              <a
                href={contact.link}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-button"
              >
                {contact.icon === 'email' ? 'Написать' : 'Открыть'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Форма обратной связи */}
      <div className="support-form-section">
        <div className="support-form-container">
          <h2 className="support-form-title">Написать в поддержку</h2>
          <p className="support-form-subtitle">
            Опишите вашу проблему и мы поможем!
          </p>

          {submitStatus && (
            <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
              {submitStatus.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="support-form">
            <div className="form-group">
              <label htmlFor="subject" className="form-label">
                Тема обращения
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Например: Проблема с виджетом уведомлений"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">
                Сообщение
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Опишите проблему подробно..."
                className="form-textarea"
                rows={6}
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Отправить обращение'}
            </button>
          </form>
        </div>
      </div>

      {/* FAQ */}
      <div className="support-faq-section">
        <h2 className="support-faq-title">Часто задаваемые вопросы</h2>
        <p className="support-faq-subtitle">Найдите ответы на популярные вопросы</p>

        <div className="faq-items">
          {faqItems.map((item) => (
            <div key={item.id} className="faq-item">
              <button className="faq-button" onClick={() => toggleFaq(item.id)}>
                <span className="faq-question">{item.question}</span>
                <span className={`faq-icon ${expandedFaqId === item.id ? 'open' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {expandedFaqId === item.id && (
                <div className="faq-answer">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;