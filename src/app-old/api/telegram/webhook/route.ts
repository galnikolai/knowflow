import { NextRequest, NextResponse } from "next/server";
import TelegramBot from "node-telegram-bot-api";
import {
  getTelegramUserByTelegramId,
  upsertTelegramUser,
  updateTelegramUserSettings,
  getDueFlashcardsForUser,
  reviewFlashcard,
} from "@/shared/api/telegram";
import { supabase } from "@/shared/api/supabase";

// Инициализация бота
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN не установлен в переменных окружения");
}

const bot = new TelegramBot(botToken);

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
    // Команда /start - регистрация пользователя
    if (text === "/start") {
      // Получаем или создаем пользователя Telegram
      let telegramUser = await getTelegramUserByTelegramId(telegramUserId);

      if (!telegramUser) {
        // Пользователь еще не привязан к аккаунту
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
/help - Справка

Карточки будут приходить автоматически в ${telegramUser.notificationTime} (${telegramUser.timezone})`
      );
      return;
    }

    // Команда /link <linkCode> - привязка аккаунта
    // linkCode - это временный код, который пользователь получает в приложении
    if (text?.startsWith("/link ")) {
      const linkCode = text.split(" ")[1];
      if (!linkCode) {
        await bot.sendMessage(chatId, "Использование: /link <код_из_приложения>");
        return;
      }

      // Получаем userId из временной таблицы link_codes (нужно создать)
      // Пока используем упрощенный вариант - код это userId
      // В продакшене лучше использовать временные коды с истечением
      const userId = linkCode;

      // Создаем или обновляем связь
      await upsertTelegramUser(userId, telegramUserId, {
        username: msg.from?.username,
        firstName: msg.from?.first_name,
        lastName: msg.from?.last_name,
      });

      await bot.sendMessage(
        chatId,
        "✅ Аккаунт успешно привязан! Используйте /start для начала работы."
      );
      return;
    }

    // Команда /study - начать изучение
    if (text === "/study") {
      const telegramUser = await getTelegramUserByTelegramId(telegramUserId);
      if (!telegramUser) {
        await bot.sendMessage(
          chatId,
          "❌ Аккаунт не привязан. Используйте /start для регистрации."
        );
        return;
      }

      const cards = await getDueFlashcardsForUser(
        telegramUser.userId,
        telegramUser.dailyLimit
      );

      if (cards.length === 0) {
        await bot.sendMessage(
          chatId,
          "🎉 Отлично! Нет карточек для повторения на данный момент."
        );
        return;
      }

      // Отправляем первую карточку
      await sendCard(chatId, cards[0], 0, cards.length);
      return;
    }

    // Команда /stats - статистика
    if (text === "/stats") {
      const telegramUser = await getTelegramUserByTelegramId(telegramUserId);
      if (!telegramUser) {
        await bot.sendMessage(
          chatId,
          "❌ Аккаунт не привязан. Используйте /start для регистрации."
        );
        return;
      }

      const cards = await getDueFlashcardsForUser(telegramUser.userId, 1000);
      const totalCards = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", telegramUser.userId);

      await bot.sendMessage(
        chatId,
        `📊 Статистика изучения:

📚 Всего карточек: ${totalCards.count || 0}
⏰ К повторению: ${cards.length}
📅 Лимит в день: ${telegramUser.dailyLimit}
🕐 Время уведомлений: ${telegramUser.notificationTime} (${telegramUser.timezone})`
      );
      return;
    }

    // Команда /settings - настройки
    if (text === "/settings") {
      const telegramUser = await getTelegramUserByTelegramId(telegramUserId);
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

    // Команда /help - справка
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

    // Обработка callback_query (кнопки)
    if (msg.reply_to_message) {
      // Это может быть ответ на карточку
      return;
    }
  } catch (error) {
    console.error("Ошибка обработки сообщения:", error);
    await bot.sendMessage(
      chatId,
      "❌ Произошла ошибка. Попробуйте позже."
    );
  }
}

// Обработка callback_query (нажатия на кнопки)
async function handleCallbackQuery(query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id;
  const data = query.data;
  const telegramUserId = query.from.id;

  if (!chatId || !data) return;

  try {
    // Показать ответ на карточку
    if (data.startsWith("show_")) {
      const cardId = data.split("_")[1];
      await handleShowAnswer(cardId, chatId);
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // Оценка карточки (0, 3, 5)
    if (data.startsWith("rate_")) {
      const [_, cardId, gradeStr] = data.split("_");
      const grade = parseInt(gradeStr) as 0 | 3 | 5;

      await reviewFlashcard(cardId, grade);

      const telegramUser = await getTelegramUserByTelegramId(telegramUserId);
      if (!telegramUser) return;

      // Получаем следующую карточку
      const cards = await getDueFlashcardsForUser(
        telegramUser.userId,
        telegramUser.dailyLimit
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

      // Отправляем следующую карточку
      await sendCard(chatId, cards[0], 0, cards.length);
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // Настройки
    if (data === "settings_time") {
      await bot.sendMessage(
        chatId,
        "🕐 Установите время уведомлений в формате HH:MM (например, 09:00):"
      );
      // Здесь можно добавить обработку следующего сообщения
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
      const telegramUser = await getTelegramUserByTelegramId(telegramUserId);
      if (!telegramUser) return;

      await updateTelegramUserSettings(telegramUserId, {
        isActive: !telegramUser.isActive,
      });

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
          [
            { text: "Показать ответ", callback_data: `show_${card.id}` },
          ],
        ],
      },
    }
  );
}

// Обработка callback_query (нажатия на кнопки)
async function handleShowAnswer(cardId: string, chatId: number) {
  // Получаем карточку из базы
  const { data: cardData } = await supabase
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

// Обработка callback_query (нажатия на кнопки) - интегрировано в handleCallbackQuery

// Webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Обрабатываем обновление
    if (body.message) {
      await handleMessage(body.message);
    } else if (body.callback_query) {
      await handleCallbackQuery(body.callback_query);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ошибка webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Для установки webhook (выполнить один раз)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "set-webhook") {
    const webhookUrl = url.searchParams.get("url");
    if (!webhookUrl) {
      return NextResponse.json({ error: "URL не указан" }, { status: 400 });
    }

    try {
      await bot.setWebHook(webhookUrl);
      return NextResponse.json({ ok: true, message: "Webhook установлен" });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}

