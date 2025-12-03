import { Button } from "@/shared/ui/button";
import { useUserStore } from "@/shared/store/useUserStore";
import { Settings } from "lucide-react";
import React from "react";

interface UserProfilePopoverProps {
  onOpenSettings?: () => void;
}

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  onOpenSettings,
}) => {
  const user = useUserStore((s) => s.user);

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Настройки"
      onClick={onOpenSettings}
    >
      <Settings className="size-5" />
    </Button>
  );
};
