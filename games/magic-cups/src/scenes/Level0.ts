import { GameObjects } from "phaser";
import { MagicCupsScene } from "./MagicCupsScene.ts";
import { tryData_basic } from "../scoring.ts";
import {
  HEIGHT,
  WIDTH,
  HALF_WIDTH,
  QUARTER_HEIGHT,
  QUARTER_HEIGHT_OUTOFCLICKS,
  cupY,
  gemY,
  START,
  END,
} from "../constants";
import { AudioManager } from "../AudioManager";

export class Level0 extends MagicCupsScene<tryData_basic> {
  private gem1!: GameObjects.Sprite;

  private cup: GameObjects.Container;
  private cupTop: GameObjects.Image;
  private cupBottom: GameObjects.Image;

  private targetCup: GameObjects.Image;

  private outOfClicksText: GameObjects.Text;

  private cupTextures: string[] = ["heart_cup", "star_cup", "circle_cup", "dog_cup"];
  private initialGemLocalY: number = 0;

  private choiceWindowStart: number = 0;
  private recordedFirstClick: boolean = false;
  private firstClick: number = 0;
  private clickLocations: {
        x: number;
        y: number;
        timestamp: string;
        timestampUnix: number;
      }[] = [];
  private startTimeUnix: string = "";
  private startTime: string = "";
  private endTimeUnix: string = "";
  private endTime: string = "";

  private successShown = false;
  private isAnimating = false;
  private roundOver = false;

  constructor() {
    super(
      "Level0",
      "Level 0",
      ["Drop the gem! ", "Find the gem! ", "You found the gem!"],
      "MainMenu",
      "Level1",
    );
  }

  
  //pre loading photos for spinning gem animation
  preload() {
    super.preload();
    const pad = (n: number) => n.toString().padStart(5, '0');

    this.load.setPath('assets/gemfile/');
    for (let i = START; i <= END; i++) {
      this.load.image(`gem_${pad(i)}`, `Final_${pad(i)}.png`);
    }
    this.load.setPath('');
  }

  create() {
    super.create();
    const pad = (n: number) => n.toString().padStart(5, '0');

    if (!this.anims.exists('gemSpin')) {
      const frames = Array.from({ length: END - START + 1 }, (_, k) => ({
      key: `gem_${pad(START + k)}`
      }));
      this.anims.create({
        key: 'gemSpin',
        frames,
        frameRate: 20,
        repeat: -1
      });
    }
    
    const onAnyPointerDown = (pointer: Phaser.Input.Pointer) => {
      const now = new Date();
      this.clickLocations.push({
        x: Math.round(pointer.x * 100) / 100,
        y: Math.round(pointer.y * 100) / 100,
        timestamp: this.getTimestamp(),
        timestampUnix: now.getTime(),
      });
    };
    this.input.on("pointerdown", onAnyPointerDown);
    this.setupGem();
    this.setupCups();
    this.successShown = false;
    this.clickLocations = [];
  }

  protected doDrop(): void {
    this.dropClickTime = Date.now();

    const _nowStart = new Date();
    this.startTime = this.getTimestamp();
    this.startTimeUnix = String(_nowStart.getTime());

    this.resetButton.disableInteractive().setAlpha(0.5);

    this.tweens.add({
      targets: this.gem1,
      x: 0,
      y: -this.targetCup.y,
      ease: "Quad.easeIn",
      duration: 1000,
      onComplete: () => {
        this.choiceWindowStart = Date.now();
        this.recordedFirstClick = false;
        this.targetCup.removeAllListeners("pointerdown")
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", () => {
            this.onCupClick(this.targetCup),
            AudioManager.I.playSfx(this, "cup_sound");
          });

        this.resetButton.setInteractive({ useHandCursor: true }).setAlpha(1);;
      }
    });
        this.outOfClicksText = this.add.text(HALF_WIDTH, QUARTER_HEIGHT_OUTOFCLICKS, "", 
        {
            fontFamily: "Body",
            fontSize: 60,
            color: "#feb77cff",
            stroke: "#000000",
            strokeThickness: 3,
            align: "left",
            shadow: {
            offsetX: 3,
            offsetY: 3,
            color: "#3d3d3dff",
            blur: 1,
            stroke: true,
            fill: true,
            },
        },
        )
        .setOrigin(0.5)
        .setVisible(false);
  }

  protected doReset(): void {
    this.resetScene();
  }

  protected recordScoreDataForCurrentTry(): tryData_basic {
    const totalScore = Number(this.registry.get(this.scoreDataKey) ?? 0);
    const seconds = Number((this.duration / 1000).toFixed(2));
    const click = Number((this.firstClick / 1000).toFixed(2));

    return {
      targetScore: isNaN(totalScore) ? 0 : totalScore,
      distractorScore: 0,
      firstClick: isNaN(click) ? 0 : click,
      clickLocations: this.clickLocations,
      totalClicks: this.clickLocations.length,
      gem_location: this.cup.name,
      startTime: this.startTime,
      startTimeUnix: this.startTimeUnix,
      endTime: this.endTime,
      endTimeUnix: this.endTimeUnix,
      tryDuration: isNaN(seconds) ? 0 : seconds,
      correct: (totalScore ?? 0) > 0,
    };
  }


  private setupGem() {
    this.gem1 = this.add
      .sprite(0, -gemY + 70, 'gem_00000')
      .setOrigin(0.5)
      .setScale(0.11)
      .play("gemSpin");
      
  }

  private setupCups() {
    const cupBases = Phaser.Utils.Array.Shuffle([...this.cupTextures]);

    this.cupTop = this.add.image(0, 0, `${cupBases[0]}_top`).setOrigin(0.5).setScale(0.4);
    this.cupBottom = this.add.image(0, 0, `${cupBases[0]}_bottom`).setOrigin(0.5).setScale(0.4);

    this.cup = this.add.container(HALF_WIDTH, cupY, [this.cupTop, this.cupBottom]);
    this.cup.setName("Middle Cup");

    this.cup.addAt(this.gem1, 1);
    this.initialGemLocalY = this.gem1.y;

    (this.cupBottom as any).cupContainer = this.cup;
    (this.cupBottom as any).cupBottom = this.cupBottom;
    (this.cupBottom as any).cupTop = this.cupTop;

    this.targetCup = this.cupBottom;

    this.targetCup.removeAllListeners("pointerdown");
    this.targetCup.disableInteractive();
    this.enableHoverLift(this.cupBottom);
  }


  private onCupClick(_bottom: GameObjects.Image) {
    if (!this.recordedFirstClick) {
      this.firstClick = Date.now() - this.choiceWindowStart; // ms
      this.recordedFirstClick = true;
    }

    this.targetCup.disableInteractive();
    this.resetButton.disableInteractive();

    const tipAngle = -120;

    // Tips the cup first
    this.tweens.add({
      targets: [this.cupTop, this.cupBottom],
      angle: tipAngle,
      duration: 700,
      ease: "Sine.easeOut",
      hold: 120,
      onComplete: () => {
        AudioManager.I.playSfx(this, "gem_sound");
        // Reveals the gem
        this.tweens.add({
          targets: this.gem1,
          x: -120,
          y: 65,
          duration: 2000,
          ease: "Power2",
          onComplete: () => {
            const _nowEnd = new Date();
            this.endTime = this.getTimestamp();
            this.endTimeUnix = String(_nowEnd.getTime());

            if (!this.successShown) {
              this.successShown = true;
              this.createSuccessScene();
            }
            this.duration = Date.now() - this.dropClickTime;
            const currentScore = Number(this.registry.get(this.scoreDataKey) ?? 0);
            this.registry.set(this.scoreDataKey, currentScore + 1);
  
            this.resetButton.setInteractive({ useHandCurosr: true});
          }
        });
      }
    });
  }

  private enableHoverLift(cupBottom: Phaser.GameObjects.Image) {
    const cont = (cupBottom as any).cupContainer as Phaser.GameObjects.Container;
    if (!cont) return;

    const LIFT = 8;
    const DURATION = 120;

    const getBaseY = () => {
      if ((cont as any).__baseY === undefined) (cont as any).__baseY = cont.y;
      return (cont as any).__baseY as number;
    };

    if ((cont as any).__hoverEnabled === undefined) (cont as any).__hoverEnabled = true;

    const killHoverTweens = () => this.tweens.killTweensOf(cont);

    const liftUp = () => {
      if (this.isAnimating || this.roundOver || !cupBottom.input?.enabled) return;
      if (!(cont as any).__hoverEnabled) return;

      (cont as any).__baseY = cont.y;

      killHoverTweens();
      this.tweens.add({
        targets: cont,
        y: getBaseY() - LIFT,
        duration: DURATION,
        ease: "Sine.easeOut",
      });
    };

    const settleDown = () => {
      killHoverTweens();
      this.tweens.add({
        targets: cont,
        y: getBaseY(),
        duration: DURATION,
        ease: "Sine.easeOut",
      });
    };

    (cont as any).__resetHover = () => {
      killHoverTweens();
      cont.setY(getBaseY());
    };

    cupBottom.on("pointerover", liftUp);
    cupBottom.on("pointerout", settleDown);
    cupBottom.on("pointerdown", settleDown);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cupBottom.off("pointerover", liftUp);
      cupBottom.off("pointerout", settleDown);
      cupBottom.off("pointerdown", settleDown);
    });
  }
  
  private resetScene() {
    this.successShown = false;
    if (this.successTimer) { this.successTimer.destroy; this.successTimer = undefined; }
    
    // stop any animation and timed events
    this.tweens.killTweensOf([this.cupTop, this.cupBottom, this.gem1, this.cup, this.successPeeko, this.successBubble, 
                              this.successText, this.successText2]);
    this.time.removeAllEvents();
    this.successPeeko?.destroy(); this.successPeeko = undefined;
    this.successBubble?.destroy(); this.successBubble = undefined;
    this.successText?.destroy(); this.successText = undefined;
    this.successText2?.destroy(); this.successText2 = undefined;
    this.successOverlay?.destroy(); this.successOverlay = undefined;
    
    // resetting it back to its original position
    (this.cup as any).__resetHover?.();

    // Randomize cup 
    const cupImages = Phaser.Utils.Array.Shuffle([...this.cupTextures]);
    this.cupTop.setTexture(`${cupImages[0]}_top`);
    this.cupBottom.setTexture(`${cupImages[0]}_bottom`);

    if (this.cup && this.gem1 && this.cup.getIndex(this.gem1) !== 1) {
      this.cup.remove(this.gem1, false);
      this.cup.addAt(this.gem1, 1);
    }

    const cupContainer = this.cup;
    this.tweens.killTweensOf(cupContainer);
    cupContainer.list.forEach(part => this.tweens.killTweensOf(part));
    cupContainer.setPosition(HALF_WIDTH, cupY).setAngle(0).setRotation(0);

    cupContainer.list.forEach((part: any) => {
      if (part?.setRotation) part.setRotation(0);
      if (part?.setAngle) part.setAngle(0);
    });

    (cupContainer as any).__hoverEnabled = true;
    (cupContainer as any).__baseY = cupContainer.y;
    (cupContainer as any).__resetHover?.();

    this.gem1.setPosition(0, -gemY + 65);

    this.outOfClicksText.setVisible(false);
    this.clickLocations = [];

    this.targetCup.removeAllListeners("pointerdown");

    this.targetCup.disableInteractive();
    this.resetButton.setInteractive({ useHandCursor: true }).setAlpha(1);

    // Reset score for this try
    this.registry.set(this.scoreDataKey, 0);
  }

  private getTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const timestamp = `${hours}:${minutes}:${seconds}`;
    return timestamp;
  }
}
