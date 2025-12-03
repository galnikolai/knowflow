-- Создание таблицы learnspaces
CREATE TABLE IF NOT EXISTS learnspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  note_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_learnspaces_user_id ON learnspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_learnspaces_created_at ON learnspaces(created_at DESC);

-- Включение Row Level Security (RLS)
ALTER TABLE learnspaces ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои learnspaces
CREATE POLICY "Users can view their own learnspaces"
  ON learnspaces
  FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователи могут создавать только свои learnspaces
CREATE POLICY "Users can insert their own learnspaces"
  ON learnspaces
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять только свои learnspaces
CREATE POLICY "Users can update their own learnspaces"
  ON learnspaces
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять только свои learnspaces
CREATE POLICY "Users can delete their own learnspaces"
  ON learnspaces
  FOR DELETE
  USING (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_learnspaces_updated_at
  BEFORE UPDATE ON learnspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



