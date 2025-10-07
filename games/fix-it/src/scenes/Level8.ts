import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level8 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level8");
  }

  create() {
    super.create();
    const { width, height } = this.scale;

    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [400, height - 100, height, "triangle1", 0, 0.15],
      [400, height - 310, height - 270, "triangle2", Math.PI * 0.5, 0.15],
      [600, height - 100, height, "triangle2", Math.PI * 1.5, 0.15],
      [275, height - 170, height, "longbrick1", 0, 0.25],
      [725, height - 170, height, "longbrick1", 0, 0.25],
      [560, height - 480, height - 350, "longbrick3", Math.PI * 0, 0.2],
    ];
    this.mainBrickStart = [[1600, height - 120, 0.16]];
    //spawn bricks
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);
    this.matter.add.rectangle(810, height - 200, 25, 25, {
      isStatic: true,
      render: { visible: false },
      collisionFilter: {
        category: 0x0002,
        mask: 0xffffffff ^ 0x0001,
      },
    });
    this.matter.add.rectangle(190, height - 200, 25, 25, {
      isStatic: true,
      render: { visible: false },
      collisionFilter: {
        category: 0x0002,
        mask: 0xffffffff ^ 0x0001,
      },
    });
    this.CreateUI();
  }
}
