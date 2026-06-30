import { describe, it, expect, vi } from "vitest";
import {
  getTelegramUserByUserId,
  getTelegramUserByTelegramId,
  reviewFlashcard,
} from "@/shared/api/telegram";
import type { SupabaseClient } from "@supabase/supabase-js";

function makeClient(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return { from: vi.fn().mockReturnValue(chain), ...chain } as unknown as SupabaseClient;
}

describe("telegram API helpers", () => {
  it("getTelegramUserByUserId возвращает null при PGRST116", async () => {
    const client = makeClient({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      }),
    });
    const result = await getTelegramUserByUserId("user-1", client);
    expect(result).toBeNull();
  });

  it("getTelegramUserByUserId выбрасывает ошибку для прочих кодов", async () => {
    const client = makeClient({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "42P01", message: "relation does not exist" },
      }),
    });
    await expect(getTelegramUserByUserId("user-1", client)).rejects.toBeTruthy();
  });

  it("getTelegramUserByTelegramId маппирует поля snake_case → camelCase", async () => {
    const rawRow = {
      id: "uuid-1",
      user_id: "user-uuid",
      telegram_user_id: 12345,
      telegram_username: "testuser",
      telegram_first_name: "Test",
      telegram_last_name: "User",
      is_active: true,
      notification_time: "09:00:00",
      timezone: "UTC",
      daily_limit: 10,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };
    const client = makeClient({
      single: vi.fn().mockResolvedValue({ data: rawRow, error: null }),
    });
    const result = await getTelegramUserByTelegramId(12345, client);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user-uuid");
    expect(result?.telegramUserId).toBe(12345);
    expect(result?.isActive).toBe(true);
    expect(result?.dailyLimit).toBe(10);
  });
});

describe("reviewFlashcard SM-2", () => {
  it("сбрасывает интервал при оценке 0", async () => {
    const rawCard = {
      id: "card-1",
      interval: 10,
      repetitions: 3,
      ease_factor: 2.5,
    };
    const chain = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: rawCard, error: null }),
    };
    const client = { from: vi.fn().mockReturnValue(chain) } as unknown as SupabaseClient;

    chain.eq.mockImplementation(() => ({
      ...chain,
      single: vi.fn().mockResolvedValue({ data: rawCard, error: null }),
    }));
    chain.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    await reviewFlashcard("card-1", 0, client);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ interval: 1, repetitions: 0 })
    );
  });
});
