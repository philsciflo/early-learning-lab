import Phaser from "phaser";
import {HALF_WIDTH, WIDTH, HALF_HEIGHT} from "../constants.ts";
import { renderBanner } from "../banners.ts";
import { AudioManager } from "../AudioManager";
//FixItScene.ts is the Superclass of each level#.ts class

export abstract class DropScene extends Phaser.Scene {
  //Game blocks
  protected movableBlockOne!: Phaser.Physics.Matter.Image;
  protected movableBlockTwo!: Phaser.Physics.Matter.Image;
  protected blockOne!: Phaser.Physics.Matter.Image;
  protected blockTwo!: Phaser.Physics.Matter.Image;
  protected blockThree!: Phaser.Physics.Matter.Image;
  protected blockFour!: Phaser.Physics.Matter.Image;
  protected blockFive!: Phaser.Physics.Matter.Image;
  protected longBlockOne!: Phaser.Physics.Matter.Image;
  protected longBlockTwo!: Phaser.Physics.Matter.Image;
  protected fallBlock!: Phaser.Physics.Matter.Image;
  protected fallBlockTwo!: Phaser.Physics.Matter.Image;
  protected woodLog!: Phaser.Physics.Matter.Image; 
  protected woodLog2!: Phaser.Physics.Matter.Image; 
  protected stone!: Phaser.Physics.Matter.Image; 
  protected stone2!: Phaser.Physics.Matter.Image; 
  protected woodcircle!: Phaser.Physics.Matter.Image; 
  protected scaffolding!: Phaser.Physics.Matter.Image; 
  protected rockSingle!: Phaser.Physics.Matter.Image; 
  protected stoneCircle!: Phaser.Physics.Matter.Image; 

  protected triangleWood!: Phaser.Physics.Matter.Image; 
  protected triangleWoodv2!: Phaser.Physics.Matter.Image; 
  protected triangleWoodv3!: Phaser.Physics.Matter.Image; 
  protected triangleWoodv4!: Phaser.Physics.Matter.Image; 

  protected triangleStone!: Phaser.Physics.Matter.Image; 
  protected triangleStonev2!: Phaser.Physics.Matter.Image; 
  protected triangleStonev3!: Phaser.Physics.Matter.Image; 
  protected triangleStonev4!: Phaser.Physics.Matter.Image; 

  //Claw 
  protected claw!: Phaser.Physics.Matter.Image;
  protected clawOne!: Phaser.Physics.Matter.Image;
  protected clawTwo!: Phaser.Physics.Matter.Image;

  //Backgound
  protected background!: Phaser.GameObjects.Image;
  // protected backgroundv2!: Phaser.GameObjects.Image;
  protected groundv2!: Phaser.GameObjects.Image;

  //Buttons
  protected startButton!: Phaser.GameObjects.Image;
  protected restartButton!: Phaser.GameObjects.Image;
  protected nextSceneButton!: Phaser.GameObjects.Image;

  //Text
  protected levelNameText!: Phaser.GameObjects.Text;
  protected instructionsText!: Phaser.GameObjects.Text;

  //Level Variables
  protected nextSceneKey: string;
  protected prevSceneKey: string;
  protected key: string;
  protected instructions: string;

  //json for physics mapping of the assets
  protected shapes: JSON;


  protected constructor(key: string, nextSceneKey: string, instructions: string,  prevSceneKey: string,) {
    super(key);
    this.nextSceneKey = nextSceneKey;
    this.key = key;
    this.instructions = instructions;
    this.prevSceneKey = prevSceneKey;
  }

  preload() {
    this.load.image("block", "assets/wood.png");
    this.load.image("4block", "assets/wood4.png");
    this.load.image("block3", "assets/wood3.png");
    this.load.image("wood4vertical", "assets/wood4vertical.png");
    this.load.image("wood3vertical", "assets/wood3vertical.png");
    this.load.image("5block", "assets/Wood5.png");
    this.load.image("ground", "assets/black.png");
    this.load.image("move_block", "assets/stone.png");
    this.load.image("stone", "assets/stone.png");
    this.load.image("gift", "assets/gift.png");
    this.load.image("woodcircle", "assets/woodcircle.png");
    this.load.image("woodLog", "assets/woodLog.png");
    this.load.image("scaffolding", "assets/scaffolding.png");
    this.load.image("rockSingle", "assets/rock-single.png");
    this.load.image("stoneCircle", "assets/stoneCircle.png");
    //triangle shapes
    this.load.image("triangleWood", "assets/triangleWood.png");
    this.load.image("triangleWoodv2", "assets/triangleWoodv2.png");
    this.load.image("triangleWoodv3", "assets/triangleWoodv3.png");
    this.load.image("triangleWoodv4", "assets/triangleWoodv4.png");
    //stone
    this.load.image("triangleStone", "assets/triangleStone.png");
    this.load.image("triangleStonev2", "assets/triangleStonev2.png");
    this.load.image("triangleStonev3", "assets/triangleStonev3.png");
    this.load.image("triangleStonev4", "assets/triangleStonev4.png");

    //json file for physics mapping
    this.load.json('shapes', 'assets/fixit-assets-physics.json');

    //claws
    this.load.image("claw", "assets/claw.png");
    this.load.image("clawOpen", "assets/clawOpen.png");

    //background 
    this.load.image("background", "assets/background.png")//background main menu
    this.load.image("groundv2", "assets/groundv2.png")//fake ground


    //buttons 
    this.load.image("startButtonImg", "assets/drop.png")
    this.load.image("restartButtonImg", "assets/restart.png")
    this.load.image("nextSceneButtonImg", "assets/next.png")

    this.load.image("backward", "assets/fast-backward-button.png")
    this.load.image("forward", "assets/fast-forward-button.png")

    this.load.html("home_popup", "assets/html_home_popup.html");

    //load font
    this.load.font('Unbounded', 'assets/Unbounded.ttf', 'truetype');
    this.load.font('Unbounded-Black', 'assets/Unbounded-Black.ttf', 'truetype');

    this.load.audio("hitSound", "assets/box_hit.mp3");

    //sounds
    this.load.audio("hoverSound", "assets/button_hover.mp3");
    this.load.audio("pressSound", "assets/button_press.mp3");
    this.load.audio("stage_clear", "assets/stage_clear.mp3");
    this.load.audio("button_restart", "assets/button_restart.mp3");
    this.load.audio("game_start", "assets/game_start.mp3");
    this.load.audio("hitSound", "assets/box_hit.mp3");
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
          });
    //Replacing background with background image 
    this.add
      .image(0, 0, "background")
      .setScale(1.2)
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height )
      .setDepth(-5); 
  }

  private confirmPopup!: Phaser.GameObjects.DOMElement;

  protected renderNavigationButtons() {

    // Confirmation Popup for going back to main menu
    this.confirmPopup = this.add.dom(HALF_WIDTH, HALF_HEIGHT)
      .createFromCache("home_popup")
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false) as Phaser.GameObjects.DOMElement;
  

    //nav buttons 
    const backwardButton = this.add 
      .image(HALF_WIDTH - (510), 80, "backward")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(120, 120)
      .setInteractive()
      .on("pointerover", () => { //hover effects
        backwardButton.setDisplaySize(130, 130);
        AudioManager.I.playSfx(this, "hoverSound");
      })
      .on("pointerout", () => {
        backwardButton.setDisplaySize(120, 120);
      })
      .on("pointerdown", () => {
        this.time.delayedCall(150, () => {
          backwardButton.setDisplaySize(120, 120);

          if (this.prevSceneKey === "MainMenu") {
            this.confirmPopup.setVisible(true);
            this.confirmPopup.setAlpha(0);
            this.confirmPopup.setY(HALF_HEIGHT-20);

            this.tweens.add({
              targets: this.confirmPopup,
              alpha: 1,
              y: HALF_HEIGHT,
              duration: 500,
              ease: 'Sine.easeInOut',
            });

            const popupEl = this.confirmPopup.getChildByID("confirm-popup");
            const yesBtn = popupEl.querySelector("#yesBtn") as HTMLButtonElement;
            const noBtn = popupEl.querySelector("#noBtn") as HTMLButtonElement;

            yesBtn.onclick = null;
            noBtn.onclick = null;

            yesBtn.onclick = () => {
              AudioManager.I.playSfx(this, "pressSound");
              this.tweens.add({
                targets: this.confirmPopup,
                alpha: 0,
                y: HALF_HEIGHT - 20,
                duration: 500,
                ease: 'Sine.easeIn',
                onComplete: async () => {
                  this.confirmPopup.setVisible(false);
                  this.confirmPopup.setAlpha(1);
                  this.confirmPopup.setY(HALF_HEIGHT);

                  // Go to Main Menu
                  this.scene.start("MainMenu");
                }
              });
            };

            noBtn.onclick = () => {
              AudioManager.I.playSfx(this, "pressSound");
              this.tweens.add({
                targets: this.confirmPopup,
                alpha: 0,
                y: HALF_HEIGHT - 20,
                duration: 500,
                ease: 'Sine.easeIn',
                onComplete: () => {
                  this.confirmPopup.setVisible(false);
                  this.confirmPopup.setAlpha(1);
                  this.confirmPopup.setY(HALF_HEIGHT);
                }
              });
            };

            return;
          }
          else {
            this.time.delayedCall(0, async () => {
              this.scene.start(this.prevSceneKey);
            });
          }
        });
      });
      backwardButton.postFX.addShadow(0, 10, 0.004, 1, 0x333333, 30, 1);

    const forwardButton = this.add
      .image(HALF_WIDTH + 510, 80, "forward")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(120, 120)
      .setInteractive()
      .on("pointerover", () => { //hover effects
        forwardButton.setDisplaySize(130, 130);
        AudioManager.I.playSfx(this, "hoverSound");
      })
      .on("pointerout", () => {
        forwardButton.setDisplaySize(120, 120);
      })
      .on("pointerdown", () => {
        this.scene.start(this.nextSceneKey);
        AudioManager.I.playSfx(this, "pressSound");
      });
      forwardButton.postFX.addShadow(0, 10, 0.004, 1, 0x333333, 30, 1);
  }
      
  protected createButtons() {
    const centerX = this.cameras.main.width / 2;
    // START BUTTON
    this.startButton = this.add.image(1700, 300, "startButtonImg").
    setOrigin(0.5).setInteractive()
    .on("pointerover", () => { //hover effects
        this.startButton.setScale(1.1);
        AudioManager.I.playSfx(this, "hoverSound");
      })
      .on("pointerout", () => {
        this.startButton.setScale(1);
      });

    this.startButton.on("pointerdown", () => {
      AudioManager.I.playSfx(this, "pressSound");
      this.startButton.disableInteractive();
      this.startButton.destroy();
      this.startPhysics(); //Runs startPhysics() function defined in each level. (Ignore Error it works)
      
    });

    this.tweens.add({
      targets: this.startButton,
      alpha: { from: 1, to: 0.7 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.tweens.add({
        targets: this.startButton,
        scale: { from: 1, to: 1.1 },
        duration: 400,
        yoyo: true,
        repeat: -1
    });

    // RESTART BUTTON
    this.restartButton = this.add.image(1700, 300, "startButtonImg")
    .setOrigin(0.5).setInteractive().setVisible(false)
    .on("pointerover", () => { //hover effects
        this.restartButton.setScale(1.1);
        AudioManager.I.playSfx(this, "hoverSound");
      })
      .on("pointerout", () => {
        this.restartButton.setScale(1);
      });

    this.restartButton.on("pointerdown", () => {
      AudioManager.I.playSfx(this, "button_restart");
      this.scene.restart(); 
    });

    // NEXT SCENE BUTTON
    this.nextSceneButton = this.add.image(1700, 300, "nextSceneButtonImg").
    setOrigin(0.5).setInteractive().setVisible(false)
    .on("pointerover", () => { //hover effects
        this.nextSceneButton.setScale(1.1);

        AudioManager.I.playSfx(this, "hoverSound");
      })
      .on("pointerout", () => {
        this.nextSceneButton.setScale(1);
      });

    this.nextSceneButton.on("pointerdown", () => {
      AudioManager.I.playSfx(this, "pressSound");
      this.scene.start(this.nextSceneKey); 
    });
    this.tweens.add({
      targets: this.nextSceneButton,
      alpha: { from: 1, to: 0.7 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.tweens.add({
        targets: this.nextSceneButton,
        scale: { from: 1, to: 1.1 },
        duration: 400,
        yoyo: true,
        repeat: -1
    });

    // LEVEL NAME TEXT (temp?)
    this.levelNameText = this.add.text(HALF_WIDTH, 25, (this.key).slice(0, -5) + " " + this.key.slice(5, 6), {
      fontFamily: 'Unbounded-Black',
      fontSize: '64px',
      color: '#ED6A5A',
    }).setOrigin(0.5, 0).setFontStyle('bold');
    this.levelNameText.setShadow(0, 2, 'rgba(0, 0, 0, 0.3)', 1, false, true);

    // INSTRUCTIONS TEXT 
    this.instructionsText = this.add.text(HALF_WIDTH, 95, this.instructions, {
      fontFamily: 'Unbounded',
      fontSize: '32px',
      color: '#5D576B',
    }).setOrigin(0.5, 0).setFontStyle('bold');
  }

 protected createCollisionSound(minImpact: number = 1) {
    if (!this.fallBlock && !this.fallBlockOne && !this.fallBlockTwo) return;

    const fallBlocks = [this.fallBlock, this.fallBlockOne, this.fallBlockTwo].filter(b => b !== undefined);

    this.matter.world.on("collisionstart", (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        event.pairs.forEach(pair => {
            const goA = pair.bodyA.gameObject;
            const goB = pair.bodyB.gameObject;

            if (fallBlocks.includes(goA) || fallBlocks.includes(goB)) {
                const impact = pair.collision.penetration.x ** 2 + pair.collision.penetration.y ** 2;
                if (impact > minImpact) {
                    this.sound.play("hitSound", { volume: 1 });
                }
            }
        });
    });
}


}