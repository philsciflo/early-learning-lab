import { BaseScene } from "./Base_Scene";
import { WIDTH, HEIGHT, GUTTER_WIDTH, BUILD_AREA_TOP, GAME_AREA_WIDTH, GAME_AREA_HEIGHT, GAME_AREA_TOP} from "../constants.ts";
import Phaser from "phaser";

export class Level1 extends BaseScene {
  private tiles: Phaser.GameObjects.Rectangle[][] = [];
  private tileNumbers: number[][] = [];
  private numberTexts: Phaser.GameObjects.Text[][] = [];
  private gameStarted: boolean = false;

  private oddScore: number = 0;
  private evenScore: number = 0;
  private oddScoreText!: Phaser.GameObjects.Text;
  private evenScoreText!: Phaser.GameObjects.Text;

  constructor() {
    super("Level1", "level1Score", "Level 1", "Click tiles to reveal numbers", "MainMenu", "Level2");
  }

  create() {
    super.create();

    const tilesX = 8;
    const tilesY = 6;

    // Shrink the tile area slightly
    const areaMargin = 100;
    const tileAreaWidth = GAME_AREA_WIDTH - areaMargin * 2;
    const tileAreaHeight = GAME_AREA_HEIGHT - areaMargin * 2;

    const tileWidth = tileAreaWidth / tilesX;
    const tileHeight = tileAreaHeight / tilesY;

    const offsetX = GUTTER_WIDTH + areaMargin;
    const offsetY = BUILD_AREA_TOP + areaMargin;

    // Scores display

    this.oddScoreText = this.add.text(GUTTER_WIDTH + 10, GAME_AREA_TOP + 10, `Odd Score: 0`, { fontSize: "28px", color: "#ff0000" }).setOrigin(0, 0);
    this.evenScoreText = this.add.text(GUTTER_WIDTH + GAME_AREA_WIDTH - 10, GAME_AREA_TOP + 10, "Even Score: 0", { fontSize: "24px", color: "#000" }).setOrigin(1, 0); // top-right anchor


    // Generate numbers 1 → 48
    let counter = 1;

    for (let row = 0; row < tilesY; row++) {
      this.tiles[row] = [];
      this.tileNumbers[row] = [];
      this.numberTexts[row] = [];

      for (let col = 0; col < tilesX; col++) {
        const x = offsetX + col * tileWidth + tileWidth / 2;
        const y = offsetY + row * tileHeight + tileHeight / 2;

        // Tile rectangle
        const tile = this.add
          .rectangle(x, y, tileWidth - 4, tileHeight - 4, 0xcccccc)
          .setStrokeStyle(2, 0x000000)
          .setInteractive();

        this.tiles[row][col] = tile;
        this.tileNumbers[row][col] = counter;

        // Show number initially
        const numberText = this.add
          .text(x, y, counter.toString(), {
            fontSize: `${Math.floor(tileHeight / 2)}px`,
            color: "#000000",
            fontFamily: "Arial",
          })
          .setOrigin(0.5);

        this.numberTexts[row][col] = numberText;
        counter++;

        tile.on("pointerdown", () => {
          if (!this.gameStarted) return;
          this.flipTile(row, col);

          // Update scores
          const num = this.tileNumbers[row][col];
          if (num % 2 === 0) {
            this.evenScore++;
            this.evenScoreText.setText(`Even Score: ${this.evenScore}`);
          } else {
            this.oddScore++;
            this.oddScoreText.setText(`Odd Score: ${this.oddScore}`);
          }

          // Show number beneath the tile
          this.add
            .text(x, y + tileHeight / 2 + 10, num.toString(), {
              fontSize: `${Math.floor(tileHeight / 3)}px`,
              color: "#333333",
              fontFamily: "Arial",
            })
            .setOrigin(0.5, 0);
        });
      }
    }

    // 'Start Game' button
    const coverButton = this.add
      .text(WIDTH / 2, offsetY + tileAreaHeight + 30, "Start Game")
      .setOrigin(0.5)
      .setFontSize(32)
      .setBackgroundColor("#705aed")
      .setPadding(10)
      .setColor("#ffffff")
      .setInteractive();

    coverButton.on("pointerdown", () => {
      this.coverAllTiles();
      this.gameStarted = true;
      coverButton.destroy();
    });
  }

  private coverAllTiles() {
    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tile = this.tiles[row][col];
        const text = this.numberTexts[row][col];
        tile.setFillStyle(0x888888);
        text.setVisible(false);
      }
    }
  }

  private flipTile(row: number, col: number) {
    const tile = this.tiles[row][col];
    const text = this.numberTexts[row][col];

    this.tweens.add({
      targets: tile,
      scaleX: 0,
      duration: 150,
      onComplete: () => {
        tile.setFillStyle(0xffffff);
        text.setVisible(true);
        this.tweens.add({
          targets: tile,
          scaleX: 1,
          duration: 150,
        });
      },
    });
  }

  protected doReset(): void {
    this.gameStarted = false;
    this.oddScore = 0;
    this.evenScore = 0;
    this.oddScoreText.setText(`Odd Score: 0`);
    this.evenScoreText.setText(`Even Score: 0`);

    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tile = this.tiles[row][col];
        const text = this.numberTexts[row][col];
        tile.setFillStyle(0xcccccc);
        text.setVisible(true);
      }
    }
  }

  protected recordScoreDataForCurrentTry() {
    return { score: 0, time: 0 }; // placeholder
  }
}
