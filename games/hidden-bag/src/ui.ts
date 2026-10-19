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

export type SuccessPopOptions = {
  /** Local-space offset from `target`'s own (x, y) to its visual
   * centre. (0, 0) for something already centre-anchored (eg the
   * draggable bag); (width / 2, height / 2) for a top-left-anchored
   * container (eg a postcard) - without this, scaling up a
   * top-left-anchored target makes it balloon toward one corner
   * instead of growing evenly in place. */
  centerOffsetX?: number;
  centerOffsetY?: number;
  scaleTo?: number;
  hopHeight?: number;
  duration?: number;
  /** Size of the gold flash overlay, centred on the target's visual
   * centre (`centerOffsetX`/`centerOffsetY`). */
  flashWidth?: number;
  flashHeight?: number;
};

/**
 * The big "yes, found it!" pop used for every "NPC can see it"
 * celebration (Level1/Level2's bag, postcardScene's card): a chunky
 * scale-up-and-hop on `target`, plus a brief additive gold flash over
 * it, so the moment reads as a clear jump rather than a subtle wobble.
 */
export function playBigSuccessPop(
  scene: Scene,
  target: GameObjects.Container,
  options: SuccessPopOptions = {},
): void {
  const {
    centerOffsetX = 0,
    centerOffsetY = 0,
    scaleTo = 1.45,
    hopHeight = 28,
    duration = 260,
    flashWidth = 90,
    flashHeight = 120,
  } = options;

  const baseX = target.x;
  const baseY = target.y;
  const progress = { t: 0 };

  scene.tweens.add({
    targets: progress,
    t: 1,
    duration,
    yoyo: true,
    ease: "Back.easeOut",
    onUpdate: () => {
      const s = 1 + (scaleTo - 1) * progress.t;
      target.setScale(s);
      target.x = baseX - centerOffsetX * (s - 1);
      target.y = baseY - centerOffsetY * (s - 1) - hopHeight * progress.t;
    },
    onComplete: () => {
      target.setScale(1);
      target.x = baseX;
      target.y = baseY;
    },
  });

  const flash = scene.add
    .rectangle(
      baseX + centerOffsetX,
      baseY + centerOffsetY,
      flashWidth,
      flashHeight,
      0xffe066,
      0,
    )
    .setBlendMode("ADD")
    .setDepth(20);
  scene.tweens.add({
    targets: flash,
    alpha: { from: 0, to: 0.85 },
    duration: duration * 0.4,
    yoyo: true,
    onComplete: () => flash.destroy(),
  });
}

export type SuccessBanner = {
  container: GameObjects.Container;
  show(message: string): void;
  hide(): void;
};

/**
 * A solid, bannerish "you got it!" panel - the positive counterpart to
 * the plain `feedbackText` used for "not quite" messages. Used by
 * Level2 and the shared postcardScene (Level3/Level4) so the "correct"
 * moment has the same visual weight and position everywhere, clearly
 * separated from the facilitator buttons and instruction text around
 * it rather than floating as plain text on the scene.
 */
export function createSuccessBanner(
  scene: Scene,
  x: number,
  y: number,
): SuccessBanner {
  const width = 680;
  const height = 52;

  const bg = scene.add.graphics();
  bg.fillStyle(0x2e7d32, 1);
  bg.lineStyle(4, 0x1b5e20, 1);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);

  const text = scene.add
    .text(0, 0, "", {
      fontFamily: "Arial Black",
      fontSize: 22,
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [bg, text]).setAlpha(0);

  return {
    container,
    show(message: string) {
      text.setText(message);
      container.setScale(0.8).setAlpha(0);
      scene.tweens.add({
        targets: container,
        alpha: 1,
        scale: 1,
        duration: 220,
        ease: "Back.easeOut",
      });
    },
    hide() {
      container.setAlpha(0);
    },
  };
}
