import { MarbleTrackScene } from "./MarblesTrackScene.ts";
import { WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants.ts";
import { Level0ScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 

export class Level0Test extends MarbleTrackScene<Level0ScoringData> {
  private allTracks: Phaser.GameObjects.Image[] = [];
  private marble!:Phaser.Physics.Matter.Image;

  private isDragging = true;
  private dragStartTime = 0;
  private nextRecordTime = 0;

  private dragInterval?: Phaser.Time.TimerEvent;

  constructor() {
    super(
      "Level0", 
      '"Marbles Track" - Level 0 (Training)', 
      "Let's play with marbles.", 
      "Level0",
      "Level1Intro",
      false
      
    );
  }

  // Initialize the scene
  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.setupTrack();
    //this.setupDraggableTracks();

    this.setupHouse(gameAreaX + 185,gameAreaY + 160);
    this.setupBounds();
    this.setupMarble();
    this.createFunnel(gameAreaX - 370,gameAreaY - 15);

    this.allTracks = [];
  }

  // Sets up the marble so that it behaves likes a circle and is draggable
  private setupMarble() {
    // Display green box
    this.add
      .rectangle(gameAreaX + gameAreaWidth / 2 - 60, gameAreaY + gameAreaHeight / 2 - 60, 90, 90, WHITE)
      .setStrokeStyle(5, GREEN);

    this.marble = this.matter.add
    .image(
      gameAreaX + gameAreaWidth / 2 - 60,
      gameAreaY + gameAreaHeight / 2 - 60,
      "marble"
    )
    .setScale(0.06)
    .setCircle(25)
    .setFriction(0.01)
    .setMass(10)
    .setFrictionStatic(0.5)
    .setBounce(0.5)
    .setVelocityX(1)
    .setAngularVelocity(0.15)
    .setStatic(true) 
    .setInteractive()
    .setDepth(2);
    (this.marble.body as MatterJS.BodyType).label = "dropMarble";

    this.input.setDraggable(this.marble);

    this.marble.on("dragstart", () => {
      console.log("Drag started");
      this.isDragging = true;
      this.dragStartTime = Date.now();
      this.dragPositions = [];
      //initial position
      this.dragPositions.push({
        x: Math.round(this.marble.x),
        y: Math.round(this.marble.y),
        time: 0
      });
      this.recordDragPosition(this.marble, this.isDragging);
      
      // Set up interval to record every second
      this.dragInterval = this.time.addEvent({
        delay: 500, // 1 second
        callback: () => this.recordDragPosition(this.marble, this.isDragging),
        callbackScope: this,
        loop: true
      });

      this.isAttempted = true;
      this.registry.set(`${this.levelKey}-isAttempted`, true);
      this.registry.inc(this.triesDataKey, 1);
    });

    this.marble.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
    // Keep marble non-static during drag
    this.marble.setStatic(false);
    
    // Calculate target position (with bounds checking)
    const halfMarble = 20;
    const left = gameAreaX - gameAreaWidth / 2 + halfMarble;
    const right = gameAreaX + gameAreaWidth / 2 - halfMarble;

    const top = gameAreaY - 25 - gameAreaHeight / 2 + halfMarble;
    const bottom = gameAreaY + 25 + gameAreaHeight / 2 - halfMarble;

    
    const clampedX = Phaser.Math.Clamp(dragX, left, right);
    const clampedY = Phaser.Math.Clamp(dragY, top, bottom);
    
    // Calculate velocity needed to move toward pointer
    const dx = clampedX - this.marble.x;
    const dy = clampedY - this.marble.y;
    
    // Calculate distance to pointer
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    //limit the speed to prevent tunneling
    const maxDistance = 12; 
    
    if (distance > maxDistance) {
      // Normalize the direction vector
      const nx = dx / distance;
      const ny = dy / distance;
      
      // Apply limited velocity in the right direction
      const speed = 10; 
      this.marble.setVelocity(nx * speed, ny * speed);
      
      this.marble.x += nx * maxDistance * 0.5;
      this.marble.y += ny * maxDistance * 0.5;
    } else {
      //set the velocity to reach the target
      const speed = 0.5; 
      this.marble.setVelocity(dx * speed, dy * speed);
    }
    
    this.marble.setIgnoreGravity(true);
    this.marble.setAngularVelocity(0);
  });

  // When drag ends, restore normal physics behavior
  this.marble.on("dragend", () => {
    this.recordDragPosition(this.marble, this.isDragging);
    (this as any).dragPositions = this.dragPositions;
      console.log("Drag ended");
      this.isDragging = false;
      if (this.dragInterval) {
        this.dragInterval.destroy();
      }
      
      // Log all recorded positions
      console.log("Full drag path:", this.dragPositions);

    this.input.setDraggable(this.marble, false);
    this.marble.disableInteractive();
    this.marble.setIgnoreGravity(false);
  });

  }
  
  // Sets up the track which the marble rolls down
  private setupTrack(){

    this.createTube(500, 15, gameAreaX-100, gameAreaY+105);

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
        .setDepth(1)
        .setStatic(true);

    // --- 空气模式（不碰撞） ---
    main.setSensor(true); 

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

    (track as any).syncChildren();
  });

  // When drag ends
  skin.on("dragend", () => {
    track.setSensor(true);
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

private draggableTrackCategory: number = 0;

  private initializeCollisionCategories() {
    if (this.draggableTrackCategory === 0) {
      this.draggableTrackCategory = this.matter.world.nextCategory();
    }
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
  
  


  // Sets up the finishing line to end the fun
  private setupFlag(){
  const flag = this.add.image(gameAreaX+250, gameAreaY+90, "flag");
  flag.setScale(0.1);
  }


  private createFunnel(x: number, y: number): Phaser.Physics.Matter.Image {
    const height = 10;
    const offset = 60;

    // --- 上下碰撞体 ---

    const top = this.matter.add.image(x - offset - 5, y - 30 , "track")
        .setDisplaySize(100, height)
        .setAngle(60)
        .setStatic(true)
        .setVisible(false);

    const bottom = this.matter.add.image(x + offset + 5, y - 30, "track")
        .setDisplaySize(100, height)
        .setAngle(-60)
        .setStatic(true)
        .setVisible(false);

    // --- main 作为控制中心 ---

    const main = this.matter.add.image(x, y, "funnel")
        .setDisplaySize(200, 220)
        .setDepth(1)
        .setStatic(true);


    // ---air mode ---

    main.setSensor(true); 

    // --- overlay ---
    const overlay = this.add.image(x, y, "funnel")
        .setDisplaySize(200, 220)
        .setAlpha(0.5)
        .setDepth(5);
    this.setupMidBowl(x + 20,y + 50);      
    return main;
}

private setupMidBowl(bowlX: number, bowlY: number) {
  
  const bowlRadius = 70;

  const bowlImage = this.add.image(bowlX, bowlY, 'bowl');
  bowlImage.setOrigin(0.5, 0.5);
  bowlImage.setVisible(false);
  bowlImage.setScale(0.1);
  bowlImage.setRotation(Phaser.Math.DegToRad(30));

  const arcLength = Math.PI * bowlRadius;
  const segments = Math.floor(arcLength / 20);
  const parts: MatterJS.BodyType[] = [];

  const rotateDegrees = 15;
  const rotateRadians = Phaser.Math.DegToRad(rotateDegrees);

  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI - (i * Math.PI/ 2.1) / segments;
    const rotatedAngle = angle + rotateRadians;
    const x = bowlX + 10 + bowlRadius * Math.cos(rotatedAngle);
    const y = bowlY - 20 + bowlRadius * Math.sin(rotatedAngle)*0.8; 
    const circle = this.matter.bodies.circle(x, y, 5, {
      isStatic: true,
      friction: 0.01,
    });
    parts.push(circle);
  }

  const compoundBody = this.matter.body.create({ parts, isStatic: true });
  this.matter.world.add(compoundBody);
}

// Sets up a bowl where the marble will land
protected setupHouse(bowlX: number, bowlY: number) {
  const bowlRadius = 42;
  const bowlImage = this.add.image(bowlX, bowlY + 12, "house");
  bowlImage.setOrigin(0.5, 0.5);
  bowlImage.setScale(0.1);
  bowlImage.setDepth(0);
  const overlay = this.add.image(bowlX, bowlY + 12, "houseOverlay")
        .setDisplaySize(200, 220)
        .setScale(0.1)
        .setAlpha(0.5)
        .setDepth(3);

  const arcLength = Math.PI * bowlRadius;
  const segments = Math.floor(arcLength / 18);
  const parts: MatterJS.BodyType[] = [];

  for (let i = 1; i <= segments - 1; i++) {
    const angle = Math.PI - (i * Math.PI) / segments;
    const x = bowlX + bowlRadius * Math.cos(angle);
    const y = bowlY + 34  + bowlRadius * Math.sin(angle);
    const circle = this.matter.bodies.circle(x, y, 10, {
      isStatic: true,
      friction: 0.01,
    });
    parts.push(circle);
  }

  for (let i = 1; i <= segments - 1; i++) {
    const angle = Math.PI - (i * Math.PI/ 1.5) / segments;
    const rotatedAngle = angle + Phaser.Math.DegToRad(150);
    const x = bowlX + bowlRadius *1.4 * Math.cos(rotatedAngle);
    const y = bowlY - 5 + bowlRadius *1.4 * Math.sin(rotatedAngle)*0.8; 
    const circle = this.matter.bodies.circle(x, y, 10, {
      isStatic: true,
      friction: 0.01,
    });
    parts.push(circle);
  }

  const compoundBody = this.matter.body.create({ parts, isStatic: true });
  this.matter.world.add(compoundBody);

  this.matter.add.image(bowlX + 50, bowlY + 20, "track")
        .setDisplaySize(100, 30)
        .setAngle(90)
        .setStatic(true)
        .setVisible(false);
  
  //
  const sensor = this.matter.bodies.circle(bowlX, bowlY + 50, 20, {
    isSensor: true,
    isStatic: true,
    label: "bowlSensor",
  });
  this.matter.world.add(sensor);
  this.bowlSensor = sensor;
}
}
