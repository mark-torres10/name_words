import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
});

