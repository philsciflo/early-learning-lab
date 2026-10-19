import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  TREE_CENTER_X,
  TREE_CENTER_Y,
  PLAYER_ID_DATA_KEY,
} from "../constants.ts";
import { canSee } from "../lineOfSight.ts";
import {
  createHiddenBagEnvironment,
  HiddenBagEnvironment,
} from "../hiddenBagScene.ts";
import { recordTrial, DragPoint } from "../scoring.ts";
import { createButton, playBigSuccessPop } from "../ui.ts";

export class Level1 extends Scene {
  private env: HiddenBagEnvironment;
  private sparkles: GameObjects.Particles.ParticleEmitter;

  // Whether the NPC can currently see the bag. Unlike a one-shot "solved"
  // flag, this flips back and forth freely as the bag is dragged in and
  // out of view - the game never stops or locks the bag.
  private isVisibleToNpc = false;

  // --- Trial data (see scoring.ts) ---
  private trialStartMs: number;
  private dragPath: DragPoint[] = [];
  private timeToFirstDragMs: number | null = null;
  private successPosition: { x: number; y: number } | null = null;
  private timeToSuccessMs: number | null = null;

  constructor() {
    super("Level1");
  }

  create() {
    this.isVisibleToNpc = false;
    this.trialStartMs = Date.now();
    this.dragPath = [];
    this.timeToFirstDragMs = null;
    this.successPosition = null;
    this.timeToSuccessMs = null;

    const gfx = this.add.graphics();
    gfx.fillStyle(0xffe066, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture("sparkle1", 12, 12);
    gfx.destroy();
    this.sparkles = this.add.particles(0, 0, "sparkle1", {
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

    // At fontSize 32, "Help your friend spot the bag!" (30 chars) is
    // ~556px wide (~0.58 * fontSize per char for bold Arial Black),
    // spanning roughly x=298..854 centered on WIDTH/2=576 - clear of
    // both the top-left ("← Back", right edge ~151) and top-right
    // ("Next Level →", left edge ~931) button columns. wordWrap is a
    // safety net in case that ever changes.
    this.add
      .text(WIDTH / 2, 40, "Help your friend spot the bag!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5, 0);

    this.createFacilitatorButtons();
  }

  private onValidDrag(x: number, y: number) {
    const tMs = Date.now() - this.trialStartMs;
    if (this.timeToFirstDragMs === null) {
      this.timeToFirstDragMs = tMs;
    }
    this.dragPath.push({ x, y, tMs });

    this.updateVisibilityFeedback();
  }

  /** Facilitator controls, not part of the child's task: move on to the
   * next part of the session on demand (rather than any automatic
   * completion), or end the whole session early from here if needed. */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.finishTrial();
      this.scene.start("Level0");
    });

    const nextLevel = createButton(this, WIDTH - 24, 24, "Next Level →", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });
    nextLevel.hitArea.on("pointerdown", () => {
      this.finishTrial();
      this.scene.start("Level2");
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

  /** Writes this trial's full record to storage in one go (see
   * scoring.ts - recordTrial does a single localStorage write, rather
   * than one per drag-move event). */
  private finishTrial() {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    if (!playerId) {
      // Scene started directly, skipping the login screen (e.g. during
      // development) - nothing to attach this trial to.
      return;
    }

    recordTrial(playerId, {
      level: "Level1",
      npcSide: this.env.npcSide,
      bagStartSide: this.env.bagStartSide,
      startTime: new Date(this.trialStartMs).toISOString(),
      dragPath: this.dragPath,
      timeToFirstDragMs: this.timeToFirstDragMs,
      successPosition: this.successPosition,
      timeToSuccessMs: this.timeToSuccessMs,
      endedByFacilitator: true,
      trialDurationMs: Date.now() - this.trialStartMs,
    });
  }

  /** Re-checks whether the NPC can currently see the bag, and plays the
   * "noticed it" / "lost sight of it" transitions only when that state
   * actually changes - not on every single drag frame. The bag stays
   * draggable throughout; nothing here ever stops the game. */
  private updateVisibilityFeedback() {
    const visible = canSee(
      { x: this.env.npcEyeX, y: this.env.npcEyeY },
      { x: this.env.bag.x, y: this.env.bag.y },
      { x: TREE_CENTER_X, y: TREE_CENTER_Y },
    );

    if (visible === this.isVisibleToNpc) {
      return;
    }
    this.isVisibleToNpc = visible;

    if (visible && this.successPosition === null) {
      this.successPosition = { x: this.env.bag.x, y: this.env.bag.y };
      this.timeToSuccessMs = Date.now() - this.trialStartMs;
    }

    // The NPC's colour change, bounce, and speech-bubble swap are all
    // handled centrally (see hiddenBagScene.ts's setNpcSeesBag) so this
    // and Level2 can't drift out of sync with each other.
    this.env.setNpcSeesBag(visible);

    if (visible) {
      playBigSuccessPop(this, this.env.bag, {
        flashWidth: 100,
        flashHeight: 130,
      });
      this.sparkles.emitParticleAt(this.env.bag.x, this.env.bag.y, 30);
    }
  }
}
