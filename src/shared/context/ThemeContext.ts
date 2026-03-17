import { createContext } from "react";
import type { SectionTheme } from "./types";
import type { ThemePresetId } from "./themePresets";

interface ThemeContextType {
  currentTheme: SectionTheme;
  setTheme: (theme: SectionTheme) => void;
  /** Текущий пресет темы оформления (как в VS Code) */
  themePresetId: ThemePresetId;
  setThemePresetId: (id: ThemePresetId) => void;
  /** Светлая/тёмная — производное от выбранного пресета */
  colorMode: "light" | "dark";
  setColorMode: (mode: "light" | "dark") => void;
  toggleColorMode: () => void;
  themeColors: {
    primary: string;
    lightBg: string;
    darkAccent: string;
    text: string;
    textMuted: string;
  };
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);
