# Быстрый деплой на Vercel (5 минут)

## Шаг 1: Подготовка репозитория

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## Шаг 2: Создайте аккаунт на Vercel

1. Перейдите на https://vercel.com
2. Войдите через GitHub
3. Нажмите "New Project"
4. Выберите ваш репозиторий `knowflow`

## Шаг 3: Настройте переменные окружения

В Vercel Dashboard → Settings → Environment Variables добавьте:

```
NEXT_PUBLIC_SUPABASE_URL = ваш_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = ваш_supabase_anon_key
TELEGRAM_BOT_TOKEN = 8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA
TELEGRAM_CRON_SECRET = ваш_секретный_ключ
```

## Шаг 4: Деплой

1. Нажмите "Deploy"
2. Дождитесь завершения (2-3 минуты)
3. Получите URL: `https://your-app.vercel.app`

## Шаг 5: Установите Telegram webhook

```bash
curl -X POST "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_VERCEL_URL.vercel.app/api/telegram/webhook"}'
```

## Шаг 6: Настройте Cron Job

Vercel автоматически настроит cron job из `vercel.json`:
- Путь: `/api/telegram/send-cards`
- Расписание: каждый час

Или вручную: Settings → Cron Jobs → Add

## Готово! 🎉

Ваше приложение задеплоено и работает!

---

## Альтернативные варианты

### Railway (если нужен Docker)

1. https://railway.app
2. New Project → Deploy from GitHub
3. Настройте переменные окружения
4. Деплой автоматический

### Render (бесплатный план)

1. https://render.com
2. New → Web Service
3. Подключите GitHub
4. Настройте переменные окружения
5. Деплой автоматический

Подробности в `DEPLOYMENT_GUIDE.md`

