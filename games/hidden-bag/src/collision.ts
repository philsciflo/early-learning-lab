import { TREE_CENTER_X, TREE_CENTER_Y, TREE_COLLISION_RADIUS } from "./constants.ts";

/**
 * If (x, y) is inside the tree's solid collision circle, push it back
 * out to the nearest point on the circle's edge, along the same
 * direction from the tree's centre. Otherwise, return it unchanged.
 */
export function resolveTreeCollision(x: number, y: number): { x: number; y: number } {
  const dx = x - TREE_CENTER_X;
  const dy = y - TREE_CENTER_Y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance >= TREE_COLLISION_RADIUS) {
    return { x, y };
  }

  if (distance === 0) {
    // Directly on the tree's centre point - push straight up, arbitrarily.
    return { x: TREE_CENTER_X, y: TREE_CENTER_Y - TREE_COLLISION_RADIUS };
  }

  const scale = TREE_COLLISION_RADIUS / distance;
  return {
    x: TREE_CENTER_X + dx * scale,
    y: TREE_CENTER_Y + dy * scale,
  };
}
