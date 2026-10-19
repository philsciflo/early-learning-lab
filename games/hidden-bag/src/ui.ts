import { Scene, GameObjects } from "phaser";

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
   * on a Container has proven unreliable in this codebase (see
   * postcardScene.makePostcardClickable); a real Rectangle GameObject
   * with its own intrinsic bounds is the pattern that holds up. */
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
    text: "#2b2a6b",
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
 * rounded-rect (Graphics), not a plain Text with flat backgroundColor,
 * with pointerover/pointerdown scale feedback plus a small press "pop".
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
      fontFamily: "Arial Black",
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
    bg.fillStyle(fillColour, 1);
    bg.lineStyle(3, palette.stroke, 1);
    bg.fillRoundedRect(left, top, width, height, radius);
    bg.strokeRoundedRect(left, top, width, height, radius);
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
      // original label - callers that swap in a new label (eg a
      // confirm prompt) need to keep it short enough to fit.
      text.setText(newLabel);
    },
  };
}
