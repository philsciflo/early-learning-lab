import { Scene, GameObjects } from "phaser";
import { MagicCupsScene } from "./MagicCupsScene.ts";
import { tryData_advanced, getPlayerOverallScore } from "../scoring.ts";
import {
  HEIGHT,
  WIDTH,
  QUARTER_HEIGHT,
  QUARTER_HEIGHT_OUTOFCLICKS,
  HALF_WIDTH,
  QUARTER_WIDTH,
  HALF_HEIGHT,
  PLAYER_ID_DATA_KEY,
  gameAreaWidth,
  gameAreaHeight,
  gameAreaX,
  gameAreaY,
  cupY,
  cloudY,
  gemY,
  START,
  END,
} from "../constants";
import { AudioManager } from "../AudioManager";


export class Level3 extends MagicCupsScene<tryData_advanced> {
    private gem1!: GameObjects.Sprite;
    private gem2!: GameObjects.Sprite;

    private targetCup1: GameObjects.Image;
    private targetCup2: GameObjects.Image;
    private distractorCup1: GameObjects.Image;
    private distractorCup2: GameObjects.Image;
    private guaranteedCup: GameObjects.Image | null = null;
    private flipCandidateCup: GameObjects.Image | null = null;

    private cloud: GameObjects.Image;

    private cupClicks: number = 2;

    private clicksText: GameObjects.Text;

    private outOfClicksText: GameObjects.Text;

    private cupTextures: string[] = ["heart_cup", "star_cup", "circle_cup", "dog_cup"];

    private flipButton: GameObjects.Image;
    private flipUsed: boolean = false;

    private gemsFoundCount: number = 0;
    
    private targets: number = 0;

    private distractors: number = 0;

    private cupChoices: string[] = [];

    private gem_cups: string[] = [];

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

    private lastTwoTargetCupDrops: number[] = [];
    private lastTwoDistractorCupDrops: number[] = [];

    private successShown = false;
    private roundOver = false;
    private isAnimating = false;
    private guaranteedActive = false;

    private flipButtonPulseTween: Phaser.Tweens.Tween | null = null;
    private flipButtonPulseTimer: Phaser.Time.TimerEvent | null = null;



    // Flip Button Pulse Animation Methods
    private startFlipButtonPulseTimer() {
        // Clear any existing timer
        if (this.flipButtonPulseTimer) {
            this.flipButtonPulseTimer.remove();
            this.flipButtonPulseTimer = null;
        }
        
        // Create timer that starts pulse animation after 2 seconds
        this.flipButtonPulseTimer = this.time.delayedCall(2000, () => {
            this.startFlipButtonPulseAnimation();
        });
    }

    private startFlipButtonPulseAnimation() {
        // Stop any existing pulse animation
        this.stopFlipButtonPulse();
        
        // Create the pulsing animation
        this.flipButtonPulseTween = this.tweens.add({
            targets: this.flipButton,
            scale: 0.65, // Slightly larger scale
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1 // Infinite repeat
        });
    }

    private stopFlipButtonPulse() {
        // Stop the tween animation
        if (this.flipButtonPulseTween) {
            this.flipButtonPulseTween.stop();
            this.flipButtonPulseTween = null;
        }
        
        if (this.flipButtonPulseTimer) {
            this.flipButtonPulseTimer.remove();
            this.flipButtonPulseTimer = null;
        }

        // Reset the button scale
        this.flipButton.setScale(0.6);
    }

    constructor(){
        super(
            "Level3",
            "Level 3", 
            ["Drop the gems!", "Find the gems!", "You found the gems!"],
            "Level2",
            "GameOver",
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

    create(){
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

        this.setupGem();
        this.setupCups();
        this.setupCloud();

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

        // Click counter text
        this.clicksText = this.add.text(QUARTER_WIDTH / 2, QUARTER_HEIGHT + 110, `Clicks left: ${this.cupClicks}`, 
        {
            fontFamily: "Body",
            fontSize: 25,
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
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
        );
        
        // out of clicks notification
        this.outOfClicksText = this.add.text(HALF_WIDTH, QUARTER_HEIGHT_OUTOFCLICKS, "", 
        {
            fontFamily: "Body",
            fontSize: 50,
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

        // flip cup button
        this.flipButton = this.add.image(HALF_WIDTH+QUARTER_WIDTH+QUARTER_WIDTH/2 - 80, Math.round(HEIGHT * 0.78) + 70, "flipBtn")
            .setOrigin(0.5, 0.5)
            .setScale(0.6)
            .setAlpha(0.5);

        this.flipButton.on("pointerdown", () => {
            // Stop the pulsing animation AND the timer when flip button is pressed
            this.stopFlipButtonPulse();
            this.cupFlip(),
            AudioManager.I.playSfx(this, "button_sound");
            AudioManager.I.playSfx(this, "cup_sound");


            // change texture
            this.flipButton.setTexture("flipBtnPressed");

            // change back texture
            this.time.delayedCall(400, () => {
                this.flipButton.setTexture("flipBtn");
                this.time.delayedCall(400, () => {
                    this.flipButton.setAlpha(0.5);
                });

            });
            
        });
        this.flipButton.disableInteractive(); // disabled at the start

        this.targets = 0;
        this.distractors = 0;
        this.gem_cups = [];
        this.clickLocations = [];
    }

    protected async doDrop(): Promise<void> {
        this.roundOver = false; // reset round state

        // stopping all tweens that could keep moving things after reset
        this.time.removeAllEvents();
        this.tweens.killTweensOf([this.gem1, this.gem2, this.cloud]);

        const p1 = (this.gem1 as any).parentContainer as Phaser.GameObjects.Container | null;
        if (p1) { p1.remove(this.gem1, false); this.children.add(this.gem1); }

        const p2 = (this.gem2 as any).parentContainer as Phaser.GameObjects.Container | null;
        if (p2) { p2.remove(this.gem2, false); this.children.add(this.gem2); }

        this.dropClickTime = Date.now();

        const _nowStart = new Date();
        this.startTime = this.getTimestamp();
        this.startTimeUnix = String(_nowStart.getTime());

        this.cupChoices = [];

        console.log("Drop pressed");
        

        this.gemsFoundCount = 0;

        // disable reset button while drop is running
        this.resetButton.disableInteractive().setAlpha(0.5);

        // reset clicks counter
        this.cupClicks = 2;
        this.clicksText.setText(`Clicks left: ${this.cupClicks}`);
        
        //reset flip button
        this.flipUsed = false;
        this.flipButton.disableInteractive();

        // Disable cup interaction during drop animation
        [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2].forEach(cup => {
            cup.disableInteractive();
        });

        // tween and delay methods
        const delay = (ms: number) => new Promise(resolve => this.time.delayedCall(ms, resolve));
        const tweenTo = (targets: any, props: any, duration = 1000): Promise<void> => {
            return new Promise(resolve => {
                this.tweens.add({
                    targets,
                    ...props,
                    duration,
                    onComplete: () => resolve()
                });
            });
        };


        // --- Drop first gem ---
        await delay(200);
        // Cloud appears
        this.cloud.setVisible(true);
        // Gem disappears
        this.gem1.setVisible(false);

        // pick a random cup for gem1
        const targetCups = [this.targetCup1, this.targetCup2];
        const randomTargetCup = this.chooseCup(targetCups, this.lastTwoTargetCupDrops);

        // middle point for cloud
        const middleX1 = (this.targetCup1.getWorldTransformMatrix().tx + this.targetCup2.getWorldTransformMatrix().tx) / 2;
        const middleY1 = (this.targetCup1.getWorldTransformMatrix().ty) - 130;

       // tween cloud and gem1 simultaneously
        await Promise.all([
            AudioManager.I.playSfx(this, "cloud_sound"),
            tweenTo(this.cloud, { 
                x: middleX1, 
                y: middleY1, 
                ease: "Quad.easeIn" 
            }),
            tweenTo(this.gem1, { 
                x: randomTargetCup.x, 
                y: randomTargetCup.y - 20, 
                ease: "Quad.easeIn" 
            })
        ]);

        // Gem 1 placement in container
        {
            const cup = randomTargetCup as any;
            const cupContainer = cup.cupContainer as Phaser.GameObjects.Container | undefined;
            if (cupContainer) {
                // move gem from world display list into the cup container between bottom/top
                this.gem1.removeFromDisplayList();
                cupContainer.addAt(this.gem1, 1);
                // center between sprites (local space)
                this.gem1.setPosition(0, 0);
                this.gem_cups.push(cup.name);
            } else {
                console.warn("target cup missing .cupContainer");
            }
        }

        this.gem1.setVisible(true);

        (randomTargetCup as any).gem = this.gem1;
    
        this.guaranteedCup    = (this.targetCup1 as any).gem ? this.targetCup1 : this.targetCup2; // with gem
        this.flipCandidateCup = (this.targetCup1 as any).gem ? this.targetCup2 : this.targetCup1; // empty

        await delay(500);
        this.cloud.setVisible(false);
        //move cloud to gem2 position
        this.cloud.setPosition(this.gem2.x, this.gem2.y);


        // --- Drop second gem ---
        await delay(500);
        this.gem2.setVisible(true);
        await delay(500);
        // Cloud appears
        this.cloud.setVisible(true);
        // Gem disappears
        this.gem2.setVisible(false);

        // pick a random cup for gem2
        const distractorCups = [this.distractorCup1, this.distractorCup2];
        const randomDistractorCup = this.chooseCup(distractorCups, this.lastTwoDistractorCupDrops);

        // middle point for cloud
        const middleX2 = (this.distractorCup1.getWorldTransformMatrix().tx + this.distractorCup2.getWorldTransformMatrix().tx) / 2;
        const middleY2 = (this.distractorCup1.getWorldTransformMatrix().ty) - 130;

        // tween cloud and gem2 simultaneously
        await Promise.all([
            AudioManager.I.playSfx(this, "cloud_sound"),
            tweenTo(this.cloud, { 
                x: middleX2, 
                y: middleY2, 
                ease: "Quad.easeIn" 
            }),
            tweenTo(this.gem2, { 
                x: randomDistractorCup.x, 
                y: randomDistractorCup.y - 20, 
                ease: "Quad.easeIn" 
            })
        ]);

        // Gem 2 placement in container
        {
            const cup = randomDistractorCup as any;
            const cupContainer = cup.cupContainer as Phaser.GameObjects.Container | undefined;
            if (cupContainer) {
                this.gem2.removeFromDisplayList();
                cupContainer.addAt(this.gem2, 1);
                this.gem2.setPosition(0, 0);
                this.gem_cups.push(cup.name);
            } else {
                console.warn("distractor cup missing .cupContainer");
            }
        }

        this.gem2.setVisible(true);

        (randomDistractorCup as any).gem = this.gem2;
        await delay(500);
        this.cloud.setVisible(false);

        // re-enable cup interaction, reset button and flip button
        [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2].forEach(cup => {
            cup.removeAllListeners("pointerdown"); 
            if ((cup as any).__locked) return; // skip locked cups
            cup.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                this.cupChoices.push(cup.name),
                this.onCupClick(cup),
                AudioManager.I.playSfx(this, "cup_sound");
            });
        });
        this.resetButton.setInteractive({ useHandCursor: true }).setAlpha(1);
        this.flipButton.setInteractive({ useHandCursor: true }).setAlpha(1);
        
        this.choiceWindowStart = Date.now();
        this.recordedFirstClick = false;

        this.startFlipButtonPulseTimer();

    }

    protected doReset(): void {
        console.log("Reset pressed");
        this.resetScene();
    
    }

    protected recordScoreDataForCurrentTry(): tryData_advanced {
        const target = Number(this.targets ?? 0);
        const distractor = Number(this.distractors ?? 0);
        const seconds = Number((this.duration / 1000).toFixed(2));
        const click = Number((this.firstClick / 1000).toFixed(2));

        return {
            targetScore: isNaN(target) ? 0 : target,
            distractorScore: isNaN(distractor) ? 0 : distractor,
            cupChoices: this.cupChoices.join(", "),
            firstClick: isNaN(click) ? 0 : click,
            clickLocations: this.clickLocations,
            totalClicks: this.clickLocations.length,
            gem_locations: this.gem_cups.join(", "),
            startTime: this.startTime,
            startTimeUnix: this.startTimeUnix,
            endTime: this.endTime,
            endTimeUnix: this.endTimeUnix,
            tryDuration: isNaN(seconds) ? 0 : seconds,
            correct: (target + distractor) > 0,
        };
    }

    private setupGem(){
        this.gem1 = this.add
            .sprite(HALF_WIDTH, gemY, 'gem_00000')
            .setOrigin(0.5)
            .setScale(0.1)
            .play('gemSpin');
        this.gem2 = this.add
            .sprite(HALF_WIDTH, gemY, 'gem_00000')
            .setOrigin(0.5)
            .setScale(0.1)
            .setVisible(false)
            .play('gemSpin');
    }

    private setupCups(){
        const spacing = WIDTH / 6;

        const cupBases = Phaser.Utils.Array.Shuffle([...this.cupTextures]);

        // First cup
        const lt_bottom = this.add.image(0, 0, `${cupBases[0]}_bottom`).setOrigin(0.5).setScale(0.34);
        const lt_top = this.add.image(0, 0, `${cupBases[0]}_top`).setOrigin(0.5).setScale(0.34);
        const lt_cont = this.add.container(spacing * 1.7, cupY, [lt_top, lt_bottom]);
        (lt_bottom as any).cupContainer = lt_cont;
        (lt_bottom as any).cupBottom = lt_bottom;
        (lt_bottom as any).cupTop = lt_top;
        this.targetCup1 = lt_bottom;
        this.targetCup1.name = "LeftTargetCup";

        // Second cup
        const rt_bottom = this.add.image(0, 0, `${cupBases[1]}_bottom`).setOrigin(0.5).setScale(0.34);
        const rt_top = this.add.image(0, 0, `${cupBases[1]}_top`).setOrigin(0.5).setScale(0.34);
        const rt_cont = this.add.container(spacing * 2.45, cupY, [rt_top, rt_bottom]);
        (rt_bottom as any).cupContainer = rt_cont;
        (rt_bottom as any).cupBottom = rt_bottom;
        (rt_bottom as any).cupTop = rt_top;
        this.targetCup2 = rt_bottom;
        this.targetCup2.name = "RightTargetCup";

        // Third cup
        const ld_bottom = this.add.image(0, 0, `${cupBases[2]}_bottom`).setOrigin(0.5).setScale(0.34);
        const ld_top = this.add.image(0, 0, `${cupBases[2]}_top`).setOrigin(0.5).setScale(0.34);
        const ld_cont = this.add.container(spacing * 3.6, cupY, [ld_top, ld_bottom]);
        (ld_bottom as any).cupContainer = ld_cont;
        (ld_bottom as any).cupBottom = ld_bottom;
        (ld_bottom as any).cupTop = ld_top;
        this.distractorCup1 = ld_bottom;
        this.distractorCup1.name = "LeftDistractorCup";

        // Fourth cup
        const rd_bottom = this.add.image(0, 0, `${cupBases[3]}_bottom`).setOrigin(0.5).setScale(0.34);
        const rd_top = this.add.image(0, 0, `${cupBases[3]}_top`).setOrigin(0.5).setScale(0.34);
        const rd_cont = this.add.container(spacing * 4.3, cupY, [rd_top, rd_bottom]);
        (rd_bottom as any).cupContainer = rd_cont;
        (rd_bottom as any).cupBottom = rd_bottom;
        (rd_bottom as any).cupTop = rd_top;
        this.distractorCup2 = rd_bottom;
        this.distractorCup2.name = "RightDistractorCup";

        this.enableHoverLift(this.targetCup1);
        this.enableHoverLift(this.targetCup2);
        this.enableHoverLift(this.distractorCup1);
        this.enableHoverLift(this.distractorCup2);
    }

    private setCupsInteractive(enabled: boolean) {
        [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2].forEach(c => {
            if (!c) return;
            const locked = (c as any).__locked === true;
            if (enabled && !locked) {
                c.setInteractive({ useHandCursor: true });
            } else {
                c.disableInteractive();
            }
        });
    }

    private setupCloud(){
        this.cloud = this.add.image(HALF_WIDTH, cloudY, "cloud")
        .setOrigin(0.5)
        .setScale(0.25)
        .setVisible(false);
    }

    private chooseCup(cups: GameObjects.Image[], lastTwoCupDrops: number[]) {
        let idx = Math.floor(Math.random() * cups.length);
        if (lastTwoCupDrops.length >= 2 && lastTwoCupDrops[0] === lastTwoCupDrops[1] && idx === lastTwoCupDrops[1] && cups.length > 1) {
            const poolIdx = [...cups.keys()].filter(i => i !== lastTwoCupDrops[1]);
            console.log(`Checking poolIDX: ${poolIdx}`);
            idx = poolIdx[Math.floor(Math.random() * poolIdx.length)];
            lastTwoCupDrops = [];
        }

        lastTwoCupDrops.push(idx);
        if (lastTwoCupDrops.length > 2) lastTwoCupDrops.shift();

        const randomCup = cups[idx];
        console.log(`Chosen cup index: ${idx}, lastTwoCupDrops: ${lastTwoCupDrops}`);
        return randomCup;
    }

    private onCupClick(cup: GameObjects.Image){
        // stops the flip button pulse animation if player decides not to use the flip button
        this.stopFlipButtonPulse();
        if (this.flipButtonPulseTimer) {
            this.flipButtonPulseTimer.remove();
            this.flipButtonPulseTimer = null;
        }

        if (!this.recordedFirstClick) {
            this.firstClick = Date.now() - this.choiceWindowStart; // ms
            this.recordedFirstClick = true;
        }

        if (this.flipCandidateCup && cup === this.flipCandidateCup && !this.flipUsed) {
            this.flipUsed = true; 
            this.stopFlipButtonPulse();
            this.flipButton.disableInteractive().setAlpha(0.5);
            console.log("Flip disabled because player clicked the flip cup manually.");
        }

        if (this.guaranteedCup && cup === this.guaranteedCup && !this.flipUsed) {
            this.flipUsed = true;
            this.stopFlipButtonPulse();      
            this.flipButton.disableInteractive().setAlpha(0.5);
            console.log("Flip disabled because player clicked the flip cup manually.");
        }

        console.log("Cup clicked");
        this.isAnimating = true;
        this.setCupsInteractive(false); // disable all cups during animation

        if (!this.roundOver) {
            this.cupClicks = Math.max(0, this.cupClicks - 1);
            this.clicksText.setText(`Clicks left: ${this.cupClicks} `);
            console.log(`Cup clicks left: ${this.cupClicks}`);
        }

        // making sure flip button doesn't work when there are no more clicks.
        if (this.cupClicks === 0 && !this.flipUsed) {
            this.stopFlipButtonPulse();
            this.flipButton.disableInteractive().setAlpha(0.5);
        }
        
        const gem = (cup as any).gem;
        const cupContainer = (cup as any).cupContainer as Phaser.GameObjects.Container;
        if (!cupContainer) {
            this.isAnimating = false;
            this.setCupsInteractive(true);
            return;
        } else {
            (cupContainer as any).__hoverEnabled = false;
        }

        const partsToTip = (cupContainer.list as Phaser.GameObjects.Image[]).filter(part => part !== gem);
        const tipAngle = -120; // the tipping angle of the cup
        const dir = tipAngle >= 0 ? 1 : -1; // directions +1 right, -1 left

        // Animation: Tip the cup parts
        this.tweens.add({
            targets: partsToTip,
            angle: tipAngle,
            duration: 700,
            ease: "Sine.easeOut",
            hold: 120,
            onComplete: () => {
                if (gem && (!this.roundOver || this.successShown)) {
                    AudioManager.I.playSfx(this, "gem_sound");
                    // If gem is present: reveal after the tipping
                    // Repositions the gem to the same world coordinates
                    const EJECT = 100;
                    const LIP = 65;
                    const exitLocalX = gem.x + dir * EJECT;
                    const exitLocalY = gem.y + LIP;
                    const p = new Phaser.Math.Vector2();
                    cupContainer.getWorldTransformMatrix().transformPoint(exitLocalX, exitLocalY, p);

                    this.countGemOnceForCup(cup);

                    // Animation: Revealing the gem
                    this.tweens.add({
                        targets: gem,
                        x: -EJECT, 
                        y: LIP,
                        duration: 2000,
                        ease: "Power2",
                        onComplete: () => {
                            cupContainer.remove(gem, false);
                            gem.setPosition(p.x, p.y);
                            (cup as any).gem = null; // Clear gem reference
        
                            this.gemsFoundCount = this.gemsFoundCount + 1;
                            console.log(`gems found: ${this.gemsFoundCount}`);
                            if (this.guaranteedActive && this.guaranteedCup === cup) {
                                const _nowEnd = new Date();
                                this.endTime = this.getTimestamp();
                                this.endTimeUnix = String(_nowEnd.getTime());
                                this.duration = Date.now() - this.dropClickTime;
                                this.successShown = true;
                                this.roundOver = true;
                                this.createSuccessScene();
                                this.resetButton.setInteractive({ useHandCursor: true });
                                [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2].forEach(c => {
                                    const cont = (c as any).cupContainer as Phaser.GameObjects.Container | undefined;
                                    const alreadyTipped = cont && (cont.list as Phaser.GameObjects.Image[]).some(part => part.angle !== 0);
                                    if (!(c as any).__locked && !alreadyTipped) {
                                        c.setInteractive({ useHandCursor: true });
                                    }
                                });
                                this.isAnimating = false;
                                return; // prevent further logic running

                            }
                            if (this.gemsFoundCount >=2) {
                                const _nowEnd = new Date();
                                this.endTime = this.getTimestamp();
                                this.endTimeUnix = String(_nowEnd.getTime());
                                this.duration = Date.now() - this.dropClickTime;
                                if (!this.successShown) {
                                    this.createSuccessScene();
                                }
                                this.resetButton.setInteractive({ useHandCursor: true });
                                [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2].forEach(c => 
                                    {
                                        if (!(c as any).__locked) c.setInteractive({ useHandCursor: true });
                                    });
                                this.roundOver = true;
                                this.isAnimating = false;

                            } else if (this.cupClicks === 0) {
                                // one was found, but no clicks left, then reveal the correct cup
                                const _nowEnd = new Date();
                                this.endTime = this.getTimestamp();
                                this.endTimeUnix = String(_nowEnd.getTime());
                                this.duration = Date.now() - this.dropClickTime;
                                this.revealCorrectCup(false);
                                this.createFailScene();
                                this.roundOver = true;

                                // keep cups clickable after out of clicks
                                [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2].forEach
                                (c => { if (!(c as any).__locked) c.setInteractive({ useHandCursor: true });
                                });
                                this.isAnimating = false;
                            } else {
                                // still playing
                                this.isAnimating = false;
                                this.setCupsInteractive(true); // Re-enable cups for clicking
                            }
                        }
                    });

                }  else {
                    // wrong cup
                    if (this.cupClicks === 0 && this.gemsFoundCount < 2 && !this.roundOver){
                        if (!this.flipUsed) {
                            this.stopFlipButtonPulse();
                            this.flipButton.disableInteractive().setAlpha(0.5);
                        }
                        const _nowEnd = new Date();
                        this.endTime = this.getTimestamp();
                        this.endTimeUnix = String(_nowEnd.getTime());
                        this.duration = Date.now() - this.dropClickTime;
                        this.revealCorrectCup(false);
                        this.createFailScene();
                        this.roundOver = true;
                    }

                    // allow tipping after clicks run out
                    [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2].forEach(c => c.setInteractive({ useHandCursor: true }));
                    this.isAnimating = false;
                    }
                }  
        });
    }

    private revealCorrectCup(awardPoints = false) {
        const cups: Phaser.GameObjects.Image[] = [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2]
        .filter(Boolean) as Phaser.GameObjects.Image[];

        cups.forEach((cup) => { 
            const gem = (cup as any).gem as Phaser.GameObjects.Image | undefined;
            const cupContainer = (cup as any).cupContainer as Phaser.GameObjects.Container | undefined;
            if (!gem || !cupContainer) return; // skip if no gem or container

            const partsToTip = (cupContainer.list as Phaser.GameObjects.Image[]).filter(go => go !== gem);
            const tipAngle = -120; // the tipping angle of the cup
            const dir = tipAngle >= 0 ? 1 : -1; // directions +1 right, -1 left
            const EJECT = 100;
            const LIP = 65;

            const p = new Phaser.Math.Vector2();
            cupContainer.getWorldTransformMatrix().transformPoint(gem.x + dir * EJECT, gem.y + LIP, p);

            // Animation: Tip the cup parts
            this.tweens.add({
                targets: partsToTip,
                angle: tipAngle,
                duration: 700,
                ease: "Sine.easeOut",
                hold: 120,
                onComplete: () => {
                    this.tweens.add({
                        targets:gem,
                        x: -EJECT, 
                        y: LIP,
                        duration: 2000,
                        ease: "Power2",
                        onComplete: () => {
                            cupContainer.remove(gem, false);
                            gem.setPosition(p.x, p.y);
                            if (awardPoints) {
                                const currentScore = Number(this.registry.get(this.scoreDataKey));
                                this.registry.set(this.scoreDataKey, currentScore + 1);
                            }
                        }
                    });
                }
            });
        });
    }
    private cupFlip() {
        if (this.flipUsed) return;
        this.flipUsed = true;

        this.guaranteedActive = true;
        const cupImageToLock = this.flipCandidateCup;
        let cupContainerToFlip: GameObjects.Container | null = null;

        if (cupImageToLock) {
            cupContainerToFlip = cupImageToLock.parentContainer as Phaser.GameObjects.Container;
            (cupImageToLock as any).__locked = true;
            cupImageToLock.disableInteractive();
            cupImageToLock.removeAllListeners("pointerdown"); 
            cupImageToLock.setAlpha(0.9);
            if (cupContainerToFlip) {
                (cupContainerToFlip as any).__hoverEnabled = false;  
                (cupContainerToFlip as any).__noHover = true;  
            }
        } 

        // Flip animation for the revealed empty cup
        if (cupContainerToFlip) {
            this.tweens.add({
                targets: cupContainerToFlip,
                angle: 180,
                duration: 600,
                ease: "Cubic.easeInOut",
                onComplete: () => {
                    this.tweens.add({
                        targets: cupContainerToFlip,
                        x: cupContainerToFlip.x + 10,
                        yoyo: true,
                        repeat: 3,
                        duration: 100
                    });
                }
            });
        }

        this.stopFlipButtonPulse();
        this.flipButton.disableInteractive();
    }

    private enableHoverLift(cupBottom: Phaser.GameObjects.Image) {
        const cont = (cupBottom as any).cupContainer as Phaser.GameObjects.Container;
        if (!cont) return;

        const LIFT = 8; // pixels to float upward
        const DURATION = 120;

        // remember home Y for reset
        const getBaseY = () => {
            if ((cont as any).__baseY === undefined) (cont as any).__baseY = cont.y;
            return (cont as any).__baseY as number; 
        }

        if ((cont as any).__hoverEnabled === undefined) (cont as any).__hoverEnabled = true;

        // kill any previous hover tweens before making new ones
        const killHoverTweens = () => {
            this.tweens.killTweensOf(cont);
        };

        const liftUp = () => {
            if (this.isAnimating || !cupBottom.input?.enabled) return;
            if (!(cont as any).__hoverEnabled) return;
            if ((cont as any).__noHover) return;
            (cont as any).__baseY = cont.y;

            killHoverTweens();
            this.tweens.add({
            targets: cont,
            y: getBaseY() - LIFT,
            duration: DURATION,
            ease: "Sine.easeOut"
            });
        };

        const settleDown = () => {
            killHoverTweens();
            this.tweens.add({
            targets: cont,
            y: getBaseY(),
            duration: DURATION,
            ease: "Sine.easeOut"
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

    private countGemOnceForCup(cup: Phaser.GameObjects.Image) {
        // Only count the very first reveal for this cup
        if ((cup as any).__scored) return;

        const currentScore = Number(this.registry.get(this.scoreDataKey) ?? 0);

        if (cup.name.includes("Target")) {
            this.targets += 1;
        } else if (cup.name.includes("Distractor")) {
            this.distractors += 1;
        }

        (cup as any).__scored = true; // mark counted
        this.registry.set(this.scoreDataKey, currentScore + 1); // bump on-screen score too
    }

    private resetScene(){
        this.roundOver = false;
        this.isAnimating = false;
        this.successShown = false;
        this.guaranteedActive = false;
        this.guaranteedCup = null;
        this.flipCandidateCup = null;

        if (this.successTimer) { this.successTimer.destroy(); this.successTimer = undefined; }
        if (this.failTimer) { this.failTimer.destroy(); this.successTimer = undefined; }

        this.successPeeko?.destroy(); this.successPeeko = undefined;
        this.successBubble?.destroy(); this.successBubble = undefined;
        this.successText?.destroy(); this.successText = undefined;
        this.successText2?.destroy(); this.successText2 = undefined;
        this.successOverlay?.destroy(); this.successOverlay = undefined;

        this.failPeeko?.destroy(); this.failPeeko = undefined;
        this.failBubble?.destroy(); this.failBubble = undefined;
        this.failureText?.destroy(); this.failureText = undefined;
        this.failureText2?.destroy(); this.failureText2 = undefined;
        this.failureOverlay?.destroy(); this.failureOverlay = undefined;

        // Reset cup clicks
        this.cupClicks = 2;
        this.clicksText.setText(`Clicks left: ${this.cupClicks} `);

        // stopping all tweens that could keep movinv things after reset
        this.tweens.killTweensOf([this.gem1, this.gem2, this.cloud, this.successPeeko, this.successBubble,
                                this.successText, this.successText2, this.failPeeko, this.failBubble,
                                this.failureText, this.failureText2
        ]);
        this.time.removeAllEvents();

        // Reset cups positions & cup images
        const spacing = WIDTH / 6;
        const homeXs = [spacing * 1.7, spacing * 2.45, spacing * 3.6, spacing * 4.3];

        const p1 = (this.gem1 as any).parentContainer as Phaser.GameObjects.Container | null;
        if (p1) { p1.remove(this.gem1, false); this.children.add(this.gem1); }

        const p2 = (this.gem2 as any).parentContainer as Phaser.GameObjects.Container | null;
        if (p2) { p2.remove(this.gem2, false); this.children.add(this.gem2); }

        const cupImages = Phaser.Utils.Array.Shuffle([...this.cupTextures]);

        const cups = [
            {cup: this.targetCup1, base: cupImages[0], x: spacing * 1.7},
            {cup: this.targetCup2, base: cupImages[1], x: spacing * 2.45},
            {cup: this.distractorCup1, base: cupImages[2], x: spacing * 3.6},
            {cup: this.distractorCup2, base: cupImages[3], x: spacing * 4.3 }
        ];

        cups.forEach((c, i) => {
            const cup = c.cup as any;
            if (cup.cupContainer && cup.cupBottom && cup.cupTop) {
                cup.cupBottom.setTexture(`${c.base}_bottom`);
                cup.cupTop.setTexture(`${c.base}_top`);
                cup.cupContainer.setPosition(c.x, cupY).setAngle(0);
                c.cup.setPosition(0, 0);
            }
            const cont = cup.cupContainer as Phaser.GameObjects.Container | undefined;
            const gem = cup.gem as Phaser.GameObjects.Image | undefined;
            if (cont) {
                this.tweens.killTweensOf(cont);
                cont.list.forEach(part => this.tweens.killTweensOf(part));
                cont.setPosition(homeXs[i], cupY);
                cont.setRotation(0).setAngle(0);

                cont.list.forEach((part: any) => {
                    if (part?.setRotation) part.setRotation(0);
                    if (part?.setAngle) part.setAngle(0);
                })
            }

            if (cont && gem) {
                cont.remove(gem, false);
                gem.setPosition(HALF_WIDTH, gemY);
            }
            cup.gem = null;
            c.cup.disableInteractive();
        });

        // Reset gem positions
        console.log(`Gem 1 position after reset: x: ${this.gem1.x}, y: ${this.gem1.y}`);
        this.gem1.setPosition(HALF_WIDTH, gemY);
        this.gem2.setPosition(HALF_WIDTH, gemY);
        this.gem2.setVisible(false);

        //reset cloud position
        this.cloud.setPosition(HALF_WIDTH, cloudY);
        this.cloud.setVisible(false);

        this.outOfClicksText.setVisible(false);
        
        [this.targetCup1, this.targetCup2, this.distractorCup1, this.distractorCup2].forEach(c => {
            if (!c) return;
            (c as any).__locked = false;
            c.setAlpha(1);

            const cont = (c as any).cupContainer as Phaser.GameObjects.Container | undefined;

            if (cont) {
                (cont as any).__noHover = false;
                (cont as any).__hoverEnabled = true;
                (cont as any).__baseY = cont.y;
                (cont as any).__resetHover?.();
                (cont as any).__scored = false;
            }

            (c as any).gem = null;
        });
        //flip button
        this.flipUsed = false;
        this.flipButton.disableInteractive();

        this.gemsFoundCount = 0;

        this.targets = 0;

        this.distractors = 0;

        this.gem_cups = [];

        this.registry.set(this.scoreDataKey, 0);

        this.clickLocations = [];
        this.stopFlipButtonPulse();
        this.flipButton.setAlpha(0.5);
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