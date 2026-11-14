import { Scene, GameObjects, Game } from "phaser";

/** Triggers a real browser file download for arbitrary text content
 * (JSON, CSV, ...) via a throwaway Blob + anchor element - shared by
 * MainMenu's data export buttons. */
export function downloadBlob(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  downloadUrl(filename, url);
  URL.revokeObjectURL(url);
}

/** Same download mechanism as downloadBlob(), but for a URL that's
 * already available (eg a renderer snapshot's data URL) - no
 * Blob/object URL needed. */
export function downloadUrl(filename: string, url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Captures the actual current rendered game canvas - pixel-for-pixel
 * what's on screen, not a recomposited/redrawn image - and triggers a
 * PNG download. Uses Phaser's built-in renderer snapshot, which works
 * across both the WebGL and Canvas renderers, rather than manually
 * drawing content to an offscreen canvas. Shared by every level's
 * "download this result" button. */
export function downloadCanvasSnapshot(game: Game, filename: string): void {
  game.renderer.snapshot((snapshot) => {
    if (snapshot instanceof HTMLImageElement) {
      downloadUrl(filename, snapshot.src);
    }
  });
}

/** Draws a rounded-rect button face as a raised "block": a soft drop
 * shadow underneath, a dark base layer, a lighter layer inset by
 * `bevel` on the bottom/right (so the dark base peeks out there as a
 * shadow edge), and the actual face colour inset by `bevel` again on
 * every side (so the lighter layer peeks out top/left as a highlight
 * edge) - the classic toy-block/raised-button bevel illusion. Shared
 * by createButton (pill shape) and the Level2/Level3 drag tiles
 * (NumberOrderScene.ts), which calls this directly with its own
 * left/top/width/height.
 */
export function drawBevelledRect(
  g: GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
  faceColour: number,
  strokeColour: number,
): void {
  const bevel = Math.max(3, Math.round(Math.min(width, height) * 0.11));
  const shade =
    Phaser.Display.Color.IntegerToColor(faceColour).darken(32).color;
  const highlight =
    Phaser.Display.Color.IntegerToColor(faceColour).lighten(30).color;

  g.fillStyle(0x000000, 0.2);
  g.fillRoundedRect(left + 3, top + 5, width, height, radius);

  g.fillStyle(shade, 1);
  g.fillRoundedRect(left, top, width, height, radius);

  g.fillStyle(highlight, 1);
  g.fillRoundedRect(left, top, width - bevel, height - bevel, radius);

  g.fillStyle(faceColour, 1);
  g.fillRoundedRect(
    left + bevel,
    top + bevel,
    width - 2 * bevel,
    height - 2 * bevel,
    Math.max(2, radius - bevel * 0.6),
  );

  g.lineStyle(3, strokeColour, 1);
  g.strokeRoundedRect(left, top, width, height, radius);
}

/** Circular counterpart of drawBevelledRect() - a straight offset-rect
 * bevel doesn't translate cleanly to a circle, so this uses a
 * "dome/bubble button" treatment instead: soft drop shadow, a darker
 * base disc (reads as a thin shadow rim once the face disc above is
 * nudged up), the face disc itself nudged up slightly and shrunk a
 * touch, and a soft glossy highlight ellipse in the upper-left - the
 * same light-from-above cue, applied to round number buttons. */
export function drawRaisedCircle(
  g: GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  faceColour: number,
  strokeColour: number,
): void {
  const shade =
    Phaser.Display.Color.IntegerToColor(faceColour).darken(30).color;
  const faceRadius = radius * 0.92;
  const faceCy = cy - radius * 0.08;

  g.fillStyle(0x000000, 0.22);
  g.fillCircle(cx + radius * 0.08, cy + radius * 0.14, radius);

  g.fillStyle(shade, 1);
  g.fillCircle(cx, cy, radius);

  g.fillStyle(faceColour, 1);
  g.fillCircle(cx, faceCy, faceRadius);
  g.lineStyle(3, strokeColour, 1);
  g.strokeCircle(cx, faceCy, faceRadius);

  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(
    cx - radius * 0.28,
    faceCy - radius * 0.32,
    radius * 0.7,
    radius * 0.42,
  );
}

export type ButtonVariant = "primary" | "secondary" | "muted" | "danger";

export type ButtonOptions = {
  /** Visual style - also picks a sensible default height. */
  variant?: ButtonVariant;
  /** Overrides the variant's default height (px). */
  height?: number;
  /** The button never gets narrower than this, even if the label is short. */
  minWidth?: number;
  /** Overrides the auto-computed (height-relative) font size. */
  fontSize?: number;
  /** Which point of the button's bounding box (x, y) refers to - same
   * convention as Phaser's Text.setOrigin(). Defaults to centered. */
  origin?: [number, number];
};

export type Button = {
  /** Groups the visual pieces together - tween this for whole-button
   * effects (eg a "pop" on success). */
  container: GameObjects.Container;
  /** The actual clickable element. Attach "pointerdown"/"pointerover"
   * handlers here, not on `container` - a custom hit area set directly
   * on a Container has proven unreliable in this codebase; a real
   * Rectangle GameObject with its own intrinsic bounds is the pattern
   * that holds up. */
  hitArea: GameObjects.Rectangle;
  setLabel(text: string): void;
};

type Palette = {
  fill: number;
  hoverFill: number;
  stroke: number;
  text: string;
};

// Warmer than the form's navy-on-pale-blue: bright, saturated, kid-friendly.
const PALETTES: Record<ButtonVariant, Palette> = {
  primary: {
    fill: 0xff9f40,
    hoverFill: 0xffb86b,
    stroke: 0xc96f1e,
    text: "#ffffff",
  },
  secondary: {
    fill: 0x4fb6a8,
    hoverFill: 0x6bcbbe,
    stroke: 0x2e8577,
    text: "#ffffff",
  },
  muted: {
    fill: 0xe8ecf7,
    hoverFill: 0xf2f4fa,
    stroke: 0xaab4d6,
    text: "#4a3b7a",
  },
  danger: {
    fill: 0xe66b6b,
    hoverFill: 0xee8c8c,
    stroke: 0xb84444,
    text: "#ffffff",
  },
};

const DEFAULT_HEIGHTS: Record<ButtonVariant, number> = {
  primary: 76,
  secondary: 60,
  muted: 56,
  danger: 56,
};

/**
 * A rounded, touch-friendly button sized for small fingers: a real
 * bevelled "block" (see drawBevelledRect), not a flat rounded-rect or
 * a plain Text with flat backgroundColor, with pointerover/pointerdown
 * scale feedback plus a small press "pop" - reads as physically
 * pressable rather than a flat sticker.
 */
export function createButton(
  scene: Scene,
  x: number,
  y: number,
  label: string,
  options: ButtonOptions = {},
): Button {
  const variant = options.variant ?? "primary";
  const palette = PALETTES[variant];
  const height = options.height ?? DEFAULT_HEIGHTS[variant];
  const fontSize = options.fontSize ?? Math.round(height * 0.38);
  const paddingX = Math.round(height * 0.6);
  const [originX, originY] = options.origin ?? [0.5, 0.5];

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Fredoka, Arial Black, sans-serif",
      fontSize,
      color: palette.text,
      align: "center",
    })
    .setOrigin(0.5);

  const width = Math.max(options.minWidth ?? 0, text.width + paddingX * 2);
  const radius = height / 2;
  // (left, top) of the button's own bounding box, in local (container)
  // space - everything else is positioned relative to this.
  const left = -width * originX;
  const top = -height * originY;

  const bg = scene.add.graphics();
  const drawBg = (fillColour: number) => {
    bg.clear();
    drawBevelledRect(
      bg,
      left,
      top,
      width,
      height,
      radius,
      fillColour,
      palette.stroke,
    );
  };
  drawBg(palette.fill);

  text.setPosition(left + width / 2, top + height / 2);

  // Invisible but real Rectangle GameObject on top, purely for input -
  // see the Button.hitArea doc comment above for why.
  const hitArea = scene.add.rectangle(
    left + width / 2,
    top + height / 2,
    width,
    height,
    0x000000,
    0,
  );
  hitArea.setInteractive({ useHandCursor: true });

  const container = scene.add.container(x, y, [bg, text, hitArea]);

  hitArea.on("pointerover", () => {
    drawBg(palette.hoverFill);
    scene.tweens.add({
      targets: container,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 120,
      ease: "Sine.easeOut",
    });
  });
  hitArea.on("pointerout", () => {
    drawBg(palette.fill);
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: "Sine.easeOut",
    });
  });
  hitArea.on("pointerdown", () => {
    scene.tweens.add({
      targets: container,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 70,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  });

  return {
    container,
    hitArea,
    setLabel: (newLabel: string) => {
      // The button's width is fixed at creation time, sized to the
      // original label - callers that swap in a new label need to keep
      // it short enough to fit.
      text.setText(newLabel);
    },
  };
}

export type CircleButtonOptions = {
  /** Visual style - reuses the same palette as createButton(). */
  variant?: ButtonVariant;
  /** Overrides the default circle diameter (px). */
  diameter?: number;
  /** Overrides the auto-computed (diameter-relative) font size. */
  fontSize?: number;
  /** Which point of the button's bounding box (x, y) refers to - same
   * convention as Phaser's Text.setOrigin(). Defaults to centered. */
  origin?: [number, number];
  /** Overrides individual colours from the variant's palette - lets a
   * caller give each button its own fill/hover/stroke (eg Level1's
   * number buttons, one hue per button) without inventing a whole new
   * variant per colour. Unset fields fall back to the variant. */
  paletteOverride?: Partial<Omit<Palette, "text">>;
};

const DEFAULT_CIRCLE_DIAMETER = 64;

/**
 * A small circular button - same Button shape (container/hitArea) as
 * createButton(), so existing enable/disable wiring (container.setAlpha,
 * hitArea.setInteractive/disableInteractive) keeps working unchanged -
 * but drawn as a raised "dome" (see drawRaisedCircle) with a glossy
 * highlight instead of a flat filled circle. Meant for compact,
 * icon-like actions (eg short numeric labels) rather than for buttons
 * that need to fit a word.
 */
export function createCircleButton(
  scene: Scene,
  x: number,
  y: number,
  label: string,
  options: CircleButtonOptions = {},
): Button {
  const variant = options.variant ?? "primary";
  const palette = { ...PALETTES[variant], ...options.paletteOverride };
  const diameter = options.diameter ?? DEFAULT_CIRCLE_DIAMETER;
  const radius = diameter / 2;
  const fontSize = options.fontSize ?? Math.round(diameter * 0.42);
  const [originX, originY] = options.origin ?? [0.5, 0.5];

  // Centre of the circle's own bounding box, in local (container) space -
  // everything else is positioned relative to this.
  const centreX = radius - diameter * originX;
  const centreY = radius - diameter * originY;

  const text = scene.add
    .text(centreX, centreY - radius * 0.08, label, {
      fontFamily: "Fredoka, Arial Black, sans-serif",
      fontSize,
      color: palette.text,
      align: "center",
    })
    .setOrigin(0.5);

  const bg = scene.add.graphics();
  const drawBg = (fillColour: number) => {
    bg.clear();
    drawRaisedCircle(bg, centreX, centreY, radius, fillColour, palette.stroke);
  };
  drawBg(palette.fill);

  // Invisible but real Rectangle GameObject on top, purely for input -
  // see the Button.hitArea doc comment above for why.
  const hitArea = scene.add.rectangle(
    centreX,
    centreY,
    diameter,
    diameter,
    0x000000,
    0,
  );
  hitArea.setInteractive({ useHandCursor: true });

  const container = scene.add.container(x, y, [bg, text, hitArea]);

  hitArea.on("pointerover", () => {
    drawBg(palette.hoverFill);
    scene.tweens.add({
      targets: container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 120,
      ease: "Sine.easeOut",
    });
  });
  hitArea.on("pointerout", () => {
    drawBg(palette.fill);
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: "Sine.easeOut",
    });
  });
  hitArea.on("pointerdown", () => {
    scene.tweens.add({
      targets: container,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 70,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  });

  return {
    container,
    hitArea,
    setLabel: (newLabel: string) => {
      text.setText(newLabel);
    },
  };
}
