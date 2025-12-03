-- Создание таблицы для связи пользователей приложения с Telegram
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '09:00:00', -- Время отправки уведомлений (по умолчанию 9:00)
  timezone TEXT DEFAULT 'UTC',
  daily_limit INTEGER DEFAULT 10, -- Максимальное количество карточек в день
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, telegram_user_id)
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_user_id ON telegram_users(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_is_active ON telegram_users(is_active) WHERE is_active = true;

-- Включение Row Level Security (RLS)
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои записи
CREATE POLICY "Users can view their own telegram_users"
  ON telegram_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователи могут создавать только свои записи
CREATE POLICY "Users can insert their own telegram_users"
  ON telegram_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять только свои записи
CREATE POLICY "Users can update their own telegram_users"
  ON telegram_users
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять только свои записи
CREATE POLICY "Users can delete their own telegram_users"
  ON telegram_users
  FOR DELETE
  USING (auth.uid() = user_id);

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_telegram_users_updated_at
  BEFORE UPDATE ON telegram_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

