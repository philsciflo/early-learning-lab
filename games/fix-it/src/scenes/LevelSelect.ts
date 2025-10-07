import { Scene } from "phaser";
import { addButtonTweens } from "../utils/buttonTweens";
export class LevelSelect extends Scene {
  constructor() {
    super("LevelSelect");
  }
  preload() {
    this.load.audio("button-press", "assets/button-press.mp3");
    this.load.image("back", "assets/previousbutton.png");
  }
  create() {
    const { width, height } = this.scale;
    const levels = [
      "Level1",
      "Level2",
      "Level3",
      "Level4",
      "Level5",
      "Level6",
      "Level7",
      "Level8",
      "Level9",
      "Level10",
      "Level11",
      "Level12",
    ];
    // Title
    this.add
      .text(width / 2, 100, "Level Select", {
        fontFamily: "Arial Black",
        fontSize: "64px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    const cols = 4;
    const padding = 150;
    const rectWidth = 200;
    const rectHeight = 200;
    const totalGridWidth = cols * rectWidth + (cols - 1) * padding;
    const startX = (width - totalGridWidth) / 2 + rectWidth / 2;
    const startY = 300;
    const blockColors = [
      0xff595e, 0xff9631, 0xffca3a, 0xffe11d, 0xffdd00, 0xb1e613, 0x8ac926,
      0x54a574, 0x1982c4, 0x4d6390, 0x6a4c93, 0xb32475,
    ];

    this.add
      .text(100, 250, "Easy", {
        fontFamily: "Comic Sans MS",
        fontSize: "60px",
        fontStyle: "bold",
        color: "#4CAF50",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0, 0);
    this.add
      .text(50, 600, "Medium", {
        fontFamily: "Comic Sans MS",
        fontSize: "60px",
        fontStyle: "bold",
        color: "#FFC107",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0, 0);
    this.add
      .text(100, 950, "Hard", {
        fontFamily: "Comic Sans MS",
        fontSize: "60px",
        fontStyle: "bold",
        color: "#F44336",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0, 0);

    levels.forEach((levelName, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const colour = blockColors[i % blockColors.length];
      const x = startX + col * (rectWidth + padding);
      const y = startY + row * (rectHeight + padding);
      const rect = this.add.rectangle(x, y, rectWidth, rectHeight, colour);
      rect.setStrokeStyle(
        10,
        Phaser.Display.Color.IntegerToColor(colour).darken(20).color,
      );
      rect.setInteractive({ useHandCursor: true });
      const text = this.add.text(x, y, `Level ${i + 1}`, {
        fontFamily: "Comic Sans MS",
        fontSize: "40px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      });
      text.setOrigin(0.5);
      addButtonTweens(
        this,
        rect,
        () => {
          this.scene.start(levelName);
        },
        "button-press",
      );
    });

    const backButton = this.add
      .image(120, 120, "back")
      .setOrigin(0.5, 0.5)
      .setScale(0.3)
      .setInteractive({ useHandCursor: true });
    addButtonTweens(
      this,
      backButton,
      () => {
        this.scene.start("MainMenu");
      },
      "button-press",
    );
  }
}
