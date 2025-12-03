import { useEffect } from "react";
import type { DependencyList } from "react";

export function useDebounceEffect(
  effect: () => void | (() => void),
  deps: DependencyList,
  delay: number
) {
  useEffect(() => {
    const handler = setTimeout(() => {
      effect();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay, effect]);
}
