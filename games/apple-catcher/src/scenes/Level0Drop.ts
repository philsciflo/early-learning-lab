import { APPLE_TOP, BASKET_BOTTOM, HALF_WIDTH } from "../constants.ts";
import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import Pointer = Phaser.Input.Pointer;
import Body = Phaser.Physics.Arcade.Body;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { CaughtAppleCount, Level0DropScoringData } from "../scoring.ts";

export class Level0Drop extends AbstractCatcherScene<Level0DropScoringData> {
  private baskets: SpriteWithStaticBody[] = [];
  private apples: SpriteWithDynamicBody[] = [];
  private tracks: Phaser.Physics.Arcade.Image[] = [];
  // a reference to the Interval controlling the apple dropping
  private dropInterval: number;
  private isDragging = false;
  private hasDraggedThisRound = false;

  private appleStartPositions: { x: number, y: number }[] = [];


  constructor() {
    super(
      "Level0Drop",
      '"Apple Drop" - Level 0',
      "Drop as many apples as you can into the baskets!",
      "MainMenu",
      "Level1Drop",
    );
    this.hideDropButton = true;
  }

  init() {
    super.init();
    this.events.once("shutdown", () => {
      clearInterval(this.dropInterval);
    });
  }

  create() {
    super.create();
    this.setupApples();
    this.setupBaskets();
    this.setupTracks();
    this.baskets.forEach((basket) => {
    this.addCollisionHandling(basket, this.apples); 
    this.hasDraggedThisRound = false;
  });
    this.hideDropButton = true;
  }

  protected doReset() {
    this.resetApples();
    this.hasDraggedThisRound = false;

    this.registry.set(`${this.name}-startTime`, Date.now());


  }


  protected recordScoreDataForCurrentTry(): Level0DropScoringData {
    const startTime = this.registry.get(`${this.name}-startTime`);
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : 0;

    return {
      tries: 
        this.registry.get(this.triesDataKey),
      score:
        this.currentScore > 0 ? (this.currentScore as CaughtAppleCount) : 0,
      duration: duration,
    };
  }

  private setupBaskets() {
  this.baskets = [];
  
  // Positions for 5 baskets (evenly spaced)
  const basketPositions = [
    HALF_WIDTH - 300, // Left-most basket
    HALF_WIDTH - 150,
    HALF_WIDTH,       // Center basket
    HALF_WIDTH + 150,
    HALF_WIDTH + 300  // Right-most basket
  ];

  basketPositions.forEach(xPos => {
    const basket = this.physics.add
      .staticSprite(xPos, BASKET_BOTTOM, "basket")
      .setScale(1.3,1);
    
    this.baskets.push(basket);
  });
}

private setupApples() {
    this.apples = [];

    const applePositions = [
        { x: this.rightTreeLeft + 100, y: this.treeY + 150 },  // Lower middle
        { x: this.rightTreeLeft + 72, y: this.treeY + 110 },  // Left side
        { x: this.rightTreeLeft + 128, y: this.treeY + 110 },  // Right side
        { x: this.rightTreeLeft + 76, y: this.treeY + 70 },  // Upper left
        { x: this.rightTreeLeft + 124, y: this.treeY + 70 }   // Upper right
    ];
    for (let appleCount = 0; appleCount < 5; appleCount++) {
        const apple = this.physics.add
            .sprite(
                applePositions[appleCount].x,  // X from pre-defined positions
                applePositions[appleCount].y,  // Y from pre-defined positions
                "apple"
            )
            .setDisplaySize(44, 44)
            .setSize(70, 70)
            .setCollideWorldBounds(true)
            .setInteractive({ draggable: true })
            .disableBody();

        apple.on('dragstart', () => {
            apple.disableBody(true, false);
            if (!this.hasDraggedThisRound) {
              this.registry.values[this.triesDataKey] += 1;
              this.currentScore++; 
              this.hasDraggedThisRound = true;
            }
        });

        apple.on('drag', (pointer: Pointer) => {
            apple.x = pointer.x;
            apple.y = pointer.y;
        });

        apple.on('dragend', () => {
            apple.enableBody(true, apple.x, apple.y, true, true);
            apple.setGravityY(300); // Fall speed
            apple.setInteractive({ draggable: false });
        });
        this.apples.push(apple);
    }

}

private resetApples() {
    const applePositions = [
      { x: this.rightTreeLeft + 100, y: this.treeY + 150 }, 
      { x: this.rightTreeLeft + 72, y: this.treeY + 110 }, 
      { x: this.rightTreeLeft + 128, y: this.treeY + 110 }, 
      { x: this.rightTreeLeft + 76, y: this.treeY + 70 }, 
      { x: this.rightTreeLeft + 124, y: this.treeY + 70 }
    ];

    this.apples.forEach((apple, index) => {
        apple.disableBody(true, false); // Turn off physics
        apple.body.reset(
            applePositions[index].x, // Original X position
            applePositions[index].y  // Original Y position
        );
        apple.setGravityY(0); // Remove gravity
        apple.setInteractive({ draggable: true }); // Make draggable again
        apple.setVisible(true);
        apple.setActive(true);
    });
}
protected doDrop() {
  // No drop action in Level0Drop; apples are manually dragged
}
private setupTracks(){
  
  const track1 = this.createTrack(180,150,640);
  const track2 = this.createTrack(80,350,640);
  const track3 = this.createTrack(80,500,640);
  const track4 = this.createTrack(80,650,640);
  const track5 = this.createTrack(80,800,640);
  const track6 = this.createTrack(180,1000,640);

  this.tracks.push(track1,track2,track3,track4,track5,track6);


  this.apples.forEach((apple) => {
    this.tracks.forEach((track) => {
      this.physics.add.collider(apple, track);
    });
  });
}
private createTrack(
  length: number,
  x: number,
  y: number
): Phaser.Physics.Arcade.Image {
  const height = 20;
  const track = this.physics.add.staticImage(x, y, "log");
  track.setDisplaySize(length, height); 
  track.refreshBody(); 

  return track;
}
}
