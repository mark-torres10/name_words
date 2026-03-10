import { normalizeWordToken } from "./normalize";

export type WordTagKind = "green" | "red";

export function matchesLetterPair(
  word: string,
  startLetter: string,
  endLetter: string,
): boolean {
  const w = normalizeWordToken(word);
  const start = normalizeWordToken(startLetter);
  const end = normalizeWordToken(endLetter);
  if (!w || start.length !== 1 || end.length !== 1) return false;
  return w.startsWith(start) && w.endsWith(end);
}

export function classifyDictionaryWordForPair(args: {
  word: string;
  startLetter: string;
  endLetter: string;
}): WordTagKind {
  return matchesLetterPair(args.word, args.startLetter, args.endLetter)
    ? "green"
    : "red";
}

