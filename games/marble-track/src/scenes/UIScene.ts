// src/scenes/UIScene.ts
import Phaser from "phaser";
import { AudioManager } from "../AudioManager";

export default class UIScene extends Phaser.Scene {
  private musicBtn!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: "UIScene" });
  }

  create(): void {
    // 1. Pick the initial texture according to current music state
    const iconKey = AudioManager.I.isBgmPlaying()
      ? "icon-music-on"
      : "icon-music-off";

    // 2. Place the button in the top-right corner
    this.musicBtn = this.add
      .image(this.scale.width - 50, 50, iconKey)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0) // stay fixed if the camera moves
      .setDepth(1000) // render above everything else
      .setScale(0.09);

    // 3. Toggle music playback and switch texture on click
    this.musicBtn.on("pointerdown", () => {
      AudioManager.I.toggleBgm();
      const key = AudioManager.I.isBgmPlaying()
        ? "icon-music-on"
        : "icon-music-off";
      this.musicBtn.setTexture(key);
    });

    // 4. Re-position the button if the game window is resized (optional)
    this.scale.on("resize", (size: Phaser.Structs.Size) => {
      this.musicBtn.setPosition(size.width - 50, 50);
    });
  }
}
