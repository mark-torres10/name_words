import { describe, expect, it } from "vitest";
import { normalizeWordToken, transcriptToNormalizedWords } from "./normalize";

describe("normalizeWordToken", () => {
  it("lowercases and strips non-letters", () => {
    expect(normalizeWordToken("Hello!")).toBe("hello");
    expect(normalizeWordToken("re-enter")).toBe("reenter");
    expect(normalizeWordToken("123")).toBe("");
  });
});

describe("transcriptToNormalizedWords", () => {
  it("splits transcript and normalizes tokens", () => {
    expect(transcriptToNormalizedWords("Hello, WORLD!!")).toEqual([
      "hello",
      "world",
    ]);
  });
});

