import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level5 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level5");
  }

  create() {
    super.create();
    const { width, height } = this.scale;
    this.CreateUI();
    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [388, height - 145, height, "brick2", Math.PI * 1, 0.2],
      [560, height - 115, height, "triangle1", 0, 0.2],
      [520, height - 335, height - 300, "longbrick1", Math.PI * 0.5, 0.3],
    ];
    this.mainBrickStart = [[1600, height - 130, 0.18]];

    //spawn bricks
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);
  }
}
