import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_BACKGROUND_COLOUR,
  REFERENCE_LINE_COLOUR,
  REFERENCE_LINE_WIDTH,
  DRAWING_LINE_COLOUR,
  DRAWING_LINE_WIDTH,
} from "./constants.ts";
import { Point } from "./triangleScoring.ts";

/** Phaser colour ints (eg 0xff6f3c) as CSS hex strings, for use with
 * CanvasRenderingContext2D's strokeStyle. */
function toCssColour(colour: number): string {
  return `#${colour.toString(16).padStart(6, "0")}`;
}

function newOffscreenCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  ctx.fillStyle = toCssColour(CANVAS_BACKGROUND_COLOUR);
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  return { canvas, ctx };
}

function strokePolyline(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  colour: number,
  lineWidth: number,
): void {
  if (points.length < 2) {
    return;
  }
  ctx.strokeStyle = toCssColour(colour);
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function strokeTriangle(
  ctx: CanvasRenderingContext2D,
  vertices: [Point, Point, Point],
  colour: number,
  lineWidth: number,
): void {
  strokePolyline(ctx, [...vertices, vertices[0]], colour, lineWidth);
}

/** Rasterizes the player's drawn polyline (canvas-local coordinates, as
 * captured by Level1's pointermove handler) onto an offscreen canvas
 * matching the live in-game drawing's size/colour/thickness, and returns
 * it as a PNG data URL - used to persist a snapshot of each trial's
 * attempt alongside its score (see scoring.ts's drawnImageDataUrl). */
export function renderDrawingToPngDataUrl(drawnPoints: Point[]): string {
  const { canvas, ctx } = newOffscreenCanvas();
  strokePolyline(ctx, drawnPoints, DRAWING_LINE_COLOUR, DRAWING_LINE_WIDTH);
  return canvas.toDataURL("image/png");
}

/** Composites the static reference triangle and the player's drawn
 * polyline onto a single offscreen canvas (both at the same
 * colour/thickness as their respective live canvases) and returns it as
 * a PNG data URL - used for Level1's "Download overlay" button. */
export function renderOverlayToPngDataUrl(
  drawnPoints: Point[],
  referenceVertices: [Point, Point, Point],
): string {
  const { canvas, ctx } = newOffscreenCanvas();
  strokeTriangle(
    ctx,
    referenceVertices,
    REFERENCE_LINE_COLOUR,
    REFERENCE_LINE_WIDTH,
  );
  strokePolyline(ctx, drawnPoints, DRAWING_LINE_COLOUR, DRAWING_LINE_WIDTH);
  return canvas.toDataURL("image/png");
}
