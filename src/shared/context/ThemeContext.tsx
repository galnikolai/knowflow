"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { themeConfig } from "./themeConfig";
import type { SectionTheme } from "./types";
import type { ThemePresetId } from "./themePresets";
import {
  THEME_PRESETS,
  getStoredThemePresetId,
  setStoredThemePresetId,
  getThemePreset,
} from "./themePresets";
import { ThemeContext } from "./ThemeContext.ts";
import { ROUTES } from "@/shared/config/routes";

const DEFAULT_PRESET_ID: ThemePresetId = "default-light";

function applyPreset(presetId: ThemePresetId) {
  const preset = getThemePreset(presetId);
  const root = document.documentElement;
  Object.entries(preset.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  if (preset.dark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = router.pathname;
  const [currentTheme, setCurrentTheme] = useState<SectionTheme>("collection");
  const [themePresetId, setThemePresetIdState] = useState<ThemePresetId>(
    () => getStoredThemePresetId() ?? DEFAULT_PRESET_ID
  );

  const setThemePresetId = useCallback((id: ThemePresetId) => {
    setThemePresetIdState(id);
    setStoredThemePresetId(id);
    applyPreset(id);
  }, []);

  const colorMode =
    THEME_PRESETS.find((p) => p.id === themePresetId)?.dark === true
      ? "dark"
      : "light";

  const setColorMode = useCallback(
    (mode: "light" | "dark") => {
      if (mode === "dark") {
        setThemePresetId("default-dark");
      } else {
        setThemePresetId("default-light");
      }
    },
    [setThemePresetId]
  );

  const toggleColorMode = useCallback(() => {
    setThemePresetId(
      colorMode === "dark" ? "default-light" : "default-dark"
    );
  }, [colorMode, setThemePresetId]);

  // При первом монтировании и при гидрации — применить сохранённый пресет
  useEffect(() => {
    const stored = getStoredThemePresetId();
    const id = stored ?? DEFAULT_PRESET_ID;
    setThemePresetIdState(id);
    setStoredThemePresetId(id);
    applyPreset(id);
  }, []);

  // Автоматически определяем раздел (collection/trainer) по роуту
  useEffect(() => {
    const path = pathname;
    if (path.startsWith(ROUTES.TRAINER)) {
      setCurrentTheme("trainer");
    } else if (path.startsWith(ROUTES.COLLECTION)) {
      setCurrentTheme("collection");
    } else if (path.startsWith("/study")) {
      setCurrentTheme("study");
    } else {
      setCurrentTheme("collection");
    }
  }, [pathname]);

  const themeColors = themeConfig[currentTheme];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", themeColors.primary);
    root.style.setProperty("--theme-light-bg", themeColors.lightBg);
    root.style.setProperty("--theme-dark-accent", themeColors.darkAccent);
    root.style.setProperty("--theme-text", themeColors.text);
    root.style.setProperty("--theme-text-muted", themeColors.textMuted);
  }, [themeColors]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme: setCurrentTheme,
        themePresetId,
        setThemePresetId,
        themeColors,
        colorMode,
        setColorMode,
        toggleColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
