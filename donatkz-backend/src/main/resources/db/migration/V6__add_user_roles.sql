-- Добавление ролей пользователей
-- Роли: USER, ADMIN, SUPERADMIN

ALTER TABLE users
    ADD COLUMN role VARCHAR(20) DEFAULT 'USER' NOT NULL;

-- Установить пользователя с id = 11 как главного администратора
UPDATE users 
SET role = 'SUPERADMIN' 
WHERE id = 11;

-- Создать индекс для быстрого поиска по ролям
CREATE INDEX idx_users_role ON users(role);

-- Добавить комментарии
COMMENT ON COLUMN users.role IS 'Роль пользователя: USER, ADMIN, SUPERADMIN';

