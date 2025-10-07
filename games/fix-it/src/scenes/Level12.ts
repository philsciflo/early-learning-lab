import { LevelBaseScene } from "./LevelBaseScene.ts";

export class Level12 extends LevelBaseScene {
  private brickCoords: [number, number, number, string, number, number][] = [];
  private mainBrickStart: [number, number, number][] = [];
  constructor() {
    super("Level12");
  }

  create() {
    super.create();
    const { width, height } = this.scale;
    //set beginning coords
    //x, y, y value brick must remain above for win condition, brick sprite, rotation (rad), size
    this.brickCoords = [
      [300, height - 305, height - 200, "longbrick1", 0, 0.3],
      [900, height - 305, height - 200, "longbrick1", 0, 0.3],
      [410, height - 545, height - 400, "longbrick1", Math.PI * 0.5, 0.31],
      [790, height - 545, height - 400, "longbrick1", Math.PI * 0.5, 0.31],
      [600, height - 210, height - 150, "longbrick3", 0, 0.11],
      [600, height - 100, height, "longbrick3", 0, 0.09],
      [470, height - 90, height, "triangle1", Math.PI * 0.75, 0.16],
      [730, height - 90, height, "triangle2", Math.PI * 0.75, 0.16],
      [282, height - 675, height - 120, "semicircle", 0, 0.15],
      [918, height - 675, height - 120, "semicircle", 0, 0.15],
      [600, height - 800, height - 300, "longbrick3", 0, 0.3],
    ];
    this.mainBrickStart = [
      [1600, height - 290, 0.105],
      [1600, height - 145, 0.19],
      [1800, height - 145, 0.19],
      [1700, height - 290, 0.105],
      [1800, height - 290, 0.105],
    ];

    //spawn bricks
    this.createBricks(this.brickCoords);
    this.createMainBricks(this.mainBrickStart);
    this.CreateUI();
    this.matter.add.rectangle(192, height - 150, 25, 25, {
      isStatic: true,
      render: { visible: true },
      collisionFilter: {
        category: 0x0002,
        mask: 0xffffffff ^ 0x0001,
      },
    });
    this.matter.add.rectangle(1000, height - 150, 25, 25, {
      isStatic: true,
      render: { visible: true },
      collisionFilter: {
        category: 0x0002,
        mask: 0xffffffff ^ 0x0001,
      },
    });
    this.matter.add.rectangle(795, height - 135, 25, 25, {
      isStatic: true,
      render: { visible: true },
      collisionFilter: {
        category: 0x0002,
        mask: 0xffffffff ^ 0x0001,
      },
    });
    this.matter.add.rectangle(405, height - 135, 25, 25, {
      isStatic: true,
      render: { visible: true },
      collisionFilter: {
        category: 0x0002,
        mask: 0xffffffff ^ 0x0001,
      },
    });
  }
}
