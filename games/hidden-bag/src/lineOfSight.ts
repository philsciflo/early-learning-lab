export interface Point {
  x: number;
  y: number;
}

export interface Circle extends Point {
  radius: number;
}

/**
 * Shortest distance from a point to a line segment (p1 -> p2).
 */
function distancePointToSegment(point: Point, p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // p1 and p2 are the same point.
    return Phaser.Math.Distance.Between(point.x, point.y, p1.x, p1.y);
  }

  // Project `point` onto the segment, clamped to [0, 1].
  let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSquared;
  t = Phaser.Math.Clamp(t, 0, 1);

  const closestX = p1.x + t * dx;
  const closestY = p1.y + t * dy;

  return Phaser.Math.Distance.Between(point.x, point.y, closestX, closestY);
}

/**
 * Can `viewer` see `target`, given that `occluder` is a solid circle that
 * blocks sight? Returns true when the straight line between viewer and
 * target does NOT pass through the occluder.
 */
export function canSee(viewer: Point, target: Point, occluder: Circle): boolean {
  const distance = distancePointToSegment(occluder, viewer, target);
  return distance >= occluder.radius;
}
