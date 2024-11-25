import { AbstractCatcherScene } from "./scenes/AppleCatcherScene.ts";
import { BLUE } from "./constants.ts";
import GameObjectWithDynamicBody = Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody;
import Body = Phaser.Physics.Arcade.Body;
import Point = Phaser.Geom.Point;

export function renderVerticalPipe(
  scene: AbstractCatcherScene<unknown>,
  centerX: number,
) {
  const pipeWidth = 80;
  const pipeHeight = 250;
  const pipeTop = 280;
  const pipeLeft = centerX - pipeWidth / 2;
  const pipe = scene.add.graphics();
  pipe.setDefaultStyles({
    fillStyle: {
      color: BLUE,
    },
  });
  pipe.fillRect(pipeLeft, pipeTop, pipeWidth, pipeHeight);
}

export function setupForkedPipe(
  scene: AbstractCatcherScene<unknown>,
  centerX: number,
  apple: GameObjectWithDynamicBody,
) {
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
  const pipeTop = 280;

  const A =
    centerX - 100 * Math.tan(Math.PI / 4) - pipeWidth * Math.sin(Math.PI / 4); // top of left fork
  const B = centerX - 100 * Math.tan(Math.PI / 4); // bottom of left fork
  const C = centerX - pipeWidth / 2; // LHS of center pipe
  const D = centerX + pipeWidth / 2; // RHS of center pipe
  const E = centerX + 100 * Math.tan(Math.PI / 4); // left edge of right fork
  const F =
    centerX + 100 * Math.tan(Math.PI / 4) + pipeWidth * Math.sin(Math.PI / 4); // right edge of right fork

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

  pipe.fillPoints(
    [
      new Point(C, one),
      new Point(C, two),
      new Point(A, three),
      new Point(B, four),
      new Point(centerX, center),
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
  const directionTriggerPoint = scene.add.rectangle(centerX, 456 - 25, 1, 1);
  scene.physics.add.existing(directionTriggerPoint, true);

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
}
