import { LevelBaseScene } from "./LevelBaseScene.ts";


export class Level2 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level2");
  }

  create() {
    super.create();
    const { width, height } = this.scale;
    this.CreateUI();
    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [400, height - 120, height, "brick2", 0, 0.15],
      [400, height - 275, height - 200, "brick2", 0, 0.15],
      [550, height - 480, height - 400, "longbrick1", Math.PI * 0.5, 0.36],
    ];
    this.mainBrickStart = [
      [1600, height - 120, 0.15],
      [1800, height - 120, 0.15],
    ];

    //spawn bricks
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);


  }
}
