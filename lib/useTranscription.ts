"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const engineRef = useRef<TranscriptionEngine | null>(null);

  const onFinalRef = useRef<typeof onFinalTranscript>(onFinalTranscript);
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<TranscriptionError | null>(null);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsSupported(false);
      return;
    }
    const engine =
      engineFactory?.() ?? engineRef.current ?? new WebSpeechEngine(window);
    engineRef.current = engine;
    setIsSupported(engine.isSupported());
  }, [engineFactory]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") {
      setError({ error: "not-supported", message: "window is not available" });
      setIsListening(false);
      setIsSupported(false);
      return;
    }

    if (!engineRef.current) {
      engineRef.current = engineFactory?.() ?? new WebSpeechEngine(window);
      setIsSupported(engineRef.current.isSupported());
    }

    setError(null);
    engineRef.current.start({
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
  }, [continuous, engineFactory, interimResults, lang, maxAlternatives]);

  return { isSupported, isListening, error, start, stop };
}

