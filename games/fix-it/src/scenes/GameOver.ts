import { Scene } from "phaser";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  HEIGHT,
  PLAYER_ID_DATA_KEY, 
  QUARTER_HEIGHT,
  WIDTH,
  GAME_SCORE_DATA_KEY,
} from "../constants.ts";

import { renderTextBanner, renderBanner} from "../banners.ts";
import { getPlayerOverallScore } from "../scoring.ts";
import { AudioManager } from "../AudioManager";


export class GameOver extends Scene {
  gameover_text: Phaser.GameObjects.Text;

  constructor() {
    super("GameOver");
  }

  preload() {
    this.load.image("home", "assets/home.png");
    this.load.image("background", "assets/background.png");
    this.load.image("peeko", "assets/peeko.png");
    this.load.image("textbubble", "assets/textbubble.png");
    this.load.image("gift", "assets/gift.png");

    this.load.spritesheet("peekoani", "assets/spritesheetPeeko.png", { frameWidth: 500, frameHeight: 500 });

  }

  protected createBackground() {
    //Replacing background with background image 
    this.add
      .image(0, 0, "background")
      .setScale(1.2)
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height )
      .setDepth(-5); 
  }

  create() {
    this.anims.resumeAll();

    this.createBackground();
    const playerIds = this.registry.get(PLAYER_ID_DATA_KEY);
    //total tries 
    const totaltries = getPlayerOverallScore(playerIds);
    const totalGiftsSaved = this.game.registry.get("giftsSaved");

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
          });

    this.add.text(HALF_WIDTH, 40, "Ngā mihi!", {
      fontFamily: 'Unbounded-Black',
      fontSize: '64px',
      color: '#ED6A5A',
    }).setOrigin(0.5, 0).setFontStyle('bold').setShadow(0, 2, 'rgba(0, 0, 0, 0.3)', 1, false, true);

    const textbubble = this.add.image(HALF_WIDTH, HALF_HEIGHT -200, "textbubble").setAlpha(0);
    this.tweens.add({
        targets: textbubble,
        y: HALF_HEIGHT - 220,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

    //list of lines peekos message changes depending on number of gifts
    let Peekoline = "Well done!";

    if(totalGiftsSaved < 2){
      Peekoline = "Good try!";
    }else if(totalGiftsSaved < 5){
      Peekoline = "Well done!";
    }else if(totalGiftsSaved < 8){
      Peekoline = "Amazing work!";
    }else{
      Peekoline = "Super Star!";
    }
    
    const peekoGameOverText = this.add.text(HALF_WIDTH, HALF_HEIGHT -230, `You saved ${totalGiftsSaved} gifts. ${Peekoline}`, {
      fontFamily: 'Unbounded',
      fontSize: '30px',
      color: '#5D576B',
    }).setOrigin(0.5, 0).setAlpha(0);
    this.tweens.add({
        targets: peekoGameOverText,
        y: HALF_HEIGHT - 250,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

    this.add.text(WIDTH - 150, HEIGHT -200, `Your Player ID: ${playerIds}\n Total Tries: ${totaltries}`, {
      fontFamily: 'Unbounded',
      fontSize: '30px',
      color: '#5D576B',
      align:'right',
    }).setOrigin(1, 0);


    //gifts new layout
    const radius = 174; 

    const centerX = WIDTH / 2;
    const centerY = (QUARTER_HEIGHT/4 + 40 + HALF_HEIGHT + QUARTER_HEIGHT)/2 + 200;

    this.giftContainer = this.add.container(centerX, centerY);

    for (let i = 0; i < totalGiftsSaved; i++) {
      const angle = ((i / totalGiftsSaved) * Phaser.Math.PI2) + Phaser.Math.PI2/2 + Phaser.Math.PI2/4;
      const x = radius*2.3 * Math.cos(angle);
      const y = radius/2 * Math.sin(angle);

      const rotateList = [0, 0.1, 0.2, 0.3, -0.1, -0.2, -0.3, 0, 0]
      const randIndex = Phaser.Math.Between(0, 8);
      
      const gift = this.add.image(x + Phaser.Math.Between(-5, 5), y + Phaser.Math.Between(-8, 8), "gift").setDisplaySize(150, 150).setOrigin(0.5, 0.5);
      gift.rotation = rotateList[randIndex];
      this.giftContainer.add(gift); 
    }

    // peeko animation 
    this.anims.create({
            key: "gameOverPeeko",
            frames: this.anims.generateFrameNumbers("peekoani", { frames: [ 10, 11, 12, 13, 14, 15, 14, 13, 14, 12 ]  }),
            frameRate: 8
        });

    const peekoGameOver = this.add.sprite(HALF_WIDTH - 650, HALF_HEIGHT, "gameOverPeeko").setScale(1).setDepth(200).play("gameOverPeeko");
    peekoGameOver.play("gameOverPeeko");

    const homeButton = this.add
      .sprite(HALF_WIDTH, HALF_HEIGHT + QUARTER_HEIGHT + 100, "home")
      .setDisplaySize(130, 130)
      .setInteractive()
      .on("pointerover", () => { //hover effects
        homeButton.setDisplaySize(150, 150);
      })
      .on("pointerout", () => {
        homeButton.setDisplaySize(130, 130);
      });
    
      homeButton.on("pointerdown", () => {
      this.scene.start("MainMenu");
      
    }).postFX.addShadow(0, 10, 0.004, 1, 0x333333, 30, 1);

    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      this.scene.setVisible(false, "UIScene");
      this.scene.pause("UIScene");
    }

  }
  
}
