-- ===== VOICE SETTINGS =====
-- Добавить новые поля для озвучки

ALTER TABLE users
ADD COLUMN IF NOT EXISTS voice_type VARCHAR(20) DEFAULT 'robot';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS voice_volume INTEGER DEFAULT 80;

-- ===== MODERATION SETTINGS =====
-- Добавить поля для модерации сообщений

ALTER TABLE users
ADD COLUMN IF NOT EXISTS moderation_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS banned_words TEXT DEFAULT '[]';

-- ===== COMMENTS =====
COMMENT ON COLUMN users.voice_type IS 'Тип голоса для озвучки: robot, female, male';
COMMENT ON COLUMN users.voice_volume IS 'Громкость озвучки (0-100)';
COMMENT ON COLUMN users.moderation_enabled IS 'Автоматическая фильтрация запрещенных слов';
COMMENT ON COLUMN users.banned_words IS 'JSON массив запрещенных слов для фильтрации';


