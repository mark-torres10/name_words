import englishWords from "an-array-of-english-words";
import { normalizeWordToken } from "./normalize";

const WORD_SET: ReadonlySet<string> = new Set(
  englishWords.map((w) => normalizeWordToken(w)).filter(Boolean),
);

export function isDictionaryWord(word: string): boolean {
  const normalized = normalizeWordToken(word);
  if (!normalized) return false;
  return WORD_SET.has(normalized);
}

