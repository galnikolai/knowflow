import { supabase } from "./supabase";

export type Learnspace = {
  id: string;
  name: string;
  noteIds: string[];
  created_at: string;
};

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

export async function removeLearnspace(id: string) {
  const { error } = await supabase.from("learnspaces").delete().eq("id", id);
  if (error) throw error;
}
