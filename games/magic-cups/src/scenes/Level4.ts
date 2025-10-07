import { AbstractCupScene } from "./BaseMagicCupsScene.ts";
import { Cup } from "../Cup.ts";
import ImageWithDynamicBody = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

export class Level4 extends AbstractCupScene {
  private cup1X = -400;
  private cup2X = -200;
  private cup3X = 200;
  private cup4X = 400;
  constructor() {
    super("Level4");
  }

  create() {
    super.create();
    this.CreateUI(this.scene.key);

    //Create cups
    this.generateCups();
    this.generateCandy();
  }

  generateCups() {
    this.destroyCups();
    this.createCup(this, this.cup1X);
    this.createCup(this, this.cup2X);
    this.createCup(this, this.cup3X);
    this.createCup(this, this.cup4X);
  }

  generateCandy() {
    this.destroyCandy();
    this.createCandy(300);
    this.createCandy(-300);
  }

  dropCandy() {
    this.dropCover(300, "large-cover");
    this.dropCover(-300, "large-cover");
    let candyLeft;
    let candyRight;

    setTimeout(() => {
      const randCup = Math.floor(Math.random() * 2);

      if (this.candies[0].x == this.width / 2 - 300) {
        candyLeft = this.candies[0];
        candyRight = this.candies[1];
      } else {
        candyLeft = this.candies[1];
        candyRight = this.candies[0];
      }
      if (randCup == 0) {
        candyLeft.x -= 100;
      } else {
        candyLeft.x += 100;
      }
      const randCup2 = Math.floor(Math.random() * 2);
      if (randCup2 == 0) {
        candyRight.x -= 100;
      } else {
        candyRight.x += 100;
      }

      for (const candy of this.candies) {
        //this complains about being possibly null for me, it isn't, I think the interpreter is confused.
        candy.body.setAllowGravity(true);
      }
    }, 2000);

    setTimeout(() => {
      let tippedCup: number;
      let randCup3: number;
      const locations = [this.cup1X, this.cup2X, this.cup3X, this.cup4X];
      do {
        randCup3 = Math.floor(Math.random() * 4);
        tippedCup = this.width / 2 + locations[randCup3];
      } while (tippedCup == candyLeft.x || tippedCup == candyRight.x);

      for (const cup of this.cups) {
        if (cup[0].x == tippedCup) {
          this.tweensWorking.push(true);
          this.movingCup = [cup[0] as Cup, cup[1] as ImageWithDynamicBody];
          this.frameCount = 0;
        }
      }
    }, 6000);
  }
}
