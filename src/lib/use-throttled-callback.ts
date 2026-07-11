import { useRef } from "react";

/**
 * Hook to throttle a callback. Useful for expensive operations that fire frequently.
 * @param callback The function to throttle
 * @param delay Throttle delay in ms
 * @returns Throttled callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  return ((...args: any[]) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
        timeoutRef.current = null;
      }, delay - timeSinceLastCall);
    }
  }) as T;
}
