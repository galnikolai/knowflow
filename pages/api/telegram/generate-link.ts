import type { NextApiRequest, NextApiResponse } from "next";
import { getTelegramUserByUserId } from "@/shared/api/telegram";
import { supabaseAdmin } from "@/shared/api/supabase.server";
import { requireApiUser } from "@/shared/api/auth.server";
import { createTelegramLinkToken } from "@/shared/api/telegram-link-token";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;

  try {
    const existing = await getTelegramUserByUserId(user.id, supabaseAdmin);
    if (existing) {
      return res.status(200).json({
        linked: true,
        telegramUserId: existing.telegramUserId,
        message: "Telegram уже привязан",
      });
    }

    const linkCode = createTelegramLinkToken(user.id);

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
