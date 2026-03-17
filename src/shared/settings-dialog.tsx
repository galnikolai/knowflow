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
import { useUserStore } from "@/shared/store/useUserStore";
import { useTheme } from "@/shared/context/useTheme";
import { THEME_PRESETS } from "@/shared/context/themePresets";
import type { ThemePresetId } from "@/shared/context/themePresets";
import { supabase } from "@/shared/api/supabase";
import { Palette, Globe, LogOut } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const logout = useUserStore((s) => s.logout);
  const { themePresetId, setThemePresetId } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    onOpenChange(false);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
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
          {/* Выбор темы оформления (как в VS Code) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <Label className="text-base font-semibold">Тема оформления</Label>
            </div>
            <div className="flex flex-col gap-2">
              {THEME_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant={themePresetId === preset.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThemePresetId(preset.id as ThemePresetId)}
                  className="w-full justify-start"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
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
          <div className="space-y-3 pt-4">
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
