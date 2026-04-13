import { useNotesStore } from "@/shared/store/useNotesStore";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";

/** Сброс кэша данных при выходе (zustand не сбрасывается при размонтировании страниц). */
export function resetClientStores() {
  useNotesStore.setState({
    notes: [],
    loading: false,
    error: null,
    hydratedUserId: null,
  });
  useLearnspacesStore.setState({
    learnspaces: [],
    loading: false,
    error: null,
    hydratedUserId: null,
  });
  useFlashcardsStore.setState({
    cards: [],
    loading: false,
    error: null,
    hydratedUserId: null,
  });
}
