import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  HEIGHT,
  TREE_CENTER_X,
  TREE_CENTER_Y,
  PLAYER_ID_DATA_KEY,
  SUCCESS_BANNER_Y,
} from "../constants.ts";
import { canSee } from "../lineOfSight.ts";
import {
  createHiddenBagEnvironment,
  HiddenBagEnvironment,
} from "../hiddenBagScene.ts";
import { playChime, playGentleMiss } from "../audio.ts";
import { recordTrial, DragPoint } from "../scoring.ts";
import {
  Button,
  createButton,
  createSuccessBanner,
  playBigSuccessPop,
  SuccessBanner,
} from "../ui.ts";

/**
 * Level 2: the same drag-the-bag task as Level 1, but blind. There is
 * no live "can Milo see it" feedback while dragging - the child has
 * to decide for themselves, then commit with the "Done" button. Only
 * then is the result revealed. This is the step up from Level 1's
 * forgiving, hint-as-you-go version, before Level 3/4 drop the
 * construction part entirely and just test recognition.
 */
export class Level2 extends Scene {
  private env: HiddenBagEnvironment;
  private feedbackText: GameObjects.Text;
  private successBanner: SuccessBanner;
  private doneButton: Button;
  private sparkles: GameObjects.Particles.ParticleEmitter;
  private audioContext?: AudioContext;
  private committed = false;

  // --- Trial data (see scoring.ts) ---
  private trialStartMs: number;
  private dragPath: DragPoint[] = [];
  private timeToFirstDragMs: number | null = null;
  private committedPosition: { x: number; y: number } | null = null;
  private timeToCommitMs: number | null = null;
  private correct: boolean | null = null;

  constructor() {
    super("Level2");
  }

  create() {
    this.committed = false;
    this.trialStartMs = Date.now();
    this.dragPath = [];
    this.timeToFirstDragMs = null;
    this.committedPosition = null;
    this.timeToCommitMs = null;
    this.correct = null;

    const gfx = this.add.graphics();
    gfx.fillStyle(0xffe066, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture("sparkle2", 12, 12);
    gfx.destroy();
    this.sparkles = this.add.particles(0, 0, "sparkle2", {
      lifespan: 600,
      speed: { min: 30, max: 90 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: "ADD",
      emitting: false,
    });

    // createHiddenBagEnvironment() paints the full-screen sky/ground
    // background - it must run before anything else that should be
    // visible on top of it (title, buttons), not after.
    this.env = createHiddenBagEnvironment(this, (x, y) =>
      this.onValidDrag(x, y),
    );

    // At fontSize 26, "Where do you think Milo can see the bag?" (40
    // chars) is ~603px wide (~0.58 * fontSize per char for bold Arial
    // Black), spanning roughly x=274..878 centered on WIDTH/2=576 -
    // clear of both the top-left ("← Back"/"Done!", right edge ~298 -
    // the Done button is wider than Back) and top-right ("Next Level
    // →", left edge ~931) button columns. wordWrap is a safety net in
    // case that ever changes.
    this.add
      .text(WIDTH / 2, 40, "Where do you think Milo can see the bag?", {
        fontFamily: "Arial Black",
        fontSize: 26,
        color: "#2b2a6b",
        align: "center",
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5, 0);

    this.createFacilitatorButtons();

    this.feedbackText = this.add
      .text(WIDTH / 2, HEIGHT - 70, "", {
        fontFamily: "Arial Black",
        fontSize: 24,
        align: "center",
      })
      .setOrigin(0.5);

    this.successBanner = createSuccessBanner(this, WIDTH / 2, SUCCESS_BANNER_Y);
  }

  private onValidDrag(x: number, y: number) {
    const tMs = Date.now() - this.trialStartMs;
    if (this.timeToFirstDragMs === null) {
      this.timeToFirstDragMs = tMs;
    }
    // No live visibility feedback here - that's the whole point of this
    // level - just record where the bag went and when.
    this.dragPath.push({ x, y, tMs });
  }

  private onCommit() {
    if (this.committed) {
      return;
    }
    this.committed = true;
    this.doneButton.hitArea.disableInteractive();
    this.doneButton.container.setAlpha(0.5);
    this.env.bag.disableInteractive();

    this.committedPosition = { x: this.env.bag.x, y: this.env.bag.y };
    this.timeToCommitMs = Date.now() - this.trialStartMs;
    this.correct = canSee(
      { x: this.env.npcEyeX, y: this.env.npcEyeY },
      this.committedPosition,
      { x: TREE_CENTER_X, y: TREE_CENTER_Y },
    );

    if (this.correct) {
      this.celebrate();
    } else {
      this.commiserate();
    }
  }

  private celebrate() {
    this.successBanner.show("🎉 Yes! Milo can see it there!");
    this.sparkles.emitParticleAt(this.env.bag.x, this.env.bag.y, 30);

    playBigSuccessPop(this, this.env.bag, {
      flashWidth: 100,
      flashHeight: 130,
    });
    // The NPC's colour change, bounce, and speech-bubble swap are all
    // handled centrally (see hiddenBagScene.ts's setNpcSeesBag) so this
    // and Level1 can't drift out of sync with each other.
    this.env.setNpcSeesBag(true);

    this.playSound(playChime);
  }

  private commiserate() {
    this.feedbackText
      .setText("😅 Not quite - try again next time!")
      .setColor("#c0392b");
    this.env.speechBubble.setText("I still can't see it...");

    this.tweens.add({
      targets: this.env.bag,
      x: this.env.bag.x - 8,
      duration: 60,
      yoyo: true,
      repeat: 4,
      ease: "Sine.easeInOut",
    });

    this.playSound(playGentleMiss);
  }

  private playSound(fn: (ctx: AudioContext) => void) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    fn(this.audioContext);
  }

  /** Facilitator controls, matching Level1's convention - plus the
   * "Done! I've decided." commit button, which lives in the top-left
   * column here (row 2, under "← Back") now that both corners host
   * facilitator/commit controls instead of just the top-right. */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.finishTrial();
      this.scene.start("Level1");
    });

    this.doneButton = createButton(this, 24, 88, "Done! I've decided.", {
      variant: "secondary",
      height: 48,
      fontSize: 18,
      origin: [0, 0],
    });
    this.doneButton.hitArea.on("pointerdown", () => this.onCommit());

    const nextLevel = createButton(this, WIDTH - 24, 24, "Next Level →", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });
    nextLevel.hitArea.on("pointerdown", () => {
      this.finishTrial();
      this.scene.start("Level3");
    });

    const endTest = createButton(this, WIDTH - 24, 88, "End Test", {
      variant: "muted",
      height: 48,
      fontSize: 15,
      origin: [1, 0],
    });
    endTest.hitArea.on("pointerdown", () => {
      this.finishTrial();
      this.scene.start("GameOver");
    });
  }

  private finishTrial() {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    if (!playerId) {
      return;
    }

    recordTrial(playerId, {
      level: "Level2",
      npcSide: this.env.npcSide,
      bagStartSide: this.env.bagStartSide,
      startTime: new Date(this.trialStartMs).toISOString(),
      dragPath: this.dragPath,
      timeToFirstDragMs: this.timeToFirstDragMs,
      committedPosition: this.committedPosition,
      timeToCommitMs: this.timeToCommitMs,
      correct: this.correct,
      endedByFacilitator: true,
      trialDurationMs: Date.now() - this.trialStartMs,
    });
  }
}
