import { Scene, GameObjects } from "phaser";

import { WIDTH, HALF_WIDTH, PLAYER_ID_DATA_KEY } from "../constants.ts";
import { getScoreDataJSONString, removeScoreData, startNewScore } from "../scoring.ts";

const LABEL_X = HALF_WIDTH - 260;
const FIELD_X = HALF_WIDTH - 110;
const ROW_1_Y = 230;
const ROW_2_Y = 300;
const ROW_3_Y = 370;
const ERROR_Y = 450;
const START_BUTTON_Y = 520;
const DATA_BUTTONS_Y = 600;

const LABEL_STYLE = {
  fontFamily: "Arial Black",
  fontSize: 24,
  color: "#2b2a6b",
};

export class MainMenu extends Scene {
  private errorText: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("input_box", "assets/html_text_input.html");
    this.load.html("drop_down", "assets/html_drop_down.html");
  }

  create() {
    this.add
      .text(WIDTH / 2, 60, "Hidden Bag", {
        fontFamily: "Arial Black",
        fontSize: 48,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, 120, "Research login", {
        fontFamily: "Arial",
        fontSize: 22,
        color: "#4a4a6a",
        align: "center",
      })
      .setOrigin(0.5);

    // --- Participant info form ---
    this.add.text(LABEL_X, ROW_1_Y, "Player ID:", LABEL_STYLE).setOrigin(0, 0.5);
    const idInput = this.add.dom(0, 0).createFromCache("input_box");
    idInput.setOrigin(0, 0.5);
    idInput.setPosition(FIELD_X, ROW_1_Y);

    this.add.text(LABEL_X, ROW_2_Y, "Age:", LABEL_STYLE).setOrigin(0, 0.5);
    const ageInput = this.add.dom(0, 0).createFromCache("input_box");
    ageInput.setOrigin(0, 0.5);
    ageInput.setPosition(FIELD_X, ROW_2_Y);

    // Numbers only, capped at 99 - same rule as the other games.
    const ageEl = ageInput.getChildByName("input") as HTMLInputElement;
    ageEl.removeAttribute("minlength");
    ageEl.setAttribute("placeholder", "Age");
    ageEl.setAttribute("inputmode", "numeric");
    ageEl.setAttribute("maxlength", "2");
    ageEl.addEventListener("keydown", (e: KeyboardEvent) => {
      const allowed = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab", "Home", "End"];
      if (allowed.includes(e.key)) return;
      if (!/^[0-9]$/.test(e.key)) e.preventDefault();
    });
    ageEl.addEventListener("input", () => {
      ageEl.value = ageEl.value.replace(/\D/g, "");
      if (ageEl.value !== "" && Number(ageEl.value) > 99) {
        ageEl.value = "99";
      }
    });

    this.add.text(LABEL_X, ROW_3_Y, "Location:", LABEL_STYLE).setOrigin(0, 0.5);
    const locationDropdown = this.add.dom(0, 0).createFromCache("drop_down");
    locationDropdown.setOrigin(0, 0.5);
    locationDropdown.setPosition(FIELD_X, ROW_3_Y);

    this.errorText = this.add
      .text(WIDTH / 2, ERROR_Y, "", {
        fontFamily: "Arial",
        fontSize: 18,
        color: "#c0392b",
        align: "center",
      })
      .setOrigin(0.5);

    // --- Start button ---
    const startButton = this.add
      .text(WIDTH / 2, START_BUTTON_Y, "Start", {
        fontFamily: "Arial Black",
        fontSize: 28,
        color: "#ffffff",
        backgroundColor: "#2b2a6b",
        padding: { x: 36, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerdown", () => {
      const playerId = (idInput.getChildByName("input") as HTMLInputElement).value.trim();
      const playerAge = ageEl.value.trim();
      const playerLocation = (locationDropdown.getChildByID("dropDown") as HTMLSelectElement).value;

      let error = "";
      if (playerId.length < 6) {
        error = "Please enter a Player ID with at least 6 characters.";
      } else if (playerAge === "") {
        error = "Please enter the child's age.";
      } else if (playerLocation === "Select") {
        error = "Please select a location.";
      }

      if (error) {
        this.errorText.setText(error);
        return;
      }

      this.errorText.setText("");
      this.registry.set(PLAYER_ID_DATA_KEY, playerId);
      startNewScore(playerId, playerAge, playerLocation);
      this.scene.start("Level0");
    });

    // --- Data management (facilitator controls, same data format as
    // the other games - see scoring.ts) ---
    this.createDownloadButton();
    this.createDeleteButton();
  }

  private createDownloadButton() {
    const button = this.add
      .text(WIDTH / 2 - 10, DATA_BUTTONS_Y, "Download Data", {
        fontFamily: "Arial",
        fontSize: 18,
        color: "#2b2a6b",
        backgroundColor: "#f2f4fa",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    const feedback = this.add
      .text(WIDTH / 2 - 10, DATA_BUTTONS_Y + 36, "", {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#2e7d32",
      })
      .setOrigin(1, 0.5);

    button.on("pointerdown", () => {
      const jsonStr = JSON.stringify(JSON.parse(getScoreDataJSONString()), null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "hidden-bag-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      feedback.setText("Downloaded!");
      this.time.delayedCall(2000, () => feedback.setText(""));
    });
  }

  private createDeleteButton() {
    let confirming = false;
    let confirmTimer: Phaser.Time.TimerEvent | null = null;

    const button = this.add
      .text(WIDTH / 2 + 10, DATA_BUTTONS_Y, "Delete Data", {
        fontFamily: "Arial",
        fontSize: 18,
        color: "#c0392b",
        backgroundColor: "#f2f4fa",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    const feedback = this.add
      .text(WIDTH / 2 + 10, DATA_BUTTONS_Y + 36, "", {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#c0392b",
      })
      .setOrigin(0, 0.5);

    button.on("pointerdown", () => {
      if (!confirming) {
        confirming = true;
        button.setText("Click again to confirm");
        confirmTimer = this.time.delayedCall(3000, () => {
          confirming = false;
          button.setText("Delete Data");
        });
        return;
      }

      confirmTimer?.remove();
      confirming = false;
      button.setText("Delete Data");

      removeScoreData();
      feedback.setText("All data deleted.");
      this.time.delayedCall(2000, () => feedback.setText(""));
    });
  }
}
