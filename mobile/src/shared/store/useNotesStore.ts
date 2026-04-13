import { create } from "zustand";
import * as api from "@/shared/api/notes";
import { useUserStore } from "@/shared/store/useUserStore";

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

    set({ loading: true, error: null });
    try {
      const notes = await api.getNotes(user.id);
      set({ notes, hydratedUserId: user.id });
    } catch (e) {
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
    await api.updateNote(id, update);
    await get().fetchNotes({ force: true });
  },

  removeNote: async (id) => {
    await api.removeNote(id);
    await get().fetchNotes({ force: true });
  },
}));
