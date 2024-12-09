import { IndividualPlayerScene } from "./IndividualPlayerScene.ts";
import { AQUA, FUSCHIA, LIME, ORANGE, RED, YELLOW } from "../constants.ts";

export class Level1PlayerA extends IndividualPlayerScene {
  constructor() {
    super(
      "Level1PlayerA",
      "PlayerA",
      '"Bricks Shape" - Level 1',
      "Player A build the target shape!",
      "MainMenu",
      "Level1PlayerB",
      2,
      3,
      [FUSCHIA, AQUA, LIME, YELLOW, RED, ORANGE],
    );
  }
}
