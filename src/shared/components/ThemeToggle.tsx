"use client";

import { Moon, Sun } from "lucide-react";
import React from "react";
import { Button } from "@/shared/ui/button";
import { useTheme } from "@/shared/context/useTheme";

export const ThemeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useTheme();
  const isDark = colorMode === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleColorMode}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
};
