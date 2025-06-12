import { MarbleTrackScene } from "./MarblesTrackScene";
import { WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants";
import { Level0ScoringData } from "../scoring.ts";

export class Level0 extends MarbleTrackScene<Level0ScoringData> {
  private marble!:Phaser.Physics.Matter.Image;

  private isDragging = false;
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
    this.setupBowl(gameAreaX + 185,gameAreaY + 135);
    this.setupFlag();
    this.setupBounds();
    this.setupMarble();
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
    const top = gameAreaY - gameAreaHeight / 2 + halfMarble;
    const bottom = gameAreaY + gameAreaHeight / 2 - halfMarble;
    
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
    this.createTrack(500, 15, gameAreaX-100, gameAreaY+70);
  }


  // Sets up the finishing line to end the fun
  private setupFlag(){
  const flag = this.add.image(gameAreaX+230, gameAreaY+108, "flag");
  flag.setScale(0.1);
  }

}
