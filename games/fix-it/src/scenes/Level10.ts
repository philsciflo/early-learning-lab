import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level10 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level10");
  }

  create() {
    super.create();
    const { width, height } = this.scale;

    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [400, height - 140, height, "brick2", 0, 0.195],
      [590, height - 285, height - 240, "brick2", 0, 0.16],
      [680, height - 400, height - 380, "longbrick3", Math.PI * 0.5, 0.12],
      [620, height - 480, height - 440, "brick2", 0, 0.1],
      [400, height - 580, height - 500, "brick2", 0, 0.06],
      [330, height - 440, height - 400, "longbrick1", 0, 0.15],
      [750, height - 285, height - 250, "longbrick1", 0, 0.16],
    ];
    this.mainBrickStart = [
      [1800, height - 130, 0.185],
      [1600, height - 110, 0.13],
      [1400, height - 130, 0.165],
    ];

    //spawn bricks
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);
    this.CreateUI();
  }
}
