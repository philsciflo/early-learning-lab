import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level1 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level1");
  }

  create() {
    this.inIntro = true;
    super.create();
    const { width, height } = this.scale;

    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [500, height - 130, height, "brick2", 0, 0.16],
      [600, height - 370, height - 200, "brick2", 0, 0.16],
    ];
    this.mainBrickStart = [[1600, height - 130, 0.16]];

    //spawn bricks
    this.inIntro = false;
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);
    this.CreateUI();
    if (!this.data.get("introDone")) {
      this.runIntroSequence();
      this.data.set("introDone", true);
    }
    const blockPrompt = this.add
      .text(1600, height / 2 + 300, "Use this!", {
        fontFamily: "Comic Sans MS",
        fontSize: "48px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 12,
        align: "center",
      })
      .setOrigin(0.5);
    this.mainBricks[0].on("pointerdown", () => {
      blockPrompt.destroy();
    });
  }

  private async runIntroSequence() {
    this.inIntro = true;
    this.resumeButton.setVisible(false);
    const { width, height } = this.scale;
    await this.delay(500);
    this.bricks.forEach((brick) => {
      brick.setStatic(false);
    });
    this.simulating = true;
    if (this.mouseSpring) {
      this.mouseSpring.destroy();
    }
    this.collapsed = false;

    await this.delay(1800);
    this.bricks.forEach((brick) => brick.setStatic(true));
    this.mainBricks.forEach((brick) => brick.setStatic(true));
    const promptText = this.add
      .text(
        width / 2,
        height / 2 - 50,
        "Can you stop the blocks from falling?",
        {
          fontFamily: "Comic Sans MS",
          fontSize: "72px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 12,
          align: "center",
        },
      )
      .setOrigin(0.5);

    await this.delay(3000);
    this.mainBricks.forEach((brick) => brick.setStatic(false));
    this.resumeButton.setVisible(true);
    this.mouseSpring = this.matter.add.mouseSpring({
      stiffness: 0.6,
      length: 1,
    });
    promptText.destroy();
    this.simulating = false;
    this.bricks[0].setPosition(500, height - 140);
    this.bricks[1].setPosition(600, height - 370);
    this.inIntro = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
