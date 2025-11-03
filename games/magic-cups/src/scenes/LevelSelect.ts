import { Scene } from "phaser";
import { MagicCupsScene } from "./MagicCupsScene.ts";
import {
  WIDTH,
  HEIGHT,
  HALF_WIDTH,
  HALF_HEIGHT,
  QUARTER_WIDTH,
  QUARTER_HEIGHT,
} from "../constants";
import { AudioManager } from "../AudioManager";

export class LevelSelect extends Scene {
  private titleText!: Phaser.GameObjects.Text;
  private homeButton!: Phaser.GameObjects.Image;
  private backButton!: Phaser.GameObjects.Text;

  constructor() {
    super("LevelSelect");
  }

  preload(): void {
    this.load.image("background", "assets/background.png");
    this.load.image("level_button", "assets/play-button.png"); // Placeholder for level buttons
    this.load.image("level_button_pressed", "assets/play-button-pressed.png");
    this.load.image("home", "assets/home-button.png");
    this.load.audio("button_sound", "assets/button_sound.mp3");
    this.load.image("backPressed", "assets/fast-backward-button-pressed.png");
    this.load.font('Unbounded', 'assets/Unbounded.ttf', 'truetype');
  }
  protected async transitionToScene(sceneKey: string, message: string): Promise<void> {
      // Get the UIScene instance
      const uiScene = this.scene.get("UIScene") as any;
      
      // Play transition animation
      await uiScene.playTransitionAnimation(sceneKey, message);
      
      // Now change the scene
      this.scene.start(sceneKey);
  }
  create(data: { previousScene?: string } = {}) : void {
    const previousScene = data.previousScene || "MainMenu";
    // Background
    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1);

    // Game area container
    const graphics = this.add.graphics();
    const shadow = this.add.graphics().setDepth(-0.5);
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(125, 190, 910, 550, 20);
    graphics.fillStyle(0xFFF1CE, 1);
    graphics.fillRoundedRect(130, 180, 900, 550, 20);
    graphics.lineStyle(2, 0x00000, 1);

    // Title
    this.titleText = this.add
      .text(WIDTH / 2, HEIGHT / 8, "Select a Level", {
        fontFamily: "Magical Star",
        fontSize: 60,
        color: "#FF7700",
        stroke: "#333333",
        strokeThickness: 4,
        align: "center",
        shadow: { offsetX: 3, offsetY: 3, color: "#323232ff", blur: 1, stroke: true, fill: true },
      })
      .setOrigin(0.5);

    // Home button
    this.homeButton = this.add
        .image(QUARTER_WIDTH / 2 - 80, QUARTER_HEIGHT / 2 - 30, "home")
        .setOrigin(0.5, 0.5)
        .setScale(0.7)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
            AudioManager.I.playSfx(this, "button_sound");
            // change texture
            this.homeButton.setTexture("homePressed");

            // change back texture
            this.time.delayedCall(400, async () => {
                this.homeButton.setTexture("home");
                await this.transitionToScene("MainMenu", "Going Home...")
            });
        });

    // Back text
    this.backButton = this.add
      .text(QUARTER_WIDTH / 2 + 20, QUARTER_HEIGHT / 2 + 120, "Back", {
        fontFamily: "Body",
        fontSize: "50px",
        color: "#f78d29ff",
        shadow: { offsetX: 2, offsetY: 2, color: "#3d3d3dff", blur: 1, stroke: true, fill: true },
      })
      .setInteractive ({ useHandCursor: true})
      .on("pointerdown", async () => {
        AudioManager.I.playSfx(this, "button_sound");
        await this.transitionToScene(previousScene, "Returning...")
      })

    const gridCols = 2;
    const colSpacing = 280;
    const rowSpacing = 220;

    const startX = HALF_WIDTH - (colSpacing / 2);
    const startY = HALF_HEIGHT - (rowSpacing / 2);

    // Level keys
    const levels = [
      { key: "Level0", label: "Level 0" },
      { key: "Level1", label: "Level 1" },
      { key: "Level2", label: "Level 2" },
      { key: "Level3", label: "Level 3" },
    ];

    levels.forEach((lvl, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const x = startX + col * colSpacing;
      const y = startY + row * rowSpacing;

      const btn = this.add
        .image(x, y, "level_button")
        .setOrigin(0.5)
        .setScale(0.8)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(x, y + 70, lvl.label, {
          fontFamily: "Body",
          fontSize: 32,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
          align: "center",
          shadow: { offsetX: 3, offsetY: 3, color: "#3d3d3dff", blur: 1, stroke: true, fill: true },
        })
        .setOrigin(0.5);

      btn.on("pointerdown", () => {
        AudioManager.I.playSfx(this, "button_sound");

        btn.setTexture("level_button_pressed");

        this.time.delayedCall(400, async () => {
          btn.setScale(0.8);
          await this.transitionToScene(lvl.key, "Loading Level...")

        });
      });
    });
  }
}
