import { Scene } from "phaser";

import { WIDTH, HEIGHT } from "../constants.ts";
import {
  QUARTER_HEIGHT,
  HALF_WIDTH,
  QUARTER_WIDTH,
  HALF_HEIGHT,
  PLAYER_ID_DATA_KEY,
  START,
  END,
} from "../constants";
import { getPlayerOverallScore } from "../scoring.ts";
import { AudioManager } from "../AudioManager";

export class GameOver extends Scene {
  gameover_text: Phaser.GameObjects.Text;
  playerID_text: Phaser.GameObjects.Text;
  score_text: Phaser.GameObjects.Text;

  gemContainer: Phaser.GameObjects.Container; // container for rotating ring
  protected finishButton!: Phaser.GameObjects.Image;


  constructor() {
    super("GameOver");
  }

  preload(): void {
    this.load.image("background", "assets/background.png")

    // --- Navigation Buttons ---
    this.load.image("finish", "assets/finish.png");
    this.load.image("finishPressed", "assets/finish_pressed.png");

    // --- Gem assets ---
    this.load.setPath('assets/gemfile/');
    for (let i = START; i <= END; i++) {
      const pad = (n: number) => n.toString().padStart(5, '0');
      this.load.image(`gem_${pad(i)}`, `Final_${pad(i)}.png`);
    }
    this.load.setPath('');


    // --- SFX ---
    this.load.audio("button_sound", "assets/button_sound.mp3");

  }

  protected async transitionToScene(sceneKey: string, message: string): Promise<void> {
      // Get the UIScene instance
      const uiScene = this.scene.get("UIScene") as any;
      
      // Play transition animation
      await uiScene.playTransitionAnimation(sceneKey, message);
      
      // Now change the scene
      this.scene.start(sceneKey);
  }


  create() {
    
    // --- Background ---
    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1); 
      
    // --- Title with background panel ---
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Magical Star",
      fontSize: "60px",
      color: "#FF7700",
      stroke: "#333333",
      strokeThickness: 4,
      align: "center",
      shadow: { offsetX: 3, offsetY: 3, color: "#323232ff", blur: 1, stroke: true, fill: true }
    };

    // container that will sit at the center-top
    const titleWrap = this.add.container(WIDTH / 2, HEIGHT / 11);

    // the text (origin 0.5 so it stays centered inside the panel)
    const title = this.add.text(0, 0, "Good Job", titleStyle).setOrigin(0.5);

    // background graphics sized from the text’s bounds
    const padX = 32, padY = 18, radius2 = 18;
    const w = title.width + padX * 2;
    const h = title.height + padY * 2;

    const bg = this.add.graphics();
    // soft shadow underneath
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(-w / 2 -5, -h / 2 + 6, w+10, h, radius2 + 2);

    // main panel
    bg.fillStyle(0xFFF1CE, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, radius2);

    // put them into the container (bg first so it renders behind)
    titleWrap.add([bg, title]);
    
   // Game area container
    const graphics = this.add.graphics();
    const shadow = this.add.graphics().setDepth(-0.5);
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(125, 190, 910, 530, 20);
    graphics.fillStyle(0xFFF1CE, 1);
    graphics.fillRoundedRect(130, 180, 900, 535, 20);
    graphics.lineStyle(2, 0x00000, 1);

    // circle
    const graphics2 = this.add.graphics();
    graphics2.fillStyle(0xFFF1CE, 1);
    graphics2.fillCircle(WIDTH / 2, (QUARTER_HEIGHT/4 + 40 + HALF_HEIGHT + QUARTER_HEIGHT)/2+40, 150);
    graphics2.lineStyle(12, 0xfec767, 1);
    graphics2.strokeCircle(WIDTH / 2, (QUARTER_HEIGHT/4 + 40 + HALF_HEIGHT + QUARTER_HEIGHT)/2+40, 150);
    


    const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
    const playerScore = getPlayerOverallScore(playerId);
    
    // score text
    this.playerID_text = this.add
      .text(
        WIDTH / 2,
        HALF_HEIGHT + QUARTER_HEIGHT-10,
        `Your Player ID: ${playerId}`,
        {
        fontFamily: "Body",
        fontSize: 25,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "left",
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: "#3d3d3dff",
          blur: 1,
          stroke: true,
          fill: true,
        },
        }
      )
      .setOrigin(0.5);

    this.score_text = this.add
      .text(
        WIDTH / 2,
        HALF_HEIGHT + QUARTER_HEIGHT+20,
        `You collected ${Math.round(parseInt(playerScore.toFixed(1)))} gems`,
        {
        fontFamily: "Body",
        fontSize: 25,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "left",
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: "#3d3d3dff",
          blur: 1,
          stroke: true,
          fill: true,
        },
        }
      )
      .setOrigin(0.5);

    // Finish Button
    this.finishButton = this.add
      .image(WIDTH / 2, HALF_HEIGHT + QUARTER_HEIGHT + 80 , "finish")
      .setOrigin(0.5,0.5)
      .setScale(0.6)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", async () => {
        AudioManager.I.playSfx(this, "button_sound");
        this.finishButton.setTexture("finishPressed");
        this.time.delayedCall(400, async () => {
          this.finishButton.setTexture("finish");
          await this.transitionToScene("MainMenu", "Thank you for playing!");
        });


    });

    // Create gem animation if it doesn't exist
    if (!this.anims.exists('gemSpin')) {
      const pad = (n: number) => n.toString().padStart(5, '0');
      const frames = Array.from({ length: END - START + 1 }, (_, k) => ({
        key: `gem_${pad(START + k)}`
      }));
      this.anims.create({
        key: 'gemSpin',
        frames,
        frameRate: 20,
        repeat: -1
      });
    }

    // Ring of animated gems
    const numGems = Math.floor(playerScore); 
    const radius = 150;
    const centerX = WIDTH / 2;
    const centerY = (QUARTER_HEIGHT/4 + 40 + HALF_HEIGHT + QUARTER_HEIGHT)/2 + 40;

    this.gemContainer = this.add.container(centerX, centerY);

    for (let i = 0; i < numGems; i++) {
      const angle = (i / numGems) * Phaser.Math.PI2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      // Create animated gem sprite instead of static image
      const gem = this.add.sprite(x, y, 'gem_00000')
        .setOrigin(0.5)
        .setScale(0.06) // Same scale as Level0
        .play('gemSpin');
        
      this.gemContainer.add(gem);
    }

    // Spin (your existing tween code remains the same)
    this.tweens.add({
      targets: this.gemContainer,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: "Linear",
      onUpdate: () => {
        this.gemContainer.iterate((child: Phaser.GameObjects.Sprite) => {
          child.angle = -this.gemContainer.angle;
        });
      },
    });
  }

}