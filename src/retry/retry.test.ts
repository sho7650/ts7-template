import { describe, expect, it, vi } from "vitest";
import { retry } from "./retry.ts";

describe("retry", () => {
  it("returns the value when the first attempt succeeds", async () => {
    const operation = vi.fn(() => Promise.resolve("ok"));

    await expect(retry(operation, { retries: 3, delayMs: 100 })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("waits delayMs after a failure and returns the value of the next successful attempt", async () => {
    vi.useFakeTimers();
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce("recovered");

    const result = retry(operation, { retries: 3, delayMs: 100 });

    await vi.advanceTimersByTimeAsync(99);
    expect(operation).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe("recovered");
    expect(operation).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("rejects with the last error after all retries are exhausted", async () => {
    vi.useFakeTimers();
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("attempt 1"))
      .mockRejectedValueOnce(new Error("attempt 2"))
      .mockRejectedValueOnce(new Error("attempt 3"));

    const result = retry(operation, { retries: 2, delayMs: 100 });
    const assertion = expect(result).rejects.toThrow("attempt 3");

    await vi.advanceTimersByTimeAsync(200);
    await assertion;
    expect(operation).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});
