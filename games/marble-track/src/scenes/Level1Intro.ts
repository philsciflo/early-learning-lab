import { MarbleTrackScene } from "./MarblesTrackScene";
import { BLACK, gameAreaWidth, gameAreaX, gameAreaY} from "../constants";
import { Level1IntroScoringData } from "../scoring.ts";

export class Level1Intro extends MarbleTrackScene<Level1IntroScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private stuckMarble!: Phaser.Physics.Matter.Image;

  constructor() {
    super(
      "Level1Intro",
      '"Marbles Track" - Level 1 (Intro)',
      "Watch the marble reach the goal!",
      "Level0",
      "Level1",
      true
    );
  }

  // Initialize the scene
  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.setupTrack();
    this.setupBowl(gameAreaX + 230,gameAreaY + 145);
    this.setupMidBowlWithMarble();
    this.setupFlag();
    this.setupBounds();
    this.setupDropMarble();
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
  }


  private setupMidBowlWithMarble() {
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

    this.stuckMarble = this.matter.add.image(517.29, 472 , "marble")
      .setScale(0.06)

      .setCircle(25)
      .setFriction(0.02)
      .setBounce(0.25)
      .setFrictionStatic(0.2)
      .setStatic(true)
      .setMass(5)
      .setFrictionAir(0.001)
      .setDepth(2);
      (this.stuckMarble.body as MatterJS.BodyType).label = "dropMarble";

    this.time.delayedCall(100, () => {
      this.stuckMarble.setStatic(false);
    });
  }

  private setupDropMarble() {
    const boxX = gameAreaX - 320;
    const boxY = gameAreaY - 140;
    const dropX = boxX;
    const dropY = boxY;
    const boxWidth = 75;
    const boxHeight = 60;

    // Add Drop ball
    this.dropMarble = this.matter.add.image(dropX, dropY, "marble2")
      .setScale(0.06)
      .setCircle(25)
      .setFriction(0.05)
      .setBounce(0.25)
      .setFrictionStatic(0.1)
      .setStatic(true)
      .setDepth(2);

    this.setupBox(boxX,boxY,boxWidth,boxHeight);
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
  private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
    this.dropClickTime = Date.now();
    this.time.delayedCall(100, () => {
      this.releaseMarble(this.dropMarble, 8,0.01);
      this.rotateLidWithCollider(this.lidCollider);
    });
  }
}
