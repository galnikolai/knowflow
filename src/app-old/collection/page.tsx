"use client";

import { Collection } from "@/views/collection/Collection";
import { RequireAuth } from "../components/RequireAuth";

export default function CollectionPage() {
  return (
    <RequireAuth>
      <Collection />
    </RequireAuth>
  );
}
