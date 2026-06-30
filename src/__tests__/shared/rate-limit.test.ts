import { describe, it, expect } from "vitest";
import { createMocks } from "node-mocks-http";
import { checkRateLimit } from "@/shared/api/rate-limit.server";

describe("rate limit", () => {
  it("разрешает запросы в пределах лимита", () => {
    const { req } = createMocks({ method: "POST" });
    const first = checkRateLimit(req, { userId: "user-1", limit: 3, windowMs: 60_000 });
    const second = checkRateLimit(req, { userId: "user-1", limit: 3, windowMs: 60_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("блокирует запросы сверх лимита", () => {
    const { req } = createMocks({ method: "POST" });
    checkRateLimit(req, { userId: "user-2", limit: 2, windowMs: 60_000 });
    checkRateLimit(req, { userId: "user-2", limit: 2, windowMs: 60_000 });
    const blocked = checkRateLimit(req, { userId: "user-2", limit: 2, windowMs: 60_000 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
