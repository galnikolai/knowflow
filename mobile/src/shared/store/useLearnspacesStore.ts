import { create } from "zustand";
import * as api from "@/shared/api/learnspaces";
import { useUserStore } from "@/shared/store/useUserStore";
import { readCache, writeCache } from "@/shared/cache/asyncCache";

interface LearnspacesStore {
  learnspaces: api.Learnspace[];
  loading: boolean;
  error: string | null;
  hydratedUserId: string | null;
  fetchLearnspaces: (opts?: { force?: boolean }) => Promise<void>;
  addLearnspace: (name: string, noteIds: string[]) => Promise<api.Learnspace>;
  removeLearnspace: (id: string) => Promise<void>;
}

function cacheKey(userId: string) {
  return `learnspaces_cache_${userId}`;
}

export const useLearnspacesStore = create<LearnspacesStore>((set, get) => ({
  learnspaces: [],
  loading: false,
  error: null,
  hydratedUserId: null,

  fetchLearnspaces: async (opts) => {
    const user = useUserStore.getState().user;
    if (!user) {
      set({ learnspaces: [], loading: false, error: null, hydratedUserId: null });
      return;
    }
    if (!opts?.force && get().hydratedUserId === user.id) return;

    // Populate from cache for instant UI
    if (get().learnspaces.length === 0) {
      const cached = await readCache<api.Learnspace[]>(cacheKey(user.id));
      if (cached) set({ learnspaces: cached });
    }

    set({ loading: true, error: null });
    try {
      const data = await api.getLearnspaces(user.id);
      set({ learnspaces: data, loading: false, hydratedUserId: user.id });
      await writeCache(cacheKey(user.id), data);
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
        hydratedUserId: null,
      });
    }
  },

  addLearnspace: async (name, noteIds) => {
    const user = useUserStore.getState().user;
    if (!user) throw new Error("Нет пользователя");
    const newLearnspace = await api.addLearnspace(user.id, { name, noteIds });
    set((state) => ({
      learnspaces: [newLearnspace, ...state.learnspaces],
    }));
    const updated = useLearnspacesStore.getState().learnspaces;
    await writeCache(cacheKey(user.id), updated);
    return newLearnspace;
  },

  removeLearnspace: async (id) => {
    await api.removeLearnspace(id);
    set((state) => ({
      learnspaces: state.learnspaces.filter((l) => l.id !== id),
    }));
    const user = useUserStore.getState().user;
    if (user) {
      const updated = useLearnspacesStore.getState().learnspaces;
      await writeCache(cacheKey(user.id), updated);
    }
  },
}));
