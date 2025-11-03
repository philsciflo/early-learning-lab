import { DropScene } from "./DropScene.ts";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_WIDTH, HEIGHT } from "../constants.ts";
import { AudioManager } from "../AudioManager.ts";


export class Level6Drop extends DropScene {
  constructor() {
    super("Level6Drop", "Level6", "Observe!", "Level5");
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
    // Claws
    this.clawOne = this.matter.add.image(390, 279, "claw", undefined, {
      friction: 0.5,
      restitution: 0.2,
    }).setScale(0.25);
    this.clawOne.setIgnoreGravity(true);
    this.clawOne.setStatic(true);
    this.clawOne.setCollidesWith([]);

    this.clawTwo = this.matter.add.image(1060, 279, "claw", undefined, {
      friction: 0.5,
      restitution: 0.2,
    }).setScale(0.25);
    this.clawTwo.setIgnoreGravity(true);
    this.clawTwo.setStatic(true);
    this.clawTwo.setCollidesWith([]);

    // blocks
    this.blockOne = this.matter.add.image(340, 905, "stone", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockOne.setIgnoreGravity(true);
    this.blockOne.setStatic(true);
    this.blockOne.setFrictionAir(0);

    this.woodLog = this.matter.add.image(485, 777, "woodLog", undefined, {
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.woodLog,
    }).setScale(0.25, 0.2);
    this.woodLog.setIgnoreGravity(true);
    this.woodLog.setStatic(true);
    this.woodLog.setFrictionAir(0);

    this.blockTwo = this.matter.add.image(1020, 780, "stone", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockTwo.setIgnoreGravity(true);
    this.blockTwo.setStatic(true);
    this.blockTwo.setFrictionAir(0);

    this.blockThree = this.matter.add.image(1020, 905, "block", undefined, {
      friction: 0.5,
      restitution: 0.2,
    }).setScale(0.15);
    this.blockThree.setIgnoreGravity(true);
    this.blockThree.setStatic(true);
    this.blockThree.setFrictionAir(0);

    this.longBlockTwo = this.matter.add.image(890, 780, "wood3vertical", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.longBlockTwo.setIgnoreGravity(true);
    this.longBlockTwo.setStatic(true);
    this.longBlockTwo.setFrictionAir(0);

    this.woodLog2 = this.matter.add.image(1280, 775, "block3", undefined, {
      friction: 0.5,
      restitution: 0.2, 
    }).setScale(0.15, 0.15);
    this.woodLog2.setIgnoreGravity(true);
    this.woodLog2.setStatic(true);
    this.woodLog2.setFrictionAir(0);

    this.blockFour = this.matter.add.image(1150, 905, "stone", undefined, {
      friction: 0.5,
      restitution: 0.2,
    }).setScale(0.15);
    this.blockFour.setIgnoreGravity(true);
    this.blockFour.setStatic(true);
    this.blockFour.setFrictionAir(0);

    this.triangleWood = this.matter.add.image(320, 675, "triangleWoodv4", undefined, {
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.triangleWoodv4
    }).setScale(0.15,0.15);
    this.triangleWood.setIgnoreGravity(true);
    this.triangleWood.setStatic(true);
    this.triangleWood.setFrictionAir(0);

    this.triangleWoodv2 = this.matter.add.image(1000, 675, "triangleWoodv4", undefined, {
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.triangleWoodv4
    }).setScale(0.15,0.15);
    this.triangleWoodv2.setIgnoreGravity(true);
    this.triangleWoodv2.setStatic(true);
    this.triangleWoodv2.setFrictionAir(0);

    this.longBlockOne = this.matter.add.image(210, 780, "wood3vertical", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15,0.15);
    this.longBlockOne.setIgnoreGravity(true);
    this.longBlockOne.setStatic(true);
    this.longBlockOne.setFrictionAir(0);

    this.fallBlock = this.matter.add.image(390, 350, "gift", undefined, {
      isStatic: false,
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.gift
    }).setScale(0.18);
    this.fallBlock.setIgnoreGravity(true);
    this.fallBlock.setStatic(true);
    this.fallBlock.setFrictionAir(0);
      
    this.fallBlockTwo = this.matter.add.image(1060, 350, "gift", undefined, {
      isStatic: false,
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.gift
    }).setScale(0.18);
    this.fallBlockTwo.setIgnoreGravity(true);
    this.fallBlockTwo.setStatic(true);
    this.fallBlockTwo.setFrictionAir(0);

  }

  // Helper function to enable drag with temporary gravity ignore
  private setupDrag(block: Phaser.Physics.Matter.Image) {
    block.setInteractive();
    this.input.setDraggable(block);

    block.on("dragstart", () => {
      block.setIgnoreGravity(true);
      block.setFixedRotation(true);
      this.startPositionList.push({ x: block.x, y: block.y });
      this.blockNameList.push(block.texture.key);
      this.numberOfBlocksMoved += 1;
    });

    this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {
      if (gameObject === block) {
        this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
      }
    });

    block.on("dragend", () => {
      block.setIgnoreGravity(false);
      block.setFixedRotation(false);
      this.endPositionList.push({ x: block.x, y: block.y });
    });
  }

  protected startPhysics() {
    this.createCollisionSound();
    // Enable physics for all blocks
    this.blockOne.setStatic(false);
    this.blockTwo.setStatic(false);
    this.blockThree.setStatic(false);
    this.blockFour.setStatic(false);
    this.woodLog.setStatic(false);
    this.woodLog2.setStatic(false);
    this.triangleWood.setStatic(false);
    this.triangleWoodv2.setStatic(false);
    this.fallBlock.setStatic(false);
    this.fallBlockTwo.setStatic(false);
    this.longBlockOne.setStatic(false);
    this.longBlockTwo.setStatic(false);

    this.blockOne.setIgnoreGravity(false);
    this.blockTwo.setIgnoreGravity(false);
    this.blockThree.setIgnoreGravity(false);
    this.blockFour.setIgnoreGravity(false);
    this.woodLog.setIgnoreGravity(false);
    this.woodLog2.setIgnoreGravity(false);

    this.triangleWood.setIgnoreGravity(false);
    this.triangleWoodv2.setIgnoreGravity(false);
    this.fallBlock.setIgnoreGravity(false);
    this.fallBlockTwo.setIgnoreGravity(false);
    this.longBlockOne.setIgnoreGravity(false);
    this.longBlockTwo.setIgnoreGravity(false);


    this.clawOne.setTexture("clawOpen");
    this.clawTwo.setTexture("clawOpen");

    this.time.delayedCall(4000, () => {
        this.restartButton.setVisible(false);
        this.nextSceneButton.setVisible(true);
      });
  }
}
