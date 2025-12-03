import type { Flashcard } from "@/entities/card/Card";
import { supabase } from "./supabase";

export async function getFlashcards(userId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (
    data?.map((row) => ({
      id: row.id,
      nodeId: row.node_id,
      question: row.question,
      answer: row.answer,
      nextReview: new Date(row.next_review).getTime(),
      interval: row.interval,
      repetitions: row.repetitions,
      easeFactor: row.ease_factor,
    })) || []
  );
}

export async function addFlashcard(
  userId: string,
  card: Omit<Flashcard, "id">
) {
  const { error } = await supabase.from("flashcards").insert({
    user_id: userId,
    node_id: card.nodeId,
    question: card.question,
    answer: card.answer,
    next_review: new Date(card.nextReview).toISOString(),
    interval: card.interval,
    repetitions: card.repetitions,
    ease_factor: card.easeFactor,
  });
  if (error) throw error;
}

export async function updateFlashcard(id: string, update: Partial<Flashcard>) {
  const { error } = await supabase
    .from("flashcards")
    .update({
      ...("nodeId" in update ? { node_id: update.nodeId } : {}),
      ...("question" in update ? { question: update.question } : {}),
      ...("answer" in update ? { answer: update.answer } : {}),
      ...("nextReview" in update
        ? { next_review: new Date(update.nextReview!).toISOString() }
        : {}),
      ...("interval" in update ? { interval: update.interval } : {}),
      ...("repetitions" in update ? { repetitions: update.repetitions } : {}),
      ...("easeFactor" in update ? { ease_factor: update.easeFactor } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function removeFlashcard(id: string) {
  const { error } = await supabase.from("flashcards").delete().eq("id", id);
  if (error) throw error;
}
