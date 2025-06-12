import { Scene } from "phaser";
import { renderTextBanner } from "../banners.ts";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  QUARTER_WIDTH,
  WIDTH,
  HEIGHT,
} from "../constants.ts";

export class ModeSelection extends Scene {
  private selectedMode: "drop" | "catch" | null = null;
  private dropCircle!: Phaser.GameObjects.Arc;
  private catchCircle!: Phaser.GameObjects.Arc;

  private catchLevels  = ["Level0", "Level1", "Level2", "Level3", "Level4"];
  private dropLevels = ["Level0Drop", "Level1Drop", "Level2Drop", "Level3Drop", "Level4Drop"];

  private dropLevelIndex = 0;
  private catchLevelIndex = 0;

  constructor() {
    super("ModeSelection");
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("power", "assets/power-button.png");
  }

  create() {
    // 背景图
    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1);

    // 顶部标题（Play 框）
    renderTextBanner(
      this,
      {
        backgroundAlpha: 0.6,
      },
      {
        text: 'Play: \r "Apple Catcher"',
        yOffset: 10,
      },
    );

    // Select Game 区块
    renderTextBanner(
      this,
      {
        y: HALF_HEIGHT,
        height: 150,
        backgroundAlpha: 0.6,
      },
      {
        text: "Select Game:",
        yOffset: 10,
      },
    );

    const buttonY = HALF_HEIGHT + 110;
    const centerX = HALF_WIDTH;
    const spacing = 140;

    const circleRadius = 16;
    const defaultFill = 0xffffff;
    const selectedFill = 0x00ff00;
    const borderColor = 0x000000;
    const defaultAlpha = 0.6;
    const selectedAlpha = 1;

    // Drop 选择圈
    this.dropCircle = this.add
      .circle(centerX - spacing, buttonY, circleRadius, defaultFill)
      .setStrokeStyle(2, borderColor)
      .setAlpha(defaultAlpha)
      .setInteractive()
      .on("pointerdown", () => this.selectMode("drop"));

    this.add
      .text(centerX - spacing + 30, buttonY, "Drop", {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#000000",
      })
      .setOrigin(0, 0.5)
      .setInteractive()
      .on("pointerdown", () => this.selectMode("drop"));

    // Catch 选择圈
    this.catchCircle = this.add
      .circle(centerX + 20, buttonY, circleRadius, defaultFill)
      .setStrokeStyle(2, borderColor)
      .setAlpha(defaultAlpha)
      .setInteractive()
      .on("pointerdown", () => this.selectMode("catch"));

    this.add
      .text(centerX + 40, buttonY, "Catch", {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#000000",
      })
      .setOrigin(0, 0.5)
      .setInteractive()
      .on("pointerdown", () => this.selectMode("catch"));

    // Power 按钮
    this.add
      .image(HALF_WIDTH + QUARTER_WIDTH + 50, HALF_HEIGHT + 70, "power")
      .setDisplaySize(100, 100)
      .setInteractive()
      .on("pointerdown", () => {
        if (this.selectedMode === "drop") {
          if (this.dropLevelIndex < this.dropLevels.length) {
            this.scene.start(this.dropLevels[this.dropLevelIndex]);
            this.dropLevelIndex++;
          } else {
            this.scene.start("GameOver");
          }
        } else if (this.selectedMode === "catch") {
          if (this.catchLevelIndex < this.catchLevels.length) {
            this.scene.start(this.catchLevels[this.catchLevelIndex]);
            this.catchLevelIndex++;
          } else {
            this.scene.start("GameOver");
          }
        }
      });
  }

  selectMode(mode: "drop" | "catch") {
    this.selectedMode = mode;

    // 重置关卡索引
    this.dropLevelIndex = 0;
    this.catchLevelIndex = 0;

    const selectedFill = 0x00ff00;
    const defaultFill = 0xffffff;
    const selectedAlpha = 1;
    const defaultAlpha = 0.6;

    this.dropCircle
      .setFillStyle(mode === "drop" ? selectedFill : defaultFill)
      .setAlpha(mode === "drop" ? selectedAlpha : defaultAlpha);

    this.catchCircle
      .setFillStyle(mode === "catch" ? selectedFill : defaultFill)
      .setAlpha(mode === "catch" ? selectedAlpha : defaultAlpha);
  }
}
