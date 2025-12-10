import { useEffect } from "react";
import { useRouter } from "next/router";

export default function TrainerPage() {
  const router = useRouter();

  useEffect(() => {
    // Редирект на challenges
    router.replace("/trainer/challenges");
  }, [router]);

  return null;
}
