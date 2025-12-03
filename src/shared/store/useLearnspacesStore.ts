import { create } from "zustand";
import {
  getLearnspaces,
  addLearnspace as addLearnspaceApi,
  updateLearnspace as updateLearnspaceApi,
  removeLearnspace as removeLearnspaceApi,
} from "@/shared/api/learnspaces";
import { useUserStore } from "./useUserStore";

export type Learnspace = {
  id: string;
  name: string;
  noteIds: string[]; // ID файлов и папок из коллекции
  created_at: string;
};

interface LearnspacesStore {
  learnspaces: Learnspace[];
  loading: boolean;
  error: string | null;
  fetchLearnspaces: () => Promise<void>;
  addLearnspace: (name: string, noteIds: string[]) => Promise<Learnspace>;
  removeLearnspace: (id: string) => Promise<void>;
  updateLearnspace: (id: string, update: Partial<Learnspace>) => Promise<void>;
}

export const useLearnspacesStore = create<LearnspacesStore>((set, get) => ({
  learnspaces: [],
  loading: false,
  error: null,

  fetchLearnspaces: async () => {
    const user = useUserStore.getState().user;
    if (!user) {
      set({ learnspaces: [], loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const data = await getLearnspaces(user.id);
      set({ learnspaces: data, loading: false, error: null });
    } catch (error) {
      set({
        learnspaces: [],
        loading: false,
        error: error instanceof Error ? error.message : "Ошибка загрузки learnspaces",
      });
    }
  },

  addLearnspace: async (name, noteIds) => {
    const user = useUserStore.getState().user;
    if (!user) {
      throw new Error("Пользователь не авторизован");
    }

    set({ loading: true, error: null });
    try {
      const newLearnspace = await addLearnspaceApi(user.id, { name, noteIds });
      set((state) => ({
        learnspaces: [newLearnspace, ...state.learnspaces],
        loading: false,
        error: null,
      }));
      return newLearnspace;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Ошибка создания learnspace",
      });
      throw error;
    }
  },

  removeLearnspace: async (id) => {
    set({ loading: true, error: null });
    try {
      await removeLearnspaceApi(id);
      set((state) => ({
        learnspaces: state.learnspaces.filter((l) => l.id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Ошибка удаления learnspace",
      });
      throw error;
    }
  },

  updateLearnspace: async (id, update) => {
    set({ loading: true, error: null });
    try {
      const updatedLearnspace = await updateLearnspaceApi(id, update);
      set((state) => ({
        learnspaces: state.learnspaces.map((l) =>
          l.id === id ? updatedLearnspace : l
        ),
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Ошибка обновления learnspace",
      });
      throw error;
    }
  },
}));

