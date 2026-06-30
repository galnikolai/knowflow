import { Study } from "@/views/trainer/Study";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function TrainerStudyPage() {
  return (
    <RequireAuth>
      <Study />
    </RequireAuth>
  );
}
