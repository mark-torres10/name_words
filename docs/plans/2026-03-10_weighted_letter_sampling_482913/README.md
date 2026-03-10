# Weighted letter sampling (English)

## Goal

Change `pickLetterPair()` (see `lib/game.ts`) from uniform `A–Z` sampling to **frequency-weighted** sampling, while preserving the invariant `endLetter !== startLetter`.

## Source of letter frequencies (chosen)

We use Peter Norvig’s analysis of English letter counts from the Google Books n-gram corpus (2012 dataset). It provides an explicit A–Z percentage table over a very large corpus filtered to A–Z.

- Source: `https://norvig.com/mayzner.html`

## Cross-check / background

Letter frequencies vary depending on corpus and counting method (dictionary lemmas vs running text, word-initial vs overall, etc.). Wikipedia’s overview is a good summary and links back to Norvig.

- Source: `https://en.wikipedia.org/wiki/Letter_frequency`

## Weight table (Norvig; percentages used as weights)

Aligned to `LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"`:

| Letter | Weight |
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

