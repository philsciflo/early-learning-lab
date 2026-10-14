import { Scene, GameObjects } from "phaser";

import { WIDTH, HEIGHT } from "../constants.ts";

export class MainMenu extends Scene {
  title: GameObjects.Text;
  subtitle: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  create() {
    this.title = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 60, "Hidden Bag", {
        fontFamily: "Arial Black",
        fontSize: 56,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    this.subtitle = this.add
      .text(WIDTH / 2, HEIGHT / 2 + 30, "Tap to start", {
        fontFamily: "Arial",
        fontSize: 28,
        color: "#4a4a6a",
        align: "center",
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("Level0");
    });
  }
}
