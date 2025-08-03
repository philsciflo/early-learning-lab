import { MarbleTrackScene } from "./MarblesTrackScene";
import {gameAreaWidth, gameAreaX, gameAreaY} from "../constants";
import { Level3IntroScoringData } from "../scoring.ts";
export class Level3Intro extends MarbleTrackScene<Level3IntroScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;

  constructor() {
    super(
      "Level3Intro",
      '"Marbles Track" - Level 3 (Intro)',
      "Watch the marble reach the goal!",
      "Level2",
      "Level3",
      true
    );
    this.maxDropCount = 1;
  }

  // Initialize the scene
  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.setupTrack();
    this.setupBowl(gameAreaX - 400, gameAreaY + 209);
    this.setupFlag();
    this.setupBounds();
    this.setupDropMarble();
    this.setupButtons();
  }

  // Create track segments with different angles and positions
  private setupTrack() {
    this.createTrack(450, 6, gameAreaX - 160, gameAreaY);
    this.createTrack(400, -8, gameAreaX - 160, gameAreaY+180);
    this.createTrack(200, -20, gameAreaX+150, gameAreaY+90);
  }

  private setupDropMarble() {
    const boxX = gameAreaX - 370;
    const boxY = gameAreaY - 160;
    const dropX = boxX;
    const dropY = boxY;
    const boxWidth = 75;
    const boxHeight = 60;

    this.dropMarble = this.matter.add.image(dropX, dropY, "marble")
      .setScale(0.06)
      .setCircle(25)
      .setFriction(0.05)
      .setBounce(0.5)
      .setFrictionStatic(0.5)
      .setStatic(true)
      .setDepth(2);
      (this.dropMarble.body as MatterJS.BodyType).label = "dropMarble";

    this.setupBox(boxX,boxY,boxWidth,boxHeight);
  }

  private setupButtons() {
    const buttonX = gameAreaX + gameAreaWidth / 2 - 80;
    const resetY = gameAreaY - 100;
    const dropY = resetY + 60;
  }

  private setupFlag() {
    const flag = this.add.image(gameAreaX - 420, gameAreaY + 180, "flag");
    flag.setScale(0.1);
  }
  private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
    this.dropClickTime = Date.now();
    this.releaseMarble(this.dropMarble, 25,0.05);
    this.rotateLidWithCollider(this.lidCollider);
  }
}
