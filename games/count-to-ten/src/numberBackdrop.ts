import { Scene } from "phaser";

const DIGITS = "0123456789".split("");

export type NumberBackdropOptions = {
  /** Smallest/largest font size a scattered digit can get. */
  minFontSize?: number;
  maxFontSize?: number;
  /** Smallest/largest opacity a scattered digit can get. */
  minAlpha?: number;
  maxAlpha?: number;
  /** Max rotation in either direction, degrees. */
  maxRotationDeg?: number;
  /** Text colour, any CSS colour string. */
  colour?: string;
};

const DEFAULTS: Required<NumberBackdropOptions> = {
  minFontSize: 36,
  maxFontSize: 110,
  minAlpha: 0.12,
  maxAlpha: 0.32,
  maxRotationDeg: 35,
  colour: "#2b2a6b",
};

/**
 * Scatters `count` randomly-chosen digits (0-9) across a width x height
 * area, each at a random size, rotation, and opacity - a
 * numbers-flavoured equivalent of letters-salad's
 * scatterLetterBackdrop, used as the decorative backdrop on MainMenu.
 * Plain Text objects, drawn once and never touched again, so later
 * stages/levels can reuse this for their own decorative treatment
 * without re-implementing it.
 */
export function scatterNumberBackdrop(
  scene: Scene,
  width: number,
  height: number,
  count: number,
  options: NumberBackdropOptions = {},
): void {
  const opts = { ...DEFAULTS, ...options };

  for (let i = 0; i < count; i++) {
    const digit = DIGITS[Phaser.Math.Between(0, DIGITS.length - 1)];
    const fontSize = Phaser.Math.Between(opts.minFontSize, opts.maxFontSize);
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(0, height);
    const rotationDeg = Phaser.Math.Between(
      -opts.maxRotationDeg,
      opts.maxRotationDeg,
    );
    const alpha = Phaser.Math.FloatBetween(opts.minAlpha, opts.maxAlpha);

    scene.add
      .text(x, y, digit, {
        fontFamily: "Arial Black",
        fontSize,
        color: opts.colour,
      })
      .setOrigin(0.5)
      .setAngle(rotationDeg)
      .setAlpha(alpha);
  }
}
