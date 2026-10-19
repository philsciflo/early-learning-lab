import { Scene } from "phaser";

import { WIDTH, HEIGHT } from "../constants.ts";
import { createButton } from "../ui.ts";

export class GameOver extends Scene {
  gameover_text: Phaser.GameObjects.Text;

  constructor() {
    super("GameOver");
  }

  create() {
    this.gameover_text = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 40, "Well done!", {
        fontFamily: "Arial Black",
        fontSize: 56,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    const replayButton = createButton(
      this,
      WIDTH / 2,
      HEIGHT / 2 + 60,
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
