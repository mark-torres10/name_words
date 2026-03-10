import { LetterTimerGame } from "@/components/letter-timer-game";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <LetterTimerGame />
      </main>
    </div>
  );
}
