import type { AppProps } from "next/app";
import { useEffect } from "react";
import { Geist } from "next/font/google";
import { supabase } from "@/shared/api/supabase";
import { useUserStore } from "@/shared/store/useUserStore";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { ThemeProvider } from "@/shared/context/ThemeContext";
// Инициализация i18n
import "@/shared/i18n/config";
// Импорт стилей
import "@/app-old/index.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

function MyApp({ Component, pageProps }: AppProps) {
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
    <div className={geistSans.className}>
      <ThemeProvider>
        <SidebarProvider>
          <Component {...pageProps} />
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
}

export default MyApp;
