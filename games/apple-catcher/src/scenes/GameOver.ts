import { Scene } from "phaser";
import { renderTextBanner } from "../banners.ts";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  PLAYER_ID_DATA_KEY,
  QUARTER_WIDTH,
} from "../constants.ts";
import { getPlayerOverallScore } from "../scoring.ts";

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }

  preload() {
    this.load.image("home", "assets/home.png");
  }

  create() {
    renderTextBanner(this, {}, { text: "Ngā mihi!", yOffset: 30 });

    const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
    const playerScore = getPlayerOverallScore(playerId);
    renderTextBanner(
      this,
      { y: HALF_HEIGHT, height: 100 },
      {
        text: `Your Player ID: ${playerId}\nYour score: ${playerScore.toFixed(1)}`,
        yOffset: 15,
      },
    );

    const homeButton = this.add
      .sprite(HALF_WIDTH + QUARTER_WIDTH + 50, HALF_HEIGHT + 50, "home")
      .setDisplaySize(50, 50)
      .setInteractive();

    homeButton.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
