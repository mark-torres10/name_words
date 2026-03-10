import type {
  TranscriptionEngine,
  TranscriptionError,
  TranscriptionStartOptions,
} from "./types";

function getSpeechRecognitionCtor(
  w: Window | undefined,
): SpeechRecognitionConstructor | null {
  if (!w) return null;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) ?? null;
}

export class WebSpeechEngine implements TranscriptionEngine {
  private recognition: SpeechRecognition | null = null;
  private stopRequested = false;
  private listening = false;

  constructor(private readonly w?: Window) {}

  isSupported(): boolean {
    return getSpeechRecognitionCtor(this.w) != null;
  }

  start(opts: TranscriptionStartOptions): void {
    const Ctor = getSpeechRecognitionCtor(this.w);
    if (!Ctor) {
      opts.onError({
        error: "not-supported",
        message: "SpeechRecognition API not available in this browser.",
      });
      return;
    }

    this.stopRequested = false;

    if (!this.recognition) {
      this.recognition = new Ctor();
    }

    const recognition = this.recognition;
    recognition.lang = opts.lang;
    recognition.continuous = opts.continuous;
    recognition.interimResults = opts.interimResults;
    recognition.maxAlternatives = opts.maxAlternatives;

    recognition.onstart = () => {
      this.listening = true;
      opts.onStart();
    };

    recognition.onend = () => {
      this.listening = false;
      opts.onEnd();
    };

    recognition.onerror = (ev) => {
      const err: TranscriptionError = {
        error: ev?.error ?? "unknown",
        message: ev?.message,
      };
      opts.onError(err);
    };

    recognition.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (!result) continue;
        if (!result.isFinal) continue;

        const alt = result[0];
        const transcript = alt?.transcript ?? "";
        const trimmed = transcript.trim();
        if (trimmed) opts.onFinalTranscript(trimmed);
      }
    };

    if (this.listening) return;

    try {
      recognition.start();
    } catch {
      // Some browsers throw if start() is called redundantly or too quickly.
      // For MVP we surface a generic error and stay stopped.
      opts.onError({ error: "start-failed" });
      this.stopRequested = true;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    }
  }

  stop(): void {
    this.stopRequested = true;
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      // ignore
    }
  }

  dispose(): void {
    this.stop();
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
    }
    this.recognition = null;
  }
}

