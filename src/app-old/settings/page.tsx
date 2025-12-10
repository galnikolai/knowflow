"use client";

import { Settings } from "@/views";
import { RequireAuth } from "../components/RequireAuth";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  );
}
