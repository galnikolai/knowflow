import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 минут

function getLinkSecret(): string {
  const secret =
    process.env.TELEGRAM_LINK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error(
      "TELEGRAM_LINK_SECRET или SUPABASE_SERVICE_ROLE_KEY не задан"
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getLinkSecret()).update(payload).digest("hex");
}

/**
 * Создаёт одноразовый токен привязки Telegram (userId + срок действия + HMAC).
 */
export function createTelegramLinkToken(userId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}.${exp}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

/**
 * Проверяет токен привязки. Возвращает userId или null.
 */
export function verifyTelegramLinkToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return null;

    const payload = decoded.slice(0, lastDot);
    const signature = decoded.slice(lastDot + 1);
    const expected = sign(payload);

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const [userId, expStr] = payload.split(".");
    const exp = Number(expStr);
    if (!userId || !exp || Date.now() > exp) return null;

    return userId;
  } catch {
    return null;
  }
}
