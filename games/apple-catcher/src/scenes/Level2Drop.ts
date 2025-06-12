import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { setupForkedPipe } from "../pipes.ts";
import { Level2ScoringData } from "../scoring.ts";

export class Level2Drop extends AbstractCatcherScene<Level2ScoringData> {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;

  constructor() {
    super(
      "Level2Drop",
      '"Apple Drop" - Level 2',
      "Place the basket to catch the apple!",
      "Level1Drop",
      "Level3Drop",
    );
    this.hideDropButton = true;
  }

  create() {
    super.create();
    this.setupBasket();
    this.setupApple();
    setupForkedPipe(this, HALF_WIDTH, this.apple, true);

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
      .setScale(1.3,1)
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
    const appleX = this.rightTreeLeft + 100; 
    const appleY = 415;

    this.apple = this.physics.add
        .sprite(appleX, appleY, "apple")
        .setDisplaySize(50, 50)
        .setCollideWorldBounds(true)
        .setInteractive({ draggable: true }) // Enable dragging
        .disableBody();

    this.apple.on('dragstart', () => {
        this.apple.disableBody(true, false); // Freeze physics during drag
    });

    this.apple.on('drag', (pointer: Pointer) => {
        this.apple.x = pointer.x;
        this.apple.y = pointer.y;
    });

    this.apple.on('dragend', () => {
        this.apple.enableBody(true, this.apple.x, this.apple.y, true, true);
        this.apple.setGravityY(300); // Fall speed
        this.apple.setInteractive({ draggable: false }); // Disable future dragging
    });
}

private resetApple() {
    if (this.apple.body) {
        this.physics.world.disableBody(this.apple.body);
    }
    this.apple.body.reset(this.rightTreeLeft + 100, 415); 
    this.apple.setVisible(true);
    this.apple.setActive(true);
    this.apple.setInteractive({ draggable: true }); // Re-enable dragging
    this.apple.setGravityY(0); // Clear gravity until dropped
}
}
