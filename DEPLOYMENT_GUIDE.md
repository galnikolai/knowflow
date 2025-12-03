# Руководство по деплою KnowFlow

## Варианты деплоя

### 🥇 1. Vercel (Рекомендуется для Next.js)

**Плюсы:**
- ✅ Бесплатный план с хорошими лимитами
- ✅ Автоматический деплой из GitHub
- ✅ Встроенная поддержка Next.js
- ✅ Встроенные Cron Jobs
- ✅ Автоматический HTTPS
- ✅ CDN по всему миру
- ✅ Простая настройка

**Минусы:**
- ⚠️ Serverless функции (ограничение времени выполнения)
- ⚠️ Нет постоянного хранилища

**Цена:** Бесплатно (Hobby), $20/мес (Pro)

#### Шаги деплоя на Vercel:

1. **Подготовьте репозиторий:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Создайте аккаунт на Vercel:**
   - Перейдите на https://vercel.com
   - Войдите через GitHub

3. **Импортируйте проект:**
   - Нажмите "New Project"
   - Выберите ваш репозиторий
   - Vercel автоматически определит Next.js

4. **Настройте переменные окружения:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   TELEGRAM_BOT_TOKEN=8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA
   TELEGRAM_CRON_SECRET=your_secret_key
   ```

5. **Настройте Cron Job для Telegram:**
   - Создайте файл `vercel.json` (см. ниже)
   - Или используйте Vercel Dashboard → Settings → Cron Jobs

6. **Деплой:**
   - Vercel автоматически задеплоит при каждом push в main
   - Получите URL вида: `https://your-app.vercel.app`

---

### 🥈 2. Railway

**Плюсы:**
- ✅ Простая настройка
- ✅ Поддержка Docker
- ✅ Автоматический деплой из GitHub
- ✅ Cron Jobs через отдельный сервис
- ✅ $5 бесплатных кредитов в месяц

**Минусы:**
- ⚠️ Платный после бесплатных кредитов (~$5-10/мес)
- ⚠️ Может быть медленнее Vercel

**Цена:** $5 бесплатных кредитов, затем ~$5-10/мес

#### Шаги деплоя на Railway:

1. **Создайте `railway.json`:**
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Создайте аккаунт:**
   - https://railway.app
   - Войдите через GitHub

3. **Создайте проект:**
   - New Project → Deploy from GitHub
   - Выберите репозиторий

4. **Настройте переменные окружения:**
   - Settings → Variables
   - Добавьте все переменные из `.env.local`

5. **Деплой:**
   - Railway автоматически задеплоит
   - Получите URL вида: `https://your-app.up.railway.app`

---

### 🥉 3. Render

**Плюсы:**
- ✅ Бесплатный план (с ограничениями)
- ✅ Автоматический деплой из GitHub
- ✅ Поддержка Docker
- ✅ Cron Jobs

**Минусы:**
- ⚠️ Приложение "засыпает" на бесплатном плане
- ⚠️ Медленный старт после простоя

**Цена:** Бесплатно (с ограничениями), $7/мес (Starter)

#### Шаги деплоя на Render:

1. **Создайте `render.yaml`:**
   ```yaml
   services:
     - type: web
       name: knowflow
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NEXT_PUBLIC_SUPABASE_URL
           sync: false
         - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
           sync: false
         - key: TELEGRAM_BOT_TOKEN
           sync: false
         - key: TELEGRAM_CRON_SECRET
           sync: false
   ```

2. **Создайте аккаунт:**
   - https://render.com
   - Войдите через GitHub

3. **Создайте Web Service:**
   - New → Web Service
   - Подключите репозиторий
   - Настройте переменные окружения

4. **Деплой:**
   - Render автоматически задеплоит
   - Получите URL вида: `https://your-app.onrender.com`

---

### 4. Fly.io

**Плюсы:**
- ✅ Хорошая поддержка Docker
- ✅ Глобальная сеть
- ✅ Бесплатный план

**Минусы:**
- ⚠️ Требует Docker
- ⚠️ Более сложная настройка

**Цена:** Бесплатно (с ограничениями), ~$5-10/мес

---

### 5. DigitalOcean App Platform

**Плюсы:**
- ✅ Надежная инфраструктура
- ✅ Хорошая документация

**Минусы:**
- ⚠️ Платный (~$5-12/мес)
- ⚠️ Менее автоматизирован

**Цена:** ~$5-12/мес

---

## Конфигурационные файлы

### vercel.json (для Vercel)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/telegram/send-cards",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Dockerfile (для Railway, Render, Fly.io)

```dockerfile
FROM node:20-alpine AS base

# Установка зависимостей
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Продакшен образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Важно:** Добавьте в `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // ... существующая конфигурация
  output: 'standalone', // Для Docker
};
```

### docker-compose.yml (для локального тестирования)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_CRON_SECRET=${TELEGRAM_CRON_SECRET}
```

---

## Переменные окружения

Создайте файл `.env.production` (не коммитьте в git):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TELEGRAM_BOT_TOKEN=8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA
TELEGRAM_CRON_SECRET=your_generated_secret
```

---

## Настройка Cron Jobs

### Vercel

Используйте `vercel.json` (см. выше) или Vercel Dashboard → Settings → Cron Jobs.

### Railway

Создайте отдельный сервис или используйте GitHub Actions.

### Render

Settings → Cron Jobs → Add Cron Job:
- Command: `curl -X POST https://your-app.onrender.com/api/telegram/send-cards -H "Authorization: Bearer YOUR_CRON_SECRET"`
- Schedule: `0 * * * *` (каждый час)

### GitHub Actions (универсальный вариант)

Создайте `.github/workflows/telegram-cron.yml`:

```yaml
name: Telegram Cron Job

on:
  schedule:
    - cron: '0 * * * *'  # Каждый час
  workflow_dispatch:  # Ручной запуск

jobs:
  send-cards:
    runs-on: ubuntu-latest
    steps:
      - name: Send cards
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/telegram/send-cards \
            -H "Authorization: Bearer ${{ secrets.TELEGRAM_CRON_SECRET }}"
```

---

## После деплоя

### 1. Установите Telegram webhook:

```bash
curl -X POST "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_DEPLOYED_URL/api/telegram/webhook"}'
```

### 2. Проверьте работу:

- Откройте приложение в браузере
- Проверьте Telegram бота (`/start`)
- Проверьте cron job (логи в панели деплоя)

---

## Рекомендации

### Для начала: **Vercel**
- Самый простой деплой
- Бесплатный план достаточен
- Встроенные Cron Jobs
- Автоматический HTTPS

### Для продакшена: **Vercel Pro** или **Railway**
- Больше ресурсов
- Лучшая производительность
- Поддержка

### Для обучения: **Render** (бесплатный)
- Хорошо для тестирования
- Простая настройка

---

## Troubleshooting

### Ошибка сборки

1. Проверьте версию Node.js (нужна >= 20.9.0)
2. Проверьте переменные окружения
3. Проверьте логи сборки

### Telegram webhook не работает

1. Убедитесь, что URL доступен по HTTPS
2. Проверьте логи в панели деплоя
3. Проверьте, что endpoint `/api/telegram/webhook` существует

### Cron job не работает

1. Проверьте настройки cron в панели деплоя
2. Проверьте `TELEGRAM_CRON_SECRET`
3. Проверьте логи выполнения

---

## Следующие шаги

1. Выберите платформу (рекомендую Vercel)
2. Создайте аккаунт
3. Подключите GitHub репозиторий
4. Настройте переменные окружения
5. Задеплойте
6. Установите Telegram webhook
7. Настройте Cron Job

