## Remember
- Exact file paths always
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Overview
Add a **microphone button** to the existing Next.js (App Router) UI that, when toggled on, captures speech and produces a stream of **candidate words**. Each candidate word is checked against an **in-memory dictionary** and then classified into:
- **Green tag**: valid dictionary word **and** starts with `startLetter` and ends with `endLetter`
- **Red tag**: valid dictionary word, but **does not** match the current `(startLetter, endLetter)` constraints

The word tags render at the bottom of the game card, updating as recognition emits results.

## Plan assets (screenshots, notes)
Store plan assets in:

`docs/plans/2026-03-09_voice_mic_transcription_482913/`

- Before screenshots: `docs/plans/2026-03-09_voice_mic_transcription_482913/images/before/`
- After screenshots: `docs/plans/2026-03-09_voice_mic_transcription_482913/images/after/`

## What “native mic + transcription” means here
- **Mic access**: browser permission prompt (HTTPS/localhost required).
- **Transcription**: speech-to-text produces strings; we split into words, normalize (casefold + strip punctuation), then validate/classify.
- **No persistence (initially)**: all recognized words live in React state (in-memory), resettable.

## Audio transcription module options (pick one)

### Option A (MVP): Web Speech API (SpeechRecognition)
- **What**: `window.SpeechRecognition` / `window.webkitSpeechRecognition` (built-in, no external service setup).
- **Pros**: fastest to ship; low code; streaming/interim results; no extra infra.
- **Cons**: browser support is uneven (good on Chrome/Edge; weaker/absent on Firefox; varies on Safari/iOS); recognition quality depends on platform; privacy policy varies (often cloud-backed).
- **Best for**: prototyping and quick iteration.
- **Implementation sketch**:
  - New hook `lib/useSpeechRecognition.ts` (client-only) wrapping start/stop/events.
  - UI shows “Mic unsupported” on unsupported browsers.

### Option B: In-browser Whisper (on-device via WebGPU / WASM)
- **What**: run Whisper locally in the browser (e.g. `@xenova/transformers` Whisper models, or a `whisper.cpp`-derived WASM/WebGPU build).
- **Pros**: works offline (once model cached); better control over behavior; privacy-friendly (no server).
- **Cons**: large model downloads; slow on low-end devices; more complex bundling; battery/CPU heavy.
- **Best for**: “offline-first” or privacy-sensitive modes.
- **Implementation sketch**:
  - `lib/transcription/whisper.ts` loads model lazily and exposes `start()`/`stop()` + transcript callback.
  - Use VAD (voice activity detection) or push-to-talk to control segments.

### Option C: Server/API-backed transcription (Whisper/service)
- **What**: record audio in the browser (`MediaRecorder`) and send chunks/segments to:
  - A hosted API (OpenAI/Deepgram/Google Speech-to-Text), or
  - A self-hosted Whisper service (e.g. `whisper.cpp` server)
- **Pros**: broad client compatibility; consistent accuracy; smaller frontend bundle.
- **Cons**: latency; cost; privacy/compliance; requires backend + keys + rate limits.
- **Best for**: “works everywhere” with stable results.
- **Implementation sketch**:
  - `app/api/transcribe/route.ts` receives audio blobs and returns transcript text.
  - Client `lib/transcription/server.ts` manages buffering + retries + backpressure.

### Option D: Vosk (offline) via WASM
- **What**: Vosk speech recognition in browser via WASM (small-ish models compared to Whisper).
- **Pros**: offline; faster than Whisper on some devices; predictable footprint per model.
- **Cons**: model quality/language coverage varies; integration complexity; still non-trivial payload.
- **Best for**: offline mode with smaller footprint than Whisper.

### Recommendation
Start with **Option A (Web Speech API)** for the fastest end-to-end UX. Keep the transcription interface abstracted so we can later swap in **Option B/C/D** without rewriting the UI.

## Dictionary / word validity module options (quick in-memory lookups)

### Option 1 (simple, client-side): ship a word list array + Set
- Candidate libs: `an-array-of-english-words` or `word-list-json`
- Build `const WORDS = new Set(wordsArray)` once (module scope), lookups are \(O(1)\).
- Trade-off: bundle size increase (can be a few hundred KB+).

### Option 2 (smaller): Bloom filter
- Precompute a Bloom filter from a word list at build time; ship filter bitset to the client.
- Trade-off: false positives (tunable), but no false negatives; more engineering.

### Option 3 (server-side): API check
- Keep the word list server-side and call an endpoint to validate words.
- Trade-off: network latency; needs caching/debouncing.

### Recommendation
Start with **Option 1** (word list + `Set`) for correctness and speed. If bundle size becomes an issue, migrate to **Option 2**.

## Proposed code structure (exact paths)
- **UI integration**: `components/letter-timer-game.tsx`
- **Speech abstraction**:
  - `lib/transcription/types.ts` (common interfaces)
  - `lib/transcription/web-speech.ts` (Option A implementation)
  - (future) `lib/transcription/whisper.ts`, `lib/transcription/server.ts`, etc.
- **Hook**: `lib/useTranscription.ts` (selects implementation + exposes React-friendly state)
- **Word parsing + classification**:
  - `lib/words/normalize.ts`
  - `lib/words/dictionary.ts`
  - `lib/words/classify.ts`
- **(Optional) UI component for tags**: `components/recognized-words.tsx`

## Happy flow (end-to-end)
1. User clicks **Start** in `components/letter-timer-game.tsx` → `startLetter`/`endLetter` are chosen (already implemented in `lib/game.ts`).
2. User clicks **Mic** (new button in `components/letter-timer-game.tsx`).
3. `lib/useTranscription.ts` starts the transcription engine (initially `lib/transcription/web-speech.ts`).
4. Engine emits transcript segments → `useTranscription` accumulates and emits **finalized text** events.
5. New module `lib/words/normalize.ts` splits transcript into candidate tokens and normalizes to a comparable form (e.g., lowercase letters only).
6. For each normalized token:
   - `lib/words/dictionary.ts` checks membership (in-memory `Set`)
   - `lib/words/classify.ts` classifies as:
     - green: dictionary-valid AND starts/ends with current letters
     - red: dictionary-valid BUT does not match current letters
7. UI renders tags at the bottom of the card; green/red styling via Tailwind classes.
8. User toggles mic off (stop recognition) or hits Reset (clears recognized words + stops mic).

## Detailed implementation steps (with verification outcomes)
1. **(UI) Capture before screenshots**
   - Run `npm run dev`
   - Visit `http://localhost:3000`
   - Capture the “idle” screen and the “running with letter pair” screen into:
     - `docs/plans/2026-03-09_voice_mic_transcription_482913/images/before/`

2. **Add transcription abstraction**
   - Add `lib/transcription/types.ts`:
     - `TranscriptionEngine` interface: `start()`, `stop()`, `onResult(cb)`, `onError(cb)`, `isSupported()`
   - Add Option A implementation `lib/transcription/web-speech.ts` wrapping SpeechRecognition.
   - Add `lib/useTranscription.ts`:
     - state: `isSupported`, `isListening`, `lastError`, `finalSegments[]` (or emitted callbacks)
   - **Outcome**: unit tests can mock engine and assert that start/stop toggles state.

3. **Add word list lookup**
   - Add dependency (one of):
     - `an-array-of-english-words` (preferred for simplicity), or
     - `word-list-json`
   - Implement `lib/words/dictionary.ts` exporting:
     - `isDictionaryWord(word: string): boolean`
   - **Outcome**: `isDictionaryWord("apple") === true`; `isDictionaryWord("asdjkh") === false`.

4. **Add parsing + classification**
   - Implement `lib/words/normalize.ts`:
     - tokenization (split on whitespace/punct)
     - normalization (lowercase; strip non-letters; drop empty)
   - Implement `lib/words/classify.ts`:
     - `classifyWord({ word, startLetter, endLetter, isValid }) -> "green" | "red" | "ignore"`
     - “ignore” can be used for non-dictionary words (not rendered initially).
   - **Outcome**: deterministic classification for a set of cases in tests.

5. **Wire into the game UI**
   - Update `components/letter-timer-game.tsx`:
     - Add mic toggle button (disabled until a letter pair exists, or allowed always—pick one behavior and test it).
     - While mic is active, show subtle “Listening…” indicator.
     - Render recognized word tags at the bottom of the card.
     - On Reset: stop mic and clear recognized words.
   - **Outcome**: tags appear and update; Reset clears them and stops recognition.

6. **Tests**
   - Add `lib/words/*.test.ts` for normalization + classification.
   - Add a React test updating `components/letter-timer-game.test.tsx` that:
     - stubs the transcription hook/engine (so tests don’t require real mic)
     - emits “final” transcript text and asserts green/red tag rendering.
   - **Outcome**: `npm test` passes in CI/headless.

7. **(UI) Capture after screenshots**
   - Re-run `npm run dev`
   - Capture the same screens plus “listening with tags” into:
     - `docs/plans/2026-03-09_voice_mic_transcription_482913/images/after/`

## Manual verification checklist
- **Dev server**
  - Command: `npm run dev`
  - Expected: Next dev server starts and page loads at `http://localhost:3000`
- **Mic permissions**
  - Click mic → browser prompts for microphone permission
  - Accept → UI indicates listening (and doesn’t crash)
- **Green/red behavior**
  - Start game to get letters
  - Speak a few dictionary words that:
    - match the start/end letters → appear green
    - don’t match start/end letters → appear red
- **Reset behavior**
  - Click Reset → letters cleared, recognized words cleared, mic stopped
- **Unsupported browser behavior**
  - If SpeechRecognition is unavailable: mic control is disabled with a clear “not supported” hint (no runtime errors)
- **Tests**
  - Command: `npm test`
  - Expected: all tests green

## Alternative approaches (and why not first)
- **Build server transcription first (Option C)**: better compatibility, but adds infra, cost, secrets management, and latency—overkill for first iteration.
- **Ship Whisper/Vosk first (Option B/D)**: can be great long-term, but payload/perf/bundling complexity makes it slower to get a polished MVP.
- **Skip dictionary validation**: easiest, but you explicitly want “valid word” vs “valid but wrong context”, so we need a dictionary gate.

