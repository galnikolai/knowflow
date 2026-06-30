import { describe, it, expect, vi } from "vitest";
import { createMocks } from "node-mocks-http";
import { requireApiUser } from "@/shared/api/auth.server";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  })),
}));

describe("requireApiUser", () => {
  it("возвращает 401 без заголовка Authorization", async () => {
    const { req, res } = createMocks({ method: "POST" });
    const user = await requireApiUser(req, res);
    expect(user).toBeNull();
    expect(res._getStatusCode()).toBe(401);
  });

  it("возвращает пользователя при валидном Bearer токене", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: "Bearer valid-jwt-token" },
    });
    const user = await requireApiUser(req, res);
    expect(user?.id).toBe("user-1");
  });
});
