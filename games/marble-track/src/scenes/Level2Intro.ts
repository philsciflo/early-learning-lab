import { MarbleTrackScene } from "./MarblesTrackScene";
import {gameAreaWidth, gameAreaX, gameAreaY } from "../constants";
import { Level2IntroScoringData } from "../scoring.ts";

export class Level2Intro extends MarbleTrackScene<Level2IntroScoringData>{
  private dropMarble!: Phaser.Physics.Matter.Image;
  private stuckMarble!: Phaser.Physics.Matter.Image;
  
  constructor() {
    super(
      "Level2Intro",
      '"Marbles Track" - Level 2 (Intro)',
      "Watch the marble reach the goal!",
      "Level1",
      "Level2",
      true
    );
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
    this.setupStuckMarble()
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
    const boxX = gameAreaX - 370;
    const boxY = gameAreaY - 160;
    const dropX = boxX;
    const dropY = boxY;
    const boxWidth = 75;
    const boxHeight = 60;

    // Add Drop ball
    this.dropMarble = this.matter.add.image(dropX, dropY, "marble2")
      .setScale(0.06)
      .setCircle(25)
      .setFriction(0.05)
      .setBounce(0.3)
      .setFrictionStatic(0.5)
      .setStatic(true)
      .setDepth(2)
      .setFrictionAir(0.001);

    this.setupBox(boxX,boxY,boxWidth,boxHeight);
  }

  private setupStuckMarble() {
      this.stuckMarble = this.matter.add.image(666.71, 468.89, "marble")
      .setScale(0.06)
      .setCircle(25)
      .setMass(4.7)
      .setFriction(0.01)
      .setBounce(0.3)
      .setFrictionStatic(0.5)
      .setFrictionAir(0.001)
      .setDepth(2);
      (this.stuckMarble.body as MatterJS.BodyType).label = "dropMarble";
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
  private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
    this.dropClickTime = Date.now();
    this.releaseMarble(this.dropMarble, 25,0.05);
    this.rotateLidWithCollider(this.lidCollider);
  }
}