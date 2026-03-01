import { Scene } from "phaser";
import { renderBanner, renderText, renderTextBanner } from "../banners.ts";
import {
  GAME_AREA_TOP,
  GAME_AREA_HEIGHT,
  GAME_AREA_WIDTH,
  GUTTER_WIDTH,
  HALF_WIDTH,
  ORANGE,
  PLAYER_ID_PAIR_DATA_KEY,
  WIDTH,
} from "../constants.ts";
import {
//   LevelScoringData,
  PLAYER_SCORING_DATA,
//   storeScoringDataForPlayers,
} from "../scoring.ts";

/**
 * Encapsulates the common setup between scenes of the Bricks Shape game
 */
export abstract class BaseScene extends Scene {
//   protected startTime: DOMHighResTimeStamp;
//   private scoringData: LevelScoringData[] = [];

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
    //   this.scoringData.push(this.recordScoreDataForCurrentTry());
    //   storeScoringDataForPlayers(playerIdPair, this.scoreKey, this.scoringData);
    });
  }

  preload() {
    this.load.image("forward", "assets/fast-forward-button.png");
    this.load.image("backward", "assets/fast-backward-button.png");
  }

  create() {
    // Title banner
    renderTextBanner(
      this,
      { y: 10, height: 45, backgroundColour: ORANGE },
      { text: this.levelTitle, yOffset: 5 },
    );

    // Instructions
    renderText(this, HALF_WIDTH, 70, this.instructions);

    // White background box
    renderBanner(this, {
      x: GUTTER_WIDTH,
      y: GAME_AREA_TOP,
      width: GAME_AREA_WIDTH,
      height: GAME_AREA_HEIGHT,
    });

    this.renderNavigationButtons();
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

//   protected abstract recordScoreDataForCurrentTry(): LevelScoringData;
}
