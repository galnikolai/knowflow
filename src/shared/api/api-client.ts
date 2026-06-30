import { supabase } from "./supabase";

/** Заголовки с JWT для защищённых API routes. */
export async function getAuthHeaders(
  extra: HeadersInit = {}
): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
    ...extra,
  };
}
