import { useEffect } from "react";
import { useRouter } from "next/router";
import { ROUTES } from "@/shared/config/routes";

export default function TrainerGraphPage() {
  const router = useRouter();
  useEffect(() => { router.replace(ROUTES.GRAPH); }, [router]);
  return null;
}
