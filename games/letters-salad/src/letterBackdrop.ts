import { Scene } from "phaser";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type LetterBackdropOptions = {
  /** Smallest/largest font size a scattered letter can get. */
  minFontSize?: number;
  maxFontSize?: number;
  /** Smallest/largest opacity a scattered letter can get. */
  minAlpha?: number;
  maxAlpha?: number;
  /** Max rotation in either direction, degrees. */
  maxRotationDeg?: number;
  /** Text colour, any CSS colour string. */
  colour?: string;
};

const DEFAULTS: Required<LetterBackdropOptions> = {
  minFontSize: 36,
  maxFontSize: 110,
  minAlpha: 0.12,
  maxAlpha: 0.32,
  maxRotationDeg: 35,
  colour: "#2b2a6b",
};

/**
 * Scatters `count` randomly-chosen uppercase letters across a
 * width x height area, each at a random size, rotation, and opacity -
 * the decorative "letter salad" backdrop used by MainMenu. Plain Text
 * objects, drawn once and never touched again, so later stages/levels
 * can reuse this for their own decorative treatment without
 * re-implementing it.
 */
export function scatterLetterBackdrop(
  scene: Scene,
  width: number,
  height: number,
  count: number,
  options: LetterBackdropOptions = {},
): void {
  const opts = { ...DEFAULTS, ...options };

  for (let i = 0; i < count; i++) {
    const letter = ALPHABET[Phaser.Math.Between(0, ALPHABET.length - 1)];
    const fontSize = Phaser.Math.Between(opts.minFontSize, opts.maxFontSize);
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(0, height);
    const rotationDeg = Phaser.Math.Between(
      -opts.maxRotationDeg,
      opts.maxRotationDeg,
    );
    const alpha = Phaser.Math.FloatBetween(opts.minAlpha, opts.maxAlpha);

    scene.add
      .text(x, y, letter, {
        fontFamily: "Arial Black",
        fontSize,
        color: opts.colour,
      })
      .setOrigin(0.5)
      .setAngle(rotationDeg)
      .setAlpha(alpha);
  }
}
