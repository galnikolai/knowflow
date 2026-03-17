/**
 * Пресеты тем в стиле VS Code (Default Light, Default Dark, Light+, Dark+, Monokai).
 * Каждый пресет задаёт полный набор CSS-переменных.
 */

export type ThemePresetId =
  | "default-light"
  | "default-dark"
  | "light-plus"
  | "dark-plus"
  | "monokai";

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  /** Тёмная тема — добавляется класс .dark на document */
  dark: boolean;
  vars: Record<string, string>;
}

const baseRadius = "0.5rem";

export const THEME_PRESETS: ThemePreset[] = [
  // 1. Default Light — минималистичная светлая (как сейчас)
  {
    id: "default-light",
    name: "Default Light",
    dark: false,
    vars: {
      "--radius": baseRadius,
      "--background": "#fafafa",
      "--foreground": "#171717",
      "--card": "#ffffff",
      "--card-foreground": "#171717",
      "--popover": "#ffffff",
      "--popover-foreground": "#171717",
      "--primary": "#262626",
      "--primary-foreground": "#fafafa",
      "--secondary": "#f5f5f5",
      "--secondary-foreground": "#171717",
      "--muted": "#f5f5f5",
      "--muted-foreground": "#737373",
      "--accent": "#f0f0f0",
      "--accent-foreground": "#171717",
      "--destructive": "#dc2626",
      "--border": "transparent",
      "--tw-border-style": "transparent",
      "--input": "rgba(0, 0, 0, 0.04)",
      "--ring": "rgba(0, 0, 0, 0.06)",
      "--sidebar": "#fafafa",
      "--sidebar-foreground": "#171717",
      "--sidebar-primary": "#262626",
      "--sidebar-primary-foreground": "#fafafa",
      "--sidebar-accent": "#f0f0f0",
      "--sidebar-accent-foreground": "#171717",
      "--sidebar-border": "transparent",
      "--sidebar-ring": "rgba(0, 0, 0, 0.06)",
      "--chart-1": "#737373",
      "--chart-2": "#a3a3a3",
      "--chart-3": "#525252",
      "--chart-4": "#404040",
      "--chart-5": "#262626",
      "--gradient-start": "#e5e5e5",
      "--gradient-end": "#d4d4d4",
    },
  },
  // 2. Default Dark — минималистичная тёмная
  {
    id: "default-dark",
    name: "Default Dark",
    dark: true,
    vars: {
      "--radius": baseRadius,
      "--background": "#0a0a0a",
      "--foreground": "#fafafa",
      "--card": "#141414",
      "--card-foreground": "#fafafa",
      "--popover": "#141414",
      "--popover-foreground": "#fafafa",
      "--primary": "#fafafa",
      "--primary-foreground": "#0a0a0a",
      "--secondary": "#262626",
      "--secondary-foreground": "#fafafa",
      "--muted": "#262626",
      "--muted-foreground": "#a3a3a3",
      "--accent": "#262626",
      "--accent-foreground": "#fafafa",
      "--destructive": "#dc2626",
      "--border": "transparent",
      "--tw-border-style": "transparent",
      "--input": "rgba(255, 255, 255, 0.06)",
      "--ring": "rgba(255, 255, 255, 0.08)",
      "--sidebar": "#0a0a0a",
      "--sidebar-foreground": "#fafafa",
      "--sidebar-primary": "#fafafa",
      "--sidebar-primary-foreground": "#0a0a0a",
      "--sidebar-accent": "#262626",
      "--sidebar-accent-foreground": "#fafafa",
      "--sidebar-border": "transparent",
      "--sidebar-ring": "rgba(255, 255, 255, 0.08)",
      "--chart-1": "#a3a3a3",
      "--chart-2": "#737373",
      "--chart-3": "#525252",
      "--chart-4": "#404040",
      "--chart-5": "#262626",
      "--gradient-start": "#2a2a2a",
      "--gradient-end": "#1a1a1a",
    },
  },
  // 3. Light+ — в стиле VS Code Light+ (белый фон, синие акценты)
  {
    id: "light-plus",
    name: "Light+",
    dark: false,
    vars: {
      "--radius": baseRadius,
      "--background": "#ffffff",
      "--foreground": "#333333",
      "--card": "#ffffff",
      "--card-foreground": "#333333",
      "--popover": "#ffffff",
      "--popover-foreground": "#333333",
      "--primary": "#094771",
      "--primary-foreground": "#ffffff",
      "--secondary": "#e8e8e8",
      "--secondary-foreground": "#333333",
      "--muted": "#f3f3f3",
      "--muted-foreground": "#6e6e6e",
      "--accent": "#e8f4fc",
      "--accent-foreground": "#094771",
      "--destructive": "#e51400",
      "--border": "transparent",
      "--tw-border-style": "transparent",
      "--input": "rgba(0, 0, 0, 0.06)",
      "--ring": "rgba(9, 71, 113, 0.35)",
      "--sidebar": "#f3f3f3",
      "--sidebar-foreground": "#333333",
      "--sidebar-primary": "#094771",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#e8f4fc",
      "--sidebar-accent-foreground": "#094771",
      "--sidebar-border": "transparent",
      "--sidebar-ring": "rgba(9, 71, 113, 0.35)",
      "--chart-1": "#094771",
      "--chart-2": "#0e639c",
      "--chart-3": "#267f99",
      "--chart-4": "#4a9fd4",
      "--chart-5": "#6eb3d0",
      "--gradient-start": "#e8f4fc",
      "--gradient-end": "#d4e9f7",
    },
  },
  // 4. Dark+ — в стиле VS Code Dark+ (тёмно-серый, синие акценты)
  {
    id: "dark-plus",
    name: "Dark+",
    dark: true,
    vars: {
      "--radius": baseRadius,
      "--background": "#1e1e1e",
      "--foreground": "#d4d4d4",
      "--card": "#252526",
      "--card-foreground": "#d4d4d4",
      "--popover": "#252526",
      "--popover-foreground": "#d4d4d4",
      "--primary": "#569cd6",
      "--primary-foreground": "#1e1e1e",
      "--secondary": "#3c3c3c",
      "--secondary-foreground": "#d4d4d4",
      "--muted": "#2d2d2d",
      "--muted-foreground": "#858585",
      "--accent": "#094771",
      "--accent-foreground": "#d4d4d4",
      "--destructive": "#f44747",
      "--border": "transparent",
      "--tw-border-style": "transparent",
      "--input": "rgba(255, 255, 255, 0.08)",
      "--ring": "rgba(86, 156, 214, 0.4)",
      "--sidebar": "#252526",
      "--sidebar-foreground": "#d4d4d4",
      "--sidebar-primary": "#569cd6",
      "--sidebar-primary-foreground": "#1e1e1e",
      "--sidebar-accent": "#2a2d2e",
      "--sidebar-accent-foreground": "#d4d4d4",
      "--sidebar-border": "transparent",
      "--sidebar-ring": "rgba(86, 156, 214, 0.4)",
      "--chart-1": "#569cd6",
      "--chart-2": "#4ec9b0",
      "--chart-3": "#dcdcaa",
      "--chart-4": "#ce9178",
      "--chart-5": "#9cdcfe",
      "--gradient-start": "#2d2d2d",
      "--gradient-end": "#252526",
    },
  },
  // 5. Monokai — тёмная с цветными акцентами
  {
    id: "monokai",
    name: "Monokai",
    dark: true,
    vars: {
      "--radius": baseRadius,
      "--background": "#272822",
      "--foreground": "#f8f8f2",
      "--card": "#2f3129",
      "--card-foreground": "#f8f8f2",
      "--popover": "#2f3129",
      "--popover-foreground": "#f8f8f2",
      "--primary": "#a6e22e",
      "--primary-foreground": "#272822",
      "--secondary": "#3e3d32",
      "--secondary-foreground": "#f8f8f2",
      "--muted": "#3e3d32",
      "--muted-foreground": "#75715e",
      "--accent": "#49483e",
      "--accent-foreground": "#f8f8f2",
      "--destructive": "#f92672",
      "--border": "transparent",
      "--tw-border-style": "transparent",
      "--input": "rgba(255, 255, 255, 0.06)",
      "--ring": "rgba(166, 226, 46, 0.4)",
      "--sidebar": "#272822",
      "--sidebar-foreground": "#f8f8f2",
      "--sidebar-primary": "#a6e22e",
      "--sidebar-primary-foreground": "#272822",
      "--sidebar-accent": "#49483e",
      "--sidebar-accent-foreground": "#f8f8f2",
      "--sidebar-border": "transparent",
      "--sidebar-ring": "rgba(166, 226, 46, 0.4)",
      "--chart-1": "#a6e22e",
      "--chart-2": "#66d9ef",
      "--chart-3": "#fd971f",
      "--chart-4": "#ae81ff",
      "--chart-5": "#f92672",
      "--gradient-start": "#3e3d32",
      "--gradient-end": "#2f3129",
    },
  },
];

const STORAGE_KEY = "theme-preset";

export function getStoredThemePresetId(): ThemePresetId | null {
  if (typeof window === "undefined") return null;
  const s = window.localStorage.getItem(STORAGE_KEY);
  if (THEME_PRESETS.some((p) => p.id === s)) return s as ThemePresetId;
  return null;
}

export function setStoredThemePresetId(id: ThemePresetId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
  window.localStorage.setItem("color-mode", id.includes("dark") || id === "monokai" ? "dark" : "light");
}

export function getThemePreset(id: ThemePresetId): ThemePreset {
  const p = THEME_PRESETS.find((t) => t.id === id);
  if (!p) return THEME_PRESETS[0];
  return p;
}
