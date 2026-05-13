import { create } from "zustand";
import * as api from "@/shared/api/flashcards";
import { useUserStore } from "@/shared/store/useUserStore";
import { readCache, writeCache } from "@/shared/cache/asyncCache";

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

function cacheKey(userId: string) {
  return `flashcards_cache_${userId}`;
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

    // Populate from cache for instant UI
    if (get().cards.length === 0) {
      const cached = await readCache<Flashcard[]>(cacheKey(user.id));
      if (cached) set({ cards: cached });
    }

    set({ loading: true, error: null });
    try {
      const cards = await api.getFlashcards(user.id);
      set({ cards, hydratedUserId: user.id });
      await writeCache(cacheKey(user.id), cards);
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
    // Optimistic remove
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
    await api.removeFlashcard(id);
    const user = useUserStore.getState().user;
    if (user) {
      await writeCache(cacheKey(user.id), useFlashcardsStore.getState().cards);
    }
  },

  reviewCard: async (id, grade) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return;
    const updated = getNextSM2(card, grade);
    // Optimistic update
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? updated : c)),
    }));
    await api.updateFlashcard(id, updated);
    const user = useUserStore.getState().user;
    if (user) {
      await writeCache(cacheKey(user.id), useFlashcardsStore.getState().cards);
    }
  },

  getDueCards: () => get().cards.filter((c) => c.nextReview <= Date.now()),

  getDueCardsForNotes: (noteIds) =>
    get().cards.filter(
      (c) => c.nodeId && noteIds.includes(c.nodeId) && c.nextReview <= Date.now()
    ),
}));
