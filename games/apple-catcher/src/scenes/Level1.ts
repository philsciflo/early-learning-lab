import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BLUE, BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

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
    this.renderVerticalPipe();
    this.setupBasket();
    this.setupApple();

    this.addCollisionHandling(this.basket, this.apple);
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.setupBasket();
    this.setupApple();
  }

  private renderVerticalPipe() {
    const pipeWidth = 80;
    const pipeHeight = 250;
    const pipeTop = 280;
    const pipeBottom = pipeTop + pipeHeight;
    const pipeLeft = HALF_WIDTH - pipeWidth / 2;
    const pipeRight = HALF_WIDTH + pipeWidth / 2;
    const pipe = this.add.graphics();
    pipe.setDefaultStyles({
      fillStyle: {
        color: BLUE,
      },
      lineStyle: { color: BLUE, width: 4 },
    });
    pipe.lineBetween(pipeLeft, pipeTop, pipeLeft, pipeBottom);
    pipe.lineBetween(pipeRight, pipeTop, pipeRight, pipeBottom);
  }

  private setupBasket() {
    if (!this.basket) {
      this.basket = this.physics.add
        .staticSprite(HALF_WIDTH, BASKET_BOTTOM, "basket")
        .setInteractive({ draggable: true })
        .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
          this.basket.setPosition(dragX, dragY);
          this.basket.refreshBody();
        });
    }
    this.basket.setPosition(
      Phaser.Math.Between(this.leftEdgeGameBound, this.rightEdgeGameBound),
      BASKET_BOTTOM,
    );
    this.basket.refreshBody();
    this.basket.setInteractive();
  }

  private setupApple() {
    if (!this.apple) {
      this.apple = this.physics.add
        .sprite(HALF_WIDTH, APPLE_TOP, "apple")
        .setDisplaySize(50, 50)
        .setCollideWorldBounds(true)
        .disableBody();
    } else {
      if (this.apple.body) {
        // If we've already dropped then the apple will have gravity to remove, else it won't
        this.physics.world.disableBody(this.apple.body);
      }
      this.apple.body.reset(HALF_WIDTH, APPLE_TOP);
      this.apple.setVisible(true);
      this.apple.setActive(true);
    }
  }
}
