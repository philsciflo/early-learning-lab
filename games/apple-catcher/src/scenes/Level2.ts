import { AbstractCatcherScene } from "./AppleCatcherScene.ts";
import { BLUE, BASKET_BOTTOM, HALF_WIDTH, APPLE_TOP } from "../constants.ts";
import Pointer = Phaser.Input.Pointer;
import SpriteWithStaticBody = Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import GameObjectWithDynamicBody = Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody;
import Body = Phaser.Physics.Arcade.Body;

export class Level2 extends AbstractCatcherScene {
  private basket: SpriteWithStaticBody;
  private apple: SpriteWithDynamicBody;
  private appleDirections: number[];

  constructor() {
    super(
      "Level2",
      '"Apple Catcher" - Level 2',
      "Place the basket to catch the apple!",
      "Level1",
      "Level3",
    );
  }

  create() {
    super.create();
    /*
     a randomised array of left and right directions for the apple; the sequence
     will repeat for all tries until the scene is stopped by navigating away,
     and navigating back to it will reset the sequence when create is called
     again. The purpose is to ensure that the apple doesn't fall the same side
     more than 3 times in a row
     */
    this.appleDirections = [1, 1, 1, -1, -1, -1]
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    this.setupBasket();
    this.setupApple();
    this.setupForkedPipe();

    this.addCollisionHandling(this.basket, this.apple);
  }

  protected doDrop(): void {
    this.physics.world.enableBody(this.apple);
    this.apple.body.setAllowGravity(true);
    this.basket.disableInteractive();
  }

  protected doReset(): void {
    this.resetBasket();
    this.resetApple();
  }

  private setupForkedPipe() {
    const pipeWidth = 80;
    const pipeStraightHeight = 125;
    const pipeForkHeight = 125;
    const pipeTop = 280;
    const pipeStraightBottom = pipeTop + pipeStraightHeight;
    const pipeForkInnerTop = pipeStraightBottom + pipeWidth;
    const pipeForkBottom = pipeStraightBottom + pipeForkHeight;
    const straightPipeLeft = HALF_WIDTH - pipeWidth / 2;
    const forkedPipeLeftLeft = straightPipeLeft - pipeWidth;
    const forkedPipeLeftRight = straightPipeLeft;
    const straightPipeRight = HALF_WIDTH + pipeWidth / 2;
    const forkedPipeRightLeft = straightPipeRight;
    const forkedPipeRightRight = straightPipeRight + pipeWidth;
    const pipeCenter = HALF_WIDTH;
    const pipe = this.add.graphics();
    pipe.setDefaultStyles({
      fillStyle: {
        color: BLUE,
      },
      lineStyle: { color: BLUE, width: 4 },
    });

    // Vertical pipe segment
    // Left vertical line
    pipe.lineBetween(
      straightPipeLeft,
      pipeTop,
      straightPipeLeft,
      pipeStraightBottom,
    );
    // Right vertical line
    pipe.lineBetween(
      straightPipeRight,
      pipeTop,
      straightPipeRight,
      pipeStraightBottom,
    );

    // Left Fork
    // Left / outer side of fork
    pipe.lineBetween(
      straightPipeLeft,
      pipeStraightBottom,
      forkedPipeLeftLeft,
      pipeForkInnerTop,
    );

    // Right / inner side of fork
    pipe.lineBetween(
      pipeCenter,
      pipeForkInnerTop,
      forkedPipeLeftRight,
      pipeForkBottom,
    );

    // Right fork
    // Left / inner side of fork
    pipe.lineBetween(
      pipeCenter,
      pipeForkInnerTop,
      forkedPipeRightLeft,
      pipeForkBottom,
    );
    // Right / outer side of fork
    pipe.lineBetween(
      straightPipeRight,
      pipeStraightBottom,
      forkedPipeRightRight,
      pipeForkInnerTop,
    );

    /*
     So, unfortunately the 'simple' Arcade Physics model only deals with boxes,
     it can't handle other shapes/directions, so we can't make the bottom sides
     of the pipe physics objects and have the apple automagically slide or roll
     down them; once the apple hits a flat-topped box it will just _stop_.
     Instead, we have a 'hidden' point in the middle of the pipe and once the
     apple hits the pipe we temporarily turn off gravity and manually move the
     apple to the side and down. After a short time we assume the apple has left
     the pipe and reinstate gravity and reduce the horizontal velocity so that
     the apple continues to fall more naturally.
     */

    const directionTriggerPoint = this.add.rectangle(
      pipeCenter,
      pipeForkInnerTop - 25,
      1,
      1,
    );
    this.physics.add.existing(directionTriggerPoint, true);

    this.physics.add.collider(
      this.apple,
      directionTriggerPoint,
      (apple) => {
        const horizontalDirection =
          this.appleDirections[
            this.registry.get(this.triesDataKey) % this.appleDirections.length
          ];
        const applePhysicsBody = (apple as GameObjectWithDynamicBody).body;
        applePhysicsBody.setAllowGravity(false);
        applePhysicsBody.setVelocityX(100 * horizontalDirection);
        applePhysicsBody.setVelocityY(100);
        setTimeout(() => {
          applePhysicsBody.setVelocityX(applePhysicsBody.velocity.x || 2 / 2);
          applePhysicsBody.setAllowGravity(true);
        }, 500);
      },
      (apple) => {
        // Once we've overridden the velocity, don't track further interactions
        return (apple as GameObjectWithDynamicBody).body.velocity.x === 0;
      },
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
      Phaser.Math.Between(this.leftEdgeGameBound, this.rightEdgeGameBound),
      BASKET_BOTTOM,
    );
    this.basket.refreshBody();
    this.basket.setInteractive();
  }

  private setupApple() {
    this.apple = this.physics.add
      .sprite(HALF_WIDTH, APPLE_TOP, "apple")
      .setDisplaySize(50, 50)
      .setCollideWorldBounds(true, 0, 0, true)
      .disableBody();
    this.resetApple();
  }

  private resetApple() {
    if (this.apple.body) {
      // If we've already dropped then the apple will have gravity to remove, else it won't
      this.physics.world.disableBody(this.apple.body);
    }
    this.apple.body.reset(HALF_WIDTH, APPLE_TOP);
    this.apple.setVisible(true);
    this.apple.setActive(true);
    /*
     When the apple hits the bottom we want it to 'stick' instead of continuing
     to slide horizontally.
     */
    this.apple.body.world.once("worldbounds", (body: Body) => {
      if (body === this.apple.body) {
        body.setVelocityX(0);
      }
    });
  }
}
