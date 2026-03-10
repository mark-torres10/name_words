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
    // Under weighted sampling, 0.0 selects "A".
    // The second 0.0 would also select "A" and must be rejected.
    // 0.5 selects "L" with the chosen weights (cumulative crosses ~49.99 at "L").
    const seq = [0.0, 0.0, 0.5];
    const rng = () => seq[i++] ?? 0.0;
    expect(pickLetterPair(rng)).toEqual({ startLetter: "A", endLetter: "L" });
  });

  it("does not hang when rng repeats start letter", () => {
    let i = 0;
    const seq = Array.from({ length: 50 }, () => 0.0).concat([0.5]);
    const rng = () => seq[i++] ?? 0.5;
    expect(pickLetterPair(rng)).toEqual({ startLetter: "A", endLetter: "L" });
  });
});

