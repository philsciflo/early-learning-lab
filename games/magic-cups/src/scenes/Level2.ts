import { AbstractCupScene } from "./BaseMagicCupsScene.ts";
import destroy = Phaser.Loader.FileTypesManager.destroy;

export class Level2 extends AbstractCupScene {
  private cup1X = 200;
  private cup2X = 0;
  private cup3X = -1 * this.cup1X;
  private dragObject;
  constructor() {
    super("Level2");
  }

  create() {
    super.create();
    this.CreateUI(this.scene.key, "Hide the Candy!");

    // Create some cups
    this.generateCups();
    this.generateCandy();
  }

  generateCandy() {
    this.destroyCandy();
    this.createCandy(this.cup2X);
    this.candies[0].setInteractive({ draggable: true });
    this.input.setDraggable(this.candies[0]);
    this.input.on("drag", (_pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
  }

  generateCups() {
    this.destroyCups();
    this.createCup(this, this.cup1X);
    this.createCup(this, this.cup2X);
    this.createCup(this, this.cup3X);
  }

  protected dropCandy(){
    for (const candy of this.candies) {
      //this complains about being possibly null for me, it isn't, I think the interpreter is confused.
      candy.body.setAllowGravity(true);
    }

    this.candiesDropped = true;

    let text: Phaser.GameObjects.Text;
    setTimeout(() => {
      text = this.add.text(
        this.width / 2,
        this.height / 2 - 300,
        "Where should Hoiho look\nfor the candy?",
        {
          fontFamily: "Arial Black",
          fontSize: 40,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
          align: "center",
        })
    }, 2000);
    setTimeout(() => {
      text.destroy();
    }, 7000);
  }
}
