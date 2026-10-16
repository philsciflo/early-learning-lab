import { Scene, GameObjects } from "phaser";

import { WIDTH, TREE_CENTER_X, TREE_CENTER_Y, PLAYER_ID_DATA_KEY } from "../constants.ts";
import { canSee } from "../lineOfSight.ts";
import { createHiddenBagEnvironment, HiddenBagEnvironment } from "../hiddenBagScene.ts";
import { recordTrial, DragPoint } from "../scoring.ts";

export class Level1 extends Scene {
  private env: HiddenBagEnvironment;
  private speechBubble: GameObjects.Text;

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

    this.add
      .text(WIDTH / 2, 40, "Help your friend spot the bag!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.createFacilitatorButtons();

    this.env = createHiddenBagEnvironment(this, (x, y) => this.onValidDrag(x, y));

    this.speechBubble = this.add
      .text(this.env.npcEyeX, this.env.npcEyeY - 110, "Hey, there's my bag!", {
        fontFamily: "Arial Black",
        fontSize: 22,
        color: "#2b2a6b",
        backgroundColor: "#ffffff",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5, 1)
      .setAlpha(0);
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
        this.scene.start("Level2");
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

  /** Writes this trial's full record to storage in one go (see
   * scoring.ts - recordTrial does a single localStorage write, rather
   * than one per drag-move event). */
  private finishTrial() {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as string | undefined;
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

    if (visible) {
      this.tweens.add({
        targets: this.env.bag,
        scale: 1.15,
        duration: 200,
        yoyo: true,
        ease: "Sine.easeOut",
      });

      // Only animate scaleY here, not the "scale" shorthand - the NPC
      // may be horizontally flipped (scaleX = -1) to face the tree, and
      // a uniform `scale` tween would overwrite that flip.
      this.tweens.add({
        targets: this.env.npc,
        scaleY: 1.08,
        duration: 200,
        yoyo: true,
        ease: "Sine.easeOut",
      });

      this.tweens.add({ targets: this.speechBubble, alpha: 1, duration: 300 });
    } else {
      this.tweens.add({ targets: this.speechBubble, alpha: 0, duration: 200 });
    }
  }
}
