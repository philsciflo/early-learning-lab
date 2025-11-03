import Phaser from "phaser";
import { FixItScene } from "./FixItScene";
import { BlockGameScoringData, Position } from "../scoring.ts";
import { HALF_WIDTH, HEIGHT, WIDTH } from "../constants.ts";
import { AudioManager } from "../AudioManager";

export class Level1 extends FixItScene<BlockGameScoringData> {
  constructor() {
    super("Level1", "Level1", "Level2Drop", "Prevent what will happen!", "Level1Drop",{ key: "UIScene", active: true, visible: true });
  }

  preload() {
    super.preload();
  }

  create() {
    //Background and UI elements + Setting up the physics envrioment
    const GROUND_CATEGORY = this.matter.world.nextCategory();
    var shapes = this.cache.json.get('shapes'); //for the physics mapping
    this.matter.world.setBounds();
    this.createBackground();
    this.groundv2 = this.matter.add.image(HALF_WIDTH, HEIGHT - 48, "groundv2", undefined, { isStatic: true }).setDisplaySize(this.scale.width + 58, 120 ).setCollisionCategory(GROUND_CATEGORY);

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
      

    //Movable Blocks
    this.movableBlockOne = this.matter.add.image(1700, 720, "scaffolding", undefined, {
      isStatic: false,
      shape: shapes.scaffolding
    }).setScale(0.195);
    this.movableBlockOne.setIgnoreGravity(false);
    this.movableBlockOne.setFixedRotation();
    //this.movableBlockOne.setCollidesWith([GROUND_CATEGORY])


    this.movableBlockTwo = this.matter.add.image(1700, 900, "scaffolding", undefined, {
      isStatic: false,
      shape: shapes.scaffolding
    }).setScale(0.195);
    this.movableBlockTwo.setIgnoreGravity(false);
    this.movableBlockTwo.setFixedRotation();


    this.movableBlockOne.setInteractive();
        this.input.setDraggable(this.movableBlockOne);
        this.movableBlockOne.on("dragstart", () => {
            this.movableBlockOne.setIgnoreGravity(true);
            this.movableBlockOne.setFixedRotation(true);
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
            this.movableBlockTwo.setFixedRotation(true);
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
    }


    //Movable Blocks Data Tracking
    this.movableBlockOne.on("dragstart", () => { 
      this.startPositionList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
      this.blockNameList.push("BlockOne")
      this.numberOfBlocksMoved += 1;
      this.movableBlockOne.setScale(0.21);//larger when dragging

      this.dragInterval = this.time.addEvent({
        delay: 1000,
        callback: () => {
          this.currentPathList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000}) //Pushes location + time to list every (delay)ms. 
        },
        callbackScope: this,
        loop: true
      }

      );
    });;
    
    this.movableBlockOne.on("dragend", () => { 
      this.endPositionList.push({x: Math.round(this.movableBlockOne.x), y: Math.round(this.movableBlockOne.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
      this.middlePositionList.push(this.currentPathList); 
      this.currentPathList = [];
      this.movableBlockOne.setScale(0.2);//goes back to correct size

      if (this.dragInterval) {
        this.dragInterval.destroy(); //Destroy the event once it's finished.
      }
    });


    this.movableBlockTwo.on("dragstart", () => { 
      this.startPositionList.push({x: Math.round(this.movableBlockTwo.x), y: Math.round(this.movableBlockTwo.y), time: Math.round((this.time.now - this.time.startTime) / 1) / 1000});
      this.blockNameList.push("BlockTwo")
      this.numberOfBlocksMoved += 1;
      this.movableBlockTwo.setScale(0.21);//larger when dragging

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
      this.movableBlockTwo.setScale(0.2);//goes back to correct size

      if (this.dragInterval) {
        this.dragInterval.destroy();
      }
    });

    this.createButtons();
    this.renderNavigationButtons();
  }
  
  //This function runs when 'Start' is pressed
  protected startPhysics() {
    this.createCollisionSound();
    this.input.off("drag");
    this.movableBlockOne.disableInteractive();
    this.movableBlockTwo.disableInteractive();
    this.movableBlockTwo.setIgnoreGravity(false);
    this.movableBlockOne.setIgnoreGravity(false);

    this.blockOne.setStatic(false);
    this.blockTwo.setStatic(false);
    this.longBlockOne.setStatic(false);
    this.fallBlock.setStatic(false);

    this.fallBlock.setIgnoreGravity(false);
    this.longBlockOne.setIgnoreGravity(false);
    this.blockOne.setIgnoreGravity(false);
    this.blockTwo.setIgnoreGravity(false);

    this.claw.setTexture("clawOpen"); // change to claw open

    this.time.delayedCall(3000, () => {
    if (!this.didStructureCollapse()) {
      this.anims.resumeAll();
      this.createSuccessScene();
      this.game.registry.set("giftsSaved", this.game.registry.get("giftsSaved") + 1);
      AudioManager.I.playSfx(this, "stage_clear");
      this.registry.set("levelCleared_1", true);
      this.nextSceneButton.setVisible(true);

    }
    else {
      this.anims.resumeAll();
      this.createFailScene();
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
    timeToEnd: Math.round((this.time.now - this.time.startTime) / 1) / 1000,
    structureCollapsed: this.didStructureCollapse(),
  };
}

  protected didStructureCollapse() { //Returns True is structure collapsed
    if (this.fallBlock.y > 560) {
      console.log("True");
      return true;
    }
    else {
      console.log("False");
      return false;
    }
  }

}

