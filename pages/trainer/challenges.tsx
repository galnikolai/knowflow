import { Challenges } from "@/views/trainer/Challenges";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function TrainerChallengesPage() {
  return (
    <RequireAuth>
      <Challenges />
    </RequireAuth>
  );
}
