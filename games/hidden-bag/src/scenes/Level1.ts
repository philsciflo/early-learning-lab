import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  HEIGHT,
  SKY_COLOUR,
  GROUND_COLOUR,
  GROUND_Y,
  NPC_X,
  NPC_FEET_Y,
  NPC_EYE_X,
  NPC_EYE_Y,
  TREE_FEET_Y,
  TREE_OCCLUDER_X,
  TREE_OCCLUDER_Y,
  TREE_OCCLUDER_RADIUS,
  BAG_START_X,
  BAG_START_Y,
  BAG_DRAG_BOUNDS,
} from "../constants.ts";
import { canSee } from "../lineOfSight.ts";

export class Level1 extends Scene {
  private npc: GameObjects.Container;
  private bag: GameObjects.Container;
  private speechBubble: GameObjects.Text;
  private solved = false;

  constructor() {
    super("Level1");
  }

  create() {
    this.solved = false;

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

    this.createTree();
    this.npc = this.createNpc();

    // Speech bubble, hidden until the puzzle is solved.
    this.speechBubble = this.add
      .text(NPC_X, NPC_EYE_Y - 110, "I can see it!", {
        fontFamily: "Arial Black",
        fontSize: 22,
        color: "#2b2a6b",
        backgroundColor: "#ffffff",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5, 1)
      .setAlpha(0);

    this.bag = this.createBag();

    this.input.on(
      "drag",
      (_pointer: Phaser.Input.Pointer, gameObject: GameObjects.Container, dragX: number, dragY: number) => {
        if (gameObject !== this.bag || this.solved) {
          return;
        }

        gameObject.x = Phaser.Math.Clamp(dragX, BAG_DRAG_BOUNDS.minX, BAG_DRAG_BOUNDS.maxX);
        gameObject.y = Phaser.Math.Clamp(dragY, BAG_DRAG_BOUNDS.minY, BAG_DRAG_BOUNDS.maxY);

        this.checkVisibility();
      },
    );
  }

  /** The tree: a trunk plus a canopy. The canopy circle IS the occluder
   * used by the line-of-sight check below, so the visual and the logic
   * always agree with each other. */
  private createTree() {
    const trunkHeight = 140;
    this.add
      .rectangle(TREE_OCCLUDER_X, TREE_FEET_Y - trunkHeight / 2, 26, trunkHeight, 0x8a5a2a)
      .setStrokeStyle(3, 0x5c3a1a);

    this.add
      .circle(TREE_OCCLUDER_X, TREE_OCCLUDER_Y, TREE_OCCLUDER_RADIUS, 0x4caf50)
      .setStrokeStyle(4, 0x2e7d32);
  }

  /** The NPC: fixed in place, facing right toward the tree. */
  private createNpc(): GameObjects.Container {
    const body = this.add.rectangle(0, -55, 56, 110, 0x4fb6a8).setStrokeStyle(3, 0x2b2a6b);
    const head = this.add.circle(0, -128, 32, 0xffd9b3).setStrokeStyle(3, 0x2b2a6b);
    // Eyes offset toward the right side of the head, to show the NPC is
    // looking right, toward the tree.
    const eyeLeft = this.add.circle(8, -132, 5, 0x2b2a6b);
    const eyeRight = this.add.circle(20, -128, 5, 0x2b2a6b);

    const container = this.add.container(NPC_X, NPC_FEET_Y, [body, head, eyeLeft, eyeRight]);
    return container;
  }

  /** The bag: the only thing the player can move. */
  private createBag(): GameObjects.Container {
    const body = this.add.rectangle(0, 5, 50, 60, 0xffb84d).setStrokeStyle(3, 0x8a5a1a);
    const flap = this.add.rectangle(0, -18, 54, 18, 0xff9f40).setStrokeStyle(3, 0x8a5a1a);
    const buckle = this.add.circle(0, 5, 6, 0x8a5a1a);

    const container = this.add.container(BAG_START_X, BAG_START_Y, [body, flap, buckle]);
    container.setSize(56, 86);
    container.setInteractive({ draggable: true, useHandCursor: true });

    return container;
  }

  private checkVisibility() {
    const visible = canSee(
      { x: NPC_EYE_X, y: NPC_EYE_Y },
      { x: this.bag.x, y: this.bag.y },
      { x: TREE_OCCLUDER_X, y: TREE_OCCLUDER_Y, radius: TREE_OCCLUDER_RADIUS },
    );

    if (visible) {
      this.onSolved();
    }
  }

  private onSolved() {
    if (this.solved) {
      return;
    }
    this.solved = true;

    this.bag.disableInteractive();

    this.tweens.add({
      targets: this.bag,
      scale: 1.15,
      duration: 200,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: this.npc,
      scale: 1.08,
      duration: 200,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: this.speechBubble,
      alpha: 1,
      duration: 300,
    });

    this.time.delayedCall(1800, () => {
      this.scene.start("GameOver");
    });
  }
}
