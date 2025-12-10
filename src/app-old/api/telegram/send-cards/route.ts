/**
 * API endpoint для автоматической отправки карточек пользователям Telegram
 * Этот endpoint должен вызываться по расписанию (cron job)
 */

import { NextRequest, NextResponse } from "next/server";
import TelegramBot from "node-telegram-bot-api";
import { supabase } from "@/shared/api/supabase";
import {
  getTelegramUserByTelegramId,
  getDueFlashcardsForUser,
} from "@/shared/api/telegram";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN не установлен в переменных окружении");
}

const bot = new TelegramBot(botToken);

/**
 * Отправка карточек активным пользователям
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка секретного ключа для безопасности
    const authHeader = request.headers.get("authorization");
    const secretKey = process.env.TELEGRAM_CRON_SECRET;
    
    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем всех активных пользователей Telegram
    const { data: telegramUsers, error } = await supabase
      .from("telegram_users")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Ошибка получения пользователей:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!telegramUsers || telegramUsers.length === 0) {
      return NextResponse.json({ message: "Нет активных пользователей" });
    }

    const results = [];

    // Отправляем карточки каждому пользователю
    for (const telegramUser of telegramUsers) {
      try {
        // Проверяем, наступило ли время отправки
        const now = new Date();
        const [hours, minutes] = telegramUser.notification_time.split(":");
        const notificationTime = new Date();
        notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Простая проверка времени (можно улучшить с учетом timezone)
        const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
        if (timeDiff > 60 * 60 * 1000) {
          // Если разница больше часа, пропускаем
          continue;
        }

        // Получаем карточки для повторения
        const cards = await getDueFlashcardsForUser(
          telegramUser.user_id,
          telegramUser.daily_limit
        );

        if (cards.length === 0) {
          results.push({
            telegramUserId: telegramUser.telegram_user_id,
            status: "no_cards",
          });
          continue;
        }

        // Отправляем первую карточку
        await bot.sendMessage(
          telegramUser.telegram_user_id,
          `📚 У вас ${cards.length} карточек к повторению!\n\n❓ ${cards[0].question}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Показать ответ",
                    callback_data: `show_${cards[0].id}`,
                  },
                ],
              ],
            },
          }
        );

        results.push({
          telegramUserId: telegramUser.telegram_user_id,
          status: "sent",
          cardsCount: cards.length,
        });
      } catch (error) {
        console.error(
          `Ошибка отправки пользователю ${telegramUser.telegram_user_id}:`,
          error
        );
        results.push({
          telegramUserId: telegramUser.telegram_user_id,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Ошибка отправки карточек:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

