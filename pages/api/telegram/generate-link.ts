import type { NextApiRequest, NextApiResponse } from "next";
import { getTelegramUserByUserId } from "@/shared/api/telegram";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId обязателен" });
    }

    // Проверяем, не привязан ли уже Telegram
    const existing = await getTelegramUserByUserId(userId);
    if (existing) {
      return res.status(200).json({
        linked: true,
        telegramUserId: existing.telegramUserId,
        message: "Telegram уже привязан",
      });
    }

    // Генерируем временный код (в продакшене лучше использовать более безопасный подход)
    const linkCode = userId;

    return res.status(200).json({
      linked: false,
      linkCode,
      instructions: `Отправьте боту команду: /link ${linkCode}`,
    });
  } catch (error) {
    console.error("Ошибка генерации кода:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

