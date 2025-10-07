import { Scene } from "phaser";
import { Cup } from "../Cup.ts";
import { DataCollector } from "../utils/DataCollector.ts";
import { storeScoringData, getAttemptData } from "../utils/Scoring.ts";

export abstract class AbstractCupScene extends Scene {
  protected cups: (Cup | Phaser.Types.Physics.Arcade.ImageWithDynamicBody)[][];
  protected candies: Phaser.Physics.Arcade.Image[];
  protected width: number;
  protected height: number;
  protected cupColours: Set<number>;
  protected jarBottom: Phaser.Types.Physics.Arcade.ArcadeColliderType;
  protected candiesDropped: boolean;
  protected tweensWorking: boolean[];
  protected movingCup: [Cup, Phaser.Types.Physics.Arcade.ImageWithDynamicBody];
  protected frameCount: number;

  // Scoring
  protected score: number;
  protected resetCount: number;
  protected levelStartTime: Date;
  protected levelStartTimeNumber: number;

  protected constructor(sceneKey: string) {
    super(sceneKey);
    this.score = 0;
    this.resetCount = 0;
    this.levelStartTime = new Date();
    this.levelStartTimeNumber = Date.now();
  }

  preload() {
    this.load.image("forward", "assets/nextbutton.png");
    this.load.image("backward", "assets/previousbutton.png");
    this.load.image("background", "assets/Magic Cups v2.png");
    this.load.image("jar", "assets/jar.png");
    this.load.image("candy1", "assets/candy1.png");
    this.load.image("candy2", "assets/candy2.png");
    this.load.image("cup1", "assets/cup1.png");
    this.load.image("cup1front", "assets/cup1front.png");
    this.load.image("cup2", "assets/cup2.png");
    this.load.image("cup2front", "assets/cup2front.png");
    this.load.image("cup3", "assets/cup3.png");
    this.load.image("cup3front", "assets/cup3front.png");
    this.load.image("cup4", "assets/cup4.png");
    this.load.image("cup4front", "assets/cup4front.png");
    this.load.image("cup5", "assets/cup5.png");
    this.load.image("cup5front", "assets/cup5front.png");
    this.load.image("cover", "assets/cover.png");
    this.load.image("large-cover", "assets/2cupcover.png");
    this.load.image("hoiho", "assets/hoiho.png");
  }

  create() {
    this.cups = [];
    this.candies = [];
    this.cupColours = new Set<number>();
    this.tweensWorking = [];
    const { width, height } = this.scale;
    this.width = width;
    this.height = height;
    this.candiesDropped = false;
    this.frameCount = -1;
    this.add.image(this.width / 2, this.height / 2, "background");
    this.add
      .image(this.width - 160, this.height / 2 - 80, "hoiho")
      .setScale(0.4);

    // add the mouse tracking
    // start mouse tracking for level scenes only (sample every 50ms)
    // Scene names are "Level1", "Level2"...; don't start on MainMenu
    if (this.scene.key.startsWith("Level")) {
      const levelNum = Number(this.scene.key.replace("Level", ""));
      DataCollector.startMouseTracking(this, levelNum, 50);
    }
    //end for this part
  }

  protected createCup(scene: Phaser.Scene, x: number) {
    const newCup = new Cup(scene, this.width / 2 + x, 920, this.cupColours)
      .setInteractive()
      .on("pointerdown", () => {
        if (this.tweensWorking.length == 0 && this.candiesDropped) {
          this.tweensWorking.push(true);
          this.movingCup = [newCup, frontCup];
          this.frameCount = 0;
          //this.tipCups(newCup, frontCup);
        }
      })
      .setDepth(1);
    const frontCup = this.physics.add
      .image(this.width / 2 + x, 920, "cup" + newCup.colour + "front")
      .setDepth(3)
      .setScale(0.5, 0.5);
    frontCup.body.allowGravity = false;
    this.cupColours.add(newCup.colour);
    const cupGroup = [newCup, frontCup];
    this.cups.push(cupGroup);
  }

  protected createCandy(x: number) {
    const randTexture = Math.floor(Math.random() * 2) + 1;
    const candyX = this.width / 2 + x;

    const texture = "candy" + randTexture;
    const candy = this.physics.add
      .image(candyX, 600, texture)
      .setScale(0.20)
      .setBounce(0)
      .setCollideWorldBounds(false)
      .setDepth(2)
      .setDrag(0.55);
    candy.body.useDamping = true;
    candy.body.setAllowGravity(false);
    this.physics.add.collider(candy, this.jarBottom);
    this.candies.push(candy);
    for (const cup of this.cups) {
      cup[0].addColliders(candy);
    }
  }

  protected destroyCandy() {
    for (const candy of this.candies) {
      candy.destroy();
    }
    this.candies.length = 0;
  }

  protected destroyCups() {
    for (const cup of this.cups) {
      cup[0].destroy();
      cup[1].destroy();
    }
    //console.log(this.cups.length);
    this.cupColours.clear();
    //console.log(this.cupColours.size);
    this.cups.length = 0;
    //console.log(this.cups.length);
  }

  protected CreateUI(scene: string, instruction = "Find the Candy!") {
    const number = Number(scene.substring(5));
    let sceneBack = scene.substring(0, 5) + (number - 1);
    let sceneForward = scene.substring(0, 5) + (number + 1);
    if (this.game.scene.getScene(sceneBack) == null) {
      sceneBack = "MainMenu";
    } else if (this.game.scene.getScene(sceneForward) == null) {
      sceneForward = "MainMenu";
    }

    this.add
      .image(150, 100, "backward")
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.start(sceneBack);
      })
      .setOrigin(0.5)
      .setScale(0.25);

    this.add
      .image(this.width - 150, 100, "forward")
      .setInteractive()
      .on("pointerdown", () => {
        DataCollector.stopMouseTracking();
        this.recordScoringData();
        //DataCollector.clearAllData(); //delete it
        this.levelStartTimeNumber = Date.now();
        this.scene.start(sceneForward);
      })
      .setOrigin(0.5, 0.5)
      .setScale(0.25);

    this.add
      .text(
        this.width / 2,
        100,
        "Magic Cups - " + scene.substring(0, 5) + " " + scene.substring(5),
        {
          fontFamily: "Arial Black",
          fontSize: 64,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
          align: "center",
        },
      )
      .setOrigin(0.5, 0.5);

    this.add
      .text(this.width / 2, 175, instruction, {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.add.image(150, 910, "jar").setScale(0.3, 0.3).setDepth(10);

    this.jarBottom = this.physics.add.image(150, 1050, "").setVisible(false);
    this.jarBottom.displayWidth = 150;
    this.jarBottom.displayHeight = 10;
    this.jarBottom.body.setImmovable(true);
    this.jarBottom.body.allowGravity = false;

    this.add
      .text(1500, 450, "Reset", {
        fontFamily: "Arial Black",
        fontSize: 40,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        if (this.tweensWorking.length == 0) {
          this.frameCount = -1;
          this.destroyCandy();
          this.generateCups();
          this.generateCandy();
          this.candiesDropped = false;
          this.resetCount += 1;
        }
      });

    this.add
      .text(1500, 550, "Drop", {
        fontFamily: "Arial Black",
        fontSize: 40,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        if (!this.candiesDropped) {
          this.dropCandy();

          // TODO: Add actual scoring
          this.score += 1;
        }
      });
  }

  protected dropCover(x: number, sprite = "cover") {
    this.tweensWorking.push(true);
    const scale = sprite == "cover" ? 0.35 : 0.3;
    const cover = this.add
      .image(this.width / 2 + x, -100, sprite)
      .setDepth(5)
      .setScale(scale);
    this.tweens.add({
      targets: cover,
      y: 700,
      duration: 1250,
      ease: "Linear",
    });
    this.tweens.add({
      delay: 2500,
      targets: cover,
      y: 870,
      duration: 1000,
      ease: "Linear",
    });
    this.tweens.add({
      delay: 4000,
      targets: cover,
      y: -200,
      duration: 1000,
      ease: "Linear",
      onComplete: () => {
        cover.destroy();
        this.candiesDropped = true;
        this.tweensWorking.pop();
      },
    });
  }

  protected tipCups(
    newCup: Cup,
    frontCup: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
  ) {
    for (const candy of this.candies) {
      candy.setDrag(0.0000001);
    }
    const startX = newCup.x;
    const startY = newCup.y;
    const startAngle = newCup.angle;
    let timeOffset = 0;
    const x = 150;
    const y = this.height / 2 - 200;
    const xVelocity = (x - newCup.x) / 2;
    const yVelocity = (y - newCup.y) / 2;
    newCup.setVelocity(0, yVelocity);
    frontCup.body.setVelocity(0, yVelocity);
    setTimeout(
      () => {
        newCup.setVelocity(0, 0);
        frontCup.body.setVelocity(0, 0);
      },
      (timeOffset += 1000),
    );
    setTimeout(
      () => {
        newCup.setVelocity(xVelocity, yVelocity / 2);
        frontCup.body.setVelocity(xVelocity, yVelocity / 2);
      },
      (timeOffset += 10),
    );
    setTimeout(
      () => {
        newCup.setVelocity(0, 0);
        frontCup.body.setVelocity(0, 0);
        newCup.setAngularVelocity(180);
        frontCup.body.setAngularVelocity(180);
        for (const candy of this.candies) {
          candy.setDrag(0.55);
        }
      },
      (timeOffset += 2000),
    );
    setTimeout(() => {
      newCup.drop();
    }, timeOffset);
    setTimeout(
      () => {
        frontCup.body.setAngularVelocity(0);
        newCup.setAngularVelocity(0);
      },
      (timeOffset += 1000),
    );
    for (let i = 0; i < 2; i++) {
      const shakeValue = 60;
      setTimeout(
        () => {
          newCup.setVelocity(0, shakeValue);
          frontCup.body.setVelocity(0, shakeValue);
        },
        (timeOffset += 300),
      );
      setTimeout(
        () => {
          newCup.setVelocity(0, -shakeValue);
          frontCup.body.setVelocity(0, -shakeValue);
        },
        (timeOffset += 300),
      );
    }
    setTimeout(
      () => {
        frontCup.body.setAngularVelocity(90);
        newCup.setAngularVelocity(90);
        newCup.setVelocity(-xVelocity, -yVelocity / 2);
        frontCup.body.setVelocity(-xVelocity, -yVelocity / 2);
      },
      (timeOffset += 500),
    );
    setTimeout(
      () => {
        newCup.setVelocity(0, 0);
        frontCup.body.setVelocity(0, 0);
        frontCup.body.setAngularVelocity(0);
        newCup.setAngularVelocity(0);
        // frontCup.angle = startAngle;
        // newCup.angle = startAngle;
        // frontCup.x = startX;
        // frontCup.y = startY;
        // newCup.x = startX;
        // newCup.y = startY;
      },
      (timeOffset += 2000),
    );
    setTimeout(
      () => {
        newCup.setVelocity(0, -yVelocity);
        frontCup.body.setVelocity(0, -yVelocity);
      },
      (timeOffset += 10),
    );
    setTimeout(
      () => {
        newCup.setVelocity(0, 0);
        frontCup.body.setVelocity(0, 0);
        this.tweensWorking.pop();
      },
      (timeOffset += 1000),
    );
  }

  private xVelocity: number;
  private yVelocity: number;
  private y: number;
  update() {
    if (this.frameCount >= 0) {
      const newCup = this.movingCup[0];
      const frontCup = this.movingCup[1];
      const x = 150;
      if (this.frameCount === 0) {
        for (const candy of this.candies) {
          candy.setDrag(0.0000000001);
        }
        this.y = this.height / 2 - 200;
        this.xVelocity = (x - newCup.x) / 2;
        this.yVelocity = (this.y - newCup.y) / 2;
        newCup.setVelocity(0, this.yVelocity);
        frontCup.body.setVelocity(0, this.yVelocity);
      } else if (this.frameCount === 60) {
        newCup.setVelocity(0, 0);
        frontCup.body.setVelocity(0, 0);
      } else if (this.frameCount === 62) {
        newCup.setVelocity(this.xVelocity, this.yVelocity / 2);
        frontCup.body.setVelocity(this.xVelocity, this.yVelocity / 2);
      } else if (this.frameCount === 182) {
        newCup.setVelocity(0, 0);
        frontCup.body.setVelocity(0, 0);
        newCup.setAngularVelocity(180);
        frontCup.body.setAngularVelocity(180);
        for (const candy of this.candies) {
          candy.setDrag(0.55);
        }
      } else if (this.frameCount === 242) {
        newCup.drop();
        frontCup.body.setAngularVelocity(0);
        newCup.setAngularVelocity(0);
      } else if (this.frameCount === 260) {
        newCup.setVelocity(0, 60);
        frontCup.body.setVelocity(0, 60);
      } else if (this.frameCount === 278) {
        newCup.setVelocity(0, -60);
        frontCup.body.setVelocity(0, -60);
      } else if (this.frameCount === 296) {
        newCup.setVelocity(0, 60);
        frontCup.body.setVelocity(0, 60);
      } else if (this.frameCount === 314) {
        newCup.setVelocity(0, -60);
        frontCup.body.setVelocity(0, -60);
      } else if (this.frameCount === 332) {
        frontCup.body.setAngularVelocity(90);
        newCup.setAngularVelocity(90);
        newCup.setVelocity(-this.xVelocity, -this.yVelocity / 2);
        frontCup.body.setVelocity(-this.xVelocity, -this.yVelocity / 2);
      } else if (this.frameCount === 452) {
        newCup.setVelocity(0, 0);
        frontCup.body.setVelocity(0, 0);
        frontCup.body.setAngularVelocity(0);
        newCup.setAngularVelocity(0);
      } else if (this.frameCount === 454) {
        newCup.setVelocity(0, -this.yVelocity);
        frontCup.body.setVelocity(0, -this.yVelocity);
      } else if (this.frameCount === 514) {
        newCup.setVelocity(0, 0);
        frontCup.body.setVelocity(0, 0);
        this.tweensWorking.pop();
      } else if (this.frameCount === 515) {
        this.frameCount = -2;
      }
      this.frameCount++;
    }
  }

  protected abstract dropCandy(): void;
  protected abstract generateCandy(): void;
  protected abstract generateCups(): void;

  protected recordScoringData(): void {
    const playerID = this.registry.get("playerID");

    // LEVEL_DATA Structure
    const levelName = this.scene.key;
    const score = this.score;
    const resetCount = this.resetCount;
    // const attemptNumber = this.attempt;
    const attemptNumber = 0;

    // Calculate time taken for current level
    const endTime = Date.now();
    const duration = this.levelStartTime ? endTime - this.levelStartTimeNumber : 0;

    // Calculate mouse locations
    const mouseClicks = DataCollector.getClickRecords();
    const mouseLocation = DataCollector.getMouseMovements();

    const currentAttemptData = {
        attemptNumber,
        duration,
        mouseClicks,
        mouseLocation
    }

    let attemptData = getAttemptData(playerID, levelName);
    if (attemptData == undefined) {
        attemptData = [];
    }
    attemptData.push(currentAttemptData);

    // Call storeScoringDataForPlayer to save the score data into the scoring file
    storeScoringData(
      playerID,
      levelName,
      score,
      resetCount,
      this.levelStartTime,
      attemptData
    );
  }
}
