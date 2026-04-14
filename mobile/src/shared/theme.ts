export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderSubtle: string;
  borderFocus: string;
  primary: string;
  primaryLight: string;
  primaryGlow: string;
  primaryDim: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  folderColor: string;
  noteColor: string;
  /** Текст/иконки на фоне primary (кнопки, аватар) */
  onPrimary: string;
};

export type ColorSchemeName = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";

export const darkColors: ThemeColors = {
  bg: "#0a0a0c",
  bgElevated: "#101014",
  surface: "#16161c",
  surface2: "#1e1e26",
  surface3: "#26262f",
  border: "#2a2a32",
  borderSubtle: "#1f1f26",
  borderFocus: "#8b8bff",
  primary: "#8b8bff",
  primaryLight: "#a8a8ff",
  primaryGlow: "rgba(139,139,255,0.08)",
  primaryDim: "rgba(139,139,255,0.06)",
  text: "#ececf1",
  textSecondary: "#9898a4",
  textTertiary: "#5c5c68",
  textInverse: "#0a0a0c",
  success: "#3ee0a8",
  successBg: "rgba(62,224,168,0.08)",
  warning: "#e8c04a",
  warningBg: "rgba(232,192,74,0.08)",
  danger: "#f05d78",
  dangerBg: "rgba(240,93,120,0.08)",
  folderColor: "#d4a054",
  noteColor: "#8b8bff",
  onPrimary: "#ffffff",
};

export const lightColors: ThemeColors = {
  bg: "#f5f5f8",
  bgElevated: "#ffffff",
  surface: "#ffffff",
  surface2: "#f0f0f4",
  surface3: "#e6e6ed",
  border: "#e0e0e8",
  borderSubtle: "#ebebf0",
  borderFocus: "#6b6bd4",
  primary: "#6b6bd4",
  primaryLight: "#8585e8",
  primaryGlow: "rgba(107,107,212,0.12)",
  primaryDim: "rgba(107,107,212,0.1)",
  text: "#12121a",
  textSecondary: "#5a5a6b",
  textTertiary: "#8a8a9a",
  textInverse: "#ffffff",
  success: "#0d9f73",
  successBg: "rgba(13,159,115,0.1)",
  warning: "#b8860b",
  warningBg: "rgba(184,134,11,0.1)",
  danger: "#d63d5c",
  dangerBg: "rgba(214,61,92,0.1)",
  folderColor: "#b8832a",
  noteColor: "#6b6bd4",
  onPrimary: "#ffffff",
};

export function getColorsForScheme(scheme: ColorSchemeName): ThemeColors {
  return scheme === "dark" ? darkColors : lightColors;
}

export function resolveColorScheme(
  preference: ThemePreference,
  system: ColorSchemeName | null | undefined
): ColorSchemeName {
  if (preference === "light" || preference === "dark") return preference;
  return system === "dark" ? "dark" : "light";
}

export type ThemeShadow = {
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
};

export function getShadow(scheme: ColorSchemeName): ThemeShadow {
  const shadowColor = scheme === "dark" ? "#000" : "#000";
  const smOp = scheme === "dark" ? 0.22 : 0.08;
  const mdOp = scheme === "dark" ? 0.28 : 0.1;
  const glowOp = scheme === "dark" ? 0.18 : 0.12;

  return {
    sm: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: smOp,
      shadowRadius: scheme === "dark" ? 2 : 3,
      elevation: scheme === "dark" ? 1 : 2,
    },
    md: {
      shadowColor,
      shadowOffset: { width: 0, height: scheme === "dark" ? 6 : 4 },
      shadowOpacity: mdOp,
      shadowRadius: scheme === "dark" ? 10 : 8,
      elevation: scheme === "dark" ? 4 : 3,
    },
    glow: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: glowOp,
      shadowRadius: scheme === "dark" ? 8 : 6,
      elevation: scheme === "dark" ? 3 : 2,
    },
  };
}

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
