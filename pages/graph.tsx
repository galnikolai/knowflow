import { Graph } from "@/views";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function GraphPage() {
  return (
    <RequireAuth>
      <Graph />
    </RequireAuth>
  );
}
