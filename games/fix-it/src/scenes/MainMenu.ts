import { Scene, GameObjects } from "phaser";
import { DataCollector } from "../utils/DataCollector.ts";
import { addButtonTweens } from "../utils/buttonTweens";
export class MainMenu extends Scene {
  title!: GameObjects.Text;
  startButton!: GameObjects.Image;
  settingsButton!: GameObjects.Image;
  nameButton!: GameObjects.Text;
  downloadButton!: GameObjects.Image;
  deleteButton!: GameObjects.Image;
  playername = "";
  playerAge: number | null = null;
  playerLocation: string | null = null;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-data", "assets/download-data.png");
    this.load.image("delete-data", "assets/deletebutton.png");
    this.load.image("start", "assets/power-button.png");
    this.load.audio("button-press", "assets/button-press.mp3");
  }

  create() {
    const { width, height } = this.scale;

    // Title
    this.title = this.add
      .text(width / 2, 100, "Fix-it", {
        fontFamily: "Arial Black",
        fontSize: "64px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    // Start button
    this.startButton = this.add
      .image(width / 2, height / 2 - 100, "start")
      .setScale(0.4)
      .setInteractive();
    addButtonTweens(
      this,
      this.startButton,
      () => {
        this.scene.start("LevelSelect");
      },
      "button-press",
    );

    // Name input button
    const nameInput = this.add.dom(0, 0).createFromCache("name_input");
    nameInput.setOrigin(0.5);
    nameInput.setPosition(width / 2, height / 2 + 90);
    const inputElement = nameInput.node.querySelector(
      "input",
    ) as HTMLInputElement;
    inputElement.addEventListener("input", () => {
      this.playername = inputElement.value;
    });
    inputElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        inputElement.blur();
      }
    });

    //dataCollector dropdowns
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

    if (this.playerAge !== null) {
      ageSelect.value = this.playerAge.toString();
    }

    if (this.playerLocation !== null) {
      locSelect.value = this.playerLocation;
    }

    // Download data button
    this.downloadButton = this.add
      .image(width / 2 - 90, height - 200, "download-data")
      .setScale(0.25)
      .setInteractive({ useHandCursor: true });
    addButtonTweens(
      this,
      this.downloadButton,
      () => {
        DataCollector.exportCSV();
        DataCollector.exportMousePathImage();
      },
      "button-press",
    );

    // Delete data button
    this.deleteButton = this.add
      .image(width / 2 + 90, height - 200, "delete-data")
      .setScale(0.25)
      .setInteractive({ useHandCursor: true });

    addButtonTweens(
      this,
      this.deleteButton,
      () => {
        if (confirm("Delete all collected data for Fix-It?")) {
          DataCollector.clearAllData();
          alert("Data cleared.");
        }
      },
      "button-press",
    );
  }
}
