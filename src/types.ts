/**
 * 상태를 가리키는 단위
 */
export type Atom<V> = {
  readonly _getValue: () => V;
	readonly _setValue: (value: V) => void;
	readonly _subscribe: (callback: (value: V) => void) => () => void;
};

