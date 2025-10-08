import { MarbleTrackScene } from "./MarblesTrackScene";
import {gameAreaWidth, gameAreaX, gameAreaY} from "../constants";
import { Level3IntroScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 

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
    this.setupHouse(gameAreaX + 185,gameAreaY + 160);
    this.createFunnel(gameAreaX - 370,gameAreaY - 15);
    this.setupBounds();
    this.setupDropMarble();
    this.setupButtons();
  }

  // Create track segments with different angles and positions
  private setupTrack() {
    const wholeX = gameAreaX - 100
    const wholeY = gameAreaY + 105;
    this.createTube(180, 15, wholeX + 154.5, wholeY + 41.4);
    this.createTube(180, 15, wholeX - 154.5, wholeY - 41.4);
    this.createTube(130, 15, wholeX, wholeY);
  }

  private createTube(length: number, angle: number, x: number, y: number): Phaser.Physics.Matter.Image {
    const height = 10;
    const offset = 32;

    const top = this.matter.add.image(x, y - offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    const bottom = this.matter.add.image(x, y + offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    // --- main ---
    const main = this.matter.add.image(x, y, "tube")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAngle(angle)
        .setDepth(1)
        .setStatic(true);

    // --- air mode ---
    main.setSensor(true); 

    // --- overlay ---
    const overlay = this.add.image(x, y, "tube")
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
            Body.setPosition(child.body as Body, { x: main.x + ox, y: main.y + oy });
            Body.setAngle(child.body as Body, rad);
        });

        if ((main as any).overlay) {
            (main as any).overlay.setPosition(main.x, main.y);
            (main as any).overlay.setAngle(main.angle);
        }
    };

    (main as any).syncChildren();
    return main;
}

  private setupDropMarble() {
    const boxX = gameAreaX - 450;
    const boxY = gameAreaY - 175;
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

  private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
    this.dropClickTime = Date.now();
    this.releaseMarble(this.dropMarble, 25,0.05);
    this.rotateLidWithCollider(this.lidCollider);
  }
}
