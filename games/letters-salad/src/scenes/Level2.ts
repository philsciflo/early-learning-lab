import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  LEVEL_BACKGROUND_COLOUR,
  FIND_OPTION_COUNT,
  FIND_OPTION_COLUMNS,
  FIND_OPTION_DIAMETER,
  FIND_OPTION_GAP_X,
  FIND_OPTION_GAP_Y,
  FIND_OPTIONS_TOP_Y,
  FIND_OPTIONS_LEFT_X,
  FIND_TARGET_Y,
  FIND_TARGET_FONT_SIZE,
  FIND_FEEDBACK_Y,
  FIND_SCREENSHOT_Y,
  PLAYER_ID_DATA_KEY,
  LAST_SCORE_DATA_KEY,
} from "../constants.ts";
import { recordTrial, FindLetterTrialData } from "../scoring.ts";
import {
  Button,
  createButton,
  createCircleButton,
  downloadCanvasSnapshot,
} from "../ui.ts";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Hand-curated visual-confusability groups for uppercase letters -
 * which letters a young reader is most likely to mix up with which
 * others, by shared stroke shape (round bowls, straight verticals,
 * diagonal V-shapes, etc). Not exhaustive or symmetric by construction
 * (eg "O" lists "Q"/"D"/"C" but isn't itself listed under "D"'s
 * harder-to-confuse-with set) - it's a difficulty dial for
 * buildOptions() below, not a formal taxonomy. */
const CONFUSABLE_GROUPS: Record<string, string[]> = {
  B: ["D", "P", "R"],
  D: ["B", "O", "Q"],
  P: ["B", "R", "F"],
  R: ["B", "P"],
  Q: ["D", "O", "G"],
  O: ["Q", "D", "C"],
  C: ["G", "O"],
  G: ["C", "Q", "O"],
  M: ["W", "N"],
  W: ["M", "V"],
  N: ["M", "H", "Z"],
  Z: ["N", "S"],
  S: ["Z", "C"],
  U: ["V", "Y"],
  V: ["U", "W", "Y"],
  Y: ["V", "X"],
  I: ["L", "T", "J"],
  L: ["I", "T"],
  T: ["I", "L", "F"],
  F: ["E", "P", "T"],
  E: ["F"],
  H: ["N"],
  X: ["Y", "K"],
  K: ["X", "H"],
  A: ["V"],
  J: ["I", "L"],
};

/** Picks this attempt's target letter, uniformly at random from the
 * full alphabet - every letter is equally likely to be asked for. */
function pickTargetLetter(): string {
  return ALPHABET[Phaser.Math.Between(0, ALPHABET.length - 1)];
}

/** Builds the FIND_OPTION_COUNT options shown alongside the target:
 * the target itself, plus (FIND_OPTION_COUNT - 1) distractors chosen
 * in two passes so difficulty varies by target rather than being pure
 * luck-of-the-draw every time:
 *
 * 1. Up to 3 distractors come from the target's CONFUSABLE_GROUPS
 *    entry (shuffled, so which ones appear varies attempt to attempt).
 *    Letters with a rich confusable set (eg "B" -> D/P/R) make for a
 *    genuinely harder round; letters with none (eg plain "A" has none
 *    listed beyond "V") fall through entirely to step 2.
 * 2. Any remaining slots are filled with random, distinct letters from
 *    the rest of the alphabet - clearly-different letters that keep
 *    every round at FIND_OPTION_COUNT options regardless of how many
 *    confusable letters the target had.
 *
 * The full option set (target + distractors) is then shuffled, so the
 * target's position among the FIND_OPTION_COUNT tiles is random too.
 */
function buildOptions(target: string): string[] {
  const confusablePool = Phaser.Utils.Array.Shuffle(
    (CONFUSABLE_GROUPS[target] ?? []).slice(),
  );
  const distractors = new Set<string>();

  for (const letter of confusablePool) {
    if (distractors.size >= 3) {
      break;
    }
    distractors.add(letter);
  }

  const fillerPool = Phaser.Utils.Array.Shuffle(
    ALPHABET.filter((letter) => letter !== target && !distractors.has(letter)),
  );
  for (const letter of fillerPool) {
    if (distractors.size >= FIND_OPTION_COUNT - 1) {
      break;
    }
    distractors.add(letter);
  }

  return Phaser.Utils.Array.Shuffle([target, ...distractors]);
}

/**
 * Level 2: "Find the correct letter out of 8." One target letter is
 * shown large; FIND_OPTION_COUNT letter tiles (the target plus
 * distractors - see buildOptions above) sit in a grid below it. This
 * is a single-trial level - tapping any tile (right or wrong) is the
 * child's one attempt and immediately ends it, matching the "level =
 * one bounded task, replay via Back if needed" pattern Level1 uses.
 */
export class Level2 extends Scene {
  private targetLetter = "";
  private options: string[] = [];
  private optionButtons: Button[] = [];

  private screenshotButton: Button;
  private feedbackText: GameObjects.Text;

  private hasAnswered = false;
  private trialStartMs: number;
  private lastScore: number | null = null;
  private lastCorrect: boolean | null = null;
  private resultsShown = false;

  constructor() {
    super("Level2");
  }

  create() {
    this.targetLetter = pickTargetLetter();
    this.options = buildOptions(this.targetLetter);
    this.optionButtons = [];
    this.hasAnswered = false;
    this.trialStartMs = Date.now();
    this.lastScore = null;
    this.lastCorrect = null;
    this.resultsShown = false;

    this.add
      .rectangle(0, 0, WIDTH, this.scale.height, LEVEL_BACKGROUND_COLOUR)
      .setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 40, "Find the letter!", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(WIDTH / 2, 130, "Find this letter:", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 26,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, FIND_TARGET_Y, this.targetLetter, {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: FIND_TARGET_FONT_SIZE,
        color: "#2b2a6b",
        backgroundColor: "#ffffff",
        padding: { x: 36, y: 16 },
      })
      .setOrigin(0.5);

    this.createOptionsGrid();

    this.feedbackText = this.add
      .text(WIDTH / 2, FIND_FEEDBACK_Y, "", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 24,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    this.createScreenshotButton();
    this.createFacilitatorButtons();
  }

  /** Lays the FIND_OPTION_COUNT option tiles out in a
   * FIND_OPTION_COLUMNS-wide grid, as round single-character buttons
   * (createCircleButton is built for exactly this - short labels,
   * generous touch targets - unlike createButton's pill shape). */
  private createOptionsGrid() {
    this.options.forEach((letter, i) => {
      const col = i % FIND_OPTION_COLUMNS;
      const row = Math.floor(i / FIND_OPTION_COLUMNS);
      const x =
        FIND_OPTIONS_LEFT_X +
        FIND_OPTION_DIAMETER / 2 +
        col * (FIND_OPTION_DIAMETER + FIND_OPTION_GAP_X);
      const y =
        FIND_OPTIONS_TOP_Y +
        FIND_OPTION_DIAMETER / 2 +
        row * (FIND_OPTION_DIAMETER + FIND_OPTION_GAP_Y);

      const button = createCircleButton(this, x, y, letter, {
        variant: "muted",
        diameter: FIND_OPTION_DIAMETER,
        fontSize: 64,
      });
      button.hitArea.on("pointerdown", () => this.handleAnswer(letter));

      this.optionButtons.push(button);
    });
  }

  /** The child's one attempt: whichever tile is tapped first decides
   * the result. Every tile is disabled immediately after (no second
   * guesses), and the correct tile is left at full opacity while the
   * rest dim, so the child can see the right answer either way. */
  private handleAnswer(letter: string) {
    if (this.hasAnswered) {
      return;
    }
    this.hasAnswered = true;

    const correct = letter === this.targetLetter;
    this.lastCorrect = correct;
    this.lastScore = correct ? 100 : 0;
    this.resultsShown = true;

    this.optionButtons.forEach((button, i) => {
      button.hitArea.disableInteractive();
      const isCorrectOption = this.options[i] === this.targetLetter;
      button.container.setAlpha(isCorrectOption ? 1 : 0.35);
    });

    this.feedbackText.setText(
      correct
        ? `Correct! That's the letter ${this.targetLetter}.`
        : `Not quite - the letter ${this.targetLetter} is still lit up above.`,
    );
    this.setScreenshotEnabled(true);
  }

  private createScreenshotButton() {
    this.screenshotButton = createButton(
      this,
      WIDTH / 2,
      FIND_SCREENSHOT_Y,
      "Download Result",
      {
        variant: "muted",
        minWidth: 260,
      },
    );
    this.screenshotButton.hitArea.on("pointerdown", () =>
      this.downloadResultScreenshot(),
    );
    this.setScreenshotEnabled(false);
  }

  /** Same enable/disable dimming pattern as Level1's
   * setScreenshotEnabled - only meaningful once a result exists. */
  private setScreenshotEnabled(enabled: boolean) {
    this.screenshotButton.container.setAlpha(enabled ? 1 : 0.4);
    if (enabled) {
      this.screenshotButton.hitArea.setInteractive({ useHandCursor: true });
    } else {
      this.screenshotButton.hitArea.disableInteractive();
    }
  }

  private downloadResultScreenshot() {
    if (!this.resultsShown) {
      return;
    }
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    const filename = `letters-salad-${playerId ?? "unknown"}-level2-result.png`;
    downloadCanvasSnapshot(this.game, filename);
  }

  /** Facilitator controls, same top-left/top-right convention as every
   * other level. Back steps to the immediately-preceding scene
   * (Level1); Continue now goes to Level3, which sits between this
   * level and GameOver. */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.finishTrial(true);
      this.scene.start("Level1");
    });

    const continueButton = createButton(this, WIDTH - 24, 24, "Continue →", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });
    continueButton.hitArea.on("pointerdown", () => {
      this.finishTrial(!this.hasAnswered);
      this.registry.set(LAST_SCORE_DATA_KEY, this.lastScore);
      this.scene.start("Level3");
    });
  }

  private finishTrial(endedByFacilitator: boolean) {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    if (!playerId) {
      // Scene started directly, skipping the login screen (e.g. during
      // development) - nothing to attach this trial to.
      return;
    }

    const trial: FindLetterTrialData = {
      level: "Level2",
      startTime: new Date(this.trialStartMs).toISOString(),
      trialDurationMs: Date.now() - this.trialStartMs,
      endedByFacilitator,
      score: this.lastScore,
      findTargetLetter: this.targetLetter,
      findAttemptCount: this.hasAnswered ? 1 : null,
      findCorrectCount: this.hasAnswered ? (this.lastCorrect ? 1 : 0) : null,
    };

    recordTrial(playerId, trial);
  }
}
