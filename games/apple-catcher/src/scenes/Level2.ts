import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { setupForkedPipe } from "../pipes.ts";
import { Level2ScoringData } from "../scoring.ts";

export class Level2 extends AbstractCatcherScene<Level2ScoringData> {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;

  constructor() {
    super(
      "Level2",
      '"Apple Catcher" - Level 2',
      "Place the basket to catch the apple!",
      "Level1",
      "Level3",
    );
  }

  create() {
    super.create();
    this.setupBasket();
    this.setupApple();
    setupForkedPipe(this, HALF_WIDTH, this.apple);

    this.addCollisionHandling(this.basket, this.apple);
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.apple.body.setAllowGravity(true);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.resetBasket();
    this.resetApple();
  }

  protected recordScoreDataForCurrentTry(): Level2ScoringData {
    return {
      basket: {
        x: this.basket.x,
        y: this.basket.y,
      },
      score: this.currentScore > 0 ? 1 : 0,
    };
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
        this.leftEdgeGameBound - 50,
        this.rightEdgeGameBound + 50,
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
      .setCollideWorldBounds(true, 0, 0, true)
      .disableBody();
    this.resetApple();
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
