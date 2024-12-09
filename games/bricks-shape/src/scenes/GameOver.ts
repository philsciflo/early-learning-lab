import { Scene } from "phaser";
import { renderTextBanner } from "../banners.ts";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  PLAYER_ID_PAIR_DATA_KEY,
  QUARTER_HEIGHT,
  WIDTH,
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

    const playerIdPair = this.registry.get(PLAYER_ID_PAIR_DATA_KEY);
    const playerIds = playerIdPair.split("-");
    const pairScore = getPlayerOverallScore(playerIdPair);
    renderTextBanner(
      this,
      {
        x: WIDTH / 8,
        y: HALF_HEIGHT,
        height: 120,
        width: (3 / 4) * WIDTH,
      },
      {
        text: `Your Player IDs: ${playerIds[0]} / ${playerIds[1]}\nCompleted Shapes: ${pairScore.totalShapes} in ${Math.floor(pairScore.totalTime / 60)} minutes ${Math.floor(pairScore.totalTime % 60)} seconds.`,
        yOffset: 15,
      },
    );

    const homeButton = this.add
      .sprite(HALF_WIDTH, HALF_HEIGHT + QUARTER_HEIGHT, "home")
      .setDisplaySize(50, 50)
      .setInteractive();

    homeButton.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
