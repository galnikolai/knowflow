import { create } from "zustand";
import * as api from "@/shared/api/flashcards";
import { useUserStore } from "@/shared/store/useUserStore";

type Flashcard = api.Flashcard;

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

interface FlashcardsStore {
  cards: Flashcard[];
  loading: boolean;
  error: string | null;
  hydratedUserId: string | null;
  fetchCards: (opts?: { force?: boolean }) => Promise<void>;
  reviewCard: (id: string, grade: 0 | 3 | 5) => Promise<void>;
  addCards: (cards: Omit<Flashcard, "id">[]) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  getDueCards: () => Flashcard[];
  getDueCardsForNotes: (noteIds: string[]) => Flashcard[];
}

export const useFlashcardsStore = create<FlashcardsStore>((set, get) => ({
  cards: [],
  loading: false,
  error: null,
  hydratedUserId: null,

  fetchCards: async (opts) => {
    const user = useUserStore.getState().user;
    if (!user) {
      set({ cards: [], loading: false, error: null, hydratedUserId: null });
      return;
    }
    if (!opts?.force && get().hydratedUserId === user.id) return;

    set({ loading: true, error: null });
    try {
      const cards = await api.getFlashcards(user.id);
      set({ cards, hydratedUserId: user.id });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), hydratedUserId: null });
    } finally {
      set({ loading: false });
    }
  },

  addCards: async (newCards) => {
    const user = useUserStore.getState().user;
    if (!user) throw new Error("Нет пользователя");
    await Promise.all(newCards.map((c) => api.addFlashcard(user.id, c)));
    await useFlashcardsStore.getState().fetchCards({ force: true });
  },

  removeCard: async (id) => {
    await api.removeFlashcard(id);
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
  },

  reviewCard: async (id, grade) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return;
    const updated = getNextSM2(card, grade);
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? updated : c)),
    }));
    await api.updateFlashcard(id, updated);
  },

  getDueCards: () => get().cards.filter((c) => c.nextReview <= Date.now()),

  getDueCardsForNotes: (noteIds) =>
    get().cards.filter(
      (c) => c.nodeId && noteIds.includes(c.nodeId) && c.nextReview <= Date.now()
    ),
}));
