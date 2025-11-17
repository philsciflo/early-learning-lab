import { MarbleTrackScene } from "./MarblesTrackScene.ts";
import {WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants.ts";
import { Level3ScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 

export class Level3V1 extends MarbleTrackScene<Level3ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private staticTracks: Phaser.Physics.Matter.Image[] = [];
  private allTracks: Phaser.GameObjects.Image[] = [];
  private boundaryTracks: Phaser.Physics.Matter.Image[] = [];
  
  private draggableTrackCategory: number = 0;
  private marbleCategory: number = 0;
  private trackMainCategory: number = 0;
  private trackChildCategory: number = 0;
  private boundaryCategory: number = 0;

  constructor() {
    super(
      "Level3",
      '"Marbles Track" - Level 3 version 1(Test)',
      "Help the marble reach the goal!",
      "Level3Intro",
      "Level3V2",
      true
    );
  }

  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.trackPaths = [];
    this.allTracks = [];
    this.staticTracks = [];
    this.initializeCollisionCategories();
    this.setupTrack();
    this.setupHouse(gameAreaX + 185,gameAreaY + 160);
    this.createFunnel(gameAreaX - 370,gameAreaY - 15);
    this.setupDragZone(gameAreaX + 100, gameAreaY - 110 , 550, 310);
    this.setupDraggableTracks();
    this.setupBounds();
    this.setupDropMarble();
    this.setupButtons();
    this.shuffleTracks();
    
  }

  private setupTrack() {
    const wholeX = gameAreaX - 100
    const wholeY = gameAreaY + 105;
    const track1 =  this.createTube(180, 15, wholeX + 154.5, wholeY + 41.4, 32);
    const rightBracket = this.matter.add.image(wholeX + 50, wholeY + 53, "track")
      .setDisplaySize(30, 1)
      .setAngle(15)
      .setStatic(true)
      .setVisible(false);
    const track2 = this.createTube(180, 15, wholeX - 154.5, wholeY - 41.4, 32);
    const leftBracket = this.matter.add.image(wholeX - 75, wholeY + 18, "track")
      .setDisplaySize(30, 1)
      .setAngle(15)
      .setStatic(true)
      .setVisible(false);
    this.staticTracks.push(track1);
    this.staticTracks.push(track2);
  }

  private trackPositions = [
    { x: gameAreaX - 50, y: gameAreaY - 200 },
    { x: gameAreaX + 100, y: gameAreaY - 150 },
    { x: gameAreaX + 250, y: gameAreaY - 100 },
    { x: gameAreaX - 50, y: gameAreaY - 50 },
    { x: gameAreaX + 100, y: gameAreaY },
  ];

  private setupDraggableTracks() {
    for (let i = 0; i < 5; i++) {
      const { x, y } = this.trackPositions[i];
      const track = this.createDraggableTrack(x, y, i);
      this.allTracks.push(track);
    }
  }

  private shuffleTracks() {
    for (let i = this.trackPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.trackPositions[i], this.trackPositions[j]] = [this.trackPositions[j], this.trackPositions[i]];
    }

    this.allTracks.forEach((track, i) => {
      const { x, y } = this.trackPositions[i];
      track.setPosition(x, y);

      const children = (track as any).children as Phaser.Physics.Matter.Image[];
      children.forEach(child => {
        Body.setPosition(child.body as Body, { x, y: (child.y > y ? y + 32 : y - 32) });
        Body.setAngle(child.body as Body, Phaser.Math.DegToRad(track.angle));
      });

      const overlay = (track as any).overlay as Phaser.GameObjects.Image;
      overlay.setPosition(x, y);
    });
  }

  private initializeCollisionCategories() {
    if (this.draggableTrackCategory === 0)
      this.draggableTrackCategory = this.matter.world.nextCategory();
    if (this.marbleCategory === 0)
      this.marbleCategory = this.matter.world.nextCategory();
    if (this.trackMainCategory === 0)
      this.trackMainCategory = this.matter.world.nextCategory();
    if (this.trackChildCategory === 0)
      this.trackChildCategory = this.matter.world.nextCategory();
    if (this.boundaryCategory === 0)
      this.boundaryCategory = this.matter.world.nextCategory();
  }

  private createTube(length: number, angle: number, x: number, y: number, offset: number): Phaser.Physics.Matter.Image {
    const height = 10;

    // --- Top and bottom collision bodies ---
    const top = this.matter.add.image(x, y - offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false)
        .setCollisionCategory(this.trackChildCategory);

    const bottom = this.matter.add.image(x, y + offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false)
        .setCollisionCategory(this.trackChildCategory);

    // --- Main body as the control center ---
    const main = this.matter.add.image(x, y, "tube")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAngle(angle)
        .setDepth(0)
        .setStatic(true)
        .setCollisionCategory(this.trackMainCategory)
        .setCollidesWith(~ this.trackChildCategory | ~ this.marbleCategory);

    main.setIgnoreGravity(true);

    // --- overlay ---
    const overlay = this.add.image(x, y, "tube")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAlpha(0.5)
        .setDepth(5);

    (main as any).overlay = overlay;
    (main as any).children = [top, bottom];

    // --- Sync top/bottom and overlay ---
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

private createDraggableTrack(x: number, y: number, type: number): Phaser.Physics.Matter.Image {
  //const trackId = `track-${type}`;
  let trackId: string;
  let length: number;
  let angle: number;
  let offset: number;

  switch (type) {
    case 0:
      trackId = `track-correct`
      length = 130;
      angle = 15;
      x = 600;
      y = 300;
      offset = 32;
      break;
    case 1:
      trackId = `track-long`
      length = 200;
      angle = 15;
      x = 500;
      y = 350;
      offset = 32;
      break;
    case 2:
      trackId = `track-short`
      length = 40;
      angle = 15;
      x = 500;
      y = 350;
      offset = 32;
      break;
    case 3:
      trackId = `track-thick`
      length = 130;
      angle = 15;
      x = 600;
      y = 300;
      offset = 60;
      break;
    case 4:
      trackId = `track-thin`
      length = 130;
      angle = 15;
      x = 500;
      y = 350;
      offset = 16;
      break;
    default:
      // Default values to prevent illegal type input
      length = 130;
      angle = 15;
      x = 600;
      y = 300;
      offset = 32;
      console.warn(`Unknown track type: ${type}, using default settings.`);
      break;
  }

  const track = this.createTube(length, angle, x, y, offset); 
  const skin = (track as any).overlay as Phaser.GameObjects.Image;

  track.setCollisionCategory(this.draggableTrackCategory);
  track.setCollidesWith(~this.draggableTrackCategory);

  (track as any).children.forEach((child: Phaser.Physics.Matter.Image) => {
    child.setCollisionCategory(this.draggableTrackCategory);
    child.setCollidesWith(~this.draggableTrackCategory);
  });

  skin.setInteractive();
  this.input.setDraggable(skin);

  const originalAngle = angle;

  let dragInterval: Phaser.Time.TimerEvent;
  let dragStartTime = 0;

  skin.on("dragstart", () => {
    (track as any).overlay.setVisible(false);
    const startTime = this.registry.get(`${this.levelKey}-startTime`);
    // Initialize tracking for this drag
    if (!this.trackPaths) this.trackPaths = [];
    this.trackPaths.push({
      trackId,
      path: [{
        x: Math.round(track.x),
        y: Math.round(track.y),
        time: 0.0 // First point at 0 seconds
      }]
    })
    ;
    
    // Initialize timing
    dragStartTime = Date.now();
    this.trackPaths[this.trackPaths.length - 1].path.push({
      x: Math.round(track.x),
      y: Math.round(track.y),
      time: Date.now() - startTime // milliseconds since drag started
    });

    // Set up 100ms interval using Phaser's timer
    dragInterval = this.time.addEvent({
      delay: 100, // 0.1 seconds
      callback: () => {
        
        this.trackPaths[this.trackPaths.length - 1].path.push({
          x: Math.round(track.x),
          y: Math.round(track.y),
          time: Date.now() - startTime // milliseconds since drag started
        });
      },
      callbackScope: this,
      loop: true
    });

    if (!this.isAttempted) {
      this.registry.inc(this.triesDataKey, 1);
      this.isAttempted = true;
      this.registry.set(`${this.levelKey}-isAttempted`, true);
    }
  });

  skin.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
    // Keep non-static
    track.setStatic(false);
    track.setCollisionCategory(this.draggableTrackCategory);
    track.setCollidesWith(~this.draggableTrackCategory);

    // Limit boundaries
    const halfTrackWidth = track.displayWidth / 2;
    const halfTrackHeight = track.displayHeight / 2;
    const left = gameAreaX - gameAreaWidth / 2 + halfTrackWidth;
    const right = gameAreaX + gameAreaWidth / 2 - halfTrackWidth;
    const top = gameAreaY - gameAreaHeight / 2 + halfTrackHeight;
    const bottom = gameAreaY + gameAreaHeight / 2 - halfTrackHeight;

    const clampedX = Phaser.Math.Clamp(dragX, left, right);
    const clampedY = Phaser.Math.Clamp(dragY, top, bottom);

    // Use Linear interpolation / Lerp for smooth movement
    const lerpFactor = 0.35; // 0.0 ~ 1.0, higher = follow mouse more tightly, lower = smoother
    const newX = Phaser.Math.Linear(track.x, clampedX, lerpFactor);
    const newY = Phaser.Math.Linear(track.y, clampedY, lerpFactor);

    // Use Matter's Body.setPosition to let engine perceive position change
    Body.setPosition(track.body as Body, { x: newX, y: newY });

    // Fix angle
    Body.setAngle(track.body as Body, Phaser.Math.DegToRad(originalAngle));
    track.setAngularVelocity(0);

    // Sync skin and children
    skin.setPosition(track.x, track.y);
    skin.setAngle(originalAngle);
    (track as any).syncChildren();
});


  // When drag ends
  skin.on("dragend", () => {
    skin.setPosition(track.x, track.y);
    const startTime = this.registry.get(`${this.levelKey}-startTime`);
    if (this.trackPaths && this.trackPaths.length > 0) {
      this.trackPaths[this.trackPaths.length - 1].path.push({
        x: Math.round(track.x),
        y: Math.round(track.y),
        time: Date.now() - startTime //Final position
      });
    }
    // Clean up interval
    if (dragInterval) {
      dragInterval.destroy();
    }

    // Stop all movement
    this.time.delayedCall(100, () => {
      track.setVelocity(0, 0);
      track.setAngularVelocity(0);
      track.setStatic(true);
      skin.setPosition(track.x, track.y);
      (track as any).syncChildren();
    });
    this.time.delayedCall(500, () => {
      (track as any).syncChildren();
      (track as any).overlay.setVisible(true);
    });
    track.setCollisionCategory(this.draggableTrackCategory);
    track.setCollidesWith(~this.draggableTrackCategory);

    skin.setPosition(track.x, track.y);
    skin.setAngle(originalAngle);
    
  });

  return track;
}

override update(time: number, delta: number): void {
  super.update(time, delta);

  this.allTracks.forEach(track => {
    if ((track as any).syncChildren) {
      (track as any).syncChildren();
    }
  });
}


  private setupDropMarble() {
    const boxX = gameAreaX - 450;
    const boxY = gameAreaY - 175;

    this.dropMarble = this.matter.add.image(boxX, boxY, "marble")
      .setScale(0.06)
      .setCircle(25)
      .setFriction(0.05)
      .setBounce(0.5)
      .setFrictionStatic(0.5)
      .setStatic(true)
      .setDepth(2)
      .setCollisionCategory(this.marbleCategory);
    (this.dropMarble.body as MatterJS.BodyType).label = "dropMarble";

    this.setupBox(boxX, boxY, 75, 60);
  }

  private setupButtons() {}

  private lidCollider?: MatterJS.BodyType;

  private setupDragZone(zoneX:number, zoneY:number, zoneWidth:number, zoneHeight:number) {
    this.add
      .rectangle(zoneX, zoneY , zoneWidth, zoneHeight, WHITE)
      .setStrokeStyle(5, GREEN);
  
    // --- Bottom boundary ---
    const bottomBoundary = this.matter.add.image(zoneX, zoneY + zoneHeight/2, "track")
      .setDisplaySize(zoneWidth, 5)
      .setStatic(true)
      .setVisible(false)
      .setSensor(true)
      .setCollisionCategory(this.boundaryCategory);
  
    // --- Left boundary ---
    const leftBoundary = this.matter.add.image(zoneX - zoneWidth/2, zoneY, "track")
      .setDisplaySize(zoneHeight, 5)
      .setAngle(90)
      .setStatic(true)
      .setVisible(false)
      .setSensor(true)
      .setCollisionCategory(this.boundaryCategory); 
  
    // --- Right boundary ---
    const rightBoundary = this.matter.add.image(zoneX + zoneWidth/2, zoneY, "track")
      .setDisplaySize(zoneHeight, 5)
      .setAngle(90)
      .setStatic(true)
      .setVisible(false)
      .setSensor(true)
      .setCollisionCategory(this.boundaryCategory); 
  
    this.boundaryTracks = [bottomBoundary, leftBoundary, rightBoundary];
  }

  protected override onDropPressed() {
    this.staticTracks.forEach(track => {
      track.setCollidesWith(~ this.marbleCategory)
    });
    this.boundaryTracks.forEach(boundary => boundary.setSensor(false));
    this.dropClickTime = Date.now();
    this.releaseMarble(this.dropMarble, 25, 0.05);
    this.rotateLidWithCollider(this.lidCollider);
    this.allTracks.forEach(track => {
      const mainX = track.x;
      const mainY = track.y;
      
      const zoneX = gameAreaX + 100;
      const zoneY = gameAreaY - 110;
      const zoneWidth = 550;
      const zoneHeight = 310;
      
      const inZone =
          mainX >= zoneX - zoneWidth / 2 &&
          mainX <= zoneX + zoneWidth / 2 &&
          mainY >= zoneY - zoneHeight / 2 &&
          mainY <= zoneY + zoneHeight / 2;
      
      if (!inZone) {
        (track as any).setCollidesWith(~ (this.boundaryCategory | this.marbleCategory));
        (track as any).setIgnoreGravity(false);
        (track as any).setStatic(false);
      } else{
        (track as any).setCollidesWith(~ this.marbleCategory);
      }
      
      const skin = (track as any).overlay as Phaser.GameObjects.Image;
      this.input.setDraggable(skin, false);
      skin.disableInteractive();
    });
  }
}
