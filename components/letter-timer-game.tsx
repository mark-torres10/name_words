"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TIMER_SECONDS,
  normalizeTimerSeconds,
  pickLetterPair,
} from "@/lib/game";
import { useTranscription } from "@/lib/useTranscription";
import { isDictionaryWord } from "@/lib/words/dictionary";
import { classifyDictionaryWordForPair } from "@/lib/words/classify";
import { transcriptToNormalizedWords } from "@/lib/words/normalize";

type Phase = "idle" | "running" | "finished";

type RecognizedWord = {
  word: string;
  kind: "green" | "red";
};

export function LetterTimerGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [timerInput, setTimerInput] = useState<string>(
    String(DEFAULT_TIMER_SECONDS),
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_TIMER_SECONDS);
  const [startLetter, setStartLetter] = useState<string | null>(null);
  const [endLetter, setEndLetter] = useState<string | null>(null);
  const [recognizedWords, setRecognizedWords] = useState<RecognizedWord[]>([]);

  const canEditTimer = phase !== "running";
  const canStart = phase === "idle";

  const displaySeconds = useMemo(() => {
    if (phase === "idle") return normalizeTimerSeconds(timerInput);
    return secondsLeft;
  }, [phase, secondsLeft, timerInput]);

  const { isSupported, isListening, error, start, stop } = useTranscription({
    onFinalTranscript: (t) => {
      if (!startLetter || !endLetter) return;
      const tokens = transcriptToNormalizedWords(t);
      if (tokens.length === 0) return;

      setRecognizedWords((prev) => {
        const seen = new Set(prev.map((w) => w.word));
        const next = [...prev];

        for (const word of tokens) {
          if (seen.has(word)) continue;
          if (!isDictionaryWord(word)) continue;
          const kind = classifyDictionaryWordForPair({
            word,
            startLetter,
            endLetter,
          });
          next.push({ word, kind });
          seen.add(word);
        }
        return next;
      });
    },
  });

  useEffect(() => {
    if (phase !== "running") return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          setPhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "finished") stop();
  }, [phase, stop]);

  function onStart() {
    if (!canStart) return;
    const seconds = normalizeTimerSeconds(timerInput);
    const pair = pickLetterPair();

    setStartLetter(pair.startLetter);
    setEndLetter(pair.endLetter);
    setRecognizedWords([]);
    setSecondsLeft(seconds);
    setPhase("running");
  }

  function onReset() {
    stop();
    setPhase("idle");
    setTimerInput(String(DEFAULT_TIMER_SECONDS));
    setSecondsLeft(DEFAULT_TIMER_SECONDS);
    setStartLetter(null);
    setEndLetter(null);
    setRecognizedWords([]);
  }

  const isZero = phase === "finished" && secondsLeft === 0;
  const canUseMic = Boolean(startLetter && endLetter && phase === "running");
  const { rightCount, wrongCount } = useMemo(() => {
    let right = 0;
    let wrong = 0;
    for (const w of recognizedWords) {
      if (w.kind === "green") right++;
      else wrong++;
    }
    return { rightCount: right, wrongCount: wrong };
  }, [recognizedWords]);

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] text-white/70">
              RETRO LETTER RUN
            </div>
            <div className="text-sm text-white/80">
              Start, race the clock, hit zero.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition enabled:hover:translate-y-[-1px] enabled:hover:bg-white/90 disabled:opacity-50"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => (isListening ? stop() : start())}
              disabled={!isSupported || !canUseMic}
              className={[
                "rounded-full border px-5 py-2 text-sm font-semibold transition disabled:opacity-50",
                isListening
                  ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/25"
                  : "border-white/30 bg-white/5 text-white hover:bg-white/10",
              ].join(" ")}
              aria-pressed={isListening}
            >
              {isListening ? "Stop mic" : "Mic"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-white/30 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-black/30 p-4">
            <label
              htmlFor="seconds-input"
              className="block text-xs font-semibold tracking-wide text-white/70"
            >
              Seconds
            </label>
            <div className="mt-2 flex items-end gap-3">
              <input
                id="seconds-input"
                type="number"
                min={1}
                max={3600}
                step={1}
                disabled={!canEditTimer}
                value={timerInput}
                onChange={(e) => setTimerInput(e.target.value)}
                className="w-28 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-lg font-semibold text-white outline-none ring-0 placeholder:text-white/30 disabled:opacity-60"
              />
              <div className="text-xs text-white/60">
                Default: {DEFAULT_TIMER_SECONDS}s
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-black/30 p-4">
            <div className="text-xs font-semibold tracking-wide text-white/70">
              Time left
            </div>
            <div
              data-testid="timer-display"
              className={[
                "mt-2 inline-flex min-w-24 items-center justify-center rounded-2xl px-4 py-3 text-4xl font-black tabular-nums",
                isZero ? "isZero" : "text-white",
              ].join(" ")}
            >
              {displaySeconds}
            </div>
          </div>
        </div>

        {startLetter && endLetter ? (
          <div
            className="mt-6 flex items-center justify-center gap-3"
            data-testid="letter-pair"
          >
            <span className="letterBadge">{startLetter}</span>
            <span className="text-white/60">→</span>
            <span className="letterBadge">{endLetter}</span>
          </div>
        ) : (
          <div className="mt-6 text-center text-sm text-white/70">
            Press <span className="font-semibold text-white">Start</span> to get
            a letter pair.
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/60">
          <div>
            {!isSupported ? (
              <span>Mic not supported in this browser.</span>
            ) : isListening ? (
              <span className="font-semibold text-white/80">Listening…</span>
            ) : (
              <span>Mic ready.</span>
            )}
          </div>
          {error ? (
            <div className="rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1 text-rose-100">
              Mic error: {error.error}
            </div>
          ) : null}
        </div>

        {recognizedWords.length > 0 ? (
          <div className="mt-5">
            <div className="text-xs font-semibold tracking-wide text-white/70">
              Recognized
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recognizedWords.map((w) => (
                <span
                  key={w.word}
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
                    w.kind === "green"
                      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-50"
                      : "border-rose-400/40 bg-rose-500/20 text-rose-50",
                  ].join(" ")}
                >
                  {w.word}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide">
              <span
                data-testid="score-right"
                className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-emerald-50"
              >
                Right: {rightCount}
              </span>
              <span
                data-testid="score-wrong"
                className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-rose-50"
              >
                Wrong: {wrongCount}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

