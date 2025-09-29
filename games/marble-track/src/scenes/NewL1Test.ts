import { MarbleTrackScene } from "./MarblesTrackScene.ts";
import { WHITE, GREEN, gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY} from "../constants.ts";
import { Level1ScoringData } from "../scoring.ts";
import { Body } from "matter-js"; 

export class Level1 extends MarbleTrackScene<Level1ScoringData> {
  private dropMarble!: Phaser.Physics.Matter.Image;
  private dragMarble!:Phaser.Physics.Matter.Image;

  private isDragging = true;
  private dragStartTime = 0;
  private nextRecordTime = 0;

  private dragInterval?: Phaser.Time.TimerEvent;

  constructor() {
    super(
      "Level1", 
      '"Marbles Track" - Level 1 (test)',
      "Help the marble reach the goal!",
      "Level1Intro",
      "Level2Intro",
      true
    );
    this.maxDropCount = 2;
  }

  // Initialize the scene
  override create(): void {
    this.matter.world.drawDebug = false;
    super.create();
    this.boxX = gameAreaX - 450;
    this.boxY = gameAreaY - 175;
    this.setupTrack();
    //this.setupDraggableTracks();
    this.setupHouse(gameAreaX + 185,gameAreaY + 160);
    this.setupBounds();
    this.setupDropMarble(this.boxX,this.boxY);
    this.setupDragMarble()
    this.createFunnel(gameAreaX - 370,gameAreaY - 15);
    this.setupButtons();
  }
  
  // Sets up the track which the marble rolls down
  private setupTrack(){
    this.createTightTube(500, 15, gameAreaX-100, gameAreaY+105);
  }

  private createTightTube(length: number, angle: number, x: number, y: number): Phaser.Physics.Matter.Image {
    const height = 10;
    const offset = 33;

    // --- Top and bottom colliders ---
    const top = this.matter.add.image(x, y - offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    const bottom = this.matter.add.image(x, y + offset, "track")
        .setDisplaySize(length, height)
        .setStatic(true)
        .setVisible(false);

    // --- main as control center ---
    const main = this.matter.add.image(x, y, "tighttube")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAngle(angle)
        .setDepth(1)
        .setStatic(true);

    // --- Air mode (no collision) ---
    main.setSensor(true); 

    // --- overlay ---
    const overlay = this.add.image(x, y, "tighttube")
        .setDisplaySize(length + 10, offset * 2 + 7)
        .setAlpha(0.5)
        .setDepth(5);

    (main as any).overlay = overlay;
    (main as any).children = [top, bottom];

    // --- Synchronize top/bottom and overlay ---
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

  private createFunnel(x: number, y: number): Phaser.Physics.Matter.Image {
    const height = 10;
    const offset = 60;

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

private setupDropMarble(X: number, Y: number) {
  const dropX = X;
  const dropY = Y;
  const boxWidth = 75;
  const boxHeight = 60;

  // Add drop ball
  this.dropMarble = this.matter.add.image(dropX, dropY, "marble")
    .setScale(0.06)
    .setCircle(25)
    .setFriction(0.02)
    .setBounce(0.25)
    .setFrictionStatic(0.5)
    .setStatic(true)
    .setFrictionAir(0.001)
    .setDepth(2);
    (this.dropMarble.body as MatterJS.BodyType).label = "dropMarble";

  this.setupBox(X,Y,boxWidth,boxHeight);
}

private setupDragMarble() {
  // Display green box
  this.add
    .rectangle(gameAreaX + gameAreaWidth / 2 - 60, gameAreaY + gameAreaHeight / 2 - 60, 90, 90, WHITE)
    .setStrokeStyle(5, GREEN);

  this.dragMarble = this.matter.add
  .image(
    gameAreaX + gameAreaWidth / 2 - 60,
    gameAreaY + gameAreaHeight / 2 - 60,
    "marble2"
  )
  .setScale(0.06)
  .setCircle(25)
  .setFriction(0.05)
  .setBounce(0.25)
  .setFrictionStatic(0.1)
  .setStatic(true) 
  .setInteractive()
  .setDepth(2)

  .on('dragstart', () => {
    console.log("Drag started");
    this.isDragging = true;
    this.dragStartTime = Date.now();
    this.dragPositions = [];
    //initial position
    this.dragPositions.push({
      x: Math.round(this.dragMarble.x),
      y: Math.round(this.dragMarble.y),
      time: 0
    });
    
    // Set up interval to record every second
    this.dragInterval = this.time.addEvent({
      delay: 500, // 1 second
      callback: () => this.recordDragPosition(this.dragMarble, this.isDragging),
      callbackScope: this,
      loop: true
    });
  })
  .on('dragend', () => {
    this.recordDragPosition(this.dragMarble, this.isDragging);
    (this as any).dragPositions = this.dragPositions;
    console.log("Drag ended");
    this.isDragging = false;
    if (this.dragInterval) {
      this.dragInterval.destroy();
    }
    

    // Log all recorded positions
    console.log("Full drag path:", this.dragPositions);
  });

  this.handleDrag(
    this.boxX, 
    this.boxY, 
    this.dragMarble,
    () => this.recordDragPosition(this.dragMarble,this.isDragging)
  );
}


private setupButtons() {
  const buttonX = gameAreaX + gameAreaWidth / 2 - 80;
  const resetY = gameAreaY - 100;
  const dropY = resetY + 60;



}

private lidCollider?: MatterJS.BodyType;
  protected override onDropPressed() {
  if (this.dropCount === 0) {
    this.dropClickTime = Date.now();
    this.time.delayedCall(100, () => {
      this.releaseMarble(this.dropMarble, 5, 0.02);
      this.rotateLidWithCollider(this.lidCollider);
    });
  } else if (this.dropCount === 1) {
    if (this.isDragMarbleSnapped) {
      this.secondDropClickTime = Date.now();
      this.time.delayedCall(100, () => {
        this.releaseMarble(this.dragMarble, 18, 0.01);
        this.rotateLidWithCollider(this.lidCollider);
      });
    } else {
      this.dropCount -= 1;
    }
  }
}

}
