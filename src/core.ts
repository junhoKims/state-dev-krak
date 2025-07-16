import type { Atom } from "./types.js";

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
};

/**
 * Atom에서 클로저로 관리되고 있는 값을 업데이트 하는 함수
 *
 * @example
 * set(countAtom, get(countAtom) + 1);
 */
export const set = <T>(atom: Atom<T>, value: T) => {
  atom._setValue(value);
};

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
};

export const createAtom = <T>(initialValue: T): Atom<T> => {
  let curValue = initialValue;
  const subscribers = new Set<(value: T) => void>();

  let isBatching = false;

  const batchUpdate = () => {
    if (!isBatching) {
      isBatching = true;

      queueMicrotask(() => {
        subscribers.forEach((callback) => callback(curValue));
        isBatching = false;
      });
    }
  };

  return {
    _getValue: () => curValue,
    _setValue: (value: T) => {
      if (Object.is(curValue, value)) {
        return;
      }

      curValue = value;
      batchUpdate();
    },
    _subscribe: (callback: (value: T) => void) => {
      subscribers.add(callback);

      return () => {
        subscribers.delete(callback);
      };
    },
  };
};

/**
 * 비동기 데이터 및 에러를 관리하는 Atom을 생성하는 함수
 * 
 * - promise를 throw하여 Suspense를 지원
 * - error를 throw하여 상태의 타입 안전성 보장
 *
 * @example
 * const asyncAtom = createAsyncAtom(fetch('https://api.example.com/data'));
 *
 * const Comp = () => {
 *   const [data] = useAtom(asyncAtom);
 * 
 *   return (
 *     <div>{data && data.name}</div>
 *   )
 * }
 */
export const createAsyncAtom = <T>(promise: Promise<T>): Atom<T> => {
  let status: "pending" | "fulfilled" | "rejected" = "pending";
  let result: T | undefined = undefined;
  let error: unknown = undefined;

  const subscribers = new Set<(value: T) => void>();
  let isBatching = false;

  const batchUpdate = (value: T) => {
    if (!isBatching) {
      isBatching = true;

      queueMicrotask(() => {
        subscribers.forEach((callback) => callback(value));
        isBatching = false;
      });
    }
  };

  promise
    .then((value) => {
      status = "fulfilled";
      result = value;
      batchUpdate(value);
    })
    .catch((err) => {
      error = err;
      status = "rejected";
    });

  return {
    _getValue: () => {
      if (status === "rejected") {
        throw error;
      } else if (status === "fulfilled") {
        return result as T;
      } else {
        throw promise;
      }
    },
    _setValue: () => {
      throw new Error("AsyncAtom은 값을 변경할 수 없습니다");
    },
    _subscribe: (callback: (value: T) => void) => {
      subscribers.add(callback);

      return () => {
        subscribers.delete(callback);
      };
    },
  };
};
