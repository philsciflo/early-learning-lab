import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BLUE, BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export class Level3 extends AbstractCatcherScene {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;

  constructor() {
    super(
      "Level3",
      '"Apple Catcher" - Level 3',
      "Place the basket to catch the apple!",
      "Level2",
      "Level4",
    );
  }

  create() {
    super.create();
    this.renderThreeForkedPipe();
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

  private renderThreeForkedPipe() {
    const pipeWidth = 80;
    const pipeTop = 280;
    const pipeForkTop = pipeTop + 100;
    const pipeForkVerticalHeight = pipeWidth / Math.sin(Math.PI / 4);
    const pipeForkBottom = pipeForkTop + pipeForkVerticalHeight;
    const pipeBottom = pipeForkBottom + pipeForkVerticalHeight;
    const pipeLeft = HALF_WIDTH - pipeWidth / 2;
    const pipeRight = HALF_WIDTH + pipeWidth / 2;
    const forkTopLineAdditionalLength = Math.sqrt(
      Math.pow(pipeForkVerticalHeight, 2) / Math.pow(pipeWidth, 2),
    );
    const forkedPipeLeftLeft =
      pipeLeft - pipeForkVerticalHeight - forkTopLineAdditionalLength;
    const forkedPipeLeftRight = pipeLeft - pipeForkVerticalHeight;
    const forkedPipeRightLeft = pipeRight + pipeForkVerticalHeight;
    const forkedPipeRightRight =
      pipeRight + pipeForkVerticalHeight + forkTopLineAdditionalLength;

    const pipe = this.add.graphics();
    pipe.setDefaultStyles({
      fillStyle: {
        color: BLUE,
      },
      lineStyle: { color: BLUE, width: 4 },
    });
    // Top cylinder
    pipe.lineBetween(pipeLeft, pipeTop, pipeLeft, pipeForkTop);
    pipe.lineBetween(pipeRight, pipeTop, pipeRight, pipeForkTop);

    // Bottom cylinder
    pipe.lineBetween(pipeLeft, pipeForkBottom, pipeLeft, pipeBottom);
    pipe.lineBetween(pipeRight, pipeForkBottom, pipeRight, pipeBottom);

    // Left fork
    pipe.lineBetween(pipeLeft, pipeForkTop, forkedPipeLeftLeft, pipeForkBottom);
    pipe.lineBetween(pipeLeft, pipeForkBottom, forkedPipeLeftRight, pipeBottom);

    // Right fork
    pipe.lineBetween(
      pipeRight,
      pipeForkTop,
      forkedPipeRightLeft,
      pipeForkBottom,
    );
    pipe.lineBetween(
      pipeRight,
      pipeForkBottom,
      forkedPipeRightRight,
      pipeBottom,
    );
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
