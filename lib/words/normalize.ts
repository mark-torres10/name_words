export function normalizeWordToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z]/g, "");
}

export function transcriptToNormalizedWords(transcript: string): string[] {
  return transcript
    .split(/\s+/g)
    .map(normalizeWordToken)
    .filter((w) => w.length > 0);
}

