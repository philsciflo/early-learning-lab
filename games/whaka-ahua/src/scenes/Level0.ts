import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_TOP_Y,
  CANVAS_BACKGROUND_COLOUR,
  CANVAS_BORDER_COLOUR,
  LEVEL_BACKGROUND_COLOUR,
  REFERENCE_LINE_COLOUR,
  REFERENCE_LINE_WIDTH,
  REFERENCE_TRIANGLE_VERTICES,
} from "../constants.ts";
import { createButton } from "../ui.ts";

// Single centered canvas - same square Level1 uses, just one copy
// instead of the target/drawing pair, so the warm-up visually matches
// the real task that follows it.
const CANVAS_X = (WIDTH - CANVAS_WIDTH) / 2;

// How far inside the outer (REFERENCE_TRIANGLE_VERTICES) triangle the
// inner triangle sits, scaled toward the centroid. 0.6 reads clearly as
// a track: thick enough for a small child's finger to land inside it,
// thin enough that the outer/inner edges don't collapse into a single
// blob.
const LANE_SCALE = 0.6;
const LANE_FILL_COLOUR = 0xffe9a8;

const STAR_RADIUS = 36;
// Generous - "near the star" for a small child's finger, which is
// rarely pixel-precise.
const TOUCH_RADIUS = 60;
// More generous than TOUCH_RADIUS: once moving, the star shouldn't stop
// just because a wobbly finger drifts a little further from it than
// the initial touch did.
const FOLLOW_RADIUS = 90;
// Slow enough that a child's finger can keep pace with the star across
// the ~830px midline loop (a full lap takes ~12s at this speed).
const STAR_SPEED = 70; // px/sec

export class Level0 extends Scene {
  private star: GameObjects.Star;
  private sparkles: GameObjects.Particles.ParticleEmitter;
  private idleTween: Phaser.Tweens.Tween;

  /** The 3 points the star travels between, in world (scene)
   * coordinates - the midline of the lane between the outer and inner
   * triangles. */
  private pathVerts: { x: number; y: number }[] = [];
  private segmentIndex = 0;
  private segmentDistTravelled = 0;

  private triggered = false;

  constructor() {
    super("Level0");
  }

  create() {
    this.triggered = false;
    this.segmentIndex = 0;
    this.segmentDistTravelled = 0;

    this.add
      .rectangle(0, 0, WIDTH, this.scale.height, LEVEL_BACKGROUND_COLOUR)
      .setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 40, "Follow the star around the triangle!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.createCanvasFrame();
    this.pathVerts = this.drawLaneAndComputePath();
    this.createSparkleTexture();
    this.createStar();
    this.createFacilitatorButtons();
  }

  /** Same plain white bordered square Level1 uses for its canvases. */
  private createCanvasFrame() {
    const g = this.add.graphics();
    g.fillStyle(CANVAS_BACKGROUND_COLOUR, 1);
    g.lineStyle(3, CANVAS_BORDER_COLOUR, 1);
    g.fillRect(CANVAS_X, CANVAS_TOP_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
    g.strokeRect(CANVAS_X, CANVAS_TOP_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /** Draws the outer (REFERENCE_TRIANGLE_VERTICES) triangle, an inner
   * triangle scaled toward the centroid by LANE_SCALE, and fills the
   * band between them so it reads as a track. Returns the midline
   * path (midpoints between each outer/inner vertex pair, in world
   * coordinates) the star will travel along. */
  private drawLaneAndComputePath(): { x: number; y: number }[] {
    const outer = REFERENCE_TRIANGLE_VERTICES;
    const centroid = {
      x: (outer[0].x + outer[1].x + outer[2].x) / 3,
      y: (outer[0].y + outer[1].y + outer[2].y) / 3,
    };

    const inner = outer.map((v) => ({
      x: centroid.x + (v.x - centroid.x) * LANE_SCALE,
      y: centroid.y + (v.y - centroid.y) * LANE_SCALE,
    }));

    const toWorld = (p: { x: number; y: number }) => ({
      x: CANVAS_X + p.x,
      y: CANVAS_TOP_Y + p.y,
    });
    const outerWorld = outer.map(toWorld);
    const innerWorld = inner.map(toWorld);
    const midWorld = outerWorld.map((o, i) => ({
      x: (o.x + innerWorld[i].x) / 2,
      y: (o.y + innerWorld[i].y) / 2,
    }));

    const g = this.add.graphics();

    g.fillStyle(LANE_FILL_COLOUR, 1);
    g.beginPath();
    g.moveTo(outerWorld[0].x, outerWorld[0].y);
    g.lineTo(outerWorld[1].x, outerWorld[1].y);
    g.lineTo(outerWorld[2].x, outerWorld[2].y);
    g.closePath();
    g.fillPath();

    // Punch the inner triangle back out in the canvas colour, leaving
    // only the outer/inner band filled.
    g.fillStyle(CANVAS_BACKGROUND_COLOUR, 1);
    g.beginPath();
    g.moveTo(innerWorld[0].x, innerWorld[0].y);
    g.lineTo(innerWorld[1].x, innerWorld[1].y);
    g.lineTo(innerWorld[2].x, innerWorld[2].y);
    g.closePath();
    g.fillPath();

    g.lineStyle(REFERENCE_LINE_WIDTH, REFERENCE_LINE_COLOUR, 1);
    [outerWorld, innerWorld].forEach((tri) => {
      g.beginPath();
      g.moveTo(tri[0].x, tri[0].y);
      g.lineTo(tri[1].x, tri[1].y);
      g.lineTo(tri[2].x, tri[2].y);
      g.closePath();
      g.strokePath();
    });

    return midWorld;
  }

  /** A small generated texture for the movement trail - same
   * no-asset-file technique tiro's Level0 uses for its drag sparkles. */
  private createSparkleTexture() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0xfff6c8, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture("whakaAhuaSparkle", 12, 12);
    gfx.destroy();

    this.sparkles = this.add.particles(0, 0, "whakaAhuaSparkle", {
      lifespan: 400,
      speed: { min: 10, max: 40 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: "ADD",
      emitting: false,
    });
  }

  private createStar() {
    const start = this.pathVerts[0];
    this.star = this.add.star(
      start.x,
      start.y,
      5,
      STAR_RADIUS * 0.5,
      STAR_RADIUS,
      0xffc857,
    );
    this.star.setStrokeStyle(4, 0xff9f40);

    // Continuous idle twinkle, enticing the child to touch it - stopped
    // once the star is triggered and starts actually moving.
    this.idleTween = this.tweens.add({
      targets: this.star,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.75, to: 1 },
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.triggered) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.star.x,
        this.star.y,
      );
      if (distance <= TOUCH_RADIUS) {
        this.triggered = true;
        this.idleTween.stop();
        this.star.setScale(1).setAlpha(1);
      }
    });
  }

  update(_time: number, delta: number) {
    if (!this.triggered) {
      return;
    }

    const pointer = this.input.activePointer;
    const following =
      pointer.isDown &&
      Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.star.x,
        this.star.y,
      ) <= FOLLOW_RADIUS;

    if (!following) {
      return;
    }

    let remaining = (STAR_SPEED * delta) / 1000;
    while (remaining > 0) {
      const segStart = this.pathVerts[this.segmentIndex];
      const segEnd = this.pathVerts[(this.segmentIndex + 1) % 3];
      const segLength = Phaser.Math.Distance.Between(
        segStart.x,
        segStart.y,
        segEnd.x,
        segEnd.y,
      );
      const remainingInSegment = segLength - this.segmentDistTravelled;

      if (remaining < remainingInSegment) {
        this.segmentDistTravelled += remaining;
        remaining = 0;
      } else {
        remaining -= remainingInSegment;
        this.segmentIndex = (this.segmentIndex + 1) % 3;
        this.segmentDistTravelled = 0;
      }
    }

    const segStart = this.pathVerts[this.segmentIndex];
    const segEnd = this.pathVerts[(this.segmentIndex + 1) % 3];
    const segLength = Phaser.Math.Distance.Between(
      segStart.x,
      segStart.y,
      segEnd.x,
      segEnd.y,
    );
    const frac = segLength > 0 ? this.segmentDistTravelled / segLength : 0;
    this.star.x = Phaser.Math.Linear(segStart.x, segEnd.x, frac);
    this.star.y = Phaser.Math.Linear(segStart.y, segEnd.y, frac);

    this.sparkles.emitParticleAt(this.star.x, this.star.y, 1);
  }

  /** Facilitator controls - no task to fail here, so just Back/Continue
   * on the facilitator's own judgement, matching every other level's
   * top-left/top-right convention. */
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

    const continueButton = createButton(this, WIDTH - 24, 24, "Continue →", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });
    continueButton.hitArea.on("pointerdown", () => {
      this.scene.start("Level1");
    });
  }
}
