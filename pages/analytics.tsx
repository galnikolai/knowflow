import { Analytics } from "@/views/analytics/Analytics";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function AnalyticsPage() {
  return (
    <RequireAuth>
      <Analytics />
    </RequireAuth>
  );
}
