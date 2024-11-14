import { AbstractCatcherScene } from "./scenes/AppleCatcherScene.ts";
import { BLUE } from "./constants.ts";
import GameObjectWithDynamicBody = Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody;
import Body = Phaser.Physics.Arcade.Body;

export function renderVerticalPipe(
  scene: AbstractCatcherScene,
  centerX: number,
) {
  const pipeWidth = 80;
  const pipeHeight = 250;
  const pipeTop = 280;
  const pipeBottom = pipeTop + pipeHeight;
  const pipeLeft = centerX - pipeWidth / 2;
  const pipeRight = centerX + pipeWidth / 2;
  const pipe = scene.add.graphics();
  pipe.setDefaultStyles({
    fillStyle: {
      color: BLUE,
    },
    lineStyle: { color: BLUE, width: 4 },
  });
  pipe.lineBetween(pipeLeft, pipeTop, pipeLeft, pipeBottom);
  pipe.lineBetween(pipeRight, pipeTop, pipeRight, pipeBottom);
}

export function setupForkedPipe(
  scene: AbstractCatcherScene,
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
  const pipeStraightHeight = 125;
  const pipeForkHeight = 125;
  const pipeTop = 280;
  const pipeStraightBottom = pipeTop + pipeStraightHeight;
  const pipeForkInnerTop = pipeStraightBottom + pipeWidth;
  const pipeForkBottom = pipeStraightBottom + pipeForkHeight;
  const straightPipeLeft = centerX - pipeWidth / 2;
  const forkedPipeLeftLeft = straightPipeLeft - pipeWidth;
  const forkedPipeLeftRight = straightPipeLeft;
  const straightPipeRight = centerX + pipeWidth / 2;
  const forkedPipeRightLeft = straightPipeRight;
  const forkedPipeRightRight = straightPipeRight + pipeWidth;

  const pipe = scene.add.graphics();
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
    centerX,
    pipeForkInnerTop,
    forkedPipeLeftRight,
    pipeForkBottom,
  );

  // Right fork
  // Left / inner side of fork
  pipe.lineBetween(
    centerX,
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
  const directionTriggerPoint = scene.add.rectangle(
    centerX,
    pipeForkInnerTop - 25,
    1,
    1,
  );
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
