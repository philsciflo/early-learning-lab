import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  LEVEL_BACKGROUND_COLOUR,
  GLYPH_COUNT,
  GLYPH_FONT_SIZE,
  GLYPH_PADDING_X,
  GLYPH_PADDING_Y,
  PILE_CENTER_Y,
  PILE_X_JITTER,
  PILE_Y_JITTER,
  PILE_MARGIN_X,
  ZONE_WIDTH,
  ZONE_HEIGHT,
  ZONE_TOP_Y,
  LETTERS_ZONE_X,
  OTHER_ZONE_X,
  LETTERS_ZONE_COLOUR,
  OTHER_ZONE_COLOUR,
  ZONE_BORDER_COLOUR,
  PLAYER_ID_DATA_KEY,
  LAST_SCORE_DATA_KEY,
} from "../constants.ts";
import { recordTrial, SortTrialData } from "../scoring.ts";
import { Button, createButton, downloadCanvasSnapshot } from "../ui.ts";

const BUTTONS_Y = ZONE_TOP_Y + ZONE_HEIGHT + 60;
const FEEDBACK_Y = BUTTONS_Y + 70;

const LETTER_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SYMBOL_POOL = "0123456789?!".split("");

type GlyphKind = "letter" | "symbol";
type Glyph = { char: string; kind: GlyphKind };
type Zone = "letters" | "other" | null;

/** Builds this attempt's pile of GLYPH_COUNT glyphs: exactly half
 * unique uppercase letters, half unique non-letter symbols (digits
 * 0-9, "?", "!"), shuffled together so both which characters appear
 * and where they land in the pile are randomized each attempt. A fixed
 * half/half split keeps every attempt equally hard while still varying
 * the actual characters. */
function buildGlyphPile(): Glyph[] {
  const half = GLYPH_COUNT / 2;
  const letters = Phaser.Utils.Array.Shuffle(LETTER_POOL.slice()).slice(
    0,
    half,
  );
  const symbols = Phaser.Utils.Array.Shuffle(SYMBOL_POOL.slice()).slice(
    0,
    half,
  );

  const glyphs: Glyph[] = [
    ...letters.map((char): Glyph => ({ char, kind: "letter" })),
    ...symbols.map((char): Glyph => ({ char, kind: "symbol" })),
  ];

  return Phaser.Utils.Array.Shuffle(glyphs);
}

function correctZoneFor(kind: GlyphKind): Zone {
  return kind === "letter" ? "letters" : "other";
}

/**
 * Level 1: "Sort letters from symbols." A pile of GLYPH_COUNT large
 * glyphs (a random half/half mix of uppercase letters and non-letter
 * symbols) start scattered above two labelled drop zones. The child
 * drags each one into "Letters" or "Other" using Phaser's native drag
 * input; "Check" (enabled once every glyph has landed in a zone) scores
 * how many ended up in the correct zone.
 */
export class Level1 extends Scene {
  private glyphs: Glyph[] = [];
  private glyphTexts: GameObjects.Text[] = [];
  private placements: Zone[] = [];

  private checkButton: Button;
  private screenshotButton: Button;
  private feedbackText: GameObjects.Text;

  private attempts = 0;
  private trialStartMs: number;
  private lastScore: number | null = null;
  private lastCorrectCount: number | null = null;
  private resultsShown = false;

  constructor() {
    super("Level1");
  }

  create() {
    this.glyphs = buildGlyphPile();
    this.placements = new Array(GLYPH_COUNT).fill(null);
    this.glyphTexts = [];
    this.attempts = 0;
    this.trialStartMs = Date.now();
    this.lastScore = null;
    this.lastCorrectCount = null;
    this.resultsShown = false;

    this.add
      .rectangle(0, 0, WIDTH, this.scale.height, LEVEL_BACKGROUND_COLOUR)
      .setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 40, "Sort letters from symbols!", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.createZones();
    this.createPile();
    this.createDragHandlers();

    this.feedbackText = this.add
      .text(WIDTH / 2, FEEDBACK_Y, "", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 26,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    this.createActionButtons();
    this.createFacilitatorButtons();
  }

  private createZones() {
    this.drawZone(LETTERS_ZONE_X, LETTERS_ZONE_COLOUR, "Letters");
    this.drawZone(OTHER_ZONE_X, OTHER_ZONE_COLOUR, "Other");
  }

  /** One labelled, rounded-rect drop zone - same plain filled/bordered
   * framing style as whaka-ahua's canvas frames, just rounded and
   * tinted per zone. */
  private drawZone(x: number, fillColour: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(fillColour, 1);
    g.lineStyle(3, ZONE_BORDER_COLOUR, 1);
    g.fillRoundedRect(x, ZONE_TOP_Y, ZONE_WIDTH, ZONE_HEIGHT, 16);
    g.strokeRoundedRect(x, ZONE_TOP_Y, ZONE_WIDTH, ZONE_HEIGHT, 16);

    this.add
      .text(x + ZONE_WIDTH / 2, ZONE_TOP_Y - 30, label, {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 24,
        color: "#2b2a6b",
      })
      .setOrigin(0.5);
  }

  /** Lays the glyph pile out in GLYPH_COUNT evenly spaced slots above
   * the zones, with a little random jitter so it reads as a loose pile
   * rather than a perfect grid. Each glyph is a single draggable Text
   * object - its backgroundColor card doubles as a consistent, generous
   * drag target even for narrow characters like "!" or "1". */
  private createPile() {
    const spacing = (WIDTH - 2 * PILE_MARGIN_X) / (GLYPH_COUNT - 1);

    this.glyphs.forEach((glyph, i) => {
      const baseX = PILE_MARGIN_X + i * spacing;
      const x = baseX + Phaser.Math.Between(-PILE_X_JITTER, PILE_X_JITTER);
      const y =
        PILE_CENTER_Y + Phaser.Math.Between(-PILE_Y_JITTER, PILE_Y_JITTER);

      const text = this.add
        .text(x, y, glyph.char, {
          fontFamily: "Fredoka, Arial Black, sans-serif",
          fontSize: GLYPH_FONT_SIZE,
          color: "#2b2a6b",
          backgroundColor: "#ffffff",
          padding: { x: GLYPH_PADDING_X, y: GLYPH_PADDING_Y },
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
        const text = gameObject as GameObjects.Text;
        this.placements[index] = this.zoneAt(text.x, text.y);
        this.updateCheckEnabled();
      },
    );
  }

  /** Which drop zone (if any) a point falls inside, by simple
   * axis-aligned bounds - a glyph dropped outside both zones (eg left
   * on the pile) stays unplaced. */
  private zoneAt(x: number, y: number): Zone {
    const inZoneY = y >= ZONE_TOP_Y && y <= ZONE_TOP_Y + ZONE_HEIGHT;
    if (!inZoneY) {
      return null;
    }
    if (x >= LETTERS_ZONE_X && x <= LETTERS_ZONE_X + ZONE_WIDTH) {
      return "letters";
    }
    if (x >= OTHER_ZONE_X && x <= OTHER_ZONE_X + ZONE_WIDTH) {
      return "other";
    }
    return null;
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

  /** The Check button is only enabled once every glyph has been
   * dropped into one zone or the other - same enable/disable dimming
   * pattern as whaka-ahua's download buttons. */
  private updateCheckEnabled() {
    const allPlaced = this.placements.every((zone) => zone !== null);
    this.checkButton.container.setAlpha(allPlaced ? 1 : 0.4);
    if (allPlaced) {
      this.checkButton.hitArea.setInteractive({ useHandCursor: true });
    } else {
      this.checkButton.hitArea.disableInteractive();
    }
  }

  /** The screenshot download is only meaningful once "Check" has
   * produced a result to capture - disabled (dimmed, non-interactive)
   * the rest of the time, same pattern as updateCheckEnabled(). */
  private setScreenshotEnabled(enabled: boolean) {
    this.screenshotButton.container.setAlpha(enabled ? 1 : 0.4);
    if (enabled) {
      this.screenshotButton.hitArea.setInteractive({ useHandCursor: true });
    } else {
      this.screenshotButton.hitArea.disableInteractive();
    }
  }

  private checkPlacements() {
    if (this.placements.some((zone) => zone === null)) {
      return;
    }

    this.attempts += 1;

    const correctCount = this.glyphs.reduce(
      (count, glyph, i) =>
        this.placements[i] === correctZoneFor(glyph.kind) ? count + 1 : count,
      0,
    );
    const score = Math.round((correctCount / GLYPH_COUNT) * 100);

    this.lastCorrectCount = correctCount;
    this.lastScore = score;
    this.resultsShown = true;

    this.feedbackText.setText(
      `Score: ${correctCount}/${GLYPH_COUNT} correct (${score}/100)`,
    );
    this.setScreenshotEnabled(true);
  }

  /** Captures the actual rendered canvas (see ui.ts's
   * downloadCanvasSnapshot) once a result is on screen - a shared
   * helper so Levels 2 and 3 in later stages can reuse it unchanged. */
  private downloadResultScreenshot() {
    if (!this.resultsShown) {
      return;
    }
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    const filename = `letters-salad-${playerId ?? "unknown"}-level1-attempt${this.attempts}-result.png`;
    downloadCanvasSnapshot(this.game, filename);
  }

  /** Facilitator controls: move on whenever they judge the child is
   * done (rather than on a fixed condition), or step back to the menu -
   * matching every other level's top-left/top-right button convention. */
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

    // Level2 now sits between Level1 and GameOver (a later stage
    // inserts Level3 after Level2) - this scene key was the one thing
    // that needed to change to extend the chain, no other rework.
    const continueButton = createButton(this, WIDTH - 24, 24, "Continue →", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });
    continueButton.hitArea.on("pointerdown", () => {
      this.finishTrial(this.attempts === 0);
      this.registry.set(LAST_SCORE_DATA_KEY, this.lastScore);
      this.scene.start("Level2");
    });
  }

  /** Writes this trial's full record to storage in one go (see
   * scoring.ts - recordTrial does a single localStorage write, rather
   * than one per placement). */
  private finishTrial(endedByFacilitator: boolean) {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    if (!playerId) {
      // Scene started directly, skipping the login screen (e.g. during
      // development) - nothing to attach this trial to.
      return;
    }

    const letterCount = this.glyphs.filter((g) => g.kind === "letter").length;
    const symbolCount = this.glyphs.length - letterCount;

    const trial: SortTrialData = {
      level: "Level1",
      startTime: new Date(this.trialStartMs).toISOString(),
      trialDurationMs: Date.now() - this.trialStartMs,
      endedByFacilitator,
      score: this.lastScore,
      sortGlyphCount: this.glyphs.length,
      sortLetterCount: letterCount,
      sortSymbolCount: symbolCount,
      sortCorrectCount: this.lastCorrectCount,
    };

    recordTrial(playerId, trial);
  }
}
