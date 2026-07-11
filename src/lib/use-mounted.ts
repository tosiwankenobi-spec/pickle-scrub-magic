import { useEffect, useRef } from "react";

/**
 * Hook that returns a ref to check if component is still mounted.
 * Useful for preventing state updates in unmounted components.
 */
export function useMounted() {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}
