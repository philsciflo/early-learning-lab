import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  REFERENCE_LINE_WIDTH,
  DRAWING_LINE_WIDTH,
} from "./constants.ts";
import { Point } from "./triangleScoring.ts";

/** A binary ink/background mask for a rasterized shape -
 * `ink[y * width + x]` is 1 where the shape's stroke covers that
 * pixel, 0 otherwise. A flat typed array + dimensions, rather than a
 * 2D array, so a future consumer (eg Hu-moment computation) can
 * iterate it directly without re-deriving canvas/row-major layout. */
export type InkMask = {
  width: number;
  height: number;
  ink: Uint8Array;
};

function newMaskCanvas(
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  // Black background / white stroke, full opacity - unlike the live
  // game's pale background + tinted stroke colours, this makes "is
  // this pixel ink" a trivial single-channel threshold below.
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx };
}

/** Strokes an arbitrary point set onto the canvas - an open polyline
 * (eg a drawn attempt) or, with `closed`, a closed shape (eg the
 * reference triangle) - generalizing over both rather than needing
 * separate stroke functions per shape kind. */
function strokeShape(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  lineWidth: number,
  closed: boolean,
): void {
  if (points.length < 2) {
    return;
  }
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  if (closed) {
    ctx.closePath();
  }
  ctx.stroke();
}

/** Reads a canvas's pixels back via `getImageData()` and thresholds
 * them into a binary `InkMask` - the shared tail end of both
 * `rasterizeMask()` (stroke-based) and `rasterizeFilledMask()`
 * (fill-based) below, so the two only differ in how they draw onto
 * the canvas, not in how they read it back. */
function maskFromCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): InkMask {
  const { data } = ctx.getImageData(0, 0, width, height);
  const ink = new Uint8Array(width * height);
  for (let i = 0; i < ink.length; i++) {
    // Red channel alone distinguishes pure white ink (255) from the
    // pure black background (0); antialiased edge pixels fall in
    // between and are thresholded at the midpoint.
    ink[i] = data[i * 4] >= 128 ? 1 : 0;
  }
  return { width, height, ink };
}

/** Rasterizes a point set to a binary ink mask: renders it onto an
 * offscreen black/white canvas, then reads the pixels back via
 * `getImageData()` and thresholds them into a `Uint8Array`. This is
 * the shared building block behind `rasterizeReferenceMask()` and
 * `rasterizeDrawingMask()` below - exported too, since a future
 * caller (eg moment computation over an arbitrary shape) may want it
 * directly rather than going through the triangle-specific
 * wrappers. */
export function rasterizeMask(
  points: Point[],
  lineWidth: number,
  closed: boolean,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT,
): InkMask {
  const { ctx } = newMaskCanvas(width, height);
  strokeShape(ctx, points, lineWidth, closed);
  return maskFromCanvas(ctx, width, height);
}

/** Fills (rather than strokes) the solid interior of a point set,
 * always closing the path back to its first point first - the
 * representation classical Hu-moment shape matching expects, since
 * outline-only ink (from `rasterizeMask()` above) has much noisier,
 * lower-pixel-count higher-order moments than a filled region does.
 * Canvas's default nonzero winding rule resolves self-intersecting
 * (eg messy hand-drawn) point sets deterministically, even if not
 * always "correctly" - acceptable here since filled-region moments
 * are inherently more tolerant of boundary noise than the outline
 * ones. Fewer than 3 points can't enclose any area, so they're left
 * as an all-background (degenerate) mask rather than drawing
 * anything. */
export function rasterizeFilledMask(
  points: Point[],
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT,
): InkMask {
  const { ctx } = newMaskCanvas(width, height);
  if (points.length >= 3) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();
  }
  return maskFromCanvas(ctx, width, height);
}

/** Rasterizes the static reference triangle alone, at the same
 * resolution/line-width as its live on-screen rendering - the
 * reference-side counterpart to `rasterizeDrawingMask()`. */
export function rasterizeReferenceMask(
  referenceVertices: [Point, Point, Point],
  lineWidth: number = REFERENCE_LINE_WIDTH,
): InkMask {
  return rasterizeMask(referenceVertices, lineWidth, true);
}

/** Rasterizes the player's drawn (open) polyline alone, at the same
 * resolution/line-width as its live on-screen rendering - the
 * drawing-side counterpart to `rasterizeReferenceMask()`. */
export function rasterizeDrawingMask(
  drawnPoints: Point[],
  lineWidth: number = DRAWING_LINE_WIDTH,
): InkMask {
  return rasterizeMask(drawnPoints, lineWidth, false);
}

/** Filled-interior counterpart to `rasterizeReferenceMask()`, for Hu-
 * moment comparison rather than the geometric (outline-based) scorer. */
export function rasterizeFilledReferenceMask(
  referenceVertices: [Point, Point, Point],
): InkMask {
  return rasterizeFilledMask(referenceVertices);
}

/** Filled-interior counterpart to `rasterizeDrawingMask()`, for Hu-
 * moment comparison rather than the geometric (outline-based) scorer. */
export function rasterizeFilledDrawingMask(drawnPoints: Point[]): InkMask {
  return rasterizeFilledMask(drawnPoints);
}

/** Renders an ink mask back out as a plain black-background/white-
 * shape PNG data URL - lets a human eyeball a mask directly, before
 * trusting any moment math built on top of it. */
export function maskToPngDataUrl(mask: InkMask): string {
  const canvas = document.createElement("canvas");
  canvas.width = mask.width;
  canvas.height = mask.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  const imageData = ctx.createImageData(mask.width, mask.height);
  for (let i = 0; i < mask.ink.length; i++) {
    const value = mask.ink[i] ? 255 : 0;
    imageData.data[i * 4] = value;
    imageData.data[i * 4 + 1] = value;
    imageData.data[i * 4 + 2] = value;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
