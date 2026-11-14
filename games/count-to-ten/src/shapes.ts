import { Scene, GameObjects } from "phaser";

/** The pool of countable object shapes. "and other shapes" in the
 * original spec is open-ended - three distinct, easy-to-tell-apart
 * primitives is a reasonable starting set; add to this array (and to
 * drawShape's switch below) to grow the pool later. */
export type ShapeType = "circle" | "triangle" | "square";

export const SHAPE_TYPES: readonly ShapeType[] = [
  "circle",
  "triangle",
  "square",
];

export function pickShapeType(): ShapeType {
  return SHAPE_TYPES[Phaser.Math.Between(0, SHAPE_TYPES.length - 1)];
}

export type ShapeDrawOptions = {
  /** Bounding box width/height, in pixels. */
  size: number;
  fillColour: number;
  strokeColour: number;
};

/**
 * Draws one countable object, centred at (x, y), as a Phaser Graphics
 * primitive sized to fit a `size` x `size` bounding box. This is the
 * single place that decides how a ShapeType is rendered - the spec
 * calls out that real PNG assets are coming later, so when they arrive,
 * swapping this function's body for `scene.add.image(x, y,
 * shapeType).setDisplaySize(size, size)` (one texture per ShapeType) is
 * the only change needed; every caller (Level1's object layout) just
 * asks for "a shapeType at (x, y) sized `size`" and doesn't know or
 * care how it's drawn.
 */
export function drawShape(
  scene: Scene,
  shapeType: ShapeType,
  x: number,
  y: number,
  options: ShapeDrawOptions,
): GameObjects.Graphics {
  const { size, fillColour, strokeColour } = options;
  const half = size / 2;

  const g = scene.add.graphics({ x, y });
  g.fillStyle(fillColour, 1);
  g.lineStyle(3, strokeColour, 1);

  switch (shapeType) {
    case "circle":
      g.fillCircle(0, 0, half);
      g.strokeCircle(0, 0, half);
      break;
    case "square":
      g.fillRect(-half, -half, size, size);
      g.strokeRect(-half, -half, size, size);
      break;
    case "triangle": {
      // Equilateral-ish triangle inscribed in the size x size bounding
      // box, point up, centred on (0, 0).
      const p1 = { x: 0, y: -half };
      const p2 = { x: half, y: half };
      const p3 = { x: -half, y: half };
      g.fillTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      g.strokeTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      break;
    }
  }

  return g;
}
