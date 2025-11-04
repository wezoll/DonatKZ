-- Создание таблицы новостей
CREATE TABLE news (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('update', 'announcement', 'feature')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    badge VARCHAR(100),
    icon VARCHAR(20) NOT NULL CHECK (icon IN ('star', 'megaphone', 'news')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы FAQ
CREATE TABLE faq (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для сортировки
CREATE INDEX idx_news_created_at ON news(created_at DESC);
CREATE INDEX idx_faq_display_order ON faq(display_order);

-- Комментарии
COMMENT ON TABLE news IS 'Новости и обновления платформы';
COMMENT ON TABLE faq IS 'Часто задаваемые вопросы';
COMMENT ON COLUMN faq.display_order IS 'Порядок отображения вопросов (меньше = выше)';

