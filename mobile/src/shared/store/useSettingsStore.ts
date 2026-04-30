import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AIProvider = "openai" | "anthropic" | "ollama";

export interface AISettings {
  provider: AIProvider;
  openaiKey: string;
  anthropicKey: string;
  apiUrl: string;         // URL of the KnowFlow web server (for quiz/flashcard generation)
  openaiModel: string;
  anthropicModel: string;
  ollamaModel: string;
}

interface SettingsStore {
  ai: AISettings;
  setProvider: (provider: AIProvider) => void;
  setOpenaiKey: (key: string) => void;
  setAnthropicKey: (key: string) => void;
  setApiUrl: (url: string) => void;
  setOpenaiModel: (model: string) => void;
  setAnthropicModel: (model: string) => void;
  setOllamaModel: (model: string) => void;
  getApiKey: () => string | undefined;
  getModel: () => string | undefined;
}

const DEFAULTS: AISettings = {
  provider: "ollama",
  openaiKey: "",
  anthropicKey: "",
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  openaiModel: "gpt-4o-mini",
  anthropicModel: "claude-3-5-sonnet-20241022",
  ollamaModel: "llama3.2",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ai: { ...DEFAULTS },
      setProvider: (provider) => set((s) => ({ ai: { ...s.ai, provider } })),
      setOpenaiKey: (openaiKey) => set((s) => ({ ai: { ...s.ai, openaiKey } })),
      setAnthropicKey: (anthropicKey) => set((s) => ({ ai: { ...s.ai, anthropicKey } })),
      setApiUrl: (apiUrl) => set((s) => ({ ai: { ...s.ai, apiUrl } })),
      setOpenaiModel: (openaiModel) => set((s) => ({ ai: { ...s.ai, openaiModel } })),
      setAnthropicModel: (anthropicModel) => set((s) => ({ ai: { ...s.ai, anthropicModel } })),
      setOllamaModel: (ollamaModel) => set((s) => ({ ai: { ...s.ai, ollamaModel } })),
      getApiKey: () => {
        const { ai } = get();
        if (ai.provider === "openai") return ai.openaiKey || undefined;
        if (ai.provider === "anthropic") return ai.anthropicKey || undefined;
        return undefined;
      },
      getModel: () => {
        const { ai } = get();
        if (ai.provider === "openai") return ai.openaiModel;
        if (ai.provider === "anthropic") return ai.anthropicModel;
        return ai.ollamaModel;
      },
    }),
    {
      name: "knowflow-mobile-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
