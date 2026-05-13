import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";

// Mock the AI provider before importing the handler
vi.mock("@/shared/api/ai-generator", () => ({
  createAIProvider: vi.fn(() => ({
    generateFlashcards: vi.fn().mockResolvedValue([
      { question: "Что такое React?", answer: "Библиотека для UI" },
      { question: "Что такое хук?", answer: "Функция, дающая доступ к состоянию" },
    ]),
  })),
}));

import handler from "../../../pages/api/generate-flashcards";

describe("POST /api/generate-flashcards", () => {
  it("возвращает 405 при GET-запросе", async () => {
    const { req, res } = createMocks({ method: "GET" });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(405);
  });

  it("возвращает 400 при пустом контенте", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { content: "   " },
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).error).toBeTruthy();
  });

  it("возвращает карточки при валидном запросе", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { content: "Текст для генерации карточек", provider: "ollama" },
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const body = JSON.parse(res._getData());
    expect(Array.isArray(body.cards)).toBe(true);
    expect(body.cards.length).toBeGreaterThan(0);
    expect(body.cards[0]).toHaveProperty("question");
    expect(body.cards[0]).toHaveProperty("answer");
  });

  it("возвращает 500 если провайдер не ollama и нет API-ключа", async () => {
    delete process.env.OPENAI_API_KEY;
    const { req, res } = createMocks({
      method: "POST",
      body: { content: "Текст", provider: "openai" },
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(500);
  });
});
