export type Point = {
  x: number;
  y: number;
};

/**
 * Can `viewer` see `target`, given that `blocker` (the tree) sits
 * somewhere between them?
 *
 * The rule is deliberately simple, to match how a young child reasons
 * about it: if the target is on the opposite side of the blocker from
 * the viewer, the blocker is in the way and the viewer can't see it.
 * "Side" is decided by comparing the direction from the blocker to the
 * viewer against the direction from the blocker to the target - if
 * those two directions point more than 90 degrees apart, they're on
 * opposite sides.
 */
export function canSee(viewer: Point, target: Point, blocker: Point): boolean {
  const viewerDir = { x: viewer.x - blocker.x, y: viewer.y - blocker.y };
  const targetDir = { x: target.x - blocker.x, y: target.y - blocker.y };

  const dot = viewerDir.x * targetDir.x + viewerDir.y * targetDir.y;

  return dot > 0;
}
