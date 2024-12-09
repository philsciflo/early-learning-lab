import { IndividualPlayerScene } from "./IndividualPlayerScene.ts";
import { AQUA, FUSCHIA, LIME, ORANGE, RED, YELLOW } from "../constants.ts";

export class Level1PlayerB extends IndividualPlayerScene {
  constructor() {
    super(
      "Level1PlayerB",
      "PlayerB",
      '"Bricks Shape" - Level 1',
      "Player B build the target shape!",
      "Level1PlayerA",
      "Level2",
      2,
      3,
      [FUSCHIA, AQUA, LIME, YELLOW, RED, ORANGE],
    );
  }
}
