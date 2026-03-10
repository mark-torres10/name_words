export type TranscriptionError = {
  error: string;
  message?: string;
};

export type TranscriptionStartOptions = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onFinalTranscript: (transcript: string) => void;
  onError: (err: TranscriptionError) => void;
  onEnd: () => void;
  onStart: () => void;
};

export interface TranscriptionEngine {
  isSupported(): boolean;
  start(opts: TranscriptionStartOptions): void;
  stop(): void;
  dispose(): void;
}

