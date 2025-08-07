import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BLUE, BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import Point = Phaser.Geom.Point;
import { Level3ScoringData } from "../scoring.ts";
import { renderVerticalPipe, setupForkedPipe, setupTripleForkedPipe } from "../pipes.ts";

export class Level3 extends AbstractCatcherScene<Level3ScoringData> {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;
  private dropInterval: number;
  private isDragging: boolean = false;
  private dragInterval?: Phaser.Time.TimerEvent;

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
    this.setupBasket();
    this.setupApple();
    setupTripleForkedPipe(this, HALF_WIDTH, this.apple, true);
    this.addCollisionHandling(this.basket, this.apple);
    this.dragPositions = [];
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.resetBasket();
    this.resetApple();
    this.registry.set(`${this.name}-startTime`, Date.now());
    this.dragPositions = [];
  }

  protected recordScoreDataForCurrentTry(): Level3ScoringData {
    const startTime = this.registry.get(`${this.name}-startTime`);
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : 0;
    return {
      tries: 
        this.registry.get(this.triesDataKey),
      basketPath: this.dragPositions,
      score: this.currentScore > 0 ? 1 : 0,
      duration: duration,
    };
  }

 private renderThreeForkedPipe() {
    const pipeX = HALF_WIDTH;  // center X
    const pipeY = 220;         // align top Y
    const pipeImage = this.add.image(pipeX, pipeY, "pipe3");
    pipeImage.setOrigin(0.5, 0);
    pipeImage.setScale(0.8);
  }

  private setupBasket() {
    this.basket = this.physics.add
      .staticSprite(HALF_WIDTH, BASKET_BOTTOM, "basket")
      .setInteractive({ draggable: true })
      .setScale(1.3,1);
      this.basket.on('dragstart', () => {
      
        this.isDragging = true;
  
        this.recordDragPosition(this.basket.x, this.basket.y);
        
        this.dragInterval = this.time.addEvent({
          delay: 500,
          callback: () => this.recordDragPosition(this.basket.x, this.basket.y),
          callbackScope: this,
          loop: true
        });
      });
  
      this.basket.on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
          this.basket.setPosition(dragX, dragY);
          this.basket.refreshBody();
        });
      
      this.basket.on('dragend', () => {
        this.dragPositions.push({
          x: Math.round(this.basket.x),
          y: Math.round(this.basket.y),
          time: Date.now() - this.registry.get(`${this.name}-startTime`)
        });
          this.isDragging = false;
          if (this.dragInterval) {
            this.dragInterval.destroy();
            this.dragInterval = undefined;
          }
  
          const dragPath = [...this.dragPositions];
          console.log("Full drag path:", dragPath);
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
