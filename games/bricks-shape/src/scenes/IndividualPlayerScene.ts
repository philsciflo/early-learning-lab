import { BaseBricksScene } from "./BaseBricksScene.ts";
import {
  AQUA,
  BLACK,
  BUILD_AREA_LEFT,
  BUILD_AREA_TOP,
  FUSCHIA,
  LIME,
  ORANGE,
  RED,
  TARGET_LEFT,
  TARGET_TOP,
  BUILD_TILE_SIZE,
  YELLOW,
  TARGET_TILE_SIZE,
  GUTTER_WIDTH,
  WIDTH,
} from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import Zone = Phaser.GameObjects.Zone;
import { LevelScoringData, PLAYER_SCORING_DATA } from "../scoring.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;

export abstract class IndividualPlayerScene extends BaseBricksScene {
  private readonly rows = 2;
  private readonly cols = 3;
  private readonly tileCount = this.rows * this.cols;
  private colours = [FUSCHIA, AQUA, LIME, YELLOW, RED, ORANGE];
  private buildTileXOffsets = this.generateOffsets(
    GUTTER_WIDTH,
    WIDTH - GUTTER_WIDTH - BUILD_TILE_SIZE,
  );
  private buildTileYOffsets = this.generateOffsets(10, 60);
  /**
   * All the tiles (target shapes, build shapes, build drop zones) created in this scene
   */
  private allTiles: Phaser.GameObjects.GameObject[] = [];
  private readonly TILE_IN_CORRECT_LOCATION_DATA_KEY = "correct";
  private correctTileCount = 0;

  protected constructor(
    name: string,
    scoreKey: keyof PLAYER_SCORING_DATA,
    levelTitle: string,
    instructions: string,
    prevSceneKey: string,
    nextSceneKey: string,
  ) {
    super(name, scoreKey, levelTitle, instructions, prevSceneKey, nextSceneKey);
  }

  init() {
    super.init();
    this.resetTileSeedData();
  }

  create() {
    super.create();
    const BORDER = 4;
    const tileBoxes = this.add.graphics({
      lineStyle: {
        width: BORDER,
        color: BLACK,
      },
    });
    tileBoxes.strokeRect(
      BUILD_AREA_LEFT - BORDER / 2,
      BUILD_AREA_TOP - BORDER / 2,
      this.cols * BUILD_TILE_SIZE + BORDER,
      this.rows * BUILD_TILE_SIZE + BORDER,
    );

    tileBoxes.strokeRect(
      TARGET_LEFT - BORDER / 2,
      TARGET_TOP - BORDER / 2,
      this.cols * TARGET_TILE_SIZE + BORDER,
      this.rows * TARGET_TILE_SIZE + BORDER,
    );

    for (let tileIndex = 1; tileIndex <= this.rows * this.cols; tileIndex++) {
      // Create a texture for each tile, so we can use it to create sprites
      const colour = this.colours[tileIndex - 1];
      this.add
        .graphics({
          fillStyle: {
            color: colour,
          },
        })
        .setVisible(false)
        .fillRect(0, 0, BUILD_TILE_SIZE, BUILD_TILE_SIZE)
        .generateTexture("" + colour, BUILD_TILE_SIZE, BUILD_TILE_SIZE);
    }

    this.resetTiles();
  }

  protected doReset(): void {
    this.resetTiles();
  }

  private resetTileSeedData() {
    Phaser.Utils.Array.Shuffle(this.colours);
    Phaser.Utils.Array.Shuffle(this.buildTileXOffsets);
    Phaser.Utils.Array.Shuffle(this.buildTileYOffsets);
  }

  private resetTiles() {
    this.resetTileSeedData();
    this.removeExistingTiles();
    this.correctTileCount = 0;
    for (let tileIndex = 1; tileIndex <= this.tileCount; tileIndex++) {
      const colour = this.colours[tileIndex - 1];

      // Target tile
      const targetTile = this.add
        .sprite(
          TARGET_LEFT + (tileIndex % this.cols) * TARGET_TILE_SIZE,
          TARGET_TOP + (tileIndex % this.rows) * TARGET_TILE_SIZE,
          "" + colour,
        )
        .setOrigin(0, 0)
        .setDisplaySize(TARGET_TILE_SIZE, TARGET_TILE_SIZE);
      this.allTiles.push(targetTile);

      // drop zone in build area for this tile
      const zone = this.add
        .zone(
          BUILD_AREA_LEFT +
            (tileIndex % this.cols) * BUILD_TILE_SIZE +
            BUILD_TILE_SIZE / 2,
          BUILD_AREA_TOP +
            (tileIndex % this.rows) * BUILD_TILE_SIZE +
            BUILD_TILE_SIZE / 2,
          BUILD_TILE_SIZE,
          BUILD_TILE_SIZE,
        )
        .setRectangleDropZone(BUILD_TILE_SIZE, BUILD_TILE_SIZE)
        // make sure the zones are always underneath the tiles, so tiles can be
        // picked up and dragged even after being dropped on a zone (don't let
        // the zone intercept the pointer interactions)
        .setToBack();
      this.allTiles.push(zone);

      //  Just a visual display of the drop zone, for debugging
      // const graphics = this.add.graphics();
      // graphics.lineStyle(2, 0x000000);
      // graphics.strokeRect(
      //   zone.x - zone.input?.hitArea.width / 2,
      //   zone.y - zone.input?.hitArea.height / 2,
      //   zone.input?.hitArea.width,
      //   zone.input?.hitArea.height,
      // );

      const buildTile = this.add
        .sprite(
          this.buildTileXOffsets[tileIndex - 1],
          500 + this.buildTileYOffsets[tileIndex - 1], //  +   tileIndex * 3,
          "" + colour,
        )
        .setOrigin(0, 0)
        .setInteractive({ draggable: true })
        .setDataEnabled()
        .setData<boolean>(this.TILE_IN_CORRECT_LOCATION_DATA_KEY, false)
        .on(
          `changedata-${this.TILE_IN_CORRECT_LOCATION_DATA_KEY}`,
          (
            _tile: SpriteWithStaticBody,
            newValue: boolean,
            currentValue: boolean,
          ) => {
            if (newValue !== currentValue) {
              if (newValue) {
                this.correctTileCount++;
              } else {
                this.correctTileCount--;
              }
            }
          },
        )
        .on("dragstart", () => {
          // Make sure the current tile is always visually at the top
          buildTile.setToTop();
          // Assume a moving tile is no longer in the correct location; it may be set back to true on drop
          buildTile.setData<boolean>(
            this.TILE_IN_CORRECT_LOCATION_DATA_KEY,
            false,
          );
        })
        .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
          buildTile.setPosition(dragX, dragY);
        })
        .on("drop", (_pointer: never, dropZone: Zone) => {
          // Snap the tile to the location created for it... doing silly math because of inconsistent origins
          buildTile.x = dropZone.x - dropZone.input?.hitArea.width / 2;
          buildTile.y = dropZone.y - dropZone.input?.hitArea.height / 2;
          // FIXME disable drop zones when there is a tile snapped to it, and enable them again if it leaves so that
          // we don't have multiple tiles in the same place?
          if (dropZone === zone) {
            // The tile has been dropped in the zone that matches the tile, so it's in the correct spot
            buildTile.setData<boolean>(
              this.TILE_IN_CORRECT_LOCATION_DATA_KEY,
              true,
            );
          }
        });
      this.allTiles.push(buildTile);
    }
  }

  private removeExistingTiles() {
    this.allTiles.forEach((item) => item.destroy());
    this.allTiles = [];
  }

  protected recordScoreDataForCurrentTry(): LevelScoringData {
    const endTime = window.performance.now();
    const elapsedTimeInSeconds = (endTime - this.startTime) / 1000;

    return {
      complete: this.correctTileCount === this.tileCount,
      time: elapsedTimeInSeconds,
    };
  }

  private generateOffsets(min: number, max: number): number[] {
    const spread = (max - min) / this.tileCount;
    const results = [];
    for (let count = 1; count <= this.tileCount; count++) {
      results.push(count * spread);
    }
    return results;
  }
}
