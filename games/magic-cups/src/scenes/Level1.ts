import { AbstractCupScene } from "./BaseMagicCupsScene.ts";

export class Level1 extends AbstractCupScene {
  private cup1X = 0;
  constructor() {
    super("Level1");
  }

  create() {
    super.create();
    this.CreateUI(this.scene.key);
    // Create some cups and the UI
    this.generateCups();
    this.generateCandy();
  }

  generateCandy() {
    this.destroyCandy();
    this.createCandy(this.cup1X);
  }

  generateCups() {
    this.destroyCups();
    this.createCup(this, this.cup1X);
  }

  dropCandy() {
    this.dropCover(0);
    setTimeout(() => {
      for (const candy of this.candies) {
        //this complains about being possibly null for me, it isn't, I think the interpreter is confused.
        candy.body.setAllowGravity(true);
      }
    }, 2000);
  }
}
