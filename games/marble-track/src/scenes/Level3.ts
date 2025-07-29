import { MarbleTrackScene } from "./MarblesTrackScene";
import {WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants";
import { Level3ScoringData } from "../scoring.ts";


export class Level3 extends MarbleTrackScene<Level3ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private allTracks: Phaser.Physics.Matter.Image[] = [];

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

  // Initialize the scene
  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.allTracks=[];
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

  // Create fixed track segments with different angles and positions
  private setupTrack() {
    this.createThisTrack(450, 6, gameAreaX - 160, gameAreaY);
    this.createThisTrack(400, -8, gameAreaX - 160, gameAreaY+180);
  }

  private createThisTrack(length: number, angle: number, x: number, y: number): Phaser.Physics.Matter.Image {
    const height = 10;
  
    // Physics body (invisible)
    const body = this.matter.add.image(x, y, "track");
    body.setDisplaySize(length, height);
    body.setStatic(true);
    body.setAngle(angle);
    body.setFriction(0.05);
    body.setFrictionStatic(0.5);
    body.setVisible(false);
  
    // Visual skin
    const skin = this.add.image(x, y, "log");
    skin.setDisplaySize(length + 50, 100);
    skin.setAngle(angle);
    skin.setDepth(5); 
  
    // Attach the skin reference to the body
    (body as any).skin = skin;
  
    return body;
  }

  private trackPositions = [
  { x: gameAreaX + 340, y: gameAreaY + 190 },
  { x: gameAreaX + 340, y: gameAreaY + 100 },
  { x: gameAreaX + 380, y: gameAreaY + 160 }
  ];

  // Create draggable track segments with different angles and positions
  private setupDraggableTracks() {
    //Display a green box around draggable tracks
    this.add
      .rectangle(gameAreaX + gameAreaWidth / 2 - 130, gameAreaY + gameAreaHeight / 2 - 110, 220, 180, WHITE)
      .setStrokeStyle(5, GREEN);

    //const allTracks: Phaser.Physics.Matter.Image[] = [];

    // Define angles and lengths
    const trackConfigs = [
      { length: 200, angle: 15 },
      { length: 200, angle: -20 },
      { length: 150, angle: 30 }
    ];

    // Create all 3 tracks using placeholder positions 
    for (let i = 0; i < 3; i++) {
      const { length, angle } = trackConfigs[i];
      const { x, y } = this.trackPositions[i];
      const track = this.createDraggableTrack(length, angle, x, y, i);
      this.allTracks.push(track);
    }
  
    

  
    // Handle behavior after dragging ends for each track
    /*allTracks.forEach(track => {
      track.on("dragend", () => {
        track.setStatic(true); // Fix the track in place once dragged
        this.input.setDraggable(track, false); // Disable further dragging of this track
        track.disableInteractive(); // Disable interaction with this track
  
        // Disable dragging for all other tracks
        allTracks.forEach(t => {
          if (t !== track) {
            t.setInteractive(false);
            this.input.setDraggable(t, false); // Disable interaction with other tracks
          }
        });
      });
    });*/
  }

  private shuffleTracks() {

  for (let i = this.trackPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [this.trackPositions[i], this.trackPositions[j]] = [this.trackPositions[j], this.trackPositions[i]];
  }

  // Reposition each track
  this.allTracks.forEach((track, i) => {
    const { x, y } = this.trackPositions[i];
    track.setPosition(x, y);
    track.setVelocity(0, 0);
    track.setAngularVelocity(0);
    track.setStatic(true);

    track.setCollisionCategory(this.draggableTrackCategory);
    track.setCollidesWith(~this.draggableTrackCategory);

    const skin = (track as any).skin as Phaser.GameObjects.Image;
    skin.setPosition(x, y);
  });
}

private draggableTrackCategory: number = 0;


private initializeCollisionCategories() {
  if (this.draggableTrackCategory === 0) {
    this.draggableTrackCategory = this.matter.world.nextCategory();
  }
}

private createDraggableTrack(length: number, angle: number, x: number, y: number, index: number): Phaser.Physics.Matter.Image {
  const trackId = `track-${index}`;
  
  const track = this.createThisTrack(length, angle, x, y); 
  const skin = (track as any).skin as Phaser.GameObjects.Image;

  track.setCollisionCategory(this.draggableTrackCategory);
  track.setCollidesWith(~this.draggableTrackCategory);

  skin.setInteractive();
  this.input.setDraggable(skin);

  const originalAngle = angle;

  let dragInterval: Phaser.Time.TimerEvent;
  let dragStartTime = 0;

  skin.on("dragstart", () => {
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
    const now = Date.now();
    
    // Keep track non-static during drag
    track.setStatic(false);
    track.setCollisionCategory(this.draggableTrackCategory);
    track.setCollidesWith(~this.draggableTrackCategory);
    
    // Calculate bounds for the track
    const halfTrackWidth = track.displayWidth / 2;
    const halfTrackHeight = track.displayHeight / 2;
    const left = gameAreaX - gameAreaWidth / 2 + halfTrackWidth;
    const right = gameAreaX + gameAreaWidth / 2 - halfTrackWidth;
    const top = gameAreaY - gameAreaHeight / 2 + halfTrackHeight;
    const bottom = gameAreaY + gameAreaHeight / 2 - halfTrackHeight;
    
    // Clamp target position to stay within boundaries
    const clampedX = Phaser.Math.Clamp(dragX, left, right);
    const clampedY = Phaser.Math.Clamp(dragY, top, bottom);
    
    const dx = clampedX - track.x;
    const dy = clampedY - track.y;
  
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Prevent tunneling by limiting movement speed
    const maxDistance = 12;
    
    if (distance > maxDistance) {
      const nx = dx / distance;
      const ny = dy / distance;
      
      const speed = 10;
      track.setVelocity(nx * speed, ny * speed);
      
      track.x += nx * maxDistance * 0.5;
      track.y += ny * maxDistance * 0.5;
    } else {
      const speed = 0.5;
      track.setVelocity(dx * speed, dy * speed);
    }
    
    track.setAngle(originalAngle);
    track.setAngularVelocity(0);
    
    skin.setPosition(track.x, track.y);
    skin.setAngle(originalAngle); 
  });

  // When drag ends
  skin.on("dragend", () => {
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
    track.setVelocity(0, 0);
    track.setAngularVelocity(0);
    track.setStatic(true);
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
    this.allTracks.forEach(track => {
      track.setStatic(true);
      const skin = (track as any).skin as Phaser.GameObjects.Image;
      this.input.setDraggable(skin, false);
      skin.disableInteractive();
    });
  }
}