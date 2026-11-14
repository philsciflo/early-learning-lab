import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  LEVEL_BACKGROUND_COLOUR,
  COUNT_OPTIONS,
  GRID_COLS,
  GRID_ROWS,
  CLUSTER_X_MIN,
  CLUSTER_X_MAX,
  CLUSTER_Y_MIN,
  CLUSTER_Y_MAX,
  OBJECT_SIZE,
  OBJECT_JITTER,
  COUNT_FEEDBACK_Y,
  COUNT_SCREENSHOT_Y,
  NUMBER_COLUMN_COUNT,
  NUMBER_BUTTON_DIAMETER,
  NUMBER_BUTTON_GAP_Y,
  NUMBER_COLUMN_TOP_Y,
  NUMBER_COLUMN_LEFT_X,
  NUMBER_COLUMN_RIGHT_X,
  INK_COLOUR,
  INK_TEXT,
  PLAYER_ID_DATA_KEY,
  LAST_SCORE_DATA_KEY,
} from "../constants.ts";
import { recordTrial, CountTrialData } from "../scoring.ts";
import { ShapeType, pickShapeType, drawShape } from "../shapes.ts";
import {
  Button,
  createButton,
  createCircleButton,
  downloadCanvasSnapshot,
} from "../ui.ts";

// All objects in a round share one colour (picked per round, not per
// object) so colour never becomes an accidental counting cue - only
// shape identity and count matter. Same ink outline as the rest of the
// UI for visual consistency. Expanded from 5 to 8 hues (added purple,
// pink, green) for a bolder, more colourful spread round-to-round.
const OBJECT_FILL_COLOURS = [
  0xff9f40, 0x4fb6a8, 0xe66b6b, 0x6ba3e6, 0xf2c14e, 0xb084e8, 0xff6fa5,
  0x68c23a,
];
const OBJECT_STROKE_COLOUR = INK_COLOUR;

// Each number button gets its own hue from this small rainbow (cycled
// by its position within its column) instead of one flat "muted" grey,
// so the two columns read as cheerful and distinct rather than a plain
// control strip. Pushed more saturated/vivid than the first colour
// pass so the buttons read as bold, toy-like controls.
const NUMBER_BUTTON_PALETTES = [
  { fill: 0xff5c7a, hoverFill: 0xff8aa0, stroke: 0xc23356 },
  { fill: 0xff9f1c, hoverFill: 0xffbb55, stroke: 0xcc7000 },
  { fill: 0xffd60a, hoverFill: 0xffe34d, stroke: 0xccab00 },
  { fill: 0x2fbf71, hoverFill: 0x5fd696, stroke: 0x1f8a52 },
  { fill: 0x3a86ff, hoverFill: 0x6ea3ff, stroke: 0x2062cc },
];

function pickObjectCount(): number {
  return COUNT_OPTIONS[Phaser.Math.Between(0, COUNT_OPTIONS.length - 1)];
}

function pickObjectFillColour(): number {
  return OBJECT_FILL_COLOURS[
    Phaser.Math.Between(0, OBJECT_FILL_COLOURS.length - 1)
  ];
}

type NumberButtonEntry = { value: number; button: Button };

/**
 * Level 1: "Count the objects." objectCount instances of one randomly
 * chosen shape (see shapes.ts) are scattered in a loose, non-overlapping
 * cluster at the centre of the screen. The number buttons 1-10 are
 * split across the two edges - 1-5 down the left, 6-10 down the right,
 * each number appearing exactly once - so the full range stays within
 * easy reach without duplicating any button. Tapping the matching
 * number is the child's one attempt and immediately ends the trial
 * (right or wrong), same single-trial pattern as letters-salad's
 * Level2 find-the-letter task.
 */
export class Level1 extends Scene {
  private objectCount = 0;
  private shapeType: ShapeType = "circle";
  private numberButtons: NumberButtonEntry[] = [];

  private screenshotButton: Button;
  private feedbackText: GameObjects.Text;

  private hasAnswered = false;
  private trialStartMs: number;
  private selectedAnswer: number | null = null;
  private lastScore: number | null = null;
  private lastCorrect: boolean | null = null;
  private resultsShown = false;

  constructor() {
    super("Level1");
  }

  create() {
    this.objectCount = pickObjectCount();
    this.shapeType = pickShapeType();
    this.numberButtons = [];
    this.hasAnswered = false;
    this.trialStartMs = Date.now();
    this.selectedAnswer = null;
    this.lastScore = null;
    this.lastCorrect = null;
    this.resultsShown = false;

    this.add
      .rectangle(0, 0, WIDTH, this.scale.height, LEVEL_BACKGROUND_COLOUR)
      .setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 40, "Count the objects!", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 36,
        color: INK_TEXT,
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(WIDTH / 2, 100, "How many shapes do you see?", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 24,
        color: INK_TEXT,
        align: "center",
      })
      .setOrigin(0.5);

    this.layoutObjects();
    this.createNumberColumn(NUMBER_COLUMN_LEFT_X, 1);
    this.createNumberColumn(NUMBER_COLUMN_RIGHT_X, NUMBER_COLUMN_COUNT + 1);

    this.feedbackText = this.add
      .text(WIDTH / 2, COUNT_FEEDBACK_Y, "", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 26,
        color: INK_TEXT,
        align: "center",
      })
      .setOrigin(0.5);

    this.createScreenshotButton();
    this.createFacilitatorButtons();
  }

  /** Scatters this.objectCount shapes across a loose GRID_COLS x
   * GRID_ROWS grid (one cell per possible object - GRID_COLS *
   * GRID_ROWS equals the largest COUNT_OPTIONS value) with a little
   * random per-object jitter so it reads as a scattered cluster rather
   * than a perfect grid. Which cells get used is shuffled each round,
   * so the cluster's shape/footprint varies even at the same count.
   * The jitter stays well inside half a cell (minus half an object),
   * so objects can never overlap regardless of which cells are picked -
   * see OBJECT_JITTER's doc comment in constants.ts. */
  private layoutObjects() {
    const cellWidth = (CLUSTER_X_MAX - CLUSTER_X_MIN) / GRID_COLS;
    const cellHeight = (CLUSTER_Y_MAX - CLUSTER_Y_MIN) / GRID_ROWS;

    const cellIndices = Phaser.Utils.Array.Shuffle(
      Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => i),
    ).slice(0, this.objectCount);

    const fillColour = pickObjectFillColour();

    cellIndices.forEach((cellIndex) => {
      const col = cellIndex % GRID_COLS;
      const row = Math.floor(cellIndex / GRID_COLS);
      const baseX = CLUSTER_X_MIN + cellWidth * (col + 0.5);
      const baseY = CLUSTER_Y_MIN + cellHeight * (row + 0.5);
      const x = baseX + Phaser.Math.Between(-OBJECT_JITTER, OBJECT_JITTER);
      const y = baseY + Phaser.Math.Between(-OBJECT_JITTER, OBJECT_JITTER);

      drawShape(this, this.shapeType, x, y, {
        size: OBJECT_SIZE,
        fillColour,
        strokeColour: OBJECT_STROKE_COLOUR,
      });
    });
  }

  /** One column of NUMBER_COLUMN_COUNT circular number buttons, stacked
   * top-to-bottom ascending from startValue at a fixed edge x - called
   * once per edge with startValue 1 (left, giving 1-5) and
   * NUMBER_COLUMN_COUNT + 1 (right, giving 6-10), so every number 1-10
   * appears exactly once across the two columns. */
  private createNumberColumn(x: number, startValue: number) {
    for (let i = 0; i < NUMBER_COLUMN_COUNT; i++) {
      const value = startValue + i;
      const y =
        NUMBER_COLUMN_TOP_Y +
        i * (NUMBER_BUTTON_DIAMETER + NUMBER_BUTTON_GAP_Y) +
        NUMBER_BUTTON_DIAMETER / 2;

      const button = createCircleButton(this, x, y, String(value), {
        variant: "muted",
        diameter: NUMBER_BUTTON_DIAMETER,
        fontSize: 30,
        paletteOverride: NUMBER_BUTTON_PALETTES[i],
      });
      button.hitArea.on("pointerdown", () => this.handleAnswer(value));

      this.numberButtons.push({ value, button });
    }
  }

  /** The child's one attempt: whichever number is tapped first decides
   * the result. Every number button is disabled immediately after (no
   * second guesses), and the one button showing the correct count is
   * left at full opacity while the rest dim, so the child can see the
   * right answer either way. */
  private handleAnswer(value: number) {
    if (this.hasAnswered) {
      return;
    }
    this.hasAnswered = true;

    const correct = value === this.objectCount;
    this.selectedAnswer = value;
    this.lastCorrect = correct;
    this.lastScore = correct ? 100 : 0;
    this.resultsShown = true;

    this.numberButtons.forEach(({ value: entryValue, button }) => {
      button.hitArea.disableInteractive();
      button.container.setAlpha(entryValue === this.objectCount ? 1 : 0.35);
    });

    this.feedbackText.setText(
      correct
        ? `Correct! There are ${this.objectCount} ${this.shapeType}s.`
        : `Not quite - there are ${this.objectCount} ${this.shapeType}s.`,
    );
    this.setScreenshotEnabled(true);
  }

  private createScreenshotButton() {
    this.screenshotButton = createButton(
      this,
      WIDTH / 2,
      COUNT_SCREENSHOT_Y,
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

  /** Same enable/disable dimming pattern as the other games' levels -
   * only meaningful once a result exists. */
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
    const filename = `count-to-ten-${playerId ?? "unknown"}-level1-result.png`;
    downloadCanvasSnapshot(this.game, filename);
  }

  /** Facilitator controls, same top-left/top-right convention as every
   * other level in this repo. Back returns to MainMenu (Level1 is the
   * first level); Continue moves on to Level2 (the "put the numbers in
   * order" stage). */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.finishTrial(true);
      this.scene.start("MainMenu");
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
      this.scene.start("Level2");
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

    const trial: CountTrialData = {
      level: "Level1",
      startTime: new Date(this.trialStartMs).toISOString(),
      trialDurationMs: Date.now() - this.trialStartMs,
      endedByFacilitator,
      score: this.lastScore,
      countObjectCount: this.objectCount,
      countShapeType: this.shapeType,
      countSelectedAnswer: this.selectedAnswer,
      countCorrect: this.lastCorrect,
    };

    recordTrial(playerId, trial);
  }
}
