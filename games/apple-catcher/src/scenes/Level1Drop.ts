import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { renderVerticalPipe } from "../pipes.ts";
import { Level1ScoringData } from "../scoring.ts";

export class Level1Drop extends AbstractCatcherScene<Level1ScoringData> {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;

  constructor() {
    super(
      "Level1Drop",
      '"Apple Drop" - Level 1',
      "Place the basket to catch the apple!",
      "Level0Drop",
      "Level2Drop",
    );
    this.hideDropButton = true;
  }

  create() {
    super.create();
    this.setupBasket();
    this.setupApple();

    renderVerticalPipe(this, HALF_WIDTH, true);

    this.addCollisionHandling(this.basket, this.apple);
    
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.resetBasket();
    this.resetApple();
    this.registry.set(`${this.name}-startTime`, Date.now());
  }

  protected recordScoreDataForCurrentTry(): Level1ScoringData {
    const startTime = this.registry.get(`${this.name}-startTime`);
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : 0;
    return {
      tries: 
        this.registry.get(this.triesDataKey),
      basket: {
        x: this.basket.x,
        y: this.basket.y,
      },
      score: this.currentScore > 0 ? 1 : 0,
      duration: duration,
    };
  }
  private setupBasket() {
    this.basket = this.physics.add
      .staticSprite(HALF_WIDTH, BASKET_BOTTOM, "basket")
      .setInteractive({ draggable: false })
      .setScale(1.3,1)
      .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
        this.basket.setPosition(dragX, dragY);
        this.basket.refreshBody();
      });
    this.resetBasket();
  }

  private resetBasket() {
    /*this.basket.setPosition(
      Phaser.Math.RND.pick([
        this.leftEdgeGameBound + 50,
        this.rightEdgeGameBound - 50,
      ]),
      BASKET_BOTTOM,
    );*/
    this.basket.refreshBody();
    this.basket.setInteractive();
  }

  private setupApple() {
    const appleX = this.rightTreeLeft + 100; 
    const appleY = this.treeY + 110;

    this.apple = this.physics.add
        .sprite(appleX, appleY, "apple")
        .setDisplaySize(50, 50)
        .setCollideWorldBounds(true)
        .setInteractive({ draggable: true }) // Enable dragging
        .disableBody();

    /*this.apple.on('dragstart', () => {
        this.apple.disableBody(true, false); // Freeze physics during drag
    });*/
    this.apple.on('dragstart', () => {
      this.registry.values[this.triesDataKey] += 1;
      this.currentScore++; 
    });

    this.apple.on('drag', (pointer: Pointer) => {
        this.apple.x = pointer.x;
        this.apple.y = pointer.y;
    });

    this.apple.on('dragend', () => {
        this.physics.world.enableBody(this.apple);
        //this.apple.setGravityY(300); // Fall speed
        this.apple.disableInteractive();
    });
}

private resetApple() {
    if (this.apple.body) {
        this.physics.world.disableBody(this.apple.body);
    }
    this.apple.body.reset(this.rightTreeLeft + 100, this.treeY + 110); 
    this.apple.setVisible(true);
    this.apple.setActive(true);
    this.apple.setInteractive(); // Re-enable dragging
    this.apple.setGravityY(0); // Clear gravity until dropped
}
}