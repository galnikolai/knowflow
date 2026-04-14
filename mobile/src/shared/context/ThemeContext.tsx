import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type ColorSchemeName,
  type ThemeColors,
  type ThemePreference,
  type ThemeShadow,
  getColorsForScheme,
  getShadow,
  resolveColorScheme,
} from "@/shared/theme";

const STORAGE_KEY = "knowflow-theme-preference";

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => Promise<void>;
  resolvedScheme: ColorSchemeName;
  colors: ThemeColors;
  shadow: ThemeShadow;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!alive) return;
      if (raw === "light" || raw === "dark" || raw === "system") {
        setPreferenceState(raw);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const resolvedScheme = useMemo(
    () => resolveColorScheme(preference, systemScheme as ColorSchemeName | undefined),
    [preference, systemScheme]
  );

  const colors = useMemo(() => getColorsForScheme(resolvedScheme), [resolvedScheme]);
  const shadow = useMemo(() => getShadow(resolvedScheme), [resolvedScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      resolvedScheme,
      colors,
      shadow,
      isDark: resolvedScheme === "dark",
    }),
    [preference, setPreference, resolvedScheme, colors, shadow]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme должен вызываться внутри ThemeProvider");
  }
  return ctx;
}
