import { Graph } from "@/views/trainer/Graph";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function TrainerGraphPage() {
  return (
    <RequireAuth>
      <Graph />
    </RequireAuth>
  );
}
