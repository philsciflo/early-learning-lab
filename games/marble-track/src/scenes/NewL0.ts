import { MarbleTrackScene } from "./MarblesTrackScene.ts";
import { WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants.ts";
import { Level0ScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 

export class Level0Test extends MarbleTrackScene<Level0ScoringData> {
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
    this.setupHouse(gameAreaX + 185,gameAreaY + 160);
    this.setupBounds();
    this.setupMarble();
    this.createFunnel(gameAreaX - 370,gameAreaY - 15);
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
        delay: 100, // 0.1 second
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
}
