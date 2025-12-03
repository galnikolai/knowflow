import { supabase } from "./supabase";

export type Note = {
  id: string;
  user_id: string;
  parent_id: string | null;
  node_id: string | null;
  title: string;
  content: string | null;
  is_folder: boolean;
  created_at: string;
  updated_at: string;
};

export async function getNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data || [];
}

export async function addNote(
  note: Omit<Note, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("notes")
    .insert(note)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(
  id: string,
  update: Partial<Omit<Note, "id" | "user_id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("notes")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function removeNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
