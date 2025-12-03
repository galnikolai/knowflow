import { supabase } from "./supabase";
import type { Learnspace } from "@/shared/store/useLearnspacesStore";

export async function getLearnspaces(userId: string): Promise<Learnspace[]> {
  const { data, error } = await supabase
    .from("learnspaces")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    data?.map((row) => ({
      id: row.id,
      name: row.name,
      noteIds: row.note_ids || [],
      created_at: row.created_at,
    })) || []
  );
}

export async function addLearnspace(
  userId: string,
  learnspace: Omit<Learnspace, "id" | "created_at">
) {
  const { data, error } = await supabase
    .from("learnspaces")
    .insert({
      user_id: userId,
      name: learnspace.name,
      note_ids: learnspace.noteIds,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    noteIds: data.note_ids || [],
    created_at: data.created_at,
  } as Learnspace;
}

export async function updateLearnspace(
  id: string,
  update: Partial<Omit<Learnspace, "id" | "created_at">>
) {
  const { data, error } = await supabase
    .from("learnspaces")
    .update({
      ...("name" in update ? { name: update.name } : {}),
      ...("noteIds" in update ? { note_ids: update.noteIds } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    noteIds: data.note_ids || [],
    created_at: data.created_at,
  } as Learnspace;
}

export async function removeLearnspace(id: string) {
  const { error } = await supabase.from("learnspaces").delete().eq("id", id);
  if (error) throw error;
}
