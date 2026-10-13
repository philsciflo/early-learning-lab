import { Scene } from "phaser";

import { WIDTH, HEIGHT } from "../constants.ts";

export class GameOver extends Scene {
  gameover_text: Phaser.GameObjects.Text;
  replay_text: Phaser.GameObjects.Text;

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

    this.replay_text = this.add
      .text(WIDTH / 2, HEIGHT / 2 + 50, "Tap to play again", {
        fontFamily: "Arial",
        fontSize: 26,
        color: "#4a4a6a",
        align: "center",
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
