import { AbstractCupScene } from "./BaseMagicCupsScene.ts";

export class Level3 extends AbstractCupScene {
  private cup1X = 200;
  private cup2X = -1 * this.cup1X;
  private cup3X = 2 * this.cup1X;
  constructor() {
    super("Level3");
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
    const leftRight = Math.floor(Math.random() * 2);
    if (leftRight == 0) {
      this.cup3X *= -1;
    }
    this.createCup(this, this.cup1X);
    this.createCup(this, this.cup2X);
    this.createCup(this, this.cup3X);
  }

  generateCandy() {
    this.destroyCandy();
    if (this.cup3X > 0) {
      this.createCandy(300);
      this.createCandy(-200);
    } else {
      this.createCandy(-300);
      this.createCandy(200);
    }
  }

  dropCandy() {
    if (this.cup3X > 0) {
      this.dropCover(300, "large-cover");
      this.dropCover(-200);
    } else {
      this.dropCover(-300, "large-cover");
      this.dropCover(200);
    }

    setTimeout(() => {
      const randCup = Math.floor(Math.random() * 2);
      if (this.cup3X > 0) {
        if (randCup == 0) {
          this.candies[0].x += 100;
        } else {
          this.candies[0].x -= 100;
        }
      } else {
        if (randCup == 0) {
          this.candies[0].x += 100;
        } else {
          this.candies[0].x -= 100;
        }
      }

      for (const candy of this.candies) {
        //this complains about being possibly null for me, it isn't, I think the interpreter is confused.
        candy.body.setAllowGravity(true);
      }
    }, 2000);
  }
}
