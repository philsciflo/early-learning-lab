import { Scene, GameObjects } from "phaser";

import {
  WIDTH,
  HEIGHT,
  HALF_WIDTH,
  PLAYER_ID_DATA_KEY,
  SKY_COLOUR,
  GROUND_COLOUR,
  GROUND_Y,
} from "../constants.ts";
import {
  getScoreDataJSONString,
  getScoreDataCSVString,
  removeScoreData,
  startNewScore,
} from "../scoring.ts";
import { createButton } from "../ui.ts";

const LABEL_X = HALF_WIDTH - 260;
const FIELD_X = HALF_WIDTH - 110;
const ROW_1_Y = 230;
const ROW_2_Y = 300;
const ROW_3_Y = 370;
const ERROR_Y = 450;
const START_BUTTON_Y = 548;

// Three facilitator data buttons in a row, centered as a group.
const DATA_BUTTON_WIDTH = 200;
const DATA_BUTTON_GAP = 20;
const DATA_BUTTONS_Y = 638;
const DATA_FEEDBACK_Y = DATA_BUTTONS_Y + 40;
const DATA_BUTTON_1_X = HALF_WIDTH - DATA_BUTTON_WIDTH - DATA_BUTTON_GAP;
const DATA_BUTTON_2_X = HALF_WIDTH;
const DATA_BUTTON_3_X = HALF_WIDTH + DATA_BUTTON_WIDTH + DATA_BUTTON_GAP;

const LABEL_STYLE = {
  fontFamily: "Arial Black",
  fontSize: 24,
  color: "#2b2a6b",
};

// Semi-transparent card behind the Player ID / Age / Location rows, so
// the form reads as one grouped panel instead of loose floating text -
// purely decorative, sized with margin around LABEL_X/FIELD_X/ROW_*_Y
// above, well clear of the Start button and ERROR_Y below it.
const FORM_PANEL_X = HALF_WIDTH - 320;
const FORM_PANEL_Y = 180;
const FORM_PANEL_WIDTH = 640;
const FORM_PANEL_HEIGHT = 250;

/** A soft, cheap cloud - a cluster of overlapping circles, no asset
 * files - used to decorate MainMenu's sky so it doesn't read as flat
 * next to the levels, which all paint a full sky/ground/tree scene. */
function drawCloud(scene: Scene, x: number, y: number, scale: number) {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(x, y, 26 * scale);
  g.fillCircle(x + 28 * scale, y + 6 * scale, 20 * scale);
  g.fillCircle(x - 28 * scale, y + 6 * scale, 20 * scale);
  g.fillCircle(x + 10 * scale, y - 14 * scale, 18 * scale);
  g.fillCircle(x - 12 * scale, y - 12 * scale, 16 * scale);
}

/** Matches the example in the spec: "hidden-bag-data-2026-10-19T0310Z" -
 * timestamped so repeated exports during a session don't overwrite
 * each other. */
function timestampedFilename(extension: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}Z`;
  return `hidden-bag-data-${stamp}.${extension}`;
}

function downloadBlob(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
    // Decorative backdrop only - painted first so it sits behind every
    // other element below (title, labels, inputs, buttons), none of
    // which are touched here.
    this.add.rectangle(0, 0, WIDTH, GROUND_Y, SKY_COLOUR).setOrigin(0, 0);
    this.add
      .rectangle(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, GROUND_COLOUR)
      .setOrigin(0, 0);
    drawCloud(this, 150, 90, 1);
    drawCloud(this, 1010, 95, 0.85);
    drawCloud(this, 1000, 480, 0.6);

    this.add
      .graphics()
      .fillStyle(0xffffff, 0.55)
      .fillRoundedRect(
        FORM_PANEL_X,
        FORM_PANEL_Y,
        FORM_PANEL_WIDTH,
        FORM_PANEL_HEIGHT,
        24,
      );

    this.add
      .text(WIDTH / 2, 60, "Titiro", {
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
    this.add
      .text(LABEL_X, ROW_1_Y, "Player ID:", LABEL_STYLE)
      .setOrigin(0, 0.5);
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
      const allowed = [
        "Backspace",
        "ArrowLeft",
        "ArrowRight",
        "Delete",
        "Tab",
        "Home",
        "End",
      ];
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
    const startButton = createButton(this, WIDTH / 2, START_BUTTON_Y, "Start", {
      variant: "primary",
      minWidth: 240,
    });

    startButton.hitArea.on("pointerdown", () => {
      const playerId = (
        idInput.getChildByName("input") as HTMLInputElement
      ).value.trim();
      const playerAge = ageEl.value.trim();
      const playerLocation = (
        locationDropdown.getChildByID("dropDown") as HTMLSelectElement
      ).value;

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
    this.createDownloadJsonButton();
    this.createDownloadCsvButton();
    this.createDeleteButton();
  }

  private createDownloadJsonButton() {
    const button = createButton(
      this,
      DATA_BUTTON_1_X,
      DATA_BUTTONS_Y,
      "Download Data",
      {
        variant: "secondary",
        height: 56,
        minWidth: DATA_BUTTON_WIDTH,
      },
    );

    const feedback = this.add
      .text(DATA_BUTTON_1_X, DATA_FEEDBACK_Y, "", {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#2e7d32",
      })
      .setOrigin(0.5);

    button.hitArea.on("pointerdown", () => {
      const jsonStr = JSON.stringify(
        JSON.parse(getScoreDataJSONString()),
        null,
        2,
      );
      downloadBlob(timestampedFilename("json"), jsonStr, "application/json");

      feedback.setText("Downloaded!");
      this.time.delayedCall(2000, () => feedback.setText(""));
    });
  }

  private createDownloadCsvButton() {
    const button = createButton(
      this,
      DATA_BUTTON_2_X,
      DATA_BUTTONS_Y,
      "Download CSV",
      {
        variant: "secondary",
        height: 56,
        minWidth: DATA_BUTTON_WIDTH,
      },
    );

    const feedback = this.add
      .text(DATA_BUTTON_2_X, DATA_FEEDBACK_Y, "", {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#2e7d32",
      })
      .setOrigin(0.5);

    button.hitArea.on("pointerdown", () => {
      downloadBlob(
        timestampedFilename("csv"),
        getScoreDataCSVString(),
        "text/csv",
      );

      feedback.setText("Downloaded!");
      this.time.delayedCall(2000, () => feedback.setText(""));
    });
  }

  private createDeleteButton() {
    let confirming = false;
    let confirmTimer: Phaser.Time.TimerEvent | null = null;

    const button = createButton(
      this,
      DATA_BUTTON_3_X,
      DATA_BUTTONS_Y,
      "Delete Data",
      {
        variant: "danger",
        height: 56,
        minWidth: DATA_BUTTON_WIDTH,
      },
    );

    const feedback = this.add
      .text(DATA_BUTTON_3_X, DATA_FEEDBACK_Y, "", {
        fontFamily: "Arial",
        fontSize: 14,
        color: "#c0392b",
      })
      .setOrigin(0.5);

    button.hitArea.on("pointerdown", () => {
      if (!confirming) {
        confirming = true;
        // Short enough to fit the button's fixed width, unlike
        // "Click again to confirm" - see createButton's setLabel note.
        button.setLabel("Confirm?");
        confirmTimer = this.time.delayedCall(3000, () => {
          confirming = false;
          button.setLabel("Delete Data");
        });
        return;
      }

      confirmTimer?.remove();
      confirming = false;
      button.setLabel("Delete Data");

      removeScoreData();
      feedback.setText("All data deleted.");
      this.time.delayedCall(2000, () => feedback.setText(""));
    });
  }
}
