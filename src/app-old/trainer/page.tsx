import { redirect } from "next/navigation";

export default function TrainerPage() {
  // Серверный редирект на challenges
  redirect("/trainer/challenges");
}
