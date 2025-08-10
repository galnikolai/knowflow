// shared/store/useUserStore.ts
import { create } from "zustand";

type User = {
  id: string;
  email: string;
};

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
