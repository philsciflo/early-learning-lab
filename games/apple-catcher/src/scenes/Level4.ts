import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { ForkedPipe, renderVerticalPipe, setupForkedPipe } from "../pipes.ts";
import Zone = Phaser.GameObjects.Zone;
import { Level4ScoringData } from "../scoring.ts";

type PipeLayoutOption = 0 | 1;

export class Level4 extends AbstractCatcherScene<Level4ScoringData> {
  private readonly verticalPipeLocations = [HALF_WIDTH - 190, HALF_WIDTH + 135];
  private readonly forkedPipeLocations = [HALF_WIDTH + 200, HALF_WIDTH - 50];
  /**
   * Index into the possible pipe locations
   */
  private pipeLayout: PipeLayoutOption = 0;
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;
  private appleInValidStartingPosition: boolean;
  private firstAppleImage: Phaser.GameObjects.Image;
  private firstAppleZone: Phaser.GameObjects.Zone;
  private secondAppleImage: Phaser.GameObjects.Image;
  private secondAppleZone: Phaser.GameObjects.Zone;
  private verticalPipe: Phaser.GameObjects.Image;
  private forkedPipe: ForkedPipe;

  constructor() {
    super(
      "Level4",
      '"Apple Catcher" - Level 4',
      "Place the basket and apple to catch the apple!",
      "Level3",
      "GameOver",
    );
  }

  preload() {
    super.preload();
    this.load.image("apple-background", "assets/apple-background.png");
  }

  create() {
    super.create();

    this.pickPipeLayoutOption();
    this.setupAppleStartingPositions();
    this.setupBasket();
    this.setupApple();
    this.setupPipes();

    this.addCollisionHandling(this.basket, this.apple);
  }

  private pickPipeLayoutOption() {
    this.pipeLayout = Phaser.Math.RND.integerInRange(0, 1) as PipeLayoutOption;
  }

  protected canDrop(): boolean {
    return this.appleInValidStartingPosition;
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.basket.disableInteractive();
    this.apple.disableInteractive();
  }

  protected doReset(): void {
    this.pickPipeLayoutOption();
    this.resetBasket();
    this.resetApple();
    this.resetAppleStartingPositions();
    this.resetPipes();
  }

  private setupPipes() {
    this.verticalPipe = renderVerticalPipe(
      this,
      this.verticalPipeLocations[this.pipeLayout],
      true,
    );
    this.forkedPipe = setupForkedPipe(
      this,
      this.forkedPipeLocations[this.pipeLayout],
      this.apple,
      true,
    );
    this.resetPipes();
  }

  private resetPipes() {
    this.verticalPipe.setX(this.verticalPipeLocations[this.pipeLayout]);
    this.forkedPipe.setX(this.forkedPipeLocations[this.pipeLayout]);
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
      pipeLayout: this.pipeLayout,
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
        this.appleInValidStartingPosition = true;
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
    this.appleInValidStartingPosition = false;
  }

  private setupAppleStartingPositions() {
    const verticalPipeAppleLocationCenter =
      this.verticalPipeLocations[this.pipeLayout];
    this.firstAppleImage = this.add.image(
      verticalPipeAppleLocationCenter,
      APPLE_TOP,
      "apple-background",
    );
    this.firstAppleZone = this.add
      .zone(verticalPipeAppleLocationCenter, APPLE_TOP, 50, 50)
      .setRectangleDropZone(70, 70);

    const forkedPipeAppleStartingLocation =
      this.forkedPipeLocations[this.pipeLayout] - 75;
    this.secondAppleImage = this.add.image(
      forkedPipeAppleStartingLocation,
      APPLE_TOP,
      "apple-background",
    );
    this.secondAppleZone = this.add
      .zone(forkedPipeAppleStartingLocation, APPLE_TOP, 50, 50)
      .setRectangleDropZone(70, 70);
  }

  private resetAppleStartingPositions() {
    const verticalPipeAppleLocationCenter =
      this.verticalPipeLocations[this.pipeLayout];
    this.firstAppleImage.setX(verticalPipeAppleLocationCenter);
    this.firstAppleZone.setX(verticalPipeAppleLocationCenter);

    const forkedPipeAppleStartingLocation =
      this.forkedPipeLocations[this.pipeLayout] - 75;
    this.secondAppleImage.setX(forkedPipeAppleStartingLocation);
    this.secondAppleZone.setX(forkedPipeAppleStartingLocation);
  }
}
