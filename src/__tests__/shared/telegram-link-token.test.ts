import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createTelegramLinkToken,
  verifyTelegramLinkToken,
} from "@/shared/api/telegram-link-token";

describe("telegram link token", () => {
  beforeEach(() => {
    process.env.TELEGRAM_LINK_SECRET = "test-link-secret";
  });

  it("создаёт и проверяет валидный токен", () => {
    const token = createTelegramLinkToken("user-abc-123");
    expect(verifyTelegramLinkToken(token)).toBe("user-abc-123");
  });

  it("отклоняет подделанный токен", () => {
    expect(verifyTelegramLinkToken("invalid-token")).toBeNull();
  });

  it("отклоняет просроченный токен", () => {
    const token = createTelegramLinkToken("user-abc-123");
    // Симулируем истечение срока
    vi.useFakeTimers();
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(verifyTelegramLinkToken(token)).toBeNull();
    vi.useRealTimers();
  });
});
