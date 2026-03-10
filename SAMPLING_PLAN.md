# Letter sampling based on real frequencies

## Goal

Update our letter sampling (currently uniform `A–Z`) to sample letters according to **empirical English letter frequencies**, while preserving the existing constraint that the two sampled letters are distinct (`endLetter !== startLetter`).

Context: `lib/game.ts` currently picks `startLetter` uniformly from `ABCDEFGHIJKLMNOPQRSTUVWXYZ`, then picks `endLetter` uniformly from the remaining 25 letters.

## Findings (online research)

There is no single canonical “English letter frequency”; results vary by corpus (books vs web text), counting method (dictionary lemmas vs running text), and whether you measure **all letters in text** or position-specific frequencies (first letter of words, last letter, etc.).

Two high-signal, implementable sources:

- **Peter Norvig (Google Books n-grams, 2012 dataset)**: provides **A–Z percentages** for letters in a very large corpus (743.8B word tokens; 3.56T letters after filtering to A–Z). This is a strong default for “overall letter frequency in English text.”  
  Source: `https://norvig.com/mayzner.html`
- **Wikipedia summary table**: provides a common “texts vs dictionaries” frequency table and discussion of why frequencies vary (and links back to Norvig). Useful as a cross-check and for alternate frequency interpretations.  
  Source: `https://en.wikipedia.org/wiki/Letter_frequency`

### Recommended dataset

Use **Norvig’s overall letter percentages** as our default weights because:

- It’s corpus-based and large.
- It matches our current “sample letters” behavior (not word-initial-only).
- The table is already in the exact shape we need (A–Z → percentage).

If later the game semantics are “word starts with `startLetter` and ends with `endLetter`”, we may prefer **position-specific** weights (first-letter distribution for `startLetter`, last-letter distribution for `endLetter`). Norvig’s page includes position-by-position tables conceptually, but the simplest initial implementation is overall frequency for both letters.

## Proposed behavior

1. Sample `startLetter` from a weighted distribution over `A–Z`.
2. Sample `endLetter` from the **same weighted distribution, conditioned on `endLetter !== startLetter`**.

Important: step (2) should **not** be “uniform among remaining letters”; it should remain frequency-based.

## Weight table (Norvig, Google Books n-grams)

From Norvig’s “Letter Counts” table (percent of all letters A–Z in the filtered corpus):

| Letter | Percent |
| --- | ---: |
| A | 8.04 |
| B | 1.48 |
| C | 3.34 |
| D | 3.82 |
| E | 12.49 |
| F | 2.40 |
| G | 1.87 |
| H | 5.05 |
| I | 7.57 |
| J | 0.16 |
| K | 0.54 |
| L | 4.07 |
| M | 2.51 |
| N | 7.23 |
| O | 7.64 |
| P | 2.14 |
| Q | 0.12 |
| R | 6.28 |
| S | 6.51 |
| T | 9.28 |
| U | 2.73 |
| V | 1.05 |
| W | 1.68 |
| X | 0.23 |
| Y | 1.66 |
| Z | 0.09 |

Source: `https://norvig.com/mayzner.html`

Implementation note: we can treat these as weights (they do not need to sum to exactly 100.00 due to rounding; we just normalize by the total we compute).

## Sampling algorithm

### Weighted sampling (single letter)

Use a standard **CDF (cumulative distribution function)** approach:

- Precompute cumulative weights aligned to `LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"`.
- Draw `u = rng()` in \([0, 1)\).
- Convert to a target weight `t = u * totalWeight`.
- Find the first index where `cdf[idx] > t` (linear scan is fine for 26 items; binary search is trivial too).

This produces \(P(letter_i) = weight_i / \sum_j weight_j\).

### Sampling two distinct letters without bias

To sample `endLetter` with the constraint `endLetter !== startLetter` **and** keep frequency-based probabilities, we want:

\[
P(end = L \mid end \neq start) =
\frac{w(L)}{\sum_{K \neq start} w(K)} \quad \text{for } L \neq start
\]

The simplest correct implementation is **rejection sampling**:

- Draw from the same weighted distribution.
- If you hit `startLetter`, draw again.

Because each draw is from \(w(\cdot)\), conditioning on “not the start letter” yields exactly the normalized distribution over the remaining letters. Expected retries are small (e.g., if `startLetter = E` with ~12.49% weight, expected draws \(\approx 1/(1-0.1249) \approx 1.14\)).

Add a safety cap (e.g., 100 iterations) and a deterministic fallback (pick the most likely non-start letter) to avoid any theoretical infinite loop if `rng()` is pathological.

## Proposed TypeScript implementation shape

### Data representation

Keep `LETTERS` as the canonical order and define weights aligned to it:

```ts
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Norvig (Google Books n-grams) percentages as weights aligned to LETTERS.
const LETTER_WEIGHTS: readonly number[] = [
  8.04, 1.48, 3.34, 3.82, 12.49, 2.40, 1.87, 5.05, 7.57, 0.16, 0.54, 4.07, 2.51,
  7.23, 7.64, 2.14, 0.12, 6.28, 6.51, 9.28, 2.73, 1.05, 1.68, 0.23, 1.66, 0.09,
];
```

Add a small runtime assertion in dev/test (or a unit test) that `LETTER_WEIGHTS.length === LETTERS.length`.

### Helper: weighted pick

```ts
function pickWeightedIndex(weights: readonly number[], rng: () => number): number {
  let total = 0;
  for (const w of weights) total += w;

  // Clamp for safety if rng returns 1.0 exactly.
  const u = Math.min(Math.max(rng(), 0), 1 - Number.EPSILON);
  const t = u * total;

  let c = 0;
  for (let i = 0; i < weights.length; i++) {
    c += weights[i] ?? 0;
    if (t < c) return i;
  }

  return weights.length - 1; // fallback for rounding
}

function pickWeightedLetter(rng: () => number): string {
  const idx = pickWeightedIndex(LETTER_WEIGHTS, rng);
  return LETTERS[idx] ?? "A";
}
```

### Update `pickLetterPair`

```ts
export function pickLetterPair(rng: () => number = Math.random): {
  startLetter: string;
  endLetter: string;
} {
  const startLetter = pickWeightedLetter(rng);

  // Rejection sampling to preserve weights conditional on end != start.
  let endLetter = pickWeightedLetter(rng);
  for (let i = 0; i < 100 && endLetter === startLetter; i++) {
    endLetter = pickWeightedLetter(rng);
  }

  if (endLetter === startLetter) {
    // deterministic fallback: choose the most likely different letter
    // (implementation: scan max weight excluding startLetter)
  }

  return { startLetter, endLetter };
}
```

This is a minimal change from the current structure, keeps the injectable `rng`, and is easy to test.

## Test plan

- **Determinism**: with a seeded `rng`, ensure results are stable.
- **Constraint**: assert `startLetter !== endLetter` for many draws.
- **Distribution sanity**:
  - Run \(N = 100{,}000\) draws of `startLetter`; verify empirical frequencies roughly match weights (within tolerance, e.g. ±0.3% absolute for high-frequency letters; looser for rare letters like `Z`).
  - Run \(N\) draws of `endLetter` conditional on a fixed `startLetter = "E"`; verify `endLetter` never equals `"E"` and the rest are proportional to weights renormalized by \(1 - w(E)\).

## Edge cases / future extensions

- **Localization**: if we add non-English word sets, we should swap weight tables per language.
- **Game semantics**: if start/end correspond to first/last letters of words, consider **position-specific** distributions (word-initial and word-final) rather than overall letter frequencies.
- **Performance**: trivial at 26 letters; current approach is effectively constant time.

