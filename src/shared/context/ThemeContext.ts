import { createContext } from "react";
import type { SectionTheme } from "./types";

interface ThemeContextType {
  currentTheme: SectionTheme;
  setTheme: (theme: SectionTheme) => void;
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
