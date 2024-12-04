import { Scene } from "phaser";
import { renderBanner, renderText, renderTextBanner } from "../banners.ts";
import {
  GAME_AREA_WIDTH,
  GUTTER_WIDTH,
  HALF_WIDTH,
  HEIGHT,
  ORANGE,
  TARGET_LEFT,
  TARGET_TOP,
  WIDTH,
} from "../constants.ts";

/**
 * Encapsulates the common setup between scenes of the Bricks Shape game
 */
export abstract class BaseBricksScene extends Scene {
  protected startTime: DOMHighResTimeStamp;

  protected constructor(
    name: string,
    protected levelTitle: string,
    protected instructions: string,
    protected prevSceneKey: string,
    protected nextSceneKey: string,
  ) {
    super(name);
  }

  /**
   * Callback for scene-specific actions when the Reset button is triggered
   */
  protected abstract doReset(): void;

  preload() {
    this.load.image("forward", "assets/fast-forward-button.png");
    this.load.image("backward", "assets/fast-backward-button.png");
  }

  create() {
    this.renderStaticBackgroundItems();
    this.renderNavigationButtons();
    const timeText = renderText(
      this,
      WIDTH - GUTTER_WIDTH - 150,
      150,
      "Time:",
      0,
    );
    renderText(this, TARGET_LEFT + 50, TARGET_TOP - 50, "Target");

    this.startTime = window.performance.now();

    this.events.on("update", (currentTime: number) => {
      timeText.setText(
        `Time: ${((currentTime - this.startTime) / 1000).toFixed(0)}s`,
      );
    });
  }

  private renderStaticBackgroundItems() {
    renderTextBanner(
      this,
      {
        y: 10,
        height: 45,
        backgroundColour: ORANGE,
      },
      { text: this.levelTitle, yOffset: 5 },
    );

    renderText(this, HALF_WIDTH, 70, this.instructions);

    // White background box
    renderBanner(this, {
      x: GUTTER_WIDTH,
      y: 110,
      width: GAME_AREA_WIDTH,
      height: HEIGHT - 118,
    });
  }

  private renderNavigationButtons() {
    this.add
      .sprite(GUTTER_WIDTH, 10, "backward")
      .setOrigin(0, 0)
      .setDisplaySize(100, 50)
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.start(this.prevSceneKey);
      });

    this.add
      .sprite(WIDTH - GUTTER_WIDTH - 100, 10, "forward")
      .setOrigin(0, 0)
      .setDisplaySize(100, 50)
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.start(this.nextSceneKey);
      });
  }
}
