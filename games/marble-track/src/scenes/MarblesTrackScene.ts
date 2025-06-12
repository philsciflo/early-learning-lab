import { Scene } from "phaser";
import { renderBanner } from "../banners";
import { renderHint } from "../banners";
import {
  PLAYER_SCORING_DATA,
  TrackPathPoint,
  TrackMovement,
  storeScoringDataForPlayer,
  LEVEL_TRYDATA_MAP,
} from "../scoring.ts";
import {
  WIDTH,
  HEIGHT,
  GREEN,
  WHITE,
  BLACK,
  BLACK_STRING,
  gameAreaWidth,
  gameAreaHeight,
  gameAreaX,
  gameAreaY,
  GUTTER_WIDTH,
  GREEN_DEEP,
  GAME_AREA_WIDTH,
  PLAYER_ID_DATA_KEY,
} from "../constants";

const SCORE_DATA_KEY = "score";
const TRIES_DATA_KEY = "tries";
const rightTextX = gameAreaX + gameAreaWidth / 2 - 60;

export class MarbleTrackScene<T> extends Scene {
  //levelKey: string;
  levelTitle: string;
  levelSubtitle: string;
  previousScene: string;
  nextScene: string;
  showDropButton: boolean; //since level0 doesn't have drop button this is added to configure it

  protected dropCount = 0;
  protected maxDropCount = 1;
  protected boxX: number;
  protected boxY: number;
  protected isDragMarbleSnapped = false;
  protected renderHint = renderHint;
  protected lid!: Phaser.Physics.Matter.Image;
  protected bowlSensor: MatterJS.Body | undefined;
  protected attempt!: number;
  public triesDataKey: string;
  public scoreDataKey: string;
  private scoringData: T[];
  private score = 0;
  private hasScore = false;
  protected isDropMarble = false;
  protected isAttempted = false;
  private scoreForThisTry = 0;
  public duration: number;

  protected currentScore = -1;

  /*  private musicOn = true; // current state
    private musicBtn!: Phaser.GameObjects.Image; // button reference*/

  protected dragPositions: { x: number; y: number; time: number }[] = [];

  protected trackPaths: TrackMovement[] = [];
  protected levelStartTime = 0;
  protected currentTrackPaths: Record<string, TrackPathPoint[]> = {};

  constructor(
    protected levelKey: keyof LEVEL_TRYDATA_MAP, //scoring change
    //levelKey: string,
    levelTitle: string,
    levelSubtitle: string,
    prev: string,
    next: string,
    showDropButton = true,
  ) {
    super(levelKey);
    this.triesDataKey = `${this.levelKey}-${TRIES_DATA_KEY}`;
    this.scoreDataKey = `${this.levelKey}-${SCORE_DATA_KEY}`;
    this.levelKey = levelKey;
    this.levelTitle = levelTitle;
    this.levelSubtitle = levelSubtitle;
    this.previousScene = prev;
    this.nextScene = next;
    this.showDropButton = showDropButton;
  }

  preload(): void {
    // Load all required assets
    this.load.image("background", "assets/background.png");
    this.load.image("marble", "assets/marble-ball.png");
    this.load.image("marble2", "assets/marble-ball1.png");
    this.load.image("marble-background", "assets/marble-background.png");
    this.load.image("fast-backward-button", "assets/fast-backward-button.png");
    this.load.image("fast-forward-button", "assets/fast-forward-button.png");
    this.load.image("flag", "assets/flag.png");
    this.load.image("log", "assets/log.png");
    this.load.image("bowl", "assets/bowl.png");
    this.load.image("logBall", "assets/logBall.png");
  }

  init() {
    this.hasScore = false;
    this.scoringData = []; // Clear previous scoring data
    this.currentScore = -1; // Reset current score
    this.scoreForThisTry = 0;
    this.isAttempted = false;
    this.registry.set(`${this.levelKey}-startTime`, Date.now());
    const attemptedKey = `${this.levelKey}-isAttempted`;

    if (!this.registry.has(this.triesDataKey)) {
      this.registry.set(this.triesDataKey, 0);
    }
    if (!this.registry.has(this.scoreDataKey)) {
      this.registry.set(this.scoreDataKey, 0);
    }

    // Record level score information
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY);

    const skip = this.registry.get("skipAttemptIncrement") ?? false;
    this.registry.set("skipAttemptIncrement", false);
    const prevAttempted = this.registry.get(attemptedKey) ?? false;
    const key = `${this.scene.key}-attempt`;
    if (!this.registry.has(key)) {
      this.registry.set(key, 1);
      this.attempt = 1;
    }
    if (!skip && prevAttempted) {
      const currentAttempt = this.registry.get(key) ?? 0;
      this.registry.set(key, currentAttempt + 1);
      this.attempt = currentAttempt + 1;
      this.registry.set(attemptedKey, false);
    } else {
      this.attempt = this.registry.get(key); // Do not increment attempt, reuse the current number
    }
  }

  // Initialize the scene
  create(): void {
    this.scene.bringToTop("UIScene");

    this.isDragMarbleSnapped = false;
    this.dropCount = 0;

    this.matter.world.on("collisionstart", (event: any) => {
      event.pairs.forEach((pair: MatterJS.ICollisionPair) => {
        this.handleCollision(pair);
      });
    });

    // Replace green background with background image
    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1); // Push it to back

    // Render top banner background
    renderBanner(this, {
      x: WIDTH / 2 - 250,
      y: 20,
      width: 500,
      height: 60,
      backgroundColour: 0xffff66, // yellow
      borderColour: BLACK,
      backgroundAlpha: 0.8,
    });

    // Render level title inside the banner
    this.add
      .text(WIDTH / 2, 45, this.levelTitle, {
        font: "bold 16px Comic Sans MS",
        color: "#003400",
      })
      .setOrigin(0.5);

    // Render subtitle below the banner
    this.add
      .text(WIDTH / 2, 100, this.levelSubtitle, {
        font: "bold 16px Comic Sans MS",
        color: "#006400",
      })
      .setOrigin(0.5);

    // Define game area container (white box)
    const gameAreaWidth = WIDTH * 0.92;
    const gameAreaHeight = HEIGHT * 0.65;
    const gameAreaX = WIDTH / 2;
    const gameAreaY = HEIGHT / 2 + 10;

    this.add
      .rectangle(gameAreaX, gameAreaY, gameAreaWidth, gameAreaHeight, WHITE)
      .setStrokeStyle(2, BLACK)
      .setFillStyle(WHITE, 0.8);

    this.renderDynamicNumbers();

    // Drop button
    if (this.showDropButton) {
      const dropButton = this.add.graphics();
      dropButton.fillStyle(0xffa500, 1);
      dropButton.fillRoundedRect(0, 0, 80, 40, 10);

      // Make it interactive using hitbox only
      dropButton.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 80, 40),
        Phaser.Geom.Rectangle.Contains,
      );
      dropButton.x = rightTextX - 70;
      dropButton.y = gameAreaY - 40;

      this.add
        .text(dropButton.x + 40, dropButton.y + 20, "Drop", {
          font: "bold 16px Comic Sans MS",
          color: "#006400",
        })
        .setOrigin(0.5);

      dropButton.on("pointerdown", () => {
        this.onDropPressed();
        this.dropCount += 1;
        if (!this.isAttempted) {
          this.registry.inc(this.triesDataKey, 1);
          this.isAttempted = true;
          this.registry.set(`${this.levelKey}-isAttempted`, true);
        }
        this.currentScore++;

        // Drop button restriction
        if (this.dropCount >= this.maxDropCount) {
          dropButton.disableInteractive();
          dropButton.setAlpha(0.5); // set translucent
          this.dropCount = 0;
        }
      });
    }

    // Reset button
    const resetButton = this.add.graphics();
    resetButton.fillStyle(0xffa500, 1);
    resetButton.fillRoundedRect(0, 0, 80, 40, 10);

    resetButton.x = rightTextX - 70;
    resetButton.y = gameAreaY - 90;

    this.add
      .text(resetButton.x + 40, resetButton.y + 20, "Reset", {
        font: "bold 16px Comic Sans MS",
        color: "#005400",
      })
      .setOrigin(0.5);

    resetButton.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 80, 40),
      Phaser.Geom.Rectangle.Contains,
    );

    resetButton.on("pointerdown", () => {
      if (this.isAttempted) {
        this.recordScoreForPlayer();
      }
      this.registry.set("skipAttemptIncrement", true);
      this.scene.restart();
    });

    // Back button (bottom left)
    this.add
      .image(50, HEIGHT - 50, "fast-backward-button")
      .setDisplaySize(90, 90)
      .setInteractive()
      .on("pointerdown", () => {
        console.log("Shutdown event triggered");
        if (this.isAttempted) {
          this.recordScoreForPlayer();
        }
        this.registry.set(this.triesDataKey, 0);
        this.registry.set(this.scoreDataKey, 0);
        this.score = 0;
        this.scene.start(this.previousScene);
      });

    // Next button (bottom right)
    this.add
      .image(WIDTH - 50, HEIGHT - 50, "fast-forward-button")
      .setDisplaySize(90, 90)
      .setInteractive()
      .on("pointerdown", () => {
        if (this.isAttempted) {
          this.recordScoreForPlayer();
        }
        this.registry.set(this.triesDataKey, 0);
        this.registry.set(this.scoreDataKey, 0);
        this.score = 0;
        this.scene.start(this.nextScene);
      });
  }

  protected onDropPressed() {
    console.log("Drop pressed in base class");
  }

  private renderDynamicNumbers() {
    const triesText = this.add
      .text(
        rightTextX - 5,
        gameAreaY - 140,
        `Tries: ${this.registry.get(this.triesDataKey)}`,
        {
          font: "bold 14px Comic Sans MS",
          color: "#004400",
          align: "right",
        },
      )
      .setOrigin(1, 0.5);

    const triesDataChangeEventKey = `changedata-${this.triesDataKey}`;
    this.registry.events.on(
      triesDataChangeEventKey,
      (_parent: never, newValue: number) => {
        triesText.setText(`Tries: ${newValue}`);
      },
    );

    this.events.once("shutdown", () => {
      this.registry.events.off(triesDataChangeEventKey);
    });

    const scoreText = this.add
      .text(
        rightTextX - 5,
        gameAreaY - 110,
        `Score: ${this.registry.get(this.scoreDataKey)}`,
        {
          font: "bold 14px Comic Sans MS",
          color: "#004400",
          align: "right",
        },
      )
      .setOrigin(1, 0.5);
    const scoreDataChangeEventKey = `changedata-${this.scoreDataKey}`;
    this.registry.events.on(
      scoreDataChangeEventKey,
      (_parent: never, newValue: number) => {
        scoreText.setText(`Score: ${newValue}`);
      },
    );
    this.events.once("shutdown", () => {
      this.registry.events.off(scoreDataChangeEventKey);
    });
  }

  //Creates a track with (length,angle,X,Y)
  protected createTrack(
    length: number,
    angle: number,
    x: number,
    y: number,
  ): Phaser.Physics.Matter.Image {
    const height = 10;

    // Create the invisible physics body (the real track)
    const trackBody = this.matter.add.image(x, y, "track");
    trackBody.setDisplaySize(length, height);
    trackBody.setStatic(true);
    trackBody.setAngle(angle);
    trackBody.setFriction(0.05);
    trackBody.setFrictionStatic(0.5);
    trackBody.setVisible(false); // hide the placeholder body

    // Add a tiled visual overlay (not part of physics)
    const image = this.add.image(x, y, "log");
    image.setDisplaySize(length + 60, 100); // Stretch to exact dimensions
    image.setAngle(angle);

    return trackBody;
  }

  // Sets up a bowl where the marble will land
  protected setupBowl(bowlX: number, bowlY: number) {
    const bowlRadius = 42;
    const bowlImage = this.add.image(bowlX, bowlY + 12, "bowl");
    bowlImage.setOrigin(0.5, 0.5);
    bowlImage.setScale(0.1);
    bowlImage.setDepth(1);

    const arcLength = Math.PI * bowlRadius;
    const segments = Math.floor(arcLength / 18);
    const parts: MatterJS.BodyType[] = [];

    for (let i = 1; i <= segments - 1; i++) {
      const angle = Math.PI - (i * Math.PI) / segments;
      const x = bowlX + bowlRadius * Math.cos(angle);
      const y = bowlY - 16 + bowlRadius * Math.sin(angle);
      const circle = this.matter.bodies.circle(x, y, 6, {
        isStatic: true,
        friction: 0.01,
      });
      parts.push(circle);
    }

    const compoundBody = this.matter.body.create({ parts, isStatic: true });
    this.matter.world.add(compoundBody);

    //
    const sensor = this.matter.bodies.circle(bowlX, bowlY, 20, {
      isSensor: true,
      isStatic: true,
      label: "bowlSensor",
    });
    this.matter.world.add(sensor);
    this.bowlSensor = sensor;
  }

  //create a marble-releasing orange box
  protected setupBox(
    boxX: number,
    boxY: number,
    boxWidth: number,
    boxHeight: number,
  ) {
    const graphics = this.add.graphics();
    graphics.lineStyle(8, 0xff9900); // orange

    // Draw the left and right borders
    graphics.beginPath();
    graphics.moveTo(boxX - boxWidth / 2, boxY - 4 - boxHeight / 2);
    graphics.lineTo(boxX - boxWidth / 2, boxY - 4 + boxHeight / 2);
    graphics.moveTo(boxX + boxWidth / 2, boxY - 4 - boxHeight / 2);
    graphics.lineTo(boxX + boxWidth / 2, boxY - 4 + boxHeight / 2);
    graphics.strokePath();
    const wallThickness = 8; // same as graphics lineStyle
    const leftWall = this.matter.add.rectangle(
      boxX - boxWidth / 2,
      boxY - 4,
      wallThickness,
      boxHeight,
      { isStatic: true },
    );
    const rightWall = this.matter.add.rectangle(
      boxX + boxWidth / 2,
      boxY - 4,
      wallThickness,
      boxHeight,
      { isStatic: true },
    );

    // Add a yellow circle as the hinge point (for box rotation)
    this.add.circle(boxX - boxWidth / 2, boxY + boxHeight / 2, 6, 0xffcc00);

    // Create the lid texture
    const lidWidth = boxWidth;
    const lidHeight = 8;
    const lidGraphics = this.add.graphics();
    lidGraphics.fillStyle(0xff9900); // orange
    lidGraphics.fillRect(0, 0, lidWidth, lidHeight);
    lidGraphics.generateTexture("lid", lidWidth, lidHeight);
    lidGraphics.destroy();

    // // Add the lid as a physical object (can rotate)
    this.lid = this.matter.add.image(
      boxX - boxWidth / 2,
      boxY + boxHeight / 2,
      "lid",
    );
    this.lid.setOrigin(0, 0.5);
    this.lid.setAngle(0);
    this.lid.setStatic(true);

    //Display marble-background
    this.add.image(boxX, boxY, "marble-background").setScale(0.06).setDepth(0);
  }

  protected rotateLidWithCollider(lidCollider?: MatterJS.BodyType) {
    this.lid.setAngle(46);

    const radians = Phaser.Math.DegToRad(46);
    const lidX = this.lid.x;
    const lidY = this.lid.y;
    const lidWidth = this.lid.width;
    const lidHeight = this.lid.height;

    const centerX =
      lidX +
      (lidWidth / 2) * Math.cos(radians) -
      (lidHeight / 2) * Math.sin(radians);
    const centerY =
      lidY +
      (lidWidth / 2) * Math.sin(radians) +
      (lidHeight / 2) * Math.cos(radians);

    lidCollider = this.matter.add.rectangle(
      centerX,
      centerY,
      lidWidth,
      lidHeight,
      {
        isStatic: true,
        angle: radians,
        render: { visible: false },
      },
    );

    this.time.delayedCall(1000, () => {
      this.lid.setAngle(0);
      if (lidCollider) {
        this.matter.world.remove(lidCollider);
        lidCollider = undefined;
      }
    });
  }

  protected setupBounds() {
    const thickness = 50;

    const leftWall = this.matter.add.rectangle(
      gameAreaX - gameAreaWidth / 2 - thickness / 2,
      gameAreaY,
      thickness,
      gameAreaHeight + 100,
      { isStatic: true },
    );

    const rightWall = this.matter.add.rectangle(
      gameAreaX + gameAreaWidth / 2 + thickness / 2,
      gameAreaY,
      thickness,
      gameAreaHeight + 100,
      { isStatic: true },
    );

    const topWall = this.matter.add.rectangle(
      gameAreaX,
      gameAreaY - gameAreaHeight / 2 - thickness / 2,
      gameAreaWidth,
      thickness,
      { isStatic: true },
    );

    const bottomWall = this.matter.add.rectangle(
      gameAreaX,
      gameAreaY + gameAreaHeight / 2 + thickness / 2,
      gameAreaWidth,
      thickness,
      { isStatic: true },
    );

    this.matter.world.add([leftWall, rightWall, topWall, bottomWall]);
  }

  protected handleDrag(
    SNAP_X: number,
    SNAP_Y: number,
    marble?: Phaser.Physics.Matter.Image,
    onDrag?: () => void,
  ) {
    const SNAP_RADIUS = 30;
    if (!marble) {
      console.error("marble is undefined!");
      return;
    }

    this.input.setDraggable(marble);

    marble.on("dragstart", () => {
      if (onDrag) onDrag();

      // Make non-static during drag
      marble.setStatic(false);
      if (!this.isAttempted) {
        this.registry.inc(this.triesDataKey, 1);
        this.isAttempted = true;
        this.registry.set(`${this.levelKey}-isAttempted`, true);
      }
    });

    marble.on(
      "drag",
      (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        // Calculate target position (with bounds checking)
        const halfMarble = 20;
        const left = gameAreaX - gameAreaWidth / 2 + halfMarble;
        const right = gameAreaX + gameAreaWidth / 2 - halfMarble;
        const top = gameAreaY - gameAreaHeight / 2 + halfMarble;
        const bottom = gameAreaY + gameAreaHeight / 2 - halfMarble;

        const clampedX = Phaser.Math.Clamp(dragX, left, right);
        const clampedY = Phaser.Math.Clamp(dragY, top, bottom);

        // Check for snapping first
        const distance = Phaser.Math.Distance.Between(
          clampedX,
          clampedY,
          SNAP_X,
          SNAP_Y,
        );

        if (distance < SNAP_RADIUS) {
          // Snap to target position
          marble.setPosition(SNAP_X, SNAP_Y);
          marble.setVelocity(0, 0);
          this.isDragMarbleSnapped = true;
        } else {
          // Not in snap range, use physics movement from level 0
          this.isDragMarbleSnapped = false;

          // Calculate velocity needed to move toward pointer
          const dx = clampedX - marble.x;
          const dy = clampedY - marble.y;

          // Calculate distance to pointer
          const moveDistance = Math.sqrt(dx * dx + dy * dy);

          // Limit the speed to prevent tunneling
          const maxDistance = 12;

          if (moveDistance > maxDistance) {
            // Normalize the direction vector
            const nx = dx / moveDistance;
            const ny = dy / moveDistance;

            // Apply limited velocity in the right direction
            const speed = 10;
            marble.setVelocity(nx * speed, ny * speed);

            marble.x += nx * maxDistance * 0.5;
            marble.y += ny * maxDistance * 0.5;
          } else {
            // Set the velocity to reach the target
            const speed = 0.5;
            marble.setVelocity(dx * speed, dy * speed);
          }
        }

        marble.setIgnoreGravity(true);
        marble.setAngularVelocity(0);
      },
    );

    // After marble is dropped
    marble.on("dragend", () => {
      if (!this.isDragMarbleSnapped) {
        // Check if the marble is snapped
        marble.setStatic(false);
      }

      this.input.setDraggable(marble, false);
      marble.disableInteractive();
      marble.setIgnoreGravity(false);

      // Set up snap checking timer
      const snapCheck = this.time.addEvent({
        delay: 100,
        repeat: 19,
        callback: () => {
          if (!marble.active) {
            snapCheck.remove();
            return;
          }

          const distance = Phaser.Math.Distance.Between(
            marble.x,
            marble.y,
            SNAP_X,
            SNAP_Y,
          );

          if (distance < SNAP_RADIUS) {
            // Force the marble to snap precisely and stay there
            marble.setPosition(SNAP_X, SNAP_Y);
            marble.setVelocity(0, 0);
            marble.setAngularVelocity(0);
            marble.setStatic(true);
            this.isDragMarbleSnapped = true;
            snapCheck.remove();
          }

          if (marble.y > gameAreaY + gameAreaHeight) {
            snapCheck.remove();
          }
        },
      });
    });
  }

  private handleCollision(pair: MatterJS.ICollisionPair): void {
    const { bodyA, bodyB } = pair;
    const labelA = (bodyA as MatterJS.Body & { label?: string }).label;
    const labelB = (bodyB as MatterJS.Body & { label?: string }).label;

    // Check if the collision is between dropMarble and bowlSensor
    this.isDropMarble =
      (labelA === "dropMarble" && labelB === "bowlSensor") ||
      (labelB === "dropMarble" && labelA === "bowlSensor");

    if (this.isDropMarble) {
      // Update the score
      if (!this.hasScore) {
        this.score += 1;
        this.scoreForThisTry += 1;
        this.hasScore = true;
      }

      this.registry.set(this.scoreDataKey, this.score);
    }
  }

  protected recordDragPosition(
    marble: Phaser.Physics.Matter.Image,
    isDragging: boolean,
  ) {
    if (!isDragging || !marble.active) return;
    const level = this.levelKey;
    const startTime = this.registry.get(`${level}-startTime`);
    const position = {
      x: Math.round(marble.x),
      y: Math.round(marble.y),
      time: Date.now() - startTime, // milliseconds since drag started
    };

    this.dragPositions.push(position);
    console.log("Drag position:", position);
  }

  protected recordScoreForPlayer(): void {
    const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
    const level = this.levelKey; // Use the current level
    const attempt = this.attempt;
    const levelScore = this.registry.get(this.scoreDataKey);
    const startTime = this.registry.get(`${level}-startTime`);
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : 0;
    this.duration = duration;
    const scoringData = [
      {
        tries: this.registry.get(this.triesDataKey), // Current number of tries
        score: this.scoreForThisTry,
        duration: this.duration,
        ...(this.shouldRecordPath() && { path: this.dragPositions }), // Conditional
        ...(this.shouldRecordTrackPaths() && { trackPaths: this.trackPaths }), // Conditionally Include all track movements
      },
    ];

    // Call storeScoringDataForPlayer to save the score data into the scoring file
    storeScoringDataForPlayer(
      playerId,
      level,
      attempt,
      scoringData,
      levelScore,
      duration,
    );
  }

  private shouldRecordPath(): boolean {
    return ["Level0", "Level1", "Level2"].includes(this.levelKey);
  }

  private shouldRecordTrackPaths(): boolean {
    return ["Level3"].includes(this.levelKey);
  }

  protected releaseMarble(
    marble?: Phaser.Physics.Matter.Image,
    weight = 1,
    friction = 0.1,
  ) {
    if (!marble) return;
    marble.setStatic(false);
    marble.setMass(weight);
    marble.setAngularVelocity(0.15);
    marble.setVelocity(0, 0);
    marble.setFrictionAir(0.001);
    marble.setFrictionStatic(0.5);
    marble.setFriction(friction);
  }
}
