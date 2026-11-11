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

function crossProduct(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Convex hull via the monotone chain (Andrew's) algorithm - no external
 * library, kept self-contained like the rest of this file. Returns hull
 * vertices in counter-clockwise order, deduplicating collinear points.
 * Degenerate inputs (fewer than 3 distinct points, or all-collinear
 * points such as a straight line) return the points sorted but without
 * forming a 2D hull; polygonArea() below naturally yields 0 for those.
 */
export function convexHull(points: Point[]): Point[] {
  if (points.length < 3) {
    return points;
  }

  const sorted = [...points].sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x,
  );

  const lower: Point[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/** Shoelace formula. Works for any simple polygon; for the degenerate
 * (collinear or <3 vertex) hulls convexHull() can return, this
 * correctly yields 0. */
export function polygonArea(vertices: Point[]): number {
  if (vertices.length < 3) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * Ratio (0-1) between the drawn polyline's convex-hull area and the
 * reference triangle's area - whichever is smaller over whichever is
 * larger, so both "drawn way too big" and "drawn way too small" are
 * penalised the same way. A flat line, tight needle, or single-tap
 * scribble has ~zero hull area and collapses this to 0, which is what
 * catches shapes with no real enclosed area regardless of how closely
 * they happen to graze the reference edges.
 */
function hullAreaRatio(
  drawnPoints: Point[],
  referenceVertices: [Point, Point, Point],
): number {
  const hullArea = polygonArea(convexHull(drawnPoints));
  const refArea = polygonArea(referenceVertices);
  if (refArea === 0 || hullArea === 0) {
    return 0;
  }
  const ratio = Math.min(hullArea, refArea) / Math.max(hullArea, refArea);
  return Math.min(1, Math.max(0, ratio));
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    return distance(p, a);
  }
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  const projection = { x: a.x + t * dx, y: a.y + t * dy };
  return distance(p, projection);
}

/** Standard recursive Douglas-Peucker polyline simplification. Keeps
 * both endpoints and any point further than `epsilon` from the current
 * simplified segment, discarding the rest. */
function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) {
    return points;
  }

  const end = points.length - 1;
  let maxDistance = 0;
  let splitIndex = 0;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDistance) {
      maxDistance = d;
      splitIndex = i;
    }
  }

  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, splitIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(splitIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[end]];
}

/** Interior turning angle at `cur`, in degrees: 0 for dead-straight,
 * up to 180 for a full reversal. Used to tell a real corner apart from
 * a shallow bend left over after simplification. */
function turnAngleDegrees(prev: Point, cur: Point, next: Point): number {
  const v1 = { x: cur.x - prev.x, y: cur.y - prev.y };
  const v2 = { x: next.x - cur.x, y: next.y - cur.y };
  const len1 = Math.hypot(v1.x, v1.y);
  const len2 = Math.hypot(v2.x, v2.y);
  if (len1 === 0 || len2 === 0) {
    return 0;
  }
  const cosAngle = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2);
  const clamped = Math.min(1, Math.max(-1, cosAngle));
  return (Math.acos(clamped) * 180) / Math.PI;
}

/**
 * Simplifies the drawn polyline with Douglas-Peucker (epsilon scaled to
 * the drawing's own size, so this works the same whether the drawing is
 * large or small) and counts how many of the remaining interior
 * vertices turn sharply enough (> `angleThresholdDeg`) to count as a
 * real corner. A triangle trace simplifies to ~2-3 such corners
 * (3 vertices, minus whichever one the pen started/ended closest to);
 * a circle or smooth curve simplifies to shallow turns that don't clear
 * the angle threshold even after simplification; a spiral or zigzag
 * keeps many sharp turns no matter the epsilon.
 */
export function countCorners(
  points: Point[],
  epsilon: number,
  angleThresholdDeg = 55,
): number {
  const simplified = douglasPeucker(points, epsilon);
  let corners = 0;
  for (let i = 1; i < simplified.length - 1; i++) {
    const angle = turnAngleDegrees(
      simplified[i - 1],
      simplified[i],
      simplified[i + 1],
    );
    if (angle > angleThresholdDeg) {
      corners++;
    }
  }
  return corners;
}

/**
 * countCorners (above) only looks at the *angle* at each simplified
 * corner - it has no concept of whether the path between two corners is
 * actually straight. A hand-drawn circle's natural tremor can land 2-5
 * Douglas-Peucker corners that individually clear the angle threshold,
 * even though every "edge" between them is a smooth arc rather than a
 * straight line - exactly the false positive this catches.
 *
 * For each pair of consecutive simplified corners, finds the original
 * (pre-simplification) points that fall between them and measures the
 * furthest any of them strays perpendicular to the straight chord
 * joining the two corners, normalised by that chord's own length. A
 * real (even wobbly) triangle side stays close to its chord; an arc
 * traced between two coincidental "corners" on a circle bulges much
 * further away. Returns the worst (highest) ratio across all spans, or
 * 0 if there are fewer than two simplified corners to form a span.
 */
export function maxEdgeBulgeRatio(points: Point[], epsilon: number): number {
  const simplified = douglasPeucker(points, epsilon);
  if (simplified.length < 2) {
    return 0;
  }

  let maxRatio = 0;
  let searchStart = 0;
  for (let i = 0; i < simplified.length - 1; i++) {
    const a = simplified[i];
    const b = simplified[i + 1];
    const startIdx = points.indexOf(a, searchStart);
    const endIdx = points.indexOf(b, Math.max(startIdx, 0));
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx + 1) {
      searchStart = Math.max(startIdx, searchStart);
      continue;
    }

    const chordLength = distance(a, b);
    if (chordLength === 0) {
      continue;
    }

    let maxDeviation = 0;
    for (let j = startIdx + 1; j < endIdx; j++) {
      const d = perpendicularDistance(points[j], a, b);
      if (d > maxDeviation) {
        maxDeviation = d;
      }
    }

    maxRatio = Math.max(maxRatio, maxDeviation / chordLength);
    searchStart = endIdx;
  }
  return maxRatio;
}

/** Lower bound (inclusive) of the `shapeMatch: true` accuracyScore
 * band. Everything below this is reserved exclusively for
 * `shapeMatch: false` results - see `bandAccuracyScore` below for why
 * this is a hard guarantee rather than a usual-case heuristic. */
const MATCH_BAND_FLOOR = 50;
/** Upper bound (inclusive) of the `shapeMatch: false` accuracyScore
 * band - one point below `MATCH_BAND_FLOOR` so the two bands never
 * touch even after rounding. */
const MISMATCH_BAND_CEILING = MATCH_BAND_FLOOR - 1;

/**
 * Rescales the continuous raw 0-100 score (already clamped to that
 * range by the caller) into one of two disjoint output bands depending
 * on `shapeMatch`, so that *every* match outscores *every* mismatch
 * regardless of how the underlying geometry happens to land:
 *   - shapeMatch true  -> linearly mapped into [MATCH_BAND_FLOOR, 100]
 *   - shapeMatch false -> linearly mapped into [0, MISMATCH_BAND_CEILING]
 * Both mappings are monotonic in the raw score, so relative ordering
 * (and therefore the "wide spread" the raw score already has within
 * each case) survives the rescale untouched - only the absolute numbers
 * move. Because the raw input is pre-clamped to [0, 100], the match
 * band's minimum (raw = 0 -> MATCH_BAND_FLOOR) and the mismatch band's
 * maximum (raw = 100 -> MISMATCH_BAND_CEILING) are fixed endpoints, not
 * empirical ones - the ordering guarantee holds structurally for any
 * input, not just the cases this file happens to test.
 */
function bandAccuracyScore(rawClamped: number, shapeMatch: boolean): number {
  if (shapeMatch) {
    const scaled =
      MATCH_BAND_FLOOR + (rawClamped / 100) * (100 - MATCH_BAND_FLOOR);
    return Math.round(Math.min(100, Math.max(MATCH_BAND_FLOOR, scaled)));
  }
  const scaled = (rawClamped / 100) * MISMATCH_BAND_CEILING;
  return Math.round(Math.min(MISMATCH_BAND_CEILING, Math.max(0, scaled)));
}

export type TriangleScoreResult = {
  /** Layer 1 - categorical "is this even triangle-shaped?" check: true
   * when the drawn polyline's bounding box, convex-hull area overlap,
   * and simplified corner count all land in triangle-like ranges. */
  shapeMatch: boolean;
  /** Layer 2 - continuous 0-100 accuracy number, banded by `shapeMatch`
   * so that every match (`shapeMatch: true`) outscores every mismatch:
   * matches land in [50, 100], mismatches land in [0, 49]. Within each
   * band the relative ordering (and spread) of the underlying raw
   * distance+area score is preserved - see `rawAccuracyScore` for the
   * unbanded value this is derived from. Only `null` when there weren't
   * enough drawn points to compute anything at all (see
   * `minDrawnPoints`). */
  accuracyScore: number | null;
  /** The continuous 0-100 trace-distance + area-overlap score *before*
   * the `shapeMatch` band is applied - kept around purely so research/
   * data-analysis on recorded trials doesn't lose the underlying
   * geometric signal that banding deliberately discards for the
   * on-screen/primary `accuracyScore`. Not shown to the player. Null
   * alongside `accuracyScore` when nothing could be computed. */
  rawAccuracyScore: number | null;
  /** Null alongside `accuracyScore` when nothing could be computed. */
  meanRefToDraw: number | null;
  /** Null alongside `accuracyScore` when nothing could be computed. */
  meanDrawToRef: number | null;
  /** Convex-hull-area / reference-area overlap ratio, 0-1. */
  areaRatio: number;
  /** Count of sharp direction changes in the simplified drawn path. */
  cornerCount: number;
  /** Worst (highest) edge-straightness bulge ratio across all spans
   * between consecutive simplified corners - see `maxEdgeBulgeRatio`. */
  edgeBulgeRatio: number;
};

export type TriangleScoreOptions = {
  /** Below this many points, nothing can be computed at all - a lucky
   * single dot could otherwise land close to an edge and score
   * deceptively high. */
  minDrawnPoints?: number;
  /** Below this fraction of the reference triangle's bounding-box
   * diagonal, the drawn polyline is too small to count as a shape
   * match (eg a tiny scribble in one corner) - it still gets a real
   * `rawAccuracyScore`/banded `accuracyScore`, just with
   * `shapeMatch: false`. */
  minBoundingBoxRatio?: number;
  /** Below this convex-hull/reference area ratio, the attempt is not a
   * shape match - this is what catches a flat line, needle, or
   * near-zero-area scribble that happens to graze the reference edges
   * closely enough to otherwise look plausible. 0.18 sits well below
   * the ~0.5+ ratio a real (even sloppy) triangle hull has against the
   * reference, but comfortably above the ~0 a line or needle
   * produces. */
  minAreaRatio?: number;
  /** Corner counts at or below this are not a shape match (eg a
   * circle/ellipse that never turns sharply, or a near-straight
   * line). */
  minValidCorners?: number;
  /** Corner counts above this are not a shape match (eg a spiral or
   * zigzag scribble with many sharp turns, or a many-sided soft
   * blob/polygon - hand-drawn triangles simplify to ~2-5 corners even
   * with hand-tremor double-corners at a vertex, so 6+ is a reliable
   * signal the shape has meaningfully more than 3 real sides and
   * should be rejected outright rather than merely penalised). */
  maxValidCorners?: number;
  /** The "ideal" inclusive corner-count range for a triangle trace;
   * shape-matching attempts outside this range (but within
   * min/maxValidCorners) get an accuracy penalty rather than losing
   * the shape match. */
  idealCornerRange?: [number, number];
  /** Above this edge-straightness bulge ratio (see `maxEdgeBulgeRatio`),
   * the path between two "corners" is curved rather than straight and
   * the attempt is not a shape match - this is what catches a circle
   * whose hand-tremor wobble coincidentally produces 2-5 Douglas-Peucker
   * corners that individually pass the angle/count checks above, even
   * though every "edge" between them is an arc. A real triangle side,
   * even hand-wobbly, bulges well under this; an arc between two
   * picked points on a circle bulges substantially more. */
  maxEdgeBulgeRatio?: number;
};

/**
 * Symmetric nearest-neighbour (Chamfer-style) distance between a drawn
 * polyline and a dense sample of points along the reference triangle's
 * edges, combined with two structural checks - convex-hull area overlap
 * and corner-count/complexity - into two results: a categorical
 * `shapeMatch` ("is this even triangle-shaped?") and a continuous,
 * `shapeMatch`-banded `accuracyScore` (0-100, "how close is the
 * outline?", but never allowed to let a mismatch outscore a match - see
 * `bandAccuracyScore`). Deliberately pixel-free (no canvas/rendering
 * involved) so it can be unit-tested directly on point arrays.
 *
 * meanRefToDraw: for every reference edge-sample, distance to the
 * nearest drawn point - penalises parts of the triangle the player
 * never drew near.
 * meanDrawToRef: for every drawn point, distance to the nearest
 * reference edge-sample - penalises drawing that strays far from the
 * triangle.
 * The two are averaged, then normalised against a quarter of the
 * canvas's diagonal (an error that large is treated as a 0) and
 * inverted so perfect tracing scores 100 - this "trace score" is then
 * blended with the area-overlap ratio (see areaRatio in
 * TriangleScoreOptions) so a shape with the right outline proximity but
 * little enclosed area still scores low rather than high. The result is
 * `rawAccuracyScore`, which is then banded by `shapeMatch` into the
 * final `accuracyScore`.
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
  const minAreaRatio = options.minAreaRatio ?? 0.18;
  const minValidCorners = options.minValidCorners ?? 2;
  const maxValidCorners = options.maxValidCorners ?? 5;
  const idealCornerRange = options.idealCornerRange ?? [2, 5];
  const maxEdgeBulgeRatioOption = options.maxEdgeBulgeRatio ?? 0.18;

  const uncomputableResult = (): TriangleScoreResult => ({
    shapeMatch: false,
    accuracyScore: null,
    rawAccuracyScore: null,
    meanRefToDraw: null,
    meanDrawToRef: null,
    areaRatio: 0,
    cornerCount: 0,
    edgeBulgeRatio: 0,
  });

  if (drawnPoints.length < minDrawnPoints) {
    return uncomputableResult();
  }

  const referenceSamples = sampleTriangleEdgePoints(referenceVertices, 300);
  const referenceDiagonal = boundingBoxDiagonal(referenceSamples);
  const drawnDiagonal = boundingBoxDiagonal(drawnPoints);

  if (referenceDiagonal === 0) {
    return uncomputableResult();
  }

  const areaRatio = hullAreaRatio(drawnPoints, referenceVertices);

  // Epsilon scales with the drawing's own size so corner detection works
  // the same regardless of how large or small the attempt is drawn.
  const cornerEpsilon = drawnDiagonal * 0.1;
  const cornerCount = countCorners(drawnPoints, cornerEpsilon);
  const edgeBulgeRatio = maxEdgeBulgeRatio(drawnPoints, cornerEpsilon);

  const shapeMatch =
    drawnDiagonal / referenceDiagonal >= minBoundingBoxRatio &&
    areaRatio >= minAreaRatio &&
    cornerCount >= minValidCorners &&
    cornerCount <= maxValidCorners &&
    edgeBulgeRatio <= maxEdgeBulgeRatioOption;

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
  const maxError = canvasDiagonal * 0.25;

  const traceScore = 100 * (1 - avgError / maxError);

  // Blend in area overlap: a perfectly-traced outline with little
  // enclosed area (areaRatio near 0) is cut to half credit; full area
  // overlap (areaRatio = 1) leaves the trace score untouched.
  const areaBlendedScore = traceScore * (0.5 + 0.5 * areaRatio);

  // Corner counts outside the "ideal" triangle range (but still inside
  // the shape-match min/max) get a mild penalty - this is what pulls
  // down a trace whose complexity doesn't quite read as a triangle
  // without affecting the shape match itself.
  const [idealMin, idealMax] = idealCornerRange;
  const cornerPenalty =
    cornerCount < idealMin || cornerCount > idealMax ? 0.85 : 1;

  const rawScore = areaBlendedScore * cornerPenalty;
  const rawClamped = Math.min(100, Math.max(0, rawScore));
  const rawAccuracyScore = Math.round(rawClamped);
  const accuracyScore = bandAccuracyScore(rawClamped, shapeMatch);

  return {
    shapeMatch,
    accuracyScore,
    rawAccuracyScore,
    meanRefToDraw,
    meanDrawToRef,
    areaRatio,
    cornerCount,
    edgeBulgeRatio,
  };
}
