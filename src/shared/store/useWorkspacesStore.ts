import { create } from "zustand";

export type Workspace = {
  id: string;
  name: string;
  noteIds: string[]; // ID файлов и папок из коллекции
  created_at: string;
};

interface WorkspacesStore {
  workspaces: Workspace[];
  addWorkspace: (name: string, noteIds: string[]) => void;
  removeWorkspace: (id: string) => void;
  updateWorkspace: (id: string, update: Partial<Workspace>) => void;
}

const STORAGE_KEY = "workspaces-storage";

// Загрузка из localStorage
const loadWorkspaces = (): Workspace[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Сохранение в localStorage
const saveWorkspaces = (workspaces: Workspace[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  } catch (error) {
    console.error("Failed to save workspaces:", error);
  }
};

export const useWorkspacesStore = create<WorkspacesStore>((set) => ({
  workspaces: loadWorkspaces(),
  addWorkspace: (name, noteIds) => {
    const newWorkspace: Workspace = {
      id: crypto.randomUUID(),
      name,
      noteIds,
      created_at: new Date().toISOString(),
    };
    set((state) => {
      const workspaces = [...state.workspaces, newWorkspace];
      saveWorkspaces(workspaces);
      return { workspaces };
    });
  },
  removeWorkspace: (id) => {
    set((state) => {
      const workspaces = state.workspaces.filter((w) => w.id !== id);
      saveWorkspaces(workspaces);
      return { workspaces };
    });
  },
  updateWorkspace: (id, update) => {
    set((state) => {
      const workspaces = state.workspaces.map((w) =>
        w.id === id ? { ...w, ...update } : w
      );
      saveWorkspaces(workspaces);
      return { workspaces };
    });
  },
}));
