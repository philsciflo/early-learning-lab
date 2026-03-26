import { Scene, GameObjects } from "phaser";
import { MagicCupsScene } from "./MagicCupsScene.ts";
import { tryData_advanced} from "../scoring.ts";
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
  START,
  END,
  gemY,
} from "../constants";
import { AudioManager } from "../AudioManager";



export class Level2 extends MagicCupsScene<tryData_advanced> {
    private gem1!: GameObjects.Sprite;
    private gem2!: GameObjects.Sprite;

    private targetCup: GameObjects.Image;
    private distractorCup1: GameObjects.Image;
    private distractorCup2: GameObjects.Image;

    private cloud: GameObjects.Image;

    private cupClicks: number = 2;

    private clicksText: GameObjects.Text;

    private outOfClicksText: GameObjects.Text;

    private cupTextures: string[] = ["heart_cup", "star_cup", "circle_cup", "dog_cup"];


    private gemsFoundCount: number = 0;

    private targets: number = 0;

    private distractors: number = 0;

    private cupChoices: string[] = [];

    private gem_cups: string[] = [];

    private cupPositions: number[] = []; // Store shuffled cup positions
    private lastCupArrangement: boolean | null = null; // true = targetOnLeft (option 1), false = targetOnRight (option 2)
    private arrangementConsecutiveCount: number = 0; // How many times the last arrangement appeared in a row

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

    private lastTwoCupDrops: number[] = [];

    private roundOver = false;
    private isAnimating = false;
    private successShown = false;
    private targetFound = false;

    constructor (){
        super(
            "Level2",
            "Level 2", 
            ["Drop the gems!", "Find the gems!", "You found the gems!"],
            "Level1",
            "Level3",
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
        this.clicksText = this.add.text(QUARTER_WIDTH / 2, QUARTER_HEIGHT + 110, `Clicks left: ${this.cupClicks} `, 
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
        this.successShown = false;
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
        this.resetButton.disableInteractive().setAlpha(0.5);
        this.cupClicks = 2;
        this.clicksText.setText(`Clicks left: ${this.cupClicks}`);
        
        // Disable cup interaction
        [this.targetCup, this.distractorCup1, this.distractorCup2].forEach(cup => {
            cup.disableInteractive();
        });

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

        const getCloudTargetX = (cupImage: GameObjects.Image): number => {
            const baseX = cupImage.getWorldTransformMatrix().tx;
            const isDistractorCup = cupImage === this.distractorCup1 || cupImage === this.distractorCup2;
            if (!isDistractorCup) return baseX;

            const d1x = this.distractorCup1.getWorldTransformMatrix().tx;
            const d2x = this.distractorCup2.getWorldTransformMatrix().tx;
            return (d1x + d2x) / 2;
        };

        const attachGemToCup = (gem: GameObjects.Sprite, cupImage: GameObjects.Image) => {
            const cup = cupImage as any;
            const cupContainer = cup.cupContainer as Phaser.GameObjects.Container;
            if (cupContainer) {
                gem.removeFromDisplayList();
                cupContainer.addAt(gem, 1);
                gem.setPosition(0, 0);
                this.gem_cups.push(cup.name);
                cup.gem = gem;
            } else {
                console.warn("cup missing cupContainer");
            }
        };

        const dropGemToCup = async (gem: GameObjects.Sprite, cupImage: GameObjects.Image) => {
            await Promise.all([
                AudioManager.I.playSfx(this, "cloud_sound"),
                tweenTo(gem, {
                    x: cupImage.x,
                    y: cupImage.y - 20,
                    ease: "Quad.easeIn"
                }),
                tweenTo(this.cloud, {
                    x: getCloudTargetX(cupImage),
                    y: cupImage.getWorldTransformMatrix().ty - 130,
                    ease: "Quad.easeIn"
                })
            ]);

            attachGemToCup(gem, cupImage);
            gem.setVisible(true);
        };

        const randomDistractorCup = this.chooseCup([this.distractorCup1, this.distractorCup2]);
        const targetFirst = Math.random() > 0.5;

        const firstCup = targetFirst ? this.targetCup : randomDistractorCup;
        const secondCup = targetFirst ? randomDistractorCup : this.targetCup;

        await delay(200);
        this.cloud.setVisible(true);
        this.gem1.setVisible(false);

        // First drop: randomly target cup or distractor cup
        await delay(1000);
        await dropGemToCup(this.gem1, firstCup);
        await delay(500);
        this.cloud.setVisible(false);
        this.cloud.setPosition(this.gem2.x, this.gem2.y);

        // Second drop goes to the other cup type so final state remains:
        // one gem in target cup and one gem in a distractor cup
        await delay(500);
        this.gem2.setVisible(true);
        await delay(1000);
        
        this.cloud.setVisible(true);
        this.gem2.setVisible(false);
        await dropGemToCup(this.gem2, secondCup);
        await delay(500);
        this.cloud.setVisible(false);



        // Enable cup interaction
        [this.targetCup, this.distractorCup1, this.distractorCup2].forEach(cup => {
            cup.removeAllListeners("pointerdown"); 
            cup.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                this.cupChoices.push(cup.name),
                this.onCupClick(cup),
                AudioManager.I.playSfx(this, "cup_sound");
                
            });
        });
        this.resetButton.setInteractive({ useHandCursor: true }).setAlpha(1);
        
        this.choiceWindowStart = Date.now();
        this.recordedFirstClick = false;
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

    private generateCupArrangement(): void {
        const spacing = WIDTH / 6;
        let targetOnLeft: boolean;

        // If last arrangement repeated twice, force switch to the other option
        if (this.arrangementConsecutiveCount >= 2) {
            targetOnLeft = !this.lastCupArrangement!;
            this.arrangementConsecutiveCount = 1; // Reset count with new arrangement
            this.lastCupArrangement = targetOnLeft;
        } else if (this.lastCupArrangement === null) {
            // First time, randomly pick
            targetOnLeft = Math.random() > 0.5;
            this.lastCupArrangement = targetOnLeft;
            this.arrangementConsecutiveCount = 1;
        } else {
            // Randomly pick, but track consecutives
            targetOnLeft = Math.random() > 0.5;
            if (targetOnLeft === this.lastCupArrangement) {
                this.arrangementConsecutiveCount++;
            } else {
                this.arrangementConsecutiveCount = 1;
                this.lastCupArrangement = targetOnLeft;
            }
        }

        let targetX: number, distractor1X: number, distractor2X: number;

        const option1Target = QUARTER_WIDTH + 110;
        const option1Distractor1 = spacing * 3.5;
        const option1Distractor2 = spacing * 4.2;

        const option2Target = WIDTH - option1Target;
        const option2Distractor1 = WIDTH - option1Distractor2;
        const option2Distractor2 = WIDTH - option1Distractor1;

        if (targetOnLeft) {
            // Target on left, distractors on right
            targetX = option1Target;
            distractor1X = option1Distractor1;
            distractor2X = option1Distractor2;
        } else {
            // Distractors on left, target on right
            targetX = option2Target;
            distractor1X = option2Distractor1;
            distractor2X = option2Distractor2;
        }

        // Store positions for use in reset
        this.cupPositions = [targetX, distractor1X, distractor2X];
    }

    private setupCups() {
        const cupBases = Phaser.Utils.Array.Shuffle([...this.cupTextures]);

        // Generate initial cup arrangement
        this.generateCupArrangement();
        
        const targetX = this.cupPositions[0];
        const distractor1X = this.cupPositions[1];
        const distractor2X = this.cupPositions[2];

        // Target Cup at assigned position
        const cupBottom1 = this.add.image(0, 0, `${cupBases[0]}_bottom`).setOrigin(0.5).setScale(0.34);
        const cupTop1    = this.add.image(0, 0, `${cupBases[0]}_top`).setOrigin(0.5).setScale(0.34);
        const container1 = this.add.container(targetX, cupY, [cupTop1, cupBottom1]);
        (cupBottom1 as any).cupContainer = container1;
        (cupBottom1 as any).cupBottom = cupBottom1;
        (cupBottom1 as any).cupTop = cupTop1;
        this.targetCup = cupBottom1;
        this.targetCup.name = "TargetCup";

        // Distractor Cup 1 at assigned position
        const cupBottom2 = this.add.image(0, 0, `${cupBases[1]}_bottom`).setOrigin(0.5).setScale(0.34);
        const cupTop2    = this.add.image(0, 0, `${cupBases[1]}_top`).setOrigin(0.5).setScale(0.34);
        const container2 = this.add.container(distractor1X, cupY, [cupTop2, cupBottom2]);
        (cupBottom2 as any).cupContainer = container2;
        (cupBottom2 as any).cupBottom = cupBottom2;
        (cupBottom2 as any).cupTop = cupTop2;
        this.distractorCup1 = cupBottom2;
        this.distractorCup1.name = "LeftDistractorCup";

        // Distractor Cup 2 at assigned position
        const cupBottom3 = this.add.image(0, 0, `${cupBases[2]}_bottom`).setOrigin(0.5).setScale(0.34);
        const cupTop3    = this.add.image(0, 0, `${cupBases[2]}_top`).setOrigin(0.5).setScale(0.34);
        const container3 = this.add.container(distractor2X, cupY, [cupTop3, cupBottom3]);
        (cupBottom3 as any).cupContainer = container3;
        (cupBottom3 as any).cupBottom = cupBottom3;
        (cupBottom3 as any).cupTop = cupTop3;
        this.distractorCup2 = cupBottom3;
        this.distractorCup2.name = "RightDistractorCup";

        this.enableHoverLift(this.targetCup);
        this.enableHoverLift(this.distractorCup1);
        this.enableHoverLift(this.distractorCup2);
    }

    private setCupsInteractive(enabled: boolean) {
        [this.targetCup, this.distractorCup1, this.distractorCup2].forEach(c => {
            if (!c) return;
            if (enabled) {
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

    private chooseCup(cups: GameObjects.Image[]) {
        let idx = Math.floor(Math.random() * cups.length);
        if (this.lastTwoCupDrops.length === 2 && this.lastTwoCupDrops[0] === this.lastTwoCupDrops[1] && idx === this.lastTwoCupDrops[0]) {
            const poolIdx = [...Array(cups.length).keys()].filter(i => i !== this.lastTwoCupDrops[0]);
            console.log(`Checking poolIDX: ${poolIdx}`);
            idx = poolIdx[Math.floor(Math.random() * poolIdx.length)];
            this.lastTwoCupDrops = [];
        }

        if (this.lastTwoCupDrops.length === 0) {
            this.lastTwoCupDrops.push(idx);
        }
        else if (this.lastTwoCupDrops.length === 1) {
            const a = this.lastTwoCupDrops[0];
            this.lastTwoCupDrops.push(idx);
            if (this.lastTwoCupDrops[1] !== a) {
                this.lastTwoCupDrops[0] = idx;
                this.lastTwoCupDrops.length = 1;
            }
        }
        else {
            this.lastTwoCupDrops = [idx];
        }

        const randomCup = cups[idx];
        console.log(`Chosen cup index: ${idx}, lastTwoCupDrops: ${this.lastTwoCupDrops}`);
        return randomCup;
    }

    private onCupClick(cup: GameObjects.Image) {
        if (!this.recordedFirstClick) {
            this.firstClick = Date.now() - this.choiceWindowStart; // ms
            this.recordedFirstClick = true;
        }

        console.log("Cup clicked");
        this.isAnimating = true;
        this.setCupsInteractive(false); // Disable all cups during animation

        if (!this.roundOver) {
            this.cupClicks = Math.max(0, this.cupClicks - 1);
            this.clicksText.setText(`Clicks left: ${this.cupClicks} `);
            console.log(`Cup clicks left: ${this.cupClicks}`);
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
                const canReveal = !!gem && (!this.roundOver || this.targetFound);
                if (canReveal) {
                    AudioManager.I.playSfx(this, "gem_sound");
                    // If gem is present: reveal after the tipping
                    // Repositions the gem to the same world coordinates
                    const EJECT = 100;
                    const LIP = 65;
                    const exitLocalX = gem.x + dir * EJECT;
                    const exitLocalY = gem.y + LIP;
                    const p = new Phaser.Math.Vector2();
                    cupContainer.getWorldTransformMatrix().transformPoint(exitLocalX, exitLocalY, p);

                    const currentScore = Number(this.registry.get(this.scoreDataKey));
                    if (cup.name.includes("Target")) {
                    this.targets += 1;
                    this.registry.set(this.scoreDataKey, currentScore + 1);
                    } else if (cup.name.includes("Distractor")) {
                        this.distractors = this.distractors + 1;
                        this.registry.set(this.scoreDataKey, currentScore + 1);
                    }

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
                            this.registry.set(this.scoreDataKey, currentScore + 1);
                            console.log(`gems found: ${this.gemsFoundCount}`);

                            if (cup == this.targetCup) {
                                this.targetFound = true;

                                const _nowEnd = new Date();
                                this.endTime = this.getTimestamp();
                                this.endTimeUnix = String(_nowEnd.getTime());
                                this.duration = Date.now() - this.dropClickTime;
                                if (!this.successShown) {
                                    this.successShown = true;
                                    this.createSuccessScene();
                                }
                                this.resetButton.setInteractive({ useHandCursor: true });
                                [this.targetCup, this.distractorCup1, this.distractorCup2].forEach(c => c.setInteractive({ useHandCursor: true }));
                                this.roundOver = true;
                                this.isAnimating = false;
                                return; // prevents falling through to the rest

                            } else if (this.cupClicks === 0 && !this.roundOver) {
                                // player clicked the 50/50 cups
                                const _nowEnd = new Date();
                                this.endTime = this.getTimestamp();
                                this.endTimeUnix = String(_nowEnd.getTime());
                                this.duration = Date.now() - this.dropClickTime;
                                this.revealCorrectCup(false);
                                this.createFailScene();
                                this.roundOver = true;

                                // keep cups clickable after out of clicks
                                [this.targetCup, this.distractorCup1, this.distractorCup2].forEach(c => c.setInteractive({ useHandCursor: true }));
                                this.isAnimating = false;
                                return;
                            } 
                            // still playing
                            this.isAnimating = false;
                            this.setCupsInteractive(true); // Re-enable cups for clicking
                        }
                    });

                }  else {
                    // wrong cup
                    if (this.cupClicks === 0 && this.gemsFoundCount < 2 && !this.roundOver){
                        const _nowEnd = new Date();
                        this.endTime = this.getTimestamp();
                        this.endTimeUnix = String(_nowEnd.getTime());
                        this.duration = Date.now() - this.dropClickTime;
                        this.revealCorrectCup(false);
                        this.createFailScene();
                        this.roundOver = true;
                    }

                    // allow tipping after clicks run out
                    [this.targetCup, this.distractorCup1, this.distractorCup2].forEach(c => c.setInteractive({ useHandCursor: true }));
                    this.isAnimating = false;
                    }
                }  
        });
    }

    private revealCorrectCup(awardPoints = false) {
        const cups: Phaser.GameObjects.Image[] = [
        this.targetCup, this.distractorCup1, this.distractorCup2
        ].filter(Boolean) as Phaser.GameObjects.Image[];

        cups.forEach((cup) => {
            const gem = (cup as any).gem as Phaser.GameObjects.Image | undefined;
            const cupContainer = (cup as any).cupContainer as Phaser.GameObjects.Container | undefined;
            if (!gem || !cupContainer) return;

            const partsToTip = (cupContainer.list as Phaser.GameObjects.GameObject[]).filter(go => go !== gem);
            const tipAngle = -120;
            const dir = tipAngle >= 0 ? 1 : -1;
            const EJECT = 100;
            const LIP = 65;

            const p = new Phaser.Math.Vector2();
            cupContainer.getWorldTransformMatrix().transformPoint(gem.x + dir * EJECT, gem.y + LIP, p);

            this.tweens.add({
                targets: partsToTip,
                angle: tipAngle,
                duration: 700,
                ease: "Sine.easeOut",
                hold: 120,
                onComplete: () => {
                    this.tweens.add({
                        targets: gem,
                        x: -EJECT, y: LIP,
                        duration: 2000,
                        ease: "Power2",
                        onComplete: () => {
                            cupContainer.remove(gem, false);
                            gem.setPosition(p.x, p.y);
                            if (awardPoints) {
                            const currentScore = Number(this.registry.get(this.scoreDataKey) ?? 0);
                            this.registry.set(this.scoreDataKey, currentScore + 1);
                            }
                        }
                    });
                }
            });
        });
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
            if (this.isAnimating|| !cupBottom.input?.enabled) return;
            if (this.roundOver && !this.targetFound) return;
            if (!(cont as any).__hoverEnabled) return;
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

    private resetScene(){
        this.successShown = false;
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

        this.roundOver = false; 
        this.isAnimating = false;
        this.targetFound = false;

        // Reset cup clicks
        this.cupClicks = 2;
        this.clicksText.setText(`Clicks left: ${this.cupClicks} `);
        
        // stopping all tweens that could keep moving things after reset
        this.tweens.killTweensOf([this.gem1, this.gem2, this.cloud, this.successPeeko, this.successBubble,
                                this.successText, this.successText2, this.failPeeko, this.failBubble, this.failureText,
                                this.failureText2
        ]);
        this.time.removeAllEvents();

        const p1 = (this.gem1 as any).parentContainer as Phaser.GameObjects.Container | null;
        if (p1) { p1.remove(this.gem1, false); this.children.add(this.gem1); }

        const p2 = (this.gem2 as any).parentContainer as Phaser.GameObjects.Container | null;
        if (p2) { p2.remove(this.gem2, false); this.children.add(this.gem2); }

        // Generate a new cup arrangement for the next round
        this.generateCupArrangement();
        
        const cupImages = Phaser.Utils.Array.Shuffle([...this.cupTextures]);

        // Reset cups to their positions (using newly generated positions)
        const cups = [
            { cup: this.targetCup, base: cupImages[0], x: this.cupPositions[0]},
            { cup: this.distractorCup1, base: cupImages[1], x: this.cupPositions[1] },
            { cup: this.distractorCup2, base: cupImages[2], x: this.cupPositions[2] }
        ];
        
        cups.forEach((c) => {
            const cup = c.cup as any;
            
            if (!cup) return;
            (cup as any).__locked = false;


            // change textures
            if (cup.cupContainer && cup.cupBottom && cup.cupTop) {
                cup.cupBottom.setTexture(`${c.base}_bottom`);
                cup.cupTop.setTexture(`${c.base}_top`);
            }
            
            const cupContainer = cup.cupContainer as Phaser.GameObjects.Container;
            if (cupContainer) {
                this.tweens.killTweensOf(cupContainer);
                cupContainer.list.forEach(part => this.tweens.killTweensOf(part));
                cupContainer.setPosition(c.x, cupY); // Use assigned x position
                cupContainer.setRotation(0).setAngle(0);

                cupContainer.list.forEach((part: any) => {
                    if (part?.setRotation) part.setRotation(0);
                    if (part?.setAngle) part.setAngle(0);
                });
            }
            cup.gem = null;
            c.cup.disableInteractive(); 
        });


        // Reset gem positions
        this.gem1.setPosition(HALF_WIDTH, gemY);
        this.gem2.setPosition(HALF_WIDTH, gemY);
        this.gem2.setVisible(false);

        //reset cloud position
        this.cloud.setPosition(HALF_WIDTH, cloudY);
        this.cloud.setVisible(false);

        this.outOfClicksText.setVisible(false);

        [this.targetCup, this.distractorCup1, this.distractorCup2].forEach(c => {
            if (!c) return;
            (c as any).__locked = false;
            c.setAlpha(1);

            const cont = (c as any).cupContainer as Phaser.GameObjects.Container | undefined;

            if (cont) {
                (cont as any).__hoverEnabled = true;
                (cont as any).__baseY = cont.y;
                (cont as any).__resetHover?.();
            }

            (c as any).gem = null;
        });

        this.gemsFoundCount = 0;

        this.targets = 0;

        this.distractors = 0;

        this.gem_cups = [];

        this.registry.set(this.scoreDataKey, 0);

        this.clickLocations = [];

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



