"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { themeConfig } from "./themeConfig";
import type { SectionTheme } from "./types";
import { ThemeContext } from "./ThemeContext.ts";
import { ROUTES } from "@/shared/config/routes";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const [currentTheme, setCurrentTheme] = useState<SectionTheme>("collection");

  // Автоматически определяем тему на основе текущего роута
  useEffect(() => {
    const path = pathname;
    // Проверяем более конкретные пути сначала
    if (path.startsWith(ROUTES.TRAINER)) {
      // Для /trainer/study используем тему trainer (оранжеватая)
      setCurrentTheme("trainer");
    } else if (path.startsWith(ROUTES.COLLECTION)) {
      setCurrentTheme("collection");
    } else if (path.startsWith("/study")) {
      // Отдельная страница изучения (если есть)
      setCurrentTheme("study");
    } else {
      // По умолчанию используем тему коллекции
      setCurrentTheme("collection");
    }
  }, [pathname]);

  const themeColors = themeConfig[currentTheme];

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", themeColors.primary);
    root.style.setProperty("--theme-light-bg", themeColors.lightBg);
    root.style.setProperty("--theme-dark-accent", themeColors.darkAccent);
    root.style.setProperty("--theme-text", themeColors.text);
    root.style.setProperty("--theme-text-muted", themeColors.textMuted);
  }, [themeColors]);

  return (
    <ThemeContext.Provider
      value={{ currentTheme, setTheme: setCurrentTheme, themeColors }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
