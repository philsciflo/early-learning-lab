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
  NUMBER_BUTTON_COUNT,
  NUMBER_BUTTON_DIAMETER,
  NUMBER_BUTTON_GAP_Y,
  NUMBER_COLUMN_TOP_Y,
  NUMBER_COLUMN_LEFT_X,
  NUMBER_COLUMN_RIGHT_X,
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
// shape identity and count matter. Same navy outline as the rest of the
// UI for visual consistency.
const OBJECT_FILL_COLOURS = [0xff9f40, 0x4fb6a8, 0xe66b6b, 0x6ba3e6, 0xf2c14e];
const OBJECT_STROKE_COLOUR = 0x2b2a6b;

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
 * cluster at the centre of the screen. Two duplicate columns of number
 * buttons (1-10) run down the left and right edges; tapping either
 * column's matching number is the child's one attempt and immediately
 * ends the trial (right or wrong), same single-trial pattern as
 * letters-salad's Level2 find-the-letter task.
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
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(WIDTH / 2, 100, "How many shapes do you see?", {
        fontFamily: "Arial Black",
        fontSize: 22,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    this.layoutObjects();
    this.createNumberColumn(NUMBER_COLUMN_LEFT_X);
    this.createNumberColumn(NUMBER_COLUMN_RIGHT_X);

    this.feedbackText = this.add
      .text(WIDTH / 2, COUNT_FEEDBACK_Y, "", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#2b2a6b",
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

  /** One column of NUMBER_BUTTON_COUNT (1-10) circular number buttons,
   * stacked top-to-bottom at a fixed edge x - called twice (once per
   * edge) so both columns show the full 1-10 range, per spec. */
  private createNumberColumn(x: number) {
    for (let value = 1; value <= NUMBER_BUTTON_COUNT; value++) {
      const y =
        NUMBER_COLUMN_TOP_Y +
        (value - 1) * (NUMBER_BUTTON_DIAMETER + NUMBER_BUTTON_GAP_Y) +
        NUMBER_BUTTON_DIAMETER / 2;

      const button = createCircleButton(this, x, y, String(value), {
        variant: "muted",
        diameter: NUMBER_BUTTON_DIAMETER,
        fontSize: 26,
      });
      button.hitArea.on("pointerdown", () => this.handleAnswer(value));

      this.numberButtons.push({ value, button });
    }
  }

  /** The child's one attempt: whichever number is tapped first (in
   * either column) decides the result. Every number button is disabled
   * immediately after (no second guesses), and every button showing the
   * correct count - in both columns - is left at full opacity while the
   * rest dim, so the child can see the right answer either way. */
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
   * first level); Continue moves on to GameOver - this stage's only
   * level. */
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
      this.scene.start("GameOver");
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
