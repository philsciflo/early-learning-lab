import { Scene, GameObjects } from "phaser";

import { WIDTH, HEIGHT, TREE_CENTER_X, TREE_CENTER_Y, PLAYER_ID_DATA_KEY } from "../constants.ts";
import { canSee } from "../lineOfSight.ts";
import { createHiddenBagEnvironment, HiddenBagEnvironment } from "../hiddenBagScene.ts";
import { playChime, playGentleMiss } from "../audio.ts";
import { recordTrial, DragPoint } from "../scoring.ts";

/**
 * Level 2: the same drag-the-bag task as Level 1, but blind. There is
 * no live "can Jerry see it" feedback while dragging - the child has
 * to decide for themselves, then commit with the "Done" button. Only
 * then is the result revealed. This is the step up from Level 1's
 * forgiving, hint-as-you-go version, before Level 3/4 drop the
 * construction part entirely and just test recognition.
 */
export class Level2 extends Scene {
  private env: HiddenBagEnvironment;
  private speechBubble: GameObjects.Text;
  private feedbackText: GameObjects.Text;
  private doneButton: GameObjects.Text;
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
    this.env = createHiddenBagEnvironment(this, (x, y) => this.onValidDrag(x, y));

    this.add
      .text(WIDTH / 2, 40, "Where do you think Jerry can see the bag?", {
        fontFamily: "Arial Black",
        fontSize: 30,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.createFacilitatorButtons();

    this.speechBubble = this.add
      .text(this.env.npcEyeX, this.env.npcEyeY - 110, "", {
        fontFamily: "Arial Black",
        fontSize: 22,
        color: "#2b2a6b",
        backgroundColor: "#ffffff",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5, 1)
      .setAlpha(0);

    this.feedbackText = this.add
      .text(WIDTH / 2, HEIGHT - 70, "", {
        fontFamily: "Arial Black",
        fontSize: 24,
        align: "center",
      })
      .setOrigin(0.5);

    this.doneButton = this.add
      .text(WIDTH / 2, HEIGHT - 24, "Done! I've decided.", {
        fontFamily: "Arial Black",
        fontSize: 22,
        color: "#ffffff",
        backgroundColor: "#4fb6a8",
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.onCommit());
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
    this.doneButton.disableInteractive().setAlpha(0.5);
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
    this.feedbackText.setText("🎉 Yes! Jerry can see it there!").setColor("#2e7d32");
    this.speechBubble.setText("Hey, there's my bag!");
    this.sparkles.emitParticleAt(this.env.bag.x, this.env.bag.y, 30);

    this.tweens.add({ targets: this.env.bag, scale: 1.15, duration: 200, yoyo: true, ease: "Sine.easeOut" });
    // scaleY only, not "scale" - preserves the NPC's possible horizontal
    // flip (facing left/right toward the tree).
    this.tweens.add({ targets: this.env.npc, scaleY: 1.08, duration: 200, yoyo: true, ease: "Sine.easeOut" });
    this.tweens.add({ targets: this.speechBubble, alpha: 1, duration: 300 });

    this.playSound(playChime);
  }

  private commiserate() {
    this.feedbackText.setText("😅 Not quite - try again next time!").setColor("#c0392b");
    this.speechBubble.setText("I still can't see it...");

    this.tweens.add({
      targets: this.env.bag,
      x: this.env.bag.x - 8,
      duration: 60,
      yoyo: true,
      repeat: 4,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({ targets: this.speechBubble, alpha: 1, duration: 300 });

    this.playSound(playGentleMiss);
  }

  private playSound(fn: (ctx: AudioContext) => void) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    fn(this.audioContext);
  }

  /** Facilitator controls, matching Level1's convention. */
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
        this.finishTrial();
        this.scene.start("Level3");
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
        this.finishTrial();
        this.scene.start("GameOver");
      });
  }

  private finishTrial() {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as string | undefined;
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
