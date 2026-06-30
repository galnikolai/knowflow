/**
 * Минимальный клиент Telegram Bot API через fetch (без node-telegram-bot-api).
 */

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN не установлен в переменных окружения");
  }
  return token;
}

function apiUrl(method: string): string {
  return `https://api.telegram.org/bot${getBotToken()}/${method}`;
}

async function callTelegramApi<T>(
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(apiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { ok: boolean; description?: string; result?: T };
  if (!data.ok) {
    throw new Error(data.description || `Telegram API error: ${method}`);
  }
  return data.result as T;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export async function sendMessage(
  chatId: number,
  text: string,
  options?: { reply_markup?: InlineKeyboardMarkup; parse_mode?: string }
): Promise<void> {
  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode,
    reply_markup: options?.reply_markup,
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  options?: { text?: string }
): Promise<void> {
  await callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: options?.text,
  });
}

export async function setWebhook(
  url: string,
  secretToken?: string
): Promise<void> {
  await callTelegramApi("setWebhook", {
    url,
    secret_token: secretToken,
  });
}
