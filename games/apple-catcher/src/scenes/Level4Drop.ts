import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import { ForkedPipe, renderVerticalPipe, setupForkedPipe } from "../pipes.ts";
import Zone = Phaser.GameObjects.Zone;
import { Level4DropScoringData } from "../scoring.ts";

type PipeLayoutOption = 0 | 1;


export class Level4Drop extends AbstractCatcherScene<Level4ScoringData> {
export class Level4Drop extends AbstractCatcherScene<Level4DropScoringData> {

  private readonly verticalPipeLocations = [HALF_WIDTH - 190, HALF_WIDTH + 170];
  private readonly forkedPipeLocations = [HALF_WIDTH + 240, HALF_WIDTH - 70];
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
  private basket2: SpriteWithStaticBody;
  private isDragging: boolean = false;
  private dragInterval?: Phaser.Time.TimerEvent;

  constructor() {
    super(
      "Level4Drop",
      '"Apple Drop" - Level 4',
      "Place the basket and apple to catch the apple!",
      "Level3Drop",
      "GameOver",
    );
    this.hideDropButton = true;
  }

  preload() {
    super.preload();
    this.load.image("apple-background", "assets/apple-background.png");
    this.load.image("pipe4-1", "assets/pipe4-1.png");
    this.load.image("pipe4-2", "assets/pipe4-2.png");
  }

  create() {
    super.create();

    this.pickPipeLayoutOption();
    this.setupAppleStartingPositions();
    this.setupBasket();
    this.setupBasket2();
    this.setupApple();
    this.setupPipes();
    

    this.addCollisionHandling(this.basket, this.apple);
    this.addCollisionHandling(this.basket2, this.apple);
    this.dragPositions = [];
  }

  private pickPipeLayoutOption() {
    this.pipeLayout = Phaser.Math.RND.integerInRange(0, 1) as PipeLayoutOption;
  }

  protected canDrop(): boolean {
    return this.appleInValidStartingPosition;
  }

  protected doReset(): void {
    this.pickPipeLayoutOption();
    this.resetBasket();
    this.resetBasket2();
    this.resetApple();
    this.resetAppleStartingPositions();
    this.resetPipes();
    this.registry.set(`${this.name}-startTime`, Date.now());
    this.dragPositions = [];
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

  protected recordScoreDataForCurrentTry(): Level4DropScoringData {
    const startTime = this.registry.get(`${this.name}-startTime`);
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : 0;
    return {
      tries: 
        this.registry.get(this.triesDataKey),
      pipeLayout: this.pipeLayout,
      applePath: this.dragPositions,
      score: this.currentScore > 0 ? 1 : 0,
      duration: duration,
    };
  }

  private setupBasket() {
    this.basket = this.physics.add
      .staticSprite(this.verticalPipeLocations[this.pipeLayout], BASKET_BOTTOM, "basket")
      .setInteractive({ draggable: false })
      .setScale(1.3,1)
      .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
        this.basket.setPosition(dragX, dragY);
        this.basket.refreshBody();
      });
    this.resetBasket();
  }

  private resetBasket() {
    this.basket.setPosition(
      /*Phaser.Math.RND.pick([
        this.leftEdgeGameBound - 50,
        this.rightEdgeGameBound - 50,
      ]),*/
      this.verticalPipeLocations[this.pipeLayout],
      BASKET_BOTTOM,
    );
    this.basket.refreshBody();
    this.basket.setInteractive();
  }

  private setupBasket2() {
    this.basket2 = this.physics.add
      .staticSprite(HALF_WIDTH + 150, BASKET_BOTTOM, "basket")
      .setInteractive({ draggable: false })
      .setScale(1.3,1)
      .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
        this.basket2.setPosition(dragX, dragY);
        this.basket2.refreshBody();
      });
    this.resetBasket2();
  }

  private resetBasket2() {
    this.basket2.setPosition(
      Phaser.Math.RND.pick([
        this.forkedPipeLocations[this.pipeLayout] + 120,
        this.forkedPipeLocations[this.pipeLayout] - 270,
      ]),
      BASKET_BOTTOM,
    );
    this.basket2.refreshBody();
    this.basket2.setInteractive();
  }

  private setupApple() {
    const appleX = this.rightTreeLeft + 100;
    const appleY = this.treeY + 110;

    this.apple = this.physics.add
      .sprite(appleX, appleY, "apple")
      .setDisplaySize(50, 50)
      .setCollideWorldBounds(true, 0, 0, true)
      .disableBody();

    this.apple.setInteractive({ draggable: true });
    this.input.setDraggable(this.apple);

    this.apple.on('dragstart', () => {
      this.registry.values[this.triesDataKey] += 1;
      this.currentScore++; 

      this.isDragging = true;
      this.recordDragPosition(this.apple.x, this.apple.y);

      this.dragInterval = this.time.addEvent({
        delay: 500,
        callback: () => this.recordDragPosition(this.apple.x, this.apple.y),
        callbackScope: this,
        loop: true
      });

    });

    this.apple.on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
      this.apple.setPosition(dragX, dragY);
    });
    this.apple.on("dragend", () => {
      this.physics.world.enableBody(this.apple);
      this.apple.disableInteractive();

      this.recordDragPosition(this.basket.x, this.basket.y);
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

    const startX = this.rightTreeLeft + 100;
    const startY = this.treeY + 110;

    this.apple.body.reset(startX, startY);
    this.apple.setVisible(true);
    this.apple.setActive(true);
    this.apple.setInteractive();
    this.appleInValidStartingPosition = false;
  }

  private setupAppleStartingPositions() {
    const verticalPipeAppleLocationCenter =
      this.verticalPipeLocations[this.pipeLayout];
    
    this.firstAppleZone = this.add
      .zone(verticalPipeAppleLocationCenter, APPLE_TOP, 50, 50)
      .setRectangleDropZone(70, 70);

    const forkedPipeAppleStartingLocation =
      this.forkedPipeLocations[this.pipeLayout] - 75;
    
    this.secondAppleZone = this.add
      .zone(forkedPipeAppleStartingLocation, APPLE_TOP, 50, 50)
      .setRectangleDropZone(70, 70);
  }

  private resetAppleStartingPositions() {
    const verticalPipeAppleLocationCenter =
      this.verticalPipeLocations[this.pipeLayout];
    this.firstAppleZone.setX(verticalPipeAppleLocationCenter);

    const forkedPipeAppleStartingLocation =
      this.forkedPipeLocations[this.pipeLayout] - 75;
    this.secondAppleZone.setX(forkedPipeAppleStartingLocation);
  }

  protected doDrop(): void {
  }
}