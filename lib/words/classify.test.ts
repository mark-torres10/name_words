import { describe, expect, it } from "vitest";
import { classifyDictionaryWordForPair, matchesLetterPair } from "./classify";

describe("matchesLetterPair", () => {
  it("matches case-insensitively on normalized words", () => {
    expect(matchesLetterPair("Apple", "A", "e")).toBe(true);
    expect(matchesLetterPair("Apple", "A", "b")).toBe(false);
  });
});

describe("classifyDictionaryWordForPair", () => {
  it("returns green when it matches, red otherwise", () => {
    expect(
      classifyDictionaryWordForPair({
        word: "ab",
        startLetter: "A",
        endLetter: "B",
      }),
    ).toBe("green");
    expect(
      classifyDictionaryWordForPair({
        word: "apple",
        startLetter: "A",
        endLetter: "B",
      }),
    ).toBe("red");
  });
});

