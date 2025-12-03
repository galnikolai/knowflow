import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { useUserStore } from "@/shared/store/useUserStore";
import { supabase } from "@/shared/api/supabase";
import { LogOut, Moon, Sun, Globe } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const logout = useUserStore((s) => s.logout);
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) {
        return saved === "dark";
      }
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    onOpenChange(false);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const toggleDarkMode = (checked: boolean) => {
    setIsDark(checked);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
          <DialogDescription>
            Управление темой, языком и выходом из системы
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Переключатель темной/светлой темы */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDark ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              <Label className="text-base font-semibold">
                {isDark ? "Темная тема" : "Светлая тема"}
              </Label>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
          </div>

          {/* Выбор языка */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <Label className="text-base font-semibold">Язык</Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant={i18n.language === "ru" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("ru")}
                className="flex-1"
              >
                Русский
              </Button>
              <Button
                variant={i18n.language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("en")}
                className="flex-1"
              >
                English
              </Button>
            </div>
          </div>

          {/* Выход */}
          <div className="space-y-3 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
