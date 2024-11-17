import { Scene } from "phaser";
import {
  GAME_SCORE_DATA_KEY,
  HALF_HEIGHT,
  HALF_WIDTH,
  HEIGHT,
  PLAYER_ID_DATA_KEY,
  QUARTER_WIDTH,
} from "../constants.ts";
import { renderTextBanner } from "../banners.ts";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-data", "assets/download-data.png");
    this.load.image("delete-data", "assets/delete-data.png");
  }

  create() {
    renderTextBanner(
      this,
      {},
      {
        text: 'Play: \r "Apple Catcher"',
        yOffset: 10,
      },
    );

    renderTextBanner(
      this,
      { y: HALF_HEIGHT, height: 150 },
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
      .setDisplaySize(50, 50)
      .setInteractive();

    startButton.on("pointerdown", () => {
      const playerId = (nameInput.getChildByName("input") as HTMLInputElement)
        .value;
      if (playerId?.length >= 6) {
        // Set data in the global registry that can be accessed by all scenes
        this.registry.set(PLAYER_ID_DATA_KEY, playerId);

        this.scene.start("Level0");
      }
    });

    this.add
      .sprite(HALF_WIDTH - 100, HEIGHT - 50, "delete-data")
      .setDisplaySize(50, 50)
      .setInteractive()
      .on("pointerdown", () => {
        // remove the current data
        localStorage.setItem(GAME_SCORE_DATA_KEY, "{}");
      });

    this.add
      .sprite(HALF_WIDTH + 100, HEIGHT - 50, "download-data")
      .setDisplaySize(50, 50)
      .setInteractive()
      .on("pointerdown", () => {
        // Trigger download of the current data
        const blob = new Blob(
          [localStorage.getItem(GAME_SCORE_DATA_KEY) ?? ""],
          {
            type: "application/json",
          },
        );
        window.location.href = URL.createObjectURL(blob);
      });
  }
}
