import { Scene } from "phaser";

import { WIDTH, HEIGHT, LAST_SCORE_DATA_KEY } from "../constants.ts";
import { createButton } from "../ui.ts";

export class GameOver extends Scene {
  gameover_text: Phaser.GameObjects.Text;
  score_text: Phaser.GameObjects.Text;

  constructor() {
    super("GameOver");
  }

  create() {
    this.gameover_text = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 80, "Well done!", {
        fontFamily: "Arial Black",
        fontSize: 56,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    const score = this.registry.get(LAST_SCORE_DATA_KEY) as number | null;
    this.score_text = this.add
      .text(
        WIDTH / 2,
        HEIGHT / 2,
        score === null || score === undefined
          ? "No score recorded"
          : `Score: ${score}/100`,
        {
          fontFamily: "Arial Black",
          fontSize: 32,
          color: "#2b2a6b",
          align: "center",
        },
      )
      .setOrigin(0.5);

    const replayButton = createButton(
      this,
      WIDTH / 2,
      HEIGHT / 2 + 100,
      "Tap to play again",
      {
        variant: "primary",
        fontSize: 26,
        minWidth: 260,
      },
    );

    replayButton.hitArea.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
