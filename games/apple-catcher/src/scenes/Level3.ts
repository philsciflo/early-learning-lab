import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BLUE, BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import Point = Phaser.Geom.Point;
import { Level3ScoringData } from "../scoring.ts";

export class Level3 extends AbstractCatcherScene {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;
  private scoringData: Level3ScoringData[];

  constructor() {
    super(
      "Level3",
      '"Apple Catcher" - Level 3',
      "Place the basket to catch the apple!",
      "Level2",
      "Level4",
    );
  }

  init() {
    super.init();
    this.scoringData = [];
  }

  create() {
    super.create();
    this.setupBasket();
    this.setupApple();
    this.renderThreeForkedPipe();

    this.addCollisionHandling(this.basket, this.apple);
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.recordScoreDataForCurrentTry();
    this.resetBasket();
    this.resetApple();
  }

  protected getSceneScoringData() {
    if (this.registry.get(this.triesDataKey) > this.scoringData.length) {
      // capture the final score, if there was another try after the last reset,
      // but not otherwise
      this.recordScoreDataForCurrentTry();
    }
    return this.scoringData;
  }

  private recordScoreDataForCurrentTry() {
    this.scoringData.push({
      basket: {
        x: this.basket.x,
        y: this.basket.y,
      },
      score: this.apple.active ? 0 : 1,
    });
  }

  private renderThreeForkedPipe() {
    const pipeWidth = 80;
    const pipeTop = 280;

    const A =
      HALF_WIDTH -
      100 * Math.tan(Math.PI / 4) -
      pipeWidth * Math.sin(Math.PI / 4); // top of left fork
    const B = HALF_WIDTH - 100 * Math.tan(Math.PI / 4); // bottom of left fork
    const C = HALF_WIDTH - pipeWidth / 2; // LHS of center pipe
    const D = HALF_WIDTH + pipeWidth / 2; // RHS of center pipe
    const E = HALF_WIDTH + 100 * Math.tan(Math.PI / 4); // left edge of right fork
    const F =
      HALF_WIDTH +
      100 * Math.tan(Math.PI / 4) +
      pipeWidth * Math.sin(Math.PI / 4); // right edge of right fork

    const one = pipeTop;
    const two = one + 100;
    const three = two + 80 / Math.sin(Math.PI / 4);
    const four = three + 60;
    const five = three + 100;

    const pipe = this.add.graphics();
    pipe.setDefaultStyles({
      fillStyle: {
        color: BLUE,
      },
      lineStyle: { color: BLUE, width: 4 },
    });

    pipe.fillPoints(
      [
        new Point(C, one),
        new Point(C, two),
        new Point(A, three),
        new Point(B, four),
        new Point(C, three),
        new Point(C, five),
        new Point(D, five),
        new Point(D, three),
        new Point(E, four),
        new Point(F, three),
        new Point(D, two),
        new Point(D, one),
      ],
      true,
      true,
    );
  }

  private setupBasket() {
    this.basket = this.physics.add
      .staticSprite(HALF_WIDTH, BASKET_BOTTOM, "basket")
      .setInteractive({ draggable: true })
      .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
        this.basket.setPosition(dragX, dragY);
        this.basket.refreshBody();
      });
    this.resetBasket();
  }

  private resetBasket() {
    this.basket.setPosition(
      Phaser.Math.RND.pick([
        this.leftEdgeGameBound - 50,
        this.rightEdgeGameBound + 50,
      ]),
      BASKET_BOTTOM,
    );
    this.basket.refreshBody();
    this.basket.setInteractive();
  }

  private setupApple() {
    this.apple = this.physics.add
      .sprite(HALF_WIDTH, APPLE_TOP, "apple")
      .setDisplaySize(50, 50)
      .setCollideWorldBounds(true)
      .disableBody();
  }

  private resetApple() {
    if (this.apple.body) {
      // If we've already dropped then the apple will have gravity to remove, else it won't
      this.physics.world.disableBody(this.apple.body);
    }
    this.apple.body.reset(HALF_WIDTH, APPLE_TOP);
    this.apple.setVisible(true);
    this.apple.setActive(true);
  }
}
