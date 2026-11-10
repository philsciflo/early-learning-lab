export type Point = { x: number; y: number };

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestDistance(point: Point, candidates: Point[]): number {
  let min = Infinity;
  for (const candidate of candidates) {
    const d = distance(point, candidate);
    if (d < min) {
      min = d;
    }
  }
  return min;
}

function pointOnSegment(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function boundingBoxDiagonal(points: Point[]): number {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return Math.hypot(width, height);
}

/** Evenly spreads `totalSamples` points across a triangle's three edges
 * (not its interior) - used as the dense reference set the player's
 * drawn polyline is compared against in scoreTriangleDrawing(). */
export function sampleTriangleEdgePoints(
  vertices: [Point, Point, Point],
  totalSamples: number,
): Point[] {
  const perEdge = Math.max(1, Math.round(totalSamples / 3));
  const edges: [Point, Point][] = [
    [vertices[0], vertices[1]],
    [vertices[1], vertices[2]],
    [vertices[2], vertices[0]],
  ];

  const points: Point[] = [];
  for (const [a, b] of edges) {
    for (let i = 0; i < perEdge; i++) {
      points.push(pointOnSegment(a, b, i / perEdge));
    }
  }
  return points;
}

export type TriangleScoreResult = {
  /** 0-100, rounded. Always 0 when `valid` is false. */
  score: number;
  /** False for a degenerate attempt (too few points, or a bounding box
   * far smaller than the reference triangle's - eg a single tap) - the
   * caller should prompt the player to try again rather than trust the
   * score. */
  valid: boolean;
  meanRefToDraw: number;
  meanDrawToRef: number;
};

export type TriangleScoreOptions = {
  /** Below this many points, the attempt is treated as incomplete
   * rather than scored - a lucky single dot could otherwise land close
   * to an edge and score deceptively high. */
  minDrawnPoints?: number;
  /** The drawn polyline's bounding-box diagonal must be at least this
   * fraction of the reference triangle's, or the attempt is treated as
   * incomplete (eg a tiny scribble in one corner). */
  minBoundingBoxRatio?: number;
};

/**
 * Symmetric nearest-neighbour (Chamfer-style) distance between a drawn
 * polyline and a dense sample of points along the reference triangle's
 * edges - deliberately pixel-free (no canvas/rendering involved) so it
 * can be unit-tested directly on point arrays.
 *
 * meanRefToDraw: for every reference edge-sample, distance to the
 * nearest drawn point - penalises parts of the triangle the player
 * never drew near.
 * meanDrawToRef: for every drawn point, distance to the nearest
 * reference edge-sample - penalises drawing that strays far from the
 * triangle.
 * The two are averaged, then normalised against half the canvas's
 * diagonal (an error that large is treated as a 0) and inverted so
 * perfect tracing scores 100.
 */
export function scoreTriangleDrawing(
  drawnPoints: Point[],
  referenceVertices: [Point, Point, Point],
  canvasWidth: number,
  canvasHeight: number,
  options: TriangleScoreOptions = {},
): TriangleScoreResult {
  const minDrawnPoints = options.minDrawnPoints ?? 10;
  const minBoundingBoxRatio = options.minBoundingBoxRatio ?? 0.3;

  if (drawnPoints.length < minDrawnPoints) {
    return {
      score: 0,
      valid: false,
      meanRefToDraw: Infinity,
      meanDrawToRef: Infinity,
    };
  }

  const referenceSamples = sampleTriangleEdgePoints(referenceVertices, 100);
  const referenceDiagonal = boundingBoxDiagonal(referenceSamples);
  const drawnDiagonal = boundingBoxDiagonal(drawnPoints);

  if (
    referenceDiagonal === 0 ||
    drawnDiagonal / referenceDiagonal < minBoundingBoxRatio
  ) {
    return {
      score: 0,
      valid: false,
      meanRefToDraw: Infinity,
      meanDrawToRef: Infinity,
    };
  }

  const meanRefToDraw =
    referenceSamples.reduce(
      (sum, p) => sum + nearestDistance(p, drawnPoints),
      0,
    ) / referenceSamples.length;
  const meanDrawToRef =
    drawnPoints.reduce(
      (sum, p) => sum + nearestDistance(p, referenceSamples),
      0,
    ) / drawnPoints.length;

  const avgError = (meanRefToDraw + meanDrawToRef) / 2;
  const canvasDiagonal = Math.hypot(canvasWidth, canvasHeight);
  const maxError = canvasDiagonal * 0.5;

  const rawScore = 100 * (1 - avgError / maxError);
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  return { score, valid: true, meanRefToDraw, meanDrawToRef };
}
