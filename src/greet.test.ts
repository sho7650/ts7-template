import { describe, expect, it } from "vitest";
import { greet } from "./greet.ts";

describe("greet", () => {
  it("greets the given name", () => {
    expect(greet("TypeScript")).toBe("Hello, TypeScript!");
  });
});
