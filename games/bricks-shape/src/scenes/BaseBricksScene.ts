import { Scene } from "phaser";
import { renderBanner, renderText, renderTextBanner } from "../banners.ts";
import {
  BLACK,
  GAME_AREA_WIDTH,
  GUTTER_WIDTH,
  HALF_WIDTH,
  HEIGHT,
  ORANGE,
  PLAYER_ID_PAIR_DATA_KEY,
  TARGET_LEFT,
  TARGET_TOP,
  WIDTH,
} from "../constants.ts";
import {
  LevelScoringData,
  PLAYER_SCORING_DATA,
  storeScoringDataForPlayers,
} from "../scoring.ts";

/**
 * Encapsulates the common setup between scenes of the Bricks Shape game
 */
export abstract class BaseBricksScene extends Scene {
  protected startTime: DOMHighResTimeStamp;
  private scoringData: LevelScoringData[] = [];

  protected constructor(
    name: string,
    private scoreKey: keyof PLAYER_SCORING_DATA,
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

  init() {
    this.events.once("shutdown", () => {
      /*
       When the scene is shutdown, by navigating to another scene, we record
       scores for the current scene
       */
      const playerIdPair = this.registry.get(PLAYER_ID_PAIR_DATA_KEY);
      this.scoringData.push(this.recordScoreDataForCurrentTry());
      storeScoringDataForPlayers(playerIdPair, this.scoreKey, this.scoringData);
    });
  }

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

    const resetButton = this.add.graphics();
    resetButton.lineStyle(2, BLACK);
    resetButton.fillStyle(ORANGE);

    const resetLeft = HALF_WIDTH - 75;
    const resetTop = TARGET_TOP - 70;
    resetButton.fillRoundedRect(resetLeft, resetTop, 100, 50, 5);
    resetButton.strokeRoundedRect(resetLeft, resetTop, 100, 50, 5);
    renderText(this, resetLeft + 50, resetTop + 8, "Reset");

    resetButton.setInteractive(
      new Phaser.Geom.Rectangle(resetLeft, resetTop, 100, 50),
      Phaser.Geom.Rectangle.Contains,
    );

    resetButton.on("pointerdown", () => {
      this.startTime = window.performance.now();
      this.doReset();
    });

    this.startTime = window.performance.now();

    const timerUpdateFunction = (currentTime: number) => {
      timeText.setText(
        `Time: ${((currentTime - this.startTime) / 1000).toFixed(0)}s`,
      );
    };
    this.events.on("update", timerUpdateFunction);

    this.events.once("shutdown", () => {
      this.events.removeListener("update", timerUpdateFunction);
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

  protected abstract recordScoreDataForCurrentTry(): LevelScoringData;
}
