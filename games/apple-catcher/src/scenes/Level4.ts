import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { renderVerticalPipe, setupForkedPipe } from "../pipes.ts";
import Zone = Phaser.GameObjects.Zone;
import { Level4ScoringData } from "../scoring.ts";

export class Level4 extends AbstractCatcherScene<Level4ScoringData> {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;

  constructor() {
    super(
      "Level4",
      '"Apple Catcher" - Level 4',
      "Place the basket and apple to catch the apple!",
      "Level3",
      "GameOver",
    );
  }

  private readonly verticalPipeCenter = HALF_WIDTH - 190;
  private readonly forkedPipeCenter = HALF_WIDTH + 135;

  preload() {
    super.preload();
    this.load.image("apple-background", "assets/apple-background.png");
  }

  create() {
    super.create();

    this.renderAppleStartingPositions();
    this.setupBasket();
    this.setupApple();

    renderVerticalPipe(this, this.verticalPipeCenter);
    setupForkedPipe(this, this.forkedPipeCenter, this.apple);

    this.addCollisionHandling(this.basket, this.apple);
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.basket.disableInteractive();
    this.apple.disableInteractive();
  }

  protected doReset(): void {
    this.resetBasket();
    this.resetApple();
  }

  protected recordScoreDataForCurrentTry(): Level4ScoringData {
    return {
      apple: {
        x: this.apple.x,
        y: APPLE_TOP,
      },
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
      .setCollideWorldBounds(true, 0, 0, true)
      .disableBody()
      .setInteractive({ draggable: true })
      .on("drag", (_pointer: never, dragX: number, dragY: number) => {
        // Move the apple when dragged
        this.apple.setPosition(dragX, dragY);
      })
      .on(
        "dragend",
        (_pointer: never, _dragX: number, _dragY: number, dropped: boolean) => {
          // Return the apple to where it came from if it was dropped outside one
          // of the target locations
          if (!dropped) {
            this.apple.x = this.apple.input?.dragStartX || 0;
            this.apple.y = this.apple.input?.dragStartY || 0;
          }
        },
      )
      .on("drop", (_pointer: never, dropZone: Zone) => {
        this.apple.x = dropZone.x;
        this.apple.y = dropZone.y;
      });
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
    this.apple.setInteractive();
  }

  private renderAppleStartingPositions() {
    this.add.image(this.verticalPipeCenter, APPLE_TOP, "apple-background");
    this.add
      .zone(this.verticalPipeCenter, APPLE_TOP, 50, 50)
      .setRectangleDropZone(70, 70);

    this.add.image(this.forkedPipeCenter, APPLE_TOP, "apple-background");
    this.add
      .zone(this.forkedPipeCenter, APPLE_TOP, 50, 50)
      .setRectangleDropZone(70, 70);
  }
}
