import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level7 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level7");
  }

  create() {
    super.create();
    const { width, height } = this.scale;
    this.CreateUI();
    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [519, height - 98, height, "triangle1", 0, 0.15],
      [375, height - 98, height, "triangle2", Math.PI * 1.5, 0.15],
      [465, height - 545, height - 500, "semicircle", 0, 0.2],
      [448.5, height - 275, height - 200, "brick2", 0, 0.15],
    ];
    this.mainBrickStart = [[1600, height - 120, 0.14]];

    //spawn bricks
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);
  }
}
