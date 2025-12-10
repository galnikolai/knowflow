import { Settings } from "@/views";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  );
}
