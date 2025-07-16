import { useCallback, useSyncExternalStore } from "react";
import type { Atom } from "./types.js";

export const useAtom = <T>(atom: Atom<T>): [T, (value: T) => void] => {
  const snapshot = useCallback(() => {
    return atom._getValue();
  }, [atom]);

  const subscribe = useCallback(
    (callback: (value: T) => void) => {
      return atom._subscribe(callback);
    },
    [atom]
  );

  const value = useSyncExternalStore(subscribe, snapshot);
  const setter = useCallback(
    (value: T) => {
      atom._setValue(value);
    },
    [atom]
  );
  return [value, setter];
};
