import Phaser from "phaser";
import {PLAYER_ID_DATA_KEY, HALF_WIDTH, WIDTH, HEIGHT, HALF_HEIGHT} from "../constants.ts";
import { PLAYER_SCORING_DATA, storeScoringDataForPlayer, Position } from "../scoring.ts";
import { renderBanner } from "../banners.ts";
import { AudioManager } from "../AudioManager";

//FixItScene.ts is the Superclass of each level#.ts class
export abstract class FixItScene<T> extends Phaser.Scene {

//Game blocks
  protected movableBlockOne!: Phaser.Physics.Matter.Image;
  protected movableBlockTwo!: Phaser.Physics.Matter.Image;
  protected movableBlockThree!: Phaser.Physics.Matter.Image;
  protected blockOne!: Phaser.Physics.Matter.Image;
  protected blockTwo!: Phaser.Physics.Matter.Image;
  protected blockThree!: Phaser.Physics.Matter.Image;
  protected blockFour!: Phaser.Physics.Matter.Image;
  protected blockFive!: Phaser.Physics.Matter.Image;
  protected blockSix!: Phaser.Physics.Matter.Image;
  protected blockSeven!: Phaser.Physics.Matter.Image;
  protected longBlockOne!: Phaser.Physics.Matter.Image;
  protected longBlockTwo!: Phaser.Physics.Matter.Image;
  protected fallBlock!: Phaser.Physics.Matter.Image;
  protected fallBlockOne!: Phaser.Physics.Matter.Image;
  protected fallBlockTwo!: Phaser.Physics.Matter.Image;
  protected woodLog!: Phaser.Physics.Matter.Image; 
  protected woodLog2!: Phaser.Physics.Matter.Image; 
  protected stone!: Phaser.Physics.Matter.Image; 
  protected stone2!: Phaser.Physics.Matter.Image; 
  protected woodcircle!: Phaser.Physics.Matter.Image; 
  protected scaffolding!: Phaser.Physics.Matter.Image; 
  protected scaffolding2!: Phaser.Physics.Matter.Image; 
  protected scaffolding3!: Phaser.Physics.Matter.Image; 
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
  protected backgroundv2!: Phaser.GameObjects.Image;
  protected groundv2!: Phaser.GameObjects.Image;

  // //Buttons
  protected startButton!: Phaser.GameObjects.Image;
  protected restartButton!: Phaser.GameObjects.Image;
  protected nextSceneButton!: Phaser.GameObjects.Image;

  //Text
  protected levelNameText!: Phaser.GameObjects.Text;
  protected instructionsText!: Phaser.GameObjects.Text;
  protected coordText!: Phaser.GameObjects.Text;
  protected blockNameText!: Phaser.GameObjects.Text;

  protected failureText!: Phaser.GameObjects.Text;
  protected failureText2!: Phaser.GameObjects.Text;
  protected successText!: Phaser.GameObjects.Text;
  protected successText2!: Phaser.GameObjects.Text;

  //Level Variables
  protected nextSceneKey: string;
  protected prevSceneKey: string;
  protected key: string;
  protected instructions: string;
  protected showDropButton: boolean;

  //Database variables
  public levelTriesDataKey: string;
  private scoringData: T[] = [];
  protected name: keyof PLAYER_SCORING_DATA;
  protected startPosition: Position; //For storing block movements
  protected endPosition: Position;
  protected middlePosition: Position;
  protected blockName: string;
  protected startPositionList: Position[]; 
  protected endPositionList: Position[];
  protected middlePositionList: Position[][];
  protected currentPathList: Position[]
  protected blockNameList: string[];
  protected didCollapse: boolean;
  protected numberOfBlocksMoved: number;
  protected endTime: number;
  protected dragInterval?: Phaser.Time.TimerEvent;

  //json for physics mapping of the assets
  protected shapes: JSON;

  protected constructor(name: keyof PLAYER_SCORING_DATA, key: string, nextSceneKey: string, instructions: string, prevSceneKey: string) {
    super(key);
    this.nextSceneKey = nextSceneKey;
    this.key = key;
    this.instructions = instructions;
    this.name = name;
    this.prevSceneKey = prevSceneKey;

    //Initializing some database variables
    this.startPosition = { x: 0, y: 0, time: 0 };
    this.endPosition = { x: 0, y: 0, time: 0 };
    this.blockName = "";
    this.startPositionList = [];
    this.endPositionList = [];
    this.currentPathList = [];
    this.middlePositionList = [];
    this.blockNameList = [];
    this.levelTriesDataKey = `${name}:tries`;
  }

protected abstract recordScoreDataForCurrentTry(): T;
protected abstract didStructureCollapse(): boolean;

  //preload() loads game assets before the scenes start for faster load times.
  preload() {
    this.load.image("block", "assets/wood.png");
    this.load.image("block3", "assets/wood3.png");
    this.load.image("4block", "assets/wood4.png");
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

    //triangle stone shapes
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
    this.load.image("textbubble", "assets/textbubble.png")

    //Peeko spritesheet
    this.load.spritesheet("peekoani", "assets/spritesheetPeeko.png", { frameWidth: 500, frameHeight: 500 });



    //buttons 
    this.load.image("startButtonImg", "assets/drop.png")
    this.load.image("restartButtonImg", "assets/restart.png")
    this.load.image("nextSceneButtonImg", "assets/next.png")

    this.load.image("backward", "assets/fast-backward-button.png")
    this.load.image("forward", "assets/fast-forward-button.png")

    //load font
    this.load.font('Unbounded', 'assets/Unbounded.ttf', 'truetype');
    this.load.font('Unbounded-Black', 'assets/Unbounded-Black.ttf', 'truetype');

    //sounds
    this.load.audio("hoverSound", "assets/button_hover.mp3");
    this.load.audio("pressSound", "assets/button_press.mp3");
    this.load.audio("stage_clear", "assets/stage_clear.mp3");
    this.load.audio("button_restart", "assets/button_restart.mp3");
    this.load.audio("game_start", "assets/game_start.mp3");
    this.load.audio("hitSound", "assets/box_hit.mp3");

    this.load.html("gameOver_popup", "assets/html_gameover_popup.html");
  }

  //init() performs initial setup tasks
  init() {
    if (!this.registry.has(this.levelTriesDataKey)) {
      this.registry.set(this.levelTriesDataKey, 0)
    }
    this.numberOfBlocksMoved = 0;
    this.endTime = 0; 
    this.showDropButton = false;
    this.anims.pauseAll();

    this.failureText2 = this.add.text(
        HALF_WIDTH, HALF_HEIGHT - 150,
        "Nice try, lets try that again!", 
        {
            fontFamily: "Unbounded",
            fontSize: "34px",
            color: "#5D576B",
            align: "center"
        }
        
      ).setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0);
  }


  // - - Background - -
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
  
  private confirmPopup!: Phaser.GameObjects.DOMElement;
  

  // - - Navigation Buttons - -
  protected renderNavigationButtons() {

    // Confirmation Popup for going back to main menu
        this.confirmPopup = this.add.dom(HALF_WIDTH, HALF_HEIGHT)
          .createFromCache("gameOver_popup")
          .setOrigin(0.5)
          .setDepth(20)
          .setVisible(false) as Phaser.GameObjects.DOMElement;
      
    

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
        AudioManager.I.playSfx(this, "pressSound");
        this.scene.start(this.prevSceneKey);
      })
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
                this.time.delayedCall(150, () => {
                forwardButton.setDisplaySize(120, 120);

                if (this.nextSceneKey === "GameOver") {
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

                        // Go to Gameover
                        const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
                        this.scoringData.push(this.recordScoreDataForCurrentTry());
                        storeScoringDataForPlayer(
                          playerId,
                          this.name,
                          this.scoringData as unknown as [], // Blergh; generics hard
                        );
                        this.startPositionList = [];
                        this.endPositionList = [];
                        this.scoringData = [];
                        
                        this.scene.start("GameOver");
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
                    const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
                    this.scoringData.push(this.recordScoreDataForCurrentTry());
                    storeScoringDataForPlayer(
                      playerId,
                      this.name,
                      this.scoringData as unknown as [], // Blergh; generics hard
                    );
                    this.startPositionList = [];
                    this.endPositionList = [];
                    this.scoringData = [];
                    this.scene.start(this.nextSceneKey);
                  });
                }
              });
            });
      forwardButton.postFX.addShadow(0, 10, 0.004, 1, 0x333333, 30, 1);
  }




  // - - Buttons & Text - -
  protected createButtons() {

    // Start Button
    this.startButton = this.add.image(1700, 300, "startButtonImg")
    .setOrigin(0.5).setInteractive().setDepth(100).setVisible(false)
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
    this.startPhysics(); //Runs startPhysics() function defined in each level.
    this.registry.inc(this.levelTriesDataKey);

  });


    // Restart Button
    this.restartButton = this.add.image(1700, 300, "restartButtonImg")
    .setOrigin(0.5).setInteractive().setVisible(false).setDepth(10)
    .on("pointerover", () => { //hover effects
        this.restartButton.setScale(1.1);
        AudioManager.I.playSfx(this, "hoverSound");
      })
      .on("pointerout", () => {
        this.restartButton.setScale(1);
      });


    this.restartButton.on("pointerdown", () => {
      AudioManager.I.playSfx(this, "button_restart");
      const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
      this.scoringData.push(this.recordScoreDataForCurrentTry());
      storeScoringDataForPlayer(
        playerId,
        this.name,
        this.scoringData as unknown as [], 
      );
      
      this.startPositionList = [];
      this.endPositionList = [];
      this.blockNameList = [];
      this.scoringData = [];
      this.scene.restart(); 
    });


    // Next Scene Button
    this.nextSceneButton = this.add.image(1700, 300, "nextSceneButtonImg").
    setOrigin(0.5).setInteractive().setVisible(false).setDepth(100)
    .on("pointerover", () => { //hover effects
        this.nextSceneButton.setScale(1.1);
        AudioManager.I.playSfx(this, "hoverSound");
      })
      .on("pointerout", () => {
        this.nextSceneButton.setScale(1);
      });

    this.nextSceneButton.on("pointerdown", () => {
      AudioManager.I.playSfx(this, "pressSound");
      const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
      this.scoringData.push(this.recordScoreDataForCurrentTry());
      storeScoringDataForPlayer(
        playerId,
        this.name,
        this.scoringData as unknown as [], 
      );
      
      this.startPositionList = [];
      this.endPositionList = [];
      this.scoringData = [];
      this.scene.start(this.nextSceneKey); 
    });


    // LEVEL NAME TEXT (temp?)
    this.levelNameText = this.add.text(HALF_WIDTH, 25, this.key.slice(0, -1) + " " + this.key.slice(5), {
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
    

    // COORDINATES TEXT
    this.coordText = this.add.text(270, HEIGHT - 90, "", {
      fontFamily: 'Unbounded',
      fontSize: '32px',
      color: '#e6ebe0',
    }).setOrigin(0.5, 0).setFontStyle('bold');
    this.coordText.setDepth(10);

    this.blockNameText = this.add.text(WIDTH - 270, HEIGHT - 90, "", {
      fontFamily: 'Unbounded',
      fontSize: '32px',
      color: '#e6ebe0',
    }).setOrigin(0.5, 0).setFontStyle('bold');
    this.blockNameText.setDepth(10);
  }
  


  // Collision Sound
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


  // - - Animated fail scene - -
  protected createFailScene(){
    //peeko flying in 
    this.anims.create({
            key: "flying",
            frames: this.anims.generateFrameNumbers("peekoani", { frames: [ 0, 1, 2, 3, 4]  }),
            frameRate: 8,
            repeat: -1
        });

    // const peekoFlying = this.add.sprite(HALF_WIDTH - 650, HALF_HEIGHT, "flying").setScale(1).play("flying").setDepth(200);


    //peeko reaction (sad)
    this.anims.create({//start
            key: "sad",
            frames: this.anims.generateFrameNumbers("peekoani", { frames: [ 5, 6, 7, 8]  }),
            frameRate: 8,
        });
    
    this.anims.create({//repeat crying
            key: "sad2",
            frames: this.anims.generateFrameNumbers("peekoani", { frames: [7, 8]  }),
            frameRate: 8,
            repeat: -1,
        });

    const peekoSad = this.add.sprite(-250, HALF_HEIGHT, "flying").setScale(1).setDepth(200);

    peekoSad.play("flying");
    peekoSad.playAfterRepeat("sad", 3);
    peekoSad.chain("sad2");

    this.tweens.add({
        targets: peekoSad,
        x: 300,
        duration: 2500,
        ease: 'Sine.easeInOut',
    });


    this.time.delayedCall(2500, () => {
      //overlays
      const failOverlay = renderBanner(this, 
          { backgroundColour: 0xED6A5A,
            x: HALF_WIDTH - 900,
            y: 157,
            height: 895,
            width: 1800,
            backgroundAlpha: 0.15,
            shadow: false,
            stroke: true,
          });

      const textBubble = this.add.image(HALF_WIDTH, HALF_HEIGHT - 180, "textbubble").setAlpha(0);

      this.tweens.add({
        targets: textBubble,
        y: HALF_HEIGHT - 200,
        duration: 500,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

      //Main fail text
      const failureText = this.failureText = this.add.text(
        HALF_WIDTH, HALF_HEIGHT - 220,
        "Almost there!", 
        {
            fontFamily: "Unbounded",
            fontSize: "70px",
            color: "#ED6A5A",
            align: "center"
        }
        
      ).setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0);

      this.tweens.add({
        targets: failureText,
        y: HALF_HEIGHT - 240,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

      this.tweens.add({
        targets: this.failureText2,
        y: HALF_HEIGHT - 170,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });
      

    });
  }



  // - - Animated Success Scene - -
  protected createSuccessScene(){
    //peeko flying in animation
    this.anims.create({
            key: "flying",
            frames: this.anims.generateFrameNumbers("peekoani", { frames: [ 0, 1, 2, 3, 4]  }),
            frameRate: 8,
            repeat: -1
        });

    //peeko reaction (happy) animation
    this.anims.create({
            key: "happy",
            frames: this.anims.generateFrameNumbers("peekoani", { frames: [ 10, 11, 12, 13, 14, 15, 14, 13, 14, 12]  }),
            frameRate: 8,
        });

    const peekoHappy = this.add.sprite(-250, HALF_HEIGHT, "flying").setScale(1).setDepth(200);//Make the sprite

    this.tweens.add({
        targets: peekoHappy,
        x: 300,
        duration: 2500,
        ease: 'Sine.easeInOut',
    });

    peekoHappy.play("flying");
    peekoHappy.playAfterRepeat("happy", 3);//the flying animation loops 3 times, and then the happy animation plays

    //after peeko flies in, the textbox would should up
    this.time.delayedCall(2500, () => {
      const successOverlay = renderBanner(this, 
          { backgroundColour: 0x539F94,
            x: HALF_WIDTH - 900,
            y: 157,
            height: 895,
            width: 1800,
            backgroundAlpha: 0.15,
            shadow: false,
            stroke: true,
          });

      const textBubble = this.add.image(HALF_WIDTH, HALF_HEIGHT - 180, "textbubble").setAlpha(0);

      this.tweens.add({
        targets: textBubble,
        y: HALF_HEIGHT - 200,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

      //Main success text
      const successText = this.add.text(
          HALF_WIDTH, HALF_HEIGHT - 220,
          "Good Job!", 
          {
              fontFamily: "Unbounded",
              fontSize: "70px",
              color: "#539F94",
              align: "center"
          }
          
      ).setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0);

      this.tweens.add({
        targets: successText,
        y: HALF_HEIGHT - 240,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

      //Smaller text for success
      const successText2 = this.add.text(
          HALF_WIDTH, HALF_HEIGHT - 150,
          "You saved the gift!", 
          {
              fontFamily: "Unbounded",
              fontSize: "34px",
              color: "#5D576B",
              align: "center"
          }
      ).setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0);

      this.tweens.add({
        targets: successText2,
        y: HALF_HEIGHT - 170,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

    });

  }


}