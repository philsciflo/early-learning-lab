import { Scene } from "phaser";
import {
  HALF_WIDTH,
  HEIGHT,
  HALF_HEIGHT,
} from "../constants";
import { AudioManager } from "../AudioManager";

type PlayerData = {
  playerId: string;
  age: string;
  location: string;
};

type PlayerRecord = PlayerData & {
  submittedAt: string;
};

type TurnRecord = {
  turn: number;
  clicked_by: "Player" | "NPC" | "player" | "npc";
  player_clicked: string;
  coin: string;
  player_thinking_time?: number | null;
};

type GameRecord = {
  Location: string;
  Difficulty_As_Percentage: string;
  Total_Number_of_Coins: number;
  Number_of_Columns: number;
  Number_of_Rows: number;
  Turns: TurnRecord[];
  Total_Trash: number;
  Coin_Trash_Ratio: number;
  Coins_Found_by_Player: number;
  Coins_Found_by_NPC: number;
  Coins_Player_Shared_to_Self: number;
  Coins_Player_Shared_to_NPC: number;
  Time_Spent_Memorising: string;
  Recorded_At: string;
};

type LevelResultRecord = {
  playerId: string;
  age: string;
  games: GameRecord[];
};

// This is the Home Page Scene
export class MainMenu extends Scene {
  private readonly PLAYER_DATA_KEY = "playerData";
  private readonly PLAYER_HISTORY_KEY = "playerDataHistory";
  private readonly LEVEL_RESULTS_KEY = "levelResultsHistory";

  private idInput?: Phaser.GameObjects.DOMElement;
  private ageInput?: Phaser.GameObjects.DOMElement;
  private locationDropdown?: Phaser.GameObjects.DOMElement;
  private historyOverlayContainer?: Phaser.GameObjects.Container;

  private isPaused = false;

  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.image("background", "assets/menu_background.png");
    this.load.html("number_input", "assets/html_int_input.html");
    this.load.html("text_input", "assets/html_text_input.html");
    this.load.html("dropdown", "assets/html_dropdown.html");
    this.load.audio("click_sound", "assets/audio/click_sound.mp3");
    this.load.audio("bgm", "assets/audio/pirate_bgm.mp3");
    this.load.audio("ding_sound", "assets/audio/ding_sound.mp3");
    this.load.audio("unclickable_sound", "assets/audio/unclickable_sound.mp3");
    this.load.image("menuButton", "assets/menu.png");
    this.load.image("coinIcon", "assets/coin.png");
    this.load.image("trashFishbone", "assets/fishbone.png");
    this.load.audio("congrats", "assets/audio/congrats.mp3");
    this.load.audio("narrator_sound", "assets/audio/narrator_sound.mp3");
    this.load.audio("parry_bloop", "assets/audio/parry_bloop.mp3");
    this.load.audio("yay_sound", "assets/audio/yay_sound.mp3");
    this.load.audio("my_turn", "assets/audio/my_turn.mp3");
    this.load.audio("your_turn", "assets/audio/your_turn.mp3");

  }

  create() {
    AudioManager.I.playBgm(this, "bgm");

    this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      "background"
    );

    this.add.text(HALF_WIDTH - 350, HALF_HEIGHT - 130, "Player ID", {
      fontSize: "32px",
      color: "black",
      fontFamily: "Jengle_Jungallery",
      stroke: "#ffffff",
      strokeThickness: 12
    }).setOrigin(0.5);

    this.add.text(HALF_WIDTH - 350, HALF_HEIGHT, "Your Age:", {
      fontSize: "32px",
      color: "black",
      fontFamily: "Jengle_Jungallery",
      stroke: "#ffffff",
      strokeThickness: 12
    }).setOrigin(0.5);

    this.add.text(HALF_WIDTH - 350, HALF_HEIGHT + 130, "Location:", {
      fontSize: "32px",
      color: "black",
      fontFamily: "Jengle_Jungallery",
      stroke: "#ffffff",
      strokeThickness: 12,
    }).setOrigin(0.5);

    this.idInput = this.add.dom(0, 0).createFromCache("text_input");
    const idInput = this.idInput;
    idInput.setOrigin(0.5);
    idInput.setPosition(HALF_WIDTH + 180, HALF_HEIGHT - 130);

    this.ageInput = this.add.dom(HALF_WIDTH, HEIGHT * 0.4).createFromCache("number_input");
    const ageInput = this.ageInput;
    ageInput.setOrigin(0.5);
    ageInput.setPosition(HALF_WIDTH + 180, HALF_HEIGHT);

    const ageEl = ageInput.node.querySelector("input") as HTMLInputElement;

    if (ageEl) {
      ageEl.min = "1";
      ageEl.step = "1";

      ageEl.addEventListener("input", () => {
        let val = parseInt(ageEl.value, 10);

        if (isNaN(val)) return;

        if (val < 1) val = 1;
        if (val > 130) val = 130;

        ageEl.value = val.toString();
      });

      ageEl.addEventListener("keydown", (e) => {
        if (e.key === "-" || e.key === "e") {
          e.preventDefault();
        }
      });
    }

    this.locationDropdown = this.add.dom(0, 0).createFromCache("dropdown");
    const locationDropdown = this.locationDropdown;
    locationDropdown.setOrigin(0.5);
    locationDropdown.setPosition(HALF_WIDTH + 180, HALF_HEIGHT + 130);

    this.add.image(this.scale.width * 0.05, this.scale.height * 0.10, "menuButton")
      .setInteractive()
      .on("pointerdown", () => {
        if (this.isPaused) {
          return;
        }

        AudioManager.I.playSfx(this, "click_sound");
        idInput.setVisible(false);
        ageInput.setVisible(false);
        locationDropdown.setVisible(false);
        this.scene.pause();
        this.scene.launch("PauseScene", { fromScene: this.scene.key });
      })
      .setScale(0.25)
      .setDepth(1000);

    this.events.on("resume", () => {
      this.time.delayedCall(20, () => {
        idInput.setVisible(true);
        ageInput.setVisible(true);
        locationDropdown.setVisible(true);
      });
    });

    const startShadow = this.add.graphics();
    startShadow.fillStyle(0x000000, 0.3);
    startShadow.fillRoundedRect(HALF_WIDTH - 340, HEIGHT * 0.68, HALF_WIDTH / 3, 120, 10);
    startShadow.setVisible(false);

    const startButton = this.add.graphics();
    startButton.lineStyle(2, 0xffffff, 1);
    startButton.fillStyle(0x222222, 1);
    startButton.fillRoundedRect(HALF_WIDTH - 350, HEIGHT * 0.68, HALF_WIDTH / 3, 120, 10);
    startButton.strokeRoundedRect(HALF_WIDTH - 350, HEIGHT * 0.68, HALF_WIDTH / 3, 120, 10);

    startButton.setInteractive(
      new Phaser.Geom.Rectangle(HALF_WIDTH - 350, HEIGHT * 0.68, HALF_WIDTH / 3, 120),
      Phaser.Geom.Rectangle.Contains
    );

    const startText = this.add.text(HALF_WIDTH - 185, HEIGHT * 0.73, "Start Game", {
      fontSize: "42px",
      color: "#FFFFFF",
      fontFamily: "Jengle_Jungallery"
    }).setOrigin(0.5);

    startButton.on("pointerover", () => {
      startShadow.setVisible(true);
      startButton.setY(-2);
      startText.setY((HEIGHT * 0.73) - 2);
    });

    startButton.on("pointerout", () => {
      startShadow.setVisible(false);
      startButton.setY(0);
      startText.setY(HEIGHT * 0.73);
    });

    startButton.on("pointerdown", () => {
      const playerData = this.collectPlayerData(idInput, ageInput, locationDropdown);

      if (!this.isValidPlayerData(playerData)) {
        AudioManager.I.playSfx(this, "unclickable_sound");
        idInput.setVisible(false);
        ageInput.setVisible(false);
        locationDropdown.setVisible(false);
        this.scene.pause();
        this.scene.launch("AlertScene", {
          fromScene: this.scene.key,
          text: "Please fill out all fields to proceed!"
        });
        return;
      }

      this.saveLatestPlayerData(playerData);
      this.appendPlayerRecord(playerData);

      AudioManager.I.playSfx(this, "click_sound");

      this.scene.start("scene-game-main", {
        ...playerData,
        totalCoins: 10,
        npcSuccessChance: 0.5,
        rows: 3,
        cols: 7,
        cardScale: 1
      });
    });

    const settingsShadow = this.add.graphics();
    settingsShadow.fillStyle(0x000000, 0.3);
    settingsShadow.fillRoundedRect(HALF_WIDTH + 60, HEIGHT * 0.68, HALF_WIDTH / 3, 120, 10);
    settingsShadow.setVisible(false);

    const settingsButton = this.add.graphics();
    settingsButton.lineStyle(2, 0xffffff, 1);
    settingsButton.fillStyle(0x222222, 1);
    settingsButton.fillRoundedRect(HALF_WIDTH + 50, HEIGHT * 0.68, HALF_WIDTH / 3, 120, 10);
    settingsButton.strokeRoundedRect(HALF_WIDTH + 50, HEIGHT * 0.68, HALF_WIDTH / 3, 120, 10);

    settingsButton.setInteractive(
      new Phaser.Geom.Rectangle(HALF_WIDTH + 50, HEIGHT * 0.68, HALF_WIDTH / 3, 120),
      Phaser.Geom.Rectangle.Contains
    );

    const settingsText = this.add.text(HALF_WIDTH + 210, HEIGHT * 0.73, "Settings", {
      fontSize: "42px",
      color: "#FFFFFF",
      fontFamily: "Jengle_Jungallery"
    }).setOrigin(0.5);

    settingsButton.on("pointerover", () => {
      settingsShadow.setVisible(true);
      settingsButton.setY(-2);
      settingsText.setY((HEIGHT * 0.73) - 2);
    });

    settingsButton.on("pointerout", () => {
      settingsShadow.setVisible(false);
      settingsButton.setY(0);
      settingsText.setY(HEIGHT * 0.73);
    });

    settingsButton.on("pointerdown", () => {
      const playerData = this.collectPlayerData(idInput, ageInput, locationDropdown);

      if (!this.isValidPlayerData(playerData)) {
        AudioManager.I.playSfx(this, "unclickable_sound");
        idInput.setVisible(false);
        ageInput.setVisible(false);
        locationDropdown.setVisible(false);
        this.scene.pause();
        this.scene.launch("AlertScene", {
          fromScene: this.scene.key,
          text: "Please fill out all fields to proceed!"
        });
        return;
      }

      this.saveLatestPlayerData(playerData);
      this.appendPlayerRecord(playerData);

      AudioManager.I.playSfx(this, "click_sound");

      this.scene.start("SettingsScreen", {
        playerData: playerData
      });
    });

    const downloadShadow = this.add.graphics();
    downloadShadow.fillStyle(0x000000, 0.3);
    downloadShadow.fillRoundedRect(HALF_WIDTH - 930, HEIGHT * 0.9, HALF_WIDTH / 2, 90, 10);
    downloadShadow.setVisible(false);

    const downloadButton = this.add.graphics();
    downloadButton.lineStyle(2, 0xffffff, 1);
    downloadButton.fillStyle(0x222222, 1);
    downloadButton.fillRoundedRect(HALF_WIDTH - 940, HEIGHT * 0.9, HALF_WIDTH / 2, 90, 10);
    downloadButton.strokeRoundedRect(HALF_WIDTH - 940, HEIGHT * 0.9, HALF_WIDTH / 2, 90, 10);

    downloadButton.setInteractive(
      new Phaser.Geom.Rectangle(HALF_WIDTH - 940, HEIGHT * 0.9, HALF_WIDTH / 2, 90),
      Phaser.Geom.Rectangle.Contains
    );

    const downloadText = this.add.text(HALF_WIDTH - 700, HEIGHT * 0.94, "Download Player Data", {
      fontSize: "32px",
      color: "#FFFFFF",
      fontFamily: "Jengle_Jungallery"
    }).setOrigin(0.5);

    downloadButton.on("pointerover", () => {
      downloadShadow.setVisible(true);
      downloadButton.setY(-2);
      downloadText.setY((HEIGHT * 0.94) - 2);
    });

    downloadButton.on("pointerout", () => {
      downloadShadow.setVisible(false);
      downloadButton.setY(0);
      downloadText.setY(HEIGHT * 0.94);
    });

    downloadButton.on("pointerdown", () => {
      const playerData = this.collectPlayerData(idInput, ageInput, locationDropdown);

      if (this.isValidPlayerData(playerData)) {
        this.saveLatestPlayerData(playerData);
        this.appendPlayerRecord(playerData);
      }

      const history = this.getPlayerHistory();
      const levelResults = this.getLevelResultHistory();

      if (history.length === 0 && levelResults.length === 0) {
        AudioManager.I.playSfx(this, "unclickable_sound");
        idInput.setVisible(false);
        ageInput.setVisible(false);
        locationDropdown.setVisible(false);
        this.scene.pause();
        this.scene.launch("AlertScene", {
          fromScene: this.scene.key,
          text: "No player data available to download yet."
        });
        return;
      }

      AudioManager.I.playSfx(this, "click_sound");
      this.downloadCollectedData(history, levelResults);
    });

    const viewHistoryShadow = this.add.graphics();
    viewHistoryShadow.fillStyle(0x000000, 0.3);
    viewHistoryShadow.fillRoundedRect(HALF_WIDTH - 230, HEIGHT * 0.9, HALF_WIDTH / 2, 90, 10);
    viewHistoryShadow.setVisible(false);

    const viewHistoryButton = this.add.graphics();
    viewHistoryButton.lineStyle(2, 0xffffff, 1);
    viewHistoryButton.fillStyle(0x222222, 1);
    viewHistoryButton.fillRoundedRect(HALF_WIDTH - 240, HEIGHT * 0.9, HALF_WIDTH / 2, 90, 10);
    viewHistoryButton.strokeRoundedRect(HALF_WIDTH - 240, HEIGHT * 0.9, HALF_WIDTH / 2, 90, 10);

    viewHistoryButton.setInteractive(
      new Phaser.Geom.Rectangle(HALF_WIDTH - 240, HEIGHT * 0.9, HALF_WIDTH / 2, 90),
      Phaser.Geom.Rectangle.Contains
    );

    const viewHistoryText = this.add.text(HALF_WIDTH, HEIGHT * 0.94, "View Move History", {
      fontSize: "32px",
      color: "#FFFFFF",
      fontFamily: "Jengle_Jungallery"
    }).setOrigin(0.5);

    viewHistoryButton.on("pointerover", () => {
      viewHistoryShadow.setVisible(true);
      viewHistoryButton.setY(-2);
      viewHistoryText.setY((HEIGHT * 0.94) - 2);
    });

    viewHistoryButton.on("pointerout", () => {
      viewHistoryShadow.setVisible(false);
      viewHistoryButton.setY(0);
      viewHistoryText.setY(HEIGHT * 0.94);
    });

    viewHistoryButton.on("pointerdown", () => {
      const levelResults = this.getLevelResultHistory();

      if (levelResults.length === 0) {
        AudioManager.I.playSfx(this, "unclickable_sound");
        idInput.setVisible(false);
        ageInput.setVisible(false);
        locationDropdown.setVisible(false);
        this.scene.pause();
        this.scene.launch("AlertScene", {
          fromScene: this.scene.key,
          text: "No game history available yet. Play a game first!"
        });
        return;
      }

      AudioManager.I.playSfx(this, "click_sound");
      this.showMoveHistoryOverlay(levelResults);
    });

    const clearDataShadow = this.add.graphics();
    clearDataShadow.fillStyle(0x000000, 0.3);
    clearDataShadow.fillRoundedRect(HALF_WIDTH + 678, HEIGHT * 0.9, HALF_WIDTH / 3.5, 90, 10);
    clearDataShadow.setVisible(false);

    const clearDataButton = this.add.graphics();
    clearDataButton.lineStyle(2, 0xffffff, 1);
    clearDataButton.fillStyle(0x222222, 1);
    clearDataButton.fillRoundedRect(HALF_WIDTH + 668, HEIGHT * 0.9, HALF_WIDTH / 3.5, 90, 10);
    clearDataButton.strokeRoundedRect(HALF_WIDTH + 668, HEIGHT * 0.9, HALF_WIDTH / 3.5, 90, 10);

    clearDataButton.setInteractive(
      new Phaser.Geom.Rectangle(HALF_WIDTH + 668, HEIGHT * 0.9, HALF_WIDTH / 3.5, 90),
      Phaser.Geom.Rectangle.Contains
    );

    const clearDataText = this.add.text(HALF_WIDTH + 808, HEIGHT * 0.94, "Clear Data", {
      fontSize: "32px",
      color: "#FFFFFF",
      fontFamily: "Jengle_Jungallery"
    }).setOrigin(0.5);

    clearDataButton.on("pointerover", () => {
      clearDataShadow.setVisible(true);
      clearDataButton.setY(-2);
      clearDataText.setY((HEIGHT * 0.94) - 2);
    });

    clearDataButton.on("pointerout", () => {
      clearDataShadow.setVisible(false);
      clearDataButton.setY(0);
      clearDataText.setY(HEIGHT * 0.94);
    });

    clearDataButton.on("pointerdown", () => {
      AudioManager.I.playSfx(this, "click_sound");
      idInput.setVisible(false);
      ageInput.setVisible(false);
      locationDropdown.setVisible(false);
      this.scene.pause();
      this.scene.launch('AlertScene', { fromScene: this.scene.key, text: "Clear all saved player and level data?", choice: true });

      const alertScene = this.scene.get('AlertScene');

      alertScene.events.once('clear', (choice: boolean) => {
        if (choice) {

          this.clearCollectedData();

          this.time.delayedCall(120, () => {
            idInput.setVisible(false);
            ageInput.setVisible(false);
            locationDropdown.setVisible(false);
            this.scene.pause();
            this.scene.launch('AlertScene', { fromScene: this.scene.key, text: "Saved data has been cleared.", choice: false });
          });

        } else {
          return;

        }
      });

    });
  }

  private collectPlayerData(
    idInput: Phaser.GameObjects.DOMElement,
    ageInput: Phaser.GameObjects.DOMElement,
    locationDropdown: Phaser.GameObjects.DOMElement
  ): PlayerData {
    const idValue = (idInput.node.querySelector("input") as HTMLInputElement).value.trim();
    const ageValue = (ageInput.node.querySelector("input") as HTMLInputElement).value.trim();
    const locationValue = (locationDropdown.node.querySelector("select") as HTMLSelectElement).value;

    return {
      playerId: idValue,
      age: ageValue,
      location: locationValue
    };
  }

  private isValidPlayerData(playerData: PlayerData): boolean {
    const ageNum = Number(playerData.age);

    return Boolean(
      playerData.playerId &&
      playerData.age &&
      playerData.location &&
      playerData.location !== "Select" &&
      !isNaN(ageNum) &&
      ageNum >= 1
    );
  }

  private saveLatestPlayerData(playerData: PlayerData): void {
    localStorage.setItem(this.PLAYER_DATA_KEY, JSON.stringify(playerData));
  }

  private getPlayerHistory(): PlayerRecord[] {
    const raw = localStorage.getItem(this.PLAYER_HISTORY_KEY);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as PlayerRecord[];
      }
    } catch {
      return [];
    }

    return [];
  }

  private appendPlayerRecord(playerData: PlayerData): void {
    const history = this.getPlayerHistory();

    const existingPlayer = history.find(
      (record) =>
        record.playerId === playerData.playerId &&
        record.age === playerData.age &&
        record.location === playerData.location
    );

    if (!existingPlayer) {
      history.push({
        playerId: playerData.playerId,
        age: playerData.age,
        location: playerData.location,
        submittedAt: new Date().toISOString()
      });

      localStorage.setItem(this.PLAYER_HISTORY_KEY, JSON.stringify(history));
    }
  }

  private getLevelResultHistory(): LevelResultRecord[] {
    const raw = localStorage.getItem(this.LEVEL_RESULTS_KEY);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as LevelResultRecord[];
      }
    } catch {
      return [];
    }

    return [];
  }

  private downloadCollectedData(
    history: PlayerRecord[],
    levelResults: LevelResultRecord[]
  ): void {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      totalPlayers: history.length,
      totalLevelResults: levelResults.length,
      players: history,
      levelResults
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json"
    });

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timeStamp = new Date().toISOString().replace(/[:.]/g, "-");

    link.href = downloadUrl;
    link.download = `player-data-${timeStamp}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(downloadUrl);
  }

  private clearCollectedData(): void {
    localStorage.removeItem(this.PLAYER_DATA_KEY);
    localStorage.removeItem(this.PLAYER_HISTORY_KEY);
    localStorage.removeItem(this.LEVEL_RESULTS_KEY);
    localStorage.removeItem("gameCustomSettings");
  }

  private showMoveHistoryOverlay(levelResults: LevelResultRecord[]): void {
    if (this.idInput) this.idInput.setVisible(false);
    if (this.ageInput) this.ageInput.setVisible(false);
    if (this.locationDropdown) this.locationDropdown.setVisible(false);

    const w = this.scale.width;
    const h = this.scale.height;

    const backdrop = this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x000000, 0.7)
      .setInteractive()
      .setDepth(3000);

    const panel = this.add.rectangle(w * 0.5, h * 0.5, w * 0.85, h * 0.8, 0x1a1a2e)
      .setStrokeStyle(3, 0xffffff)
      .setDepth(3001);

    const title = this.add.text(w * 0.5, h * 0.15, "Move History", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "Jengle_Jungallery"
    }).setOrigin(0.5).setDepth(3002);

    const closeBtn = this.add.text(w * 0.9, h * 0.15, "✕", {
      fontSize: "42px",
      color: "#ff6b6b",
      fontStyle: "bold"
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(3002);

    closeBtn.on("pointerdown", () => {
      this.hideHistoryOverlay();
    });

    const players = levelResults.filter((player) => Array.isArray(player.games));

    let selectedPlayerIndex = 0;
    let selectedGameIndex = 0;

    const getSelectedPlayer = () => players[selectedPlayerIndex];
    const getSelectedGames = () => getSelectedPlayer()?.games ?? [];


    const playerDropdown = document.createElement("select");

    playerDropdown.style.width = "220px";
    playerDropdown.style.height = "36px";
    playerDropdown.style.fontSize = "18px";
    playerDropdown.style.borderRadius = "8px";
    playerDropdown.style.padding = "4px";

    players.forEach((player, index) => {
      const option = document.createElement("option");
      option.value = index.toString();
      option.textContent = `Player ${player.playerId}`;
      playerDropdown.appendChild(option);
    });

    const playerDropdownElement = this.add.dom(
      w * 0.15,
      h * 0.15,
      playerDropdown
    ).setOrigin(0.5).setDepth(3002);

    playerDropdown.addEventListener("change", () => {
      selectedPlayerIndex = Number(playerDropdown.value);
      selectedGameIndex = 0;
      renderMoveCards();
    });

    const gameLabel = this.add.text(w * 0.5, h * 0.20, "", {
      fontSize: "24px",
      color: "#aaaaaa"
    }).setOrigin(0.5).setDepth(3002);

    const prevGameBtn = this.add.text(w * 0.35, h * 0.20, "<-", {
      fontSize: "28px",
      color: "#ffffff"
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(3002);

    const nextGameBtn = this.add.text(w * 0.65, h * 0.20, "->", {
      fontSize: "28px",
      color: "#ffffff"
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(3002);

    const moveCardsContainer = this.add.container(0, 0).setDepth(3002);

    const renderMoveCards = () => {
      moveCardsContainer.removeAll(true);

      const selectedPlayer = getSelectedPlayer();
      const selectedGames = getSelectedGames();
      const game = selectedGames[selectedGameIndex];
      const turns = game.Turns ?? [];
      const totalTiles =
        (game.Number_of_Rows ?? 3) * (game.Number_of_Columns ?? 7);

      const totalTrash =
        game.Total_Trash ?? (totalTiles - (game.Total_Number_of_Coins ?? 0));

      gameLabel.setText(
        `Player: ${selectedPlayer.playerId} | Game: ${selectedGameIndex + 1} of ${selectedGames.length}`
      );

      if (turns.length === 0) {
        const noData = this.add.text(
          w * 0.5,
          h * 0.5,
          "No move data for this game.\nOlder games may not have turn logs.",
          {
            fontSize: "24px",
            color: "#888888",
            align: "center"
          }
        ).setOrigin(0.5);

        moveCardsContainer.add(noData);
        return;
      }

      const rows = game.Number_of_Rows ?? 3;
      const cols = game.Number_of_Columns ?? 7;

      const cardWidth = 120;
      const cardHeight = 120;
      const gapX = 15;
      const gapY = 15;

      const boardWidth = cols * cardWidth + (cols - 1) * gapX;
      const boardHeight = rows * cardHeight + (rows - 1) * gapY;

      // Moves the grid left to make space for stats
      const boardCenterX = w * 0.42;
      const startX = boardCenterX - boardWidth / 2 + cardWidth / 2;
      const startY = h * 0.34;

      const turnMap = new Map<string, TurnRecord>();

      turns.forEach((turn) => {
        turnMap.set(turn.player_clicked, turn);
      });

      for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
          const key = `${row},${col}`;
          const turn = turnMap.get(key);

          const x = startX + (col - 1) * (cardWidth + gapX);
          const y = startY + (row - 1) * (cardHeight + gapY);

          const wasClicked = Boolean(turn);
          const hasCoin = turn?.coin === "yes";
          const clickedBy = String(turn?.clicked_by ?? "").toLowerCase();
          const isPlayer = clickedBy === "player";

          const cardBg = this.add.rectangle(
            x,
            y,
            cardWidth,
            cardHeight,
            wasClicked ? 0x2d2d44 : 0x555555
          ).setStrokeStyle(
            3,
            !wasClicked ? 0xffffff : isPlayer ? 0x4dabf7 : 0xffa94d
          );

          const turnNumberText = this.add.text(
            x - cardWidth / 2 + 8,
            y - cardHeight / 2 + 6,
            wasClicked ? `${turn!.turn}` : "",
            {
              fontSize: "18px",
              color: "#ffffff",
              fontStyle: "bold"
            }
          ).setOrigin(0, 0);

          const ownerText = this.add.text(
            x,
            y - 12,
            !wasClicked ? "Not picked" : isPlayer ? "Player" : "NPC",
            {
              fontSize: "18px",
              color: !wasClicked ? "#cccccc" : isPlayer ? "#4dabf7" : "#ffa94d",
              fontStyle: "bold"
            }
          ).setOrigin(0.5);

          let resultDisplay: Phaser.GameObjects.GameObject;

          if (!wasClicked) {
            resultDisplay = this.add.text(x, y + 35, "?", {
              fontSize: "18px",
              color: "#cccccc"
            }).setOrigin(0.5);
          } else if (hasCoin) {
            resultDisplay = this.add.image(x, y + 35, "coinIcon").setScale(0.12);
          } else {
            resultDisplay = this.add.image(x, y + 35, "trashFishbone").setScale(0.04);
          }

          moveCardsContainer.add([
            cardBg,
            turnNumberText,
            ownerText,
            resultDisplay
          ]);
        }
      }

      // Stats panel, drawn once, outside the grid loops
      const statsX = w * 0.81;
      const statsY = h * 0.502;
      const statsWidth = 380;
      const statsHeight = 470;

      const statsPanel = this.add.rectangle(
        statsX,
        statsY,
        statsWidth,
        statsHeight,
        0x1f1f2e,
        0.96
      )
        .setStrokeStyle(3, 0xffffff)
        .setOrigin(0.5);

      const statsTitle = this.add.text(
        statsX,
        statsY - statsHeight / 2 + 38,
        "GAME STATS",
        {
          fontSize: "28px",
          color: "#ffd43b",
          fontStyle: "bold",
          fontFamily: "Jengle_Jungallery"
        }
      ).setOrigin(0.5);

      const statsText = this.add.text(
        statsX - statsWidth / 2 + 35,
        statsY - statsHeight / 2 + 90,
        [
          `NPC DIFFICULTY: ${game.Difficulty_As_Percentage}`,
          ``,
          `TOTAL COINS: ${game.Total_Number_of_Coins}`,
          `TOTAL TRASH: ${totalTrash}`,
          ``,
          `COINS FOUND BY PLAYER: ${game.Coins_Found_by_Player}`,
          `COINS FOUND BY NPC: ${game.Coins_Found_by_NPC}`,
          ``,
          `COINS SHARED TO PLAYER: ${game.Coins_Player_Shared_to_Self}`,
          `COINS SHARED TO NPC: ${game.Coins_Player_Shared_to_NPC}`,
          ``,
          `MEMORY TIME: ${game.Time_Spent_Memorising}`
        ].join("\n"),
        {
          fontSize: "18px",
          color: "#ffffff",
          align: "left",
          fontFamily: "Jengle_Jungallery",
          lineSpacing: 7,
          wordWrap: { width: statsWidth - 70 }
        }
      ).setOrigin(0, 0);

      moveCardsContainer.add([
        statsPanel,
        statsTitle,
        statsText
      ]);
    };

    prevGameBtn.on("pointerdown", () => {
      if (selectedGameIndex > 0) {
        selectedGameIndex--;
        renderMoveCards();
      }
    });

    nextGameBtn.on("pointerdown", () => {
      const selectedGames = getSelectedGames();

      if (selectedGameIndex < getSelectedGames().length - 1) {
        selectedGameIndex++;
        renderMoveCards();
      }
    });

    renderMoveCards();

    this.historyOverlayContainer = this.add.container(0, 0, [
      backdrop,
      panel,
      title,
      closeBtn,
      gameLabel,
      prevGameBtn,
      nextGameBtn,
      playerDropdownElement,
      moveCardsContainer
    ]).setDepth(3000);
  }

  private hideHistoryOverlay(): void {
    if (this.historyOverlayContainer) {
      this.historyOverlayContainer.destroy(true);
      this.historyOverlayContainer = undefined;
    }

    if (this.idInput) this.idInput.setVisible(true);
    if (this.ageInput) this.ageInput.setVisible(true);
    if (this.locationDropdown) this.locationDropdown.setVisible(true);
  }
}
