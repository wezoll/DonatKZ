import React from 'react';
import './ContactSection.css';
import contactUsImg from '../../../assets/images/contact_us.png';

interface ContactItem {
  id: string;
  label: string;
  value: string;
  icon: 'email' | 'support' | 'telegram';
  link?: string;
}

const ContactSection: React.FC = () => {
  const contacts: ContactItem[] = [
    {
      id: 'contact-email',
      label: 'Основной контакт',
      value: 'contact@donatkz.com',
      icon: 'email',
      link: 'mailto:contact@donatkz.com'
    },
    {
      id: 'support-email',
      label: 'Служба поддержки',
      value: 'support@donatkz.com',
      icon: 'support',
      link: 'mailto:support@donatkz.com'
    },
    {
      id: 'telegram',
      label: 'Telegram бот',
      value: 't.me/donatkz_bot',
      icon: 'telegram',
      link: 'https://t.me/donatkz_bot'
    }
  ];

  const getIconSvg = (icon: string) => {
    switch (icon) {
      case 'email':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        );
      case 'support':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
          </svg>
        );
      case 'telegram':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.3 1.5L1.6 10.9c-1.2.5-1.2 1.6-.2 2l5.6 1.8 13-8.1c.6-.4 1.2-.2.7.4l-10.5 9.5c-.3.3-.5.8-.5 1.3l-.3 5.5c-.1.8.4 1.1 1 .7l2.5-2.3 5.1 3.8c.9.7 2 .3 2.2-1L23 2.8c.2-.8-.4-1.3-1.2-1.1z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <div className="contact-content">
          <h2 className="contact-title">Свяжитесь с нами</h2>

          <div className="contact-list">
            {contacts.map((contact) => (
              <a
                key={contact.id}
                href={contact.link}
                className="contact-item"
                target={contact.icon === 'telegram' ? '_blank' : undefined}
                rel={contact.icon === 'telegram' ? 'noopener noreferrer' : undefined}
              >
                <div className="contact-icon">
                  {getIconSvg(contact.icon)}
                </div>
                <span className="contact-value">{contact.value}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="contact-image">
          <img src={contactUsImg} alt="Contact Us" />
        </div>
      </div>
    </section>
  );
};

export default ContactSection;