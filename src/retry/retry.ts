import { setTimeout as sleep } from "node:timers/promises";

export type RetryOptions = {
  retries: number;
  delayMs: number;
};

export async function retry<T>(
  operation: () => Promise<T>,
  options: Readonly<RetryOptions>,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (options.retries <= 0) {
      throw error;
    }
    await sleep(options.delayMs);
    return retry(operation, { ...options, retries: options.retries - 1 });
  }
}
