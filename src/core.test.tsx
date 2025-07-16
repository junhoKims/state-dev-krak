import { Suspense, Component } from "react";
import { act, renderHook, screen } from "@testing-library/react";
import { useAtom } from "./react.js";
import { createAsyncAtom, createAtom, get, set, subscribe } from "./core.js";
import type * as React from "react";


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
    it("Atom의 값이 바뀌면 콜백이 호출된다", async () => {
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

    it("Atom의 값이 여러번 변경되도 배칭 업데이트 되어 한번만 콜백이 호출된다", async () => {
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

  describe("createAsyncAtom", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    const LOADING_MSG = "loading...";
    const ERROR_MSG = "error...";

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("promise가 pending중에는 promise를 throw하고, fulfilled 이후 결과를 반환한다", async () => {
      const promise = new Promise((resolve) => resolve("success data"));
      const asyncAtom = createAsyncAtom(promise);

      const wrapper = createWrapper(LOADING_MSG, ERROR_MSG);
      const { result } = renderHook(() => useAtom(asyncAtom), { wrapper });

      await act(async () => {
        expect(screen.getByText(LOADING_MSG)).toBeInTheDocument();
        expect(result.current).toBeNull();
      });

      await act(async () => {
        expect(result.current[0]).toBe("success data");
      });
    });

    it("promise가 rejected 된 경우 error를 throw한다", async () => {
      const promise = new Promise((_, reject) => reject("error"));
      const asyncAtom = createAsyncAtom(promise);

      const wrapper = createWrapper(LOADING_MSG, ERROR_MSG);
      renderHook(() => useAtom(asyncAtom), { wrapper });

      await act(async () => {
        expect(screen.getByText(LOADING_MSG)).toBeInTheDocument();
        expect(() => get(asyncAtom)).toThrow();
      });

      await act(async () => {
        expect(screen.getByText(ERROR_MSG)).toBeInTheDocument();
        expect(() => get(asyncAtom)).toThrow();
      });
    });
  });
});

const createWrapper = (loadingMsg: string, errorMsg: string) => {
  return ({ children }: { children: React.ReactNode }) => {
    return (
      <ErrorBoundary fallback={<div>{errorMsg}</div>}>
        <Suspense fallback={<div>{loadingMsg}</div>}>{children}</Suspense>
      </ErrorBoundary>
    );
  };
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return <>{this.props.fallback}</>;
    }
    return <>{this.props.children}</>;
  }
}
