import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  HEIGHT,
  PLAYER_ID_DATA_KEY,
  SUCCESS_BANNER_Y,
} from "../constants.ts";
import { recordTrial, Side } from "../scoring.ts";
import {
  CARD_W,
  CARD_GAP,
  buildBagSpots,
  buildPostcard,
  gridSlotPositions,
  shuffledIndices,
  makePostcardClickable,
  celebrateCard,
  commiserateCard,
  FeedbackContext,
} from "../postcardScene.ts";
import { createButton, createSuccessBanner, SuccessBanner } from "../ui.ts";

const GRID_X = (WIDTH - (CARD_W * 2 + CARD_GAP)) / 2;
const GRID_Y = 150;

/**
 * Level 4 (previously Level 3): four postcards, exactly one of which
 * shows a spot where Milo can see the bag. Pure recognition - no
 * construction required - so this is the last, most purely evaluative
 * step after Level 1 (free + live feedback) and Level 2 (construct +
 * blind reveal).
 */
export class Level4 extends Scene {
  private cards: GameObjects.Container[] = [];
  // The interactive element for each card is its background rectangle,
  // not the container itself (see makePostcardClickable) - tracked in
  // the same order as `cards` so disabling input after a click is easy.
  private hitAreas: GameObjects.Rectangle[] = [];
  private correctCardIndex: number;
  private npcSide: Side;
  private answered = false;
  private roundStartMs: number;
  private feedbackText: GameObjects.Text;
  private successBanner: SuccessBanner;
  private sparkles: GameObjects.Particles.ParticleEmitter;
  private audioContext?: AudioContext;
  private tryAgainButton?: GameObjects.Text;
  private marks: GameObjects.Text[] = [];

  constructor() {
    super("Level4");
  }

  create() {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0xf2f4fa).setOrigin(0, 0);

    // At fontSize 22, "Click the postcard where Milo can see their
    // bag!" (48 chars) is ~613px wide (~0.58 * fontSize per char for
    // bold Arial Black), spanning roughly x=270..882 centered on
    // WIDTH/2=576 - clear of both the top-left ("← Back", right edge
    // ~151) and top-right ("End Test", left edge ~978) button columns.
    // wordWrap is a safety net in case that ever changes.
    this.add
      .text(WIDTH / 2, 36, "Click the postcard where Milo can see their bag!", {
        fontFamily: "Arial Black",
        fontSize: 22,
        color: "#2b2a6b",
        align: "center",
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5, 0);

    this.createFacilitatorButtons();

    const gfx = this.add.graphics();
    gfx.fillStyle(0xffe066, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture("sparkle4", 12, 12);
    gfx.destroy();
    this.sparkles = this.add.particles(0, 0, "sparkle4", {
      lifespan: 600,
      speed: { min: 30, max: 90 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: "ADD",
      emitting: false,
    });

    this.feedbackText = this.add
      .text(WIDTH / 2, HEIGHT - 36, "", {
        fontFamily: "Arial Black",
        fontSize: 26,
        align: "center",
      })
      .setOrigin(0.5);

    this.successBanner = createSuccessBanner(this, WIDTH / 2, SUCCESS_BANNER_Y);

    this.startRound();
  }

  /** Sets up (or re-rolls) one round: a random NPC side, four candidate
   * bag spots (one visible, three hidden), shuffled into the four grid
   * slots so the correct answer isn't always in the same place. */
  private startRound() {
    this.answered = false;
    this.roundStartMs = Date.now();
    this.feedbackText.setText("");
    this.successBanner.hide();
    this.cards.forEach((card) => card.destroy()); // also destroys each hitArea, as a child
    this.cards = [];
    this.hitAreas = [];
    this.marks.forEach((mark) => mark.destroy());
    this.marks = [];
    this.tryAgainButton?.destroy();
    this.tryAgainButton = undefined;

    this.npcSide = Math.random() < 0.5 ? "left" : "right";
    const bagSpots = buildBagSpots(this.npcSide);

    // bagSpots[0] is always the visible/correct one. Shuffle which grid
    // slot it (and the three distractors) land in.
    const order = shuffledIndices(4);
    this.correctCardIndex = order.indexOf(0);

    const slotPositions = gridSlotPositions(4, GRID_X, GRID_Y);

    order.forEach((spotIndex, slot) => {
      const postcard = buildPostcard(
        this,
        slotPositions[slot],
        this.npcSide,
        bagSpots[spotIndex],
      );
      makePostcardClickable(postcard, () =>
        this.onCardClicked(postcard.container),
      );
      this.cards.push(postcard.container);
      this.hitAreas.push(postcard.hitArea);
    });
  }

  private onCardClicked(card: GameObjects.Container) {
    if (this.answered) {
      return;
    }
    this.answered = true;

    const clickedIndex = this.cards.indexOf(card);
    const correct = clickedIndex === this.correctCardIndex;
    const timeToChoiceMs = Date.now() - this.roundStartMs;

    this.hitAreas.forEach((h) => h.disableInteractive());

    const feedbackCtx: FeedbackContext = {
      scene: this,
      feedbackText: this.feedbackText,
      successBanner: this.successBanner,
      sparkles: this.sparkles,
      marks: this.marks,
      playSound: (fn) => this.playSound(fn),
    };

    if (correct) {
      celebrateCard(feedbackCtx, card);
    } else {
      commiserateCard(feedbackCtx, card, this.cards[this.correctCardIndex]);
    }

    this.recordChoice(clickedIndex, correct, timeToChoiceMs, false);
    this.createTryAgainButton();
  }

  private playSound(fn: (ctx: AudioContext) => void) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    fn(this.audioContext);
  }

  private createTryAgainButton() {
    this.tryAgainButton = this.add
      .text(WIDTH / 2, HEIGHT - 80, "Try Again", {
        fontFamily: "Arial Black",
        fontSize: 20,
        color: "#ffffff",
        backgroundColor: "#2b2a6b",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .once("pointerdown", () => {
        this.startRound();
      });
  }

  /** Facilitator control: this is the last level, so there's no "Next
   * Level" button, only "End Test" (top-right) plus "← Back" (top-left,
   * matching every other level's convention). */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      if (!this.answered) {
        this.recordChoice(null, null, null, true);
      }
      this.scene.start("Level3");
    });

    const endTest = createButton(this, WIDTH - 24, 24, "End Test", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });
    endTest.hitArea.on("pointerdown", () => {
      if (!this.answered) {
        this.recordChoice(null, null, null, true);
      }
      this.scene.start("GameOver");
    });
  }

  private recordChoice(
    chosenOptionIndex: number | null,
    correct: boolean | null,
    timeToChoiceMs: number | null,
    endedByFacilitator: boolean,
  ) {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    if (!playerId) {
      return;
    }

    recordTrial(playerId, {
      level: "Level4",
      npcSide: this.npcSide,
      numOptions: 4,
      correctOptionIndex: this.correctCardIndex,
      chosenOptionIndex,
      correct,
      timeToChoiceMs,
      startTime: new Date(this.roundStartMs).toISOString(),
      endedByFacilitator,
      trialDurationMs: Date.now() - this.roundStartMs,
    });
  }
}
