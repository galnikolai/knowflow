"use client";

import { Button } from "@/shared/ui/button";
import { useUserStore } from "@/shared/store/useUserStore";
import { supabase } from "@/shared/api/supabase";
import React from "react";

export const NavUser: React.FC = () => {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{user.email}</span>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Выйти
      </Button>
    </div>
  );
};
