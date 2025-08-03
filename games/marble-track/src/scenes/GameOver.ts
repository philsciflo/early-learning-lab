import { Scene } from "phaser";
import { renderTextBanner } from "../banners.ts";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  HEIGHT,
  PLAYER_ID_DATA_KEY,
  QUARTER_WIDTH,
  WIDTH,
} from "../constants.ts";

import { getPlayerOverallScore } from "../scoring.ts";

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }

  preload() {
    this.load.image("home", "assets/home.png");
    this.load.image("background", "assets/background.png");
    this.load.spritesheet("firework", "assets/firework_sheet.png", {
      frameWidth: 128,
      frameHeight: 128,
    });

    this.load.audio("celebration", "assets/celebration.wav");
  }

  create() {
    this.resetAllRegistry(this);
    this.add
      .image(0, 0, "background")
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1);

    renderTextBanner(
      this,
      { backgroundAlpha: 0.8 },
      { text: "Ngā mihi!", yOffset: 30 },
    );

    const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
    const playerScore = getPlayerOverallScore(playerId);
    //const playerScore = 66.6;
    renderTextBanner(
      this,
      { backgroundAlpha: 0.8, y: HALF_HEIGHT, height: 100 },
      {
        text: `Your Player ID: ${playerId}\nYour score: ${playerScore.toFixed(1)}`,
        yOffset: 15,
      },
    );

    const homeButton = this.add
      .sprite(HALF_WIDTH + QUARTER_WIDTH + 50, HALF_HEIGHT + 50, "home")
      .setDisplaySize(100, 100)
      .setInteractive();

    homeButton.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    // Play background music
    const music = this.sound.add("celebration", { volume: 0.05 });
    music.play();

    // Create firework animation (only needs to be created once)
    this.anims.create({
      key: "firework_burst",
      frames: this.anims.generateFrameNumbers("firework", { start: 0, end: 7 }),
      frameRate: 8,
      repeat: 0,
    });

    const count = 30; // number of firework
    const MIN_S = 0.2; // scale-min
    const MAX_S = 2; // sacle-max

    for (let i = 0; i < count; i++) {
      // Randomise the scale for this individual firework
      const scale = Phaser.Math.FloatBetween(MIN_S, MAX_S);
      const half = (128 * scale) / 2; // half-width/height after scaling

      const x = Phaser.Math.Between(half, WIDTH - half);
      const y = Phaser.Math.Between(half, HEIGHT - half);

      const fw = this.add
        .sprite(x, y, "firework", 0)
        .setScale(scale)
        .setOrigin(0.5, 0.6); // adjust anchor to suit the artwork

      // Play the animation, starting on a random frame and with a small random delay
      fw.play({
        key: "firework_burst",
        startFrame: Phaser.Math.Between(0, 7), // 0-7 random
        delay: Phaser.Math.Between(0, 300), // 0-300 ms random
      });
      fw.once("animationcomplete-firework_burst", () => fw.destroy());
    }
  }

  private resetAllRegistry(scene: Phaser.Scene) {
    const whitelist = ["playerId"];
    const allKeys = Object.keys(scene.registry.getAll());
    allKeys.forEach((key) => {
      if (!whitelist.includes(key)) {
        scene.registry.remove(key);
      }
    });
  }
}
