import { GameObjects } from "phaser";
import { AbstractCupScene } from "./BaseMagicCupsScene.ts";
import { DataCollector } from "../utils/DataCollector.ts";

// Scoring
import {
    downloadScoreDataJSON,
    deleteLocalScore,
    startNewScore,
} from "../utils/Scoring.ts";

export class MainMenu extends AbstractCupScene {
  title: GameObjects.Text;
  playerAge: number | null = null;
  playerLocation: string | null = null;

  constructor() {
    super("MainMenu");
  }

  preload() {
    super.preload();
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-data", "assets/downloadbutton.png");
    this.load.image("delete-data", "assets/deletebutton.png");
    this.load.image("power-button", "assets/playbutton.png");
  }

  create() {
    super.create();
    const nameInput = this.add.dom(0, 0).createFromCache("name_input");
    nameInput.setOrigin(0.5);
    nameInput.setPosition(this.width / 2, this.height / 2 + 90);
    this.title = this.add
      .text(this.width / 2, 200, "Magic cups", {
        fontFamily: "Arial Black",
        fontSize: 75,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .image(this.width / 2, this.height / 2 - 100, "power-button")
      .setScale(0.4)
      .setInteractive()
      .on("pointerdown", () => {
        // Validate playerID for scoring data
        const playerID = (nameInput.getChildByName("input") as HTMLInputElement).value;
        if (playerID?.length >= 6) {
          // Set data in the global registry that can be accessed by all scenes
          this.registry.set("playerID", playerID);
          startNewScore(playerID);
          this.scene.start("Level1");
        } else {
          alert("Please enter an ID that is 6 digits or longer.")
        }
      });

    this.add
      .image(this.width / 2 + 90, this.height - 200, "download-data")
      .setScale(0.25)
      .setInteractive()
      .on("pointerdown", () => {
        // Download Score JSON File
        downloadScoreDataJSON();

        // // download both clicks and mouse trace - file: CSV
        // DataCollector.exportClicksCSV(); // existing clicks export
        // DataCollector.exportMouseCSV(); // new mouse trace export
        DataCollector.exportMousePathImage(); // download PNG
      });

    this.add
      .image(this.width / 2 - 90, this.height - 200, "delete-data")
      .setScale(0.25)
      .setInteractive()
      .on("pointerdown", () => {
        // Delete locally stored data
        if (confirm("Delete all collected data for Magic Cups?")) {
          deleteLocalScore();
          alert("Data cleared.");
        }
      });

    const ageDropdown = this.add.dom(0, 0, "select");
    ageDropdown.setOrigin(0.5);
    ageDropdown.setPosition(760, 750);

    const ageSelect = ageDropdown.node as HTMLSelectElement;
    ["Select Age", "2", "3", "4", "5", "6", "7+"].forEach((age, i) => {
      const option = document.createElement("option");
      option.value = i === 0 ? "" : age;
      option.text = age;
      ageSelect.appendChild(option);
    });
    ageSelect.addEventListener("change", () => {
      this.playerAge =
        ageSelect.value !== "" ? parseInt(ageSelect.value) : null;
      DataCollector.setPlayerInfo(this.playerAge, this.playerLocation);
    });
    const locDropdown = this.add.dom(0, 0, "select");
    locDropdown.setOrigin(0.5);
    locDropdown.setPosition(760, 850);
    ageSelect.style.width = "400px";
    ageSelect.style.height = "75px";
    ageSelect.style.fontSize = "30px";
    ageSelect.style.borderRadius = "10px";
    ageSelect.style.textAlign = "center";
    ageSelect.style.backgroundColor = "#ff9933";
    ageSelect.style.color = "#ffffff";
    ageSelect.style.border = "2px solid #cc6600";

    const locSelect = locDropdown.node as HTMLSelectElement;
    ["Select Location", "School", "Learning Center", "Home", "Other"].forEach(
      (loc, i) => {
        const option = document.createElement("option");
        option.value = i === 0 ? "" : loc;
        option.text = loc;
        locSelect.appendChild(option);
      },
    );
    locSelect.addEventListener("change", () => {
      this.playerLocation = locSelect.value !== "" ? locSelect.value : null;
      DataCollector.setPlayerInfo(this.playerAge, this.playerLocation);
    });
    locSelect.style.width = "400px";
    locSelect.style.height = "75px";
    locSelect.style.fontSize = "30px";
    locSelect.style.borderRadius = "10px";
    locSelect.style.textAlign = "center";
    locSelect.style.backgroundColor = "#ff9933";
    locSelect.style.color = "#ffffff";
    locSelect.style.border = "2px solid #cc6600";
  }
  protected generateCandy(): void {
    throw new Error("Method not implemented.");
  }
  protected generateCups(): void {
    throw new Error("Method not implemented.");
  }
  protected dropCandy(): void {
    throw new Error("Method not implemented.");
  }
}
