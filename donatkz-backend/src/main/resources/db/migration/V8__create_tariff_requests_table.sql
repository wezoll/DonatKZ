-- Создание таблицы для заявок на оплату тарифов
CREATE TABLE tariff_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tariff VARCHAR(20) NOT NULL CHECK (tariff IN ('FREE', 'BASIC', 'PREMIUM')),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    promocode VARCHAR(100),
    receipt_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by BIGINT REFERENCES users(id)
);

CREATE INDEX idx_tariff_requests_user_id ON tariff_requests(user_id);
CREATE INDEX idx_tariff_requests_status ON tariff_requests(status);
CREATE INDEX idx_tariff_requests_created_at ON tariff_requests(created_at DESC);

COMMENT ON TABLE tariff_requests IS 'Заявки пользователей на оплату тарифов';
COMMENT ON COLUMN tariff_requests.status IS 'Статус заявки: pending, approved, rejected';
COMMENT ON COLUMN tariff_requests.receipt_url IS 'URL загруженного чека (PDF)';
COMMENT ON COLUMN tariff_requests.reviewed_by IS 'ID администратора, который рассмотрел заявку';

