import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let onFinalTranscript: ((t: string) => void) | undefined;

vi.mock("@/lib/game", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/game")>();
  return {
    ...actual,
    pickLetterPair: () => ({ startLetter: "A", endLetter: "B" }),
  };
});

vi.mock("@/lib/words/dictionary", () => {
  return {
    isDictionaryWord: (word: string) => {
      const w = word.toLowerCase();
      return w === "ab" || w === "apple";
    },
  };
});

vi.mock("@/lib/useTranscription", () => {
  return {
    useTranscription: (opts?: { onFinalTranscript?: (t: string) => void }) => {
      onFinalTranscript = opts?.onFinalTranscript;
      return {
        isSupported: true,
        isListening: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
      };
    },
  };
});

import { LetterTimerGame } from "./letter-timer-game";

describe("LetterTimerGame", () => {
  it("defaults to 30 seconds and allows editing before start", async () => {
    const user = userEvent.setup();
    render(<LetterTimerGame />);

    const timerInput = screen.getByLabelText(/seconds/i);
    expect(timerInput).toHaveValue(30);

    await user.clear(timerInput);
    await user.type(timerInput, "12");
    expect(timerInput).toHaveValue(12);
  });

  it("starts, counts down, flashes at zero, and resets", async () => {
    vi.useFakeTimers();
    render(<LetterTimerGame />);

    const timerInput = screen.getByLabelText(/seconds/i);
    fireEvent.change(timerInput, { target: { value: "2" } });

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    // letters appear and timer locks
    expect(screen.getByTestId("letter-pair")).toBeInTheDocument();
    expect(timerInput).toBeDisabled();

    // tick to zero
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    const timerDisplay = screen.getByTestId("timer-display");
    expect(timerDisplay).toHaveTextContent(/^0$/);
    expect(timerDisplay).toHaveClass("isZero");

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.queryByTestId("letter-pair")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/seconds/i)).toHaveValue(30);
    expect(screen.getByLabelText(/seconds/i)).not.toBeDisabled();

    vi.useRealTimers();
  });

  it("renders green/red tags for recognized dictionary words", async () => {
    render(<LetterTimerGame />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(screen.getByTestId("letter-pair")).toBeInTheDocument();

    expect(onFinalTranscript).toBeTypeOf("function");

    await act(async () => {
      onFinalTranscript?.("ab apple");
    });

    const green = screen.getByText("ab");
    expect(green.className).toMatch(/emerald/i);

    const red = screen.getByText("apple");
    expect(red.className).toMatch(/rose/i);
  });
});

