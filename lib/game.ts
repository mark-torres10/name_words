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

// Weights aligned to LETTERS, from Peter Norvig's Google Books n-grams analysis.
// Source: https://norvig.com/mayzner.html
const LETTER_WEIGHTS: readonly number[] = [
  8.04, 1.48, 3.34, 3.82, 12.49, 2.4, 1.87, 5.05, 7.57, 0.16, 0.54, 4.07, 2.51,
  7.23, 7.64, 2.14, 0.12, 6.28, 6.51, 9.28, 2.73, 1.05, 1.68, 0.23, 1.66, 0.09,
];

function safeUnitInterval(rng: () => number): number {
  const raw = rng();
  if (!Number.isFinite(raw)) return 0;
  if (raw <= 0) return 0;
  if (raw >= 1) return 1 - Number.EPSILON;
  return raw;
}

function pickWeightedIndex(
  weights: readonly number[],
  rng: () => number,
): number {
  let total = 0;
  for (const w of weights) total += w;

  const t = safeUnitInterval(rng) * total;

  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i] ?? 0;
    if (t < cumulative) return i;
  }

  return Math.max(0, weights.length - 1);
}

export function pickLetterPair(rng: () => number = Math.random): {
  startLetter: string;
  endLetter: string;
} {
  const startIdx = pickWeightedIndex(LETTER_WEIGHTS, rng);
  const startLetter = LETTERS[startIdx] ?? "A";

  let endIdx = pickWeightedIndex(LETTER_WEIGHTS, rng);
  for (let i = 0; i < 100 && endIdx === startIdx; i++) {
    endIdx = pickWeightedIndex(LETTER_WEIGHTS, rng);
  }

  if (endIdx === startIdx) {
    let bestIdx = startIdx === 0 ? 1 : 0;
    for (let i = 0; i < LETTER_WEIGHTS.length; i++) {
      if (i === startIdx) continue;
      if ((LETTER_WEIGHTS[i] ?? 0) > (LETTER_WEIGHTS[bestIdx] ?? 0)) bestIdx = i;
    }
    endIdx = bestIdx;
  }

  const endLetter = LETTERS[endIdx] ?? "B";

  return { startLetter, endLetter };
}

