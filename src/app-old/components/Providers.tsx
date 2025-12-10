"use client";

import { useEffect } from "react";
import { supabase } from "@/shared/api/supabase";
import { useUserStore } from "@/shared/store/useUserStore";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { ThemeProvider } from "@/shared/context/ThemeContext";
// Инициализация i18n
import "@/shared/i18n/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((s) => s.setUser);
  const setUserLoading = useUserStore((s) => s.setUserLoading);

  useEffect(() => {
    setUserLoading(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email! });
      } else {
        setUser(null);
      }
      setUserLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
        } else {
          setUser(null);
        }
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [setUser, setUserLoading]);

  return (
    <ThemeProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </ThemeProvider>
  );
}
