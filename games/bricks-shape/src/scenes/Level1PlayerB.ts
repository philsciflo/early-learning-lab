import { IndividualPlayerScene } from "./IndividualPlayerScene.ts";

export class Level1PlayerB extends IndividualPlayerScene {
  constructor() {
    super(
      "Level1PlayerB",
      "PlayerB",
      '"Bricks Shape" - Level 1',
      "Player B build the target shape!",
      "Level1PlayerA",
      "Level2",
    );
  }
}
