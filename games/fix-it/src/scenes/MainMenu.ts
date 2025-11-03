import { Scene, GameObjects } from "phaser";
import {PLAYER_ID_DATA_KEY, WIDTH, HALF_WIDTH, HEIGHT, HALF_HEIGHT, QUARTER_WIDTH, QUARTER_HEIGHT} from "../constants.ts";
import {getScoreDataJSONString, removeScoreData, startNewScore} from "../scoring.ts";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { renderTextBanner, renderBanner} from "../banners.ts";
import { AudioManager } from "../AudioManager"; 

export class MainMenu extends Scene {
  title: GameObjects.Text;
  playerIDText: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.html("drop_down", "assets/html_drop_down.html");

    this.load.image("download-data", "assets/download-data.png");
    this.load.image("delete-data", "assets/delete-data.png");
    this.load.image("start", "assets/play-button.png");

    this.load.html("download_success_popup", "assets/html_download_success_popup.html");
    this.load.html("delete_popup", "assets/html_delete_popup.html");
    this.load.html("success_popup", "assets/html_success_popup.html");
    this.load.html("error_popup", "assets/html_error_popup.html");

    this.load.image("background", "assets/background.png");
    this.load.image("peeko", "assets/peeko.png");
    this.load.image("gift", "assets/gift.png");
    this.load.image("claw", "assets/claw.png");

    this.load.image("toggle_on", "assets/toggle_button_on.png");
    this.load.image("toggle_off", "assets/toggle_button_off.png");

    //load font
    this.load.font('Unbounded', 'assets/Unbounded.ttf', 'truetype');
    this.load.font('Unbounded-Black', 'assets/Unbounded-Black.ttf', 'truetype');
    this.load.audio("game_start", "assets/game_start.mp3");
    this.load.audio("button_press", "assets/button_press.mp3");
    this.load.audio("button_restart", "assets/button_restart.mp3");
  }

  create() {
    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      this.scene.setVisible(false, "UIScene");
      this.scene.pause("UIScene");
    }

    //Replacing background with background image (placeholder code)
    this.add
      .image(0, 0, "background")
      .setScale(1.2)
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height )
      .setDepth(-5); 
    
    //add in claw + gift and peeko
    this.add.image(WIDTH - 300, 250, "peeko").setScale(0.2).setDepth(1).postFX.addShadow(0, 10, 0.003, 1, 0x333333, 30, 1); 
    this.add.image(68, 0, "claw").setScale(0.29).setDepth(1).setOrigin(0,0).postFX.addShadow(0, 10, 0.003, 1, 0x333333, 30, 1); 
    this.add.image(298, 250, "gift").setScale(0.22).setDepth(1).postFX.addShadow(0, 10, 0.003, 1, 0x333333, 30, 1); 

    
    //'Fix It!' Text
    renderBanner(this, 
      { x: HALF_WIDTH - 450,
        y: 34,
        height: 230,
        width: 900,
      });
    
    this.title = this.add
      .text(HALF_WIDTH, 150, "Fix It!", {
        fontFamily: "Unbounded-Black",
        fontSize: 180,
        color: "#ED6A5A",
        align: "center",
      })
      .setOrigin(0.5).setFontStyle('bold');

     this.title.setShadow(0, 4, 'rgba(0, 0, 0, 0.6)', 4, false, true);


    renderBanner(this, 
      { x: HALF_WIDTH - 900,
        y: 312,
        height: 714,
        width: 1800,
      });

    //'Enter your Player ID:' Text
    this.playerIDText = this.add
      .text(HALF_WIDTH - 350, HALF_HEIGHT-130, "Player ID:", {
        fontFamily: "Unbounded",
        fontSize: 64,
        color: "#5D576B",
        align: "center",
      })
      .setOrigin(0.5);

    //'Enter your Age:' Text
    this.playerIDText = this.add
      .text(HALF_WIDTH-350, HALF_HEIGHT, "Your Age:", {
        fontFamily: "Unbounded",
        fontSize: 64,
        color: "#5D576B",

        align: "center",
      })
      .setOrigin(0.5);

    //'Enter your Location:' Text
    this.playerIDText = this.add
      .text(HALF_WIDTH-350, HALF_HEIGHT+130, "Location:", {
        fontFamily: "Unbounded",
        fontSize: 64,
        color: "#5D576B",

        align: "center",
      })
      .setOrigin(0.5);

    //'Coordinates:' Text
    this.playerIDText = this.add
      .text(HALF_WIDTH-420, HALF_HEIGHT+260, "Coordinates:", {
        fontFamily: "Unbounded",
        fontSize: 64,
        color: "#5D576B",

        align: "center",
      })
      .setOrigin(0.5);

    //Player ID Text Input
    const nameInput = this.add.dom(0, 0).createFromCache("name_input");
    nameInput.setOrigin(0.5);
    nameInput.setPosition(HALF_WIDTH + 180, HALF_HEIGHT - 130);
      
    //Player Age Text Input
    const ageInput = this.add.dom(0, 0).createFromCache("name_input");
    ageInput.setOrigin(0.5);
    ageInput.setPosition(HALF_WIDTH+ 180, HALF_HEIGHT);

    //Player Location Dropdown
    const dropdownElement = this.add.dom(0, 0).createFromCache("drop_down") 
    dropdownElement.setOrigin(0.5);
    dropdownElement.setPosition(HALF_WIDTH+180, HALF_HEIGHT + 130);
    
    //Toggle coordinates + block name hover button
    const toggleButton = this.add.sprite(HALF_WIDTH - 52, HALF_HEIGHT + 260, 'toggle_off')
        .setInteractive()
        .setDisplaySize(140, 70)
        .setOrigin(0.5)
        .on("pointerdown", () => {
          AudioManager.I.playSfx(this, "button_press");

          if (!this.registry.has("coordinates_mode") || this.registry.get("coordinates_mode") == false) {
            this.registry.set("coordinates_mode", true)
            toggleButton.setTexture("toggle_on");
          }
          else {
            this.registry.set("coordinates_mode", false)
            toggleButton.setTexture("toggle_off");
          }

        });

        toggleButton.postFX.addShadow(0, 10, 0.002, 1, 0x333333, 30, 1); //shadow effect

    // - - - Delete Data Button - - -
    // Confirm popup (hidden by default)
    const confirmPopup = this.add.dom(HALF_WIDTH, HALF_HEIGHT)
      .createFromCache("delete_popup")
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    // Success popup (hidden by default)
    const successPopup = this.add.dom(HALF_WIDTH, QUARTER_HEIGHT - QUARTER_HEIGHT / 2)
      .createFromCache("success_popup")
      .setOrigin(0.5)
      .setDepth(21) // above confirmPopup
      .setVisible(false);

    const deleteButton = this.add
      .sprite(HALF_WIDTH - 250, HEIGHT - 150, "delete-data")
      .setDisplaySize(130, 130)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => { //hover effects

        deleteButton.setDisplaySize(150, 150);
      })
      .on("pointerout", () => {
        deleteButton.setDisplaySize(130, 130);
      })



      .on("pointerdown", () => { //when pressed
        AudioManager.I.playSfx(this, "button_press");

        this.time.delayedCall(150, () => {

          // Show popup with animation (same as error popup)
          confirmPopup.setVisible(true);
          confirmPopup.setAlpha(0);
          confirmPopup.setY(HALF_HEIGHT - 20); // start slightly above
          
          this.tweens.add({
            targets: confirmPopup,
            alpha: 1,
            y: HALF_HEIGHT,
            duration: 500,
            ease: 'Sine.easeOut'
          });

          // get popup buttons
          const popupEl = confirmPopup.getChildByID("confirm-popup");
          const yesBtn = popupEl.querySelector("#yesBtn") as HTMLButtonElement;
          const noBtn = popupEl.querySelector("#noBtn") as HTMLButtonElement;

          // prevent multiple bindings
          yesBtn.onclick = null;
          noBtn.onclick = null;

          // YES click
          yesBtn.onclick = () => {
            AudioManager.I.playSfx(this, "button_press");
            
            // Animate popup out first
            this.tweens.add({
              targets: confirmPopup,
              alpha: 0,
              y: HALF_HEIGHT - 20,
              duration: 500,
              ease: 'Sine.easeIn',
              onComplete: () => {
                confirmPopup.setVisible(false);
                confirmPopup.setAlpha(1);
                confirmPopup.setY(HALF_HEIGHT);
                
                // Perform delete action
                removeScoreData();

                // Show success popup with animation
                successPopup.setVisible(true);
                successPopup.setAlpha(0);
                const startY = QUARTER_HEIGHT - QUARTER_HEIGHT / 2 - 20; // start slightly above
                const endY = QUARTER_HEIGHT - QUARTER_HEIGHT / 2 + 35;   // final position
                successPopup.setY(startY);

                // Fade in & slide down
                this.tweens.add({
                  targets: successPopup,
                  alpha: 1,
                  y: endY,
                  duration: 500,
                  ease: 'Sine.easeOut',
                  onComplete: () => {
                    // Stay visible for 2s then fade out
                    this.time.delayedCall(2000, () => {
                      this.tweens.add({
                        targets: successPopup,
                        alpha: 0,
                        y: endY - 20, // slide up a little
                        duration: 500,
                        ease: 'Sine.easeIn',
                        onComplete: () => {
                          successPopup.setVisible(false);
                          successPopup.setAlpha(1); // reset for next time
                          successPopup.setY(endY);  // reset Y position
                        }
                      });
                    });
                  }
                });
              }
            });
          };

          // NO click
          noBtn.onclick = () => {
            AudioManager.I.playSfx(this, "button_restart");
            // Animate popup out
            this.tweens.add({
              targets: confirmPopup,
              alpha: 0,
              y: HALF_HEIGHT - 20,
              duration: 500,
              ease: 'Sine.easeIn',
              onComplete: () => {
                confirmPopup.setVisible(false);
                confirmPopup.setAlpha(1);
                confirmPopup.setY(HALF_HEIGHT);
              }
            });
          };
        });
      });
    
      deleteButton.postFX.addShadow(0, 10, 0.004, 1, 0x333333, 30, 1); //shadow effect
    


    // - - - Download Data Button - - -

    // Download 'success' popup (hidden by default)
    const downloadSuccessPopup = this.add.dom(HALF_WIDTH, QUARTER_HEIGHT - QUARTER_HEIGHT / 2)
        .createFromCache("download_success_popup")
        .setOrigin(0.5)
        .setDepth(22) 
        .setVisible(false);
    const DOWNLOAD_POPUP_ORIGINAL_Y = QUARTER_HEIGHT - QUARTER_HEIGHT / 2;

    //Download button
    const downloadButton = this.add
      .sprite(HALF_WIDTH + 250, HEIGHT - 150, "download-data")
      .setDisplaySize(130, 130)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => { // hover effects

        downloadButton.setDisplaySize(150, 150);
      })
      .on("pointerout", () => {
        downloadButton.setDisplaySize(130, 130);
      })
      .on("pointerdown", () => { // when button is pressed
        AudioManager.I.playSfx(this, "button_press");

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

        //Download success popup
        downloadSuccessPopup.setVisible(true);
        downloadSuccessPopup.setAlpha(0);

        const startY = DOWNLOAD_POPUP_ORIGINAL_Y - 20; // slide down from slightly above
        const endY = DOWNLOAD_POPUP_ORIGINAL_Y + 35;   // final position

        downloadSuccessPopup.setY(startY);

        this.tweens.killTweensOf(downloadSuccessPopup); // stop any ongoing tween

        // Fade in & slide down
        this.tweens.add({
            targets: downloadSuccessPopup,
            alpha: 1,
            y: endY,
            duration: 500,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: downloadSuccessPopup,
                        alpha: 0,
                        y: endY - 20, // slide up
                        duration: 500,
                        ease: 'Sine.easeIn',
                        onComplete: () => {
                            downloadSuccessPopup.setVisible(false);
                            downloadSuccessPopup.setAlpha(1);
                            downloadSuccessPopup.setY(endY);
                        }
                    });
                });
            }
        });
      });
      
      downloadButton.postFX.addShadow(0, 10, 0.004, 1, 0x333333, 30, 1); //shadow effect



      // - - - Start Button - - -

      //Start Button
      const startButton = this.add
        .sprite(HALF_WIDTH, HEIGHT - 150, "start")
        .setDisplaySize(130, 130)
        .setInteractive({ useHandCursor: true });

      // ERROR POPUP (hidden by default)
      const errorPopup = this.add.dom(HALF_WIDTH, HALF_HEIGHT)
        .createFromCache("error_popup")
        .setOrigin(0.5)
        .setDepth(25) 
        .setVisible(false);


      //Start Button Pressed
      startButton.on("pointerdown", () => {
      const playerId = (nameInput.getChildByName("input") as HTMLInputElement).value;
      const playerAge = (ageInput.getChildByName("input") as HTMLInputElement).value;
      const playerLocation = (dropdownElement.getChildByID('dropDown') as HTMLSelectElement).value;

      let errorMessage = "";

      if (playerId?.length < 6) { 
        errorMessage = "Please enter a Player ID with at least 6 characters.";

      } else if (!playerAge || playerAge.trim() === "") {
        errorMessage = "Please enter your age.";
      } else if (Number(playerAge) > 100) {
        errorMessage = "Please enter an age less than 100"

      } else if (playerLocation === "Select") {
          errorMessage = "Please select a location.";
      }


      if (errorMessage) {
          // Show error popup
          AudioManager.I.playSfx(this, "button_restart");
          const popupEl = errorPopup.getChildByID("error-popup");
          const messageEl = popupEl.querySelector("#errorMessage") as HTMLElement;
          const closeBtn = popupEl.querySelector("#closeBtn") as HTMLButtonElement;
          
          messageEl.textContent = errorMessage;
          
          // Show popup with animation
          errorPopup.setVisible(true);
          errorPopup.setAlpha(0);
          errorPopup.setY(HALF_HEIGHT - 20); // start slightly above
          
          this.tweens.add({
            targets: errorPopup,
            alpha: 1,
            y: HALF_HEIGHT,
            duration: 500,
            ease: 'Sine.easeOut'
          });

          // Close button handler
          closeBtn.onclick = () => {
            AudioManager.I.playSfx(this, "button_press");
            this.tweens.add({
              targets: errorPopup,
              alpha: 0,
              y: HALF_HEIGHT - 20,
              duration: 500,
              ease: 'Sine.easeIn',
              onComplete: () => {
                errorPopup.setVisible(false);
                errorPopup.setAlpha(1); // reset for next time
                errorPopup.setY(HALF_HEIGHT); // reset position
              }
            });
          };
        }

       else {
        this.registry.set(PLAYER_ID_DATA_KEY, playerId); 
        this.registry.set("giftsSaved", 0);
        startNewScore(playerId, playerAge, playerLocation);
        AudioManager.I.playSfx(this, "game_start");

        for (let i = 1; i <= 6; i++) {
          this.registry.set(`levelCleared_${i}`, false);
        }
        if (uiScene) {
        this.scene.setVisible(false, "UIScene");
        this.scene.start("UIScene");
      }

        this.scene.start("Level1Drop");
      }

    })
    
    .postFX.addShadow(0, 10, 0.004, 1, 0x333333, 30, 1); //shadow effect

    //hover effects
    startButton.on("pointerover", () => {

      startButton.setDisplaySize(150, 150);
    });
    startButton.on("pointerout", () => {
      startButton.setDisplaySize(130, 130);
    });

}
}

