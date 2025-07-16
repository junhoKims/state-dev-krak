import { createAtom } from "./core.js";
import { useAtom } from "./react.js";
import { act, renderHook } from "@testing-library/react";

describe("react", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["queueMicrotask"] });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("useAtom", () => {
    it("useAtom으로 상태를 읽고 업데이트할 수 있다", async () => {
      const baseAtom = createAtom(0);
      const { result } = renderHook(() => useAtom(baseAtom));

      expect(result.current[0]).toBe(0);
      result.current[1](1);

      await vi.waitFor(() => {
        expect(result.current[0]).toBe(1);
      });
    });

    it('useAtom으로 다른 값을 여러번 업데이트해도 한번만 리렌더링된다', async () => {
      const baseAtom = createAtom(0);
      const renderCountFn = vi.fn();
      
      const { result } = renderHook(() => {
        renderCountFn();
        return useAtom(baseAtom);
      });

      expect(result.current[0]).toBe(0);
      expect(renderCountFn).toHaveBeenCalledTimes(1);
      
      result.current[1](1);
      result.current[1](2);
      result.current[1](3);

      await vi.waitFor(() => {
        expect(result.current[0]).toBe(3);
        expect(renderCountFn).toHaveBeenCalledTimes(2);
      })
    })

    it('useAtom으로 동일한 값을 업데이트하면 리렌더링이 발생하지 않는다', async () => {
      const baseAtom = createAtom(0);
      const renderCountFn = vi.fn();

      const { result } = renderHook(() => {
        renderCountFn();
        return useAtom(baseAtom);
      })

      result.current[1](0);
      result.current[1](0);

      await vi.waitFor(() => {
        expect(renderCountFn).toHaveBeenCalledTimes(1);
      })
    })
  });
});
