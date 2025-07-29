import { MarbleTrackScene } from "./MarblesTrackScene";
import { BLACK, WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants";
import { Level1ScoringData } from "../scoring.ts";

export class Level1 extends MarbleTrackScene<Level1ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private dragMarble!:Phaser.Physics.Matter.Image;
  private dot!:Phaser.Physics.Matter.Image;

  private isDragging = false;
  private dragStartTime = 0;
  private dragInterval?: Phaser.Time.TimerEvent;

  constructor() {
    super(
      "Level1",
      '"Marbles Track" - Level 1 (test)',
      "Help the marble reach the goal!",
      "Level1Intro",
      "Level2Intro",
      true
    );
    this.maxDropCount = 2;
  }

  // Initialize the scene
  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.setupTrack();
    this.setupBowl(gameAreaX + 230,gameAreaY + 145);
    this.setupMidBowl();
    this.setupFlag();
    this.setupBounds();
    this.setupDropMarble();
    this.setupDragMarble()
    this.setupButtons();
  }

  // Create track segments with different angles and positions
  private setupTrack() {
    const segmentWidth = 200;
    const angleDeg = 15;
    const angleRad = Phaser.Math.DegToRad(angleDeg);
    const slope = Math.tan(angleRad);
    const gap = 90;
  
    // Left track segment (starting point)
    const leftX = gameAreaX - 200;
    const leftY = gameAreaY + 40;
  
    this.createTrack(segmentWidth,angleDeg,leftX, leftY);
  
    // Right track segment
    const rightX = leftX + segmentWidth + gap;
    const rightY = leftY + slope * (rightX - leftX);
  
    this.createTrack(segmentWidth,angleDeg,rightX, rightY);
    this.dot = this.matter.add.image(gameAreaX + 10, gameAreaY + 80, "logBall")
    .setScale(0.08)       
    .setCircle(15)         
    .setStatic(true)
    .setBounce(0.2)
    .setFriction(0.05)
    .setVisible(false);

    const dot2 = this.matter.add.image(gameAreaX + 280, gameAreaY + 130, "logBall")
    .setScale(0.08)       
    .setCircle(15)         
    .setStatic(true)
    .setBounce(0.2)
    .setFriction(0.05)
    .setVisible(false);
  }

  private setupMidBowl() {
    const bowlX = gameAreaX - 60;
    const bowlY = gameAreaY + 92;
    const bowlRadius = 60;

    const bowlImage = this.add.image(bowlX, bowlY, 'bowl');
    bowlImage.setOrigin(0.5, 0.5);
    bowlImage.setScale(0.1);
    bowlImage.setRotation(Phaser.Math.DegToRad(15));

    const arcLength = Math.PI * bowlRadius;
    const segments = Math.floor(arcLength / 20);
    const parts: MatterJS.BodyType[] = [];

    const rotateDegrees = -12;
    const rotateRadians = Phaser.Math.DegToRad(rotateDegrees);

    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI - (i * Math.PI/ 1.4) / segments;
      const rotatedAngle = angle + rotateRadians;
      const x = bowlX + 10 + bowlRadius * Math.cos(rotatedAngle);
      const y = bowlY - 32 + bowlRadius * Math.sin(rotatedAngle)*0.8; 
      const circle = this.matter.bodies.circle(x, y, 5, {
        isStatic: true,
        friction: 0.01,
      });
      parts.push(circle);
    }

    const compoundBody = this.matter.body.create({ parts, isStatic: true });
    this.matter.world.add(compoundBody);
  }

  private setupDropMarble() {
    this.boxX = gameAreaX - 320;
    this.boxY = gameAreaY - 140;
    const dropX = this.boxX;
    const dropY = this.boxY;
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

    this.setupBox(this.boxX,this.boxY,boxWidth,boxHeight);
  }

  private setupButtons() {
    const buttonX = gameAreaX + gameAreaWidth / 2 - 80;
    const resetY = gameAreaY - 100;
    const dropY = resetY + 60;
  }

  private setupFlag() {
    const flag = this.add.image(gameAreaX + 280, gameAreaY + 120, "flag");
    flag.setScale(0.1);
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
      this.dot.setCollisionCategory(0);
      this.dot.setCollidesWith(0);
      this.time.delayedCall(100, () => {
        this.releaseMarble(this.dragMarble, 18, 0.01);
        this.rotateLidWithCollider(this.lidCollider);
      });
    } else {
      this.dropCount -= 1;
    }
  }
}


}


