import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  LEVEL_BACKGROUND_COLOUR,
  NUMBER_ORDER_COUNT,
  NUMBER_ORDER_FONT_SIZE,
  NUMBER_ORDER_PADDING_X,
  NUMBER_ORDER_PADDING_Y,
  NUMBER_ORDER_PILE_CENTER_Y,
  NUMBER_ORDER_PILE_X_JITTER,
  NUMBER_ORDER_PILE_Y_JITTER,
  NUMBER_ORDER_PILE_MARGIN_X,
  NUMBER_ORDER_SLOT_WIDTH,
  NUMBER_ORDER_SLOT_HEIGHT,
  NUMBER_ORDER_SLOT_GAP,
  NUMBER_ORDER_SLOTS_TOP_Y,
  NUMBER_ORDER_SLOTS_LEFT_X,
  NUMBER_ORDER_SLOT_RADIUS,
  NUMBER_ORDER_SLOT_COLOURS,
  NUMBER_ORDER_SLOT_BORDER_COLOUR,
  INK_TEXT,
  PLAYER_ID_DATA_KEY,
  LAST_SCORE_DATA_KEY,
} from "../constants.ts";
import { recordTrial, NumberOrderTrialData } from "../scoring.ts";
import { Button, createButton, downloadCanvasSnapshot } from "../ui.ts";

const BUTTONS_Y = NUMBER_ORDER_SLOTS_TOP_Y + NUMBER_ORDER_SLOT_HEIGHT + 60;
const FEEDBACK_Y = BUTTONS_Y + 70;

/** Everything a concrete number-order level (Level2, Level3) needs to
 * supply - the range of numbers to sort and where Back/Continue go.
 * sceneKey doubles as this trial's `level` field, so it must match the
 * scene's own registered key. */
export type NumberOrderLevelConfig = {
  sceneKey: "Level2" | "Level3";
  min: number;
  max: number;
  backSceneKey: string;
  continueSceneKey: string;
};

/**
 * Shared "put the numbers in order" mechanic behind Level2 (1-5) and
 * Level3 (6-10) - mechanically identical to letters-salad's Level3
 * ("sort the alphabet"), just with NUMBER_ORDER_COUNT numbers instead
 * of letters, and only ever one row (5 items comfortably fit WIDTH
 * with no grid wrapping, unlike letters-salad's 26-letter expansion).
 * NUMBER_ORDER_COUNT numbers (config.min..config.max) start scrambled
 * in a pile; the child drags each into one of NUMBER_ORDER_COUNT
 * ordered slots laid out left-to-right, position 1 (leftmost) being
 * smallest. Dropping onto an already-occupied slot bumps that slot's
 * previous occupant back to its own original pile position, rather
 * than swapping, for the same predictability reasons as
 * letters-salad's Level3. "Check" (enabled once every slot is filled)
 * scores how many numbers ended up in their correct position.
 */
export class NumberOrderScene extends Scene {
  private config: NumberOrderLevelConfig;

  private numbers: number[] = [];
  private pileOrder: number[] = [];
  private glyphTexts: GameObjects.Text[] = [];
  private glyphHomePositions: { x: number; y: number }[] = [];
  private glyphSlotIndex: (number | null)[] = [];
  private slotOccupant: (number | null)[] = [];

  private checkButton: Button;
  private screenshotButton: Button;
  private feedbackText: GameObjects.Text;

  private attempts = 0;
  private trialStartMs: number;
  private lastScore: number | null = null;
  private lastCorrectPositionCount: number | null = null;
  private resultsShown = false;

  constructor(config: NumberOrderLevelConfig) {
    super(config.sceneKey);
    this.config = config;
  }

  create() {
    this.numbers = Array.from(
      { length: NUMBER_ORDER_COUNT },
      (_, i) => this.config.min + i,
    );
    this.pileOrder = Phaser.Utils.Array.Shuffle(this.numbers.slice());
    this.glyphTexts = [];
    this.glyphHomePositions = [];
    this.glyphSlotIndex = new Array(NUMBER_ORDER_COUNT).fill(null);
    this.slotOccupant = new Array(NUMBER_ORDER_COUNT).fill(null);
    this.attempts = 0;
    this.trialStartMs = Date.now();
    this.lastScore = null;
    this.lastCorrectPositionCount = null;
    this.resultsShown = false;

    this.add
      .rectangle(0, 0, WIDTH, this.scale.height, LEVEL_BACKGROUND_COLOUR)
      .setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 40, "Put the numbers in order!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: INK_TEXT,
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(WIDTH / 2, 90, "Drag the numbers so the smallest is on the left.", {
        fontFamily: "Arial Black",
        fontSize: 20,
        color: INK_TEXT,
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.createSlots();
    this.createPile();
    this.createDragHandlers();

    this.feedbackText = this.add
      .text(WIDTH / 2, FEEDBACK_Y, "", {
        fontFamily: "Arial Black",
        fontSize: 26,
        color: INK_TEXT,
        align: "center",
      })
      .setOrigin(0.5);

    this.createActionButtons();
    this.createFacilitatorButtons();
  }

  /** Draws the NUMBER_ORDER_COUNT ordered slots in a single row. No
   * position-index label above each slot - unlike letters-salad's
   * Level3 (where a position number above a letter-slot never clashes
   * with the letter that lands there), here the slots are filled with
   * actual numbers, so a "3" printed above a slot that might end up
   * holding a different digit would be confusing. Each slot instead
   * gets its own colour from NUMBER_ORDER_SLOT_COLOURS so the row still
   * reads as five distinct places rather than needing a label. */
  private createSlots() {
    for (let i = 0; i < NUMBER_ORDER_COUNT; i++) {
      const x =
        NUMBER_ORDER_SLOTS_LEFT_X +
        i * (NUMBER_ORDER_SLOT_WIDTH + NUMBER_ORDER_SLOT_GAP);
      const y = NUMBER_ORDER_SLOTS_TOP_Y;
      const fillColour =
        NUMBER_ORDER_SLOT_COLOURS[i % NUMBER_ORDER_SLOT_COLOURS.length];

      const g = this.add.graphics();
      g.fillStyle(fillColour, 1);
      g.lineStyle(3, NUMBER_ORDER_SLOT_BORDER_COLOUR, 1);
      g.fillRoundedRect(
        x,
        y,
        NUMBER_ORDER_SLOT_WIDTH,
        NUMBER_ORDER_SLOT_HEIGHT,
        NUMBER_ORDER_SLOT_RADIUS,
      );
      g.strokeRoundedRect(
        x,
        y,
        NUMBER_ORDER_SLOT_WIDTH,
        NUMBER_ORDER_SLOT_HEIGHT,
        NUMBER_ORDER_SLOT_RADIUS,
      );
    }
  }

  private slotCenter(slotIndex: number): { x: number; y: number } {
    const x =
      NUMBER_ORDER_SLOTS_LEFT_X +
      slotIndex * (NUMBER_ORDER_SLOT_WIDTH + NUMBER_ORDER_SLOT_GAP) +
      NUMBER_ORDER_SLOT_WIDTH / 2;
    const y = NUMBER_ORDER_SLOTS_TOP_Y + NUMBER_ORDER_SLOT_HEIGHT / 2;
    return { x, y };
  }

  /** Lays the scrambled numbers out in a single evenly spaced row, with
   * a little random jitter so it reads as a loose pile rather than a
   * perfect row - same approach as letters-salad's Level3 createPile(),
   * minus the row-wrapping it needed for 26 letters. Each glyph's
   * starting position is recorded as its "home" - where a bumped
   * occupant returns to (see handleDrop below). */
  private createPile() {
    const spacing =
      (WIDTH - 2 * NUMBER_ORDER_PILE_MARGIN_X) / (NUMBER_ORDER_COUNT - 1);

    this.pileOrder.forEach((value, i) => {
      const baseX = NUMBER_ORDER_PILE_MARGIN_X + i * spacing;
      const baseY = NUMBER_ORDER_PILE_CENTER_Y;
      const x =
        baseX +
        Phaser.Math.Between(
          -NUMBER_ORDER_PILE_X_JITTER,
          NUMBER_ORDER_PILE_X_JITTER,
        );
      const y =
        baseY +
        Phaser.Math.Between(
          -NUMBER_ORDER_PILE_Y_JITTER,
          NUMBER_ORDER_PILE_Y_JITTER,
        );

      this.glyphHomePositions.push({ x, y });

      const text = this.add
        .text(x, y, String(value), {
          fontFamily: "Arial Black",
          fontSize: NUMBER_ORDER_FONT_SIZE,
          color: INK_TEXT,
          backgroundColor: "#fff8ec",
          padding: { x: NUMBER_ORDER_PADDING_X, y: NUMBER_ORDER_PADDING_Y },
        })
        .setOrigin(0.5)
        .setInteractive({ draggable: true, useHandCursor: true });

      this.glyphTexts.push(text);
    });
  }

  private createDragHandlers() {
    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: GameObjects.GameObject,
        dragX: number,
        dragY: number,
      ) => {
        if (!this.glyphTexts.includes(gameObject as GameObjects.Text)) {
          return;
        }
        (gameObject as GameObjects.Text).setPosition(dragX, dragY);
      },
    );

    this.input.on(
      "dragend",
      (_pointer: Phaser.Input.Pointer, gameObject: GameObjects.GameObject) => {
        const index = this.glyphTexts.indexOf(gameObject as GameObjects.Text);
        if (index === -1) {
          return;
        }
        this.handleDrop(index);
      },
    );
  }

  /** Which ordered slot (if any) a point falls inside - same approach
   * as letters-salad's Level3 slotAt(), minus the row-grid math. */
  private slotAt(x: number, y: number): number | null {
    for (let i = 0; i < NUMBER_ORDER_COUNT; i++) {
      const slotX =
        NUMBER_ORDER_SLOTS_LEFT_X +
        i * (NUMBER_ORDER_SLOT_WIDTH + NUMBER_ORDER_SLOT_GAP);
      const slotY = NUMBER_ORDER_SLOTS_TOP_Y;
      const inSlot =
        x >= slotX &&
        x <= slotX + NUMBER_ORDER_SLOT_WIDTH &&
        y >= slotY &&
        y <= slotY + NUMBER_ORDER_SLOT_HEIGHT;
      if (inSlot) {
        return i;
      }
    }
    return null;
  }

  /** Resolves where a just-dropped glyph lands. Dropped outside every
   * slot, it simply becomes unplaced wherever it was dropped. Dropped
   * onto an already-occupied slot, that slot's previous occupant is
   * bumped back to its own original pile position rather than swapped
   * with the dragged glyph - simpler and more predictable for a young
   * child than a two-glyph swap (same as letters-salad's Level3). */
  private handleDrop(glyphIndex: number) {
    const text = this.glyphTexts[glyphIndex];
    const previousSlot = this.glyphSlotIndex[glyphIndex];
    if (previousSlot !== null) {
      this.slotOccupant[previousSlot] = null;
    }

    const targetSlot = this.slotAt(text.x, text.y);
    if (targetSlot === null) {
      this.glyphSlotIndex[glyphIndex] = null;
      this.updateCheckEnabled();
      return;
    }

    const occupant = this.slotOccupant[targetSlot];
    if (occupant !== null && occupant !== glyphIndex) {
      this.glyphSlotIndex[occupant] = null;
      const home = this.glyphHomePositions[occupant];
      this.glyphTexts[occupant].setPosition(home.x, home.y);
    }

    this.slotOccupant[targetSlot] = glyphIndex;
    this.glyphSlotIndex[glyphIndex] = targetSlot;
    const center = this.slotCenter(targetSlot);
    text.setPosition(center.x, center.y);

    this.updateCheckEnabled();
  }

  private createActionButtons() {
    this.checkButton = createButton(this, WIDTH / 2, BUTTONS_Y, "Check", {
      variant: "primary",
      minWidth: 200,
    });
    this.checkButton.hitArea.on("pointerdown", () => this.checkPlacements());
    this.updateCheckEnabled();

    this.screenshotButton = createButton(
      this,
      WIDTH / 2 + 300,
      BUTTONS_Y,
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

  /** The Check button is only enabled once every slot has a number in
   * it - same enable/disable dimming pattern as Level1. */
  private updateCheckEnabled() {
    const allPlaced = this.slotOccupant.every((occupant) => occupant !== null);
    this.checkButton.container.setAlpha(allPlaced ? 1 : 0.4);
    if (allPlaced) {
      this.checkButton.hitArea.setInteractive({ useHandCursor: true });
    } else {
      this.checkButton.hitArea.disableInteractive();
    }
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

  private checkPlacements() {
    if (this.slotOccupant.some((occupant) => occupant === null)) {
      return;
    }

    this.attempts += 1;

    const correctPositionCount = this.slotOccupant.reduce<number>(
      (count, glyphIndex, slotIndex) => {
        if (glyphIndex === null) {
          return count;
        }
        return this.pileOrder[glyphIndex] === this.numbers[slotIndex]
          ? count + 1
          : count;
      },
      0,
    );
    const score = Math.round((correctPositionCount / NUMBER_ORDER_COUNT) * 100);

    this.lastCorrectPositionCount = correctPositionCount;
    this.lastScore = score;
    this.resultsShown = true;

    this.feedbackText.setText(
      `Score: ${correctPositionCount}/${NUMBER_ORDER_COUNT} in the right spot (${score}/100)`,
    );
    this.setScreenshotEnabled(true);
  }

  /** Captures the actual rendered canvas (see ui.ts's
   * downloadCanvasSnapshot) once a result is on screen - same shared
   * helper every other level in this game uses. */
  private downloadResultScreenshot() {
    if (!this.resultsShown) {
      return;
    }
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    const levelSlug = this.config.sceneKey.toLowerCase();
    const filename = `count-to-ten-${playerId ?? "unknown"}-${levelSlug}-attempt${this.attempts}-result.png`;
    downloadCanvasSnapshot(this.game, filename);
  }

  /** Facilitator controls, same top-left/top-right convention as every
   * other level in this repo. Back/Continue targets come from
   * config.backSceneKey/continueSceneKey, so this is identical between
   * Level2 and Level3 despite stepping to different neighbours. */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.finishTrial(true);
      this.scene.start(this.config.backSceneKey);
    });

    const continueButton = createButton(this, WIDTH - 24, 24, "Continue →", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });
    continueButton.hitArea.on("pointerdown", () => {
      this.finishTrial(this.attempts === 0);
      this.registry.set(LAST_SCORE_DATA_KEY, this.lastScore);
      this.scene.start(this.config.continueSceneKey);
    });
  }

  /** Writes this trial's full record to storage in one go (see
   * scoring.ts - recordTrial does a single localStorage write). */
  private finishTrial(endedByFacilitator: boolean) {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    if (!playerId) {
      // Scene started directly, skipping the login screen (e.g. during
      // development) - nothing to attach this trial to.
      return;
    }

    const trial: NumberOrderTrialData = {
      level: this.config.sceneKey,
      startTime: new Date(this.trialStartMs).toISOString(),
      trialDurationMs: Date.now() - this.trialStartMs,
      endedByFacilitator,
      score: this.lastScore,
      numberOrderRangeMin: this.config.min,
      numberOrderRangeMax: this.config.max,
      numberOrderCorrectPositionCount: this.lastCorrectPositionCount,
    };

    recordTrial(playerId, trial);
  }
}
