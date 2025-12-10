import { NextRequest, NextResponse } from "next/server";
import type { GenerateFlashcardsOptions, FlashcardData } from "@/shared/api/ai-generator";
import { createAIProvider } from "@/shared/api/ai-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, provider = "ollama", model, count } = body as GenerateFlashcardsOptions;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Контент не может быть пустым" },
        { status: 400 }
      );
    }

    // Получаем API ключи из переменных окружения сервера
    const apiKey =
      provider === "openai"
        ? process.env.OPENAI_API_KEY
        : provider === "anthropic"
        ? process.env.ANTHROPIC_API_KEY
        : undefined;

    if (provider !== "ollama" && !apiKey) {
      return NextResponse.json(
        { error: `API ключ для ${provider} не настроен` },
        { status: 500 }
      );
    }

    const aiProvider = createAIProvider(provider, apiKey);
    const cards = await aiProvider.generateFlashcards(content, { count, model });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Ошибка генерации флеш-карточек:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при генерации флеш-карточек",
      },
      { status: 500 }
    );
  }
}

