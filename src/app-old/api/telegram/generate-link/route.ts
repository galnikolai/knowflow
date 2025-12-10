/**
 * API endpoint для генерации кода привязки Telegram
 * Вызывается из приложения для получения кода привязки
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/shared/api/supabase";
import { getTelegramUserByUserId } from "@/shared/api/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId обязателен" },
        { status: 400 }
      );
    }

    // Проверяем, не привязан ли уже Telegram
    const existing = await getTelegramUserByUserId(userId);
    if (existing) {
      return NextResponse.json({
        linked: true,
        telegramUserId: existing.telegramUserId,
        message: "Telegram уже привязан",
      });
    }

    // Генерируем временный код (в продакшене лучше использовать более безопасный подход)
    // Для простоты используем userId как код, но можно добавить таблицу временных кодов
    const linkCode = userId;

    return NextResponse.json({
      linked: false,
      linkCode,
      instructions: `Отправьте боту команду: /link ${linkCode}`,
    });
  } catch (error) {
    console.error("Ошибка генерации кода:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

