import { Scene, GameObjects } from "phaser";
import { getScoreDataJSONString, removeScoreData, startNewScore } from "../scoring.ts";
import { PLAYER_ID_DATA_KEY, HEIGHT, QUARTER_HEIGHT, HALF_WIDTH, HALF_HEIGHT, QUARTER_WIDTH } from "../constants.ts";

import { renderBanner} from "../banners.ts";

import { AudioManager } from "../AudioManager"; 
// Add scoring data later by extending to MagicCupsScene<Level0ScoringData>
export class MainMenu extends Scene {
  playText: GameObjects.Text;
  title: GameObjects.DOMElement;
  playerIDText: GameObjects.Text;
  ageText: GameObjects.Text;
  locationText: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("input_box", "assets/html_text_input.html");
    this.load.html("drop_down", "assets/html_drop_down.html");
    this.load.html("delete_popup", "assets/html_delete_popup.html");
    this.load.html("success_popup", "assets/html_success_popup.html");
    this.load.html("download_success_popup", "assets/html_download_success_popup.html");
    this.load.html("error_popup", "assets/html_error_popup.html");

    this.load.image("download-data", "assets/download-data.png");
    this.load.image("download-data-pressed", "assets/download-data-pressed.png");

    this.load.image("delete-data", "assets/delete-data.png");
    this.load.image("delete-data-pressed", "assets/delete-data-pressed.png");

    this.load.image("start", "assets/play-button.png");
    this.load.image("start-pressed", "assets/play-button-pressed.png");

    this.load.image("background", "assets/background.png");

    this.load.image("cloud", "assets/cloud.png");
    this.load.image("titleCloud", "assets/title_cloud.png");
    
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
    // Background
    this.add.image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height);

    renderBanner(this, {
      x: 70,
      y: 215,
      width: 1000,
      height: 500,
      backgroundColour: 0xFFF1CE,
      shadow: true,
      stroke: true,
      strokeColour: 0x000000,
      strokeWidth: 5,
      radius: 24,
    });

    if (this.scene.isActive("UIScene")) {
        this.scene.bringToTop("UIScene");
    } else {
        // Only launch if it's not already active
        this.scene.launch("UIScene");
        this.scene.bringToTop("UIScene");
    }

    // --- Text elements ---
   
    //'Magic Cups!' Text
    // Creating the element
    // wrapper the scene will move
    const wrapper = document.createElement('div');

    // the animated title inside
    const el = document.createElement('div');
    el.className = 'gradient-text';
  

    // Applying inline styles that you'd normally put in css
    el.style.fontSize = '150px';
    el.style.fontWeight = '700';
    el.style.textTransform = 'uppercase';

    // To do the floating animation per character
    const text = 'MAGIC CUPS';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.setProperty('--i', String(i));
      el.appendChild(span);
    });

    wrapper.appendChild(el);

    //Phaser positions the wrapper
    // Adding it to the scene as a DOM element
    this.title = this.add.dom(
      HALF_WIDTH + 20,
      QUARTER_HEIGHT - 70,
      wrapper
    ).setOrigin(0.5, 0.5);

    // Keeps the position on resize
    const update = () => {
      this.title.setPosition(HALF_WIDTH + 20, QUARTER_HEIGHT - 70);
    }

    update();
    this.scale.on('resize', update);

    // Removes the title once the scene ends
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', update);
      this.title.removeElement();
    });
  

    // 'Player ID:' Text
    document.fonts.ready.then(() => {
      this.playerIDText = this.add
      .text(HALF_WIDTH - 180, HALF_HEIGHT - 85, "Player ID:", {
        fontFamily: '"Body", sans-serif',
        fontSize: "50px",
        color: "#0D3B66",
        align: "center",
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: "#b1b1b1ff",
          blur: 1,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5).setDepth(3);  
    });
    
      
    // 'Your age' Text
    document.fonts.ready.then(() => {
      this.ageText = this.add
        .text(HALF_WIDTH - 180, HALF_HEIGHT + 30, "Your age:", {
          fontFamily: '"Body", sans-serif',
          fontSize: "50px",
          color: "#0D3B66",
          align: "center",
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: "#b1b1b1ff",
            blur: 1,
            stroke: true,
            fill: true,
          },
        })
        .setOrigin(0.5).setDepth(3);  
      });

    // 'Location' Text
    document.fonts.ready.then(() => {
      this.locationText = this.add
        .text(HALF_WIDTH - 180, HALF_HEIGHT+140, "Location:", {
          fontFamily: '"Body", sans-serif',
          fontSize: "50px",
          color: "#0D3B66",
          align: "center",
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: "#b1b1b1ff",
            blur: 1,
            stroke: true,
            fill: true,
          },
        })
        .setOrigin(0.5).setDepth(3);  
    });
    
    // Cloud for title (keep a ref)
    const cloud = this.add.image(
      HALF_WIDTH,
      HALF_HEIGHT - QUARTER_HEIGHT - 60,
      'titleCloud'
    ).setOrigin(0.5).setScale(0.32).setDepth(4);

    // Vertical bob
    this.tweens.add({
      targets: cloud,
      x: cloud.x + 3,
      y: cloud.y - 10,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

 
    //Input fields
    const nameInput = this.add.dom(0, 0).createFromCache("input_box");
    nameInput.setOrigin(0.5);
    nameInput.setPosition(HALF_WIDTH + 150, QUARTER_HEIGHT + 110);

    const ageInput = this.add.dom(0, 0).createFromCache("input_box");
    ageInput.setOrigin(0.5);
    ageInput.setPosition(HALF_WIDTH + 150, HALF_HEIGHT + QUARTER_HEIGHT-160);

    // Make age input only accept numbers and only up to 99
    const ageEl = ageInput.getChildByName("input") as HTMLInputElement;
    if (ageEl) {
      ageEl.setAttribute("inputmode", "numeric"); // mobile numeric keyboard
      ageEl.setAttribute("maxlength", "2");       // 0–99 is 1–2 digits
      ageEl.addEventListener("keydown", (e: KeyboardEvent) => {
        const allow = ["Backspace","ArrowLeft","ArrowRight","Delete","Tab","Home","End"];
        if (allow.includes(e.key)) return;
        if (!/^[0-9]$/.test(e.key)) e.preventDefault();
      });
      ageEl.addEventListener("input", () => {
        ageEl.value = ageEl.value.replace(/\D/g, "");
        if (ageEl.value !== "" && Number(ageEl.value) > 99) {
          ageEl.value = "99";
        }
      });
    }

    const dropdownElement = this.add.dom(0, 0).createFromCache("drop_down")
    dropdownElement.setOrigin(0.5);
    dropdownElement.setPosition(HALF_WIDTH + 150, HALF_HEIGHT + QUARTER_HEIGHT - 50);



    // --- Buttons ---
    
    // --- DELETE BUTTON & POPUP ---

    // create the popup but keep it hidden
    const confirmPopup = this.add.dom(HALF_WIDTH, HALF_HEIGHT)
      .createFromCache("delete_popup")
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    // SUCCESS POPUP (hidden by default)
    const successPopup = this.add.dom(HALF_WIDTH, QUARTER_HEIGHT - QUARTER_HEIGHT / 2)
      .createFromCache("success_popup")
      .setOrigin(0.5)
      .setDepth(21) // above confirmPopup
      .setVisible(false);

    // DELETE BUTTON
    const deleteButton = this.add
      .sprite(HALF_WIDTH - 150, HALF_HEIGHT + QUARTER_HEIGHT + 75, "delete-data")
      .setScale(0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(3)
      .on("pointerdown", () => {
        AudioManager.I.playSfx(this, "button_sound");
        deleteButton.setTexture("delete-data-pressed");

        this.time.delayedCall(150, () => {
          deleteButton.setTexture("delete-data");

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
          const popupEl = confirmPopup.getChildByID("confirm-popup") as HTMLElement;
          const yesBtn = popupEl.querySelector("#yesBtn") as HTMLButtonElement;
          const noBtn = popupEl.querySelector("#noBtn") as HTMLButtonElement;

          // prevent multiple bindings
          yesBtn.onclick = null;
          noBtn.onclick = null;

          // YES click
          yesBtn.onclick = () => {
            AudioManager.I.playSfx(this, "button_sound");
            
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
            AudioManager.I.playSfx(this, "button_sound");
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

    



    // --- DOWNLOAD BUTTON & POPUP ---
    const DOWNLOAD_POPUP_ORIGINAL_X = HALF_WIDTH;
    const DOWNLOAD_POPUP_ORIGINAL_Y = QUARTER_HEIGHT - QUARTER_HEIGHT / 2;

    // Download success popup (hidden by default)
    const downloadSuccessPopup = this.add.dom(HALF_WIDTH, QUARTER_HEIGHT - QUARTER_HEIGHT / 2)
        .createFromCache("download_success_popup")
        .setOrigin(0.5)
        .setDepth(22) // above other popups
        .setVisible(false);

    //download button
    const downloadButton = this.add 
      .sprite(HALF_WIDTH + 150,  HALF_HEIGHT + QUARTER_HEIGHT + 75, "download-data")
      .setScale(0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(3)
      .on("pointerdown", () => {

        AudioManager.I.playSfx(this, "button_sound");

        // change texture
        downloadButton.setTexture("download-data-pressed");

        // change back texture
        this.time.delayedCall(400, () => {
          downloadButton.setTexture("download-data");

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



        // inside downloadButton click, after download completes
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
      

    //start button
    const startButton = this.add
      .sprite(HALF_WIDTH, HALF_HEIGHT + QUARTER_HEIGHT + 75, "start")
      .setScale(0.9)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });

    // ERROR POPUP (hidden by default)
    const errorPopup = this.add.dom(HALF_WIDTH, HALF_HEIGHT)
      .createFromCache("error_popup")
      .setOrigin(0.5)
      .setDepth(25) // highest depth to appear above everything
      .setVisible(false);
      
    //start button action
    startButton.on("pointerdown", () => {
      AudioManager.I.playSfx(this, "button_sound");

      // change texture
      startButton.setTexture("start-pressed");

      // change back texture
      this.time.delayedCall(400, async () => {
        startButton.setTexture("start");

        const playerId = (nameInput.getChildByName("input") as HTMLInputElement).value;
        const playerAge = (ageInput.getChildByName("input") as HTMLInputElement).value;
        const playerLocation = (dropdownElement.getChildByID('dropDown') as HTMLSelectElement).value;
        
        let errorMessage = "";
        
        if (playerId?.length < 6) {
          errorMessage = "Please enter a Player ID with at least 6 characters.";
        } else if (!playerAge || playerAge.trim() === "") {
          errorMessage = "Please enter your age.";
        } else if (playerLocation === "Select") {
          errorMessage = "Please select a location.";
        }

        if (errorMessage) {
          // Show error popup
          const popupEl = errorPopup.getChildByID("error-popup") as HTMLElement;
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
            AudioManager.I.playSfx(this, "button_sound");
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
        } else {
          // All validations passed - start the game
          this.registry.set(PLAYER_ID_DATA_KEY, playerId);
          startNewScore(playerId, playerAge, playerLocation);
          await this.transitionToScene("Level0", "Loading Next Level...");
        }
      });
    });
    
    //hover effects
    startButton.on("pointerover", () => {
      startButton.setScale(1);
    });
    startButton.on("pointerout", () => {
      startButton.setScale(0.9);
    });

    deleteButton.on("pointerover", () => {
      deleteButton.setScale(1);
    });
    deleteButton.on("pointerout", () => {
      deleteButton.setScale(0.9);
    });

    downloadButton.on("pointerover", () => {
      downloadButton.setScale(1);
    });
    downloadButton.on("pointerout", () => {
      downloadButton.setScale(0.9);
    });

  }



}
