import { Scene } from "phaser";

export class Level extends Scene {
  constructor() {
    super("Level");
  }

  create() {
    this.input.once("pointerdown", () => {
      this.scene.start("GameOver");
    });
  }
}
