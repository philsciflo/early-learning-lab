import { Scene, GameObjects } from "phaser";

export class MainMenu extends Scene {
  title: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-data", "assets/download-data.png");
    this.load.image("delete-data", "assets/delete-data.png");
    this.load.image("start", "assets/power-button.png");
  }

  create() {
    this.title = this.add
      .text(512, 460, "Hello, World!", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("Level");
    });
  }
}
