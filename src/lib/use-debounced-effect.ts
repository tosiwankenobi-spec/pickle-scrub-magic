import { useEffect, useRef } from "react";

/**
 * Hook to debounce an effect. Useful for expensive operations like localStorage writes.
 * @param callback The function to call after the delay
 * @param deps Dependencies array
 * @param delay Debounce delay in ms (default: 500ms)
 */
export function useDebouncedEffect(
  callback: () => void,
  deps: React.DependencyList,
  delay = 500,
) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      callback();
      timeoutRef.current = null;
    }, delay);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, deps);
}
