import Phaser from "phaser";
import { FixItScene } from "./FixItScene.ts";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_WIDTH, HEIGHT, WIDTH } from "../constants.ts";
import { AudioManager } from "../AudioManager.ts";


export class Level5 extends FixItScene<BlockGameScoringData> {
  constructor() {
    super("Level5", "Level5", "Level6Drop", "Prevent what will happen!", "Level5Drop");
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
    this.clawOne = this.matter.add.image(505, 279, "claw", undefined, {
      friction: 0.5,
      restitution: 0.2,
    }).setScale(0.25);
    this.clawOne.setIgnoreGravity(true);
    this.clawOne.setStatic(true);
    this.clawOne.setCollidesWith([]);

    // Blocks
    this.blockOne = this.matter.add.image(490, 780, "block", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockOne.setIgnoreGravity(true);
    this.blockOne.setStatic(true);
    this.blockOne.setFrictionAir(0);


    this.blockTwo = this.matter.add.image(490, 905, "stone", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockTwo.setIgnoreGravity(true);
    this.blockTwo.setStatic(true);
    this.blockTwo.setFrictionAir(0);

    this.blockThree = this.matter.add.image(1220, 905, "stone", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockThree.setIgnoreGravity(true);
    this.blockThree.setStatic(true);
    this.blockThree.setFrictionAir(0);

    this.blockFour = this.matter.add.image(490, 655, "stone", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15);
    this.blockFour.setIgnoreGravity(true);
    this.blockFour.setStatic(true);
    this.blockFour.setFrictionAir(0);

    this.triangleWoodv4 = this.matter.add.image(470, 550, "triangleWoodv4", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.triangleWoodv4
      }).setScale(0.15);
      this.triangleWoodv4.setIgnoreGravity(true);
      this.triangleWoodv4.setStatic(true);
      this.triangleWoodv4.setFrictionAir(0);
    
    this.longBlockOne = this.matter.add.image(365, 720, "wood4vertical", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.15,0.15);
    this.longBlockOne.setIgnoreGravity(true);
    this.longBlockOne.setStatic(true);
    this.longBlockOne.setFrictionAir(0);
    
    this.longBlockTwo = this.matter.add.image(1040, 780, "5block", undefined, {
      friction: 0.5,
      restitution: 0.2
    }).setScale(0.18,0.15);
    this.longBlockTwo.setIgnoreGravity(true);
    this.longBlockTwo.setStatic(true);
    this.longBlockTwo.setFrictionAir(0);


    this.fallBlockOne = this.matter.add.image(505, 350, "gift", undefined, {
      isStatic: false,
      friction: 0.005,
      restitution: 0.2,
      shape: shapes.gift
    }).setScale(0.18);
    this.fallBlockOne.setIgnoreGravity(true);
    this.fallBlockOne.setStatic(true);
    this.fallBlockOne.setFrictionAir(0.005);
      


    //Movable Blocks
    this.movableBlockOne = this.matter.add.image(1600, 915, "scaffolding", undefined, {
      isStatic: false,
      shape: shapes.scaffolding
    }).setScale(0.15);
    this.movableBlockOne.setIgnoreGravity(false);
    this.movableBlockOne.setFixedRotation();

    this.movableBlockOne.on("dragstart", () => {
            this.movableBlockOne.setIgnoreGravity(true);
            this.movableBlockOne.setFixedRotation(true);
            this.movableBlockOne.setCollidesWith([])

            if (this.showDropButton == false) { //Show drop button when block is moved
              this.startButton.setVisible(true);
              this.showDropButton = true;
            }
        });


    this.movableBlockOne.setInteractive();
    this.input.setDraggable(this.movableBlockOne);
    this.movableBlockOne.on("dragend", () => {
                let overlaps = this.matter.intersectPoint(this.movableBlockOne.x, this.movableBlockOne.y);
                while (overlaps.length != 1 || this.movableBlockOne.x < 0 || this.movableBlockOne.x > WIDTH || this.movableBlockOne.y > HEIGHT || this.movableBlockOne.y < 0) {
                  this.movableBlockOne.y -= 150
    
                  if (this.movableBlockOne.y < 0) {
                    this.movableBlockOne.y = 50
                  }
    
                  if (this.movableBlockOne.y > HEIGHT) {
                    this.movableBlockOne.y = HEIGHT - 50
                  }
    
                  if (this.movableBlockOne.x < 0) {
                    this.movableBlockOne.x = 50
                  }
    
                  if (this.movableBlockOne.x > WIDTH) {
                    this.movableBlockOne.x = WIDTH - 50
                  }
    
                  overlaps = this.matter.intersectPoint(this.movableBlockOne.x, this.movableBlockOne.y);     
                }
    
                this.movableBlockOne.setIgnoreGravity(false);
                this.movableBlockOne.setFixedRotation(false);
                this.movableBlockOne.setCollidesWith(0xFFFFFFFF);
            });


    this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {
        if (gameObject === this.movableBlockOne) {
            this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
        }
    });
    this.movableBlockOne.on("dragend", () => {
        this.movableBlockOne.setIgnoreGravity(false);
        this.movableBlockOne.setFixedRotation();
    });

    //Movable Blocks Hovering
    if (this.registry.get("coordinates_mode") == true) {
          this.input.on('pointermove', () => {
      const pointer = this.input.activePointer;
      this.coordText.setText(`Cursor: (${Math.round(pointer.x)}, ${Math.round(pointer.y)})`);
      })

      this.movableBlockOne.on('pointerover', () => {
              this.blockNameText.setText("Block One");
          });

      this.movableBlockOne.on('pointerout', () => {
              this.blockNameText.setText("");
          });

      }
    //Movable Block Data Collection
    this.movableBlockOne.on("dragstart", () => { 
      this.startPositionList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1) });
      this.blockNameList.push("BlockOne")
      this.numberOfBlocksMoved += 1;
      this.movableBlockOne.setScale(0.16);

      this.dragInterval = this.time.addEvent({
        delay: 100,
        callback: () => {
          this.currentPathList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1) })
        },
        callbackScope: this,
        loop: true
      }
      );
    });
    
    this.movableBlockOne.on("dragend", () => { 
      this.endPositionList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1)});
        this.middlePositionList.push(this.currentPathList);
        this.currentPathList = [];
        this.movableBlockOne.setScale(0.15);

        if (this.dragInterval) {
          this.dragInterval.destroy();
        }
    });
    }

    //This function runs when 'Start' is pressed
    protected startPhysics() {
    this.createCollisionSound();
    this.input.off("drag");

    this.blockOne.setStatic(false);
    this.blockTwo.setStatic(false);
    this.blockThree.setStatic(false);
    this.blockFour.setStatic(false);
    this.triangleWoodv4.setStatic(false);
    this.longBlockOne.setStatic(false);
    this.longBlockTwo.setStatic(false);
    this.fallBlockOne.setStatic(false);

    this.blockOne.setIgnoreGravity(false);
    this.blockTwo.setIgnoreGravity(false);
    this.blockThree.setIgnoreGravity(false);
    this.blockFour.setIgnoreGravity(false);
    this.triangleWoodv4.setIgnoreGravity(false);
    this.longBlockOne.setIgnoreGravity(false);
    this.longBlockTwo.setIgnoreGravity(false);
    this.fallBlockOne.setIgnoreGravity(false);

    this.clawOne.setTexture("clawOpen");

    this.time.delayedCall(4000, () => {
    if (!this.didStructureCollapse()) {
      this.anims.resumeAll();
      this.createSuccessScene();
      this.game.registry.set("giftsSaved", this.game.registry.get("giftsSaved") + 1);
      AudioManager.I.playSfx(this, "stage_clear");
      this.registry.set("levelCleared_5", true);
      this.nextSceneButton.setVisible(true);
    }
    else {
      this.anims.resumeAll();
      this.createFailScene()
      this.restartButton.setVisible(true);
    }
  });
    
    }

    //Data Collection Functions
  protected recordScoreDataForCurrentTry(): BlockGameScoringData {
    //Combining pickup, placement, and blocknames into one blockEvents array.
    const blockEvents = this.startPositionList.map((pickup, index) => ({
      blockName: this.blockNameList[index],
      pickup: pickup,
      path: this.middlePositionList[index],
      placement: this.endPositionList[index],
    }));

    return {
      attemptId: this.registry.get(this.levelTriesDataKey),
      stageId: this.key,
      blockEvents: blockEvents,
      amountOfBlocksMoved: this.numberOfBlocksMoved,
      timeToEnd: Math.round(this.time.now - this.time.startTime),
      structureCollapsed: this.didStructureCollapse(),
    };
  }

  protected didStructureCollapse() { //Collapses if the falling block goes below initial position of the two logs
    console.log(this.fallBlockOne.y);

    if (this.fallBlockOne.y > 660) { //idk if the value is right
      return true;
    }
    else {
      return false;
    }
  }

}
