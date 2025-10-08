import { MarbleTrackScene } from "./MarblesTrackScene.ts";
import { WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants.ts";
import { Level2ScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 

export class Level2 extends MarbleTrackScene<Level2ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private dragMarble!:Phaser.Physics.Matter.Image;

  private isDragging = true;
  private dragStartTime = 0;
  private nextRecordTime = 0;

  private dragInterval?: Phaser.Time.TimerEvent;

  constructor() {
    super(
      "Level2", 
      '"Marbles Track" - Level 2 (test)',
      "Help the marble reach the goal!",
      "Level2Intro",
      "Level3Intro",
      true
    );
    this.maxDropCount = 2;
  }

  // Initialize the scene
  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.boxX = gameAreaX - 450;
    this.boxY = gameAreaY - 175;
    this.setupTrack();
    //this.setupDraggableTracks();
    this.setupHouse(gameAreaX + 185,gameAreaY + 175);
    this.setupBounds();
    this.setupDropMarble(this.boxX,this.boxY);
    this.setupDragMarble()
    this.createFunnel(gameAreaX - 370,gameAreaY - 15);
    this.setupButtons();
  }
  
  // Sets up the track which the marble rolls down
  private setupTrack(){
    this.createWideTube(500, 196, gameAreaX-100, gameAreaY+105);
    // Add a dot in the middle of the track to stuck the marble
    const dot = this.matter.add.image(gameAreaX + 20, gameAreaY + 170, "logBall")
      .setScale(0.08)  
      .setDepth(2)     
      .setCircle(15)         
      .setStatic(true)
      .setBounce(0.2)
      .setFriction(0.05);
  }

  private createWideTube(length: number, angle: number, x: number, y: number): Phaser.Physics.Matter.Image {
    const height = 10;
    const offset = 45;

    const top = this.matter.add.image(x, y - offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    const bottom = this.matter.add.image(x, y + offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    // --- main ---
    const main = this.matter.add.image(x, y, "tighttube")
        .setDisplaySize(length + 10, offset * 2 + 20)
        .setAngle(angle)
        .setDepth(1)
        .setStatic(true);

    // --- air mode ---
    main.setSensor(true); 

    // --- overlay ---
    const overlay = this.add.image(x, y, "tighttube")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAlpha(0.5)
        .setDepth(5);

    (main as any).overlay = overlay;
    (main as any).children = [top, bottom];

    // --- top/bottom and overlay ---
    (main as any).syncChildren = () => {
        const rad = Phaser.Math.DegToRad(main.angle);
        const sin = Math.sin(rad);
        const cos = Math.cos(rad);

        const children = (main as any).children as Phaser.Physics.Matter.Image[];
        const offsetsArr = [-offset, offset];
        

        children.forEach((child, i) => {
            const ox = offsetsArr[i] * -sin;
            const oy = offsetsArr[i] * cos;
            const angleOffset = (i === 0 ? -1 : 1) * Phaser.Math.DEG_TO_RAD;

            Body.setPosition(child.body as Body, { x: main.x + ox, y: main.y + oy });
            Body.setAngle(child.body as Body, rad - angleOffset);
        });

        if ((main as any).overlay) {
            (main as any).overlay.setPosition(main.x, main.y);
            (main as any).overlay.setAngle(main.angle);
        }
    };

    (main as any).syncChildren();
    return main;
}


private setupDropMarble(X: number, Y: number) {
  const dropX = X;
  const dropY = Y;
  const boxWidth = 75;
  const boxHeight = 60;

  // Add drop ball
  this.dropMarble = this.matter.add.image(dropX, dropY, "marble")
    .setScale(0.06)
    .setCircle(25)
    .setFriction(0.02)
    .setBounce(0.25)
    .setFrictionStatic(0.5)
    .setStatic(true)
    .setFrictionAir(0.001)
    .setDepth(2);
    (this.dropMarble.body as MatterJS.BodyType).label = "dropMarble";

  this.setupBox(X,Y,boxWidth,boxHeight);
}

private setupDragMarble() {
  // Display green box
  this.add
    .rectangle(gameAreaX + gameAreaWidth / 2 - 60, gameAreaY + gameAreaHeight / 2 - 60, 90, 90, WHITE)
    .setStrokeStyle(5, GREEN);

  this.dragMarble = this.matter.add
  .image(
    gameAreaX + gameAreaWidth / 2 - 60,
    gameAreaY + gameAreaHeight / 2 - 60,
    "marble2"
  )
  .setScale(0.06)
  .setCircle(25)
  .setFriction(0.05)
  .setBounce(0.25)
  .setFrictionStatic(0.1)
  .setStatic(true) 
  .setInteractive()
  .setDepth(2)

  .on('dragstart', () => {
    console.log("Drag started");
    this.isDragging = true;
    this.dragStartTime = Date.now();
    this.dragPositions = [];
    //initial position
    this.dragPositions.push({
      x: Math.round(this.dragMarble.x),
      y: Math.round(this.dragMarble.y),
      time: 0
    });
    
    // Set up interval to record every second
    this.dragInterval = this.time.addEvent({
      delay: 500, // 1 second
      callback: () => this.recordDragPosition(this.dragMarble, this.isDragging),
      callbackScope: this,
      loop: true
    });
  })
  .on('dragend', () => {
    this.recordDragPosition(this.dragMarble, this.isDragging);
    (this as any).dragPositions = this.dragPositions;
    console.log("Drag ended");
    this.isDragging = false;
    if (this.dragInterval) {
      this.dragInterval.destroy();
    }
    

    // Log all recorded positions
    console.log("Full drag path:", this.dragPositions);
  });

  this.handleDrag(
    this.boxX, 
    this.boxY, 
    this.dragMarble,
    () => this.recordDragPosition(this.dragMarble,this.isDragging)
  );
}


private setupButtons() {
  const buttonX = gameAreaX + gameAreaWidth / 2 - 80;
  const resetY = gameAreaY - 100;
  const dropY = resetY + 60;



}

private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
  if (this.dropCount === 0) {
    this.dropClickTime = Date.now();
    this.time.delayedCall(100, () => {
      this.releaseMarble(this.dropMarble, 5, 0.02);
      this.rotateLidWithCollider(this.lidCollider);
    });
  } else if (this.dropCount === 1) {
    if (this.isDragMarbleSnapped) {
      this.secondDropClickTime = Date.now();
      this.time.delayedCall(100, () => {
        this.releaseMarble(this.dragMarble, 25, 0.01);
        this.rotateLidWithCollider(this.lidCollider);
      });
    } else {
      this.dropCount -= 1;
    }
  }
}

}
