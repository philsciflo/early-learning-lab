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
  BAG_VISUAL_SCALE,
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
  /** Visible for the whole level (not just on success) - the NPC is
   * always "asking", not silent until something happens. */
  speechBubble: GameObjects.Text;
  /** Updates the NPC's reaction - body colour, a bigger bounce/hop, and
   * the speech bubble text - to reflect whether it can currently see
   * the bag right now. A no-op (no replayed animation) if `seen` hasn't
   * actually changed since the last call, so callers can call this on
   * every drag step without worrying about re-triggering it. */
  setNpcSeesBag(seen: boolean): void;
};

const NPC_BODY_COLOUR = 0x4fb6a8;
const NPC_EXCITED_COLOUR = 0xffd166;
const NPC_QUESTION_TEXT = "Where is my bag?";
const NPC_THANKS_TEXT = "Ah, there it is. Thank you!";

/**
 * Builds the shared "Milo, a tree, and a draggable bag" scene used by
 * both Level1 (free drag, live feedback) and Level2 (blind drag, single
 * commit). Everything about the tree/NPC/bag visuals, the random side
 * assignment, the NPC's "I can/can't see it" reaction, and the
 * collision-safe drag handling lives here once, so the two levels
 * can't quietly drift out of sync with each other.
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
  scene.add
    .rectangle(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, GROUND_COLOUR)
    .setOrigin(0, 0);

  createTree(scene);

  const npcSide: Side = Math.random() < 0.5 ? "left" : "right";
  const bagStartSide: Side = npcSide === "left" ? "right" : "left";

  const { npc, npcEyeX, npcEyeY, body } = createNpc(scene, npcSide);
  const bag = createBag(scene, bagStartSide);

  const speechBubble = scene.add
    .text(npcEyeX, npcEyeY - 110, NPC_QUESTION_TEXT, {
      fontFamily: "Arial Black",
      fontSize: 22,
      color: "#2b2a6b",
      backgroundColor: "#ffffff",
      padding: { x: 12, y: 8 },
    })
    .setOrigin(0.5, 1);

  let npcSeesBag = false;
  const setNpcSeesBag = (seen: boolean) => {
    if (seen === npcSeesBag) {
      return;
    }
    npcSeesBag = seen;

    body.setFillStyle(seen ? NPC_EXCITED_COLOUR : NPC_BODY_COLOUR);
    speechBubble.setText(seen ? NPC_THANKS_TEXT : NPC_QUESTION_TEXT);

    if (seen) {
      // A bigger, clearer "aha!" than a plain wobble: a taller scaleY
      // bounce plus a small upward hop. scaleY only, not the "scale"
      // shorthand - the NPC container may have scaleX = -1 from the
      // left/right facing flip, and a uniform scale tween would
      // overwrite that.
      const baseY = npc.y;
      scene.tweens.add({
        targets: npc,
        scaleY: 1.22,
        y: baseY - 20,
        duration: 260,
        yoyo: true,
        ease: "Back.easeOut",
        onComplete: () => {
          npc.y = baseY;
        },
      });
    }
  };

  let lastValidX = bag.x;
  let lastValidY = bag.y;

  scene.input.on(
    "drag",
    (
      _pointer: Phaser.Input.Pointer,
      gameObject: GameObjects.Container,
      dragX: number,
      dragY: number,
    ) => {
      if (gameObject !== bag) {
        return;
      }

      const clampedX = Phaser.Math.Clamp(
        dragX,
        BAG_DRAG_BOUNDS.minX,
        BAG_DRAG_BOUNDS.maxX,
      );
      const clampedY = Phaser.Math.Clamp(
        dragY,
        BAG_DRAG_BOUNDS.minY,
        BAG_DRAG_BOUNDS.maxY,
      );

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

  return {
    npc,
    bag,
    npcEyeX,
    npcEyeY,
    npcSide,
    bagStartSide,
    speechBubble,
    setNpcSeesBag,
  };
}

/** The tree: a trunk, a few branches, and a canopy built from the main
 * collider circle plus extra leaf clumps layered around it. TREE_CENTER
 * / TREE_RADIUS (the main canopy circle below) are also used as the
 * solid collider and as the pivot point for the "which side is the bag
 * on" visibility check - the branches and leaf clumps are purely
 * decorative and don't change that circle's position or size, so the
 * visual, the collision, and the logic always agree with each other. */
function createTree(scene: Scene) {
  const trunkTopY = TREE_FEET_Y - TREE_TRUNK_HEIGHT;

  scene.add
    .rectangle(
      TREE_CENTER_X,
      TREE_FEET_Y - TREE_TRUNK_HEIGHT / 2,
      TREE_TRUNK_WIDTH,
      TREE_TRUNK_HEIGHT,
      0x8a5a2a,
    )
    .setStrokeStyle(3, 0x5c3a1a);

  // A few thin branches fanning up from the trunk's top into the
  // canopy - drawn before the canopy/leaves below so their far ends
  // are mostly hidden under the foliage, the way a real tree's
  // branches are.
  const BRANCH_DIRECTIONS: { dx: number; dy: number; length: number }[] = [
    { dx: -0.6, dy: -1, length: 70 },
    { dx: 0.6, dy: -1, length: 70 },
    { dx: -0.95, dy: -0.35, length: 48 },
    { dx: 0.95, dy: -0.35, length: 48 },
  ];
  BRANCH_DIRECTIONS.forEach(({ dx, dy, length }) => {
    scene.add
      .rectangle(TREE_CENTER_X, trunkTopY, length, 12, 0x8a5a2a)
      .setOrigin(0, 0.5)
      .setRotation(Math.atan2(dy, dx))
      .setStrokeStyle(2, 0x5c3a1a);
  });

  scene.add
    .circle(TREE_CENTER_X, TREE_CENTER_Y, TREE_RADIUS, 0x4caf50)
    .setStrokeStyle(4, 0x2e7d32);

  // A fuller leaf silhouette: smaller overlapping circles in varied
  // greens, layered on top of/around the main canopy circle above, so
  // the outline reads as leafy clumps rather than one flat disc. These
  // extend a little past TREE_RADIUS in places, which is fine - only
  // the circle above is the actual collider/visibility pivot.
  const LEAF_CLUMPS: { dx: number; dy: number; r: number; colour: number }[] = [
    { dx: -65, dy: -35, r: 46, colour: 0x66bb6a },
    { dx: 60, dy: -30, r: 42, colour: 0x81c784 },
    { dx: -45, dy: 45, r: 40, colour: 0x4caf50 },
    { dx: 50, dy: 50, r: 38, colour: 0x388e3c },
  ];
  LEAF_CLUMPS.forEach(({ dx, dy, r, colour }) => {
    scene.add
      .circle(TREE_CENTER_X + dx, TREE_CENTER_Y + dy, r, colour)
      .setStrokeStyle(2, 0x2e7d32);
  });
}

/** The NPC: fixed in place for the round, standing on `side` of the
 * tree and facing toward it. */
function createNpc(
  scene: Scene,
  side: Side,
): {
  npc: GameObjects.Container;
  npcEyeX: number;
  npcEyeY: number;
  body: GameObjects.Rectangle;
} {
  const sign = side === "left" ? -1 : 1;
  const npcX = TREE_CENTER_X + sign * NPC_DISTANCE_FROM_TREE;
  const npcEyeX = TREE_CENTER_X + sign * NPC_EYE_DISTANCE_FROM_TREE;
  const npcEyeY = NPC_EYE_Y;

  const body = scene.add
    .rectangle(0, -55, 56, 110, NPC_BODY_COLOUR)
    .setStrokeStyle(3, 0x2b2a6b);
  const head = scene.add
    .circle(0, -128, 32, 0xffd9b3)
    .setStrokeStyle(3, 0x2b2a6b);
  // Eyes offset toward the tree side of the head, so the NPC visibly
  // looks toward it. Drawn facing right; flipped below for "left".
  const eyeLeft = scene.add.circle(8, -132, 5, 0x2b2a6b);
  const eyeRight = scene.add.circle(20, -128, 5, 0x2b2a6b);

  const npc = scene.add.container(npcX, NPC_FEET_Y, [
    body,
    head,
    eyeLeft,
    eyeRight,
  ]);

  if (side === "right") {
    // NPC stands to the right of the tree, so it must face left - the
    // shapes above are drawn facing right by default.
    npc.scaleX = -1;
  }

  return { npc, npcEyeX, npcEyeY, body };
}

/** The bag: the only thing the player can move. Starts just outside
 * the tree's collision radius, on `side` - opposite the NPC - so it
 * always starts hidden. */
function createBag(scene: Scene, side: Side): GameObjects.Container {
  const sign = side === "left" ? -1 : 1;
  const clearance = TREE_COLLISION_RADIUS + BAG_HIDDEN_CLEARANCE;
  const bagX = TREE_CENTER_X + sign * clearance;
  const bagY = TREE_CENTER_Y;

  const s = BAG_VISUAL_SCALE;
  const body = scene.add
    .rectangle(0, 5 * s, 50 * s, 60 * s, 0xffb84d)
    .setStrokeStyle(3, 0x8a5a1a);
  const flap = scene.add
    .rectangle(0, -18 * s, 54 * s, 18 * s, 0xff9f40)
    .setStrokeStyle(3, 0x8a5a1a);
  const buckle = scene.add.circle(0, 5 * s, 6 * s, 0x8a5a1a);

  const container = scene.add.container(bagX, bagY, [body, flap, buckle]);
  container.setSize(56 * s, 86 * s);
  container.setInteractive({ draggable: true, useHandCursor: true });

  return container;
}
