import type { Atom } from "./types";

/**
 * Atom에서 클로저로 관리되고 있는 값을 반환하는 함수
 * 
 * @example
 * // atom에서 관리되고 있는 값을 가져오기
 * const count = get(countAtom);
 * console.log(count);
 *
 * // atom에서 관리되고 있는 값을 가져와 업데이트 
 * set(countAtom, get(countAtom) + 1);
 */
export const get = <T>(atom: Atom<T>) => {
  return atom._getValue();
}

/**
 * Atom에서 클로저로 관리되고 있는 값을 업데이트 하는 함수
 *
 * @example
 * set(countAtom, get(countAtom) + 1);
 */
export const set = <T>(atom: Atom<T>, value: T) => {
  atom._setValue(value);
}

/**
 * Atom에서 클로저로 관리되고 있는 값의 변경의 감지를 구독하는 함수
 * 
 * @example
 * const unsubscribe = subscribe(countAtom, (value => {
 *  console.log(`value changed to ${value}`);
 * })
 *
 * return () => {
 *   unsubscribe();
 * }
 */
export const subscribe = <T>(atom: Atom<T>, callback: (value: T) => void) => {
  return atom._subscribe(callback);
}

export const createAtom = <T>(initialValue: T): Atom<T> => {
  let curValue = initialValue;
  let subscribers = new Set<(value: T) => void>();

  return {
    _getValue: () => curValue,
    _setValue: (value: T) => {
      if (Object.is(curValue, value)) {
        return;
      }

      curValue = value;
      subscribers.forEach(callback => callback(value));
    },
    _subscribe: (callback: (value: T) => void) => {
      subscribers.add(callback);
      
      return () => {
        subscribers.delete(callback);
      }
    }
  }
}
