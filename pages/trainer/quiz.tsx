import { Quiz } from "@/views/trainer/Quiz";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function TrainerQuizPage() {
  return (
    <RequireAuth>
      <Quiz />
    </RequireAuth>
  );
}
