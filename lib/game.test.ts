import { describe, expect, it } from "vitest";
import { normalizeTimerSeconds, pickLetterPair } from "./game";

describe("normalizeTimerSeconds", () => {
  it("defaults when given empty input", () => {
    expect(normalizeTimerSeconds("")).toBe(30);
  });

  it("clamps to min and max", () => {
    expect(normalizeTimerSeconds("-10")).toBe(1);
    expect(normalizeTimerSeconds(999999)).toBe(60 * 60);
  });

  it("floors non-integers", () => {
    expect(normalizeTimerSeconds("12.9")).toBe(12);
  });
});

describe("pickLetterPair", () => {
  it("returns two distinct uppercase letters", () => {
    const { startLetter, endLetter } = pickLetterPair(() => 0.0);
    expect(startLetter).toMatch(/^[A-Z]$/);
    expect(endLetter).toMatch(/^[A-Z]$/);
    expect(endLetter).not.toBe(startLetter);
  });

  it("is deterministic with a deterministic rng", () => {
    let i = 0;
    const seq = [0.0, 0.0];
    const rng = () => seq[i++] ?? 0.0;
    expect(pickLetterPair(rng)).toEqual({ startLetter: "A", endLetter: "B" });
  });
});

