import { Scene, GameObjects } from "phaser";

import { canSee } from "./lineOfSight.ts";
import { Side } from "./scoring.ts";

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
  // right. Picked to spread across different heights/distances so the
  // cards look visually distinct, not just left/right twins.
  const left = {
    visible: { x: TREE_LOCAL_X - 85, y: TREE_LOCAL_Y },
    hiddenA: { x: TREE_LOCAL_X + 85, y: TREE_LOCAL_Y },
    hiddenB: { x: TREE_LOCAL_X + 45, y: TREE_LOCAL_Y - 70 },
    hiddenC: { x: TREE_LOCAL_X + 55, y: TREE_LOCAL_Y + 45 },
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

/** Draws one postcard (tree + NPC + bag at `bagPosition`) as a single
 * interactive container at `position`. Does not wire up the click
 * handler - callers attach their own "pointerdown" listener. */
export function buildPostcard(scene: Scene, position: Point, npcSide: Side, bagPosition: Point): GameObjects.Container {
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

  container.setSize(CARD_W, CARD_H);

  return container;
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
