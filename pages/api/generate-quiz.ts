import type { NextApiRequest, NextApiResponse } from "next";
import { createAIProvider } from "@/shared/api/ai-generator";

export interface QuizQuestion {
  type: "multiple_choice" | "true_false";
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

interface GenerateQuizBody {
  content: string;
  count?: number;
  provider?: "openai" | "anthropic" | "ollama";
  model?: string;
}

function buildQuizPrompt(content: string, count: number): string {
  return `Ты — эксперт по созданию образовательных тестов. Создай ${count} вопросов на основе материала ниже.

МАТЕРИАЛ:
${content}

ТИПЫ ВОПРОСОВ:
1. multiple_choice — 4 варианта ответа, только один правильный
2. true_false — утверждение с ответом "Верно" или "Неверно"

Используй оба типа (примерно 70% multiple_choice, 30% true_false).

ТРЕБОВАНИЯ:
- Вопросы проверяют понимание, а не тривиальные детали
- Неправильные варианты должны быть правдоподобными
- Для каждого вопроса добавь краткое объяснение правильного ответа (1-2 предложения)
- Избегай очевидных ответов

ФОРМАТ — только валидный JSON:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Вопрос?",
      "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D"],
      "answer": "Вариант A",
      "explanation": "Краткое объяснение"
    },
    {
      "type": "true_false",
      "question": "Утверждение...",
      "answer": "Верно",
      "explanation": "Краткое объяснение"
    }
  ]
}

ВАЖНО: только JSON, без markdown, без комментариев, ровно ${count} вопросов.`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ questions: QuizQuestion[] } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      content,
      count = 8,
      provider = "ollama",
      model,
    } = req.body as GenerateQuizBody;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Контент не может быть пустым" });
    }

    const apiKey =
      provider === "openai"
        ? process.env.OPENAI_API_KEY
        : provider === "anthropic"
        ? process.env.ANTHROPIC_API_KEY
        : undefined;

    if (provider !== "ollama" && !apiKey) {
      return res.status(500).json({ error: `API ключ для ${provider} не настроен` });
    }

    const prompt = buildQuizPrompt(content, count);

    // Reuse AI providers from ai-generator — but we need raw text output.
    // So we call the underlying model directly through the existing provider.
    const aiProvider = createAIProvider(provider, apiKey);

    // We call generateFlashcards with our custom prompt embedded in content
    // and then parse result ourselves. Simpler: duplicate minimal fetch here.
    const baseURL =
      provider === "openai"
        ? "https://api.openai.com/v1"
        : provider === "anthropic"
        ? "https://api.anthropic.com/v1"
        : "http://localhost:11434";

    let rawText = "";

    if (provider === "openai") {
      const r = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });
      const data = await r.json();
      rawText = data.choices?.[0]?.message?.content ?? "";
    } else if (provider === "anthropic") {
      const r = await fetch(`${baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await r.json();
      rawText = data.content?.[0]?.text ?? "";
    } else {
      // Ollama
      const r = await fetch(`${baseURL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "llama3.2",
          prompt,
          stream: false,
          options: { temperature: 0.7 },
        }),
      });
      const data = await r.json();
      rawText = data.response ?? "";
    }

    // Strip markdown fences if present
    const cleaned = rawText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Не удалось извлечь JSON из ответа модели");

    const parsed = JSON.parse(jsonMatch[0]);
    const questions: QuizQuestion[] = parsed.questions ?? [];

    // Validate structure
    const valid = questions.filter(
      (q) =>
        q.type &&
        q.question &&
        q.answer &&
        (q.type !== "multiple_choice" || (Array.isArray(q.options) && q.options.length >= 2))
    );

    return res.status(200).json({ questions: valid });
  } catch (err) {
    console.error("Quiz generation error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Ошибка генерации квиза",
    });
  }
}
