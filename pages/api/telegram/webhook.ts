import type { NextApiRequest, NextApiResponse } from "next";
import {
  getTelegramUserByTelegramId,
  upsertTelegramUser,
  updateTelegramUserSettings,
  getDueFlashcardsForUser,
  reviewFlashcard,
} from "@/shared/api/telegram";
import { supabaseAdmin } from "@/shared/api/supabase.server";
import { verifyTelegramLinkToken } from "@/shared/api/telegram-link-token";
import {
  sendMessage,
  answerCallbackQuery,
  setWebhook,
} from "@/shared/api/telegram-bot.server";

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: { id: number };
  message?: { chat: { id: number } };
  data?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

function verifyWebhookSecret(req: NextApiRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return false;
  const header = req.headers["x-telegram-bot-api-secret-token"];
  return header === secret;
}

async function sendCard(
  chatId: number,
  card: { id: string; question: string; answer: string },
  index: number,
  total: number
) {
  await sendMessage(
    chatId,
    `📚 Карточка ${index + 1} из ${total}\n\n❓ ${card.question}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Показать ответ", callback_data: `show_${card.id}` }],
        ],
      },
    }
  );
}

async function handleShowAnswer(
  cardId: string,
  chatId: number,
  telegramUserId: number
) {
  const telegramUser = await getTelegramUserByTelegramId(
    telegramUserId,
    supabaseAdmin
  );
  if (!telegramUser) return;

  const { data: cardData } = await supabaseAdmin
    .from("flashcards")
    .select("answer, user_id")
    .eq("id", cardId)
    .single();

  if (!cardData || cardData.user_id !== telegramUser.userId) return;

  await sendMessage(chatId, `💡 Ответ:\n\n${cardData.answer}`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "❌ Сложно", callback_data: `rate_${cardId}_0` },
          { text: "🤔 Нормально", callback_data: `rate_${cardId}_3` },
          { text: "✅ Легко", callback_data: `rate_${cardId}_5` },
        ],
      ],
    },
  });
}

async function handleMessage(msg: TelegramMessage) {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from?.id;
  const text = msg.text;

  if (!telegramUserId) {
    await sendMessage(chatId, "Ошибка: не удалось определить пользователя");
    return;
  }

  try {
    if (text === "/start") {
      const telegramUser = await getTelegramUserByTelegramId(
        telegramUserId,
        supabaseAdmin
      );

      if (!telegramUser) {
        await sendMessage(
          chatId,
          `👋 Привет! Я бот для изучения флеш-карточек из KnowFlow.

Для начала работы нужно привязать ваш Telegram аккаунт к аккаунту в приложении.

1. Откройте приложение KnowFlow
2. Перейдите в Настройки
3. Найдите раздел "Telegram бот"
4. Нажмите "Привязать Telegram" и отправьте боту код из приложения

Или используйте команду /link <код_из_приложения>`
        );
        return;
      }

      await sendMessage(
        chatId,
        `✅ Бот активирован!

📚 Доступные команды:
/study - Начать изучение карточек
/stats - Статистика изучения
/settings - Настройки
/help - Справка`
      );
      return;
    }

    if (text?.startsWith("/link ")) {
      const linkCode = text.split(" ").slice(1).join(" ").trim();
      if (!linkCode) {
        await sendMessage(
          chatId,
          "Использование: /link <код_из_приложения>"
        );
        return;
      }

      const userId = verifyTelegramLinkToken(linkCode);
      if (!userId) {
        await sendMessage(
          chatId,
          "❌ Недействительный или просроченный код. Получите новый код в настройках приложения."
        );
        return;
      }

      await upsertTelegramUser(
        userId,
        telegramUserId,
        {
          username: msg.from?.username,
          firstName: msg.from?.first_name,
          lastName: msg.from?.last_name,
        },
        supabaseAdmin
      );

      await sendMessage(
        chatId,
        "✅ Аккаунт успешно привязан! Используйте /start для начала работы."
      );
      return;
    }

    if (text === "/study") {
      const telegramUser = await getTelegramUserByTelegramId(
        telegramUserId,
        supabaseAdmin
      );
      if (!telegramUser) {
        await sendMessage(
          chatId,
          "❌ Аккаунт не привязан. Используйте /start для регистрации."
        );
        return;
      }

      const cards = await getDueFlashcardsForUser(
        telegramUser.userId,
        telegramUser.dailyLimit,
        supabaseAdmin
      );

      if (cards.length === 0) {
        await sendMessage(
          chatId,
          "🎉 Отлично! Нет карточек для повторения на данный момент."
        );
        return;
      }

      await sendCard(chatId, cards[0], 0, cards.length);
      return;
    }

    if (text === "/stats") {
      const telegramUser = await getTelegramUserByTelegramId(
        telegramUserId,
        supabaseAdmin
      );
      if (!telegramUser) {
        await sendMessage(
          chatId,
          "❌ Аккаунт не привязан. Используйте /start для регистрации."
        );
        return;
      }

      const cards = await getDueFlashcardsForUser(
        telegramUser.userId,
        1000,
        supabaseAdmin
      );
      const { count } = await supabaseAdmin
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", telegramUser.userId);

      await sendMessage(
        chatId,
        `📊 Статистика изучения:

📚 Всего карточек: ${count || 0}
⏰ К повторению: ${cards.length}
📅 Лимит в день: ${telegramUser.dailyLimit}`
      );
      return;
    }

    if (text === "/settings") {
      const telegramUser = await getTelegramUserByTelegramId(
        telegramUserId,
        supabaseAdmin
      );
      if (!telegramUser) {
        await sendMessage(
          chatId,
          "❌ Аккаунт не привязан. Используйте /start для регистрации."
        );
        return;
      }

      await sendMessage(chatId, "⚙️ Настройки", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `🕐 Время: ${telegramUser.notificationTime}`,
                callback_data: "settings_time",
              },
            ],
            [
              {
                text: `📊 Лимит: ${telegramUser.dailyLimit} карточек/день`,
                callback_data: "settings_limit",
              },
            ],
            [
              {
                text: telegramUser.isActive
                  ? "⏸ Остановить уведомления"
                  : "▶️ Включить уведомления",
                callback_data: "settings_toggle",
              },
            ],
          ],
        },
      });
      return;
    }

    if (text === "/help") {
      await sendMessage(
        chatId,
        `📖 Справка по командам:

/start - Начать работу с ботом
/study - Начать изучение карточек
/stats - Показать статистику
/settings - Настройки бота
/help - Показать эту справку

💡 Карточки будут приходить автоматически в установленное время.`
      );
      return;
    }
  } catch (error) {
    console.error("Ошибка обработки сообщения:", error);
    await sendMessage(chatId, "❌ Произошла ошибка. Попробуйте позже.");
  }
}

async function handleCallbackQuery(query: TelegramCallbackQuery) {
  const chatId = query.message?.chat.id;
  const data = query.data;
  const telegramUserId = query.from.id;

  if (!chatId || !data) return;

  try {
    if (data.startsWith("show_")) {
      const cardId = data.slice("show_".length);
      await handleShowAnswer(cardId, chatId, telegramUserId);
      await answerCallbackQuery(query.id);
      return;
    }

    if (data.startsWith("rate_")) {
      const parts = data.slice("rate_".length).split("_");
      const gradeStr = parts.pop();
      const cardId = parts.join("_");
      const grade = parseInt(gradeStr ?? "", 10) as 0 | 3 | 5;

      const telegramUser = await getTelegramUserByTelegramId(
        telegramUserId,
        supabaseAdmin
      );
      if (!telegramUser) return;

      const { data: cardData } = await supabaseAdmin
        .from("flashcards")
        .select("user_id")
        .eq("id", cardId)
        .single();

      if (!cardData || cardData.user_id !== telegramUser.userId) {
        await answerCallbackQuery(query.id, { text: "Карточка не найдена" });
        return;
      }

      await reviewFlashcard(cardId, grade, supabaseAdmin);

      const cards = await getDueFlashcardsForUser(
        telegramUser.userId,
        telegramUser.dailyLimit,
        supabaseAdmin
      );

      if (cards.length === 0) {
        await sendMessage(
          chatId,
          "🎉 Отлично! Вы изучили все карточки на сегодня."
        );
        await answerCallbackQuery(query.id, {
          text: "Карточка обновлена!",
        });
        return;
      }

      await sendCard(chatId, cards[0], 0, cards.length);
      await answerCallbackQuery(query.id);
      return;
    }

    if (data === "settings_time") {
      await sendMessage(
        chatId,
        "🕐 Установите время уведомлений в формате HH:MM (например, 09:00):"
      );
      await answerCallbackQuery(query.id);
      return;
    }

    if (data === "settings_limit") {
      await sendMessage(
        chatId,
        "📊 Установите лимит карточек в день (число от 1 до 50):"
      );
      await answerCallbackQuery(query.id);
      return;
    }

    if (data === "settings_toggle") {
      const telegramUser = await getTelegramUserByTelegramId(
        telegramUserId,
        supabaseAdmin
      );
      if (!telegramUser) return;

      await updateTelegramUserSettings(
        telegramUserId,
        {
          isActive: !telegramUser.isActive,
        },
        supabaseAdmin
      );

      await sendMessage(
        chatId,
        telegramUser.isActive
          ? "⏸ Уведомления остановлены"
          : "▶️ Уведомления включены"
      );
      await answerCallbackQuery(query.id);
      return;
    }
  } catch (error) {
    console.error("Ошибка обработки callback:", error);
    await answerCallbackQuery(query.id, {
      text: "Произошла ошибка",
    });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { action, url } = req.query;

    if (action === "set-webhook") {
      const adminSecret = process.env.TELEGRAM_ADMIN_SECRET;
      const authHeader = req.headers.authorization;
      if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL не указан" });
      }

      try {
        const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
        await setWebhook(url, webhookSecret);
        return res
          .status(200)
          .json({ ok: true, message: "Webhook установлен" });
      } catch (error) {
        return res.status(500).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return res.status(400).json({ error: "Неизвестное действие" });
  }

  if (req.method === "POST") {
    if (!verifyWebhookSecret(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const body = req.body as TelegramUpdate;

      if (body.message) {
        await handleMessage(body.message);
      } else if (body.callback_query) {
        await handleCallbackQuery(body.callback_query);
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Ошибка webhook:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
