import { Scene, GameObjects } from "phaser";

import { WIDTH, HEIGHT, SKY_COLOUR } from "../constants.ts";
import { playChime } from "../audio.ts";
import { createButton } from "../ui.ts";

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

    // At fontSize 32, "Drag the star around!" (22 chars) is ~408px wide
    // (~0.58 * fontSize per char for bold Arial Black), spanning
    // roughly x=372..780 centered on WIDTH/2=576 - comfortably clear of
    // both the top-left ("← Back", right edge ~151) and top-right
    // ("Continue →", left edge ~954) button columns. wordWrap is a
    // safety net in case that ever changes.
    this.add
      .text(WIDTH / 2, 40, "Drag the star around!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5, 0);

    this.createFacilitatorButtons();

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
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: GameObjects.GameObject,
        dragX: number,
        dragY: number,
      ) => {
        if (gameObject !== this.star) {
          return;
        }

        this.star.x = Phaser.Math.Clamp(
          dragX,
          DRAG_MARGIN,
          WIDTH - DRAG_MARGIN,
        );
        this.star.y = Phaser.Math.Clamp(dragY, 90, HEIGHT - DRAG_MARGIN);

        this.sparkles.emitParticleAt(this.star.x, this.star.y, 2);
      },
    );

    this.input.on(
      "dragend",
      (_pointer: Phaser.Input.Pointer, gameObject: GameObjects.GameObject) => {
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
      },
    );
  }

  private playRewardChime() {
    // Created lazily: browsers block audio until a user gesture, and by
    // the time a drag has ended, one has already happened.
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    playChime(this.audioContext);
  }

  /** Researcher/facilitator controls: move on to the real task whenever
   * they judge the child is comfortable with dragging (rather than on a
   * fixed timer), or step back to the menu - matching every other
   * level's top-left/top-right button convention. */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    const button = createButton(this, WIDTH - 24, 24, "Continue →", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });

    button.hitArea.on("pointerdown", () => {
      this.scene.start("Level1");
    });
  }
}
