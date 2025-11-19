import Phaser from "phaser";
import { FixItScene } from "./FixItScene";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { Level3Drop } from "./Level3Drop.ts";
import { HALF_WIDTH, HEIGHT, WIDTH } from "../constants.ts";
import { AudioManager } from "../AudioManager";

export class Level2 extends FixItScene<BlockGameScoringData> {
  constructor() {
    super("Level2", "Level2", "Level3Drop", "Prevent what will happen!", "Level2Drop");
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

      //block2
      this.stone2 = this.matter.add.image(490, 890, "stone", undefined, {
        friction: 0.5,
        restitution: 0.2,
      }).setScale(0.2);
      this.stone2.setIgnoreGravity(true);
      this.stone2.setStatic(true);
      this.stone2.setFrictionAir(0);

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


      //moveable blocks 
      //scaffolding
      this.scaffolding = this.matter.add.image(1700, 725, "scaffolding", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.scaffolding
      }).setScale(0.2);
      this.scaffolding.setIgnoreGravity(false);
      this.scaffolding.setFixedRotation();
      
      this.scaffolding2 = this.matter.add.image(1700, 925, "scaffolding", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.scaffolding
      }).setScale(0.2);
      this.scaffolding2.setIgnoreGravity(false);
      this.scaffolding2.setFixedRotation();

      this.scaffolding.setInteractive();
      

      this.input.setDraggable(this.scaffolding);
      
        this.scaffolding.on("dragstart", () => {
          this.scaffolding.setCollidesWith([])
          this.scaffolding.setIgnoreGravity(true);
          this.scaffolding.setFixedRotation();

        if (this.showDropButton == false) { //Show drop button when block is moved
              this.startButton.setVisible(true);
              this.showDropButton = true;
            }
      });

      this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {
        if (gameObject === this.scaffolding) {
          this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
        }
      });
              
      this.scaffolding.on("dragend", () => {
                  let overlaps = this.matter.intersectPoint(this.scaffolding.x, this.scaffolding.y);
      
                  while (overlaps.length != 1 || this.scaffolding.x < 0 || this.scaffolding.x > WIDTH || this.scaffolding.y > HEIGHT || this.scaffolding.y < 0) {
                    this.scaffolding.y -= 150
      
                    if (this.scaffolding.y < 0) {
                      this.scaffolding.y = 50
                    }
      
                    if (this.scaffolding.y > HEIGHT) {
                      this.scaffolding.y = HEIGHT - 50
                    }
      
                    if (this.scaffolding.x < 0) {
                      this.scaffolding.x = 50
                    }
      
                    if (this.scaffolding.x > WIDTH) {
                      this.scaffolding.x = WIDTH - 50
                    }
      
                    overlaps = this.matter.intersectPoint(this.scaffolding.x, this.scaffolding.y);
                    
                  }
      
                  this.scaffolding.setIgnoreGravity(false);
                  this.scaffolding.setFixedRotation(false);
                  this.scaffolding.setCollidesWith(0xFFFFFFFF);
              });
          
          
      this.scaffolding2.setInteractive();
              
      this.input.setDraggable(this.scaffolding2);
          
      this.scaffolding2.on("dragstart", () => {   
        this.scaffolding2.setIgnoreGravity(true);
        this.scaffolding2.setFixedRotation(true);
        this.scaffolding2.setCollidesWith([])

        if (this.showDropButton == false) { //Show drop button when block is moved
              this.startButton.setVisible(true);
              this.showDropButton = true;
            }
      });
            
      this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {        
        if (gameObject === this.scaffolding2) {
        this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
        }  
      });
              
      this.scaffolding2.on("dragend", () => {
                  let overlaps = this.matter.intersectPoint(this.scaffolding2.x, this.scaffolding2.y);
      
                  while (overlaps.length != 1 || this.scaffolding2.x < 0 || this.scaffolding2.x > WIDTH || this.scaffolding2.y > HEIGHT || this.scaffolding2.y < 0) {
                    this.scaffolding.y -= 150
      
                    if (this.scaffolding2.y < 0) {
                      this.scaffolding2.y = 50
                    }
      
                    if (this.scaffolding2.y > HEIGHT) {
                      this.scaffolding2.y = HEIGHT - 50
                    }
      
                    if (this.scaffolding2.x < 0) {
                      this.scaffolding2.x = 50
                    }
      
                    if (this.scaffolding2.x > WIDTH) {
                      this.scaffolding2.x = WIDTH - 50
                    }
      
                    overlaps = this.matter.intersectPoint(this.scaffolding2.x, this.scaffolding2.y);             
                  }
      
                  this.scaffolding2.setIgnoreGravity(false);
                  this.scaffolding2.setFixedRotation(false);
                  this.scaffolding2.setCollidesWith(0xFFFFFFFF);
              });
      
      //Movable Blocks Hovering
      if (this.registry.get("coordinates_mode") == true) {
          this.input.on('pointermove', () => {
        const pointer = this.input.activePointer;
        this.coordText.setText(`Cursor: (${Math.round(pointer.x)}, ${Math.round(pointer.y)})`);
        })

        this.scaffolding.on('pointerover', () => {
                this.blockNameText.setText("Block One");
            });

        this.scaffolding.on('pointerout', () => {
                this.blockNameText.setText("");
            });

        this.scaffolding2.on('pointerover', () => {
                this.blockNameText.setText("Block Two");
            });

        this.scaffolding2.on('pointerout', () => {
                this.blockNameText.setText("");
            });
      }

      //Moveable Blocks Data Tracking
      this.scaffolding.on("dragstart", () => { 
        this.startPositionList.push({x: Math.round(this.scaffolding.x), y: Math.round(this.scaffolding.y), time: Math.round((this.time.now - this.time.startTime) / 1)});
        this.blockNameList.push("BlockOne")
        this.numberOfBlocksMoved += 1;
        this.scaffolding.setScale(0.21);

        this.dragInterval = this.time.addEvent({
        delay: 100,
        callback: () => {
          this.currentPathList.push({x: Math.round(this.scaffolding.x), y: Math.round(this.scaffolding.y), time: Math.round((this.time.now - this.time.startTime) / 1)})
        },
        callbackScope: this,
        loop: true
      }
      );
      });
          
      this.scaffolding.on("dragend", () => { 
        this.endPositionList.push({x: Math.round(this.scaffolding.x), y: Math.round(this.scaffolding.y), time: Math.round((this.time.now - this.time.startTime) / 1)});
        this.middlePositionList.push(this.currentPathList);
        this.currentPathList = [];
        this.scaffolding.setScale(0.2);

        if (this.dragInterval) {
          this.dragInterval.destroy();
        }
      });
      
      this.scaffolding2.on("dragstart", () => { 
        this.startPositionList.push({x: Math.round(this.scaffolding2.x), y: Math.round(this.scaffolding2.y), time: Math.round((this.time.now - this.time.startTime) / 1)});
        this.blockNameList.push("BlockTwo")
        this.numberOfBlocksMoved += 1;
        this.scaffolding2.setScale(0.21);

        this.dragInterval = this.time.addEvent({
        delay: 100,
        callback: () => {
          this.currentPathList.push({x: Math.round(this.scaffolding2.x), y: Math.round(this.scaffolding2.y), time: Math.round((this.time.now - this.time.startTime) / 1)});
        },
        callbackScope: this,
        loop: true
      }
      );
      });

      this.scaffolding2.on("dragend", () => { 
        this.endPositionList.push({x: Math.round(this.scaffolding2.x), y: Math.round(this.scaffolding2.y), time: Math.round((this.time.now - this.time.startTime) / 1)});
        this.middlePositionList.push(this.currentPathList);
        this.currentPathList = [];
        this.scaffolding2.setScale(0.2);

        if (this.dragInterval) {
          this.dragInterval.destroy();
        }
      });

    }

    //This function runs when 'Start' is pressed
    protected startPhysics() {
      this.createCollisionSound();
      this.input.off("drag");

      this.scaffolding.setIgnoreGravity(false);
      this.scaffolding2.setIgnoreGravity(false);
      this.scaffolding.disableInteractive();
      this.scaffolding2.disableInteractive();

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
      
      this.time.delayedCall(3000, () => {
    if (!this.didStructureCollapse()) {
      this.anims.resumeAll();
      this.createSuccessScene();
      this.game.registry.set("giftsSaved", this.game.registry.get("giftsSaved") + 1);
      AudioManager.I.playSfx(this, "stage_clear");
      this.registry.set("levelCleared_2", true);
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
    if (this.fallBlock.y > 650) {
      return true;
    }
    else {
      return false;
    }
  }

}