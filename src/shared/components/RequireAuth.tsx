import { useUserStore } from "@/shared/store/useUserStore";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useUserStore((s) => s.user);
  const userLoading = useUserStore((s) => s.userLoading);
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return null; // Можно добавить лоадер
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
