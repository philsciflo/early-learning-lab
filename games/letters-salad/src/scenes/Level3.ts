import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  LEVEL_BACKGROUND_COLOUR,
  ORDER_COUNT,
  ORDER_FONT_SIZE,
  ORDER_PADDING_X,
  ORDER_PADDING_Y,
  ORDER_PILE_CENTER_Y,
  ORDER_PILE_X_JITTER,
  ORDER_PILE_Y_JITTER,
  ORDER_PILE_MARGIN_X,
  ORDER_SLOT_WIDTH,
  ORDER_SLOT_HEIGHT,
  ORDER_SLOT_GAP,
  ORDER_SLOTS_TOP_Y,
  ORDER_SLOTS_LEFT_X,
  ORDER_SLOT_COLOUR,
  ORDER_SLOT_BORDER_COLOUR,
  PLAYER_ID_DATA_KEY,
  LAST_SCORE_DATA_KEY,
} from "../constants.ts";
import { recordTrial, AlphabetOrderTrialData } from "../scoring.ts";
import { Button, createButton, downloadCanvasSnapshot } from "../ui.ts";

const BUTTONS_Y = ORDER_SLOTS_TOP_Y + ORDER_SLOT_HEIGHT + 60;
const FEEDBACK_Y = BUTTONS_Y + 70;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Picks this attempt's ORDER_COUNT letters as one contiguous run from
 * the alphabet (eg "D E F G H I J K"), starting at a random point -
 * rather than a fully random ORDER_COUNT-letter subset. A contiguous
 * run keeps every pair of neighbours exactly one letter apart, so
 * getting the order right actually requires recalling the alphabet's
 * sequence; a random subset (eg A, F, K, Q, ...) would let a child
 * order correctly from rough "where in the alphabet" positioning
 * without ever needing to know what comes immediately after what. */
function pickLetterRun(): string[] {
  const maxStart = ALPHABET.length - ORDER_COUNT;
  const start = Phaser.Math.Between(0, maxStart);
  return ALPHABET.slice(start, start + ORDER_COUNT);
}

/**
 * Level 3: "Sort the alphabet." ORDER_COUNT letters (a contiguous
 * alphabet run - see pickLetterRun above) start scrambled in a pile;
 * the child drags each one into one of ORDER_COUNT ordered slots laid
 * out left-to-right, position 1 (leftmost) being earliest
 * alphabetically. Unlike Level1's two zones (which can each hold many
 * glyphs), every slot here holds exactly one letter - dropping onto an
 * already-occupied slot bumps that slot's previous occupant back to
 * its own original pile position, rather than attempting a swap, which
 * keeps the drop behaviour simple and predictable for a young child.
 * "Check" (enabled once every slot is filled) scores how many letters
 * ended up in their correct position.
 */
export class Level3 extends Scene {
  private letters: string[] = [];
  private pileOrder: string[] = [];
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

  constructor() {
    super("Level3");
  }

  create() {
    this.letters = pickLetterRun();
    this.pileOrder = Phaser.Utils.Array.Shuffle(this.letters.slice());
    this.glyphTexts = [];
    this.glyphHomePositions = [];
    this.glyphSlotIndex = new Array(ORDER_COUNT).fill(null);
    this.slotOccupant = new Array(ORDER_COUNT).fill(null);
    this.attempts = 0;
    this.trialStartMs = Date.now();
    this.lastScore = null;
    this.lastCorrectPositionCount = null;
    this.resultsShown = false;

    this.add
      .rectangle(0, 0, WIDTH, this.scale.height, LEVEL_BACKGROUND_COLOUR)
      .setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 40, "Sort the alphabet!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(WIDTH / 2, 90, "Drag the letters into ABC order, left to right.", {
        fontFamily: "Arial Black",
        fontSize: 20,
        color: "#2b2a6b",
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
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    this.createActionButtons();
    this.createFacilitatorButtons();
  }

  /** Draws the ORDER_COUNT ordered slots left-to-right, each numbered
   * above it so position 1/2/3... reads unambiguously - same plain
   * filled/bordered rounded-rect framing style as Level1's zones. */
  private createSlots() {
    for (let i = 0; i < ORDER_COUNT; i++) {
      const x = ORDER_SLOTS_LEFT_X + i * (ORDER_SLOT_WIDTH + ORDER_SLOT_GAP);

      const g = this.add.graphics();
      g.fillStyle(ORDER_SLOT_COLOUR, 1);
      g.lineStyle(3, ORDER_SLOT_BORDER_COLOUR, 1);
      g.fillRoundedRect(
        x,
        ORDER_SLOTS_TOP_Y,
        ORDER_SLOT_WIDTH,
        ORDER_SLOT_HEIGHT,
        12,
      );
      g.strokeRoundedRect(
        x,
        ORDER_SLOTS_TOP_Y,
        ORDER_SLOT_WIDTH,
        ORDER_SLOT_HEIGHT,
        12,
      );

      this.add
        .text(x + ORDER_SLOT_WIDTH / 2, ORDER_SLOTS_TOP_Y - 24, String(i + 1), {
          fontFamily: "Arial Black",
          fontSize: 20,
          color: "#2b2a6b",
        })
        .setOrigin(0.5);
    }
  }

  private slotCenter(slotIndex: number): { x: number; y: number } {
    const x =
      ORDER_SLOTS_LEFT_X +
      slotIndex * (ORDER_SLOT_WIDTH + ORDER_SLOT_GAP) +
      ORDER_SLOT_WIDTH / 2;
    const y = ORDER_SLOTS_TOP_Y + ORDER_SLOT_HEIGHT / 2;
    return { x, y };
  }

  /** Lays the scrambled letters out in ORDER_COUNT evenly spaced slots
   * above the ordered slots, with a little random jitter so it reads
   * as a loose pile rather than a perfect grid - same approach as
   * Level1's createPile(). Each glyph's starting position is recorded
   * as its "home" - where a bumped occupant returns to (see
   * handleDrop below). */
  private createPile() {
    const spacing = (WIDTH - 2 * ORDER_PILE_MARGIN_X) / (ORDER_COUNT - 1);

    this.pileOrder.forEach((char, i) => {
      const baseX = ORDER_PILE_MARGIN_X + i * spacing;
      const x =
        baseX + Phaser.Math.Between(-ORDER_PILE_X_JITTER, ORDER_PILE_X_JITTER);
      const y =
        ORDER_PILE_CENTER_Y +
        Phaser.Math.Between(-ORDER_PILE_Y_JITTER, ORDER_PILE_Y_JITTER);

      this.glyphHomePositions.push({ x, y });

      const text = this.add
        .text(x, y, char, {
          fontFamily: "Arial Black",
          fontSize: ORDER_FONT_SIZE,
          color: "#2b2a6b",
          backgroundColor: "#ffffff",
          padding: { x: ORDER_PADDING_X, y: ORDER_PADDING_Y },
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

  /** Which ordered slot (if any) a point falls inside, by simple
   * axis-aligned bounds - same approach as Level1's zoneAt(). */
  private slotAt(x: number, y: number): number | null {
    const inSlotY =
      y >= ORDER_SLOTS_TOP_Y && y <= ORDER_SLOTS_TOP_Y + ORDER_SLOT_HEIGHT;
    if (!inSlotY) {
      return null;
    }
    for (let i = 0; i < ORDER_COUNT; i++) {
      const slotX =
        ORDER_SLOTS_LEFT_X + i * (ORDER_SLOT_WIDTH + ORDER_SLOT_GAP);
      if (x >= slotX && x <= slotX + ORDER_SLOT_WIDTH) {
        return i;
      }
    }
    return null;
  }

  /** Resolves where a just-dropped glyph lands. Dropped outside every
   * slot, it simply becomes unplaced wherever it was dropped (same as
   * Level1's zoneless case). Dropped onto an already-occupied slot,
   * that slot's previous occupant is bumped back to its own original
   * pile position rather than swapped with the dragged glyph - simpler
   * and more predictable for a young child than a two-glyph swap. */
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

  /** The Check button is only enabled once every slot has a letter in
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

  /** Same enable/disable dimming pattern as Level1/Level2's
   * setScreenshotEnabled - only meaningful once a result exists. */
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
        return this.pileOrder[glyphIndex] === this.letters[slotIndex]
          ? count + 1
          : count;
      },
      0,
    );
    const score = Math.round((correctPositionCount / ORDER_COUNT) * 100);

    this.lastCorrectPositionCount = correctPositionCount;
    this.lastScore = score;
    this.resultsShown = true;

    this.feedbackText.setText(
      `Score: ${correctPositionCount}/${ORDER_COUNT} in the right spot (${score}/100)`,
    );
    this.setScreenshotEnabled(true);
  }

  /** Captures the actual rendered canvas (see ui.ts's
   * downloadCanvasSnapshot) once a result is on screen - same shared
   * helper Level1 and Level2 use. */
  private downloadResultScreenshot() {
    if (!this.resultsShown) {
      return;
    }
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    const filename = `letters-salad-${playerId ?? "unknown"}-level3-attempt${this.attempts}-result.png`;
    downloadCanvasSnapshot(this.game, filename);
  }

  /** Facilitator controls: Back steps to the immediately-preceding
   * scene (Level2); Continue goes to GameOver - this is now genuinely
   * the last stage, so no further scene-chaining concerns here. */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.finishTrial(true);
      this.scene.start("Level2");
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
      this.scene.start("GameOver");
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

    const trial: AlphabetOrderTrialData = {
      level: "Level3",
      startTime: new Date(this.trialStartMs).toISOString(),
      trialDurationMs: Date.now() - this.trialStartMs,
      endedByFacilitator,
      score: this.lastScore,
      orderSequenceLength: this.letters.length,
      orderCorrectPositionCount: this.lastCorrectPositionCount,
    };

    recordTrial(playerId, trial);
  }
}
