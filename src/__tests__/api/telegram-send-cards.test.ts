import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";

const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  return { mockFrom };
});

vi.mock("@/shared/api/supabase.server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/shared/api/telegram", () => ({
  getDueFlashcardsForUser: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/shared/api/telegram-bot.server", () => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

import handler from "../../../pages/api/telegram/send-cards";

describe("POST /api/telegram/send-cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_CRON_SECRET = "test-cron-secret";
  });

  it("возвращает 405 при GET-запросе", async () => {
    const { req, res } = createMocks({ method: "GET" });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it("возвращает 503 если TELEGRAM_CRON_SECRET не задан", async () => {
    delete process.env.TELEGRAM_CRON_SECRET;
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: "Bearer test-cron-secret" },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(503);
  });

  it("возвращает 401 при неверном токене", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    });
    await handler(req, res);
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
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body.message).toContain("Нет активных пользователей");
  });
});
