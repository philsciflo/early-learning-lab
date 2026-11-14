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
  /** Pool of CSS colour strings - each scattered digit picks one at
   * random, so the backdrop reads as a playful mix of hues rather than
   * one flat colour. */
  colours?: string[];
};

const DEFAULTS: Required<NumberBackdropOptions> = {
  minFontSize: 36,
  maxFontSize: 110,
  minAlpha: 0.12,
  maxAlpha: 0.32,
  maxRotationDeg: 35,
  colours: ["#e85d75", "#f0954a", "#4a3b7a", "#2f9e67", "#1c7ed6"],
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
    const colour =
      opts.colours[Phaser.Math.Between(0, opts.colours.length - 1)];

    scene.add
      .text(x, y, digit, {
        fontFamily: "Arial Black",
        fontSize,
        color: colour,
      })
      .setOrigin(0.5)
      .setAngle(rotationDeg)
      .setAlpha(alpha);
  }
}
