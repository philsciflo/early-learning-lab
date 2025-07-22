import { MarbleTrackScene } from "./MarblesTrackScene";
import {WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants";
import { Level4ScoringData } from "../scoring.ts";


export class Level4 extends MarbleTrackScene<Level4ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private dragBox!:Phaser.Physics.Matter.Image;

  private isDragging = false;
  private dragStartTime = 0;
  private dragInterval?: Phaser.Time.TimerEvent;

  constructor() {
    super(
      "Level4",
      '"Marbles Track" - Level 4 (Test)',
      "Help the marble reach the goal!",
      "Level3",
      "GameOver",
      true
    );
  }

  // Initialize the scene
  override create(): void {
    this.matter.world.drawDebug = true;
    super.create();
    this.setupTrack();
    this.setupFlag();
    this.setupBounds();
    this.setupBowl(gameAreaX - 300,gameAreaY + 195);
    this.setupDropMarble();
    this.setupDragBox();
    this.setupButtons();
  }

  // Create track segments with different angles and positions
  private setupTrack() {
    this.createTrack(100, 4, gameAreaX - 320, gameAreaY - 85); //UpperTrack
    this.createTrack(400, 8, gameAreaX - 80, gameAreaY - 10); //leftTrack
    this.createTrack(220, -8, gameAreaX - 150, gameAreaY + 180); //MidTrack
    this.createTrack(300, -15, gameAreaX + 120, gameAreaY + 90); //upperTrack
  
    
    
  }
  
  private setupDropMarble() {
    this.boxX = gameAreaX - 370;
    this.boxY = gameAreaY - 180;
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

  private setupDragBox() {
    this.dragBox = this.matter.add
    .image(
      gameAreaX + gameAreaWidth / 2 - 300,
      this.boxY,
      "box"
    )
    .setScale(0.12)
    .setRectangle(120, 100)
    .setFriction(0.05)
    .setBounce(0.1)
    .setFrictionStatic(0.1)
    .setStatic(true) 
    .setDepth(2);
  }

  private enableBoxDragging() {
    this.dragBox.setInteractive();
  
    this.dragBox
      .on('dragstart', () => {
        console.log("Drag started");
        this.isDragging = true;
        this.dragStartTime = Date.now();
        this.dragPositions = [];
  
        this.dragPositions.push({
          x: Math.round(this.dragBox.x),
          y: Math.round(this.dragBox.y),
          time: 0
        });
  
        this.dragInterval = this.time.addEvent({
          delay: 500,
          callback: () => this.recordDragPosition(this.dragBox, this.isDragging),
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
  
        console.log("Full drag path:", this.dragPositions);
      });
  
    this.handleDrag(
      this.boxX,
      this.boxY,
      this.dragBox,
      () => this.recordDragPosition(this.dragBox, this.isDragging)
    );
  }
  
  private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
    this.releaseMarble(this.dropMarble, 10,0.05);
    this.releaseBox(this.dragBox, 50,0.05);
    this.rotateLidWithCollider(this.lidCollider);
    this.time.delayedCall(1000, () => {
      this.enableBoxDragging();
    });
  }
}