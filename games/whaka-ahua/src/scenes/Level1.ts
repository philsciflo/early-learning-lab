import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  LEVEL_BACKGROUND_COLOUR,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_TOP_Y,
  CANVAS_LEFT_X,
  CANVAS_RIGHT_X,
  CANVAS_BACKGROUND_COLOUR,
  CANVAS_BORDER_COLOUR,
  REFERENCE_LINE_COLOUR,
  DRAWING_LINE_COLOUR,
  REFERENCE_TRIANGLE_VERTICES,
  PLAYER_ID_DATA_KEY,
  LAST_SCORE_DATA_KEY,
} from "../constants.ts";
import { Point, scoreTriangleDrawing } from "../triangleScoring.ts";
import { recordTrial } from "../scoring.ts";
import { createButton } from "../ui.ts";

const BUTTONS_Y = CANVAS_TOP_Y + CANVAS_HEIGHT + 60;
const FEEDBACK_Y = BUTTONS_Y + 70;

/**
 * Level 1: the child copies a static reference triangle, drawn
 * freehand on a blank canvas alongside it. Scored with
 * triangleScoring.ts's pixel-free Chamfer-style distance - see that
 * file for the algorithm itself; this scene is only responsible for
 * capturing the drawn polyline (in canvas-local coordinates) and
 * rendering it live.
 */
export class Level1 extends Scene {
  private drawGraphics: GameObjects.Graphics;
  private feedbackText: GameObjects.Text;

  private drawnPoints: Point[] = [];
  private isDrawing = false;
  private lastLocalPoint: Point | null = null;
  private attempts = 0;

  private trialStartMs: number;
  private lastScore: number | null = null;
  private lastValid = false;
  private lastMeanRefToDraw: number | null = null;
  private lastMeanDrawToRef: number | null = null;

  constructor() {
    super("Level1");
  }

  create() {
    this.drawnPoints = [];
    this.isDrawing = false;
    this.lastLocalPoint = null;
    this.attempts = 0;
    this.trialStartMs = Date.now();
    this.lastScore = null;
    this.lastValid = false;
    this.lastMeanRefToDraw = null;
    this.lastMeanDrawToRef = null;

    this.add
      .rectangle(0, 0, WIDTH, this.scale.height, LEVEL_BACKGROUND_COLOUR)
      .setOrigin(0, 0);

    // At fontSize 32, "Draw the triangle!" (19 chars) is well clear of
    // both the top-left ("← Back") and top-right ("Continue →") button
    // columns - same margin reasoning as tiro's Level0/Level1 titles.
    this.add
      .text(WIDTH / 2, 40, "Draw the triangle!", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(CANVAS_LEFT_X + CANVAS_WIDTH / 2, CANVAS_TOP_Y - 30, "Target", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#2b2a6b",
      })
      .setOrigin(0.5);
    this.add
      .text(
        CANVAS_RIGHT_X + CANVAS_WIDTH / 2,
        CANVAS_TOP_Y - 30,
        "Your drawing",
        { fontFamily: "Arial Black", fontSize: 24, color: "#2b2a6b" },
      )
      .setOrigin(0.5);

    this.createCanvasFrame(CANVAS_LEFT_X);
    this.drawReferenceTriangle();

    this.createCanvasFrame(CANVAS_RIGHT_X);
    this.drawGraphics = this.add.graphics();

    this.feedbackText = this.add
      .text(WIDTH / 2, FEEDBACK_Y, "", {
        fontFamily: "Arial Black",
        fontSize: 26,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    this.createDrawingInput();
    this.createActionButtons();
    this.createFacilitatorButtons();
  }

  /** The plain white bordered square both canvases share - purely
   * decorative framing, drawn once and never touched again. */
  private createCanvasFrame(x: number) {
    const g = this.add.graphics();
    g.fillStyle(CANVAS_BACKGROUND_COLOUR, 1);
    g.lineStyle(3, CANVAS_BORDER_COLOUR, 1);
    g.fillRect(x, CANVAS_TOP_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
    g.strokeRect(x, CANVAS_TOP_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawReferenceTriangle() {
    const [a, b, c] = REFERENCE_TRIANGLE_VERTICES;
    const g = this.add.graphics();
    g.lineStyle(5, REFERENCE_LINE_COLOUR, 1);
    g.beginPath();
    g.moveTo(CANVAS_LEFT_X + a.x, CANVAS_TOP_Y + a.y);
    g.lineTo(CANVAS_LEFT_X + b.x, CANVAS_TOP_Y + b.y);
    g.lineTo(CANVAS_LEFT_X + c.x, CANVAS_TOP_Y + c.y);
    g.closePath();
    g.strokePath();
  }

  private isInsideRightCanvas(x: number, y: number): boolean {
    return (
      x >= CANVAS_RIGHT_X &&
      x <= CANVAS_RIGHT_X + CANVAS_WIDTH &&
      y >= CANVAS_TOP_Y &&
      y <= CANVAS_TOP_Y + CANVAS_HEIGHT
    );
  }

  private toLocalPoint(x: number, y: number): Point {
    return { x: x - CANVAS_RIGHT_X, y: y - CANVAS_TOP_Y };
  }

  private createDrawingInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.isInsideRightCanvas(pointer.x, pointer.y)) {
        return;
      }
      this.isDrawing = true;
      const local = this.toLocalPoint(pointer.x, pointer.y);
      this.drawnPoints.push(local);
      this.lastLocalPoint = local;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDrawing) {
        return;
      }
      if (!this.isInsideRightCanvas(pointer.x, pointer.y)) {
        return;
      }

      const local = this.toLocalPoint(pointer.x, pointer.y);
      this.drawnPoints.push(local);

      if (this.lastLocalPoint) {
        this.drawGraphics.lineStyle(4, DRAWING_LINE_COLOUR, 1);
        this.drawGraphics.beginPath();
        this.drawGraphics.moveTo(
          CANVAS_RIGHT_X + this.lastLocalPoint.x,
          CANVAS_TOP_Y + this.lastLocalPoint.y,
        );
        this.drawGraphics.lineTo(pointer.x, pointer.y);
        this.drawGraphics.strokePath();
      }

      this.lastLocalPoint = local;
    });

    this.input.on("pointerup", () => {
      this.isDrawing = false;
      this.lastLocalPoint = null;
    });
  }

  private createActionButtons() {
    const clearX = WIDTH / 2 - 130;
    const checkX = WIDTH / 2 + 130;

    const clearButton = createButton(this, clearX, BUTTONS_Y, "Clear", {
      variant: "muted",
      minWidth: 180,
    });
    clearButton.hitArea.on("pointerdown", () => this.clearDrawing());

    const checkButton = createButton(this, checkX, BUTTONS_Y, "Check", {
      variant: "primary",
      minWidth: 180,
    });
    checkButton.hitArea.on("pointerdown", () => this.checkDrawing());
  }

  private clearDrawing() {
    this.drawnPoints = [];
    this.lastLocalPoint = null;
    this.isDrawing = false;
    this.drawGraphics.clear();
    this.feedbackText.setText("");
    this.lastScore = null;
    this.lastValid = false;
    this.lastMeanRefToDraw = null;
    this.lastMeanDrawToRef = null;
  }

  private checkDrawing() {
    this.attempts += 1;

    const result = scoreTriangleDrawing(
      this.drawnPoints,
      REFERENCE_TRIANGLE_VERTICES,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );

    this.lastScore = result.score;
    this.lastValid = result.valid;
    this.lastMeanRefToDraw = Number.isFinite(result.meanRefToDraw)
      ? result.meanRefToDraw
      : null;
    this.lastMeanDrawToRef = Number.isFinite(result.meanDrawToRef)
      ? result.meanDrawToRef
      : null;

    if (!result.valid) {
      this.feedbackText.setText("Not quite a triangle yet - try again!");
      return;
    }

    this.feedbackText.setText(`Score: ${result.score}/100`);
  }

  /** Facilitator controls: move on whenever they judge the child is
   * done (rather than on a fixed condition), or step back to the menu -
   * matching every other level's top-left/top-right button convention. */
  private createFacilitatorButtons() {
    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.finishTrial(true);
      this.scene.start("MainMenu");
    });

    const continueButton = createButton(this, WIDTH - 24, 24, "Continue →", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [1, 0],
    });
    continueButton.hitArea.on("pointerdown", () => {
      this.finishTrial(this.attempts === 0);
      this.registry.set(LAST_SCORE_DATA_KEY, this.lastScore);
      this.scene.start("GameOver");
    });
  }

  /** Writes this trial's full record to storage in one go (see
   * scoring.ts - recordTrial does a single localStorage write, rather
   * than one per drawn point). */
  private finishTrial(endedByFacilitator: boolean) {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY) as
      | string
      | undefined;
    if (!playerId) {
      // Scene started directly, skipping the login screen (e.g. during
      // development) - nothing to attach this trial to.
      return;
    }

    recordTrial(playerId, {
      level: "Level1",
      startTime: new Date(this.trialStartMs).toISOString(),
      trialDurationMs: Date.now() - this.trialStartMs,
      endedByFacilitator,
      attempts: this.attempts,
      drawnPointCount: this.drawnPoints.length,
      valid: this.lastValid,
      score: this.lastScore,
      meanRefToDraw: this.lastMeanRefToDraw,
      meanDrawToRef: this.lastMeanDrawToRef,
    });
  }
}
