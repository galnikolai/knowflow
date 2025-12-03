import { create } from "zustand";
import * as api from "@/shared/api/notes";
import { useUserStore } from "@/shared/store/useUserStore";

interface NotesStore {
  notes: api.Note[];
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  addNote: (
    note: Omit<api.Note, "id" | "created_at" | "updated_at" | "user_id">
  ) => Promise<api.Note>;
  updateNote: (
    id: string,
    update: Partial<
      Omit<api.Note, "id" | "user_id" | "created_at" | "updated_at">
    >
  ) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  loading: false,
  error: null,
  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const user = useUserStore.getState().user;
      if (!user) throw new Error("Нет пользователя");
      const notes = await api.getNotes(user.id);
      set({ notes });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },
  addNote: async (note) => {
    set({ loading: true, error: null });
    try {
      const user = useUserStore.getState().user;
      if (!user) throw new Error("Нет пользователя");
      const newNote = await api.addNote({ ...note, user_id: user.id });
      await get().fetchNotes();
      return newNote;
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
      throw e;
    } finally {
      set({ loading: false });
    }
  },
  updateNote: async (id, update) => {
    set({ loading: true, error: null });
    try {
      await api.updateNote(id, update);
      await get().fetchNotes();
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },
  removeNote: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.removeNote(id);
      await get().fetchNotes();
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },
}));
