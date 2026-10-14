import {
  TREE_CENTER_X,
  TREE_CENTER_Y,
  TREE_COLLISION_RADIUS,
  TREE_FEET_Y,
  TREE_TRUNK_HEIGHT,
  TREE_TRUNK_WIDTH,
  BAG_RADIUS,
} from "./constants.ts";

interface Point {
  x: number;
  y: number;
}

const TRUNK_LEFT = TREE_CENTER_X - TREE_TRUNK_WIDTH / 2 - BAG_RADIUS;
const TRUNK_RIGHT = TREE_CENTER_X + TREE_TRUNK_WIDTH / 2 + BAG_RADIUS;
const TRUNK_TOP = TREE_FEET_Y - TREE_TRUNK_HEIGHT - BAG_RADIUS;
const TRUNK_BOTTOM = TREE_FEET_Y + BAG_RADIUS;

function pushOutOfCircle(point: Point, cx: number, cy: number, radius: number): Point {
  const dx = point.x - cx;
  const dy = point.y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance >= radius) {
    return point;
  }

  if (distance === 0) {
    // Sitting exactly on the centre point - push straight up, arbitrarily.
    return { x: cx, y: cy - radius };
  }

  const scale = radius / distance;
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function pushOutOfRect(point: Point, left: number, right: number, top: number, bottom: number): Point {
  if (point.x <= left || point.x >= right || point.y <= top || point.y >= bottom) {
    return point;
  }

  const distLeft = point.x - left;
  const distRight = right - point.x;
  const distTop = point.y - top;
  const distBottom = bottom - point.y;
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);

  if (minDist === distLeft) return { x: left, y: point.y };
  if (minDist === distRight) return { x: right, y: point.y };
  if (minDist === distTop) return { x: point.x, y: top };
  return { x: point.x, y: bottom };
}

/**
 * The tree is solid. If (x, y) would land inside the canopy circle or
 * the trunk rectangle (each padded out by the bag's own radius, so the
 * bag's edge - not just its centre point - stays clear of the tree),
 * push it back out to the nearest free spot.
 *
 * This alone is NOT enough to stop fast drags from tunnelling through
 * the tree - see `segmentHitsTree` below, which must be checked first.
 */
export function resolveTreeCollision(x: number, y: number): Point {
  let point: Point = { x, y };

  point = pushOutOfCircle(point, TREE_CENTER_X, TREE_CENTER_Y, TREE_COLLISION_RADIUS);
  point = pushOutOfRect(point, TRUNK_LEFT, TRUNK_RIGHT, TRUNK_TOP, TRUNK_BOTTOM);
  // Resolving the trunk can, in rare cases right at the seam between the
  // two shapes, nudge the point back into the canopy circle. One more
  // pass settles it.
  point = pushOutOfCircle(point, TREE_CENTER_X, TREE_CENTER_Y, TREE_COLLISION_RADIUS);

  return point;
}

/**
 * A fast drag can jump from one frame's position straight past the
 * tree to the next, without either point ever landing inside it -
 * `resolveTreeCollision` alone can't catch that. This checks the whole
 * travelled path (the line from the bag's last position to its new,
 * proposed one) against both solid shapes, so a fast move can be
 * rejected before it ever tunnels through.
 */
export function segmentHitsTree(x1: number, y1: number, x2: number, y2: number): boolean {
  const line = new Phaser.Geom.Line(x1, y1, x2, y2);

  const canopy = new Phaser.Geom.Circle(TREE_CENTER_X, TREE_CENTER_Y, TREE_COLLISION_RADIUS);
  if (Phaser.Geom.Intersects.LineToCircle(line, canopy)) {
    return true;
  }

  const trunk = new Phaser.Geom.Rectangle(TRUNK_LEFT, TRUNK_TOP, TRUNK_RIGHT - TRUNK_LEFT, TRUNK_BOTTOM - TRUNK_TOP);
  return Phaser.Geom.Intersects.LineToRectangle(line, trunk);
}
