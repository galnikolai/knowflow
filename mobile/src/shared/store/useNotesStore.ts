import { create } from "zustand";
import * as api from "@/shared/api/notes";
import { useUserStore } from "@/shared/store/useUserStore";
import { readCache, writeCache } from "@/shared/cache/asyncCache";

interface NotesStore {
  notes: api.Note[];
  loading: boolean;
  error: string | null;
  hydratedUserId: string | null;
  fetchNotes: (opts?: { force?: boolean }) => Promise<void>;
  addNote: (
    note: Omit<api.Note, "id" | "created_at" | "updated_at" | "user_id">
  ) => Promise<api.Note>;
  updateNote: (
    id: string,
    update: Partial<Omit<api.Note, "id" | "user_id" | "created_at" | "updated_at">>
  ) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
}

function cacheKey(userId: string) {
  return `notes_cache_${userId}`;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  loading: false,
  error: null,
  hydratedUserId: null,

  fetchNotes: async (opts) => {
    const user = useUserStore.getState().user;
    if (!user) {
      set({ notes: [], loading: false, error: null, hydratedUserId: null });
      return;
    }
    if (!opts?.force && get().hydratedUserId === user.id) return;

    // Populate from cache immediately for instant UI
    if (get().notes.length === 0) {
      const cached = await readCache<api.Note[]>(cacheKey(user.id));
      if (cached) set({ notes: cached });
    }

    set({ loading: true, error: null });
    try {
      const notes = await api.getNotes(user.id);
      set({ notes, hydratedUserId: user.id });
      await writeCache(cacheKey(user.id), notes);
    } catch (e) {
      // On network failure keep cached data but mark error
      set({ error: e instanceof Error ? e.message : String(e), hydratedUserId: null });
    } finally {
      set({ loading: false });
    }
  },

  addNote: async (note) => {
    const user = useUserStore.getState().user;
    if (!user) throw new Error("Нет пользователя");
    const newNote = await api.addNote({ ...note, user_id: user.id });
    await get().fetchNotes({ force: true });
    return newNote;
  },

  updateNote: async (id, update) => {
    // Optimistic update
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...update, updated_at: new Date().toISOString() } : n
      ),
    }));
    await api.updateNote(id, update);
    const user = useUserStore.getState().user;
    if (user) {
      const notes = useNotesStore.getState().notes;
      await writeCache(cacheKey(user.id), notes);
    }
  },

  removeNote: async (id) => {
    // Optimistic remove
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
    await api.removeNote(id);
    const user = useUserStore.getState().user;
    if (user) {
      const notes = useNotesStore.getState().notes;
      await writeCache(cacheKey(user.id), notes);
    }
  },
}));
