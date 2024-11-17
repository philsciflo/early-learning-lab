import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { renderVerticalPipe } from "../pipes.ts";

type ScoringData = {
  // Where the basket was, relative to (0,0) top-left corner
  basket: {
    x: number;
    y: number;
  };
  // 1 if the apple was caught, else 0
  score: 0 | 1;
};

export class Level1 extends AbstractCatcherScene {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;
  private scoringData: ScoringData[];

  constructor() {
    super(
      "Level1",
      '"Apple Catcher" - Level 1',
      "Place the basket to catch the apple!",
      "Level0",
      "Level2",
    );
  }

  init() {
    super.init();
    this.scoringData = [];
  }

  create() {
    super.create();
    this.setupBasket();
    this.setupApple();

    renderVerticalPipe(this, HALF_WIDTH);

    this.addCollisionHandling(this.basket, this.apple);
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.recordScoreDataForCurrentTry();
    this.resetBasket();
    this.resetApple();
  }

  private recordScoreDataForCurrentTry() {
    this.scoringData.push({
      basket: {
        x: this.basket.x,
        y: this.basket.y,
      },
      score: this.apple.active ? 0 : 1,
    });
  }

  protected getSceneScoringData() {
    if (this.registry.get(this.triesDataKey) > this.scoringData.length) {
      // capture the final score, if there was another try after the last reset,
      // but not otherwise
      this.recordScoreDataForCurrentTry();
    }
    return this.scoringData;
  }

  private setupBasket() {
    this.basket = this.physics.add
      .staticSprite(HALF_WIDTH, BASKET_BOTTOM, "basket")
      .setInteractive({ draggable: true })
      .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
        this.basket.setPosition(dragX, dragY);
        this.basket.refreshBody();
      });
    this.resetBasket();
  }

  private resetBasket() {
    this.basket.setPosition(
      Phaser.Math.RND.pick([
        this.leftEdgeGameBound + 50,
        this.rightEdgeGameBound - 50,
      ]),
      BASKET_BOTTOM,
    );
    this.basket.refreshBody();
    this.basket.setInteractive();
  }

  private setupApple() {
    this.apple = this.physics.add
      .sprite(HALF_WIDTH, APPLE_TOP, "apple")
      .setDisplaySize(50, 50)
      .setCollideWorldBounds(true)
      .disableBody();
  }

  private resetApple() {
    if (this.apple.body) {
      // If we've already dropped then the apple will have gravity to remove, else it won't
      this.physics.world.disableBody(this.apple.body);
    }
    this.apple.body.reset(HALF_WIDTH, APPLE_TOP);
    this.apple.setVisible(true);
    this.apple.setActive(true);
  }
}
