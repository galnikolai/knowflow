import { create } from "zustand";
import type { Flashcard } from "@/entities/card/Card";
import * as api from "@/shared/api/flashcards";
import { useUserStore } from "@/shared/store/useUserStore";

interface FlashcardsStore {
  cards: Flashcard[];
  loading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  addCard: (card: Omit<Flashcard, "id">) => Promise<void>;
  updateCard: (id: string, update: Partial<Flashcard>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  reviewCard: (id: string, grade: 0 | 3 | 5) => Promise<void>;
  getDueCards: () => Flashcard[];
}

function getNextSM2(card: Flashcard, grade: 0 | 3 | 5): Flashcard {
  let { interval, repetitions, easeFactor } = card;
  if (grade === 0) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
    );
  }
  return {
    ...card,
    interval,
    repetitions,
    easeFactor,
    nextReview: Date.now() + interval * 24 * 60 * 60 * 1000,
  };
}

export const useFlashcardsStore = create<FlashcardsStore>((set, get) => ({
  cards: [],
  loading: false,
  error: null,
  fetchCards: async () => {
    set({ loading: true, error: null });
    try {
      const user = useUserStore.getState().user;
      if (!user) throw new Error("Нет пользователя");
      const cards = await api.getFlashcards(user.id);
      set({ cards });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },
  addCard: async (card) => {
    set({ loading: true, error: null });
    try {
      const user = useUserStore.getState().user;
      if (!user) throw new Error("Нет пользователя");
      await api.addFlashcard(user.id, card);
      await get().fetchCards();
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },
  updateCard: async (id, update) => {
    set({ loading: true, error: null });
    try {
      await api.updateFlashcard(id, update);
      await get().fetchCards();
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },
  removeCard: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.removeFlashcard(id);
      await get().fetchCards();
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },
  reviewCard: async (id, grade) => {
    set({ loading: true, error: null });
    try {
      const card = get().cards.find((c) => c.id === id);
      if (!card) throw new Error("Карточка не найдена");
      const updated = getNextSM2(card, grade);
      await api.updateFlashcard(id, updated);
      await get().fetchCards();
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },
  getDueCards: () => get().cards.filter((c) => c.nextReview <= Date.now()),
}));
