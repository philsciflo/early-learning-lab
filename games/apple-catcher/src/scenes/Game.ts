import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    this.input.once("pointerdown", () => {
      this.scene.start("GameOver");
    });
  }
}
