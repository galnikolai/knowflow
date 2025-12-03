// shared/store/useUserStore.ts
import { create } from "zustand";

type User = {
  id: string;
  email: string;
};

interface UserStore {
  user: User | null;
  userLoading: boolean;
  setUser: (user: User | null) => void;
  setUserLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  userLoading: true,
  setUser: (user) => set({ user }),
  setUserLoading: (loading) => set({ userLoading: loading }),
  logout: () => set({ user: null }),
}));
