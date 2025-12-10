"use client";

import { Graph } from "@/views";
import { RequireAuth } from "../components/RequireAuth";

export default function GraphPage() {
  return (
    <RequireAuth>
      <Graph />
    </RequireAuth>
  );
}
