import { supabase } from "./supabase";

export interface NoteLink {
  id: string;
  sourceId: string;
  targetId: string;
  strength: number;
  label?: string;
  isManual: boolean;
}

export async function getNoteLinks(userId: string): Promise<NoteLink[]> {
  const { data, error } = await supabase
    .from("note_links")
    .select("id, source_id, target_id, strength, label, is_manual")
    .eq("user_id", userId);
  if (error) {
    console.warn("getNoteLinks error:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    sourceId: r.source_id as string,
    targetId: r.target_id as string,
    strength: r.strength as number,
    label: r.label as string | undefined,
    isManual: r.is_manual as boolean,
  }));
}

export async function upsertNoteLinks(
  userId: string,
  links: Omit<NoteLink, "id" | "isManual">[]
): Promise<void> {
  if (!links.length) return;
  const rows = links.map((l) => ({
    user_id: userId,
    source_id: l.sourceId,
    target_id: l.targetId,
    strength: l.strength,
    label: l.label ?? null,
    is_manual: false,
  }));
  const { error } = await supabase
    .from("note_links")
    .upsert(rows, { onConflict: "user_id,source_id,target_id" });
  if (error) console.warn("upsertNoteLinks error:", error.message);
}

export async function generateAndSaveLinks(
  userId: string,
  notes: { id: string; title: string; content?: string | null }[],
  apiKey?: string,
  provider?: string
): Promise<NoteLink[]> {
  const res = await fetch("/api/generate-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes, provider: provider ?? "local", apiKey }),
  });
  if (!res.ok) return [];
  const { links } = (await res.json()) as {
    links: { sourceId: string; targetId: string; strength: number; label?: string }[];
  };
  await upsertNoteLinks(userId, links);
  return links.map((l, i) => ({ ...l, id: `ai-${i}`, isManual: false }));
}
