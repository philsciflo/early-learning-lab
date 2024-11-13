import { Scene } from "phaser";
import {
  BLACK,
  BLACK_STRING,
  BLUE,
  GAME_AREA_WIDTH,
  HALF_WIDTH,
  HEIGHT,
  ORANGE,
  SCORE_DATA_KEY,
  SIDE_ICON_WIDTH,
  TRIES_DATA_KEY,
} from "../constants.ts";
import { renderBanner, renderTextBanner } from "../banners.ts";
import Pointer = Phaser.Input.Pointer;
import Body = Phaser.Physics.Arcade.Body;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import Tile = Phaser.Tilemaps.Tile;
import GameObjectWithBody = Phaser.Types.Physics.Arcade.GameObjectWithBody;

const leftTreeLeft = SIDE_ICON_WIDTH + 10;
const rightTreeLeft = GAME_AREA_WIDTH - 160;

export class Level0 extends Scene {
  private basket: SpriteWithStaticBody;
  private apples: SpriteWithDynamicBody[] = [];

  constructor() {
    super("Level0");
  }

  preload() {
    this.load.image("tree", "assets/tree.png");
    this.load.image("apple", "assets/apple.png");
    this.load.image("basket", "assets/basket.png");
  }

  init() {
    this.registry.set(SCORE_DATA_KEY, 0);
    this.registry.set(TRIES_DATA_KEY, 0);
  }

  create() {
    this.renderStaticBackgroundItems();
    this.renderDynamicNumbers();

    this.renderGameButtons();

    this.setupApples();
    this.setupBasket();

    this.physics.add.collider(
      this.basket,
      this.apples,
      (
        _basket: Body | Tile | GameObjectWithBody,
        apple: Body | Tile | GameObjectWithBody,
      ) => {
        (apple as SpriteWithDynamicBody).disableBody(true, true);
        this.registry.inc(SCORE_DATA_KEY, 1);
      },
      (
        basket: Body | Tile | GameObjectWithBody,
        apple: Body | Tile | GameObjectWithBody,
      ) => {
        // Don't process collisions when the apple has already hit the floor,
        // or if the basket is hitting the apple from the top or side; it must be below
        // or if the apple is not active i.e. already been collected
        const theBasket = basket as SpriteWithStaticBody;
        const theApple = apple as SpriteWithDynamicBody;
        return (
          !theApple.body.onFloor() &&
          theApple.y < theBasket.y &&
          theApple.active
        );
      },
      this,
    );
  }

  private setupBasket() {
    if (!this.basket) {
      this.basket = this.physics.add
        .staticSprite(HALF_WIDTH, 700, "basket")
        .setInteractive({ draggable: true })
        .on("drag", (_pointer: Pointer, dragX: number, dragY: number) => {
          this.basket.setPosition(dragX, dragY);
          this.basket.refreshBody();
        });
    }
    this.basket.setPosition(
      Phaser.Math.Between(leftTreeLeft + 200, rightTreeLeft),
      700,
    );
    this.basket.refreshBody();
  }

  private setupApples() {
    if (this.apples.length === 0) {
      for (let appleCount = 0; appleCount < 5; appleCount++) {
        this.apples.push(
          this.physics.add
            .sprite(350 + appleCount * 80, 200, "apple")
            .setDisplaySize(50, 50)
            .setCollideWorldBounds(true)
            .disableBody(),
        );
      }
    } else {
      this.apples.forEach((apple: SpriteWithDynamicBody, index: number) => {
        if (apple.body) {
          // If we've already dropped then apples will have gravity to remove, else they won't
          this.physics.world.disableBody(apple.body);
        }
        apple.body.reset(350 + index * 80, 200);
        apple.setVisible(true);
        apple.setActive(true);
      });
    }

    // Randomise the apples, so the order in the array isn't the order on screen
    this.apples = this.apples
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  private renderDynamicNumbers() {
    const triesText = this.add.text(
      SIDE_ICON_WIDTH + 30,
      270,
      `Tries: ${this.registry.get(TRIES_DATA_KEY)}`,
      {
        fontFamily: "Arial",
        fontSize: 25,
        color: BLACK_STRING,
        align: "left",
      },
    );

    this.registry.events.on(
      `changedata-${TRIES_DATA_KEY}`,
      (_parent: never, newValue: number) => {
        triesText.setText(`Tries: ${newValue}`);
      },
    );

    const scoreText = this.add.text(
      GAME_AREA_WIDTH - 130,
      270,
      `Score: ${this.registry.get(SCORE_DATA_KEY)}`,
      {
        fontFamily: "Arial",
        fontSize: 25,
        color: BLACK_STRING,
        align: "left",
      },
    );
    this.registry.events.on(
      `changedata-${SCORE_DATA_KEY}`,
      (_parent: never, newValue: number) =>
        scoreText.setText(`Score: ${newValue}`),
    );
  }

  private renderStaticBackgroundItems() {
    renderTextBanner(
      this,
      {
        y: 10,
        height: 45,
        backgroundColour: BLUE,
      },
      { text: '"Apple Catcher" - Level 0', y: 15 },
    );

    this.add
      .text(HALF_WIDTH, 70, "Catch as many apples as you can!", {
        fontFamily: "Arial",
        fontSize: 25,
        color: BLACK_STRING,
        align: "center",
      })
      .setOrigin(0.5, 0);

    renderBanner(this, {
      x: SIDE_ICON_WIDTH,
      y: 110,
      width: GAME_AREA_WIDTH,
      height: HEIGHT - 118,
    });

    this.add
      .image(leftTreeLeft, 300, "tree")
      .setOrigin(0, 0)
      .setDisplaySize(200, 300);

    this.add
      .image(rightTreeLeft, 300, "tree")
      .setOrigin(0, 0)
      .setDisplaySize(200, 300);
  }

  private renderGameButtons() {
    const buttonY = 400;
    const buttonWidth = 100;
    const buttonHeight = 50;

    const dropButton = this.add.graphics();
    dropButton.lineStyle(2, BLACK);
    dropButton.fillStyle(ORANGE);

    const dropLeft = rightTreeLeft + 50;
    dropButton.fillRoundedRect(dropLeft, buttonY, buttonWidth, buttonHeight, 5);
    dropButton.strokeRoundedRect(
      dropLeft,
      buttonY,
      buttonWidth,
      buttonHeight,
      5,
    );

    dropButton.setInteractive(
      new Phaser.Geom.Rectangle(dropLeft, buttonY, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains,
    );

    dropButton.on("pointerdown", () => {
      this.registry.inc(TRIES_DATA_KEY, 1);
      dropButton.disableInteractive();
      // Every half a second enable gravity on an apple that doesn't already have it, until there are no more apples
      const dropInterval = setInterval(() => {
        const applesWithoutGravity = this.apples.filter(
          (apple) => !apple.body || !(apple.body as Body).enable,
        );
        if (applesWithoutGravity.length === 0) {
          clearInterval(dropInterval);
        } else {
          this.physics.world.enableBody(applesWithoutGravity[0]);
        }
      }, 500);
    });

    this.add
      .text(dropLeft + 50, buttonY + 8, "Drop", {
        fontFamily: "Arial",
        fontSize: 30,
        color: BLACK_STRING,
        align: "center",
      })
      .setOrigin(0.5, 0);

    const resetButton = this.add.graphics();
    resetButton.lineStyle(2, BLACK);
    resetButton.fillStyle(ORANGE);

    const resetLeft = leftTreeLeft + 50;
    resetButton.fillRoundedRect(
      resetLeft,
      buttonY,
      buttonWidth,
      buttonHeight,
      5,
    );
    resetButton.strokeRoundedRect(
      resetLeft,
      buttonY,
      buttonWidth,
      buttonHeight,
      5,
    );
    this.add
      .text(resetLeft + 50, buttonY + 8, "Reset", {
        fontFamily: "Arial",
        fontSize: 30,
        color: BLACK_STRING,
        align: "center",
      })
      .setOrigin(0.5, 0);

    resetButton.setInteractive(
      new Phaser.Geom.Rectangle(resetLeft, buttonY, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains,
    );

    resetButton.on("pointerdown", () => {
      this.setupApples();
      this.setupBasket();
      dropButton.setInteractive();
    });
  }
}
