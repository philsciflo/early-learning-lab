import Phaser from "phaser";
import { renderBanner } from "../banners.ts";
import {PLAYER_ID_DATA_KEY, HALF_WIDTH, WIDTH, HEIGHT, HALF_HEIGHT} from "../constants.ts";
import { AudioManager } from "../AudioManager"; 

export default class LevelSelectScene extends Phaser.Scene {
  private levelButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super("LevelSelectScene");
  }

  preload() {
    this.load.image("background", "assets/background.png")
    this.load.image("play-button", "assets/play-button.png")
  }

  protected createBackground() {
      //top banner
      renderBanner(this, 
            { x: HALF_WIDTH - 400,
              y: 20,
              height: 120,
              width: 800,
            });
  
      //bottom banner
      renderBanner(this, 
            { x: HALF_WIDTH - 900,
              y: 155,
              height: 870,
              width: 1800,
            })
            
      //Replacing background with background image 
      this.add
        .image(0, 0, "background")
        .setScale(1.2)
        .setOrigin(0)
        .setDisplaySize(this.scale.width, this.scale.height )
        .setDepth(-5); 
    }


  create(): void {
    this.createBackground();
    this.scene.get('UIScene').scene.setVisible(false);

    this.add.text(HALF_WIDTH, 78, "Select a Level", {
      fontFamily: "Unbounded-Black",
      fontSize: "64px",
      color: "#ED6A5A",
    }).setOrigin(0.5).setFontStyle('bold').setShadow(0, 2, 'rgba(0, 0, 0, 0.3)', 1, false, true);

    const totalLevels = 6;
    const columns = 3; 
    const spacingX = 400;
    const spacingY = 300;
    const startX = 550;
    const startY = 400;

  for (let i = 1; i <= totalLevels; i++) {
    const col = (i - 1) % columns;
    const row = Math.floor((i - 1) / columns);
    const x = startX + col * spacingX;
    const y = startY + row * spacingY;

    const playIcon = this.add.image(0, -80, "play-button")
      .setScale(0.8)
      .setOrigin(0.5);

    const btnText = this.add.text(0, 20, `Level ${i}`, {
      fontFamily: "Unbounded",
      fontSize: "36px",
      color: "#5D576B",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setFontStyle('bold');


    const container = this.add.container(x+10, y, [playIcon, btnText])
      .setSize(btnText.width + 40, btnText.height + 150)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        AudioManager.I.playSfx(this, "hoverSound");
      this.tweens.add({
        targets: container,
        scale: 1.1,
        duration: 100,
        ease: "Sine.easeOut",
      });
    })
    .on("pointerout", () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 100,
        ease: "Sine.easeIn",
      });
    })
      .on("pointerdown", () => {
        this.scene.start(`Level${i}`);
        this.scene.get('UIScene').scene.setVisible(true);
        AudioManager.I.playSfx(this, "pressSound");
      });

    this.levelButtons.push(btnText);
  }

  const backText = this.add.text(0, 0, "Back", {
    fontFamily: "Unbounded",
    fontSize: "45px",
    color: "#5D576B",
    padding: { x: 20, y: 10 },
  }).setOrigin(0.5).setFontStyle('bold');

  const backButton = this.add.container(960, 900, [backText])
    .setSize(backText.width + 40, backText.height + 20)
    .setInteractive({ useHandCursor: true })
    .on("pointerover", () => {
      AudioManager.I.playSfx(this, "hoverSound");
      this.tweens.add({
        targets: backButton,
        scale: 1.1,
        duration: 100,
        ease: "Sine.easeOut",
      });
    })
    .on("pointerout", () => {
      this.tweens.add({
        targets: backButton,
        scale: 1,
        duration: 100,
        ease: "Sine.easeIn",
      });
    })
    .on("pointerdown", () => {
      AudioManager.I.playSfx(this, "pressSound");
      const returnScene = this.scene.settings.data?.returnScene;
      if (returnScene) {
        this.scene.get('UIScene').scene.setVisible(true);
        this.scene.stop();
        this.scene.launch(returnScene);
      }
    });

    
}
}
