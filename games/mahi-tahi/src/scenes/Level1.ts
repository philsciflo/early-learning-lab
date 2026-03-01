import { BaseScene } from "./Base_Scene";
import { WIDTH, HEIGHT, GUTTER_WIDTH, BUILD_AREA_TOP, GAME_AREA_WIDTH, GAME_AREA_HEIGHT, GAME_AREA_TOP} from "../constants.ts";
import Phaser from "phaser";

export class Level1 extends BaseScene {
  private tiles: Phaser.GameObjects.Rectangle[][] = [];
  private tileValues: string[][] = [];
  private tileFlipped: boolean[][] = [];
  private tileImages: Phaser.GameObjects.Image[][] = [];
  private tileWidth: number = 0;
  private tileHeight: number = 0;
  private gameStarted: boolean = false;

  private youWins: number = 0;
  private youLosses: number = 0;
  private cpuWins: number = 0;
  private cpuLosses: number = 0;
  private youScoreText!: Phaser.GameObjects.Text;
  private cpuScoreText!: Phaser.GameObjects.Text;
  private cpuTurnPending: boolean = false;

  constructor() {
    super("Level1", "level1Score", "Level 1", "Click tiles to reveal WIN or X", "MainMenu", "Level2");
  }

  preload() {
    super.preload();
    this.load.image("broccoli", "assets/broccoli.png");
    this.load.image("lollies", "assets/lollies.png");
  }

  create() {
    super.create();

    const tilesX = 8;
    const tilesY = 6;

    // Shrink the tile area slightly
    const areaMargin = 100;
    const tileAreaWidth = GAME_AREA_WIDTH - areaMargin * 2;
    const tileAreaHeight = GAME_AREA_HEIGHT - areaMargin * 2;

    this.tileWidth = tileAreaWidth / tilesX;
    this.tileHeight = tileAreaHeight / tilesY;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;

    const offsetX = GUTTER_WIDTH + areaMargin;
    const offsetY = BUILD_AREA_TOP + areaMargin;

    // Scores display
    this.youScoreText = this.add
      .text(GUTTER_WIDTH + 10, GAME_AREA_TOP + 10, "YOU  W: 0  L: 0", { fontSize: "22px", color: "#228822" })
      .setOrigin(0, 0);
    this.cpuScoreText = this.add
      .text(GUTTER_WIDTH + GAME_AREA_WIDTH - 10, GAME_AREA_TOP + 10, "CPU  W: 0  L: 0", { fontSize: "22px", color: "#4488ff" })
      .setOrigin(1, 0);

    for (let row = 0; row < tilesY; row++) {
      this.tiles[row] = [];
      this.tileValues[row] = [];
      this.tileFlipped[row] = [];
      this.tileImages[row] = [];

      for (let col = 0; col < tilesX; col++) {
        const x = offsetX + col * tileWidth + tileWidth / 2;
        const y = offsetY + row * tileHeight + tileHeight / 2;

        // Tile rectangle
        const tile = this.add
          .rectangle(x, y, tileWidth - 4, tileHeight - 4, 0xffffff)
          .setStrokeStyle(2, 0x000000)
          .setInteractive();

        this.tiles[row][col] = tile;

        const value = Phaser.Math.Between(0, 1) === 0 ? "WIN" : "X";
        this.tileValues[row][col] = value;
        this.tileFlipped[row][col] = false;

        const imgKey = value === "WIN" ? "lollies" : "broccoli";
        const imgSize = Math.min(tileWidth, tileHeight) * 0.65;
        const tileImage = this.add
          .image(x, y, imgKey)
          .setDisplaySize(imgSize, imgSize)
          .setVisible(true);

        this.tileImages[row][col] = tileImage;

        tile.on("pointerdown", () => {
          if (!this.gameStarted) return;
          if (this.tileFlipped[row][col]) return;
          this.tileFlipped[row][col] = true;
          this.flipTile(row, col);

          const val = this.tileValues[row][col];
          if (val === "WIN") { this.youWins++; } else { this.youLosses++; }
          this.youScoreText.setText(`YOU  W: ${this.youWins}  L: ${this.youLosses}`);

          this.doVirtualPlayerTurn();
        });
      }
    }

    const buttonY = offsetY + tileAreaHeight + 30;

    // 'START GAME' button
    const startButton = this.add
      .text(WIDTH / 2 - 130, buttonY, "START GAME")
      .setOrigin(0.5)
      .setFontSize(28)
      .setBackgroundColor("#705aed")
      .setPadding(10)
      .setColor("#ffffff")
      .setInteractive();

    startButton.on("pointerdown", () => {
      if (this.gameStarted) return;
      this.coverAllTiles();
      this.gameStarted = true;
    });

    // 'RESET' button
    const resetButton = this.add
      .text(WIDTH / 2 + 130, buttonY, "RESET")
      .setOrigin(0.5)
      .setFontSize(28)
      .setBackgroundColor("#cc4444")
      .setPadding(10)
      .setColor("#ffffff")
      .setInteractive();

    resetButton.on("pointerdown", () => {
      this.gameStarted = false;
      this.resetScores();
      this.randomiseTiles();
      this.uncoverAllTiles();
    });
  }

  private coverAllTiles() {
    this.cpuTurnPending = false;
    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tile = this.tiles[row][col];
        tile.setFillStyle(0x888888);
        tile.setScale(1);
        tile.setAlpha(1);
        this.tileImages[row][col].setVisible(false);
        this.tileFlipped[row][col] = false;
      }
    }
  }

  private randomiseTiles() {
    const imgSize = Math.min(this.tileWidth, this.tileHeight) * 0.65;
    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const value = Phaser.Math.Between(0, 1) === 0 ? "WIN" : "X";
        this.tileValues[row][col] = value;
        this.tileImages[row][col]
          .setTexture(value === "WIN" ? "lollies" : "broccoli")
          .setDisplaySize(imgSize, imgSize);
      }
    }
  }

  private uncoverAllTiles() {
    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tile = this.tiles[row][col];
        tile.setFillStyle(0xffffff);
        tile.setScale(1);
        tile.setAlpha(1);
        this.tileImages[row][col].setVisible(true);
        this.tileFlipped[row][col] = false;
      }
    }
  }

  private resetScores() {
    this.youWins = 0;
    this.youLosses = 0;
    this.cpuWins = 0;
    this.cpuLosses = 0;
    this.cpuTurnPending = false;
    this.youScoreText.setText("YOU  W: 0  L: 0");
    this.cpuScoreText.setText("CPU  W: 0  L: 0");
  }

  private doVirtualPlayerTurn() {
    if (this.cpuTurnPending) return;
    this.cpuTurnPending = true;

    const cpuMode: string = this.registry.get("cpu_probability") ?? "fifty_fifty";

    const all: { row: number; col: number }[] = [];
    for (let r = 0; r < this.tiles.length; r++) {
      for (let c = 0; c < this.tiles[r].length; c++) {
        if (!this.tileFlipped[r][c]) all.push({ row: r, col: c });
      }
    }

    if (all.length === 0) { this.cpuTurnPending = false; return; }

    // Filter by CPU mode; fall back to all unflipped if none available
    let preferred = all;
    if (cpuMode === "always_win") {
      const wins = all.filter(p => this.tileValues[p.row][p.col] === "WIN");
      if (wins.length > 0) preferred = wins;
    } else if (cpuMode === "always_lose") {
      const losses = all.filter(p => this.tileValues[p.row][p.col] === "X");
      if (losses.length > 0) preferred = losses;
    }

    const pick = preferred[Phaser.Math.Between(0, preferred.length - 1)];
    this.time.delayedCall(500, () => {
      this.cpuTurnPending = false;
      if (!this.gameStarted) return;
      this.tileFlipped[pick.row][pick.col] = true;
      this.flipTile(pick.row, pick.col);

      const val = this.tileValues[pick.row][pick.col];
      if (val === "WIN") { this.cpuWins++; } else { this.cpuLosses++; }
      this.cpuScoreText.setText(`CPU  W: ${this.cpuWins}  L: ${this.cpuLosses}`);
    });
  }

  private flipTile(row: number, col: number) {
    const tile = this.tiles[row][col];
    const img = this.tileImages[row][col];
    const isWin = this.tileValues[row][col] === "WIN";

    // Tint the tile background, reveal the image, then fade the cover away
    tile.setFillStyle(isWin ? 0xaaffaa : 0xffaaaa);
    img.setVisible(true);
    this.tweens.add({
      targets: tile,
      alpha: 0,
      duration: 200,
      ease: "Sine.easeOut",
    });
  }

  protected doReset(): void {
    this.gameStarted = false;
    this.resetScores();
    this.randomiseTiles();
    this.uncoverAllTiles();
  }

  protected recordScoreDataForCurrentTry() {
    return { score: 0, time: 0 }; // placeholder
  }
}
