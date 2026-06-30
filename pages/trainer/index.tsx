import { useEffect } from "react";
import { useRouter } from "next/router";
import { RequireAuth } from "@/shared/components/RequireAuth";

function TrainerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/trainer/challenges");
  }, [router]);

  return null;
}

export default function TrainerPage() {
  return (
    <RequireAuth>
      <TrainerRedirect />
    </RequireAuth>
  );
}
