import type { NextApiRequest, NextApiResponse } from "next";
import type {
  GenerateFlashcardsOptions,
  FlashcardData,
} from "@/shared/api/ai-generator";
import { createAIProvider } from "@/shared/api/ai-generator";
import { requireApiUser } from "@/shared/api/auth.server";
import { checkRateLimit } from "@/shared/api/rate-limit.server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ cards: FlashcardData[] } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;

  const rate = checkRateLimit(req, { userId: user.id, limit: 10, windowMs: 60_000 });
  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfterSec));
    return res.status(429).json({ error: "Слишком много запросов. Попробуйте позже." });
  }

  try {
    const {
      content,
      provider = "ollama",
      model,
      count,
    } = req.body as GenerateFlashcardsOptions;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Контент не может быть пустым" });
    }

    const apiKey =
      provider === "openai"
        ? process.env.OPENAI_API_KEY
        : provider === "anthropic"
        ? process.env.ANTHROPIC_API_KEY
        : undefined;

    if (provider !== "ollama" && !apiKey) {
      return res
        .status(500)
        .json({ error: `API ключ для ${provider} не настроен` });
    }

    const aiProvider = createAIProvider(provider, apiKey);
    const cards = await aiProvider.generateFlashcards(content, {
      count,
      model,
    });

    return res.status(200).json({ cards });
  } catch (error) {
    console.error("Ошибка генерации флеш-карточек:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Произошла ошибка при генерации флеш-карточек",
    });
  }
}
