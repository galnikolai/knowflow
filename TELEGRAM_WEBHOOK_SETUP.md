# Установка Telegram Webhook

## Быстрая установка

### Вариант 1: Использовать готовый скрипт

```bash
# Для локальной разработки с ngrok
./scripts/setup-telegram-webhook.sh https://ВАШ_NGROK_URL.ngrok.io/api/telegram/webhook

# Для продакшена
./scripts/setup-telegram-webhook.sh https://your-domain.com/api/telegram/webhook
```

### Вариант 2: Ручная установка

#### Для локальной разработки (ngrok)

1. **Установите ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Или скачайте: https://ngrok.com/download
   ```

2. **Запустите приложение:**
   ```bash
   npm run dev
   ```

3. **В новом терминале запустите ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Скопируйте HTTPS URL** (например: `https://abc123.ngrok.io`)

5. **Установите webhook:**
   ```bash
   curl -X POST "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://ВАШ_NGROK_URL.ngrok.io/api/telegram/webhook"}'
   ```

#### Для продакшена

Если ваше приложение задеплоено (Vercel, Railway, и т.д.):

```bash
curl -X POST "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ВАШ_ДОМЕН/api/telegram/webhook"}'
```

**Пример для Vercel:**
```bash
curl -X POST "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

## Проверка установки

Проверить, что webhook установлен:

```bash
curl "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/getWebhookInfo"
```

Должен вернуться JSON с полем `url`, содержащим ваш webhook URL.

## Удаление webhook

Если нужно удалить webhook:

```bash
curl -X POST "https://api.telegram.org/bot8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA/deleteWebhook"
```

## Тестирование

После установки webhook:

1. Найдите бота в Telegram: **@know_flow_bot**
2. Отправьте команду `/start`
3. Бот должен ответить

Если бот не отвечает:
- Проверьте, что приложение запущено (`npm run dev`)
- Проверьте логи в консоли
- Убедитесь, что webhook установлен правильно

## Важные замечания

⚠️ **Для ngrok:**
- URL меняется при каждом перезапуске ngrok (на бесплатном плане)
- Нужно переустанавливать webhook при каждом новом запуске
- Для постоянной работы используйте ngrok с фиксированным доменом (платный план)

⚠️ **Для продакшена:**
- Webhook должен быть доступен по HTTPS
- Домен должен быть валидным и иметь SSL сертификат
- Vercel, Railway и другие платформы автоматически предоставляют HTTPS

