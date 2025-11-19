import Phaser from "phaser";
import { FixItScene } from "./FixItScene";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_HEIGHT, HALF_WIDTH, HEIGHT, WIDTH} from "../constants.ts";
import { AudioManager } from "../AudioManager";

export class Level4 extends FixItScene<BlockGameScoringData> {
  constructor() {
    super("Level4", "Level4", "Level5Drop", "Prevent what will happen!", "Level4Drop");
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


      //moveable blocks 
      //scaffolding
      this.scaffolding = this.matter.add.image(1650, 555, "scaffolding", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.scaffolding
      }).setScale(0.2);
      this.scaffolding.setIgnoreGravity(false);
      this.scaffolding.setFixedRotation();
      
      this.scaffolding2 = this.matter.add.image(1650, 725, "scaffolding", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.scaffolding
      }).setScale(0.2);
      this.scaffolding2.setIgnoreGravity(false);
      this.scaffolding2.setFixedRotation();

      this.scaffolding3 = this.matter.add.image(1650, 925, "scaffolding", undefined, {
        friction: 0.5,
        restitution: 0.2,
        shape: shapes.scaffolding
      }).setScale(0.2);
      this.scaffolding3.setIgnoreGravity(false);
      this.scaffolding3.setFixedRotation();



      this.scaffolding.setInteractive();

      this.input.setDraggable(this.scaffolding);
      
        this.scaffolding.on("dragstart", () => {
          this.scaffolding.setIgnoreGravity(true);
          this.scaffolding.setFixedRotation();
          this.scaffolding.setCollidesWith([])

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
        this.scaffolding2.setFixedRotation();
        this.scaffolding2.setCollidesWith([])

      if (this.showDropButton == false) { //Show drop button when block is moved
            this.startButton.setVisible(true);
            this.showDropButton = true;
          }
      });

      this.scaffolding2.on("dragend", () => {
            let overlaps = this.matter.intersectPoint(this.scaffolding2.x, this.scaffolding2.y);
            while (overlaps.length != 1 || this.scaffolding2.x < 0 || this.scaffolding2.x > WIDTH || this.scaffolding2.y > HEIGHT || this.scaffolding2.y < 0) {
              this.scaffolding2.y -= 150

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
            
      this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {        
        if (gameObject === this.scaffolding2) {
        this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
        }  
      });
              

      this.scaffolding3.setInteractive();

      this.input.setDraggable(this.scaffolding3);
      
        this.scaffolding3.on("dragstart", () => {
          this.scaffolding3.setIgnoreGravity(true);
          this.scaffolding3.setFixedRotation();
          this.scaffolding3.setCollidesWith([])

        if (this.showDropButton == false) { //Show drop button when block is moved
              this.startButton.setVisible(true);
              this.showDropButton = true;
            }
      });

      this.input.on("drag", (pointer, gameObject: Phaser.Physics.Matter.Image, dragX: number, dragY: number) => {
        if (gameObject === this.scaffolding3) {
          this.matter.body.setPosition(gameObject.body as Matter.Body, { x: dragX, y: dragY });
        }
      });
              
      this.scaffolding3.on("dragend", () => {
            let overlaps = this.matter.intersectPoint(this.scaffolding3.x, this.scaffolding3.y);
            while (overlaps.length != 1 || this.scaffolding3.x < 0 || this.scaffolding3.x > WIDTH || this.scaffolding3.y > HEIGHT || this.scaffolding3.y < 0) {
              this.scaffolding3.y -= 150

              if (this.scaffolding3.y < 0) {
                this.scaffolding3.y = 50
              }

              if (this.scaffolding3.y > HEIGHT) {
                this.scaffolding3.y = HEIGHT - 50
              }

              if (this.scaffolding3.x < 0) {
                this.scaffolding3.x = 50
              }

              if (this.scaffolding3.x > WIDTH) {
                this.scaffolding3.x = WIDTH - 50
              }

              overlaps = this.matter.intersectPoint(this.scaffolding3.x, this.scaffolding3.y);     
            }

            this.scaffolding3.setIgnoreGravity(false);
            this.scaffolding3.setFixedRotation(false);
            this.scaffolding3.setCollidesWith(0xFFFFFFFF);
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
        
        this.scaffolding3.on('pointerover', () => {
                this.blockNameText.setText("Block Three");
            });

        this.scaffolding3.on('pointerout', () => {
                this.blockNameText.setText("");
            });
        }
          
      //Movable Block Data Collection
      this.scaffolding.on("dragstart", () => { 
        this.startPositionList.push({x: Math.round(this.scaffolding.x), y: Math.round(this.scaffolding.y), time: Math.round((this.time.now - this.time.startTime) / 1) });
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
            this.currentPathList.push({x: Math.round(this.scaffolding2.x), y: Math.round(this.scaffolding2.y), time: Math.round((this.time.now - this.time.startTime) / 1)})
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

      this.scaffolding3.on("dragstart", () => { 
        this.startPositionList.push({x: Math.round(this.scaffolding3.x), y: Math.round(this.scaffolding3.y), time: Math.round((this.time.now - this.time.startTime) / 1)});
        this.blockNameList.push("BlockThree")
        this.numberOfBlocksMoved += 1;
        this.scaffolding3.setScale(0.21);

        this.dragInterval = this.time.addEvent({
          delay: 100,
          callback: () => {
            this.currentPathList.push({x: Math.round(this.scaffolding3.x), y: Math.round(this.scaffolding3.y), time: Math.round((this.time.now - this.time.startTime) / 1)})
          },
          callbackScope: this,
          loop: true
        }
        );
      });
          
      this.scaffolding3.on("dragend", () => { 
        this.endPositionList.push({x: Math.round(this.scaffolding3.x), y: Math.round(this.scaffolding3.y), time: Math.round((this.time.now - this.time.startTime) / 1)});
        this.middlePositionList.push(this.currentPathList);
        this.currentPathList = [];
        this.scaffolding3.setScale(0.2);

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
      this.scaffolding3.setIgnoreGravity(false);
      this.scaffolding.disableInteractive();
      this.scaffolding2.disableInteractive();
      this.scaffolding3.disableInteractive();

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

      this.time.delayedCall(3000, () => {
    if (!this.didStructureCollapse()) {
      this.anims.resumeAll();
      this.createSuccessScene();
      this.game.registry.set("giftsSaved", this.game.registry.get("giftsSaved") + 2);
      AudioManager.I.playSfx(this, "stage_clear");
      this.registry.set("levelCleared_4", true);
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
      timeToEnd: Math.round((this.time.now - this.time.startTime) / 1),
      structureCollapsed: this.didStructureCollapse(),
  };
  }

  protected didStructureCollapse() { //Collapses if the falling block goes below initial position of the long block.
    // this.add.text(HALF_WIDTH, HALF_HEIGHT, this.fallBlock.y);
    // this.add.text(HALF_WIDTH, HALF_HEIGHT + 40, this.fallBlock2.y);

    if (this.fallBlock.y > 570 && this.fallBlockTwo.y > 720) { 
      return true;
    }
    else if (this.fallBlock.y > 570 || this.fallBlockTwo.y > 720){
      this.game.registry.set("giftsSaved", this.game.registry.get("giftsSaved") + 1);
      this.failureText2.setText("Nice try, you got one out of two gifts!");
      return true;
    }
    else {
      return false;
    }
  }

}
