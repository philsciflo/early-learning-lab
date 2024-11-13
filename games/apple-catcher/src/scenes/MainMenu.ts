import { Scene } from "phaser";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  PLAYER_ID_DATA_KEY,
  QUARTER_HEIGHT,
  QUARTER_WIDTH,
} from "../constants.ts";
import { renderTextBanner } from "../banners.ts";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("name_input", "html_text_input.html");
  }

  create() {
    renderTextBanner(
      this,
      {},
      {
        text: 'Play: \r "Apple Catcher"',
        x: HALF_WIDTH,
        y: QUARTER_HEIGHT + 10,
      },
    );

    renderTextBanner(
      this,
      { y: HALF_HEIGHT, height: 150 },
      {
        text: "Enter your player ID:",
        x: HALF_WIDTH,
        y: HALF_HEIGHT + 10,
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
  }
}
