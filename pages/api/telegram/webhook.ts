import type { NextApiRequest, NextApiResponse } from "next";
import TelegramBot from "node-telegram-bot-api";
import {
  getTelegramUserByTelegramId,
  upsertTelegramUser,
  updateTelegramUserSettings,
  getDueFlashcardsForUser,
  reviewFlashcard,
} from "@/shared/api/telegram";
import { supabaseAdmin } from "@/shared/api/supabase.server";

// Инициализация бота
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN не установлен в переменных окружения");
}

const bot = new TelegramBot(botToken);

// Отправка карточки пользователю
async function sendCard(
  chatId: number,
  card: { id: string; question: string; answer: string },
  index: number,
  total: number
) {
  await bot.sendMessage(
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

// Обработка callback_query (нажатия на кнопки)
async function handleShowAnswer(cardId: string, chatId: number) {
  const { data: cardData } = await supabaseAdmin
    .from("flashcards")
    .select("answer")
    .eq("id", cardId)
    .single();

  if (cardData) {
    await bot.sendMessage(chatId, `💡 Ответ:\n\n${cardData.answer}`, {
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
}

// Обработка команд бота
async function handleMessage(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from?.id;
  const text = msg.text;

  if (!telegramUserId) {
    await bot.sendMessage(chatId, "Ошибка: не удалось определить пользователя");
    return;
  }

  try {
    if (text === "/start") {
      let telegramUser = await getTelegramUserByTelegramId(telegramUserId, supabaseAdmin);

      if (!telegramUser) {
        await bot.sendMessage(
          chatId,
          `👋 Привет! Я бот для изучения флеш-карточек из KnowFlow.

Для начала работы нужно привязать ваш Telegram аккаунт к аккаунту в приложении.

1. Откройте приложение KnowFlow
2. Перейдите в Настройки
3. Найдите раздел "Telegram бот"
4. Нажмите "Привязать Telegram" и отправьте этот код:

\`${telegramUserId}\`

Или используйте команду /link <код_из_приложения>`
        );
        return;
      }

      await bot.sendMessage(
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
      const linkCode = text.split(" ")[1];
      if (!linkCode) {
        await bot.sendMessage(
          chatId,
          "Использование: /link <код_из_приложения>"
        );
        return;
      }

      const userId = linkCode;
      await upsertTelegramUser(userId, telegramUserId, {
        username: msg.from?.username,
        firstName: msg.from?.first_name,
        lastName: msg.from?.last_name,
      }, supabaseAdmin);

      await bot.sendMessage(
        chatId,
        "✅ Аккаунт успешно привязан! Используйте /start для начала работы."
      );
      return;
    }

    if (text === "/study") {
      const telegramUser = await getTelegramUserByTelegramId(telegramUserId, supabaseAdmin);
      if (!telegramUser) {
        await bot.sendMessage(
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
        await bot.sendMessage(
          chatId,
          "🎉 Отлично! Нет карточек для повторения на данный момент."
        );
        return;
      }

      await sendCard(chatId, cards[0], 0, cards.length);
      return;
    }

    if (text === "/stats") {
      const telegramUser = await getTelegramUserByTelegramId(telegramUserId, supabaseAdmin);
      if (!telegramUser) {
        await bot.sendMessage(
          chatId,
          "❌ Аккаунт не привязан. Используйте /start для регистрации."
        );
        return;
      }

      const cards = await getDueFlashcardsForUser(telegramUser.userId, 1000, supabaseAdmin);
      const { count } = await supabaseAdmin
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", telegramUser.userId);

      await bot.sendMessage(
        chatId,
        `📊 Статистика изучения:

📚 Всего карточек: ${count || 0}
⏰ К повторению: ${cards.length}
📅 Лимит в день: ${telegramUser.dailyLimit}`
      );
      return;
    }

    if (text === "/settings") {
      const telegramUser = await getTelegramUserByTelegramId(telegramUserId, supabaseAdmin);
      if (!telegramUser) {
        await bot.sendMessage(
          chatId,
          "❌ Аккаунт не привязан. Используйте /start для регистрации."
        );
        return;
      }

      await bot.sendMessage(chatId, "⚙️ Настройки", {
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
      await bot.sendMessage(
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
    await bot.sendMessage(chatId, "❌ Произошла ошибка. Попробуйте позже.");
  }
}

// Обработка callback_query (нажатия на кнопки)
async function handleCallbackQuery(query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id;
  const data = query.data;
  const telegramUserId = query.from.id;

  if (!chatId || !data) return;

  try {
    if (data.startsWith("show_")) {
      const cardId = data.split("_")[1];
      await handleShowAnswer(cardId, chatId);
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (data.startsWith("rate_")) {
      const [_, cardId, gradeStr] = data.split("_");
      const grade = parseInt(gradeStr) as 0 | 3 | 5;

      await reviewFlashcard(cardId, grade, supabaseAdmin);

      const telegramUser = await getTelegramUserByTelegramId(telegramUserId, supabaseAdmin);
      if (!telegramUser) return;

      const cards = await getDueFlashcardsForUser(
        telegramUser.userId,
        telegramUser.dailyLimit,
        supabaseAdmin
      );

      if (cards.length === 0) {
        await bot.sendMessage(
          chatId,
          "🎉 Отлично! Вы изучили все карточки на сегодня."
        );
        await bot.answerCallbackQuery(query.id, {
          text: "Карточка обновлена!",
        });
        return;
      }

      await sendCard(chatId, cards[0], 0, cards.length);
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (data === "settings_time") {
      await bot.sendMessage(
        chatId,
        "🕐 Установите время уведомлений в формате HH:MM (например, 09:00):"
      );
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (data === "settings_limit") {
      await bot.sendMessage(
        chatId,
        "📊 Установите лимит карточек в день (число от 1 до 50):"
      );
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (data === "settings_toggle") {
      const telegramUser = await getTelegramUserByTelegramId(telegramUserId, supabaseAdmin);
      if (!telegramUser) return;

      await updateTelegramUserSettings(telegramUserId, {
        isActive: !telegramUser.isActive,
      }, supabaseAdmin);

      await bot.sendMessage(
        chatId,
        telegramUser.isActive
          ? "⏸ Уведомления остановлены"
          : "▶️ Уведомления включены"
      );
      await bot.answerCallbackQuery(query.id);
      return;
    }
  } catch (error) {
    console.error("Ошибка обработки callback:", error);
    await bot.answerCallbackQuery(query.id, {
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
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL не указан" });
      }

      try {
        await bot.setWebHook(url);
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
    try {
      const body = req.body;

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
