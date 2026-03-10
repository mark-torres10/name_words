const fs = require("fs");
const path = require("path");
const { test } = require("@playwright/test");

test.use({
  viewport: { width: 1280, height: 720 },
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

test("capture idle and running screenshots", async ({ page, context }) => {
  const origin = "http://localhost:3000";
  const out1 =
    "/Users/mark/Documents/name_words/docs/plans/2026-03-09_voice_mic_transcription_482913/images/before/01_idle.png";
  const out2 =
    "/Users/mark/Documents/name_words/docs/plans/2026-03-09_voice_mic_transcription_482913/images/before/02_running_letter_pair.png";

  fs.mkdirSync(path.dirname(out1), { recursive: true });

  await context.grantPermissions(["microphone"], { origin });

  await page.goto(origin, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);

  await page.screenshot({ path: out1 });

  const startButton = page.getByRole("button", { name: /^start$/i });
  await startButton.scrollIntoViewIfNeeded();
  await startButton.click({ timeout: 10_000 });

  const exactPair = page.locator("text=/^[A-Za-z]\\\\s?[A-Za-z]$/").first();
  const labeled = page.getByText(/letter pair/i).first();

  let scrolled = false;
  try {
    await Promise.race([
      exactPair.waitFor({ state: "visible", timeout: 15_000 }),
      labeled.waitFor({ state: "visible", timeout: 15_000 }),
    ]);
  } catch {
    // Intentionally fall through; we still want a screenshot of the running state.
  }

  try {
    if (await exactPair.isVisible()) {
      await exactPair.scrollIntoViewIfNeeded();
      scrolled = true;
    }
  } catch {}

  try {
    if (!scrolled && (await labeled.isVisible())) {
      await labeled.scrollIntoViewIfNeeded();
    }
  } catch {}

  await page.waitForTimeout(250);
  await page.screenshot({ path: out2 });
});

