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
 */
export function resolveTreeCollision(x: number, y: number): { x: number; y: number } {
  let point: Point = { x, y };

  point = pushOutOfCircle(point, TREE_CENTER_X, TREE_CENTER_Y, TREE_COLLISION_RADIUS);

  const trunkLeft = TREE_CENTER_X - TREE_TRUNK_WIDTH / 2 - BAG_RADIUS;
  const trunkRight = TREE_CENTER_X + TREE_TRUNK_WIDTH / 2 + BAG_RADIUS;
  const trunkTop = TREE_FEET_Y - TREE_TRUNK_HEIGHT - BAG_RADIUS;
  const trunkBottom = TREE_FEET_Y + BAG_RADIUS;
  point = pushOutOfRect(point, trunkLeft, trunkRight, trunkTop, trunkBottom);

  // Resolving the trunk can, in rare cases right at the seam between the
  // two shapes, nudge the point back into the canopy circle. One more
  // pass settles it.
  point = pushOutOfCircle(point, TREE_CENTER_X, TREE_CENTER_Y, TREE_COLLISION_RADIUS);

  return point;
}
