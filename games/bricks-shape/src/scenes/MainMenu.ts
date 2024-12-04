import { Scene, GameObjects } from "phaser";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  QUARTER_HEIGHT,
  QUARTER_WIDTH,
} from "../constants.ts";
import { renderText, renderTextBanner } from "../banners.ts";

export class MainMenu extends Scene {
  title: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("name_input", "assets/html_text_input.html");
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
      this.scene.start("Level1");
    });
  }
}
