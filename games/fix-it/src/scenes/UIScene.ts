import Phaser from "phaser";
import { AudioManager } from "../AudioManager";
import { HEIGHT, WIDTH, QUARTER_WIDTH, HALF_WIDTH, HALF_HEIGHT, QUARTER_HEIGHT } from "../constants";
import LevelSelectScene from "./LevelSelectScene";
import { levelSelectBanner } from "../banners.ts";

export default class UIScene extends Phaser.Scene {
  private settingsBtn!: Phaser.GameObjects.Image;
  private sliderPanel!: Phaser.GameObjects.Graphics;

  private bgmText!: Phaser.GameObjects.Text;
  private bgmSliderBar!: Phaser.GameObjects.Rectangle;
  private bgmSliderHandle!: Phaser.GameObjects.Rectangle;

  private sfxText!: Phaser.GameObjects.Text;
  private sfxSliderBar!: Phaser.GameObjects.Rectangle;
  private sfxSliderHandle!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: "UIScene", active: true, visible: true });
  }

  preload() {
    this.load.audio("bgm", "assets/bgm.mp3");
    this.load.image("icon-settings", "assets/settings.png");
    this.load.image("icon-close", "assets/icon-close.png");
    this.load.image("icon-music-off", "assets/icon-music-off.png");
    this.load.image("icon-music-on", "assets/icon-music-on.png");
    this.load.font('Unbounded_Black', 'assets/Unbounded-Black.ttf');
    this.load.font('Unbounded', 'assets/Unbounded.ttf');

    this.load.image("levelSelect", "assets/levelSelect.png");
  }
  

  create(): void {
    // Start persistent background music
    AudioManager.I.playBgm(this, "bgm", { loop: true });
    AudioManager.I.setBgmVolume(0.2);
    AudioManager.I.setSfxVolume(2);

    // --- Constants for UI ---
    const panelWidth = 450;
    const panelHeight = 300;
    const panelX = WIDTH - 70 - panelWidth; 
    const panelY = 50; 
    const radius = 20;

    const closeBtnSize = 50;
    const closeBtnX = panelX + panelWidth - closeBtnSize / 2 - 20;
    const closeBtnY = panelY + closeBtnSize / 2 + 20;

    // Settings button
    this.settingsBtn = this.add
      .image(WIDTH - 100, 80, "icon-settings")
      .setInteractive()
      .setScale(0.3)

    // Slider panel
    this.sliderPanel = this.add.graphics().setVisible(false);
    this.sliderPanel.clear();
    this.sliderPanel.fillStyle(0xe6ebe0, 1);
    this.sliderPanel.lineStyle(4, 0x5D576B, 1);
    this.sliderPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, radius);
    this.sliderPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, radius);
    this.sliderPanel.postFX.addShadow(0, 14, 0.004, 1, 0x333333, 30, 1); 


    const closeBtn = this.add
      .image(closeBtnX, closeBtnY, "icon-close")
      .setInteractive()
      .setDisplaySize(closeBtnSize, closeBtnSize)
      .setVisible(false);

    // --- BGM & SFX sliders ---
    const bgmMuteBtnSize = 90;
    const bgmMuteBtnX = panelX + 60;
    const bgmMuteBtnY = panelY + panelHeight / 3;
    let previousBgmVolume = AudioManager.I.getBgmVolume();
    
    this.bgmText = this.add
      .text(bgmMuteBtnX-25, bgmMuteBtnY - 60, "Music", {
        fontFamily: "Unbounded",
        fontSize: 40,
        color: "#ED6A5A",
        align: "left",
      })
      .setOrigin(0,0.5)
      .setVisible(false);
    
    this.bgmSliderBar = this.add
      .rectangle(panelX + panelWidth / 2, bgmMuteBtnY, 200, 8, 0xed6a5a)
      .setAlpha(0.5) 
      .setVisible(false);

    this.bgmSliderHandle = this.add
      .rectangle(QUARTER_WIDTH, bgmMuteBtnY, 16, 32, 0xed6a5a)
      .setVisible(false);

    const bgmMuteBtn = this.add
    .image(bgmMuteBtnX, bgmMuteBtnY, AudioManager.I.getBgmVolume() > 0 ? "icon-music-on" : "icon-music-off")
    .setInteractive()
    .setScale(0.1)
    .setVisible(false);

    const sfxMuteBtnSize = 90;
    const sfxMuteBtnX = panelX + 60;
    const sfxMuteBtnY = panelY + (panelHeight * 2) / 3;
    let previousSfxVolume = AudioManager.I.getSfxVolume();


    this.sfxText = this.add
      .text(sfxMuteBtnX-25, sfxMuteBtnY - 30, "Sfx", {
        fontFamily: "Unbounded",
        fontSize: 40,
        color: "#ED6A5A",
        align: "left",
      })
      .setOrigin(0,0.5)
      .setVisible(false);

    this.sfxSliderBar = this.add
      .rectangle(panelX + panelWidth / 2, sfxMuteBtnY + 30, 200, 8, 0xed6a5a)
      .setAlpha(0.5) 
      .setVisible(false);

    this.sfxSliderHandle = this.add
      .rectangle(QUARTER_WIDTH, sfxMuteBtnY, 16, 32, 0xed6a5a)
      .setVisible(false);

    const sfxMuteBtn = this.add
      .image(sfxMuteBtnX, sfxMuteBtnY + 30, AudioManager.I.getSfxVolume() > 0 ? "icon-music-on" : "icon-music-off")
      .setInteractive()
      .setScale(0.1)
      .setVisible(false);

    // --- Interactions --- //
    this.settingsBtn.on("pointerdown", () => {
      // BGM
      this.bgmSliderBar.setVisible(true);
      this.bgmSliderHandle.setVisible(true);
      bgmMuteBtn.setVisible(true);

      const bgmMinX = this.bgmSliderBar.x - this.bgmSliderBar.width / 2;
      this.bgmSliderHandle.x = bgmMinX + AudioManager.I.getBgmVolume() * this.bgmSliderBar.width;
      this.bgmSliderHandle.y = this.bgmSliderBar.y;

      // SFX
      this.sfxSliderBar.setVisible(true);
      this.sfxSliderHandle.setVisible(true);
      sfxMuteBtn.setVisible(true);

      const sfxMinX = this.sfxSliderBar.x - this.sfxSliderBar.width / 2;
      this.sfxSliderHandle.x = sfxMinX + AudioManager.I.getSfxVolume() * this.sfxSliderBar.width;
      this.sfxSliderHandle.y = this.sfxSliderBar.y;

      this.sliderPanel.setVisible(true);
      closeBtn.setVisible(true);


      this.bgmText.setVisible(true);
      this.sfxText.setVisible(true);
    });

    closeBtn.on("pointerdown", () => {
      this.bgmSliderBar.setVisible(false);
      this.bgmSliderHandle.setVisible(false);
      bgmMuteBtn.setVisible(false);

      this.sfxSliderBar.setVisible(false);
      this.sfxSliderHandle.setVisible(false);
      sfxMuteBtn.setVisible(false);

      this.bgmText.setVisible(false);
      this.sfxText.setVisible(false);

      this.sliderPanel.setVisible(false);
      closeBtn.setVisible(false);


    });


    this.sliderPanel.setInteractive(new Phaser.Geom.Rectangle(panelX, panelY, panelWidth, panelHeight), Phaser.Geom.Rectangle.Contains);
    this.sliderPanel.on("pointerdown", () => { });

    // --- Drag & click for BGM ---
    this.bgmSliderHandle.setInteractive({ draggable: true });
    this.input.setDraggable(this.bgmSliderHandle);

    // --- Drag & click for SFX ---
    this.sfxSliderHandle.setInteractive({ draggable: true });
    this.input.setDraggable(this.sfxSliderHandle);

    this.input.on("drag", (_pointer, gameObject, dragX) => {
      if (gameObject === this.bgmSliderHandle && this.bgmSliderBar.visible) {
        const minX = this.bgmSliderBar.x - this.bgmSliderBar.width / 2;
        const maxX = this.bgmSliderBar.x + this.bgmSliderBar.width / 2;
        this.bgmSliderHandle.x = Phaser.Math.Clamp(dragX, minX, maxX);
        AudioManager.I.setBgmVolume((this.bgmSliderHandle.x - minX) / this.bgmSliderBar.width);
      }
      if (gameObject === this.sfxSliderHandle && this.sfxSliderBar.visible) {
        const minX = this.sfxSliderBar.x - this.sfxSliderBar.width / 2;
        const maxX = this.sfxSliderBar.x + this.sfxSliderBar.width / 2;
        this.sfxSliderHandle.x = Phaser.Math.Clamp(dragX, minX, maxX);
        AudioManager.I.setSfxVolume((this.sfxSliderHandle.x - minX) / this.sfxSliderBar.width);
      }
    });

    this.bgmSliderBar.setInteractive();
    this.bgmSliderBar.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const minX = this.bgmSliderBar.x - this.bgmSliderBar.width / 2;
      const maxX = this.bgmSliderBar.x + this.bgmSliderBar.width / 2;
      const newX = Phaser.Math.Clamp(pointer.x, minX, maxX);
      this.bgmSliderHandle.x = newX;
      AudioManager.I.setBgmVolume((newX - minX) / this.bgmSliderBar.width);
    });

    this.sfxSliderBar.setInteractive();
    this.sfxSliderBar.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const minX = this.sfxSliderBar.x - this.sfxSliderBar.width / 2;
      const maxX = this.sfxSliderBar.x + this.sfxSliderBar.width / 2;
      const newX = Phaser.Math.Clamp(pointer.x, minX, maxX);
      this.sfxSliderHandle.x = newX;
      AudioManager.I.setSfxVolume((newX - minX) / this.sfxSliderBar.width);
    });


    bgmMuteBtn.on("pointerdown", () => {
      if (AudioManager.I.getBgmVolume() > 0) {
        previousBgmVolume = AudioManager.I.getBgmVolume();
        AudioManager.I.setBgmVolume(0);
        bgmMuteBtn.setTexture("icon-music-off");
        const minX = this.bgmSliderBar.x - this.bgmSliderBar.width / 2;
        this.bgmSliderHandle.x = minX;
      } else {
        AudioManager.I.setBgmVolume(previousBgmVolume);
        bgmMuteBtn.setTexture("icon-music-on");
        const minX = this.bgmSliderBar.x - this.bgmSliderBar.width / 2;
        this.bgmSliderHandle.x = minX + previousBgmVolume * this.bgmSliderBar.width;
      }
    });

    sfxMuteBtn.on("pointerdown", () => {
      if (AudioManager.I.getSfxVolume() > 0) {
        previousSfxVolume = AudioManager.I.getSfxVolume();
        AudioManager.I.setSfxVolume(0);
        sfxMuteBtn.setTexture("icon-music-off");
        const minX = this.sfxSliderBar.x - this.sfxSliderBar.width / 2;
        this.sfxSliderHandle.x = minX;
      } else {
        AudioManager.I.setSfxVolume(previousSfxVolume);
        sfxMuteBtn.setTexture("icon-music-on");
        const minX = this.sfxSliderBar.x - this.sfxSliderBar.width / 2;
        this.sfxSliderHandle.x = minX + previousSfxVolume * this.sfxSliderBar.width;
      }
    });

    this.settingsBtn.setInteractive()
  .on("pointerover", () => {
    this.settingsBtn.setScale(0.33); 
  })
  .on("pointerout", () => {
    this.settingsBtn.setScale(0.3); 
  });

    




    // Make UIScene persistent
    this.scene.bringToTop();
    this.scene.launch(); // ensure it stays alive across other scenes
    this.createLevelButtons();
    this.levelButtons.forEach(btn => btn.setVisible(true));


    
      }

    private levelButtons: Phaser.GameObjects.Text[] = [];
    private levelButtonBackgrounds: Phaser.GameObjects.Graphics[] = [];
    private levelButtonPositions: { x: number; y: number }[] = [];
    private levelSelectButton!: Phaser.GameObjects.Text;

    createLevelButtons() {
      const currentScene = this.getCurrentGameScene();

    if (currentScene === "MainMenu" || currentScene === "GameOverScene" || currentScene === "LevelSelectScene") {
        console.log("Skipping level buttons for MainMenu/GameOver");
        return;
    }

    if (this.levelButtons) this.levelButtons.forEach(btn => btn.destroy());
    if (this.levelButtonBackgrounds) this.levelButtonBackgrounds.forEach(bg => bg.destroy());
    if (this.levelSelectButton) this.levelSelectButton.setVisible(false);

    this.levelButtons = [];
    this.levelButtonBackgrounds = [];
      
      const totalLevels = 6;
      const buttonSpacing = 140;
      const startX = this.cameras.main.width / 2 - ((totalLevels - 1) * buttonSpacing) / 2;
      const yPos = this.cameras.main.height - 67;

      const iconLevelSelect = this.add.image(0, 0, 'levelSelect').setDisplaySize(120, 120).setOrigin(0.5, 0.5);
      iconLevelSelect.postFX.addShadow(0, 10, 0.004, 1, 0x333333, 30, 1);

      const levelSelectButton = this.add.container(120, 80, [iconLevelSelect])
        .setSize(500, 200)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => {
            levelSelectButton.setScale(1.1);
            AudioManager.I.playSfx(this, "hoverSound");
        })
        .on("pointerout", () => {
            levelSelectButton.setScale(1);
        })
        .on("pointerdown", () => {
            AudioManager.I.playSfx(this, "pressSound");
            const current = this.getCurrentGameScene();
            if (current) this.scene.stop(current);
            this.scene.launch("LevelSelectScene", { returnScene: current });
                  });


      if (this.levelButtonBackgrounds) this.levelButtonBackgrounds.forEach(bg => bg.destroy());
      if (this.levelButtons) this.levelButtons.forEach(btn => btn.destroy());
      this.levelButtonBackgrounds = [];
      this.levelButtons = [];
      this.levelButtonPositions = [];

      for (let i = 1; i <= totalLevels; i++) {
          const x = startX + (i - 1) * buttonSpacing;
          const y = yPos;

          // save postition
          this.levelButtonPositions.push({ x, y });

          //Background for text
          const bg = this.add.graphics();
          bg.fillStyle(0xffffff, 1);
          bg.lineStyle(4, 0x474253, 1);
          const buttonWidth = 60;
          const buttonHeight = 60;
          bg.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
          bg.strokeRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
          this.levelButtonBackgrounds.push(bg);

          //Text
          const levelText = this.add.text(x, y, `${i}`, {
              fontFamily: "Unbounded",
              fontSize: "36px",
              color: "#000",
          }).setOrigin(0.5)
           

          this.levelButtons.push(levelText);
    }
}

  protected createBackground() {
    //top banner
    renderBanner(this, 
          { x: 200,
            y: 80,
            height: 1000,
            width: 800,
          });
        }
      


  update(): void {
    const currentScene = this.getCurrentGameScene();
    const shouldShowButtons =
      currentScene !== "MainMenu" &&
      currentScene !== "GameOverScene" &&
      currentScene !== "LevelSelectScene";

    if (this.levelSelectButton) this.levelSelectButton.setVisible(shouldShowButtons);
    if (this.levelButtons) this.levelButtons.forEach(btn => btn.setVisible(shouldShowButtons));
    if (this.levelButtonBackgrounds) this.levelButtonBackgrounds.forEach(bg => bg.setVisible(shouldShowButtons));


  if (shouldShowButtons && this.levelButtonBackgrounds && this.levelButtonPositions) {
    this.levelButtonBackgrounds.forEach((bg, index) => {
      const cleared = this.registry.get(`levelCleared_${index + 1}`);
      const color = cleared ? 0x6cc070 : 0xffffff;

      const pos = this.levelButtonPositions[index];
      if (!pos) return;

      const buttonWidth = 80;
      const buttonHeight = 80;

      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(4, 0x474253, 1);
      bg.fillRect(pos.x - buttonWidth / 2, pos.y - buttonHeight / 2, buttonWidth, buttonHeight);
      bg.strokeRect(pos.x - buttonWidth / 2, pos.y - buttonHeight / 2, buttonWidth, buttonHeight);
    });
  }


  
    this.levelButtonBackgrounds.forEach((bg, index) => {
            const cleared = this.registry.get(`levelCleared_${index + 1}`);
            const color = cleared ? 0x6cc070 : 0xffffff;

            const { x, y } = this.levelButtonPositions[index];
            const buttonWidth = 70;
            const buttonHeight = 70;

            bg.clear();
            bg.fillStyle(color, 1);
            bg.lineStyle(4, 0x474253, 1);
            bg.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
            bg.strokeRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
        });
  }

  private getCurrentGameScene(): string {
    const active = this.scene.manager.getScenes(true);
    const gameScene = active.find(s => s.scene.key !== "UIScene"); 
    return gameScene ? gameScene.scene.key : "";
}


  public showUI() {
    this.settingsBtn.setVisible(true); 
    this.sliderPanel.setVisible(false); 
    this.bgmText.setVisible(false);
    this.bgmSliderBar.setVisible(false);
    this.bgmSliderHandle.setVisible(false);
    this.sfxText.setVisible(false);
    this.sfxSliderBar.setVisible(false);
    this.sfxSliderHandle.setVisible(false);

    this.createLevelButtons(); 
}

  public hideUI() {
    this.settingsBtn.setVisible(false);
    this.levelButtons.forEach(btn => btn.setVisible(false));
    this.hideSliders();
  }


  
  

  
}


