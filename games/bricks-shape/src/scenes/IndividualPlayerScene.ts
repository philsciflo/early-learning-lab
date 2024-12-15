import { BaseBricksScene } from "./BaseBricksScene.ts";
import {
  BLACK,
  BUILD_AREA_LEFT,
  BUILD_AREA_TOP,
  TARGET_LEFT,
  TARGET_TOP,
  GUTTER_WIDTH,
  WIDTH,
  BUILD_AREA_HEIGHT,
  BUILD_AREA_WIDTH,
  TARGET_WIDTH,
  TARGET_HEIGHT,
  GAME_AREA_HEIGHT,
  GAME_AREA_TOP,
} from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import Zone = Phaser.GameObjects.Zone;
import { LevelScoringData, PLAYER_SCORING_DATA } from "../scoring.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;

export abstract class IndividualPlayerScene extends BaseBricksScene {
  private readonly tileCount: number;
  private readonly buildTileXPositions: number[];
  private readonly buildTileYPositions: number[];
  private readonly buildTileHeight: number;
  private readonly buildTileWidth: number;
  private readonly targetTileHeight: number;
  private readonly targetTileWidth: number;
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
    private readonly rows: number,
    private readonly cols: number,
    private readonly colours: number[],
  ) {
    super(name, scoreKey, levelTitle, instructions, prevSceneKey, nextSceneKey);
    this.tileCount = this.rows * this.cols;

    while (this.colours.length < this.tileCount) {
      // Extend the colours so that there is 1 colour per tile; necessary for the
      // 'random' colour layouts to work
      this.colours.push(...this.colours);
    }
    if (this.colours.length > this.tileCount) {
      this.colours.splice(this.tileCount);
    }
    this.buildTileHeight = BUILD_AREA_HEIGHT / this.rows;
    this.buildTileWidth = BUILD_AREA_WIDTH / this.cols;
    this.targetTileHeight = TARGET_HEIGHT / this.rows;
    this.targetTileWidth = TARGET_WIDTH / this.cols;
    this.buildTileXPositions = this.generatePositions(
      GUTTER_WIDTH + 10, // Game area LHS
      WIDTH - GUTTER_WIDTH - this.buildTileWidth - 10, // Game area RHS
    );
    this.buildTileYPositions = this.generatePositions(
      BUILD_AREA_TOP + BUILD_AREA_HEIGHT + 5, // build area base, with gap
      GAME_AREA_TOP + GAME_AREA_HEIGHT - this.buildTileHeight + 5, // go down to game area base, with gap
    );
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
      BUILD_AREA_WIDTH + BORDER,
      BUILD_AREA_HEIGHT + BORDER,
    );
    tileBoxes.strokeRect(
      TARGET_LEFT - BORDER / 2,
      TARGET_TOP - BORDER / 2,
      TARGET_WIDTH + BORDER,
      TARGET_HEIGHT + BORDER,
    );

    this.colours.forEach((colour) => {
      const textureName = "" + colour;
      if (this.textures.exists(textureName)) {
        // clear out existing textures, to prevent conflicts
        this.textures.remove(textureName);
      }
      // Create a texture for each colour, so we can use it to create sprites
      this.add
        .graphics({
          fillStyle: {
            color: colour,
          },
          lineStyle: {
            color: BLACK,
            width: 4,
          },
        })
      .strokeRect(0, 0, this.buildTileWidth, this.buildTileHeight)
      .setVisible(false)
      .fillRect(0, 0, this.buildTileWidth, this.buildTileHeight)
      .generateTexture(
          textureName,
          this.buildTileWidth,
          this.buildTileHeight,
        );
    });

    this.resetTiles();
  }

  protected doReset(): void {
    this.resetTiles();
  }

  private resetTileSeedData() {
    Phaser.Utils.Array.Shuffle(this.colours);
    Phaser.Utils.Array.Shuffle(this.buildTileXPositions);
    Phaser.Utils.Array.Shuffle(this.buildTileYPositions);
  }

  private resetTiles() {
    this.resetTileSeedData();
    this.removeExistingTiles();
    this.correctTileCount = 0;
    let tileIndex = 0;
    for (let rowCount = 0; rowCount < this.rows; rowCount++) {
      for (let colCount = 0; colCount < this.cols; colCount++) {
        const colourTexture = "" + this.colours[tileIndex];

        // Target tile
        const targetTile = this.add
          .sprite(
            TARGET_LEFT + colCount * this.targetTileWidth,
            TARGET_TOP + rowCount * this.targetTileHeight,
            colourTexture,
          )
          .setOrigin(0, 0)
          .setDisplaySize(this.targetTileWidth, this.targetTileHeight);
        this.allTiles.push(targetTile);

        // drop zone in build area for this tile
        const zone = this.add
          .zone(
            BUILD_AREA_LEFT +
              colCount * this.buildTileWidth +
              this.buildTileWidth / 2,
            BUILD_AREA_TOP +
              rowCount * this.buildTileHeight +
              this.buildTileHeight / 2,
            this.buildTileWidth,
            this.buildTileHeight,
          )
          .setDataEnabled()
          .setData<string>("colour", colourTexture)
          .setRectangleDropZone(this.buildTileWidth, this.buildTileHeight)
          // make sure the zones are always underneath the tiles, so tiles can be
          // picked up and dragged even after being dropped on a zone (don't let
          // the zone intercept the pointer interactions)
          .setToBack();
        this.allTiles.push(zone);

        // Just a visual display of the drop zone, for debugging
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
            this.buildTileXPositions[tileIndex],
            this.buildTileYPositions[tileIndex],
            colourTexture,
          )
          .setOrigin(0, 0)
          .setDisplaySize(this.buildTileWidth, this.buildTileHeight)
          .setInteractive({ draggable: true })
          .setDataEnabled()
          .setData<boolean>(this.TILE_IN_CORRECT_LOCATION_DATA_KEY, false)
          .setData<string>("colour", colourTexture)
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
            if (dropZone.getData("colour") === buildTile.getData("colour")) {
              // The tile has been dropped in the zone that matches the tile colour, so it's in the correct spot
              buildTile.setData<boolean>(
                this.TILE_IN_CORRECT_LOCATION_DATA_KEY,
                true,
              );
            }
            console.log(
              "match: ",
              buildTile.getData(this.TILE_IN_CORRECT_LOCATION_DATA_KEY),
            );
          });
        this.allTiles.push(buildTile);

        tileIndex++;
      }
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

  private generatePositions(min: number, max: number): number[] {
    const spread = (max - min) / this.tileCount;
    const results = [];
    for (let count = 0; count <= this.tileCount; count++) {
      results.push(min + count * spread);
    }
    return results;
  }
}
