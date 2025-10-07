/* eslint-disable @typescript-eslint/no-explicit-any */
// to do: change mousespring from deleting to using collisionfilter? default 0x0001 applies to mousespring

import { Scene } from "phaser";
import { addButtonTweens } from "../utils/buttonTweens";
import { DataCollector } from "../utils/DataCollector.ts";
// import { storeScoringData, getAttemptData } from "../utils/Scoring.ts";

export class LevelBaseScene extends Scene {
  protected inIntro = false;
  protected bricks: Phaser.Physics.Matter.Sprite[] = [];
  protected mainBricks!: Phaser.Physics.Matter.Sprite[] = [];
  protected mouseSpring!: Phaser.Physics.Matter.MatterMouseSpring | undefined;
  protected timer?: Phaser.Time.TimerEvent;
  protected counting = false;
  protected collapsed = false;
  protected countdownText!: Phaser.GameObjects.Text;
  protected countdownTime = 3;
  protected resumeButton!: Phaser.GameObjects.Image;
  protected resetButton!: Phaser.GameObjects.Image;
  protected backButton!: Phaser.GameObjects.Image;
  protected simulating = false;
  protected mainBrickCategory = 0x0002;
  protected brickCategory = 0x0004;
  protected defaultCategory = 0x0001;

  // Scoring
  protected score: number;
  protected resetCount: number;
  protected levelStartTime: Date;
  protected levelStartTimeNumber: number;

  protected constructor(sceneKey: string) {
    super(sceneKey);
    // this.score = 0;
    // this.resetCount = 0;
    // this.levelStartTime = new Date();
    // this.levelStartTimeNumber = Date.now();
  }

  preload() {
    this.load.image("brick", "assets/block3.png");
    this.load.image("brick2", "assets/block4.png");
    this.load.image("begin", "assets/power-button.png");
    this.load.image("restart", "assets/undobutton.png");
    this.load.image("back", "assets/previousbutton.png");
    this.load.image("next", "assets/nextbutton.png");
    this.load.image("LvBg", "assets/LvBg.png");
    this.load.image("platform", "assets/platform.png");
    this.load.image("semicircle", "assets/block8.png");
    this.load.image("longbrick1", "assets/block5.png");
    this.load.image("longbrick2", "assets/block6.png");
    this.load.image("longbrick3", "assets/block7.png");
    this.load.image("triangle1", "assets/block1.png");
    this.load.image("triangle2", "assets/block2.png");

    //sound
    this.load.audio("collisionSound", "assets/hit.m4a");
    this.load.audio("button-press", "assets/button-press.mp3");
    this.load.audio("win", "assets/level-fail.mp3");
    this.load.audio("lose", "assets/level-complete.mp3");
  }

  create() {
    //clear arrays for entering scene
    this.bricks = [];
    this.mainBricks = [];
    this.simulating = false;
    //Add mousespring for drag and drop
    this.mouseSpring = this.matter.add.mouseSpring({
      stiffness: 0.6,
      length: 1,
    });
    //set edge collisions
    const { width, height } = this.scale;
    // eslint-disable-next-line prettier/prettier
    this.matter.world.setBounds(0, 0, width, height, 64, true, true, true, true,);

    //create sounds
    const collisionSound = this.sound.add("collisionSound");
    //bg
    this.add.image(0, 0, "LvBg").setOrigin(0, 0).setScale(1.1);
    //Instructions
    if (!this.inIntro) {
      this.add
        .text(1200, 100, "Stop the blocks from falling!", {
          fontFamily: "Arial Black",
          fontSize: "54px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
          align: "center",
        })
        .setOrigin(0.5);
    }
    //platform
    this.matter.add
      .sprite(650, height + 503, "platform", undefined, {
        ignorePointer: true,
        friction: 1,
        frictionStatic: 10,
        restitution: 0.6,
        frictionAir: 0.01,
      })
      .setStatic(true)
      .setVisible(false)
      .setScale(5)
      .setCollisionCategory(this.brickCategory);

    //create timer text
    this.countdownText = this.add
      .text(1500, 200, "", {
        fontFamily: "Comic Sans MS",
        fontSize: "96px",
        fontStyle: "bold",
        color: "#ffcc00", // bright yellow
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    //sound listening
    this.matter.world.on(
      "collisionstart",
      (event: Phaser.Types.Physics.Matter.MatterCollisionEvent) => {
        event.pairs.forEach((pair) => {
          const bodyA = pair.bodyA;
          const bodyB = pair.bodyB;
          const isBrickCollision =
            (bodyA.gameObject &&
              this.bricks.includes(
                bodyA.gameObject as Phaser.Physics.Matter.Sprite,
              )) ||
            (bodyB.gameObject &&
              this.bricks.includes(
                bodyB.gameObject as Phaser.Physics.Matter.Sprite,
              ));
          if (!isBrickCollision) return;
          const dx = bodyA.velocity.x - bodyB.velocity.x;
          const dy = bodyA.velocity.y - bodyB.velocity.y;
          const relativeSpeed = Math.sqrt(dx * dx + dy * dy);

          if (relativeSpeed > 6) {
            collisionSound.play();
          }
        });
      },
    );

    //startMouseTracking
    DataCollector.startMouseTracking(
      this,
      Number(this.scene.key.replace("Level", "")),
    );
  }

  //spawn bricks based off number of coords
  protected createBricks(
    coords: [number, number, number, string, number, number, number?][],
  ) {
    coords.forEach(([x, y, crit, spriteUsed, rotation, scale, colour]) => {
      let vertices: { x: number; y: number }[] | undefined;
      //handle semicircle
      if (spriteUsed === "semicircle") {
        const w = 1000;
        const h = 525;
        const segments = 15;
        const radiusX = w / 2;
        const radiusY = h;
        vertices = Array.from({ length: segments + 1 }, (_, i) => {
          const angle = Math.PI * (i / segments);
          return {
            x: radiusX * Math.cos(Math.PI - angle),
            y: -radiusY * Math.sin(angle),
          };
        });
      } else if (spriteUsed === "triangle1" || spriteUsed === "triangle2") {
        const w = 1000;
        const h = 525;
        vertices = [
          { x: 0, y: 0 },
          { x: 0, y: -1.9 * h },
          { x: 25, y: -1.9 * h },
          { x: w, y: -25 },
          { x: w, y: 0 },
        ];
      }
      const options: Phaser.Types.Physics.Matter.MatterBodyConfig = {
        ignorePointer: true,
        friction: 1,
        frictionStatic: 100,
        restitution: 0.6,
        frictionAir: 0.01,
        ...(vertices ? { vertices } : {}),
      };
      const brick2 = this.matter.add
        .sprite(x, y, spriteUsed, undefined, options)
        .setScale(scale)
        .setRotation(rotation);
      if (colour) {
        brick2.setTint(colour);
      }
      brick2.setCollisionCategory(this.brickCategory);
      brick2.setCollidesWith([this.brickCategory, this.mainBrickCategory]);
      (brick2 as any).criticalHeight = crit;
      this.bricks.push(brick2);
    });
  }

  protected createMainBricks(coords: [number, number, number][]) {
    coords.forEach(([x, y, scale]) => {
      const mainBrick = this.matter.add.sprite(x, y, "brick", undefined, {
        restitution: 0.6,
        friction: 1,
        frictionStatic: 1,
        frictionAir: 0.05,
      });

      mainBrick.setScale(scale);
      mainBrick.setCollisionCategory(this.mainBrickCategory);
      mainBrick.setCollidesWith([this.mainBrickCategory, this.defaultCategory]);
      this.bricks.push(mainBrick);
      this.mainBricks.push(mainBrick);
    });
    this.bricks.forEach((brick) => {
      if (!this.mainBricks.includes(brick)) {
        brick.setStatic(true);
      }
    });
    this.mainBricks.forEach((mainBrick) => {
      const scaleX = mainBrick.displayWidth / mainBrick.width;
      const scaleY = mainBrick.displayHeight / mainBrick.height;
      mainBrick.setInteractive({ cursor: "pointer" });
      mainBrick.on("pointerover", () => {
        if (!this.simulating) {
          mainBrick.setTint(0x90cc90);
        }
      });
      mainBrick.on("pointerdown", () => {
        if (!this.simulating) {
          this.tweens.add({
            targets: mainBrick,
            scaleX: scaleX * 1.1,
            scaleY: scaleY * 1.1,
            duration: 200,
            ease: "Power2",
          });
          mainBrick.setCollidesWith([this.defaultCategory]);
          mainBrick
            .setRotation(0)
            .setAngularVelocity(0)
            .setScale(scaleX * 1.1, scaleY * 1.1);
        }
      });
      this.input.on("pointerup", () => {
        this.tweens.add({
          targets: mainBrick,
          scaleX: scaleX,
          scaleY: scaleY,
          duration: 200,
          ease: "Power2",
        });
        mainBrick.setCollidesWith([
          this.brickCategory,
          this.mainBrickCategory,
          this.defaultCategory,
        ]).setAngularVelocity(0).setRotation(0);
      });
      mainBrick.setCollidesWith([
        this.brickCategory,
        this.mainBrickCategory,
        this.defaultCategory,
      ]);
      mainBrick.on("pointerout", () => mainBrick.clearTint());
    });
  }

  protected CreateUI() {
    //begin simulation button
    this.resumeButton = this.add.image(300, 100, "begin");
    this.resumeButton.setScale(0.3);
    this.resumeButton.setInteractive({ useHandCursor: true });
    addButtonTweens(
      this,
      this.resumeButton,
      () => {
        this.bricks.forEach((brick) => {
          brick.setStatic(false);
          this.resumeButton.setVisible(false);
        });
        this.simulating = true;
        if (this.mouseSpring) {
          this.mouseSpring.destroy();
        }
        this.collapsed = false;
      },
      "button-press",
    );

    //restart level button
    this.resetButton = this.add.image(500, 100, "restart");
    this.resetButton.setScale(0.3);
    this.resetButton.setInteractive({ useHandCursor: true });
    addButtonTweens(
      this,
      this.resetButton,
      () => {
        this.scene.restart();
      },
      "button-press",
    );

    //back button
    this.backButton = this.add.image(100, 100, "back");
    this.backButton.setScale(0.3);
    this.backButton.setInteractive();
    addButtonTweens(
      this,
      this.backButton,
      () => {
        this.scene.start("LevelSelect");
      },
      "button-press",
    );
  }
  //Handle game over screen
  private handleEnd(scene: string) {
    //stopMouseTracking
    DataCollector.stopMouseTracking();

    const number = Number(scene.substring(5));
    let sceneForward = scene.substring(0, 5) + (number + 1);
    if (this.game.scene.getScene(sceneForward) == null) {
      sceneForward = "LevelSelect";
    }
    this.bricks.forEach((brick) => {
      brick.setStatic(true);
    });
    const { width, height } = this.scale;
    [this.resumeButton, this.resetButton, this.backButton].forEach((btn) => {
      if (btn) btn.setVisible(false).disableInteractive();
    });
    this.add
      .rectangle(width / 2, height / 2, 700, 500, 0xeeeeee, 0.9)
      .setStrokeStyle(12, 0xffffff)
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height / 2 - 120,
        this.collapsed ? "LEVEL FAILED!" : "LEVEL COMPLETE!",
        {
          fontFamily: "Comic Sans MS",
          fontSize: "72px",
          fontStyle: "bold",
          color: this.collapsed ? "#ff6666" : "#66ff66",
          stroke: "#000000",
          strokeThickness: 8,
          align: "center",
        },
      )
      .setOrigin(0.5);
    if (!this.collapsed) {
      this.sound.play("lose");
    } else {
      this.sound.play("win");
    }
    if (!this.collapsed) {
      const nextButton = this.add.image(
        width / 2 + 180,
        height / 2 + 80,
        "next",
      );
      nextButton.setScale(0.3).setInteractive({ useHandCursor: true });
      addButtonTweens(
        this,
        nextButton,
        () => {
          this.scene.start(sceneForward);
        },
        "button-press",
      );
    }
    this.backButton
      .setPosition(width / 2 - 180, height / 2 + 80)
      .setVisible(true)
      .setInteractive()
      .setDepth(1);

    this.resetButton
      .setPosition(width / 2, height / 2 + 80)
      .setVisible(true)
      .setInteractive()
      .setDepth(1);
  }

  //create and start  countdown timer
  private startCountdown() {
    if (this.inIntro) return;
    this.counting = true;
    this.countdownTime = 1;
    this.countdownText.setText(this.countdownTime.toString()).setAlpha(0);
    this.tweens.add({
      targets: this.countdownText,
      alpha: 0,
      duration: 300,
      ease: "Linear",
    });

    this.timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.countdownTime--;
        this.countdownText.setText(this.countdownTime.toString());
        if (this.countdownTime <= 0) {
          this.handleEnd(this.scene.key);
        }
      },
      callbackScope: this,
      repeat: this.countdownTime - 1,
    });
  }

  //reset countdown timer
  private resetCountdown() {
    this.counting = false;
    if (this.timer) {
      this.timer.remove(false);
      this.timer = undefined;
    }
    this.tweens.add({
      targets: this.countdownText,
      alpha: 0,
      duration: 300,
      ease: "Linear",
    });
  }

  update() {
    const { width, height } = this.scale;
    //measures to ensure bricks dont leave the scene, and to limit spinning / bugging out
    const maxAngularVelocity = 0.05;
    //const maxVelocity = 30; // idk if this should exist
    this.bricks.forEach((brick) => {
      if (brick.getAngularVelocity() > maxAngularVelocity) {
        brick.setAngularVelocity(maxAngularVelocity);
      } else if (brick.getAngularVelocity() < -maxAngularVelocity) {
        brick.setAngularVelocity(-maxAngularVelocity);
      }
      if ((brick as any).criticalHeight !== undefined) {
        const critHeight = (brick as any).criticalHeight;
        if (brick.y > critHeight) {
          brick.setTint(0xcccccc);
        } else {
          brick.clearTint();
        }
      }
    });
    this.mainBricks.forEach((brick) => {
      const halfWidth = brick.displayWidth / 2;
      const halfHeight = brick.displayHeight / 2;

      let newX = brick.x;
      let newY = brick.y;
      if (brick.x - halfWidth < 0) {
        newX = halfWidth;
        brick.rotation = 0;
      } else if (brick.x + halfWidth > width) {
        newX = width - halfWidth;
        brick.rotation = 0;
      }

      if (brick.y - halfHeight < 0) {
        newY = halfHeight;
        brick.rotation = 0;
      } else if (brick.y + halfHeight > height - 40) {
        newY = height - halfHeight - 40;
        brick.rotation = 0;
      }

      if (newX !== brick.x || newY !== brick.y) {
        brick.setPosition(newX, newY);
        brick.setVelocity(0, 0);
      }
    });
    const isStable = this.bricks.every((brick) => {
      if (brick.isStatic()) return false;
      const vel = brick.body.velocity;
      const aboveCrit =
        (brick as any).criticalHeight !== undefined
          ? brick.y <= (brick as any).criticalHeight
          : true;
      if (!aboveCrit) {
        this.collapsed = true;
      }
      return Math.abs(vel.x) < 0.1 && Math.abs(vel.y) < 0.1;
    });
    if (isStable) {
      if (!this.counting) {
        this.startCountdown();
      }
    } else {
      if (this.counting) {
        this.resetCountdown();
      }
    }
  }

  // protected recordScoringData(): void {
  //   const playerID = this.registry.get("playerID");
  //
  //   // LEVEL_DATA Structure
  //   const levelName = this.scene.key;
  //   const score = this.score;
  //   const resetCount = this.resetCount;
  //   // const attemptNumber = this.attempt;
  //   const attemptNumber = 0;
  //
  //   // Calculate time taken for current level
  //   const endTime = Date.now();
  //   const duration = this.levelStartTime ? endTime - this.levelStartTimeNumber : 0;
  //
  //   // Calculate mouse locations
  //   const mouseClicks = DataCollector.getClickRecords();
  //   const mouseLocation = DataCollector.getMouseMovements();
  //
  //   const currentAttemptData = {
  //       attemptNumber,
  //       duration,
  //       mouseClicks,
  //       mouseLocation
  //   }
  //
  //   let attemptData = getAttemptData(playerID, levelName);
  //   if (attemptData == undefined) {
  //       attemptData = [];
  //   }
  //   attemptData.push(currentAttemptData);
  //
  //   // Call storeScoringDataForPlayer to save the score data into the scoring file
  //   storeScoringData(
  //     playerID,
  //     levelName,
  //     score,
  //     resetCount,
  //     this.levelStartTime,
  //     attemptData
  //   );
  // }
}
