# Быстрый старт Telegram бота

## ✅ Токен настроен

Токен бота уже добавлен в `.env.local`.

## Следующие шаги

### 1. Создайте таблицу в Supabase

Выполните SQL миграцию в Supabase Dashboard → SQL Editor:

```sql
-- Скопируйте содержимое файла:
-- supabase/migrations/create_telegram_users_table.sql
```

### 2. Запустите приложение

```bash
npm run dev
```

### 3. Установите webhook (для продакшена)

После деплоя приложения установите webhook:

```bash
# Замените YOUR_DOMAIN на ваш домен
curl "https://YOUR_DOMAIN/api/telegram/webhook?action=set-webhook&url=https://YOUR_DOMAIN/api/telegram/webhook"
```

### 4. Для локальной разработки используйте ngrok

```bash
# Установите ngrok: https://ngrok.com/
ngrok http 3000

# Затем установите webhook на ngrok URL
curl "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/setWebhook?url=https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook"
```

### 5. Протестируйте бота

1. Найдите вашего бота в Telegram (имя бота вы получили от @BotFather)
2. Отправьте команду `/start`
3. Следуйте инструкциям для привязки аккаунта

## Команды бота

- `/start` - Начать работу
- `/study` - Изучить карточки сейчас
- `/stats` - Статистика
- `/settings` - Настройки
- `/help` - Справка

## Проверка работы

### Проверить, что webhook установлен:

```bash
curl "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/getWebhookInfo"
```

### Проверить информацию о боте:

```bash
curl "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/getMe"
```

## Важно

⚠️ **Не коммитьте `.env.local` в git!** Файл уже в `.gitignore`.

## Настройка автоматической отправки

Для автоматической отправки карточек по расписанию настройте cron job:

```bash
# Каждый час
0 * * * * curl -X POST https://YOUR_DOMAIN/api/telegram/send-cards \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Или используйте:
- Vercel Cron Jobs
- GitHub Actions
- Supabase Edge Functions

## Troubleshooting

### Бот не отвечает

1. Проверьте, что сервер запущен: `npm run dev`
2. Проверьте webhook: используйте команду выше
3. Проверьте логи в консоли сервера

### Ошибка "TELEGRAM_BOT_TOKEN не установлен"

Убедитесь, что `.env.local` содержит:
```
TELEGRAM_BOT_TOKEN=8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA
```

### Карточки не приходят

1. Убедитесь, что аккаунт привязан (`/start` → `/link <код>`)
2. Проверьте, что есть карточки к повторению
3. Проверьте настройки времени в `/settings`

