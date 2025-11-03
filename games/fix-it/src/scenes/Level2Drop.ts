import Phaser from "phaser";
import { DropScene } from "./DropScene";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_WIDTH, HEIGHT } from "../constants.ts";
import { AudioManager } from "../AudioManager";


export class Level2Drop extends DropScene{
  constructor() {
    super("Level2Drop", "Level2", "Observe!", "Level1");
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
      this.claw = this.matter.add.image(950, 279, "claw", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.25);
      this.claw.setIgnoreGravity(true);
      this.claw.setStatic(true);
      this.claw.setCollidesWith([]);

      //gift
      this.fallBlock = this.matter.add.image(950, 350, "gift", undefined, {
        isStatic: false,
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.gift
      }).setScale(0.2);
      this.fallBlock.setIgnoreGravity(true);
      this.fallBlock.setStatic(true);
      this.fallBlock.setFrictionAir(0);

      //Blocks
      this.stone = this.matter.add.image(1170, 890, "stone", undefined, {
        friction: 0.5,
        restitution: 0.2
      }).setScale(0.2);
      this.stone.setIgnoreGravity(true);
      this.stone.setStatic(true);
      this.stone.setFrictionAir(0);

      //woodlog (left)
      this.woodLog = this.matter.add.image(490, 735, "woodLog", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.woodLog
      }).setScale(0.25);
      this.woodLog.setIgnoreGravity(true);
      this.woodLog.setStatic(true);
      this.woodLog.setFrictionAir(0);

      //woodlog2 (right)
      this.woodLog2 = this.matter.add.image(1060, 735, "woodLog", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.woodLog
      }).setScale(0.25);
      this.woodLog2.setIgnoreGravity(true);
      this.woodLog2.setStatic(true);
      this.woodLog2.setFrictionAir(0);

      //stoneCircle
      this.stoneCircle = this.matter.add.image(490, 590, "stoneCircle", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.stoneCircle
      }).setScale(0.2);
      this.stoneCircle.setIgnoreGravity(true);
      this.stoneCircle.setStatic(true);
      this.stoneCircle.setFrictionAir(0);

      //stone2
      this.stone2 = this.matter.add.image(490, 890, "stone", undefined, {
        friction: 0.5,
        restitution: 0.2,
      }).setScale(0.2);
      this.stone2.setIgnoreGravity(true);
      this.stone2.setStatic(true);
      this.stone2.setFrictionAir(0);

    }

    protected startPhysics() {
      this.createCollisionSound();
      this.fallBlock.setStatic(false);
      this.stone.setStatic(false);
      this.woodLog.setStatic(false);
      this.woodLog2.setStatic(false);
      this.stone2.setStatic(false);
      this.stoneCircle.setStatic(false);

      this.fallBlock.setIgnoreGravity(false);
      this.stone.setIgnoreGravity(false);
      this.woodLog.setIgnoreGravity(false);
      this.woodLog2.setIgnoreGravity(false);
      this.stone2.setIgnoreGravity(false);
      this.stoneCircle.setIgnoreGravity(false);
      
      this.claw.setTexture("clawOpen"); // change to claw open

      this.time.delayedCall(3500, () => {
        this.restartButton.setVisible(false);
        this.nextSceneButton.setVisible(true);
      });
    }

}
