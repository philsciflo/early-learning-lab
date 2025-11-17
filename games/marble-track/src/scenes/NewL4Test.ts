import { MarbleTrackScene } from "./MarblesTrackScene";
import {WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants";
import { Level4ScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 


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
    this.matter.world.drawDebug = false;
    super.create();
    this.setupTrack();
    this.setupBounds();
    this.setupHouse(gameAreaX + 185,gameAreaY + 175);
    this.createFunnel(gameAreaX - 370,gameAreaY - 15);
    this.setupDropMarble();
    this.setupDragBox();
    this.setupButtons();
  }

  // Create track segments with different angles and positions
  private setupTrack() {
    const wholeX = gameAreaX - 100
    const wholeY = gameAreaY + 105;
    this.createSlide(250, 15, wholeX + 120.8, wholeY + 32.4);
    this.createTube(250, 15, wholeX - 120.8, wholeY - 32.4);
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

private createSlide(length: number, angle: number, x: number, y: number): Phaser.Physics.Matter.Image {
    const height = 10;
    const offset = 32;

    const top = this.matter.add.image(x, y - offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false)
        .setSensor(true);

    const bottom = this.matter.add.image(x, y + offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    // --- main ---
    const main = this.matter.add.image(x, y, "slide")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAngle(angle)
        .setDepth(1)
        .setStatic(true);

    // --- air mode ---
    main.setSensor(true); 

    // --- overlay ---
    const overlay = this.add.image(x, y, "slide")
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
    this.boxX = gameAreaX - 450;
    this.boxY = gameAreaY - 175;
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

  private setupDragBox() {
    this.dragBox = this.matter.add
    .image(
      gameAreaX + gameAreaWidth / 2 - 500,
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
        this.hasDraggedBox = true;
        this.dragStartTime = Date.now();
        this.durationFromDropToDrag = this.dragStartTime - this.dropClickTime;
        this.dragPositions = [];
  
        this.dragPositions.push({
          x: Math.round(this.dragBox.x),
          y: Math.round(this.dragBox.y),
          time: 0
        });
  
        this.dragInterval = this.time.addEvent({
          delay: 100,
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
    this.dropClickTime = Date.now();
    this.releaseMarble(this.dropMarble, 10,0.05);
    this.releaseBox(this.dragBox, 50,0.05);
    this.rotateLidWithCollider(this.lidCollider);
    this.time.delayedCall(1000, () => {
      this.enableBoxDragging();
    });
  }
}