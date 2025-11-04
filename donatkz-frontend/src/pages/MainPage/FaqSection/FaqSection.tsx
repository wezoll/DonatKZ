import React, { useState } from "react";
import "./FaqSection.css";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FaqSection: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqItems: FaqItem[] = [
    {
      id: "faq-1",
      question: "Что такое DonatKZ?",
      answer:
        "DonatKZ — это сервис для приёма донатов через Kaspi. Он позволяет стримерам и контент-креаторам получать поддержку от зрителей в реальном времени, с отображением уведомлений на экране во время трансляции.",
    },
    {
      id: "faq-2",
      question: "Как работает DonatKZ?",
      answer:
        "Зрители отправляют донаты через Kaspi на ваш аккаунт, а DonatKZ автоматически отслеживает поступления и показывает красивые уведомления на стриме. Всё происходит мгновенно и без сложных настроек.",
    },
    {
      id: "faq-3",
      question: "Нужен ли OBS или другая программа?",
      answer:
        "Да, DonatKZ интегрируется с OBS, Streamlabs и другими программами для стриминга. Вы просто добавляете ссылку виджета в браузерный источник, и уведомления появляются на экране во время трансляции.",
    },
    {
      id: "faq-4",
      question: "Поддерживаются ли другие платёжные системы кроме Kaspi?",
      answer:
        "Сейчас DonatKZ оптимизирован под Kaspi, так как это основная платформа в Казахстане. В будущем планируется поддержка других систем, таких как Halyk, FreedomPay и криптоплатежи.",
    },
    {
      id: "faq-5",
      question: "Безопасно ли использовать DonatKZ?",
      answer:
        "Да, ваш Kaspi-счёт не передаётся третьим лицам. DonatKZ не имеет доступа к вашим средствам и только отслеживает уведомления о поступлениях. Все данные защищены и шифруются.",
    }
  ];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-container">
        <h2 className="faq-title">FAQ</h2>

        <div className="faq-items">
          {faqItems.map((item) => (
            <div key={item.id} className="faq-item">
              <button
                className="faq-button"
                onClick={() => toggleExpand(item.id)}
              >
                <span className="faq-question">{item.question}</span>
                <span
                  className={`faq-icon ${expandedId === item.id ? "open" : ""}`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>

              {expandedId === item.id && (
                <div className="faq-answer">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
