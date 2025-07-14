import { createAtom, get, set, subscribe } from "./core.js";

describe("get", () => {
  it("`Atom`의 현재 값을 가져올 수 있다", () => {
    const baseAtom = createAtom(0);
    expect(get(baseAtom)).toBe(0);
    expect(get(baseAtom)).not.toBe(1);
  });
});

describe("set", () => {
  it("`Atom`의 값을 변경할 수 있다", () => {
    const baseAtom = createAtom(0);
    expect(get(baseAtom)).toBe(0);

    set(baseAtom, 1);
    expect(get(baseAtom)).toBe(1);
  });
});

describe("subscribe", () => {
  it("`Atom`의 값이 바뀌면 콜백이 호출된다", () => {
    const baseAtom = createAtom(0);
    const callback = vi.fn();
    subscribe(baseAtom, callback);

    expect(callback).toHaveBeenCalledTimes(0);

    set(baseAtom, 1);
    return new Promise<void>((resolve) => {
      queueMicrotask(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
      resolve();
    });
  });

  it("`Atom`의 값이 여러번 변경되도 배칭 업데이트 되어 한번만 콜백이 호출된다", () => {
    const baseAtom = createAtom(0);
    const callback = vi.fn();
    subscribe(baseAtom, callback);

    expect(callback).toHaveBeenCalledTimes(0);

    set(baseAtom, 1);
    set(baseAtom, 2);
    set(baseAtom, 3);
    return new Promise<void>((resolve) => {
      queueMicrotask(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
      resolve();
    });
  });
});

describe("createAtom", () => {
  it("`Atom`을 생성하고 초기값을 가져올 수 있다", () => {
    const baseAtom = createAtom(0);
    expect(get(baseAtom)).toBe(0);

    const callback = vi.fn();
    subscribe(baseAtom, callback);

    set(baseAtom, 1);
    set(baseAtom, 2);
    set(baseAtom, 3);
    expect(get(baseAtom)).toBe(3);

    return new Promise<void>((resolve) => {
      queueMicrotask(() => {
        // Object.is 비교로 인해 호출되지 않아야 함
        expect(callback).toHaveBeenCalledTimes(1);
        resolve();
      });
    });
  });
});
