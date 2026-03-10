export const DEFAULT_TIMER_SECONDS = 30;
export const MIN_TIMER_SECONDS = 1;
export const MAX_TIMER_SECONDS = 60 * 60;

export function normalizeTimerSeconds(
  input: string | number,
  {
    defaultSeconds = DEFAULT_TIMER_SECONDS,
    minSeconds = MIN_TIMER_SECONDS,
    maxSeconds = MAX_TIMER_SECONDS,
  }: {
    defaultSeconds?: number;
    minSeconds?: number;
    maxSeconds?: number;
  } = {},
): number {
  const n =
    typeof input === "number"
      ? input
      : input.trim() === ""
        ? Number.NaN
        : Number(input);

  if (!Number.isFinite(n)) return defaultSeconds;

  const whole = Math.floor(n);
  return Math.min(maxSeconds, Math.max(minSeconds, whole));
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function pickLetterPair(rng: () => number = Math.random): {
  startLetter: string;
  endLetter: string;
} {
  const startIdx = Math.floor(rng() * LETTERS.length);
  const startLetter = LETTERS[startIdx] ?? "A";

  // pick an end index from remaining 25 letters
  const endOffset = Math.floor(rng() * (LETTERS.length - 1));
  const endIdx = endOffset >= startIdx ? endOffset + 1 : endOffset;
  const endLetter = LETTERS[endIdx] ?? "B";

  return { startLetter, endLetter };
}

