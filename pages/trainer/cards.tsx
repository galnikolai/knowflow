import { Cards } from "@/views/trainer/Cards";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function TrainerCardsPage() {
  return (
    <RequireAuth>
      <Cards />
    </RequireAuth>
  );
}
