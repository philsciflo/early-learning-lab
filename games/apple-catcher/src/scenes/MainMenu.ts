import { Scene } from "phaser";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  HEIGHT,
  PLAYER_ID_DATA_KEY,
  QUARTER_WIDTH,
  WIDTH,
} from "../constants.ts";
import { renderTextBanner } from "../banners.ts";
import {
  getScoreDataJSONString,
  removeScoreData,
  startNewScore,
} from "../scoring.ts";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-data", "assets/download-data.png");
    this.load.image("delete-data", "assets/delete-data.png");
    this.load.image("start", "assets/power-button.png");
    this.load.image("move", "assets/move.png");
  }

  create() {
    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1);

    renderTextBanner(
      this,
      { backgroundAlpha: 0.6 },
      {
        text: 'Play: \r "Apple Catcher"',
        yOffset: 10,
      },
    );

    renderTextBanner(
      this,
      { y: HALF_HEIGHT, height: 150, backgroundAlpha: 0.6 },
      {
        text: "Enter your player ID:",
        yOffset: 10,
      },
    );

    const nameInput = this.add.dom(0, 0).createFromCache("name_input");
    nameInput.setOrigin(0.5);
    nameInput.setPosition(HALF_WIDTH, HALF_HEIGHT + 90);

    const startButton = this.add
      .sprite(HALF_WIDTH + QUARTER_WIDTH + 50, HALF_HEIGHT + 70, "start")
      .setDisplaySize(100, 100)
      .setInteractive();

    startButton.on("pointerdown", () => {
      const playerId = (nameInput.getChildByName("input") as HTMLInputElement)
        .value;
      if (playerId?.length >= 6) {
        // Set data in the global registry that can be accessed by all scenes
        this.registry.set(PLAYER_ID_DATA_KEY, playerId);
        startNewScore(playerId);
        this.scene.start("ModeSelection");
      }
    });

    this.add
      .sprite(HALF_WIDTH - 100, HEIGHT - 50, "delete-data")
      .setDisplaySize(100, 100)
      .setInteractive()
      .on("pointerdown", () => {
        removeScoreData();
      });

    this.add
      .sprite(HALF_WIDTH + 100, HEIGHT - 50, "download-data")
      .setDisplaySize(100, 100)
      .setInteractive()
      .on("pointerdown", () => {
        const jsonStr = JSON.stringify(
          JSON.parse(getScoreDataJSONString()),
          null,
          2,
        );
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "game_data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  }
}
