import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { renderVerticalPipe } from "../pipes.ts";

export class Level1 extends AbstractCatcherScene {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;

  constructor() {
    super(
      "Level1",
      '"Apple Catcher" - Level 1',
      "Place the basket to catch the apple!",
      "Level0",
      "Level2",
    );
  }

  create() {
    super.create();
    renderVerticalPipe(this, HALF_WIDTH);
    this.setupBasket();
    this.setupApple();

    this.addCollisionHandling(this.basket, this.apple);
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.resetBasket();
    this.resetApple();
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
      Phaser.Math.Between(this.leftEdgeGameBound, this.rightEdgeGameBound),
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
