import { IndividualPlayerScene } from "./IndividualPlayerScene.ts";

export class Level1PlayerA extends IndividualPlayerScene {
  constructor() {
    super(
      "Level1PlayerA",
      "PlayerA",
      '"Bricks Shape" - Level 1',
      "Player A build the target shape!",
      "MainMenu",
      "Level1PlayerB",
    );
  }
}
