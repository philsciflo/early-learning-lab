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
} from "./constants.ts";
import { resolveTreeCollision, segmentHitsTree } from "./collision.ts";
import { Side } from "./scoring.ts";

export type HiddenBagEnvironment = {
  npc: GameObjects.Container;
  bag: GameObjects.Container;
  npcEyeX: number;
  npcEyeY: number;
  npcSide: Side;
  bagStartSide: Side;
};

/**
 * Builds the shared "Jerry, a tree, and a draggable bag" scene used by
 * both Level1 (free drag, live feedback) and Level2 (blind drag, single
 * commit). Everything about the tree/NPC/bag visuals, the random side
 * assignment, and the collision-safe drag handling lives here once, so
 * the two levels can't quietly drift out of sync with each other.
 *
 * `onValidDrag` fires after every drag step that's already been
 * clamped to the play area and resolved against the tree's collision -
 * callers only need to decide what to DO with that (e.g. Level1 checks
 * live visibility; Level2 just records the path).
 */
export function createHiddenBagEnvironment(
  scene: Scene,
  onValidDrag: (x: number, y: number) => void,
): HiddenBagEnvironment {
  scene.add.rectangle(0, 0, WIDTH, GROUND_Y, SKY_COLOUR).setOrigin(0, 0);
  scene.add.rectangle(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, GROUND_COLOUR).setOrigin(0, 0);

  createTree(scene);

  const npcSide: Side = Math.random() < 0.5 ? "left" : "right";
  const bagStartSide: Side = npcSide === "left" ? "right" : "left";

  const { npc, npcEyeX, npcEyeY } = createNpc(scene, npcSide);
  const bag = createBag(scene, bagStartSide);

  let lastValidX = bag.x;
  let lastValidY = bag.y;

  scene.input.on(
    "drag",
    (_pointer: Phaser.Input.Pointer, gameObject: GameObjects.Container, dragX: number, dragY: number) => {
      if (gameObject !== bag) {
        return;
      }

      const clampedX = Phaser.Math.Clamp(dragX, BAG_DRAG_BOUNDS.minX, BAG_DRAG_BOUNDS.maxX);
      const clampedY = Phaser.Math.Clamp(dragY, BAG_DRAG_BOUNDS.minY, BAG_DRAG_BOUNDS.maxY);

      // The tree is solid. Check the whole path travelled this frame -
      // not just the destination - so a fast drag can't tunnel through
      // it by jumping from one side to the other in a single step.
      if (segmentHitsTree(lastValidX, lastValidY, clampedX, clampedY)) {
        return;
      }

      const resolved = resolveTreeCollision(clampedX, clampedY);
      gameObject.x = resolved.x;
      gameObject.y = resolved.y;
      lastValidX = resolved.x;
      lastValidY = resolved.y;

      onValidDrag(resolved.x, resolved.y);
    },
  );

  return { npc, bag, npcEyeX, npcEyeY, npcSide, bagStartSide };
}

/** The tree: a trunk plus a canopy. TREE_CENTER / TREE_RADIUS are also
 * used as the solid collider and as the pivot point for the
 * "which side is the bag on" visibility check, so the visual, the
 * collision, and the logic always agree with each other. */
function createTree(scene: Scene) {
  scene.add
    .rectangle(TREE_CENTER_X, TREE_FEET_Y - TREE_TRUNK_HEIGHT / 2, TREE_TRUNK_WIDTH, TREE_TRUNK_HEIGHT, 0x8a5a2a)
    .setStrokeStyle(3, 0x5c3a1a);

  scene.add.circle(TREE_CENTER_X, TREE_CENTER_Y, TREE_RADIUS, 0x4caf50).setStrokeStyle(4, 0x2e7d32);
}

/** The NPC: fixed in place for the round, standing on `side` of the
 * tree and facing toward it. */
function createNpc(scene: Scene, side: Side): { npc: GameObjects.Container; npcEyeX: number; npcEyeY: number } {
  const sign = side === "left" ? -1 : 1;
  const npcX = TREE_CENTER_X + sign * NPC_DISTANCE_FROM_TREE;
  const npcEyeX = TREE_CENTER_X + sign * NPC_EYE_DISTANCE_FROM_TREE;
  const npcEyeY = NPC_EYE_Y;

  const body = scene.add.rectangle(0, -55, 56, 110, 0x4fb6a8).setStrokeStyle(3, 0x2b2a6b);
  const head = scene.add.circle(0, -128, 32, 0xffd9b3).setStrokeStyle(3, 0x2b2a6b);
  // Eyes offset toward the tree side of the head, so the NPC visibly
  // looks toward it. Drawn facing right; flipped below for "left".
  const eyeLeft = scene.add.circle(8, -132, 5, 0x2b2a6b);
  const eyeRight = scene.add.circle(20, -128, 5, 0x2b2a6b);

  const npc = scene.add.container(npcX, NPC_FEET_Y, [body, head, eyeLeft, eyeRight]);

  if (side === "right") {
    // NPC stands to the right of the tree, so it must face left - the
    // shapes above are drawn facing right by default.
    npc.scaleX = -1;
  }

  return { npc, npcEyeX, npcEyeY };
}

/** The bag: the only thing the player can move. Starts just outside
 * the tree's collision radius, on `side` - opposite the NPC - so it
 * always starts hidden. */
function createBag(scene: Scene, side: Side): GameObjects.Container {
  const sign = side === "left" ? -1 : 1;
  const clearance = TREE_COLLISION_RADIUS + BAG_HIDDEN_CLEARANCE;
  const bagX = TREE_CENTER_X + sign * clearance;
  const bagY = TREE_CENTER_Y;

  const body = scene.add.rectangle(0, 5, 50, 60, 0xffb84d).setStrokeStyle(3, 0x8a5a1a);
  const flap = scene.add.rectangle(0, -18, 54, 18, 0xff9f40).setStrokeStyle(3, 0x8a5a1a);
  const buckle = scene.add.circle(0, 5, 6, 0x8a5a1a);

  const container = scene.add.container(bagX, bagY, [body, flap, buckle]);
  container.setSize(56, 86);
  container.setInteractive({ draggable: true, useHandCursor: true });

  return container;
}
