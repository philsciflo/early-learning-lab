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
  /** Half the tree's trunk-base width (not canopy - see
   * computeCardLayout()'s comment on why only the trunk matters for
   * ground-level clearance). Used by buildBagSpots() to place the
   * "hidden, tucked behind the trunk" spot convincingly close to it. */
  trunkHalfW: number;
  /** Where the "visible" bag spot sits - just past the trunk, clearly
   * in the open rather than hugging it. */
  clearOfTrunkX: number;
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

  // Centred on the CARD itself, not just the (slightly off-centre, per
  // the frame's own measured margins) scene window - sceneOffsetX is
  // subtracted back out so the tree always lands at the card's true
  // horizontal centre regardless of the frame's asymmetric border.
  const treeLocalX = cardW / 2 - sceneOffsetX;
  // 0.85, not dead-centre: the tree/NPC/bag share this as their ground
  // line, and the tree's own canopy already extends well above it, so
  // a lower baseline uses the window's height properly - at 0.62 the
  // whole cluster sat cramped near the top with ~38% empty white space
  // below (no horizon/grass means nothing fills that gap, unlike the
  // main level which has a ground band).
  const treeLocalY = sceneH * 0.85;

  // tree_01.png/bag_01.png reused directly (not simple drawn shapes) so
  // the postcard matches the same art used everywhere else in the
  // game. Sized generously - 30% larger than a "fits naturally at a
  // glance" baseline (tree ~50% of the scene height, bag ~16%) - so
  // they read clearly rather than as a blurry thumbnail.
  const treeDisplayH = Math.round(sceneH * 0.5 * 1.3);
  const treeDisplayW = Math.round(treeDisplayH * (1262 / 1238));
  const bagDisplayH = Math.round(sceneH * 0.16 * 1.3);
  const bagDisplayW = Math.round(bagDisplayH * (1184 / 1048));
  // Proportional to sceneH (targets ~25% of the scene's height), same
  // as the tree/bag above - a fixed scale here would make the NPC
  // relatively bigger (and margins tighter) on Level4's smaller cards
  // than on Level3's larger ones, for no good reason.
  const npcScale = (sceneH * 0.25) / 185;

  // How far the NPC stands from the tree - and where the bag spots
  // land (see buildBagSpots) - is derived from the actual drawn sizes
  // above, not a fixed fraction of sceneW. That matters because the
  // bag sits at the SAME ground line as the tree's trunk base, where
  // only the (much narrower) trunk is present - the wide canopy sits
  // well above this line and never actually touches it (measured on
  // tree_01.png: canopy's lowest leaf is well clear of the trunk base,
  // so a bag at ground level only needs to clear the trunk, not the
  // full canopy width). trunkHalfW below is that measured trunk-base
  // width as a fraction of the tree's own display width.
  const trunkHalfW = treeDisplayW * 0.18;
  const bagHalfW = bagDisplayW / 2;
  // Widest friend design (Blocky, arms included) is roughly 130px wide
  // at native scale - used as a safe clearance estimate regardless of
  // which friend is actually selected.
  const npcApproxHalfW = (130 * npcScale) / 2;
  const gap = sceneW * 0.05;

  // Clearly past the trunk (open ground, not hugging it) - this is
  // also where the "visible" bag spot sits (see buildBagSpots).
  const clearOfTrunkX = trunkHalfW + gap;
  // NPC stands clear of that visible spot too, so the two never
  // overlap regardless of which friend is drawn.
  const npcDistanceFromTree = clearOfTrunkX + bagHalfW + gap + npcApproxHalfW;

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
    npcScale,
    trunkHalfW,
    clearOfTrunkX,
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
 * distractors, each drawn from a different band of distance-from-trunk
 * AND height (per Florian's marked-up screenshot: the "wrong" cards'
 * bag can sit anywhere in a tall zone to the hidden side, not just at
 * ground level), so they look genuinely different from each other and
 * from round to round. Mirrored automatically for whichever side the
 * NPC is standing on. Callers that only need 2 options just use the
 * first two entries. Every hidden draw is verified against canSee()
 * (re-rolling if a particular draw isn't actually hidden) rather than
 * trusted from the ranges alone - height and distance-from-trunk
 * interact in the dot-product check in ways not obvious from the
 * ranges by eye. */
export function buildBagSpots(npcSide: Side, layout: CardLayout): Point[] {
  const npcEye = npcEyeLocal(npcSide, layout);
  const {
    treeLocalX,
    treeLocalY,
    npcDistanceFromTree,
    trunkHalfW,
    clearOfTrunkX,
    treeDisplayH,
  } = layout;
  const treeCenter = { x: treeLocalX, y: treeLocalY };

  const jitter = (min: number, max: number) => min + Math.random() * (max - min);

  // The `left` block below is authored as if the NPC stands on the
  // left (then mirrored for real further down) - so draws must be
  // validated against the LEFT-side eye position, not whichever side
  // the NPC actually ends up on this round. Mirroring a viewer and a
  // target through the same point (the tree) preserves canSee()'s
  // dot-product sign, so a point validated hidden here stays hidden
  // after mirroring to the real side.
  const npcEyeForAuthoring = npcEyeLocal("left", layout);

  // Draws a random point on the hidden side (xMin/xMax are a distance-
  // from-trunk magnitude; yMin/yMax are how far to raise it above the
  // shared ground line, toward the canopy), re-rolling until canSee()
  // actually agrees it's hidden. Falls back to the innermost, ground-
  // level corner of the range (the one combination simple left/right
  // separation always gets right) if every attempt fails.
  const drawHiddenSpot = (
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
  ): Point => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const point = {
        x: treeLocalX + jitter(xMin, xMax),
        y: treeLocalY - jitter(yMin, yMax),
      };
      if (!canSee(npcEyeForAuthoring, point, treeCenter)) {
        return point;
      }
    }
    return { x: treeLocalX + xMin, y: treeLocalY };
  };

  // Authored for "npc on the left" (so "visible"/hidden sides below are
  // the opposite of what they'd be for npc-on-right), mirrored after.
  //
  // "visible" stays close to its old spot - just clear of the trunk, in
  // open ground, well before the NPC (see computeCardLayout()'s
  // derivation of clearOfTrunkX/npcDistanceFromTree) - that gap is what
  // makes it read as unambiguously "in the open" rather than "bag next
  // to the tree" once the tree became a large real image instead of a
  // small drawn circle.
  const left = {
    visible: {
      x: treeLocalX - jitter(clearOfTrunkX * 0.85, clearOfTrunkX * 1.25),
      y: treeLocalY,
    },
    // Far past the trunk, mostly ground-level (small height variety) -
    // unambiguously hidden on its own, so this is the one Level3 shows
    // (buildBagSpots(...).slice(0, 2) only ever takes index 1).
    hiddenFar: drawHiddenSpot(
      npcDistanceFromTree * 0.9,
      npcDistanceFromTree * 1.3,
      0,
      treeDisplayH * 0.15,
    ),
    // Mid-distance, moderate height range.
    hiddenMid: drawHiddenSpot(
      clearOfTrunkX * 0.9,
      npcDistanceFromTree * 0.8,
      0,
      treeDisplayH * 0.5,
    ),
    // Close to the trunk, but can rise well up toward the canopy -
    // the trickiest-looking of the three, a legitimate distractor
    // among Level4's 4 simultaneous choices.
    hiddenNear: drawHiddenSpot(
      trunkHalfW * 0.3,
      clearOfTrunkX * 0.9,
      0,
      treeDisplayH * 0.75,
    ),
  };

  const mirror = (p: Point): Point => ({ x: 2 * treeLocalX - p.x, y: p.y });
  const spots =
    npcSide === "left"
      ? left
      : {
          visible: mirror(left.visible),
          hiddenFar: mirror(left.hiddenFar),
          hiddenMid: mirror(left.hiddenMid),
          hiddenNear: mirror(left.hiddenNear),
        };

  // hiddenFar comes right after visible, same reasoning as before: it's
  // the unambiguous one, so it's what Level3's single hidden slot gets.
  // Level4 still gets all four (shuffled, so array order doesn't matter
  // there) via the full array.
  const ordered = [spots.visible, spots.hiddenFar, spots.hiddenNear, spots.hiddenMid];

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
