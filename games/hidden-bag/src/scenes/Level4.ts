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

const GRID_X = (WIDTH - (CARD_W * 2 + CARD_GAP)) / 2;
const GRID_Y = 150;

/**
 * Level 4 (previously Level 3): four postcards, exactly one of which
 * shows a spot where Jerry can see the bag. Pure recognition - no
 * construction required - so this is the last, most purely evaluative
 * step after Level 1 (free + live feedback) and Level 2 (construct +
 * blind reveal).
 */
export class Level4 extends Scene {
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
    super("Level4");
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

    this.startRound();
  }

  /** Sets up (or re-rolls) one round: a random NPC side, four candidate
   * bag spots (one visible, three hidden), shuffled into the four grid
   * slots so the correct answer isn't always in the same place. */
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
    const bagSpots = buildBagSpots(this.npcSide);

    // bagSpots[0] is always the visible/correct one. Shuffle which grid
    // slot it (and the three distractors) land in.
    const order = shuffledIndices(4);
    this.correctCardIndex = order.indexOf(0);

    const slotPositions = gridSlotPositions(4, GRID_X, GRID_Y);

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
   * Level" button, only "End Test". */
  private createFacilitatorButtons() {
    this.add
      .text(WIDTH - 24, 24, "End Test", {
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
