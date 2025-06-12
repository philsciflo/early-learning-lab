import { Scene } from "phaser";
import { renderBanner, renderTextBanner } from "../banners.ts";
import {
  BLACK,
  BLACK_STRING,
  BLUE,
  GAME_AREA_WIDTH,
  GUTTER_WIDTH,
  HALF_WIDTH,
  HEIGHT,
  ORANGE,
  PLAYER_ID_DATA_KEY,
  WIDTH,
} from "../constants.ts";
import Body = Phaser.Physics.Arcade.Body;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import Tile = Phaser.Tilemaps.Tile;
import GameObjectWithBody = Phaser.Types.Physics.Arcade.GameObjectWithBody;
import { PLAYER_SCORING_DATA, storeScoringDataForPlayer } from "../scoring.ts";

const SCORE_DATA_KEY = "score";
const TRIES_DATA_KEY = "tries";

/**
 * Encapsulates the common setup between scenes of the Apple Catcher game
 */
export abstract class AbstractCatcherScene<T> extends Scene {
  private leftTreeLeft = GUTTER_WIDTH + 10;
  protected leftEdgeGameBound = this.leftTreeLeft + 200;
  protected rightTreeLeft = GAME_AREA_WIDTH - 160;
  protected rightEdgeGameBound = this.rightTreeLeft;

  public triesDataKey: string;
  public scoreDataKey: string;

  private scoringData: T[];

  protected hideDropButton = false; // Controls Drop button visibility

  /**
   * Score for the current drop
   *
   * &lt; 0 indicates no drop
   *
   * 0 dropped with no score
   *
   * &gt; 0 indicates a score
   */
  protected currentScore = -1;

  protected constructor(
    private name: keyof PLAYER_SCORING_DATA,
    protected levelTitle: string,
    protected instructions: string,
    protected prevSceneKey: string,
    protected nextSceneKey: string,
  ) {
    super(name);
    this.triesDataKey = `${this.name}-${TRIES_DATA_KEY}`;
    this.scoreDataKey = `${this.name}-${SCORE_DATA_KEY}`;
  }

  /**
   * Callback for scene-specific actions when the Drop button is triggered
   */
  protected abstract doDrop(): void;

  /**
   * Hook for scenes to conditionally disable the drop button
   * @protected
   */
  protected canDrop(): boolean {
    return true;
  }

  /**
   * Callback for scene-specific actions when the Reset button is triggered
   */
  protected abstract doReset(): void;

  /**
   * Allows scenes to report their scene-specific scoring data
   */
  protected abstract recordScoreDataForCurrentTry(): T;

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("tree", "assets/tree.png");
    this.load.image("apple", "assets/apple.png");
    this.load.image("basket", "assets/basket.png");
    this.load.image("forward", "assets/fast-forward-button.png");
    this.load.image("backward", "assets/fast-backward-button.png");
    this.load.image("pipe3", "assets/pipe3.png");
    this.load.image("pipe4-1", "assets/pipe4-1.png");
    this.load.image("pipe4-2", "assets/pipe4-2.png");
  }

  init() {
    this.scoringData = [];
    this.currentScore = -1;

    this.registry.set(this.triesDataKey, 0);
    this.registry.set(this.scoreDataKey, 0);

    this.events.once("shutdown", () => {
      /*
       When the scene is shutdown, by navigating to another scene, we record
       scores for the current scene
       */
      const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
      if (this.currentScore >= 0) {
        this.scoringData.push(this.recordScoreDataForCurrentTry());
      }
      storeScoringDataForPlayer(
        playerId,
        this.name,
        this.scoringData as unknown as [], // Blergh; generics hard
      );
    });
  }

  create() {
    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1);

    this.renderStaticBackgroundItems();
    this.renderDynamicNumbers();
    this.renderNavigationButtons();
    this.renderGameButtons();
  }

  private renderStaticBackgroundItems() {
    renderTextBanner(
      this,
      {
        y: 10,
        height: 45,
        backgroundColour: BLUE,
      },
      { text: this.levelTitle, yOffset: 5 },
    );

    this.add
      .text(HALF_WIDTH, 70, this.instructions, {
        fontFamily: "Arial",
        fontSize: 25,
        color: BLACK_STRING,
        align: "center",
      })
      .setOrigin(0.5, 0);

    // White background box
    renderBanner(this, {
      x: GUTTER_WIDTH,
      y: 110,
      width: GAME_AREA_WIDTH,
      height: HEIGHT - 118,
      backgroundAlpha: 0.7,
    });

    this.add
      .image(this.leftTreeLeft, 300, "tree")
      .setOrigin(0, 0)
      .setDisplaySize(200, 300);

    this.add
      .image(this.rightTreeLeft, 300, "tree")
      .setOrigin(0, 0)
      .setDisplaySize(200, 300);
  }

  private renderDynamicNumbers() {
    const triesText = this.add.text(
      GUTTER_WIDTH + 30,
      270,
      `Tries: ${this.registry.get(this.triesDataKey)}`,
      {
        fontFamily: "Arial",
        fontSize: 25,
        color: BLACK_STRING,
        align: "left",
      },
    );

    const triesDataChangeEventKey = `changedata-${this.triesDataKey}`;
    this.registry.events.on(
      triesDataChangeEventKey,
      (_parent: never, newValue: number) => {
        triesText.setText(`Tries: ${newValue}`);
      },
    );

    this.events.once("shutdown", () => {
      this.registry.events.off(triesDataChangeEventKey);
    });

    const scoreText = this.add.text(
      GAME_AREA_WIDTH - 130,
      270,
      `Score: ${this.registry.get(this.scoreDataKey)}`,
      {
        fontFamily: "Arial",
        fontSize: 25,
        color: BLACK_STRING,
        align: "left",
      },
    );
    const scoreDataChangeEventKey = `changedata-${this.scoreDataKey}`;
    this.registry.events.on(
      scoreDataChangeEventKey,
      (_parent: never, newValue: number) => {
        scoreText.setText(`Score: ${newValue}`);
      },
    );
    this.events.once("shutdown", () => {
      this.registry.events.off(scoreDataChangeEventKey);
    });
  }

  private renderNavigationButtons() {
    this.add
      .sprite(GUTTER_WIDTH, 10, "backward")
      .setOrigin(0, 0)
      .setDisplaySize(90, 90)
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.start(this.prevSceneKey);
      });

    this.add
      .sprite(WIDTH - GUTTER_WIDTH - 100, 10, "forward")
      .setOrigin(0, 0)
      .setDisplaySize(100, 100)
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.start(this.nextSceneKey);
      });
  }

  private renderGameButtons() {
    const buttonY = 400;
    const buttonWidth = 100;
    const buttonHeight = 50;

    if (!this.hideDropButton) {
    const dropButton = this.add.graphics();
    dropButton.lineStyle(2, BLACK);
    dropButton.fillStyle(ORANGE);

    const dropLeft = this.rightTreeLeft + 50;
    dropButton.fillRoundedRect(dropLeft, buttonY, buttonWidth, buttonHeight, 5);
    dropButton.strokeRoundedRect(
      dropLeft,
      buttonY,
      buttonWidth,
      buttonHeight,
      5,
    );

    dropButton.setInteractive(
      new Phaser.Geom.Rectangle(dropLeft, buttonY, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains,
    );

    dropButton.on("pointerdown", () => {
      if (this.canDrop()) {
        this.registry.inc(this.triesDataKey, 1);
        this.currentScore++; 
        this.doDrop();
      }
    });

    this.add
      .text(dropLeft + 50, buttonY + 8, "Drop", {
        fontFamily: "Arial",
        fontSize: 30,
        color: BLACK_STRING,
        align: "center",
      })
      .setOrigin(0.5, 0);

    }
    const resetButton = this.add.graphics();
    resetButton.lineStyle(2, BLACK);
    resetButton.fillStyle(ORANGE);

    const resetLeft = this.leftTreeLeft + 50;
    resetButton.fillRoundedRect(
      resetLeft,
      buttonY,
      buttonWidth,
      buttonHeight,
      5,
    );
    resetButton.strokeRoundedRect(
      resetLeft,
      buttonY,
      buttonWidth,
      buttonHeight,
      5,
    );
    this.add
      .text(resetLeft + 50, buttonY + 8, "Reset", {
        fontFamily: "Arial",
        fontSize: 30,
        color: BLACK_STRING,
        align: "center",
      })
      .setOrigin(0.5, 0);

    resetButton.setInteractive(
      new Phaser.Geom.Rectangle(resetLeft, buttonY, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains,
    );
    
    resetButton.on("pointerdown", () => {
      if (this.currentScore >= 0) {
        this.scoringData.push(this.recordScoreDataForCurrentTry());
      }
      this.doReset();
      this.currentScore = -1;
      dropButton.setInteractive();
    });
  }

  protected addCollisionHandling(
    basket: SpriteWithStaticBody,
    apples: SpriteWithDynamicBody | SpriteWithDynamicBody[],
  ) {
    this.physics.add.collider(
      basket,
      apples,
      (
        _basket: Body | Tile | GameObjectWithBody,
        apple: Body | Tile | GameObjectWithBody,
      ) => {
        (apple as SpriteWithDynamicBody).disableBody(true, true);
        this.registry.inc(this.scoreDataKey, 1);
        this.currentScore++;
      },
      (
        basket: Body | Tile | GameObjectWithBody,
        apple: Body | Tile | GameObjectWithBody,
      ) => {
        // Don't process collisions when the apple has already hit the floor,
        // or if the basket is hitting the apple from the top or side; it must be below
        // or if the apple is not active i.e. already been collected
        const theBasket = basket as SpriteWithStaticBody;
        const theApple = apple as SpriteWithDynamicBody;
        return (
          !theApple.body.onFloor() &&
          theApple.y < theBasket.y &&
          theApple.active
        );
      },
      this,
    );
  }
}
