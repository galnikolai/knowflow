import { describe, it, expect, vi } from "vitest";
import { createMocks } from "node-mocks-http";

vi.mock("@/shared/api/ai-generator", () => ({
  createAIProvider: vi.fn(() => ({
    generateFlashcards: vi.fn().mockResolvedValue([
      { question: "Что такое React?", answer: "Библиотека для UI" },
      { question: "Что такое хук?", answer: "Функция, дающая доступ к состоянию" },
    ]),
  })),
}));

vi.mock("@/shared/api/auth.server", () => ({
  requireApiUser: vi.fn().mockResolvedValue({ id: "test-user-id" }),
}));

import handler from "../../../pages/api/generate-flashcards";
import { requireApiUser } from "@/shared/api/auth.server";

describe("POST /api/generate-flashcards", () => {
  it("возвращает 405 при GET-запросе", async () => {
    const { req, res } = createMocks({ method: "GET" });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it("возвращает 401 без авторизации", async () => {
    vi.mocked(requireApiUser).mockImplementationOnce(async (_req, res) => {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    });
    const { req, res } = createMocks({
      method: "POST",
      body: { content: "Текст" },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it("возвращает 400 при пустом контенте", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { content: "   " },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).error).toBeTruthy();
  });

  it("возвращает карточки при валидном запросе", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { content: "Текст для генерации карточек", provider: "ollama" },
    });
    await handler(req, res);
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
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
  });
});
