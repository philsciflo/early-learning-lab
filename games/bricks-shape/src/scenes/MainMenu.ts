import { Scene, GameObjects } from "phaser";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  HEIGHT,
  PLAYER_ID_PAIR_DATA_KEY,
  QUARTER_HEIGHT,
  QUARTER_WIDTH,
} from "../constants.ts";
import { renderText, renderTextBanner } from "../banners.ts";
import {
  getScoreDataJSONString,
  removeScoreData,
  startNewScore,
} from "../scoring.ts";

export class MainMenu extends Scene {
  title: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-data", "assets/download-data.png");
    this.load.image("delete-data", "assets/delete-data.png");
    this.load.image("start", "assets/power-button.png");
  }

  create() {
    renderTextBanner(
      this,
      {},
      {
        text: "Play:",
        yOffset: 10,
      },
    );
    renderText(this, HALF_WIDTH, QUARTER_HEIGHT + 50, '"Bricks Shape"');

    renderTextBanner(
      this,
      { y: HALF_HEIGHT, height: 200 },
      {
        text: "Enter your player ID:",
        yOffset: 10,
      },
    );
    renderText(this, HALF_WIDTH - 120, HALF_HEIGHT + 60, "Player A:");
    renderText(this, HALF_WIDTH - 120, HALF_HEIGHT + 130, "Player B:");

    const playerAInput = this.add.dom(0, 0).createFromCache("name_input");
    playerAInput.setOrigin(0.5);
    playerAInput.setPosition(HALF_WIDTH + 80, HALF_HEIGHT + 80);

    const playerBInput = this.add.dom(0, 0).createFromCache("name_input");
    playerBInput.setOrigin(0.5);
    playerBInput.setPosition(HALF_WIDTH + 80, HALF_HEIGHT + 150);

    const startButton = this.add
      .sprite(HALF_WIDTH + QUARTER_WIDTH + 50, HALF_HEIGHT + 100, "start")
      .setDisplaySize(50, 50)
      .setInteractive();

    startButton.on("pointerdown", () => {
      const playerAId = (
        playerAInput.getChildByName("input") as HTMLInputElement
      ).value;
      const playerBId = (
        playerBInput.getChildByName("input") as HTMLInputElement
      ).value;
      if (playerAId?.length >= 6 && playerBId?.length >= 6) {
        // Set data in the global registry that can be accessed by all scenes
        const playerIdPair = `${playerAId}-${playerBId}`;
        this.registry.set(PLAYER_ID_PAIR_DATA_KEY, playerIdPair);
        startNewScore(playerIdPair);
        this.scene.start("Level1");
      }
    });

    this.add
      .sprite(HALF_WIDTH - 100, HEIGHT - 50, "delete-data")
      .setDisplaySize(50, 50)
      .setInteractive()
      .on("pointerdown", () => {
        removeScoreData();
      });

    this.add
      .sprite(HALF_WIDTH + 100, HEIGHT - 50, "download-data")
      .setDisplaySize(50, 50)
      .setInteractive()
      .on("pointerdown", () => {
        // Trigger download of the current data
        const blob = new Blob([getScoreDataJSONString()], {
          type: "application/json",
        });
        window.location.href = URL.createObjectURL(blob);
      });
  }
}
