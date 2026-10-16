import { Scene, GameObjects } from "phaser";

import { WIDTH, HEIGHT, PLAYER_ID_DATA_KEY } from "../constants.ts";
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

// Centers the PAIR of cards (2 * CARD_W + the gap between them), not
// just a single card width - that was the bug: using (WIDTH - CARD_W) / 2
// only centers one card, so the second card (placed CARD_W + CARD_GAP to
// its right) ran off the right edge of the canvas.
const GRID_X = (WIDTH - (CARD_W * 2 + CARD_GAP)) / 2;
const GRID_Y = 220;

/**
 * Level 3: the same postcard-recognition idea as Level 4, but with only
 * two options instead of four - a gentler step down from chance-level
 * 50% instead of 25%, and the natural bridge between Level 2
 * (construct + blind reveal) and Level 4 (recognise among four).
 */
export class Level3 extends Scene {
  private cards: GameObjects.Container[] = [];
  private correctCardIndex: number;
  private npcSide: Side;
  private answered = false;
  private roundStartMs: number;
  private feedbackText: GameObjects.Text;
  private sparkles: GameObjects.Particles.ParticleEmitter;
  private audioContext?: AudioContext;
  private tryAgainButton?: GameObjects.Text;
  private marks: GameObjects.Text[] = [];

  constructor() {
    super("Level3");
  }

  create() {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0xf2f4fa).setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 36, "Click the postcard where Jerry can see their bag!", {
        fontFamily: "Arial Black",
        fontSize: 28,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.createFacilitatorButtons();

    const gfx = this.add.graphics();
    gfx.fillStyle(0xffe066, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture("sparkle3", 12, 12);
    gfx.destroy();
    this.sparkles = this.add.particles(0, 0, "sparkle3", {
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

    this.startRound();
  }

  /** Sets up (or re-rolls) one round: a random NPC side, two candidate
   * bag spots (one visible, one hidden), shuffled into the two grid
   * slots so the correct answer isn't always on the same side. */
  private startRound() {
    this.answered = false;
    this.roundStartMs = Date.now();
    this.feedbackText.setText("");
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this.marks.forEach((mark) => mark.destroy());
    this.marks = [];
    this.tryAgainButton?.destroy();
    this.tryAgainButton = undefined;

    this.npcSide = Math.random() < 0.5 ? "left" : "right";
    // Only need the visible spot plus one hidden distractor.
    const bagSpots = buildBagSpots(this.npcSide).slice(0, 2);

    const order = shuffledIndices(2);
    this.correctCardIndex = order.indexOf(0);

    const slotPositions = gridSlotPositions(2, GRID_X, GRID_Y);

    order.forEach((spotIndex, slot) => {
      const card = buildPostcard(this, slotPositions[slot], this.npcSide, bagSpots[spotIndex]);
      makePostcardClickable(card, () => this.onCardClicked(card));
      this.cards.push(card);
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

    this.cards.forEach((c) => c.disableInteractive());

    const feedbackCtx: FeedbackContext = {
      scene: this,
      feedbackText: this.feedbackText,
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
    this.createNextButtons();
  }

  private playSound(fn: (ctx: AudioContext) => void) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    fn(this.audioContext);
  }

  private createNextButtons() {
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

  /** Facilitator controls, matching Level1/Level2's convention. */
  private createFacilitatorButtons() {
    this.add
      .text(WIDTH - 24, 24, "Next Level →", {
        fontFamily: "Arial Black",
        fontSize: 20,
        color: "#ffffff",
        backgroundColor: "#2b2a6b",
        padding: { x: 14, y: 10 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (!this.answered) {
          this.recordChoice(null, null, null, true);
        }
        this.scene.start("Level4");
      });

    this.add
      .text(WIDTH - 24, 70, "End Test", {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#2b2a6b",
        backgroundColor: "#f2f4fa",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
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
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as string | undefined;
    if (!playerId) {
      return;
    }

    recordTrial(playerId, {
      level: "Level3",
      npcSide: this.npcSide,
      numOptions: 2,
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
