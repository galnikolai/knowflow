import { useUserStore } from "@/shared/store/useUserStore";
import { Navigate, useLocation } from "react-router-dom";
import React from "react";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useUserStore((s) => s.user);
  const userLoading = useUserStore((s) => s.userLoading);
  const location = useLocation();
  if (userLoading) {
    return null; // Можно добавить лоадер
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
