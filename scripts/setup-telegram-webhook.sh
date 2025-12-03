#!/bin/bash

# Скрипт для установки Telegram webhook
# Использование: ./scripts/setup-telegram-webhook.sh <URL>

BOT_TOKEN="8270666542:AAE2M6MUIEM2KUW1GpWUKG52aszkj70x5fA"

if [ -z "$1" ]; then
  echo "Использование: $0 <webhook_url>"
  echo "Пример: $0 https://your-domain.com/api/telegram/webhook"
  echo "Или для ngrok: $0 https://abc123.ngrok.io/api/telegram/webhook"
  exit 1
fi

WEBHOOK_URL="$1"

echo "Устанавливаю webhook: $WEBHOOK_URL"

response=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}")

echo "$response" | jq '.'

if echo "$response" | grep -q '"ok":true'; then
  echo "✅ Webhook успешно установлен!"
  
  # Проверяем информацию о webhook
  echo ""
  echo "Информация о webhook:"
  curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq '.'
else
  echo "❌ Ошибка установки webhook"
  exit 1
fi

