import { Scene, GameObjects } from "phaser";

import { canSee } from "./lineOfSight.ts";
import { Side } from "./scoring.ts";
import { playChime, playGentleMiss } from "./audio.ts";
import { playBigSuccessPop, SuccessBanner } from "./ui.ts";
import { buildFriend, FriendId } from "./friends.ts";

export type Point = { x: number; y: number };

// Tighter than it might otherwise be, specifically so Level4's 2x2
// grid (a hard vertical ceiling - 2 rows + this gap has to fit between
// the top instruction/success-banner zone and the bottom feedback/
// Try-Again zone) can use as large a card size as that ceiling allows.
export const CARD_GAP = 20;

// frame_01.png's usable "photo" window, measured directly on the
// source image (1262x1238): the inner white rectangle sits at
// x:[139,1069], y:[131,844]. Expressed as fractions of the native
// image so they scale correctly to whatever size the frame is
// displayed at.
const FRAME_NATIVE_W = 1262;
const FRAME_NATIVE_H = 1238;
const FRAME_INNER_LEFT = 139 / FRAME_NATIVE_W;
const FRAME_INNER_TOP = 131 / FRAME_NATIVE_H;
const FRAME_INNER_RIGHT = 1069 / FRAME_NATIVE_W;
const FRAME_INNER_BOTTOM = 844 / FRAME_NATIVE_H;

/** Every size/position derived from a given card width/height - cards
 * aren't one fixed size: Level3 (2 cards, a single row, lots of
 * vertical room) and Level4 (4 cards, a 2x2 grid, a hard vertical
 * ceiling) each pick their own card size and get their own layout via
 * computeCardLayout() below, rather than sharing one fixed CARD_W/H
 * that's forced to fit the tighter of the two. */
export type CardLayout = {
  cardW: number;
  cardH: number;
  sceneOffsetX: number;
  sceneOffsetY: number;
  treeLocalX: number;
  treeLocalY: number;
  npcDistanceFromTree: number;
  npcEyeYOffset: number;
  treeDisplayW: number;
  treeDisplayH: number;
  bagDisplayW: number;
  bagDisplayH: number;
  npcScale: number;
};

/** Card size follows frame_01.png's own native aspect ratio (1262x1238,
 * nearly square) so the frame image displays undistorted at whatever
 * `cardW`/`cardH` a level picks (as long as that pair keeps the ratio -
 * each level computes its own `cardH` from `cardW` via FRAME_NATIVE_H /
 * FRAME_NATIVE_W, or vice versa). */
export function computeCardLayout(cardW: number, cardH: number): CardLayout {
  const sceneOffsetX = FRAME_INNER_LEFT * cardW;
  const sceneOffsetY = FRAME_INNER_TOP * cardH;
  const sceneW = (FRAME_INNER_RIGHT - FRAME_INNER_LEFT) * cardW;
  const sceneH = (FRAME_INNER_BOTTOM - FRAME_INNER_TOP) * cardH;

  const treeLocalX = sceneW / 2;
  const treeLocalY = sceneH * 0.62;
  const npcDistanceFromTree = sceneW * 0.31;

  // tree_01.png/bag_01.png reused directly (not simple drawn shapes) so
  // the postcard matches the same art used everywhere else in the
  // game. Sized generously - 30% larger than a "fits naturally at a
  // glance" baseline (tree ~50% of the scene height, bag ~16%) - so
  // they read clearly rather than as a blurry thumbnail.
  const treeDisplayH = Math.round(sceneH * 0.5 * 1.3);
  const treeDisplayW = Math.round(treeDisplayH * (1262 / 1238));
  const bagDisplayH = Math.round(sceneH * 0.16 * 1.3);
  const bagDisplayW = Math.round(bagDisplayH * (1184 / 1048));

  return {
    cardW,
    cardH,
    sceneOffsetX,
    sceneOffsetY,
    treeLocalX,
    treeLocalY,
    npcDistanceFromTree,
    npcEyeYOffset: -sceneH * 0.18, // eye point is a bit above the NPC's feet
    treeDisplayW,
    treeDisplayH,
    bagDisplayW,
    bagDisplayH,
    npcScale: 0.22 * 1.3,
  };
}

export function npcEyeLocal(side: Side, layout: CardLayout): Point {
  const sign = side === "left" ? -1 : 1;
  return {
    x: layout.treeLocalX + sign * layout.npcDistanceFromTree,
    y: layout.treeLocalY + layout.npcEyeYOffset,
  };
}

/** Four candidate bag positions in the mini-scene's local coordinates.
 * Index 0 is always the one the NPC can actually see; 1-3 are hidden
 * distractors. Mirrored automatically for whichever side the NPC is
 * standing on. Callers that only need 2 options just use the first
 * two entries. Verified against canSee() at build time rather than
 * trusted blindly, since these were hand-placed. */
export function buildBagSpots(npcSide: Side, layout: CardLayout): Point[] {
  const npcEye = npcEyeLocal(npcSide, layout);
  const { treeLocalX, treeLocalY, npcDistanceFromTree } = layout;
  const treeCenter = { x: treeLocalX, y: treeLocalY };

  // Authored for "npc on the left"; mirrored below if npc is on the
  // right. All four sit at the same ground height as the tree/NPC and
  // differ only in which side (and how far) - earlier versions varied
  // height too, but a bag floating above/below the tree doesn't *look*
  // blocked by anything in a small thumbnail, even when the "opposite
  // side" rule says it should be hidden. Same-height, same-side-vs-not
  // is what actually reads clearly at this size.
  // Offsets are ratios of npcDistanceFromTree (not fixed pixels), so
  // this scales correctly with the card's own layout.
  const left = {
    visible: {
      x: treeLocalX - npcDistanceFromTree * 0.55,
      y: treeLocalY,
    },
    hiddenA: {
      x: treeLocalX + npcDistanceFromTree * 0.4,
      y: treeLocalY,
    }, // tucked right behind the trunk
    hiddenB: {
      x: treeLocalX + npcDistanceFromTree * 0.85,
      y: treeLocalY,
    }, // mirrors "visible", opposite side
    hiddenC: {
      x: treeLocalX + npcDistanceFromTree * 1.35,
      y: treeLocalY,
    }, // further past the tree
  };

  const mirror = (p: Point): Point => ({ x: 2 * treeLocalX - p.x, y: p.y });
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
  layout: CardLayout,
): Point[] {
  const step = { x: layout.cardW + CARD_GAP, y: layout.cardH + CARD_GAP };
  const topRow = [
    { x: gridX, y: gridY },
    { x: gridX + step.x, y: gridY },
  ];
  if (numOptions === 2) {
    return topRow;
  }
  return [
    ...topRow,
    { x: gridX, y: gridY + step.y },
    { x: gridX + step.x, y: gridY + step.y },
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
  layout: CardLayout,
): Postcard {
  const { cardW, cardH } = layout;
  const container = scene.add.container(position.x, position.y);

  // The frame IS the card background - its own border/corners define
  // the card's visual bounds, so the click hit area is still a plain
  // invisible rectangle sized to the frame's full footprint (same
  // "Phaser computes the hit area from a real Rectangle" reasoning as
  // makePostcardClickable's doc comment below).
  const frame = scene.add
    .image(0, 0, "frame")
    .setOrigin(0, 0)
    .setDisplaySize(cardW, cardH);
  const hitArea = scene.add
    .rectangle(0, 0, cardW, cardH, 0x000000, 0)
    .setOrigin(0, 0);
  container.add([frame, hitArea]);

  // No separate backdrop here - frame_01.png's own photo window is
  // already plain white, which is exactly what's wanted (no sky/
  // horizon/grass for this postcard-style view, just the assets
  // themselves on white).

  const localToCard = (p: Point) => ({
    x: layout.sceneOffsetX + p.x,
    y: layout.sceneOffsetY + p.y,
  });

  // Tree - the real tree_01.png (background removed), not a simple
  // drawn shape, same bottom-centre-anchor convention as the main
  // level's tree in hiddenBagScene.ts.
  const treePos = localToCard({ x: layout.treeLocalX, y: layout.treeLocalY });
  const tree = scene.add
    .image(treePos.x, treePos.y, "tree")
    .setOrigin(0.5, 1)
    .setDisplaySize(layout.treeDisplayW, layout.treeDisplayH);
  container.add(tree);

  // NPC
  const npcLocalFeet = {
    x:
      layout.treeLocalX +
      (npcSide === "left" ? -1 : 1) * layout.npcDistanceFromTree,
    y: layout.treeLocalY,
  };
  const npcPos = localToCard(npcLocalFeet);
  // Reuse the full-size friend build at a small scale, rather than a
  // separately hand-drawn mini version - same "feet at local (0,0),
  // facing right by default" convention as hiddenBagScene.ts's NPC, so
  // the same facing-flip-on-scaleX trick applies here too.
  const build = buildFriend(scene, friendId);
  const npcContainer = scene.add.container(npcPos.x, npcPos.y, build.parts);
  npcContainer.setScale(layout.npcScale);
  if (npcSide === "right") {
    npcContainer.scaleX = -layout.npcScale;
  }
  container.add(npcContainer);

  // Bag - the real bag_01.png (background removed), centre-anchored
  // same as the main level's bag.
  const bagPos = localToCard(bagPosition);
  const bag = scene.add
    .image(bagPos.x, bagPos.y, "bag")
    .setDisplaySize(layout.bagDisplayW, layout.bagDisplayH);
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
  layout: CardLayout,
): void {
  ctx.successBanner.show("🎉 Yes! Milo can see the bag there!");
  ctx.sparkles.emitParticleAt(
    card.x + layout.cardW / 2,
    card.y + layout.cardH / 2,
    30,
  );

  playBigSuccessPop(ctx.scene, card, {
    centerOffsetX: layout.cardW / 2,
    centerOffsetY: layout.cardH / 2,
    flashWidth: layout.cardW,
    flashHeight: layout.cardH,
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
  layout: CardLayout,
): void {
  ctx.feedbackText
    .setText("😅 Not quite - the ✓ shows where Milo could see it!")
    .setColor("#c0392b");

  const wrongMark = ctx.scene.add
    .text(
      clickedCard.x + layout.cardW / 2,
      clickedCard.y + layout.cardH / 2,
      "✗",
      {
        fontFamily: "Arial Black",
        fontSize: 72,
        color: "#c0392b",
      },
    )
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
      .text(
        correctCard.x + layout.cardW / 2,
        correctCard.y + layout.cardH / 2,
        "✓",
        {
          fontFamily: "Arial Black",
          fontSize: 72,
          color: "#2e7d32",
        },
      )
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
