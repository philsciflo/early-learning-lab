import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  HEIGHT,
  SKY_COLOUR,
  GROUND_COLOUR,
  GROUND_Y,
  NPC_FEET_Y,
  NPC_EYE_Y,
  NPC_DISTANCE_FROM_TREE,
  NPC_EYE_DISTANCE_FROM_TREE,
  TREE_FEET_Y,
  TREE_CENTER_X,
  TREE_CENTER_Y,
  TREE_RADIUS,
  TREE_TRUNK_HEIGHT,
  TREE_TRUNK_WIDTH,
  TREE_COLLISION_RADIUS,
  BAG_HIDDEN_CLEARANCE,
  BAG_DRAG_BOUNDS,
} from "../constants.ts";
import { canSee } from "../lineOfSight.ts";
import { resolveTreeCollision, segmentHitsTree } from "../collision.ts";

type Side = "left" | "right";

export class Level1 extends Scene {
  private npc: GameObjects.Container;
  private bag: GameObjects.Container;
  private speechBubble: GameObjects.Text;

  // Whether the NPC can currently see the bag. Unlike a one-shot "solved"
  // flag, this flips back and forth freely as the bag is dragged in and
  // out of view - the game never stops or locks the bag.
  private isVisibleToNpc = false;

  private npcEyeX: number;
  private npcEyeY: number = NPC_EYE_Y;

  // The bag's last position that was NOT inside the tree. Used to sweep-
  // test every drag step against the tree, so a fast drag can't jump
  // straight through it in a single frame (see collision.ts).
  private lastValidBagX: number;
  private lastValidBagY: number;

  constructor() {
    super("Level1");
  }

  create() {
    this.isVisibleToNpc = false;

    // Simple sky + ground backdrop.
    this.add.rectangle(0, 0, WIDTH, GROUND_Y, SKY_COLOUR).setOrigin(0, 0);
    this.add.rectangle(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, GROUND_COLOUR).setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 40, "Help your friend spot the bag!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.createEndTestButton();
    this.createTree();

    // Randomly pick which side of the tree the NPC stands on. The bag
    // always starts hidden on the opposite side, so the puzzle is always
    // solvable the same way regardless of which side comes up.
    const npcSide: Side = Math.random() < 0.5 ? "left" : "right";
    const bagSide: Side = npcSide === "left" ? "right" : "left";

    this.npc = this.createNpc(npcSide);

    this.speechBubble = this.add
      .text(this.npcEyeX, this.npcEyeY - 110, "Hey, there's my bag!", {
        fontFamily: "Arial Black",
        fontSize: 22,
        color: "#2b2a6b",
        backgroundColor: "#ffffff",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5, 1)
      .setAlpha(0);

    this.bag = this.createBag(bagSide);
    this.lastValidBagX = this.bag.x;
    this.lastValidBagY = this.bag.y;

    this.input.on(
      "drag",
      (_pointer: Phaser.Input.Pointer, gameObject: GameObjects.Container, dragX: number, dragY: number) => {
        if (gameObject !== this.bag) {
          return;
        }

        const clampedX = Phaser.Math.Clamp(dragX, BAG_DRAG_BOUNDS.minX, BAG_DRAG_BOUNDS.maxX);
        const clampedY = Phaser.Math.Clamp(dragY, BAG_DRAG_BOUNDS.minY, BAG_DRAG_BOUNDS.maxY);

        // The tree is solid. Check the whole path travelled this frame -
        // not just the destination - so a fast drag can't tunnel through
        // it by jumping from one side to the other in a single step.
        if (segmentHitsTree(this.lastValidBagX, this.lastValidBagY, clampedX, clampedY)) {
          return;
        }

        const resolved = resolveTreeCollision(clampedX, clampedY);
        gameObject.x = resolved.x;
        gameObject.y = resolved.y;
        this.lastValidBagX = resolved.x;
        this.lastValidBagY = resolved.y;

        this.updateVisibilityFeedback();
      },
    );
  }

  /** A researcher/facilitator control, not part of the child's task:
   * ends the session on demand instead of the game auto-completing. */
  private createEndTestButton() {
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
        this.scene.start("GameOver");
      });
  }

  /** The tree: a trunk plus a canopy. TREE_CENTER / TREE_RADIUS are also
   * used as the solid collider and as the pivot point for the
   * "which side is the bag on" visibility check, so the visual, the
   * collision, and the logic always agree with each other. */
  private createTree() {
    this.add
      .rectangle(TREE_CENTER_X, TREE_FEET_Y - TREE_TRUNK_HEIGHT / 2, TREE_TRUNK_WIDTH, TREE_TRUNK_HEIGHT, 0x8a5a2a)
      .setStrokeStyle(3, 0x5c3a1a);

    this.add.circle(TREE_CENTER_X, TREE_CENTER_Y, TREE_RADIUS, 0x4caf50).setStrokeStyle(4, 0x2e7d32);
  }

  /** The NPC: fixed in place for the round, standing on `side` of the
   * tree and facing toward it. */
  private createNpc(side: Side): GameObjects.Container {
    const sign = side === "left" ? -1 : 1;
    const npcX = TREE_CENTER_X + sign * NPC_DISTANCE_FROM_TREE;
    this.npcEyeX = TREE_CENTER_X + sign * NPC_EYE_DISTANCE_FROM_TREE;

    const body = this.add.rectangle(0, -55, 56, 110, 0x4fb6a8).setStrokeStyle(3, 0x2b2a6b);
    const head = this.add.circle(0, -128, 32, 0xffd9b3).setStrokeStyle(3, 0x2b2a6b);
    // Eyes offset toward the tree side of the head, so the NPC visibly
    // looks toward it. Drawn facing right; flipped below for "left".
    const eyeLeft = this.add.circle(8, -132, 5, 0x2b2a6b);
    const eyeRight = this.add.circle(20, -128, 5, 0x2b2a6b);

    const container = this.add.container(npcX, NPC_FEET_Y, [body, head, eyeLeft, eyeRight]);

    if (side === "left") {
      // NPC stands to the left of the tree, so it must face right - the
      // shapes above are already drawn facing right, so no flip needed.
    } else {
      // NPC stands to the right of the tree, so it must face left.
      container.scaleX = -1;
    }

    return container;
  }

  /** The bag: the only thing the player can move. Starts just outside
   * the tree's collision radius, on `side` - opposite the NPC - so it
   * always starts hidden. */
  private createBag(side: Side): GameObjects.Container {
    const sign = side === "left" ? -1 : 1;
    const clearance = TREE_COLLISION_RADIUS + BAG_HIDDEN_CLEARANCE;
    const bagX = TREE_CENTER_X + sign * clearance;
    const bagY = TREE_CENTER_Y;

    const body = this.add.rectangle(0, 5, 50, 60, 0xffb84d).setStrokeStyle(3, 0x8a5a1a);
    const flap = this.add.rectangle(0, -18, 54, 18, 0xff9f40).setStrokeStyle(3, 0x8a5a1a);
    const buckle = this.add.circle(0, 5, 6, 0x8a5a1a);

    const container = this.add.container(bagX, bagY, [body, flap, buckle]);
    container.setSize(56, 86);
    container.setInteractive({ draggable: true, useHandCursor: true });

    return container;
  }

  /** Re-checks whether the NPC can currently see the bag, and plays the
   * "noticed it" / "lost sight of it" transitions only when that state
   * actually changes - not on every single drag frame. The bag stays
   * draggable throughout; nothing here ever stops the game. */
  private updateVisibilityFeedback() {
    const visible = canSee(
      { x: this.npcEyeX, y: this.npcEyeY },
      { x: this.bag.x, y: this.bag.y },
      { x: TREE_CENTER_X, y: TREE_CENTER_Y },
    );

    if (visible === this.isVisibleToNpc) {
      return;
    }
    this.isVisibleToNpc = visible;

    if (visible) {
      this.tweens.add({
        targets: this.bag,
        scale: 1.15,
        duration: 200,
        yoyo: true,
        ease: "Sine.easeOut",
      });

      // Only animate scaleY here, not the "scale" shorthand - the NPC
      // may be horizontally flipped (scaleX = -1) to face the tree, and
      // a uniform `scale` tween would overwrite that flip.
      this.tweens.add({
        targets: this.npc,
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
