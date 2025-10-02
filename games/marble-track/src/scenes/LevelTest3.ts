import { MarbleTrackScene } from "./MarblesTrackScene";
import { WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY } from "../constants";
import { Level3ScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 
import { TubeFactory } from "../tubeFactory";
import { IDraggableTrackSceneContext } from "../IDraggableTrackSceneContext";

export class LevelTest3 extends MarbleTrackScene<Level3ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  protected staticTracks: Phaser.Physics.Matter.Image[] = [];
  protected allTracks: Phaser.Physics.Matter.Image[] = [];

  public getDraggableTrackContext(): IDraggableTrackSceneContext {
    return {
      staticTracks: this.staticTracks,
      allTracks: this.allTracks,
      isAttempted: this.isAttempted, // boolean
      markAttempted: () => {
        if (!this.isAttempted) {
          this.registry.inc(this.triesDataKey!, 1);
          this.isAttempted = true;
          this.registry.set(`${this.levelKey}-isAttempted`, true);
        }
      },
      triesDataKey: this.triesDataKey,
      levelKey: this.levelKey,
      scene: this
    };
  }

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
    TubeFactory.initializeCollisionCategories(this);
  }

  private setupTrack() {
    const track1 = TubeFactory.createTube(this, 450, 6, gameAreaX - 160, gameAreaY);
    const track2 = TubeFactory.createTube(this, 400, -8, gameAreaX - 160, gameAreaY + 180); 
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
      const track = TubeFactory.createDraggableTrack(this.getDraggableTrackContext(), length, angle, x, y, i);
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
