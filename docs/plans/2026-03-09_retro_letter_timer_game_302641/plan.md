---
name: retro timer game
overview: "Build a small single-page Next.js game for Vercel: the player sets a timer, presses Start to get a random start/end letter pair, watches the countdown hit zero with a flashing red state, and can Reset back to the initial state."
todos:
  - id: before-screenshots
    content: Capture baseline screenshots in `docs/plans/2026-03-09_retro_letter_timer_game_302641/images/before/` from the initial Next.js starter page before any custom UI work.
    status: cancelled
  - id: bootstrap-next-app
    content: Scaffold the project in `/Users/mark/Documents/name_words` with Next.js App Router, npm, TypeScript, ESLint, and the plan asset directory `docs/plans/2026-03-09_retro_letter_timer_game_302641/`.
    status: completed
  - id: add-test-harness
    content: Install and configure Vitest + Testing Library for `lib/game.ts` and `components/letter-timer-game.tsx` behavior tests.
    status: completed
  - id: write-failing-tests
    content: Write failing tests for timer normalization, random letter-pair generation, countdown completion, zero-state styling, and reset behavior before implementing the UI.
    status: completed
  - id: implement-game-ui
    content: Build the centered single-page game in `app/page.tsx`, `components/letter-timer-game.tsx`, and `lib/game.ts` with editable timer input, Start, countdown, flashing zero state, and Reset.
    status: completed
  - id: style-retro-theme
    content: Apply the colorful cute retro 80s visual treatment in `app/globals.css` while keeping the app single-screen and centered.
    status: completed
  - id: local-verify
    content: Run `npm run test`, `npm run lint`, `npm run build`, and a manual browser pass at `http://localhost:3000`.
    status: in_progress
  - id: deploy-vercel
    content: Deploy the finished app with `npx vercel --prod` and record the resulting production URL as the final delivery.
    status: pending
  - id: after-screenshots
    content: Capture final screenshots in `docs/plans/2026-03-09_retro_letter_timer_game_302641/images/after/` showing the finished game UI and zero-state presentation.
    status: pending
isProject: false
---

# Build Retro Letter Timer Game

## Remember

- Exact file paths always
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Overview

Create a Vercel-ready `Next.js` App Router app in `/Users/mark/Documents/name_words` that renders a single centered game card with a colorful cute retro 80s visual style. The game stays intentionally small: an editable timer input defaults to `30`, `Start` picks a random start letter and end letter, the countdown runs to `0` and visibly flashes red at zero, and `Reset` restores the initial timer and clears the selected letters.

## Plan

1. Bootstrap the app in `/Users/mark/Documents/name_words` with `Next.js` and the minimum tooling needed for confidence.
  - Run `npx create-next-app@latest . --ts --eslint --app --use-npm --import-alias "@/*"` and expect a successful scaffold message plus generated files such as `[package.json](package.json)`, `[app/layout.tsx](app/layout.tsx)`, `[app/page.tsx](app/page.tsx)`, and `[app/globals.css](app/globals.css)`.
  - Add lightweight test tooling with `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event` so timer/letter logic can be verified without introducing heavier infrastructure.
  - Create the plan asset directory `docs/plans/2026-03-09_retro_letter_timer_game_302641/` with screenshot targets at `docs/plans/2026-03-09_retro_letter_timer_game_302641/images/before/` and `docs/plans/2026-03-09_retro_letter_timer_game_302641/images/after/`.
2. Capture the baseline UI before custom implementation.
  - Start the scaffold with `npm run dev` and open `http://localhost:3000`.
  - Save a baseline screenshot of the starter page into `docs/plans/2026-03-09_retro_letter_timer_game_302641/images/before/` so the final result has a before/after comparison.
3. Write tests first for the pure game behavior and the main user interactions.
  - Add a small helper module at `[lib/game.ts](lib/game.ts)` for `normalizeTimerSeconds()` and `pickLetterPair()` so random-letter and timer sanitization logic are independently testable.
  - Add tests in `[lib/game.test.ts](lib/game.test.ts)` for valid timer coercion, minimum bounds, and distinct ordered letter-pair selection.
  - Add a component interaction test in `[components/letter-timer-game.test.tsx](components/letter-timer-game.test.tsx)` to cover: default `30`, editing the timer before start, `Start` locking in a pair and beginning countdown, zero-state flash class, and `Reset` restoring the idle UI.
4. Implement the one-page game UI and state management.
  - Keep `[app/page.tsx](app/page.tsx)` as a thin server component that renders a single client component, e.g. `[components/letter-timer-game.tsx](components/letter-timer-game.tsx)`, to minimize serialized props and keep interactivity isolated.
  - In `[components/letter-timer-game.tsx](components/letter-timer-game.tsx)`, manage only the needed client state: `timerInput`, `secondsLeft`, `phase` (`idle | running | finished`), and the selected `startLetter` / `endLetter`.
  - Use a single interval effect that decrements once per second while running, clears itself at zero, and toggles a zero-state class instead of adding scoring, persistence, or extra game phases.
  - Disable timer editing during an active countdown to keep state simple and deterministic.
5. Style the page to match the requested look while remaining centered and single-screen.
  - Use `[app/globals.css](app/globals.css)` for the full-page gradient/background, arcade-like card treatment, chunky buttons, playful letter badges, and the flashing red zero-state animation.
  - Keep all content vertically and horizontally centered with no additional routes, navigation, or multi-screen flow.
6. Verify locally, then deploy to Vercel and capture the finished UI.
  - Run `npm run test` and expect all Vitest suites to pass.
  - Run `npm run lint` and expect zero ESLint errors.
  - Run `npm run build` and expect a successful Next.js production build.
  - Deploy with `npx vercel --prod` and expect Vercel to print a production URL that becomes the final delivery.
  - Capture the completed game screen in `docs/plans/2026-03-09_retro_letter_timer_game_302641/images/after/`.

## Happy Flow

1. Visiting `/` renders `[app/page.tsx](app/page.tsx)`, which centers a single interactive game component on the page.
2. `[components/letter-timer-game.tsx](components/letter-timer-game.tsx)` shows an editable timer field initialized to `30`, plus `Start` and `Reset` controls.
3. Pressing `Start` calls `[lib/game.ts](lib/game.ts)` to derive a valid timer value and choose a random letter pair, then moves the component from `idle` to `running`.
4. While `phase === "running"`, the component’s interval decrements `secondsLeft` every second and updates the on-screen countdown.
5. When the countdown reaches `0`, the interval stops, `phase` becomes `finished`, and `[app/globals.css](app/globals.css)` applies a flashing red visual treatment to the timer display.
6. Pressing `Reset` clears the interval-driven state, removes the letters, restores the timer input to its default value, and returns the UI to the initial idle presentation.
7. After local verification, `npx vercel --prod` publishes the app and returns the production URL to share.

## Manual Verification

- `npx create-next-app@latest . --ts --eslint --app --use-npm --import-alias "@/*"`
  - Expected: scaffold completes successfully and creates the standard Next.js file set in the repo root.
- `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`
  - Expected: dependencies install without peer dependency errors.
- `npm run test`
  - Expected: tests for `lib/game.ts` and `components/letter-timer-game.tsx` pass.
- `npm run lint`
  - Expected: no ESLint errors.
- `npm run build`
  - Expected: successful production build output for the App Router app.
- `npm run dev`
  - Expected: local server available at `http://localhost:3000`.
- In the browser at `http://localhost:3000`:
  - Confirm the page is centered and fits on one screen.
  - Confirm the timer input displays `30` by default and accepts a new value such as `12` before the game starts.
  - Click `Start` and confirm two letters appear, the countdown begins immediately, and the timer input is no longer editable while running.
  - Let the timer reach zero and confirm the timer display flashes red rather than going negative.
  - Click `Reset` and confirm the timer returns to `30`, the letters disappear, and the game returns to idle.
- `npx vercel --prod`
  - Expected: Vercel prints a production deployment URL; open it and repeat the happy-flow browser check on the hosted app.

## Alternative Approaches

A `Vite + React` SPA would also satisfy the requirements, but `Next.js` is the better default here because it aligns directly with Vercel’s deployment workflow, keeps the app structure familiar for future expansion, and does not materially increase complexity for a one-page experience. The implementation should also avoid adding scoring, persistence, or server APIs because they are out of scope and would dilute the one-shot delivery goal.