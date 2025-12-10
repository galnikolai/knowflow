"use client";

import { Trainer } from "@/views/trainer/Trainer";
import { RequireAuth } from "../components/RequireAuth";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <Trainer>{children}</Trainer>
    </RequireAuth>
  );
}

