import Phaser from "phaser";
import { FixItScene } from "./FixItScene.ts";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_WIDTH, HEIGHT, WIDTH } from "../constants.ts";
import { AudioManager } from "../AudioManager.ts";


export class Level6 extends FixItScene<BlockGameScoringData> {
  constructor() {
    super("Level6", "Level6", "GameOver", "Prevent what will happen!", "Level6Drop");
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

    this.fallBlockOne = this.matter.add.image(390, 350, "gift", undefined, {
      isStatic: false,
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.gift
    }).setScale(0.18);
    this.fallBlockOne.setIgnoreGravity(true);
    this.fallBlockOne.setStatic(true);
    this.fallBlockOne.setFrictionAir(0);
      
    this.fallBlockTwo = this.matter.add.image(1060, 350, "gift", undefined, {
      isStatic: false,
      friction: 0.5,
      restitution: 0.2,
      shape: shapes.gift
    }).setScale(0.18);
    this.fallBlockTwo.setIgnoreGravity(true);
    this.fallBlockTwo.setStatic(true);
    this.fallBlockTwo.setFrictionAir(0);
      


    //Movable Blocks
    this.movableBlockOne = this.matter.add.image(1700, 630, "scaffolding", undefined, {
      isStatic: false,
      shape: shapes.scaffolding
    }).setScale(0.15);
    this.movableBlockOne.setIgnoreGravity(false);
    this.movableBlockOne.setFixedRotation();

    this.movableBlockTwo = this.matter.add.image(1700, 780, "scaffolding", undefined, {
      isStatic: false,
      shape: shapes.scaffolding
    }).setScale(0.15);
    this.movableBlockTwo.setIgnoreGravity(false);
    this.movableBlockTwo.setFixedRotation();

    this.movableBlockThree = this.matter.add.image(1700, 915, "scaffolding", undefined, {
      isStatic: false,
      shape: shapes.scaffolding
    }).setScale(0.15);
    this.movableBlockThree.setIgnoreGravity(false);
    this.movableBlockThree.setFixedRotation();


    this.movableBlockOne.setInteractive();
    this.input.setDraggable(this.movableBlockOne);
    this.movableBlockOne.on("dragstart", () => {
        this.movableBlockOne.setIgnoreGravity(true);
        this.movableBlockOne.setFixedRotation();
        this.movableBlockOne.setCollidesWith([])

        if (this.showDropButton == false) { //Show drop button when block is moved
              this.startButton.setVisible(true);
              this.showDropButton = true;
            }
    });
    this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {
        if (gameObject === this.movableBlockOne) {
            this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
        }
    });
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


    this.movableBlockTwo.setInteractive();
    this.input.setDraggable(this.movableBlockTwo);
    this.movableBlockTwo.on("dragstart", () => {
        this.movableBlockTwo.setIgnoreGravity(true);
        this.movableBlockTwo.setFixedRotation();
        this.movableBlockTwo.setCollidesWith([])

        if (this.showDropButton == false) { //Show drop button when block is moved
              this.startButton.setVisible(true);
              this.showDropButton = true;
            }
    });
    this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {
        if (gameObject === this.movableBlockTwo) {
            this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
        }
    });
    this.movableBlockTwo.on("dragend", () => {
            let overlaps = this.matter.intersectPoint(this.movableBlockTwo.x, this.movableBlockTwo.y);
            while (overlaps.length != 1 || this.movableBlockTwo.x < 0 || this.movableBlockTwo.x > WIDTH || this.movableBlockTwo.y > HEIGHT || this.movableBlockTwo.y < 0) {
              this.movableBlockTwo.y -= 150

              if (this.movableBlockTwo.y < 0) {
                this.movableBlockTwo.y = 50
              }

              if (this.movableBlockTwo.y > HEIGHT) {
                this.movableBlockTwo.y = HEIGHT - 50
              }

              if (this.movableBlockTwo.x < 0) {
                this.movableBlockTwo.x = 50
              }

              if (this.movableBlockTwo.x > WIDTH) {
                this.movableBlockTwo.x = WIDTH - 50
              }

              overlaps = this.matter.intersectPoint(this.movableBlockTwo.x, this.movableBlockTwo.y);     
            }

            this.movableBlockTwo.setIgnoreGravity(false);
            this.movableBlockTwo.setFixedRotation(false);
            this.movableBlockTwo.setCollidesWith(0xFFFFFFFF);
        });

    this.movableBlockThree.setInteractive();
    this.input.setDraggable(this.movableBlockThree);


    this.movableBlockThree.on("dragstart", () => {
        this.movableBlockThree.setIgnoreGravity(true);
        this.movableBlockThree.setFixedRotation();
        this.movableBlockThree.setCollidesWith([])

        if (this.showDropButton == false) { //Show drop button when block is moved
              this.startButton.setVisible(true);
              this.showDropButton = true;
            }
    });
    this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {
        if (gameObject === this.movableBlockThree) {
            this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
        }
    });
    this.movableBlockThree.on("dragend", () => {
            let overlaps = this.matter.intersectPoint(this.movableBlockThree.x, this.movableBlockThree.y);
            while (overlaps.length != 1 || this.movableBlockThree.x < 0 || this.movableBlockThree.x > WIDTH || this.movableBlockThree.y > HEIGHT || this.movableBlockThree.y < 0) {
              this.movableBlockThree.y -= 150

              if (this.movableBlockThree.y < 0) {
                this.movableBlockThree.y = 50
              }

              if (this.movableBlockThree.y > HEIGHT) {
                this.movableBlockThree.y = HEIGHT - 50
              }

              if (this.movableBlockThree.x < 0) {
                this.movableBlockThree.x = 50
              }

              if (this.movableBlockThree.x > WIDTH) {
                this.movableBlockThree.x = WIDTH - 50
              }

              overlaps = this.matter.intersectPoint(this.movableBlockThree.x, this.movableBlockThree.y);     
            }

            this.movableBlockThree.setIgnoreGravity(false);
            this.movableBlockThree.setFixedRotation(false);
            this.movableBlockThree.setCollidesWith(0xFFFFFFFF);
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

      this.movableBlockTwo.on('pointerover', () => {
              this.blockNameText.setText("Block Two");
          });

      this.movableBlockTwo.on('pointerout', () => {
              this.blockNameText.setText("");
          });
      
      this.movableBlockThree.on('pointerover', () => {
              this.blockNameText.setText("Block Three");
          });

      this.movableBlockThree.on('pointerout', () => {
              this.blockNameText.setText("");
          });
      }
    //Movable Block Data Collection
    this.movableBlockOne.on("dragstart", () => { 
      this.startPositionList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
      this.blockNameList.push("BlockOne")
      this.numberOfBlocksMoved += 1;
      this.movableBlockOne.setScale(0.16);

      this.dragInterval = this.time.addEvent({
        delay: 1000,
        callback: () => {
          this.currentPathList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000})
        },
        callbackScope: this,
        loop: true
      }
      );
    });
    
    this.movableBlockOne.on("dragend", () => { 
      this.endPositionList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
        this.middlePositionList.push(this.currentPathList);
        this.currentPathList = [];
        this.movableBlockOne.setScale(0.15);

        if (this.dragInterval) {
          this.dragInterval.destroy();
        }
    });

    this.movableBlockTwo.on("dragstart", () => { 
      this.startPositionList.push({x: Math.round(this.movableBlockTwo.x), y: Math.round(this.movableBlockTwo.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
      this.blockNameList.push("BlockTwo")
      this.numberOfBlocksMoved += 1;
      this.movableBlockTwo.setScale(0.16);

      this.dragInterval = this.time.addEvent({
        delay: 1000,
        callback: () => {
          this.currentPathList.push({x: Math.round(this.movableBlockTwo.x), y: Math.round(this.movableBlockTwo.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000})
        },
        callbackScope: this,
        loop: true
      }
      );
    });
    
    this.movableBlockTwo.on("dragend", () => { 
      this.endPositionList.push({x: Math.round(this.movableBlockTwo.x), y: Math.round(this.movableBlockTwo.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
        this.middlePositionList.push(this.currentPathList);
        this.currentPathList = [];
        this.movableBlockTwo.setScale(0.15);

        if (this.dragInterval) {
          this.dragInterval.destroy();
        }
    });

    this.movableBlockThree.on("dragstart", () => { 
      this.startPositionList.push({x: Math.round(this.movableBlockThree.x), y: Math.round(this.movableBlockThree.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
      this.blockNameList.push("BlockThree")
      this.numberOfBlocksMoved += 1;
      this.movableBlockThree.setScale(0.16);

      this.dragInterval = this.time.addEvent({
        delay: 1000,
        callback: () => {
          this.currentPathList.push({x: Math.round(this.movableBlockThree.x), y: Math.round(this.movableBlockThree.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000})
        },
        callbackScope: this,
        loop: true
      }
      );
    });
    
    this.movableBlockThree.on("dragend", () => { 
      this.endPositionList.push({x: Math.round(this.movableBlockThree.x), y: Math.round(this.movableBlockThree.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
        this.middlePositionList.push(this.currentPathList);
        this.currentPathList = [];
        this.movableBlockThree.setScale(0.15);

        if (this.dragInterval) {
          this.dragInterval.destroy();
        }
    });

      
    }

    //This function runs when 'Start' is pressed
    protected startPhysics() {
    this.createCollisionSound();
    this.input.off("drag");

    this.movableBlockOne.disableInteractive();
    this.movableBlockTwo.disableInteractive();
    this.movableBlockThree.disableInteractive();

    this.movableBlockTwo.setIgnoreGravity(false);
    this.movableBlockOne.setIgnoreGravity(false);
    this.movableBlockThree.setIgnoreGravity(false);

    this.blockOne.setStatic(false);
    this.blockTwo.setStatic(false);
    this.blockThree.setStatic(false);
    this.blockFour.setStatic(false);
    this.woodLog.setStatic(false);
    this.woodLog2.setStatic(false);
    this.triangleWood.setStatic(false);
    this.triangleWoodv2.setStatic(false);
    this.fallBlockOne.setStatic(false);
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
    this.fallBlockOne.setIgnoreGravity(false);
    this.fallBlockTwo.setIgnoreGravity(false);
    this.longBlockOne.setIgnoreGravity(false);
    this.longBlockTwo.setIgnoreGravity(false);

    this.clawOne.setTexture("clawOpen"); // change to claw open
    this.clawTwo.setTexture("clawOpen");

    this.time.delayedCall(4000, () => {
    if (!this.didStructureCollapse()) {
      this.anims.resumeAll();
      this.createSuccessScene();
      this.game.registry.set("giftsSaved", this.game.registry.get("giftsSaved") + 2);
      AudioManager.I.playSfx(this, "stage_clear");
      this.registry.set("levelCleared_6", true);
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
      timeToEnd: (this.time.now - this.time.startTime) / 1000,
      structureCollapsed: this.didStructureCollapse(),
    };
  }

  protected didStructureCollapse() { //Collapses if the falling block goes below initial position of the two logs
    if (this.fallBlockOne.y > 675 && this.fallBlockTwo.y > 675) { 
      return true;
    }
    else if (this.fallBlockOne.y > 675 || this.fallBlockTwo.y > 675){
      this.game.registry.set("giftsSaved", this.game.registry.get("giftsSaved") + 1);
      this.failureText2.setText("Nice try, you got one out of two gifts!");
      return true;
    }
    else {
      return false;
    }
  }

}
