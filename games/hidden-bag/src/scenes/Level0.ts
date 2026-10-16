import { Scene, GameObjects } from "phaser";

import { WIDTH, HEIGHT, SKY_COLOUR } from "../constants.ts";
import { playChime } from "../audio.ts";

const STAR_RADIUS = 36;
const DRAG_MARGIN = STAR_RADIUS;

/**
 * Level 0: a pure drag warm-up, with no task to fail. One big, friendly
 * star the child can drag anywhere on screen, leaving a sparkle trail
 * while it moves and playing a cheerful chime whenever they let go -
 * teaching "my touch controls this thing" before Level 1 asks for any
 * reasoning on top of that.
 */
export class Level0 extends Scene {
  private star: GameObjects.Star;
  private sparkles: GameObjects.Particles.ParticleEmitter;
  private audioContext?: AudioContext;

  constructor() {
    super("Level0");
  }

  create() {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, SKY_COLOUR).setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 40, "Drag the star around!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.createContinueButton();

    // A small generated texture for the sparkle particles - no asset
    // file needed.
    const gfx = this.add.graphics();
    gfx.fillStyle(0xffe066, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture("sparkle", 12, 12);
    gfx.destroy();

    this.sparkles = this.add.particles(0, 0, "sparkle", {
      lifespan: 500,
      speed: { min: 20, max: 70 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: "ADD",
      emitting: false,
    });

    this.star = this.add
      .star(WIDTH / 2, HEIGHT / 2, 5, STAR_RADIUS * 0.5, STAR_RADIUS, 0xffc857)
      .setStrokeStyle(4, 0xff9f40)
      .setInteractive({ draggable: true, useHandCursor: true });

    this.input.on(
      "drag",
      (_pointer: Phaser.Input.Pointer, gameObject: GameObjects.GameObject, dragX: number, dragY: number) => {
        if (gameObject !== this.star) {
          return;
        }

        this.star.x = Phaser.Math.Clamp(dragX, DRAG_MARGIN, WIDTH - DRAG_MARGIN);
        this.star.y = Phaser.Math.Clamp(dragY, 90, HEIGHT - DRAG_MARGIN);

        this.sparkles.emitParticleAt(this.star.x, this.star.y, 2);
      },
    );

    this.input.on("dragend", (_pointer: Phaser.Input.Pointer, gameObject: GameObjects.GameObject) => {
      if (gameObject !== this.star) {
        return;
      }

      this.sparkles.emitParticleAt(this.star.x, this.star.y, 24);
      this.playRewardChime();

      this.tweens.add({
        targets: this.star,
        scale: 1.25,
        duration: 180,
        yoyo: true,
        ease: "Sine.easeOut",
      });
    });
  }

  private playRewardChime() {
    // Created lazily: browsers block audio until a user gesture, and by
    // the time a drag has ended, one has already happened.
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    playChime(this.audioContext);
  }

  /** A researcher/facilitator control: move on to the real task whenever
   * they judge the child is comfortable with dragging, rather than on a
   * fixed timer. */
  private createContinueButton() {
    this.add
      .text(WIDTH - 24, 24, "Continue →", {
        fontFamily: "Arial Black",
        fontSize: 20,
        color: "#ffffff",
        backgroundColor: "#2b2a6b",
        padding: { x: 14, y: 10 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("Level1");
      });
  }
}
