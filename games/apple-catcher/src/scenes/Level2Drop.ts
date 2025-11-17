import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { setupForkedPipe } from "../pipes.ts";
import { Level2DropScoringData } from "../scoring.ts";

export class Level2Drop extends AbstractCatcherScene<Level2DropScoringData> {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;
  private isDragging: boolean = false;
  private dragInterval?: Phaser.Time.TimerEvent;

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
    this.dragPositions = [];
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.apple.body.setAllowGravity(true);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.resetBasket();
    this.resetApple();
    this.registry.set(`${this.name}-startTime`, Date.now());
    this.dragPositions = [];
  }

  protected recordScoreDataForCurrentTry(): Level2DropScoringData {
    const startTime = this.registry.get(`${this.name}-startTime`);
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : 0;
    return {
      tries: 
        this.registry.get(this.triesDataKey),
      applePath: this.dragPositions,
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
      })
      .setSize(60, 60)
      .setOffset(20, 20)
      ;
    this.resetBasket();
  }

  private resetBasket() {
    this.basket.setPosition(
      Phaser.Math.RND.pick([
        this.leftEdgeGameBound + 100,
        this.rightEdgeGameBound - 100,
      ]),
      BASKET_BOTTOM,
    );
    this.basket.refreshBody();
    this.basket.setInteractive();
  }

  private setupApple() {
    const appleX = this.rightTreeLeft + 100; 
    const appleY = this.treeY + 110;

    this.apple = this.physics.add
        .sprite(appleX, appleY, "apple")
        .setDisplaySize(50, 50)
        .setCollideWorldBounds(true, 0, 0, true)
        .setInteractive({ draggable: true }) // Enable dragging
        .disableBody();

    /*this.apple.on('dragstart', () => {
        this.apple.disableBody(true, false); // Freeze physics during drag
    });*/
    this.apple.on('dragstart', () => {
      this.registry.values[this.triesDataKey] += 1;
      this.currentScore++; 


      this.isDragging = true;
      this.recordDragPosition(this.apple.x, this.apple.y);

      this.dragInterval = this.time.addEvent({
        delay: 100,
        callback: () => this.recordDragPosition(this.apple.x, this.apple.y),
        callbackScope: this,
        loop: true
      });

    });

    this.apple.on('drag', (pointer: Pointer) => {
        this.apple.x = pointer.x;
        this.apple.y = pointer.y;
    });

    this.apple.on('dragend', () => {
      this.physics.world.enableBody(this.apple);
        //this.apple.setGravityY(300); // Fall speed

        this.apple.disableInteractive();

      this.apple.disableInteractive();

      this.recordDragPosition(this.apple.x, this.apple.y);
        this.isDragging = false;
        if (this.dragInterval) {
          this.dragInterval.destroy();
          this.dragInterval = undefined;
        }

        const dragPath = [...this.dragPositions];
        console.log("Full drag path:", dragPath);

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
