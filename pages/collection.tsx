import { Collection } from "@/views/collection/Collection";
import { RequireAuth } from "@/shared/components/RequireAuth";

export default function CollectionPage() {
  return (
    <RequireAuth>
      <Collection />
    </RequireAuth>
  );
}
