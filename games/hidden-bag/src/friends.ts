import { Scene, GameObjects } from "phaser";

import { OUTLINE_COLOUR, SKIN_COLOUR } from "./constants.ts";

export type FriendId = 1 | 2 | 3 | 4;

export const ALL_FRIEND_IDS: FriendId[] = [1, 2, 3, 4];

export const FRIEND_NAMES: Record<FriendId, string> = {
  1: "Milo",
  2: "Hexa",
  3: "Dot",
  4: "Blocky",
};

/**
 * What every friend design hands back to the caller: the full set of
 * shapes to add to the NPC container (already in the shared "origin at
 * the feet" local coordinate space every level uses), which one of
 * those shapes is "the body" for the purple found-it colour swap (see
 * hiddenBagScene.ts's setNpcSeesBag), and that body's own normal
 * (non-excited) fill colour to revert to - each friend has a different
 * body colour, so this can't be a single shared constant.
 */
export type FriendBuild = {
  parts: GameObjects.GameObject[];
  body: GameObjects.Shape;
  bodyNormalColour: number;
};

/** Two googly eyes centred on `centerX`, `spread` apart, both pupils
 * offset the same direction (toward positive x - the "tree side" in
 * every friend's default right-facing pose) so they read as looking
 * the same way rather than cross-eyed or wall-eyed. Shared by every
 * friend design so the googly-eye look stays identical across all of
 * them. */
function googlyEyes(
  scene: Scene,
  centerX: number,
  y: number,
  spread: number,
): GameObjects.Shape[] {
  const mkEye = (ex: number) => {
    const white = scene.add
      .circle(ex, y, 9, 0xffffff)
      .setStrokeStyle(2, OUTLINE_COLOUR);
    const pupil = scene.add.circle(ex + 2.5, y + 1.5, 4, 0x1a1a2e);
    const shine = scene.add.circle(ex + 4.5, y - 1, 1.5, 0xffffff);
    return [white, pupil, shine];
  };
  return [...mkEye(centerX - spread), ...mkEye(centerX + spread)];
}

/** A simple multi-segment smile line (e.g. a shallow "v"), drawn with
 * Graphics rather than a Shape since a smile isn't a filled polygon. */
function smileLine(
  scene: Scene,
  points: { x: number; y: number }[],
): GameObjects.Graphics {
  const g = scene.add.graphics();
  g.lineStyle(3, OUTLINE_COLOUR, 1);
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    g.lineTo(points[i].x, points[i].y);
  }
  g.strokePath();
  return g;
}

/** A curved smile: the bottom arc of a circle (20deg-160deg sweeps
 * through 90deg/straight-down, which is the bottom of the circle). */
function smileArc(
  scene: Scene,
  cx: number,
  cy: number,
  r: number,
): GameObjects.Graphics {
  const g = scene.add.graphics();
  g.lineStyle(3, OUTLINE_COLOUR, 1);
  g.beginPath();
  g.arc(cx, cy, r, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
  g.strokePath();
  return g;
}

/** Friend 1 "Milo": a plain head and a diamond body. No hair, no arms -
 * the body is drawn first so the head renders on top of the diamond's
 * tip where they overlap, rather than leaving a gap at the point. */
function buildFriend1(scene: Scene): FriendBuild {
  const BODY_COLOUR = 0x4fb6a8;
  const body = scene.add
    .polygon(0, 0, [0, -140, 36, -75, 0, -10, -36, -75], BODY_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);
  const head = scene.add
    .circle(0, -128, 32, SKIN_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);
  const eyes = googlyEyes(scene, 15, -128, 10);

  return {
    parts: [body, head, ...eyes],
    body,
    bodyNormalColour: BODY_COLOUR,
  };
}

/** Friend 2 "Hexa": a hexagon head with pointed ear-tufts, sitting
 * directly on a rectangle body (no neck piece). */
function buildFriend2(scene: Scene): FriendBuild {
  const HEAD_COLOUR = 0x3f6fd1;
  const BODY_COLOUR = 0xe07a3e;
  const EAR_COLOUR = 0xd4c43a;
  const HX = 0;
  const HY = -95;
  const HR = 34;

  const hexPoints: number[] = [];
  for (let deg = -90; deg < 270; deg += 60) {
    const a = Phaser.Math.DegToRad(deg);
    hexPoints.push(HX + HR * Math.cos(a), HY + HR * Math.sin(a));
  }

  const earLeft = scene.add.triangle(
    0,
    0,
    -HR - 2,
    HY + 15,
    -HR - 18,
    HY - 25,
    -HR + 10,
    HY - 13,
    EAR_COLOUR,
  );
  const earRight = scene.add.triangle(
    0,
    0,
    HR + 2,
    HY + 15,
    HR + 18,
    HY - 25,
    HR - 10,
    HY - 13,
    EAR_COLOUR,
  );
  const head = scene.add
    .polygon(0, 0, hexPoints, HEAD_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);
  const eyes = googlyEyes(scene, 0, HY, 12);
  const mouth = smileLine(scene, [
    { x: -10, y: HY + 18 },
    { x: 0, y: HY + 24 },
    { x: 10, y: HY + 18 },
  ]);
  const body = scene.add
    .rectangle(0, -30, 46, 60, BODY_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);

  return {
    parts: [earLeft, earRight, head, ...eyes, mouth, body],
    body,
    bodyNormalColour: BODY_COLOUR,
  };
}

/** Friend 3 "Dot": a round head with a hair "visor", a curved smile,
 * and a small triangle (dress-like) body. No arms - the triangle has
 * no natural shoulders to attach them to. */
function buildFriend3(scene: Scene): FriendBuild {
  const HEAD_COLOUR = 0xe8d44d;
  const HAIR_COLOUR = 0x5a9b57;
  const BODY_COLOUR = 0xc77dd1;

  const head = scene.add
    .circle(0, -140, 30, HEAD_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);

  const hairVisor = scene.add.graphics();
  hairVisor.fillStyle(HAIR_COLOUR, 1);
  hairVisor.beginPath();
  hairVisor.slice(
    0,
    -155,
    30,
    Phaser.Math.DegToRad(180),
    Phaser.Math.DegToRad(360),
    false,
  );
  hairVisor.fillPath();

  const eyes = googlyEyes(scene, 0, -138, 11);
  const mouth = smileArc(scene, 0, -122, 10);
  const body = scene.add
    .triangle(0, 0, 0, -100, -36, -5, 36, -5, BODY_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);

  return {
    parts: [head, hairVisor, ...eyes, mouth, body],
    body,
    bodyNormalColour: BODY_COLOUR,
  };
}

/** Friend 4 "Blocky": a square head with a triangle hat sitting
 * directly on a rectangle body (no neck piece), plus simple arms. */
function buildFriend4(scene: Scene): FriendBuild {
  const HEAD_COLOUR = 0x3f6fd1;
  const BODY_COLOUR = 0xe07a3e;
  const HAT_COLOUR = 0xe8d44d;

  const hat = scene.add
    .triangle(0, 0, 0, -192, -26, -158, 26, -158, HAT_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);
  const head = scene.add
    .rectangle(0, -128, 60, 60, HEAD_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);
  const eyes = googlyEyes(scene, 0, -128, 13);
  const mouth = smileLine(scene, [
    { x: -9, y: -110 },
    { x: 9, y: -110 },
  ]);
  const body = scene.add
    .rectangle(0, -49, 56, 98, BODY_COLOUR)
    .setStrokeStyle(3, OUTLINE_COLOUR);

  // Same "pivot at the shoulder, rotate toward a direction" technique
  // as friend1/the tree's branches - see hiddenBagScene.ts for the
  // derivation of why origin(0,0.5) is used on both sides consistently.
  const ARM_LENGTH = 44;
  const ARM_WIDTH = 14;
  const SHOULDER_Y = -85;
  const SHOULDER_X = 18;
  const LEFT_ARM_ANGLE = Math.atan2(0.6, -1);
  const RIGHT_ARM_ANGLE = Math.atan2(0.6, 1);
  const leftArm = scene.add
    .rectangle(-SHOULDER_X, SHOULDER_Y, ARM_LENGTH, ARM_WIDTH, BODY_COLOUR)
    .setOrigin(0, 0.5)
    .setRotation(LEFT_ARM_ANGLE)
    .setStrokeStyle(3, OUTLINE_COLOUR);
  const rightArm = scene.add
    .rectangle(SHOULDER_X, SHOULDER_Y, ARM_LENGTH, ARM_WIDTH, BODY_COLOUR)
    .setOrigin(0, 0.5)
    .setRotation(RIGHT_ARM_ANGLE)
    .setStrokeStyle(3, OUTLINE_COLOUR);
  const leftHand = scene.add
    .circle(
      -SHOULDER_X + ARM_LENGTH * Math.cos(LEFT_ARM_ANGLE),
      SHOULDER_Y + ARM_LENGTH * Math.sin(LEFT_ARM_ANGLE),
      8,
      SKIN_COLOUR,
    )
    .setStrokeStyle(2, OUTLINE_COLOUR);
  const rightHand = scene.add
    .circle(
      SHOULDER_X + ARM_LENGTH * Math.cos(RIGHT_ARM_ANGLE),
      SHOULDER_Y + ARM_LENGTH * Math.sin(RIGHT_ARM_ANGLE),
      8,
      SKIN_COLOUR,
    )
    .setStrokeStyle(2, OUTLINE_COLOUR);

  return {
    parts: [
      hat,
      head,
      ...eyes,
      mouth,
      body,
      leftArm,
      leftHand,
      rightArm,
      rightHand,
    ],
    body,
    bodyNormalColour: BODY_COLOUR,
  };
}

const FRIEND_BUILDERS: Record<FriendId, (scene: Scene) => FriendBuild> = {
  1: buildFriend1,
  2: buildFriend2,
  3: buildFriend3,
  4: buildFriend4,
};

/** Builds the chosen friend's shapes, drawn facing right by default in
 * the same "origin at the feet" local coordinate space every NPC-using
 * scene already shares - callers add the returned `parts` to their own
 * container (or a sub-container, e.g. for a small select-screen card
 * or postcard thumbnail) and flip `scaleX` for a left-facing pose the
 * same way hiddenBagScene.ts's createNpc() already does. */
export function buildFriend(scene: Scene, friendId: FriendId): FriendBuild {
  return FRIEND_BUILDERS[friendId](scene);
}
