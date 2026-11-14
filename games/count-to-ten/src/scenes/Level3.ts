import { NumberOrderScene } from "./NumberOrderScene.ts";

/** Level 3: "Put the numbers in order" over the range 6-10 - identical
 * mechanic to Level2, just a higher range and the final stage in this
 * game's flow (Continue goes to GameOver). See NumberOrderScene.ts for
 * the shared drag/drop/slot mechanic. */
export class Level3 extends NumberOrderScene {
  constructor() {
    super({
      sceneKey: "Level3",
      min: 6,
      max: 10,
      backSceneKey: "Level2",
      continueSceneKey: "GameOver",
    });
  }
}
