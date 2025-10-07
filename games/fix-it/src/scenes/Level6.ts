import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level6 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level6");
  }

  create() {
    super.create();
    const { width, height } = this.scale;
    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [540, height - 120, height, "brick2", 0, 0.15],
      [450, height - 270, height - 170, "longbrick1", Math.PI * 0.5, 0.25],
      [710, height - 270, height - 170, "longbrick3", Math.PI * 0.5, 0.25],
      [590, height - 630, height - 570, "semicircle", 0, 0.25],
    ];
    this.mainBrickStart = [
      [1600, height - 140, 0.2],
      [1400, height - 120, 0.15],
    ];

    //spawn bricks
    this.createBricks(this.brickCoords);
      this.createMainBricks(this.mainBrickStart);
      this.CreateUI();
  }
}
