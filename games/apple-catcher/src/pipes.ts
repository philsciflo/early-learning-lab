import { AbstractCatcherScene } from "./scenes/AppleCatcherScene.ts";
import { BLUE, HALF_HEIGHT } from "./constants.ts";
import GameObjectWithDynamicBody = Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody;
import Body = Phaser.Physics.Arcade.Body;
import Point = Phaser.Geom.Point;
import Image = Phaser.GameObjects.Image;

/**
 * Render a vertical pipe
 */
export function renderVerticalPipe(
  scene: AbstractCatcherScene<unknown>,
  pipeCenter: number,
): undefined;
/**
 * Render a static image of a vertical pipe and return a reference to the image
 */
export function renderVerticalPipe(
  scene: AbstractCatcherScene<unknown>,
  pipeCenter: number,
  image: true,
): Image;
export function renderVerticalPipe(
  scene: AbstractCatcherScene<unknown>,
  pipeCenter: number,
  image?: boolean,
): Image | undefined {
  const pipeWidth = 80;
  const pipeHeight = 250;
  const pipeTop = image ? 0 : 280;
  const pipeLeft = image ? 0 : pipeCenter - pipeWidth / 2;
  const pipe = scene.add.graphics();
  pipe.setVisible(!image);
  pipe.setDefaultStyles({
    fillStyle: {
      color: BLUE,
    },
  });
  pipe.fillRect(pipeLeft, pipeTop, pipeWidth, pipeHeight);
  if (image) {
    pipe.generateTexture("vertical-pipe", pipeWidth, pipeHeight);

    return scene.add.image(0, HALF_HEIGHT + 25, "vertical-pipe");
  }
  return undefined;
}

/**
 * An image of a forked pipe with 'internal' physics capabilities that supports
 * being relocated horizontally
 */
export type ForkedPipe = {
  /**
   * Move the image and its internal physics elements
   */
  setX: (pos: number) => void;
};

/**
 * Render a forked pipe
 */
export function setupForkedPipe(
  scene: AbstractCatcherScene<unknown>,
  centerX: number,
  apple: GameObjectWithDynamicBody,
): undefined;
/**
 * Render a static image of a forked pipe and return a reference to it
 */
export function setupForkedPipe(
  scene: AbstractCatcherScene<unknown>,
  centerX: number,
  apple: GameObjectWithDynamicBody,
  image: true,
): ForkedPipe;
export function setupForkedPipe(
  scene: AbstractCatcherScene<unknown>,
  centerX: number,
  apple: GameObjectWithDynamicBody,
  image?: boolean,
): ForkedPipe | undefined {
  /*
    a randomised array of left and right directions for the apple; the sequence
    will repeat for all tries until the scene is stopped by navigating away,
    and navigating back to it will reset the sequence when create is called
    again. The purpose is to ensure that the apple doesn't fall the same side
    more than 3 times in a row
    */
  const appleDirections = [1, 1, 1, -1, -1, -1]
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  const pipeWidth = 80;
  const pipeTop = image ? 0 : 280;
  const pipeCenter = image ? 175 : centerX;

  const A =
    pipeCenter -
    100 * Math.tan(Math.PI / 4) -
    pipeWidth * Math.sin(Math.PI / 4); // top of left fork
  const B = pipeCenter - 100 * Math.tan(Math.PI / 4); // bottom of left fork
  const C = pipeCenter - pipeWidth / 2; // LHS of center pipe
  const D = pipeCenter + pipeWidth / 2; // RHS of center pipe
  const E = pipeCenter + 100 * Math.tan(Math.PI / 4); // left edge of right fork
  const F =
    pipeCenter +
    100 * Math.tan(Math.PI / 4) +
    pipeWidth * Math.sin(Math.PI / 4); // right edge of right fork

  const one = pipeTop;
  const two = one + 100;
  const three = two + pipeWidth / Math.sin(Math.PI / 4);
  const four = three + 60;
  const center = two + 80;

  const pipe = scene.add.graphics();
  pipe.setDefaultStyles({
    fillStyle: {
      color: BLUE,
    },
    lineStyle: { color: BLUE, width: 4 },
  });
  pipe.setVisible(!image);

  pipe.fillPoints(
    [
      new Point(C, one),
      new Point(C, two),
      new Point(A, three),
      new Point(B, four),
      new Point(pipeCenter, center),
      new Point(E, four),
      new Point(F, three),
      new Point(D, two),
      new Point(D, one),
    ],
    true,
    true,
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
  const directionTriggerPoint = scene.physics.add.staticSprite(
    centerX,
    431,
    "move",
  );
  // Sprites behave more sensibly than Shapes when being moved around, but we don't want to actually see this image...
  directionTriggerPoint.setVisible(false);

  scene.physics.add.collider(
    apple,
    directionTriggerPoint,
    (apple) => {
      const horizontalDirection =
        appleDirections[
          scene.registry.get(scene.triesDataKey) % appleDirections.length
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
  /*
    When the apple hits the bottom we want it to 'stick' instead of continuing
    to slide horizontally.
    */
  scene.physics.world.on("worldbounds", (body: Body) => {
    if (body === apple.body) {
      body.setVelocityX(0);
    }
  });

  if (image) {
    pipe.generateTexture("forked-pipe", 500, 300);

    const pipeImage = scene.add.image(0, HALF_HEIGHT + 50, "forked-pipe");
    return {
      setX(pos: number) {
        pipeImage.setX(pos);
        directionTriggerPoint.setX(pos - 75);
        directionTriggerPoint.refreshBody();
      },
    };
  }
  return undefined;
}
