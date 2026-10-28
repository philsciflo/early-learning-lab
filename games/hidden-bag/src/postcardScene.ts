import { Scene, GameObjects } from "phaser";

import { canSee } from "./lineOfSight.ts";
import { Side } from "./scoring.ts";
import { playChime, playGentleMiss } from "./audio.ts";
import { playBigSuccessPop, SuccessBanner } from "./ui.ts";
import { buildFriend, FriendId } from "./friends.ts";

export type Point = { x: number; y: number };

// Card size follows frame_01.png's own native aspect ratio (1262x1238,
// nearly square) so the frame image displays undistorted - see the
// FRAME_* constants below for exactly where that leaves the usable
// "photo" area to draw into.
export const CARD_W = 245;
export const CARD_H = 240;
export const CARD_GAP = 30;

// frame_01.png's usable "photo" window, measured directly on the
// source image (1262x1238): the inner white rectangle sits at
// x:[139,1069], y:[131,844]. Expressed as fractions of the native
// image so they scale correctly to whatever size the frame is
// displayed at (CARD_W x CARD_H here).
const FRAME_NATIVE_W = 1262;
const FRAME_NATIVE_H = 1238;
const FRAME_INNER_LEFT = 139 / FRAME_NATIVE_W;
const FRAME_INNER_TOP = 131 / FRAME_NATIVE_H;
const FRAME_INNER_RIGHT = 1069 / FRAME_NATIVE_W;
const FRAME_INNER_BOTTOM = 844 / FRAME_NATIVE_H;

// The mini-scene drawn inside each card, in the card's own local
// coordinates (0,0 = card's top-left corner) - sized/positioned to
// land exactly inside the frame's photo window computed above.
const SCENE_OFFSET_X = FRAME_INNER_LEFT * CARD_W;
const SCENE_OFFSET_Y = FRAME_INNER_TOP * CARD_H;
const SCENE_W = (FRAME_INNER_RIGHT - FRAME_INNER_LEFT) * CARD_W;
const SCENE_H = (FRAME_INNER_BOTTOM - FRAME_INNER_TOP) * CARD_H;

const TREE_LOCAL_X = SCENE_W / 2;
const TREE_LOCAL_Y = SCENE_H * 0.62;
const NPC_DISTANCE_FROM_TREE = SCENE_W * 0.31;
const NPC_EYE_Y_OFFSET = -25; // eye point is a bit above the NPC's feet

// tree_01.png/bag_01.png reused directly here (not simple drawn
// shapes) so the postcard matches the same art used everywhere else in
// the game. Sized generously - 30% larger than a "fits naturally at a
// glance" baseline (tree ~50% of the scene height, bag ~16%) - so they
// read clearly rather than as a blurry thumbnail.
const POSTCARD_TREE_DISPLAY_HEIGHT = Math.round(SCENE_H * 0.5 * 1.3);
const POSTCARD_TREE_DISPLAY_WIDTH = Math.round(
  POSTCARD_TREE_DISPLAY_HEIGHT * (1262 / 1238),
);
const POSTCARD_BAG_DISPLAY_HEIGHT = Math.round(SCENE_H * 0.16 * 1.3);
const POSTCARD_BAG_DISPLAY_WIDTH = Math.round(
  POSTCARD_BAG_DISPLAY_HEIGHT * (1184 / 1048),
);
const POSTCARD_NPC_SCALE = 0.22 * 1.3;

export function npcEyeLocal(side: Side): Point {
  const sign = side === "left" ? -1 : 1;
  return {
    x: TREE_LOCAL_X + sign * NPC_DISTANCE_FROM_TREE,
    y: TREE_LOCAL_Y + NPC_EYE_Y_OFFSET,
  };
}

/** Four candidate bag positions in the mini-scene's local coordinates.
 * Index 0 is always the one the NPC can actually see; 1-3 are hidden
 * distractors. Mirrored automatically for whichever side the NPC is
 * standing on. Callers that only need 2 options just use the first
 * two entries. Verified against canSee() at build time rather than
 * trusted blindly, since these were hand-placed. */
export function buildBagSpots(npcSide: Side): Point[] {
  const npcEye = npcEyeLocal(npcSide);
  const treeCenter = { x: TREE_LOCAL_X, y: TREE_LOCAL_Y };

  // Authored for "npc on the left"; mirrored below if npc is on the
  // right. All four sit at the same ground height as the tree/NPC and
  // differ only in which side (and how far) - earlier versions varied
  // height too, but a bag floating above/below the tree doesn't *look*
  // blocked by anything in a small thumbnail, even when the "opposite
  // side" rule says it should be hidden. Same-height, same-side-vs-not
  // is what actually reads clearly at this size.
  // Offsets are ratios of NPC_DISTANCE_FROM_TREE (not fixed pixels), so
  // this scales correctly with the scene size rather than needing
  // hand-retuning every time SCENE_W changes.
  const left = {
    visible: {
      x: TREE_LOCAL_X - NPC_DISTANCE_FROM_TREE * 0.55,
      y: TREE_LOCAL_Y,
    },
    hiddenA: {
      x: TREE_LOCAL_X + NPC_DISTANCE_FROM_TREE * 0.4,
      y: TREE_LOCAL_Y,
    }, // tucked right behind the trunk
    hiddenB: {
      x: TREE_LOCAL_X + NPC_DISTANCE_FROM_TREE * 0.85,
      y: TREE_LOCAL_Y,
    }, // mirrors "visible", opposite side
    hiddenC: {
      x: TREE_LOCAL_X + NPC_DISTANCE_FROM_TREE * 1.35,
      y: TREE_LOCAL_Y,
    }, // further past the tree
  };

  const mirror = (p: Point): Point => ({ x: 2 * TREE_LOCAL_X - p.x, y: p.y });
  const spots =
    npcSide === "left"
      ? left
      : {
          visible: mirror(left.visible),
          hiddenA: mirror(left.hiddenA),
          hiddenB: mirror(left.hiddenB),
          hiddenC: mirror(left.hiddenC),
        };

  const ordered = [spots.visible, spots.hiddenA, spots.hiddenB, spots.hiddenC];

  const visibility = ordered.map((p) => canSee(npcEye, p, treeCenter));
  if (visibility[0] !== true || visibility.slice(1).some((v) => v === true)) {
    console.warn(
      "postcardScene: bag spot visibility assumptions do not hold",
      visibility,
    );
  }

  return ordered;
}

/** Grid slot positions for 2 (side by side) or 4 (2x2) postcards. */
export function gridSlotPositions(
  numOptions: 2 | 4,
  gridX: number,
  gridY: number,
): Point[] {
  const topRow = [
    { x: gridX, y: gridY },
    { x: gridX + CARD_W + CARD_GAP, y: gridY },
  ];
  if (numOptions === 2) {
    return topRow;
  }
  return [
    ...topRow,
    { x: gridX, y: gridY + CARD_H + CARD_GAP },
    { x: gridX + CARD_W + CARD_GAP, y: gridY + CARD_H + CARD_GAP },
  ];
}

export type Postcard = {
  /** The whole card's visuals, grouped for positioning/tweening/destroy. */
  container: GameObjects.Container;
  /** The actual clickable element - see makePostcardClickable(). */
  hitArea: GameObjects.Rectangle;
};

/** Draws one postcard (tree + NPC + bag at `bagPosition`) at `position`.
 * `friendId` picks which of the 4 friend designs (see friends.ts) draws
 * the NPC here, reusing the exact same shapes as the full-size level
 * and the SelectFriend screen (just scaled down) rather than a
 * separately hand-drawn mini version, so the chosen friend looks like
 * the same character everywhere in the game. Does not wire up the
 * click handler - callers attach their own "pointerdown" listener via
 * makePostcardClickable(). */
export function buildPostcard(
  scene: Scene,
  position: Point,
  npcSide: Side,
  bagPosition: Point,
  friendId: FriendId,
): Postcard {
  const container = scene.add.container(position.x, position.y);

  // The frame IS the card background - its own border/corners define
  // the card's visual bounds, so the click hit area is still a plain
  // invisible rectangle sized to the frame's full footprint (same
  // "Phaser computes the hit area from a real Rectangle" reasoning as
  // makePostcardClickable's doc comment below).
  const frame = scene.add
    .image(0, 0, "frame")
    .setOrigin(0, 0)
    .setDisplaySize(CARD_W, CARD_H);
  const hitArea = scene.add
    .rectangle(0, 0, CARD_W, CARD_H, 0x000000, 0)
    .setOrigin(0, 0);
  container.add([frame, hitArea]);

  // No separate backdrop here - frame_01.png's own photo window is
  // already plain white, which is exactly what's wanted (no sky/
  // horizon/grass for this postcard-style view, just the assets
  // themselves on white).

  const localToCard = (p: Point) => ({
    x: SCENE_OFFSET_X + p.x,
    y: SCENE_OFFSET_Y + p.y,
  });

  // Tree - the real tree_01.png (background removed), not a simple
  // drawn shape, same bottom-centre-anchor convention as the main
  // level's tree in hiddenBagScene.ts.
  const treePos = localToCard({ x: TREE_LOCAL_X, y: TREE_LOCAL_Y });
  const tree = scene.add
    .image(treePos.x, treePos.y, "tree")
    .setOrigin(0.5, 1)
    .setDisplaySize(POSTCARD_TREE_DISPLAY_WIDTH, POSTCARD_TREE_DISPLAY_HEIGHT);
  container.add(tree);

  // NPC
  const npcLocalFeet = {
    x: TREE_LOCAL_X + (npcSide === "left" ? -1 : 1) * NPC_DISTANCE_FROM_TREE,
    y: TREE_LOCAL_Y,
  };
  const npcPos = localToCard(npcLocalFeet);
  // Reuse the full-size friend build at a small scale, rather than a
  // separately hand-drawn mini version - same "feet at local (0,0),
  // facing right by default" convention as hiddenBagScene.ts's NPC, so
  // the same facing-flip-on-scaleX trick applies here too.
  const build = buildFriend(scene, friendId);
  const npcContainer = scene.add.container(npcPos.x, npcPos.y, build.parts);
  npcContainer.setScale(POSTCARD_NPC_SCALE);
  if (npcSide === "right") {
    npcContainer.scaleX = -POSTCARD_NPC_SCALE;
  }
  container.add(npcContainer);

  // Bag - the real bag_01.png (background removed), centre-anchored
  // same as the main level's bag.
  const bagPos = localToCard(bagPosition);
  const bag = scene.add
    .image(bagPos.x, bagPos.y, "bag")
    .setDisplaySize(POSTCARD_BAG_DISPLAY_WIDTH, POSTCARD_BAG_DISPLAY_HEIGHT);
  container.add(bag);

  return { container, hitArea };
}

/** Makes a whole postcard clickable, not just part of it, and no more
 * than that (not the gap between cards, not the space above/below).
 *
 * Earlier versions tried `container.setInteractive(customRectangle)`.
 * That turned out to be unreliable in practice - clicks well outside
 * a card's drawn bounds (in the gap between cards, or well above/left
 * of them) were registering as hits. Rectangles have real, intrinsic
 * width/height/origin, so letting Phaser compute the hit area itself
 * from the card's own background rectangle - the same technique used
 * for every other clickable thing in this codebase - is the reliable
 * path, rather than fighting a custom hit area on a Container (which
 * has no intrinsic size of its own). */
export function makePostcardClickable(
  postcard: Postcard,
  onClick: () => void,
): void {
  postcard.hitArea.setInteractive({ useHandCursor: true });
  postcard.hitArea.on("pointerdown", onClick);
}

/** Fisher-Yates shuffle of [0, 1, ..., n-1]. */
export function shuffledIndices(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export type FeedbackContext = {
  scene: Scene;
  feedbackText: GameObjects.Text;
  /** Bannerish positive-feedback panel - the "correct" counterpart to
   * `feedbackText`, which is reserved for the "not quite" message
   * (see ui.ts's createSuccessBanner). */
  successBanner: SuccessBanner;
  sparkles: GameObjects.Particles.ParticleEmitter;
  /** Any ✗/✓ marks created by celebrate/commiserate get pushed here, so
   * the caller can destroy them all in one go at the start of the next
   * round (same lifecycle as `cards`). */
  marks: GameObjects.Text[];
  playSound: (fn: (ctx: AudioContext) => void) => void;
};

export function celebrateCard(
  ctx: FeedbackContext,
  card: GameObjects.Container,
): void {
  ctx.successBanner.show("🎉 Yes! Milo can see the bag there!");
  ctx.sparkles.emitParticleAt(card.x + CARD_W / 2, card.y + CARD_H / 2, 30);

  playBigSuccessPop(ctx.scene, card, {
    centerOffsetX: CARD_W / 2,
    centerOffsetY: CARD_H / 2,
    flashWidth: CARD_W,
    flashHeight: CARD_H,
  });

  ctx.playSound(playChime);
}

/**
 * A wrong guess shakes the card the child actually clicked AND (after a
 * short beat) reveals the correct card elsewhere on screen. Without a
 * clear marker, that reads as "I clicked here but something happened
 * over there" - a big ✗ on the clicked card and a big ✓ on the correct
 * one make the two distinct reactions unambiguous.
 */
export function commiserateCard(
  ctx: FeedbackContext,
  clickedCard: GameObjects.Container,
  correctCard: GameObjects.Container,
): void {
  ctx.feedbackText
    .setText("😅 Not quite - the ✓ shows where Milo could see it!")
    .setColor("#c0392b");

  const wrongMark = ctx.scene.add
    .text(clickedCard.x + CARD_W / 2, clickedCard.y + CARD_H / 2, "✗", {
      fontFamily: "Arial Black",
      fontSize: 72,
      color: "#c0392b",
    })
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(10);
  ctx.marks.push(wrongMark);
  ctx.scene.tweens.add({ targets: wrongMark, alpha: 1, duration: 200 });

  ctx.scene.tweens.add({
    targets: clickedCard,
    x: clickedCard.x - 8,
    duration: 60,
    yoyo: true,
    repeat: 4,
    ease: "Sine.easeInOut",
  });

  ctx.playSound(playGentleMiss);

  ctx.scene.time.delayedCall(500, () => {
    const rightMark = ctx.scene.add
      .text(correctCard.x + CARD_W / 2, correctCard.y + CARD_H / 2, "✓", {
        fontFamily: "Arial Black",
        fontSize: 72,
        color: "#2e7d32",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);
    ctx.marks.push(rightMark);
    ctx.scene.tweens.add({
      targets: rightMark,
      alpha: 1,
      scale: { from: 0.4, to: 1 },
      duration: 300,
      ease: "Back.easeOut",
    });

    ctx.scene.tweens.add({
      targets: correctCard,
      scale: 1.08,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
    });
  });
}
