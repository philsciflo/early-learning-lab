import { Scene } from "phaser";
import {
  PLAYER_SCORING_DATA,
  getScoreDataJSONString,
  storeScoringDataForPlayer,
} from "../scoring";
import {
  HEIGHT,
  WIDTH,
  QUARTER_HEIGHT,
  HALF_WIDTH,
  QUARTER_WIDTH,
  HALF_HEIGHT,
  PLAYER_ID_DATA_KEY,
  gameAreaWidth,
  gameAreaHeight,
  gameAreaX,
  gameAreaY,
} from "../constants";
import { AudioManager } from "../AudioManager";
import { renderBanner, renderTitleWithSubtitle} from "../banners";

const SCORE_DATA_KEY ="Score";
const TRIES_DATA_KEY = "tries";
const rightTextX = gameAreaX + gameAreaWidth / 2 - 60;

export abstract class MagicCupsScene<T> extends Scene {
  // Add the data required
  private gameArea!: Phaser.GameObjects.Container;
  private bannerGfx!: Phaser.GameObjects.Graphics;
  protected successOverlay?: Phaser.GameObjects.Graphics;
  protected failureOverlay?: Phaser.GameObjects.Graphics;
  private titleContainer!: Phaser.GameObjects.Container;

  protected dropCount = 0;
  protected maxDropCount = 1;
  protected boxX: number;
  protected boxY: number;
  protected attempt: number;
  protected triesDataKey: string;
  protected scoreDataKey: string;
  private scoringData: T[];
  private score = 0;
  private hasScore = false;
  protected isAttempted = false;
  private scoreForThisTry = 0;
  public duration: number;
  

  protected currentScore = -1;
  protected levelStartTime = 0;
  protected dropClickTime = 0;

  private subtitleText!: Phaser.GameObjects.Text;
  protected successPeeko?: Phaser.GameObjects.Sprite;
  protected failPeeko?: Phaser.GameObjects.Sprite;
  protected successText?: Phaser.GameObjects.Text;
  protected successText2?: Phaser.GameObjects.Text;
  protected failureText?: Phaser.GameObjects.Text;
  protected failureText2?: Phaser.GameObjects.Text;
  protected successBubble?: Phaser.GameObjects.Image;
  protected failBubble?: Phaser.GameObjects.Image;
  protected successTimer?: Phaser.Time.TimerEvent;
  protected failTimer?: Phaser.Time.TimerEvent;

  protected nextButton!: Phaser.GameObjects.Image;
  protected backButton!: Phaser.GameObjects.Image;

  protected resetButton!: Phaser.GameObjects.Image;
  protected dropButton!: Phaser.GameObjects.Image;
  protected downloadButton!: Phaser.GameObjects.Image;
  protected homeButton!: Phaser.GameObjects.Image;
  protected levelSelectButton!: Phaser.GameObjects.Image;

  protected dropButtonPulseTween!: Phaser.Tweens.Tween | null;
  protected dropButtonPulseTimer!: Phaser.Time.TimerEvent | null;


//CONSTRUCTOR
  protected constructor( 
    private levelKey: keyof PLAYER_SCORING_DATA,
    protected levelTitle: string,
    protected levelSubtitles: string[],
    protected prevSceneKey: string,
    protected nextSceneKey: string,
  ) {
    super(levelKey); // Unique key for this scene
    this.triesDataKey = '${this.levelKey}-${TRIES_DATA_KEY}';
    this.scoreDataKey = '${this.levelKey}-${SCORE_DATA_KEY}';
    this.triesDataKey = `${this.levelKey}-${TRIES_DATA_KEY}`;
    this.scoreDataKey = `${this.levelKey}-${SCORE_DATA_KEY}`;
  }

  //abstract methods below needs to be implemented in each level, These are scene-specific methods
  /**
   * Callback for scene-specific actions when the Drop button is triggered
   */
  protected abstract doDrop(): void;
  /**
   * Callback for scene-specific actions when the Reset button is triggered
   */
  protected abstract doReset(): void;
    /**
   * Allows scenes to report their scene-specific scoring data
   */
  protected abstract recordScoreDataForCurrentTry(): T;
  

  // Load the required assets here
  preload(): void {
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-data", "assets/download-data.png");
    this.load.image("delete-data", "assets/delete-data.png");

    // --- Navigation Buttons ---
    this.load.image("start", "assets/power-button.png");
    this.load.image("next", "assets/fast-forward-button.png");
    this.load.image("back", "assets/fast-backward-button.png");
    this.load.image("nextPressed", "assets/fast-forward-button-pressed.png");
    this.load.image("backPressed", "assets/fast-backward-button-pressed.png");
    this.load.image("home", "assets/home-button.png");
    this.load.image("homePressed", "assets/home-button-pressed.png");
    this.load.image("level_select", "assets/level-button.png");
    this.load.image("level_selectPressed", "assets/level-button-pressed.png");
    this.load.html("home_popup", "assets/html_home_popup.html");

    // --- Game Buttons ---
    this.load.image("dropBtn", "assets/drop_btn.png");
    this.load.image("restartBtn", "assets/restart_btn.png");
    this.load.image("flipBtn", "assets/flip_btn.png")

    this.load.image("dropBtnPressed", "assets/drop_btn_pressed.png");
    this.load.image("restartBtnPressed", "assets/restart_btn_pressed.png");
    this.load.image("flipBtnPressed", "assets/flip_btn_pressed.png")

    // --- Background ---
    this.load.image("background", "assets/background.png")
    this.load.image("cloud", "assets/cloud.png")
    this.load.image("cloud2", "assets/cloud2.png")
    this.load.image("textbubble", "assets/textbubble.png")

    // --- Cups ---
    this.load.image("heart_cup", "assets/heartcup.png")
    this.load.image("circle_cup", "assets/circlecup.png")
    this.load.image("dog_cup", "assets/dogcup.png")
    this.load.image("star_cup", "assets/starcup.png")

    this.load.image("heart_cup_top", "assets/heartcup_top.png")
    this.load.image("heart_cup_bottom", "assets/heartcup_bottom.png")

    this.load.image("circle_cup_top", "assets/circlecup_top.png")
    this.load.image("circle_cup_bottom", "assets/circlecup_bottom.png")
    
    this.load.image("dog_cup_top", "assets/dogcup_top.png")
    this.load.image("dog_cup_bottom", "assets/dogcup_bottom.png")

    this.load.image("star_cup_top", "assets/starcup_top.png")
    this.load.image("star_cup_bottom", "assets/starcup_bottom.png")

    // --- Gems ---
    this.load.image("blue_gem", "assets/bluegem.png")
    this.load.image("red_gem,", "assets/redgem.png")
    this.load.image("green_gem", "assets/greengem.png")

    // --- Peeko ---
    this.load.spritesheet("peekoani", "assets/spritesheetPeeko.png", {frameWidth: 500, frameHeight: 500});

    // --- SFX ---
    this.load.audio("cup_sound", "assets/cup_sound.mp3");
    this.load.audio("button_sound", "assets/button_sound.mp3");
    this.load.audio("cloud_sound", "assets/cloud_sound.mp3");
    this.load.audio("gem_sound", "assets/gem_sound.mp3");

    // --- Font ---
    this.load.font('Unbounded', 'assets/Unbounded.ttf', 'truetype');
    
  }

  init() {
    this.scoringData = [];
    this.currentScore = -1;

    this.registry.set(this.triesDataKey, 0);
    this.registry.set(this.scoreDataKey, 0);

    this.events.once("shutdown", () => { // Since players can navigate through scenes without completing them, we only record scores for scenes that have been attempted. use currentScore to check if attempted
      /*
       When the scene is shutdown, by navigating to another scene, we record
       scores for the current scene
       */
      const playerId = this.registry.get(PLAYER_ID_DATA_KEY);
      if (this.currentScore >= 0) { //if attempted, push data for current try
        this.scoringData.push(this.recordScoreDataForCurrentTry());
      }
      storeScoringDataForPlayer(
        playerId,
        this.levelKey,
        this.scoringData as unknown as [], 
      );
      
      this.stopDropButtonPulse();
      if (this.dropButtonPulseTimer) {
        this.dropButtonPulseTimer.remove();
      }

    });
  }


  //Initialising the scene
  create() {
    // Set up objects, UI, physics, etc.

    //Replacing background with Official background image
    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1); 
    
    
    // Render Title banner background
    this.gameArea = this.add.container(gameAreaX, gameAreaY);
    this.renderStaticBackgroundItems();
    this.renderDynamicItems();
    this.renderNavigationButtons();
    this.renderGameButtons();
    this.renderDownloadButton();

    // dropButton pulse animation
    this.setupDropButtonPulse();

    // Confirmation Popup for going back to main menu
    this.confirmPopup = this.add.dom(HALF_WIDTH, HALF_HEIGHT)
      .createFromCache("home_popup")
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false) as Phaser.GameObjects.DOMElement;
  }
    

  private renderStaticBackgroundItems() { // For rendering non-interactive items that do not change throughout the game, like title, instructions, and images
      const { container, subtitleText } = renderTitleWithSubtitle(this, this.levelTitle, this.levelSubtitles[0]);
      this.titleContainer = container;
      this.subtitleText = subtitleText;

      this.bannerGfx = renderBanner(this, { 
        x: 120,
        y: 180, 
        width: gameAreaWidth - 150,
        height: gameAreaHeight + 40, 
      });
      this.bannerGfx.setDepth(-1);
  }

  private renderDynamicItems() { // For rendering numbers that change throughout the game, like score, tries, etc.
    //Tries Counter
    const triesText = this.add.text( 
      QUARTER_WIDTH/2 ,
      QUARTER_HEIGHT + 10,
      `Tries: ${this.registry.get(this.triesDataKey)} `,
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
      },
    );

    
    const triesDataChangeEventKey = `changedata-${this.triesDataKey}`;
    this.registry.events.on(
      triesDataChangeEventKey,
      (_parent: never, newValue: number) => {
        triesText.setText(`Tries: ${newValue} `);
      },
    );
    
    this.events.once("shutdown", () => {
      this.registry.events.off(triesDataChangeEventKey);
    });

    //Score Counter
    const scoreText = this.add.text(
      QUARTER_WIDTH/2,
      QUARTER_HEIGHT + 60,
      `Score: ${this.registry.get(this.scoreDataKey)} `,
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
      },
    );

    const scoreDataChangeEventKey = `changedata-${this.scoreDataKey}`;
    this.registry.events.on(
      scoreDataChangeEventKey,
      (_parent: never, newValue: number) => {
        scoreText.setText(`Score: ${newValue} `);
      },
    );
    this.events.once("shutdown", () => {
      this.registry.events.off(scoreDataChangeEventKey);
    });

  }

  protected async transitionToScene(sceneKey: string, message: string, data: any = {}): Promise<void> {
      // Get the UIScene instance
      const uiScene = this.scene.get("UIScene") as any;
      
      // Play transition animation
      await uiScene.playTransitionAnimation(sceneKey, message);
      
      // Now change the scene
      this.scene.start(sceneKey, data);
  }

  protected async createFailScene() {
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

    this.failPeeko = this.add.sprite(-250, HALF_HEIGHT + 70, "flying").setScale(0.4).setDepth(200);

    this.failPeeko.play("flying");
    this.failPeeko.playAfterRepeat("sad", 3);
    this.failPeeko.chain("sad2");

    this.tweens.add({
        targets: this.failPeeko,
        x: 240,
        duration: 2500,
        ease: 'Sine.easeInOut',
    });


    this.failTimer =this.time.delayedCall(2500, () => {
      //overlays
       this.failureOverlay = renderBanner(this, 
          { backgroundColour: 0xC25C53,
            x: 120,
            y: 180,
            height: gameAreaHeight + 40,
            width: gameAreaWidth -150,
            shadow: false,
            stroke: true,
            strokeWidth: 8,
            strokeColour: 0xC25C53,
            strokeAlpha: 1,
            backgroundAlpha: 0.3,
          }).setDepth(-1); 

      this.failBubble = this.add.image(HALF_WIDTH, HALF_HEIGHT - 50, "textbubble").setScale(0.6).setAlpha(0);

      this.tweens.add({
        targets: this.failBubble,
        y: HALF_HEIGHT - 50,
        duration: 500,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

      //Main fail text
      this.failureText = this.add.text(
        HALF_WIDTH, HALF_HEIGHT - 220,
        "Almost there!", 
        {
            fontFamily: "Unbounded",
            fontSize: "40px",
            color: "#ED6A5A",
            align: "center"
        }
        
      ).setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0);

      this.tweens.add({
        targets: this.failureText,
        y: HALF_HEIGHT - 75,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

      this.failureText2 = this.add.text(
        HALF_WIDTH, HALF_HEIGHT - 170,
        "Try again!",
        {
          fontFamily: "Unbounded",
          fontSize: "28px",
          color: "#5D576B",
          align: "center"
        }
      ) .setOrigin(0.5)
        .setDepth(1)
        .setAlpha(0);

      this.tweens.add({
        targets: this.failureText2,
        y: HALF_HEIGHT - 40,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });
      

    });
  }

  //Creates the green overlay success screen 
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

    this.successPeeko = this.add.sprite(-150, HALF_HEIGHT + 70, "flying").setScale(0.4).setDepth(200);//Make the sprite

    this.tweens.add({
        targets: this.successPeeko,
        x: 240,
        duration: 2000,
        ease: 'Sine.easeInOut',
    });

    this.successPeeko.play("flying").playAfterRepeat("happy", 3); //the flying animation loops 3 times, and then the happy animation plays

  
    this.successTimer = this.time.delayedCall(2500, () => {
      this.successOverlay = renderBanner(this, 
          { backgroundColour: 0x7BD49A,
            x: 120,
            y: 180,
            width: gameAreaWidth - 150,
            height: gameAreaHeight + 40,
            shadow: false,
            stroke: true,
            strokeWidth: 8,
            strokeColour: 0x4EC273,
            strokeAlpha: 1,
            backgroundAlpha: 0.3,
          }).setDepth(-1);
  
    });

    //after peeko flies in, the textbox would should up
    this.successTimer = this.time.delayedCall(2000, () => {
      this.successBubble = this.add.image(HALF_WIDTH, HALF_HEIGHT - 100, "textbubble").setScale(0.6).setAlpha(0);

      this.tweens.add({
        targets: this.successBubble,
        y: HALF_HEIGHT - 50,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

      //Main success text
      this.successText = this.add.text(
          HALF_WIDTH, HALF_HEIGHT - 220,
          "Good job!", 
          {
              fontFamily: "Unbounded",
              fontSize: "40px",
              color: "#539F94",
              align: "center"
          }
          
      ).setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0);

      this.tweens.add({
        targets: this.successText,
        y: HALF_HEIGHT - 75,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

      //Smaller text for success
      this.successText2 = this.add.text(
          HALF_WIDTH, HALF_HEIGHT - 170,
          "You found the gem!", 
          {
              fontFamily: "Unbounded",
              fontSize: "28px",
              color: "#5D576B",
              align: "center"
          }
      ).setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0);

      this.tweens.add({
        targets: this.successText2,
        y: HALF_HEIGHT - 40,
        duration: 600,
        ease: 'Sine.easeInOut',
        alpha: 1,
      });

    });

    //Make a container for success
    // this.successContainer = this.add.container(0, 0, [ successOverlay, textBubble, peekoHappy, successText, successText2]).setVisible(false).setDepth(3); 
  }

  private confirmPopup!: Phaser.GameObjects.DOMElement;

  private renderNavigationButtons() { // For rendering navigation buttons like back, next, etc.
     // --- Back Button ---
    this.backButton = this.add
      .image(HALF_WIDTH - 120, HEIGHT / 4 + 30, "back") //.image or .sprite
      .setOrigin(0.5, 0.5)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true })

    this.backButton.on("pointerdown", async () => {
        AudioManager.I.playSfx(this, "button_sound");
        this.backButton.setTexture("backPressed");

        this.time.delayedCall(150, () => {
          this.backButton.setTexture("back");

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
              AudioManager.I.playSfx(this, "button_sound");
              this.tweens.add({
                targets: this.confirmPopup,
                alpha: 0,
                y: HALF_HEIGHT,
                duration: 500,
                ease: 'Sine.easeIn',
                onComplete: async () => {
                  this.confirmPopup.setVisible(false);
                  this.confirmPopup.setAlpha(1);
                  this.confirmPopup.setY(HALF_HEIGHT);

                  // Go to Main Menu
                  await this.transitionToScene("MainMenu", "Going Home...");
                }
              });
            };

            noBtn.onclick = () => {
              AudioManager.I.playSfx(this, "button_sound");
              this.tweens.add({
                targets: this.confirmPopup,
                alpha: 0,
                y: HALF_HEIGHT,
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
            this.time.delayedCall(400, async () => {
              this.backButton.setTexture("back");
              await this.transitionToScene(this.prevSceneKey, "Going Back..."); // method above renderNavigationButtons()
            });
          }
        });
    });
    
    // --- Next Button --- 
    this.nextButton = this.add
      .image(HALF_WIDTH + 120, HEIGHT / 4 + 30, "next")
      .setOrigin(0.5, 0.5)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true })


    this.nextButton.on("pointerdown", async () => {
      AudioManager.I.playSfx(this, "button_sound");
      this.nextButton.setTexture("nextPressed");

      this.time.delayedCall(150, () => {
        this.nextButton.setTexture("next");

        if (this.nextSceneKey === "GameOver") {
          this.confirmPopup.setVisible(true);
          this.confirmPopup.setAlpha(0);
          this.confirmPopup.setY(HALF_HEIGHT - 20);

          this.tweens.add({
            targets: this.confirmPopup,
            alpha: 1,
            y: HALF_HEIGHT,
            duration: 500,
            ease: "Sine.easeOut",
          });

          const popupEl = this.confirmPopup.getChildByID("confirm-popup");
          const messageE1 = popupEl.querySelector("#popup-message") as HTMLParagraphElement;
          const yesBtn = popupEl.querySelector("#yesBtn") as HTMLButtonElement;
          const noBtn = popupEl.querySelector("#noBtn") as HTMLButtonElement;

          messageE1.textContent = "Are you sure you want to finish the game?";

          yesBtn.onclick = null;
          noBtn.onclick = null;

          yesBtn.onclick = async () => {
            AudioManager.I.playSfx(this, "button_sound");
            this.tweens.add({
              targets: this.confirmPopup,
              alpha: 0,
              y: HALF_HEIGHT - 20,
              duration: 500,
              ease: "Sine.easeIn",
              onComplete: async () => {
                this.confirmPopup.setVisible(false);
                this.confirmPopup.setAlpha(1);
                this.confirmPopup.setY(HALF_HEIGHT);
                // Reset message for future use
                messageE1.textContent = "Are you sure you want to go back to the main menu?";

                await this.transitionToScene("GameOver", "Finishing the Game...");
              },
            });
          };

          noBtn.onclick = () => {
            AudioManager.I.playSfx(this, "button_sound");
            this.tweens.add({
              targets: this.confirmPopup,
              alpha: 0,
              y: HALF_HEIGHT - 20,
              duration: 500,
              ease: "Sine.easeIn",
              onComplete: () => {
                this.confirmPopup.setVisible(false);
                this.confirmPopup.setAlpha(1);
                this.confirmPopup.setY(HALF_HEIGHT);
                // Reset message for future use
                messageE1.textContent = "Are you sure you want to go back to the main menu?";
              },
            });
          };
        }
        else {
          this.time.delayedCall(400, async () => {
            this.nextButton.setTexture("next");
            await this.transitionToScene(this.nextSceneKey, "Loading Next Level...");
          });
        }
      });
    });


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

    this.levelSelectButton = this.add
    .image(HALF_WIDTH + QUARTER_WIDTH + 120, QUARTER_HEIGHT + 40, "level_select")
    .setOrigin(0.5, 0.5)
    .setScale(0.7)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", () => {
      AudioManager.I.playSfx(this, "button_sound");
      // change texture
      this.levelSelectButton.setTexture("level_selectPressed");

      // change back texture
      this.time.delayedCall(400, async () => {
        this.levelSelectButton.setTexture("level_select");
        await this.transitionToScene("LevelSelect", "Level Selector...", { previousScene: this.scene.key })

      });
    });
  }

  
  
  private renderGameButtons(){ //Drop and Reset buttons
    let dropUsed = false;
    // --- Drop Button --- 
    this.dropButton = this.add.image(WIDTH/2, Math.round(HEIGHT * 0.78) + 70, "dropBtn")
      .setOrigin(0.5,0.5)
      .setScale(0.6)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    // Drop Button Action
    this.dropButton.on("pointerdown", () => {
      if (dropUsed) return;

      if (dropUsed == false){ 
        AudioManager.I.playSfx(this, "button_sound");

        // Stop the pulsing animation AND the timer
        this.stopDropButtonPulse();
        if (this.dropButtonPulseTimer) {
          this.dropButtonPulseTimer.remove();
          this.dropButtonPulseTimer = null;
        }

        // change texture
        this.dropButton.setTexture("dropBtnPressed");

        // change back texture and set greyed out
        this.time.delayedCall(400, () => {
          this.dropButton.setTexture("dropBtn");
          this.time.delayedCall(50, () => {
            this.dropButton.setAlpha(0.5);
          });
          
        });
    

        this.registry.inc(this.triesDataKey, 1);
        this.currentScore++; 
        this.doDrop();
        dropUsed = true;
        this.dropButton.disableInteractive();    
        this.subtitleText.setText(this.levelSubtitles[1]);  
      }
    });
    

    // --- Reset Button ---

    this.resetButton = this.add.image(HALF_WIDTH , HEIGHT/4 + 30, "restartBtn")
      .setOrigin(0.5,0.5)
      .setScale(0.6)
      
      .setInteractive({ useHandCursor: true });

    // reset button action
    this.resetButton.on("pointerdown", () => {
      AudioManager.I.playSfx(this, "button_sound");

      // Stop current pulse and restart the timer
      this.stopDropButtonPulse();
      this.startDropButtonPulseTimer();

      // change texture
      this.resetButton.setTexture("restartBtnPressed");

      // change back texture
      this.time.delayedCall(400, () => {
        this.resetButton.setTexture("restartBtn");
      });



      if (this.currentScore >= 0) {
        this.scoringData.push(this.recordScoreDataForCurrentTry());
      }
      this.doReset();
      this.currentScore = -1;
      this.dropButton?.setInteractive();
      this.dropButton.setAlpha(1);
      dropUsed = false;
      this.subtitleText.setText(this.levelSubtitles[0]);

    });
  }
  
  

  private renderDownloadButton(){
    this.downloadButton = this.add 
      .sprite(HALF_WIDTH + QUARTER_WIDTH + 230, HALF_HEIGHT + QUARTER_HEIGHT + 80, "download-data")
      .setDisplaySize(90, 90)
      .setDepth(2)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const jsonStr = JSON.stringify(
          JSON.parse(getScoreDataJSONString()),
          null,
          2,
        );
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "game_data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
  }


  // Drop Button Pulse Animation Methods
  private setupDropButtonPulse() {
    // Start the pulse timer
    this.startDropButtonPulseTimer();
  }

  private startDropButtonPulseTimer() {
    // Clear any existing timer
    if (this.dropButtonPulseTimer) {
      this.dropButtonPulseTimer.remove();
      this.dropButtonPulseTimer = null;
    }
    
    // Create a new timer that starts pulse animation after 2 seconds
    this.dropButtonPulseTimer = this.time.delayedCall(2000, () => {
      this.startDropButtonPulseAnimation();
    });
  }

  private startDropButtonPulseAnimation() {
    // Stop any existing pulse animation
    this.stopDropButtonPulse();
    
    // Create the pulsing animation
    this.dropButtonPulseTween = this.tweens.add({
      targets: this.dropButton,
      scale: 0.65, // Slightly larger scale
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1 // Infinite repeat
    });
  }

  private stopDropButtonPulse() {
    // Stop the tween animation
    if (this.dropButtonPulseTween) {
      this.dropButtonPulseTween.stop();
      this.dropButtonPulseTween = null;
    }
    
    // Reset the button scale to normal
    this.dropButton.setScale(0.6);
  }
}