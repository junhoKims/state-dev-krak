import { createAtom, get, set, subscribe } from "./core.js";

describe("core", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["queueMicrotask"] });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("get", () => {
    it("Atom의 현재 값을 가져올 수 있다", () => {
      const baseAtom = createAtom(0);
      expect(get(baseAtom)).toBe(0);

      const objectAtom = createAtom({ count: 1 });
      expect(get(objectAtom)).toEqual({ count: 1 });

      const arrayAtom = createAtom(["a", "b"]);
      expect(get(arrayAtom)).toEqual(["a", "b"]);
    });
  });

  describe("set", () => {
    it("Atom의 값을 변경할 수 있다", () => {
      const baseAtom = createAtom(0);
      expect(get(baseAtom)).toBe(0);

      set(baseAtom, 1);
      expect(get(baseAtom)).toBe(1);
    });

    it("Object.is를 통한 동일성 검사가 올바르게 작동한다", async () => {
      const nanAtom = createAtom(NaN);
      const nanCallback = vi.fn();
      subscribe(nanAtom, nanCallback);
      set(nanAtom, NaN);

      await vi.waitFor(() => {
        expect(nanCallback).toHaveBeenCalledTimes(0);
      });

      const obj = { count: 1 };
      const objAtom = createAtom(obj);
      const objCallback = vi.fn();
      subscribe(objAtom, objCallback);
      set(objAtom, obj);

      await vi.waitFor(() => {
        expect(objCallback).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe("subscribe", () => {
    it("`Atom`의 값이 바뀌면 콜백이 호출된다", async () => {
      const baseAtom = createAtom(0);
      const callback = vi.fn();
      subscribe(baseAtom, callback);
      set(baseAtom, 1);

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    it("동일한 값으로 업데이트 시 구독자가 호출되지 않는다", async () => {
      const baseAtom = createAtom(0);
      const callback = vi.fn();
      subscribe(baseAtom, callback);

      set(baseAtom, 0);
      set(baseAtom, 0);

      await vi.waitFor(() => {
        expect(callback).not.toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledTimes(0);
      });
    });

    it("`Atom`의 값이 여러번 변경되도 배칭 업데이트 되어 한번만 콜백이 호출된다", async () => {
      const baseAtom = createAtom(0);
      const callback = vi.fn();
      subscribe(baseAtom, callback);

      set(baseAtom, 1);
      set(baseAtom, 2);
      set(baseAtom, 3);

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    it("여러 구독자가 모두 알림을 받는다", async () => {
      const baseAtom = createAtom(0);
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      subscribe(baseAtom, callback1);
      subscribe(baseAtom, callback2);

      set(baseAtom, 1);

      await vi.waitFor(() => {
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
      });
    });

    it("unsubscribe 함수가 올바르게 작동한다", async () => {
      const baseAtom = createAtom(0);
      const callback = vi.fn();
      const unsubscribe = subscribe(baseAtom, callback);

      unsubscribe();
      set(baseAtom, 2);

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe("createAtom", () => {
    it("Atom을 생성할 수 있다", () => {
      const baseAtom = createAtom(0);
      expect(get(baseAtom)).toBe(0);

      expect(baseAtom.hasOwnProperty("_getValue")).toBe(true);
      expect(baseAtom.hasOwnProperty("_setValue")).toBe(true);
      expect(baseAtom.hasOwnProperty("_subscribe")).toBe(true);
    });
  });
});
