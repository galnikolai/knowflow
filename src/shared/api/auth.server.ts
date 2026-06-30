import { createClient, type User } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, anonKey);
}

/**
 * Проверяет JWT из заголовка Authorization: Bearer <token>.
 * Возвращает пользователя или отправляет 401 и возвращает null.
 */
export async function requireApiUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const supabase = getSupabaseAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return user;
}
