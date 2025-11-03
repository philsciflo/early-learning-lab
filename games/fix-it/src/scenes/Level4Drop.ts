import Phaser from "phaser";
import { DropScene } from "./DropScene";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_WIDTH, HEIGHT } from "../constants.ts";
import { AudioManager } from "../AudioManager";


export class Level4Drop extends DropScene {
  constructor() {
    super("Level4Drop", "Level4", "Observe!", "Level3");
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
      this.claw = this.matter.add.image(1200, 279, "claw", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.25);
      this.claw.setIgnoreGravity(true);
      this.claw.setStatic(true);
      this.claw.setCollidesWith([]);

      //gift
      this.fallBlock = this.matter.add.image(1200, 350, "gift", undefined, {
        isStatic: false,
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.gift
      }).setScale(0.2);
      this.fallBlock.setIgnoreGravity(true);
      this.fallBlock.setStatic(true);


      //claw 
      this.clawTwo = this.matter.add.image(430, 279, "claw", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.25);
      this.clawTwo.setIgnoreGravity(true);
      this.clawTwo.setStatic(true);
      this.clawTwo.setCollidesWith([]);

      //gift
      this.fallBlockTwo = this.matter.add.image(430, 350, "gift", undefined, {
        isStatic: false,
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.gift
      }).setScale(0.2);
      this.fallBlockTwo.setIgnoreGravity(true);
      this.fallBlockTwo.setStatic(true);
      this.fallBlockTwo.setFrictionAir(0);

      //blocks
      this.stone = this.matter.add.image(690, 890, "stone", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.2);
      this.stone.setIgnoreGravity(true);
      this.stone.setStatic(true);
      this.stone.setFrictionAir(0);

      this.triangleWoodv4 = this.matter.add.image(690, 720, "block", undefined, {
        friction: 0.5,
        restitution: 0.2,
      }).setScale(0.2);
      this.triangleWoodv4.setIgnoreGravity(true);
      this.triangleWoodv4.setStatic(true);
      this.triangleWoodv4.setFrictionAir(0);

      this.stoneCircle = this.matter.add.image(930, 890, "stone", undefined, {
        friction: 0.5,
        restitution: 0.2,
      }).setScale(0.21);
      this.stoneCircle.setIgnoreGravity(true);
      this.stoneCircle.setStatic(true);
      this.stoneCircle.setFrictionAir(0);

      this.longBlockOne = this.matter.add.image(1100, 720, "4block", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.2);
      this.longBlockOne.setIgnoreGravity(true);
      this.longBlockOne.setStatic(true);
      this.longBlockOne.setFrictionAir(0);

      this.woodLog = this.matter.add.image(550, 580, "woodLog", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.woodLog
      }).setScale(0.3, 0.2);
      this.woodLog.setIgnoreGravity(true);
      this.woodLog.setStatic(true);
      this.woodLog.setFrictionAir(0);

    }

    protected startPhysics() {
      this.createCollisionSound();
      this.fallBlock.setStatic(false);
      this.fallBlockTwo.setStatic(false);
      this.stone.setStatic(false);
      this.woodLog.setStatic(false);
      this.stoneCircle.setStatic(false);
      this.triangleWoodv4.setStatic(false);
      this.longBlockOne.setStatic(false);

      this.fallBlock.setIgnoreGravity(false);
      this.fallBlockTwo.setIgnoreGravity(false);
      this.stone.setIgnoreGravity(false);
      this.woodLog.setIgnoreGravity(false);
      this.stoneCircle.setIgnoreGravity(false);
      this.triangleWoodv4.setIgnoreGravity(false);
      this.longBlockOne.setIgnoreGravity(false);
      
      this.claw.setTexture("clawOpen"); // change to claw open
      this.clawTwo.setTexture("clawOpen"); // change to claw open

      this.time.delayedCall(3500, () => {
        this.restartButton.setVisible(false);
        this.nextSceneButton.setVisible(true);
      });
    }

}
