import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import { BLUE, BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import Point = Phaser.Geom.Point;
import { Level3ScoringData } from "../scoring.ts";

export class Level3Drop extends AbstractCatcherScene<Level3ScoringData> {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;

  constructor() {
    super(
      "Level3Drop",
      '"Apple Drop" - Level 3',
      "Place the basket to catch the apple!",
      "Level2Drop",
      "Level4Drop",
    );
    this.hideDropButton = true;
  }

  create() {
    super.create();
    this.setupBasket();
    this.setupApple();
    this.renderThreeForkedPipe();
    this.nextSceneKey = "Level4Drop";

    this.addCollisionHandling(this.basket, this.apple);
  }

  protected doReset(): void {
    this.resetBasket();
    this.resetApple();
  }

  protected recordScoreDataForCurrentTry(): Level3ScoringData {
    return {
      basket: {
        x: this.basket.x,
        y: this.basket.y,
      },
      score: this.currentScore > 0 ? 1 : 0,
    };
  }

  private renderThreeForkedPipe() {
    const pipeX = HALF_WIDTH;  // center X
    const pipeY = 220;         // align top Y
    const pipeImage = this.add.image(pipeX, pipeY, "pipe3");
    pipeImage.setOrigin(0.5, 0);
    pipeImage.setScale(0.8);
  }

  private setupBasket() {
    this.basket = this.physics.add
      .staticSprite(HALF_WIDTH, BASKET_BOTTOM, "basket")
      .setInteractive({ draggable: true })
      .setScale(1.3,1)
      .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
        this.basket.setPosition(dragX, dragY);
        this.basket.refreshBody();
      });
    this.resetBasket();
  }

  private resetBasket() {
    const pipeWidth = 80;
    const HALF_PI = Math.PI / 4;

    const A =
      HALF_WIDTH - 100 * Math.tan(HALF_PI) - pipeWidth * Math.sin(HALF_PI);
    const B = HALF_WIDTH - 100 * Math.tan(HALF_PI);
    const C = HALF_WIDTH - pipeWidth / 2;
    const D = HALF_WIDTH + pipeWidth / 2;
    const E = HALF_WIDTH + 100 * Math.tan(HALF_PI);
    const F =
      HALF_WIDTH + 100 * Math.tan(HALF_PI) + pipeWidth * Math.sin(HALF_PI);

    const pipeExitPositions = [
      B, // left pipe center
      (C + D) / 2, // center pipe center
      (E + F) / 2, // right pipe center
    ];

    const chosenX = Phaser.Math.RND.pick(pipeExitPositions);
    this.basket.setPosition(chosenX, BASKET_BOTTOM);
    this.basket.refreshBody();
    this.basket.setInteractive();
  }

  private setupApple() {
    const appleX = this.rightTreeLeft + 100;
    const appleY = 415;

    this.apple = this.physics.add
      .sprite(appleX, appleY, "apple")
      .setDisplaySize(50, 50)
      .setCollideWorldBounds(true)
      .disableBody();

    this.apple.setInteractive({ draggable: true });
    this.input.setDraggable(this.apple);

    this.apple.on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
      this.apple.setPosition(dragX, dragY);
    });
    this.apple.on("dragend", () => {
      this.physics.world.enableBody(this.apple);
      this.apple.disableInteractive();
    });
  }

  private resetApple() {
    if (this.apple.body) {
      this.physics.world.disableBody(this.apple.body);
    }

    const appleX = this.rightTreeLeft + 100;
    const appleY = 415;

    this.apple.body.reset(appleX, appleY);
    this.apple.setVisible(true);
    this.apple.setActive(true);

    this.apple.setData("inPipe", false);

    this.apple.setInteractive({ draggable: true });
    this.input.setDraggable(this.apple);
  }
  update() {
    const pipeEntryXMin = HALF_WIDTH - 60;
    const pipeEntryXMax = HALF_WIDTH + 60;
    const pipeEntryY = 420;

    if (
      this.apple.active &&
      this.apple.y > pipeEntryY &&
      this.apple.x >= pipeEntryXMin &&
      this.apple.x <= pipeEntryXMax &&
      !this.apple.getData("inPipe")
    ) {
      this.apple.setData("inPipe", true);

      this.apple.setVisible(false);
      this.apple.disableBody(true, true);

      const exits = [
        { x: HALF_WIDTH - 140, y: 500 },
        { x: HALF_WIDTH, y: 500 },
        { x: HALF_WIDTH + 140, y: 500 },
      ];
      const chosen = Phaser.Math.RND.pick(exits);

      this.time.delayedCall(500, () => {
        this.apple.enableBody(true, chosen.x, chosen.y, true, true);
        this.apple.setVisible(true);
        this.apple.setVelocity(0, 100);
      });
    }
  }
}
