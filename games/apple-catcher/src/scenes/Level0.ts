import { APPLE_TOP, BASKET_BOTTOM, HALF_WIDTH } from "../constants.ts";
import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import Pointer = Phaser.Input.Pointer;
import Body = Phaser.Physics.Arcade.Body;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;

export class Level0 extends AbstractCatcherScene {
  private basket: SpriteWithStaticBody;
  private apples: SpriteWithDynamicBody[] = [];

  constructor() {
    super(
      "Level0",
      '"Apple Catcher" - Level 0',
      "Catch as many apples as you can!",
      "MainMenu",
      "Level1",
    );
  }

  create() {
    super.create();
    this.setupApples();
    this.setupBasket();
    this.addCollisionHandling(this.basket, this.apples);
  }

  protected doDrop() {
    // Every half a second enable gravity on an apple that doesn't already have it, until there are no more apples
    const dropInterval = setInterval(() => {
      const applesWithoutGravity = this.apples.filter(
        (apple) => !apple.body || !(apple.body as Body).enable,
      );
      if (applesWithoutGravity.length === 0) {
        clearInterval(dropInterval);
      } else {
        this.physics.world.enableBody(applesWithoutGravity[0]);
      }
    }, 500);
  }

  protected doReset() {
    this.resetApples();
    this.resetBasket();
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
  }

  private setupApples() {
    this.apples = [];
    for (let appleCount = 0; appleCount < 5; appleCount++) {
      this.apples.push(
        this.physics.add
          .sprite(350 + appleCount * 80, APPLE_TOP, "apple")
          .setDisplaySize(50, 50)
          .setCollideWorldBounds(true)
          .disableBody(),
      );
    }
    this.resetApples();
  }

  private resetApples() {
    this.apples.forEach((apple: SpriteWithDynamicBody, index: number) => {
      if (apple.body) {
        // If we've already dropped then apples will have gravity to remove, else they won't
        this.physics.world.disableBody(apple.body);
      }
      apple.body.reset(350 + index * 80, APPLE_TOP);
      apple.setVisible(true);
      apple.setActive(true);
    });
    // Randomise the apples, so the order in the array isn't the order on screen
    this.apples = this.apples
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }
}
