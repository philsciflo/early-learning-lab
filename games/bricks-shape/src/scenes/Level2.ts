import { IndividualPlayerScene } from "./IndividualPlayerScene.ts";
import { BLACK, RED } from "../constants.ts";

export class Level2 extends IndividualPlayerScene {
  constructor() {
    super(
      "Level2",
      "Combo",
      '"Bricks Shape" - Level 2',
      "Build the target shape together! A can only move red bricks and B black!",
      "Level1PlayerB",
      "GameOver",
      4,
      4,
      [RED, BLACK],
    );
  }
}
