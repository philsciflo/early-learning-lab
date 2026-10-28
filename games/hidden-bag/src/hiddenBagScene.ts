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
  TREE_DISPLAY_WIDTH,
  TREE_DISPLAY_HEIGHT,
  TREE_COLLISION_RADIUS,
  BAG_HIDDEN_CLEARANCE,
  BAG_DRAG_BOUNDS,
  BAG_DISPLAY_WIDTH,
  BAG_DISPLAY_HEIGHT,
} from "./constants.ts";
import { resolveTreeCollision, segmentHitsTree } from "./collision.ts";
import { Side } from "./scoring.ts";
import { buildFriend, FriendId } from "./friends.ts";

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
   * the bag right now (the bag's own "found it" cue is the separate
   * flash+hop from ui.ts's playBigSuccessPop, called alongside this by
   * Level1/Level2). A no-op (no replayed animation) if `seen` hasn't
   * actually changed since the last call, so callers can call this on
   * every drag step without worrying about re-triggering it. */
  setNpcSeesBag(seen: boolean): void;
};

const NPC_EXCITED_COLOUR = 0x9b59b6;
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
 *
 * `friendId` picks which of the 4 friend designs (see friends.ts) the
 * child selected on the SelectFriend screen.
 */
export function createHiddenBagEnvironment(
  scene: Scene,
  onValidDrag: (x: number, y: number) => void,
  friendId: FriendId,
): HiddenBagEnvironment {
  scene.add.rectangle(0, 0, WIDTH, GROUND_Y, SKY_COLOUR).setOrigin(0, 0);
  scene.add
    .rectangle(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, GROUND_COLOUR)
    .setOrigin(0, 0);

  createTree(scene);

  const npcSide: Side = Math.random() < 0.5 ? "left" : "right";
  const bagStartSide: Side = npcSide === "left" ? "right" : "left";

  const { npc, npcEyeX, npcEyeY, body, bodyNormalColour } = createNpc(
    scene,
    npcSide,
    friendId,
  );
  const { container: bag } = createBag(scene, bagStartSide);

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

    // The bag is now a real image (bag_01.png), not plain fill-able
    // shapes, so it no longer gets its own purple colour swap - tinting
    // a detailed multi-colour illustration muddies the art rather than
    // reading as a clean "found it" signal. The existing flash+hop
    // (playBigSuccessPop, called by Level1/Level2 at the same moment)
    // is the bag's own "found it" cue; Milo's colour swap below plus
    // that flash/hop together are still a strong, clear signal.
    body.setFillStyle(seen ? NPC_EXCITED_COLOUR : bodyNormalColour);
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

/** The tree: tree_01.png, bottom-centre-anchored so its trunk base
 * sits on the ground at (TREE_CENTER_X, TREE_FEET_Y), sized so its
 * canopy roughly fills the TREE_CENTER_Y/TREE_RADIUS circle (see
 * constants.ts's TREE_DISPLAY_WIDTH/HEIGHT derivation) - that circle
 * remains the actual collider and line-of-sight pivot, entirely
 * independent of this image; this is purely the visual. */
function createTree(scene: Scene) {
  scene.add
    .image(TREE_CENTER_X, TREE_FEET_Y, "tree")
    .setOrigin(0.5, 1)
    .setDisplaySize(TREE_DISPLAY_WIDTH, TREE_DISPLAY_HEIGHT);
}

/** The NPC: fixed in place for the round, standing on `side` of the
 * tree and facing toward it, drawn as whichever friend the child chose
 * on the SelectFriend screen (see friends.ts for the actual shapes -
 * this just positions/flips that build the same way every friend
 * design shares). */
function createNpc(
  scene: Scene,
  side: Side,
  friendId: FriendId,
): {
  npc: GameObjects.Container;
  npcEyeX: number;
  npcEyeY: number;
  body: GameObjects.Shape;
  bodyNormalColour: number;
} {
  const sign = side === "left" ? -1 : 1;
  const npcX = TREE_CENTER_X + sign * NPC_DISTANCE_FROM_TREE;
  const npcEyeX = TREE_CENTER_X + sign * NPC_EYE_DISTANCE_FROM_TREE;
  const npcEyeY = NPC_EYE_Y;

  const { parts, body, bodyNormalColour } = buildFriend(scene, friendId);

  const npc = scene.add.container(npcX, NPC_FEET_Y, parts);

  if (side === "right") {
    // NPC stands to the right of the tree, so it must face left - every
    // friend design is drawn facing right by default.
    npc.scaleX = -1;
  }

  return { npc, npcEyeX, npcEyeY, body, bodyNormalColour };
}

/** The bag: the only thing the player can move. Starts just outside
 * the tree's collision radius, on `side` - opposite the NPC - so it
 * always starts hidden. bag_01.png, sized to BAG_DISPLAY_WIDTH/HEIGHT
 * (see constants.ts - BAG_RADIUS, and everything collision/drag-bounds
 * derived from it, is sized to match this same image). */
function createBag(
  scene: Scene,
  side: Side,
): {
  container: GameObjects.Container;
} {
  const sign = side === "left" ? -1 : 1;
  const clearance = TREE_COLLISION_RADIUS + BAG_HIDDEN_CLEARANCE;
  const bagX = TREE_CENTER_X + sign * clearance;
  const bagY = TREE_CENTER_Y;

  const image = scene.add
    .image(0, 0, "bag")
    .setDisplaySize(BAG_DISPLAY_WIDTH, BAG_DISPLAY_HEIGHT);

  const container = scene.add.container(bagX, bagY, [image]);
  container.setSize(BAG_DISPLAY_WIDTH, BAG_DISPLAY_HEIGHT);
  container.setInteractive({ draggable: true, useHandCursor: true });

  return { container };
}
