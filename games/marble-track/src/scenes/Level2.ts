import { MarbleTrackScene } from "./MarblesTrackScene";
import {WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants";
import { Level2ScoringData } from "../scoring.ts";

export class Level2 extends MarbleTrackScene<Level2ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private dragMarble!:Phaser.Physics.Matter.Image;

  private isDragging = false;
  private dragStartTime = 0;
  private dragInterval?: Phaser.Time.TimerEvent;

  constructor() {
    super(
      "Level2",
      '"Marbles Track" - Level 2 (Test)',
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
    this.setupTrack();
    this.setupFlag();
    this.setupBounds();
    this.setupBowl(gameAreaX - 300,gameAreaY + 195);
    this.setupDropMarble();
    this.setupDragMarble();
    this.setupButtons();
  }

  // Create track segments with different angles and positions
  private setupTrack() {
    this.createTrack(600, 4, gameAreaX - 100, gameAreaY - 40); //leftTrack
    this.createTrack(220, -8, gameAreaX - 150, gameAreaY + 180); //MidTrack
    this.createTrack(400, -15, gameAreaX + 150, gameAreaY + 90); //upperTrack
  
    // Add a dot in the middle of the track to stuck the marble
    const dot = this.matter.add.image(gameAreaX + 60, gameAreaY + 100, "logBall")
      .setScale(0.08)       
      .setCircle(15)         
      .setStatic(true)
      .setBounce(0.2)
      .setFriction(0.05);
    
  }
  
  private setupDropMarble() {
    this.boxX = gameAreaX - 370;
    this.boxY = gameAreaY - 160;
    const dropX = this.boxX;
    const dropY = this.boxY;
    const boxWidth = 75;
    const boxHeight = 60;

    // Add Drop ball
    this.dropMarble = this.matter.add.image(dropX, dropY, "marble")
      .setScale(0.06)
      .setCircle(25)
      .setBounce(0.3)
      .setStatic(true)
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
    const flag = this.add.image(gameAreaX - 320, gameAreaY + 170, "flag");
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
    .setBounce(0.3)
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
        delay: 500, // 0.5 second
        callback: () => this.recordDragPosition(this.dragMarble, this.isDragging),
        callbackScope: this,
        loop: true
      });
    })
    .on('dragend', () => {
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
      () => this.recordDragPosition(this.dragMarble, this.isDragging)
    );
  }
  
  private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
    if (this.dropCount === 0) {
      this.releaseMarble(this.dropMarble, 4.7,0.01);
      this.dropClickTime = Date.now();
    } else if (this.dropCount === 1) {
      if (this.isDragMarbleSnapped) {
        this.secondDropClickTime = Date.now();
        this.releaseMarble(this.dragMarble, 25,0.05);
      } else {
        this.dropCount -= 1;
      }
    }
    this.rotateLidWithCollider(this.lidCollider);
  }
}