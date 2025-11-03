// import Phaser from "phaser";
import { DropScene } from "./DropScene";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_WIDTH, HEIGHT } from "../constants.ts";
import { MainMenu } from "./MainMenu.ts";
import { AudioManager } from "../AudioManager";

export class Level1Drop extends DropScene {
  constructor() {
    super("Level1Drop", "Level1", "Observe!", "MainMenu");
  }

  preload() {
    super.preload();
  }

    create() {
      var shapes = this.cache.json.get('shapes'); //for the physics mapping

      //Background and UI elements + Setting up the physics envrioment
      this.createBackground();
      this.createButtons();
      this.renderNavigationButtons();
      this.matter.world.setBounds();
      this.groundv2 = this.matter.add.image(HALF_WIDTH, HEIGHT - 48, "groundv2", undefined, { isStatic: true }).setDisplaySize(this.scale.width + 58, 120 );

      //Setting up the layout for the level
      //claw 
      this.claw = this.matter.add.image(1100, 279, "claw", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.25);
      this.claw.setIgnoreGravity(true);
      this.claw.setStatic(true);
      this.claw.setCollidesWith([]);
      

      //Blocks
      this.blockOne = this.matter.add.image(600, 725, "block", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.2);
      this.blockOne.setIgnoreGravity(true);
      this.blockOne.setStatic(true);
      this.blockOne.setFrictionAir(0);

      this.blockTwo = this.matter.add.image(600, 890, "stone", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.2);
      this.blockTwo.setIgnoreGravity(true);
      this.blockTwo.setStatic(true);
      this.blockTwo.setFrictionAir(0);

      this.longBlockOne = this.matter.add.image(600 + 250, 560, "4block", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.2);
      this.longBlockOne.setIgnoreGravity(true);
      this.longBlockOne.setStatic(true);
      this.longBlockOne.setFrictionAir(0);

      this.fallBlock = this.matter.add.image(1100, 350, "gift", undefined, {
        isStatic: false,
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.gift
      }).setScale(0.2);
      this.fallBlock.setIgnoreGravity(true);
      this.fallBlock.setStatic(true);
      this.fallBlock.setFrictionAir(0);

      const uiScene = this.scene.get("UIScene") as UIScene;
      uiScene.scene.bringToTop();  
      uiScene.createLevelButtons();
    }
      

    protected startPhysics() {
      this.createCollisionSound(); 
      this.blockOne.setStatic(false);
      this.blockTwo.setStatic(false);
      this.longBlockOne.setStatic(false);
      this.fallBlock.setStatic(false);

      this.fallBlock.setIgnoreGravity(false);
      this.longBlockOne.setIgnoreGravity(false);
      this.blockOne.setIgnoreGravity(false);
      this.blockTwo.setIgnoreGravity(false);  
      

      this.claw.setTexture("clawOpen"); // change to claw open

      this.time.delayedCall(3500, () => {
        this.restartButton.setVisible(false);
        this.nextSceneButton.setVisible(true);
      });
    }

}
