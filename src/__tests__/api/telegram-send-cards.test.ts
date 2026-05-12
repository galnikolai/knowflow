import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";

// Env vars are set in setup.ts before module init

const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  return { mockFrom };
});

vi.mock("node-telegram-bot-api", () => {
  class BotMock {
    sendMessage = vi.fn().mockResolvedValue({});
  }
  return { default: BotMock };
});

vi.mock("@/shared/api/supabase.server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/shared/api/telegram", () => ({
  getDueFlashcardsForUser: vi.fn().mockResolvedValue([]),
  getTelegramUserByTelegramId: vi.fn().mockResolvedValue(null),
}));

import handler from "../../../pages/api/telegram/send-cards";

describe("POST /api/telegram/send-cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("возвращает 405 при GET-запросе", async () => {
    const { req, res } = createMocks({ method: "GET" });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(405);
  });

  it("возвращает 401 при неверном токене", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  it("возвращает 200 когда нет активных пользователей", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: "Bearer test-cron-secret" },
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body.message).toContain("Нет активных пользователей");
  });
});
