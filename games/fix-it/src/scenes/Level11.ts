import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level11 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level11");
  }

  create() {
    super.create();
    const { width, height } = this.scale;

    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [415, height - 100, height, "longbrick1", Math.PI * 0.5, 0.18],
      [600, height - 100, height, "longbrick3", Math.PI * 0.5, 0.18],
      [785, height - 100, height, "longbrick1", Math.PI * 0.5, 0.18],
      [508, height - 200, height - 110, "longbrick3", Math.PI * 0.5, 0.18],
      [692, height - 200, height - 110, "longbrick3", Math.PI * 0.5, 0.18],

      [600, height - 350, height - 300, "brick2", Math.PI * 0.5, 0.2],

      [415, height - 600, height - 400, "longbrick1", Math.PI * 0.5, 0.18],
      [600, height - 600, height - 500, "longbrick3", Math.PI * 0.5, 0.18],
      [785, height - 600, height - 400, "longbrick1", Math.PI * 0.5, 0.18],
      [508, height - 500, height - 400, "longbrick3", Math.PI * 0.5, 0.18],
      [692, height - 500, height - 400, "longbrick3", Math.PI * 0.5, 0.18],
    ];
    this.mainBrickStart = [
      [1800, height - 110, 0.12],
      [1600, height - 310, 0.12],
      [1600, height - 150, 0.2],
    ];

    //spawn bricks
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);
    this.CreateUI();
  }
}
