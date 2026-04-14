// Inspired by: Linear, Craft, Notion, Things 3
export const colors = {
  // Backgrounds
  bg: "#08080a",
  bgElevated: "#0f0f12",
  surface: "#141418",
  surface2: "#1c1c22",
  surface3: "#242430",

  // Borders
  border: "#222228",
  borderSubtle: "#1a1a20",
  borderFocus: "#6366f1",

  // Brand
  primary: "#6366f1",      // indigo
  primaryLight: "#818cf8",
  primaryGlow: "rgba(99,102,241,0.12)",
  primaryDim: "rgba(99,102,241,0.08)",

  // Text
  text: "#f0f0f5",
  textSecondary: "#8e8e99",
  textTertiary: "#4a4a55",
  textInverse: "#08080a",

  // Semantic
  success: "#34d399",
  successBg: "rgba(52,211,153,0.1)",
  warning: "#fbbf24",
  warningBg: "rgba(251,191,36,0.1)",
  danger: "#f43f5e",
  dangerBg: "rgba(244,63,94,0.1)",

  // Special
  folderColor: "#f59e0b",
  noteColor: "#6366f1",
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const font = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 34,
};

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};
