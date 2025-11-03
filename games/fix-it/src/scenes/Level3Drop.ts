import { DropScene } from "./DropScene";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_WIDTH, HEIGHT } from "../constants.ts";
import { AudioManager } from "../AudioManager";


export class Level3Drop extends DropScene {
  constructor() {
    super("Level3Drop", "Level3", "Observe!", "Level2");
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

    // Claws
    this.clawOne = this.matter.add.image(1050, 279, "claw", undefined, {
      friction: 0.5,
      restitution: 0.2,
    }).setScale(0.25);
    this.clawOne.setIgnoreGravity(true);
    this.clawOne.setStatic(true);
    this.clawOne.setCollidesWith([]);

    this.clawTwo = this.matter.add.image(660, 279, "claw", undefined, {
      friction: 0.5,
      restitution: 0.2,
    }).setScale(0.25);
    this.clawTwo.setIgnoreGravity(true);
    this.clawTwo.setStatic(true);
    this.clawTwo.setCollidesWith([]);

    // Blocks
    this.blockOne = this.matter.add.image(390, 790, "block", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockOne.setIgnoreGravity(true);
    this.blockOne.setStatic(true);
    this.blockOne.setFrictionAir(0);


    this.blockTwo = this.matter.add.image(390, 915, "stone", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockTwo.setIgnoreGravity(true);
    this.blockTwo.setStatic(true);
    this.blockTwo.setFrictionAir(0);

    this.blockThree = this.matter.add.image(660, 915, "stoneCircle", undefined, {
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.stoneCircle
    }).setScale(0.16);
    this.blockThree.setIgnoreGravity(true);
    this.blockThree.setStatic(true);
    this.blockThree.setFrictionAir(0);

    this.blockFour = this.matter.add.image(1320, 790, "block", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockFour.setIgnoreGravity(true);
    this.blockFour.setStatic(true);
    this.blockFour.setFrictionAir(0);


    this.blockFive = this.matter.add.image(1320, 915, "stone", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockFive.setIgnoreGravity(true);
    this.blockFive.setStatic(true);
    this.blockFive.setFrictionAir(0);


    this.longBlockOne = this.matter.add.image(190 + 230, 670, "5block", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15,0.15);
    this.longBlockOne.setIgnoreGravity(false);
    this.longBlockOne.setStatic(true);
    this.longBlockOne.setFrictionAir(0);

    this.longBlockTwo = this.matter.add.image(1120 + 200, 670, "5block", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.18,0.15);
    this.longBlockTwo.setIgnoreGravity(false);
    this.longBlockTwo.setStatic(true);
    this.longBlockTwo.setFrictionAir(0);


    this.fallBlock = this.matter.add.image(1050, 350, "gift", undefined, {
      isStatic: false,
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.gift
    }).setScale(0.18);
    this.fallBlock.setIgnoreGravity(true);
    this.fallBlock.setStatic(true);
    this.fallBlock.setFrictionAir(0);
      
    this.fallBlockTwo = this.matter.add.image(660, 350, "gift", undefined, {
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
    this.blockFive.setStatic(false);
    this.longBlockOne.setStatic(false);
    this.longBlockTwo.setStatic(false);
    this.fallBlock.setStatic(false);
    this.fallBlockTwo.setStatic(false);
    this.blockOne.setIgnoreGravity(false);
    this.blockTwo.setIgnoreGravity(false);
    this.blockThree.setIgnoreGravity(false);
    this.blockFour.setIgnoreGravity(false);
    this.blockFive.setIgnoreGravity(false);
    this.longBlockOne.setIgnoreGravity(false);
    this.longBlockTwo.setIgnoreGravity(false);
    this.fallBlock.setIgnoreGravity(false);
    this.fallBlockTwo.setIgnoreGravity(false);

    this.clawOne.setTexture("clawOpen");
    this.clawTwo.setTexture("clawOpen");

    this.time.delayedCall(3500, () => {
        this.restartButton.setVisible(false);
        this.nextSceneButton.setVisible(true);
      });
  }
}
