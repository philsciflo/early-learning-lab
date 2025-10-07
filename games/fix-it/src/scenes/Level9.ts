import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level9 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level9");
  }

  create() {
    super.create();
    const { width, height } = this.scale;

    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [320, height - 120, height, "brick2", 0, 0.15],
      [535, height - 120, height, "brick2", 0, 0.15],
      [480, height - 530, height - 450, "semicircle", 0, 0.3],
      [555, height - 250, height - 140, "triangle1", Math.PI * 1.5, 0.1465],
      [320, height - 280, height - 140, "longbrick1", 0, 0.15],
      [660, height - 400, height - 280, "longbrick3", Math.PI * 0.5, 0.15],
      [700, height - 550, height - 440, "longbrick1", 0, 0.15],
    ];
    this.mainBrickStart = [
      [1600, height - 220, 0.08],
      [1400, height - 120, 0.15],
      [1600, height - 120, 0.15],
    ];

    //spawn bricks
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);
    this.CreateUI();
  }
}
