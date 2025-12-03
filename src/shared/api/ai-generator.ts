/**
 * API для генерации флеш-карточек из заметок с помощью AI
 *
 * Поддерживаемые провайдеры:
 * - OpenAI (GPT-4o, GPT-4o-mini)
 * - Anthropic (Claude)
 * - Ollama (локально)
 */

export interface FlashcardData {
  question: string;
  answer: string;
}

export interface GenerateFlashcardsOptions {
  content: string;
  provider?: "openai" | "anthropic" | "ollama";
  model?: string;
  count?: number; // Количество карточек (по умолчанию 5-10)
}

export interface AIProvider {
  generateFlashcards(
    content: string,
    options?: { count?: number; model?: string }
  ): Promise<FlashcardData[]>;
}

/**
 * Генерирует улучшенный промпт для создания качественных флеш-карточек
 */
function createQualityPrompt(content: string, count: number): string {
  return `Ты - эксперт по созданию эффективных флеш-карточек для запоминания информации. Твоя задача - создать ${count} высококачественных карточек на основе предоставленного материала.

МАТЕРИАЛ ДЛЯ ИЗУЧЕНИЯ:
${content}

ТРЕБОВАНИЯ К КАЧЕСТВУ ВОПРОСОВ:

1. ТИПЫ ВОПРОСОВ (используй разнообразие):
   - Концептуальные: проверяют понимание идей и принципов
   - Фактические: проверяют знание конкретных фактов, дат, определений
   - Прикладные: проверяют умение применять знания в практических ситуациях
   - Сравнительные: просят сравнить, противопоставить или связать концепции
   - Причинно-следственные: проверяют понимание связей и зависимостей

2. КРИТЕРИИ ХОРОШИХ ВОПРОСОВ:
   ✓ Конкретные и однозначные (можно дать четкий ответ)
   ✓ Проверяют понимание, а не просто память
   ✓ Фокусируются на важной информации
   ✓ Избегают тривиальных деталей
   ✓ Используют активную формулировку
   ✓ Один вопрос = одна концепция/факт

3. ЧТО ИЗБЕГАТЬ:
   ✗ Вопросы типа "Что такое...?" для простых определений (лучше: "Каковы ключевые характеристики...?")
   ✗ Слишком общие вопросы без контекста
   ✗ Вопросы с несколькими правильными ответами без уточнения
   ✗ Тривиальные детали, не несущие смысловой нагрузки

ТРЕБОВАНИЯ К КАЧЕСТВУ ОТВЕТОВ:

1. СТРУКТУРА ОТВЕТА:
   - Начинай с прямого ответа на вопрос
   - Добавляй ключевые детали и контекст
   - Включай важные примеры или пояснения (если уместно)
   - Завершай связью с общей темой (если применимо)

2. ОБЪЕМ И ДЕТАЛИЗАЦИЯ:
   - 1-3 предложения для простых фактов
   - 2-4 предложения для концепций
   - До 5 предложений для сложных тем
   - Достаточно информации для полного понимания, но без избыточности

3. ТОЧНОСТЬ:
   - Используй точную терминологию из материала
   - Сохраняй важные цифры, даты, названия
   - Избегай упрощений, которые искажают смысл
   - Если есть несколько аспектов - упомяни ключевые

4. ЯСНОСТЬ:
   - Понятный язык без лишней сложности
   - Логичная структура мысли
   - Конкретные формулировки вместо абстрактных

ПРИМЕРЫ ХОРОШИХ КАРТОЧЕК:

ПЛОХОЙ пример:
Q: "Что такое фотосинтез?"
A: "Фотосинтез - это процесс."

ХОРОШИЙ пример:
Q: "Какие два основных продукта образуются в результате фотосинтеза и как они используются растением?"
A: "В результате фотосинтеза образуются глюкоза (C₆H₁₂O₆) и кислород (O₂). Глюкоза используется растением как источник энергии для метаболизма и как строительный материал для роста. Кислород выделяется в атмосферу как побочный продукт."

ПЛОХОЙ пример:
Q: "Когда была Вторая мировая война?"
A: "1939-1945."

ХОРОШИЙ пример:
Q: "Какие ключевые события привели к началу Второй мировой войны в 1939 году?"
A: "Вторую мировую войну спровоцировали агрессивная экспансия нацистской Германии, аннексия Австрии и Чехословакии, пакт Молотова-Риббентропа о разделе Восточной Европы, и нападение Германии на Польшу 1 сентября 1939 года, что привело к объявлению войны со стороны Великобритании и Франции."

ИНСТРУКЦИИ ПО СОЗДАНИЮ:

1. Проанализируй материал и выдели ${count} ключевых концепций/фактов
2. Для каждой концепции создай вопрос, который проверяет понимание
3. Сформулируй полный, информативный ответ
4. Убедись, что вопросы покрывают разные аспекты материала
5. Приоритизируй важную информацию над второстепенной

ФОРМАТ ОТВЕТА (ТОЛЬКО JSON, без markdown):
{
  "cards": [
    {
      "question": "Вопрос",
      "answer": "Ответ"
    }
  ]
}

ВАЖНО: 
- Верни ТОЛЬКО валидный JSON объект
- Без markdown блоков, без комментариев, без дополнительного текста
- Экранируй специальные символы в строках (кавычки, переносы строк)
- Создай ровно ${count} карточек высокого качества`;
}

// OpenAI провайдер
class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL || "https://api.openai.com/v1";
  }

  async generateFlashcards(
    content: string,
    options?: { count?: number; model?: string }
  ): Promise<FlashcardData[]> {
    const model = options?.model || "gpt-4o-mini";
    const count = options?.count || 8;

    const prompt = createQualityPrompt(content, count);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Ошибка OpenAI API");
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Пустой ответ от OpenAI");
      }

      const parsed = JSON.parse(content);
      return parsed.cards || [];
    } catch (error) {
      console.error("Ошибка генерации флеш-карточек через OpenAI:", error);
      throw error;
    }
  }
}

// Anthropic провайдер
class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL || "https://api.anthropic.com/v1";
  }

  async generateFlashcards(
    content: string,
    options?: { count?: number; model?: string }
  ): Promise<FlashcardData[]> {
    const model = options?.model || "claude-3-5-sonnet-20241022";
    const count = options?.count || 8;

    const prompt = createQualityPrompt(content, count);

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Ошибка Anthropic API");
      }

      const data = await response.json();
      const content = data.content[0]?.text;

      if (!content) {
        throw new Error("Пустой ответ от Anthropic");
      }

      const parsed = JSON.parse(content);
      return parsed.cards || [];
    } catch (error) {
      console.error("Ошибка генерации флеш-карточек через Anthropic:", error);
      throw error;
    }
  }
}

// Ollama провайдер (локально)
class OllamaProvider implements AIProvider {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || "http://localhost:11434";
  }

  async generateFlashcards(
    content: string,
    options?: { count?: number; model?: string }
  ): Promise<FlashcardData[]> {
    const model = options?.model || "llama3.2";
    const count = options?.count || 8;

    const prompt = createQualityPrompt(content, count);

    try {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка Ollama API. Убедитесь, что Ollama запущен.");
      }

      const data = await response.json();
      const content = data.response;

      if (!content) {
        throw new Error("Пустой ответ от Ollama");
      }

      // Функция для исправления распространенных ошибок в JSON
      const fixJSON = (jsonStr: string): string => {
        // Удаляем markdown code blocks если есть
        let fixed = jsonStr
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        // Находим JSON объект (может быть обернут в текст)
        const jsonMatch = fixed.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Не удалось найти JSON в ответе");
        }

        fixed = jsonMatch[0];

        // Исправляем распространенные ошибки:
        // 1. Удаляем trailing commas перед закрывающими скобками
        fixed = fixed.replace(/,(\s*[}\]])/g, "$1");

        // 2. Исправляем незакрытые строки (если есть)
        // 3. Удаляем комментарии (если есть)
        fixed = fixed.replace(/\/\/.*$/gm, "");
        fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, "");

        return fixed;
      };

      // Пытаемся извлечь и исправить JSON
      let parsed;
      try {
        const fixedJSON = fixJSON(content);
        parsed = JSON.parse(fixedJSON);
      } catch (parseError) {
        // Если не удалось исправить, логируем оригинальный ответ для отладки
        console.error("Ошибка парсинга JSON от Ollama:", parseError);
        console.error("Оригинальный ответ:", content);

        // Попробуем более агрессивное извлечение JSON
        try {
          // Ищем только массив cards
          const cardsMatch = content.match(/\[[\s\S]*?\]/);
          if (cardsMatch) {
            const fixedCards = fixJSON(cardsMatch[0]);
            const cards = JSON.parse(fixedCards);
            return Array.isArray(cards) ? cards : [];
          }

          // Если не нашли массив, пробуем найти объекты с question и answer
          const questionMatches = Array.from(
            content.matchAll(/"question"\s*:\s*"([^"]+)"/g)
          ) as RegExpMatchArray[];
          const answerMatches = Array.from(
            content.matchAll(/"answer"\s*:\s*"([^"]+)"/g)
          ) as RegExpMatchArray[];

          const questions = questionMatches.map((m) => m[1]);
          const answers = answerMatches.map((m) => m[1]);

          if (questions.length > 0 && answers.length > 0) {
            const minLength = Math.min(questions.length, answers.length);
            return questions.slice(0, minLength).map((q, i) => ({
              question: q,
              answer: answers[i] || "",
            }));
          }

          throw new Error(
            `Не удалось распарсить JSON от Ollama. Ошибка: ${
              parseError instanceof Error
                ? parseError.message
                : String(parseError)
            }`
          );
        } catch {
          throw new Error(
            `Не удалось извлечь флеш-карточки из ответа Ollama. Возможно, модель вернула некорректный JSON. Попробуйте другую модель или проверьте ответ модели.`
          );
        }
      }

      // Проверяем структуру ответа
      if (parsed.cards && Array.isArray(parsed.cards)) {
        return parsed.cards;
      } else if (Array.isArray(parsed)) {
        return parsed;
      } else {
        throw new Error("Неожиданная структура JSON от Ollama");
      }
    } catch (error) {
      console.error("Ошибка генерации флеш-карточек через Ollama:", error);
      throw error;
    }
  }
}

// Фабрика провайдеров
export function createAIProvider(
  provider: "openai" | "anthropic" | "ollama",
  apiKey?: string,
  baseURL?: string
): AIProvider {
  switch (provider) {
    case "openai":
      if (!apiKey) {
        throw new Error("OpenAI API ключ не указан");
      }
      return new OpenAIProvider(apiKey, baseURL);
    case "anthropic":
      if (!apiKey) {
        throw new Error("Anthropic API ключ не указан");
      }
      return new AnthropicProvider(apiKey, baseURL);
    case "ollama":
      return new OllamaProvider(baseURL);
    default:
      throw new Error(`Неизвестный провайдер: ${provider}`);
  }
}

// Основная функция для генерации флеш-карточек (клиентская)
// Использует API route для безопасности
export async function generateFlashcards(
  options: GenerateFlashcardsOptions
): Promise<FlashcardData[]> {
  const response = await fetch("/api/generate-flashcards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Ошибка генерации флеш-карточек");
  }

  const data = await response.json();
  return data.cards || [];
}
