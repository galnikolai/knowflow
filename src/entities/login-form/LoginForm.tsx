import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/api/supabase";
import { useUserStore } from "@/shared/store/useUserStore";
import { useRouter } from "next/router";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation();
  const setUser = useUserStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email! });
          setSuccess(t("login.success"));
          router.replace("/collection");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email! });
          setSuccess(t("login.signupSuccess"));
        } else {
          setSuccess(t("login.checkEmail"));
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(t("login.unknownError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "login" ? t("login.title") : t("login.signupTitle")}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? t("login.description")
              : t("login.signupDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {mode === "login" ? t("login.submit") : t("login.signup")}
                </Button>
              </div>
            </div>
            {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
            {success && (
              <div className="text-green-600 mt-2 text-sm">{success}</div>
            )}
            <div className="mt-4 text-center text-sm">
              {mode === "login" ? (
                <>
                  {t("login.noAccount")}{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4 text-blue-600"
                    onClick={() => setMode("signup")}
                  >
                    {t("login.signup")}
                  </button>
                </>
              ) : (
                <>
                  {t("login.hasAccount")}{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4 text-blue-600"
                    onClick={() => setMode("login")}
                  >
                    {t("login.signIn")}
                  </button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
