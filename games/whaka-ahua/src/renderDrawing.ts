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
import { rasterizeReferenceMask, rasterizeDrawingMask } from "./rasterMask.ts";
import {
  computeHuMoments,
  computeMatchShapes,
  HuMomentsResult,
} from "./huMoments.ts";

/** Phaser colour ints (eg 0xff6f3c) as CSS hex strings, for use with
 * CanvasRenderingContext2D's strokeStyle. */
function toCssColour(colour: number): string {
  return `#${colour.toString(16).padStart(6, "0")}`;
}

/** extraHeight grows the canvas below the usual CANVAS_WIDTH x
 * CANVAS_HEIGHT square (background-filled the same as the rest) - used
 * by renderOverlayToPngDataUrl() to add a text footer without
 * overlapping the shapes drawn into the square above it. */
function newOffscreenCanvas(extraHeight = 0): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT + extraHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }
  ctx.fillStyle = toCssColour(CANVAS_BACKGROUND_COLOUR);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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

// Height of the text footer appended below the shapes, and the text
// style drawn into it - sized to comfortably fit one line of the
// matchShapes numbers without crowding the canvas above it.
const MATCH_SHAPES_FOOTER_HEIGHT = 48;
const MATCH_SHAPES_FOOTER_BACKGROUND_COLOUR = "#f4f4f8";
const MATCH_SHAPES_TEXT_COLOUR = "#1a1a2e";
const MATCH_SHAPES_FONT = "16px sans-serif";

/** Formats matchShapes()'s I1/I2/I3 distances (or an explanatory
 * fallback if either mask was degenerate) as the single line of text
 * drawn into the overlay's footer. */
function formatMatchShapesLabel(
  referenceHu: HuMomentsResult | null,
  drawnHu: HuMomentsResult | null,
): string {
  if (!referenceHu || !drawnHu) {
    return "matchShapes: n/a (reference or drawing mask is empty)";
  }
  const { i1, i2, i3 } = computeMatchShapes(
    referenceHu.huMoments,
    drawnHu.huMoments,
  );
  return `matchShapes  I1 ${i1.toFixed(3)}   I2 ${i2.toFixed(3)}   I3 ${i3.toFixed(3)}`;
}

/** Draws the matchShapes footer (background strip + text) into the
 * extra space newOffscreenCanvas(MATCH_SHAPES_FOOTER_HEIGHT) added
 * below the shapes square, at y >= footerTopY. */
function drawMatchShapesFooter(
  ctx: CanvasRenderingContext2D,
  footerTopY: number,
  referenceHu: HuMomentsResult | null,
  drawnHu: HuMomentsResult | null,
): void {
  ctx.fillStyle = MATCH_SHAPES_FOOTER_BACKGROUND_COLOUR;
  ctx.fillRect(0, footerTopY, CANVAS_WIDTH, MATCH_SHAPES_FOOTER_HEIGHT);

  ctx.fillStyle = MATCH_SHAPES_TEXT_COLOUR;
  ctx.font = MATCH_SHAPES_FONT;
  ctx.textBaseline = "middle";
  ctx.fillText(
    formatMatchShapesLabel(referenceHu, drawnHu),
    12,
    footerTopY + MATCH_SHAPES_FOOTER_HEIGHT / 2,
  );
}

/** Composites the static reference triangle and the player's drawn
 * polyline onto a single offscreen canvas (both at the same
 * colour/thickness as their respective live canvases), burns the
 * matchShapes() comparison numbers (rasterizeReferenceMask()/
 * rasterizeDrawingMask() + computeHuMoments() + computeMatchShapes(),
 * same pipeline as Level1's "Download Hu moments (debug)" button) into
 * a text footer below the shapes, and returns the result as a PNG data
 * URL - used for Level1's "Download overlay" button. */
export function renderOverlayToPngDataUrl(
  drawnPoints: Point[],
  referenceVertices: [Point, Point, Point],
): string {
  const { canvas, ctx } = newOffscreenCanvas(MATCH_SHAPES_FOOTER_HEIGHT);
  strokeTriangle(
    ctx,
    referenceVertices,
    REFERENCE_LINE_COLOUR,
    REFERENCE_LINE_WIDTH,
  );
  strokePolyline(ctx, drawnPoints, DRAWING_LINE_COLOUR, DRAWING_LINE_WIDTH);

  const referenceHu = computeHuMoments(
    rasterizeReferenceMask(referenceVertices),
  );
  const drawnHu = computeHuMoments(rasterizeDrawingMask(drawnPoints));
  drawMatchShapesFooter(ctx, CANVAS_HEIGHT, referenceHu, drawnHu);

  return canvas.toDataURL("image/png");
}
