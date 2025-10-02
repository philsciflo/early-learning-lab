import { MarbleTrackScene } from "./MarblesTrackScene";
import {WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants";
import { Level3ScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 

export class Level3 extends MarbleTrackScene<Level3ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private staticTracks: Phaser.Physics.Matter.Image[] = [];
  private allTracks: Phaser.GameObjects.Image[] = [];

  constructor() {
    super(
      "Level3",
      '"Marbles Track" - Level 3 (Test)',
      "Help the marble reach the goal!",
      "Level3Intro",
      "Level4",
      true
    );
  }

  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.allTracks = [];
    this.setupTrack();
    this.setupDraggableTracks();
    this.setupBowl(gameAreaX - 400, gameAreaY + 209);
    this.setupFlag();
    this.setupBounds();
    this.setupDropMarble();
    this.setupButtons();
    this.shuffleTracks();
    this.initializeCollisionCategories();
  }

  private setupTrack() {
    const track1 = this.createTube(450, 6, gameAreaX - 160, gameAreaY);
    const track2 = this.createTube(400, -8, gameAreaX - 160, gameAreaY + 180); 
    this.staticTracks.push(track1);
    this.staticTracks.push(track2);
  }

  private trackPositions = [
    { x: gameAreaX + 340, y: gameAreaY + 190 },
    { x: gameAreaX + 340, y: gameAreaY + 100 },
    { x: gameAreaX + 380, y: gameAreaY + 160 }
  ];

  private setupDraggableTracks() {
    this.add
      .rectangle(gameAreaX + gameAreaWidth / 2 - 130, gameAreaY + gameAreaHeight / 2 - 110, 220, 180, WHITE)
      .setStrokeStyle(5, GREEN);

    const trackConfigs = [
      { length: 200, angle: 15 },
      { length: 200, angle: -20 },
      { length: 150, angle: 30 }
    ];

    for (let i = 0; i < 3; i++) {
      const { length, angle } = trackConfigs[i];
      const { x, y } = this.trackPositions[i];
      const track = this.createDraggableTrack(length, angle, x, y, i);
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

  private draggableTrackCategory: number = 0;

  private initializeCollisionCategories() {
    if (this.draggableTrackCategory === 0) {
      this.draggableTrackCategory = this.matter.world.nextCategory();
    }
  }

  private createTube(length: number, angle: number, x: number, y: number): Phaser.Physics.Matter.Image {
    const height = 10;
    const offset = 32;

    // --- 上下碰撞体 ---
    const top = this.matter.add.image(x, y - offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    const bottom = this.matter.add.image(x, y + offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    // --- main 作为控制中心 ---
    const main = this.matter.add.image(x, y, "tube")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAngle(angle)
        .setDepth(0)
        .setStatic(true);

    // --- 空气模式（不碰撞） ---
    main.setSensor(true); 
    main.setIgnoreGravity(true);

    // --- overlay ---
    const overlay = this.add.image(x, y, "tube")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAlpha(0.5)
        .setDepth(5);

    (main as any).overlay = overlay;
    (main as any).children = [top, bottom];

    // --- 同步 top/bottom 和 overlay ---
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

private createDraggableTrack(length: number, angle: number, x: number, y: number, index: number): Phaser.Physics.Matter.Image {
  const trackId = `track-${index}`;
  
  const track = this.createTube(length, angle, x, y); 
  const skin = (track as any).overlay as Phaser.GameObjects.Image;

  track.setCollisionCategory(this.draggableTrackCategory);
  track.setCollidesWith(~this.draggableTrackCategory);

  skin.setInteractive();
  this.input.setDraggable(skin);

  const originalAngle = angle;

  let dragInterval: Phaser.Time.TimerEvent;
  let dragStartTime = 0;

  skin.on("dragstart", () => {
    track.setSensor(false);
    this.staticTracks.forEach(track => track.setSensor(false));
    this.allTracks.forEach(track => {
      (track as any).children.forEach((child: Phaser.Physics.Matter.Image) => {
        child.setSensor(true);
      });
    });
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

    // Set up 500ms interval using Phaser's timer
    dragInterval = this.time.addEvent({
      delay: 500, // 0.5 seconds
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
    // 保持非静态
    track.setStatic(false);
    track.setCollisionCategory(this.draggableTrackCategory);
    track.setCollidesWith(~this.draggableTrackCategory);

    // 限制范围
    const halfTrackWidth = track.displayWidth / 2;
    const halfTrackHeight = track.displayHeight / 2;
    const left = gameAreaX - gameAreaWidth / 2 + halfTrackWidth;
    const right = gameAreaX + gameAreaWidth / 2 - halfTrackWidth;
    const top = gameAreaY - gameAreaHeight / 2 + halfTrackHeight;
    const bottom = gameAreaY + gameAreaHeight / 2 - halfTrackHeight;

    const clampedX = Phaser.Math.Clamp(dragX, left, right);
    const clampedY = Phaser.Math.Clamp(dragY, top, bottom);

    // --- 关键改动 ---
    // 用 Phaser.Math.Interpolation.Linear 或 Lerp 来平滑移动
    const lerpFactor = 0.35; // 0.0 ~ 1.0，越大越“紧跟鼠标”，越小越“平滑安全”
    const newX = Phaser.Math.Linear(track.x, clampedX, lerpFactor);
    const newY = Phaser.Math.Linear(track.y, clampedY, lerpFactor);

    // 使用 Matter 的 Body.setPosition 让引擎感知位置变化
    Body.setPosition(track.body as Body, { x: newX, y: newY });

    // 角度固定
    Body.setAngle(track.body as Body, Phaser.Math.DegToRad(originalAngle));
    track.setAngularVelocity(0);

    // 同步 skin 和 children
    skin.setPosition(track.x, track.y);
    skin.setAngle(originalAngle);
    (track as any).syncChildren();
});


  // When drag ends
  skin.on("dragend", () => {
    skin.setPosition(track.x, track.y);
    //track.setSensor(true);
    this.staticTracks.forEach(track => track.setSensor(true));
    this.allTracks.forEach(track => {
      (track as any).children.forEach((child: Phaser.Physics.Matter.Image) => {
        child.setSensor(false);
      });
    });
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


  private setupDropMarble() {
    const boxX = gameAreaX - 370;
    const boxY = gameAreaY - 160;

    this.dropMarble = this.matter.add.image(boxX, boxY, "marble")
      .setScale(0.06)
      .setCircle(25)
      .setFriction(0.05)
      .setBounce(0.5)
      .setFrictionStatic(0.5)
      .setStatic(true)
      .setDepth(2);
    (this.dropMarble.body as MatterJS.BodyType).label = "dropMarble";

    this.setupBox(boxX, boxY, 75, 60);
  }

  private setupButtons() {}
  private setupFlag() {
    const flag = this.add.image(gameAreaX - 420, gameAreaY + 180, "flag");
    flag.setScale(0.1);
  }

  private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
    this.dropClickTime = Date.now();
    this.releaseMarble(this.dropMarble, 25, 0.05);
    this.rotateLidWithCollider(this.lidCollider);
    this.allTracks.forEach(track => {
      (track as any).children.forEach((child: Phaser.Physics.Matter.Image) => {
        child.setStatic(true);
      });
      const skin = (track as any).overlay as Phaser.GameObjects.Image;
      this.input.setDraggable(skin, false);
      skin.disableInteractive();
    });
  }
}
