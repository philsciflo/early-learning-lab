import { Scene, GameObjects } from "phaser";

import { canSee } from "./lineOfSight.ts";
import { Side } from "./scoring.ts";
import { playChime, playGentleMiss } from "./audio.ts";

export type Point = { x: number; y: number };

export const CARD_W = 480;
export const CARD_H = 260;
export const CARD_GAP = 40;

// The mini-scene drawn inside each card, in the card's own local
// coordinates (0,0 = card's top-left corner).
const SCENE_W = CARD_W - 40; // leaves a 20px margin inside the card border
const SCENE_H = CARD_H - 70; // leaves room for the border and a label
const SCENE_OFFSET_X = 20;
const SCENE_OFFSET_Y = 20;

const TREE_LOCAL_X = SCENE_W / 2;
const TREE_LOCAL_Y = SCENE_H * 0.65;
const TREE_RADIUS = 26;
const NPC_DISTANCE_FROM_TREE = 100;
const NPC_EYE_Y_OFFSET = -18; // eye point is a bit above the NPC's feet

export function npcEyeLocal(side: Side): Point {
  const sign = side === "left" ? -1 : 1;
  return { x: TREE_LOCAL_X + sign * NPC_DISTANCE_FROM_TREE, y: TREE_LOCAL_Y + NPC_EYE_Y_OFFSET };
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
  const left = {
    visible: { x: TREE_LOCAL_X - 85, y: TREE_LOCAL_Y },
    hiddenA: { x: TREE_LOCAL_X + 40, y: TREE_LOCAL_Y }, // tucked right behind the trunk
    hiddenB: { x: TREE_LOCAL_X + 85, y: TREE_LOCAL_Y }, // mirrors "visible", opposite side
    hiddenC: { x: TREE_LOCAL_X + 135, y: TREE_LOCAL_Y }, // further past the tree
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
    // eslint-disable-next-line no-console
    console.warn("postcardScene: bag spot visibility assumptions do not hold", visibility);
  }

  return ordered;
}

/** Grid slot positions for 2 (side by side) or 4 (2x2) postcards. */
export function gridSlotPositions(numOptions: 2 | 4, gridX: number, gridY: number): Point[] {
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
 * Does not wire up the click handler - callers attach their own
 * "pointerdown" listener via makePostcardClickable(). */
export function buildPostcard(scene: Scene, position: Point, npcSide: Side, bagPosition: Point): Postcard {
  const container = scene.add.container(position.x, position.y);

  const cardBg = scene.add.rectangle(0, 0, CARD_W, CARD_H, 0xffffff).setOrigin(0, 0).setStrokeStyle(3, 0xcfd6e8);
  container.add(cardBg);

  const sceneBg = scene.add.rectangle(SCENE_OFFSET_X, SCENE_OFFSET_Y, SCENE_W, SCENE_H, 0x9fd8ff).setOrigin(0, 0);
  container.add(sceneBg);

  const localToCard = (p: Point) => ({ x: SCENE_OFFSET_X + p.x, y: SCENE_OFFSET_Y + p.y });

  // Tree
  const treePos = localToCard({ x: TREE_LOCAL_X, y: TREE_LOCAL_Y });
  const trunk = scene.add.rectangle(treePos.x, treePos.y + 10, 10, 46, 0x8a5a2a).setStrokeStyle(2, 0x5c3a1a);
  const canopy = scene.add.circle(treePos.x, treePos.y - 14, TREE_RADIUS, 0x4caf50).setStrokeStyle(3, 0x2e7d32);
  container.add([trunk, canopy]);

  // NPC
  const npcLocalFeet = {
    x: TREE_LOCAL_X + (npcSide === "left" ? -1 : 1) * NPC_DISTANCE_FROM_TREE,
    y: TREE_LOCAL_Y,
  };
  const npcPos = localToCard(npcLocalFeet);
  const npcBody = scene.add.rectangle(npcPos.x, npcPos.y - 16, 20, 40, 0x4fb6a8).setStrokeStyle(2, 0x2b2a6b);
  const npcHead = scene.add.circle(npcPos.x, npcPos.y - 44, 11, 0xffd9b3).setStrokeStyle(2, 0x2b2a6b);
  const eyeSign = npcSide === "left" ? 1 : -1;
  const npcEye = scene.add.circle(npcPos.x + eyeSign * 5, npcPos.y - 45, 2, 0x2b2a6b);
  container.add([npcBody, npcHead, npcEye]);

  // Bag
  const bagPos = localToCard(bagPosition);
  const bagBody = scene.add.rectangle(bagPos.x, bagPos.y, 20, 24, 0xffb84d).setStrokeStyle(2, 0x8a5a1a);
  const bagFlap = scene.add.rectangle(bagPos.x, bagPos.y - 14, 22, 8, 0xff9f40).setStrokeStyle(2, 0x8a5a1a);
  container.add([bagBody, bagFlap]);

  return { container, hitArea: cardBg };
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
export function makePostcardClickable(postcard: Postcard, onClick: () => void): void {
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
  sparkles: GameObjects.Particles.ParticleEmitter;
  /** Any ✗/✓ marks created by celebrate/commiserate get pushed here, so
   * the caller can destroy them all in one go at the start of the next
   * round (same lifecycle as `cards`). */
  marks: GameObjects.Text[];
  playSound: (fn: (ctx: AudioContext) => void) => void;
};

export function celebrateCard(ctx: FeedbackContext, card: GameObjects.Container): void {
  ctx.feedbackText.setText("🎉 Yes! Jerry can see the bag there!").setColor("#2e7d32");
  ctx.sparkles.emitParticleAt(card.x + CARD_W / 2, card.y + CARD_H / 2, 30);

  ctx.scene.tweens.add({ targets: card, scale: 1.05, duration: 180, yoyo: true, repeat: 1, ease: "Sine.easeOut" });

  ctx.playSound(playChime);
}

/**
 * A wrong guess shakes the card the child actually clicked AND (after a
 * short beat) reveals the correct card elsewhere on screen. Without a
 * clear marker, that reads as "I clicked here but something happened
 * over there" - a big ✗ on the clicked card and a big ✓ on the correct
 * one make the two distinct reactions unambiguous.
 */
export function commiserateCard(ctx: FeedbackContext, clickedCard: GameObjects.Container, correctCard: GameObjects.Container): void {
  ctx.feedbackText.setText("😅 Not quite - the ✓ shows where Jerry could see it!").setColor("#c0392b");

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
    ctx.scene.tweens.add({ targets: rightMark, alpha: 1, scale: { from: 0.4, to: 1 }, duration: 300, ease: "Back.easeOut" });

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
