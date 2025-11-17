import { MarbleTrackScene } from "./MarblesTrackScene.ts";
import { WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants.ts";
import { Level2IntroScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 

export class Level2Intro extends MarbleTrackScene<Level2IntroScoringData> {
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
    this.boxX = gameAreaX - 450;
    this.boxY = gameAreaY - 175;
    this.setupTrack();
    this.setupHouse(gameAreaX + 185,gameAreaY + 175);
    this.setupBounds();
    this.setupDropMarble(this.boxX,this.boxY);
    this.createFunnel(gameAreaX - 370,gameAreaY - 15);
    this.setupButtons();
  }
  
  // Sets up the track which the marble rolls down
  private setupTrack(){
    this.createWideTube(500, 196, gameAreaX-100, gameAreaY+105);
    this.stuckMarble = this.matter.add.image(563.2, 541.5 , "marble")
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

    // air mode
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

private setupDropMarble(boxX: number, boxY: number) {
  const dropX = boxX;
  const dropY = boxY;
  const boxWidth = 75;
  const boxHeight = 60;

  // Add Drop ball
  this.dropMarble = this.matter.add.image(dropX, dropY, "marble2")
    .setScale(0.06)
    .setCircle(25)
    .setFriction(0.5)
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

private lidCollider?: MatterJS.BodyType;
protected override onDropPressed() {
  this.dropClickTime = Date.now();
  this.time.delayedCall(100, () => {
    this.releaseMarble(this.dropMarble, 8,0.01);
    this.rotateLidWithCollider(this.lidCollider);
  });
}

}
