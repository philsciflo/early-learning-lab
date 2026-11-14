import { NumberOrderScene } from "./NumberOrderScene.ts";

/** Level 2: "Put the numbers in order" over the range 1-5. See
 * NumberOrderScene.ts for the shared drag/drop/slot mechanic - this
 * class only supplies the number range and its neighbours in the
 * MainMenu -> Level1 -> Level2 -> Level3 -> GameOver flow. */
export class Level2 extends NumberOrderScene {
  constructor() {
    super({
      sceneKey: "Level2",
      min: 1,
      max: 5,
      backSceneKey: "Level1",
      continueSceneKey: "Level3",
    });
  }
}
