import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/shared/api/supabase.server";
import {
  getDueFlashcardsForUser,
} from "@/shared/api/telegram";
import { sendMessage } from "@/shared/api/telegram-bot.server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.TELEGRAM_CRON_SECRET;
  if (!secretKey) {
    return res.status(503).json({ error: "TELEGRAM_CRON_SECRET не настроен" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data: telegramUsers, error } = await supabaseAdmin
      .from("telegram_users")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Ошибка получения пользователей:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!telegramUsers || telegramUsers.length === 0) {
      return res.status(200).json({ message: "Нет активных пользователей" });
    }

    const results = [];

    for (const telegramUser of telegramUsers) {
      try {
        const now = new Date();
        const [hours, minutes] = telegramUser.notification_time.split(":");
        const notificationTime = new Date();
        notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
        if (timeDiff > 60 * 60 * 1000) {
          continue;
        }

        const cards = await getDueFlashcardsForUser(
          telegramUser.user_id,
          telegramUser.daily_limit,
          supabaseAdmin
        );

        if (cards.length === 0) {
          results.push({
            telegramUserId: telegramUser.telegram_user_id,
            status: "no_cards",
          });
          continue;
        }

        await sendMessage(
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

    return res.status(200).json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Ошибка отправки карточек:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
