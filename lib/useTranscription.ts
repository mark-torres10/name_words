"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TranscriptionEngine, TranscriptionError } from "@/lib/transcription/types";
import { WebSpeechEngine } from "@/lib/transcription/web-speech";

export type UseTranscriptionOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onFinalTranscript?: (t: string) => void;
  engineFactory?: () => TranscriptionEngine;
};

export type UseTranscriptionState = {
  isSupported: boolean;
  isListening: boolean;
  error: TranscriptionError | null;
  start: () => void;
  stop: () => void;
};

export function useTranscription({
  lang = "en-US",
  continuous = true,
  interimResults = true,
  maxAlternatives = 1,
  onFinalTranscript,
  engineFactory,
}: UseTranscriptionOptions = {}): UseTranscriptionState {
  const engine = useMemo(
    () => (engineFactory ? engineFactory() : new WebSpeechEngine()),
    [engineFactory],
  );

  const onFinalRef = useRef<typeof onFinalTranscript>(onFinalTranscript);
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const [isSupported, setIsSupported] = useState<boolean>(() =>
    engine.isSupported(),
  );
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<TranscriptionError | null>(null);

  useEffect(() => {
    setIsSupported(engine.isSupported());
    return () => {
      engine.dispose();
    };
  }, [engine]);

  const stop = useCallback(() => {
    engine.stop();
    setIsListening(false);
  }, [engine]);

  const start = useCallback(() => {
    setError(null);
    engine.start({
      lang,
      continuous,
      interimResults,
      maxAlternatives,
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onError: (err) => {
        setError(err);
        setIsListening(false);
      },
      onFinalTranscript: (t) => onFinalRef.current?.(t),
    });
  }, [continuous, engine, interimResults, lang, maxAlternatives]);

  return { isSupported, isListening, error, start, stop };
}

