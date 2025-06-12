import { APPLE_TOP, BASKET_BOTTOM, HALF_WIDTH } from "../constants.ts";
import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import Pointer = Phaser.Input.Pointer;
import Body = Phaser.Physics.Arcade.Body;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { CaughtAppleCount, Level0ScoringData } from "../scoring.ts";

export class Level0Drop extends AbstractCatcherScene<Level0ScoringData> {
  private baskets: SpriteWithStaticBody[] = [];
  private apples: SpriteWithDynamicBody[] = [];
  // a reference to the Interval controlling the apple dropping
  private dropInterval: number;
  private isDragging = false;
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
    this.baskets.forEach((basket) => {
    this.addCollisionHandling(basket, this.apples); 
  });
    this.hideDropButton = true;
  }

  protected doReset() {
    this.resetApples();

  }

  protected recordScoreDataForCurrentTry(): Level0ScoringData {
    return {
      score:
        this.currentScore > 0 ? (this.currentScore as CaughtAppleCount) : 0,
    };
  }

  private setupBaskets() {
  this.baskets = [];
  
  // Positions for 5 baskets (evenly spaced)
  const basketPositions = [
    HALF_WIDTH - 200, // Left-most basket
    HALF_WIDTH - 100,
    HALF_WIDTH,       // Center basket
    HALF_WIDTH + 100,
    HALF_WIDTH + 200  // Right-most basket
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
        { x: this.rightTreeLeft + 100, y: 455 },  // Lower middle
        { x: this.rightTreeLeft + 72, y: 415 },  // Left side
        { x: this.rightTreeLeft + 128, y: 415 },  // Right side
        { x: this.rightTreeLeft + 76, y: 375 },  // Upper left
        { x: this.rightTreeLeft + 124, y: 375 }   // Upper right
    ];
    for (let appleCount = 0; appleCount < 5; appleCount++) {
        const apple = this.physics.add
            .sprite(
                applePositions[appleCount].x,  // X from pre-defined positions
                applePositions[appleCount].y,  // Y from pre-defined positions
                "apple"
            )
            .setDisplaySize(44, 44)
            .setCollideWorldBounds(true)
            .setInteractive({ draggable: true })
            .disableBody();

        apple.on('dragstart', () => {
            apple.disableBody(true, false);
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
        { x: this.rightTreeLeft + 100, y: 455 },  
        { x: this.rightTreeLeft + 72, y: 415 },  
        { x: this.rightTreeLeft + 128, y: 415 }, 
        { x: this.rightTreeLeft + 76, y: 375 },  
        { x: this.rightTreeLeft + 124, y: 375 }
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
}
