import { Scene, GameObjects } from "phaser";
import { MagicCupsScene } from "./MagicCupsScene.ts";
import { tryData_advanced, tryData_basic } from "../scoring.ts";
import { 
    WIDTH,QUARTER_WIDTH, 
    HEIGHT, HALF_WIDTH, 
    QUARTER_HEIGHT, 
    QUARTER_HEIGHT_OUTOFCLICKS, 
    cupY, 
    gemY,
    cloudY,
    START,
    END,
} from "../constants.ts";
import { AudioManager } from "../AudioManager";

export class Level1 extends MagicCupsScene<tryData_basic> {
    private gem1!: GameObjects.Sprite;
    private targetCup1: GameObjects.Image;
    private targetCup2: GameObjects.Image;
    private targetCup3: GameObjects.Image;
    private cloud: GameObjects.Image;
    private cloud2: GameObjects.Image;
    private cloud3: GameObjects.Image;

    private cupClicks: number = 1;
    private clicksText: GameObjects.Text;
    private outOfClicksText: GameObjects.Text;
    private cupTextures: string[] = ["heart_cup", "star_cup", "circle_cup", "dog_cup"];
    private gem_placement: string;

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

    constructor(){
        super(
        "Level1",
        "Level 1",
        ["Drop the gem!","Find the gem!", "You found the gem!"],
        "Level0",
        "Level2",
        );
    }

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

        this.cupClicks = 1;
        this.setupGems();
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
        this.clicksText = this.add.text(QUARTER_WIDTH/2, QUARTER_HEIGHT + 110, `Clicks left: ${this.cupClicks} `,
        {
            fontFamily: "Body",
            fontSize: 25,
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            align: "left",
            shadow: { offsetX: 3, offsetY: 3, color: "#3d3d3dff", blur: 1, stroke: true, fill: true },
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
        this.successShown = false;
        this.clickLocations = [];
    }   


    protected async doDrop(): Promise<void> {
        this.roundOver = false; // reset round state
        this.dropClickTime = Date.now();
        
        const _nowStart = new Date();
        this.startTime = this.getTimestamp();
        this.startTimeUnix = String(_nowStart.getTime());

        this.resetButton.disableInteractive().setAlpha(0.5);
        [this.targetCup1, this.targetCup2, this.targetCup3].forEach(cup => cup.disableInteractive());

        const cups = [this.targetCup1, this.targetCup2, this.targetCup3];
        const randomCup = this.chooseCup(cups);

        const randomContainer = (randomCup as any).cupContainer as Phaser.GameObjects.Container;
        randomContainer.addAt(this.gem1, 1);
        this.gem_placement = randomContainer.name;

        const worldPos = new Phaser.Math.Vector2(this.gem1.x, this.gem1.y);
        const localPos = randomContainer.pointToContainer(worldPos);
        randomContainer.addAt(this.gem1, 1);
        this.gem1.setPosition(localPos.x, localPos.y);

        const delay = (ms: number) => new Promise(resolve => this.time.delayedCall(ms, resolve));
        const tweenTo = (targets: any, props: any, duration = 1000): Promise<void> =>
            new Promise(resolve => this.tweens.add({ targets, ...props, duration, onComplete: () => resolve() }));

        await this.animateCloudsCoverGem();

        await Promise.all([
        AudioManager.I.playSfx(this, "cloud_sound"),
        tweenTo(this.gem1, { x: randomCup.x, duration:650, ease: "Sine.easeInOut" }),
        ]);

        await Promise.all([
            AudioManager.I.playSfx(this, "cloud_sound"),

            tweenTo(this.gem1, {
                y: randomCup.y,
                duration:650,
                ease: "Quad.easeIn"
            }),
            tweenTo(this.cloud, {
                y: randomCup.getWorldTransformMatrix().ty - 130,
                duration:650,
                ease: "Quad.easeIn"
            }),
            tweenTo(this.cloud2, {
                y: randomCup.getWorldTransformMatrix().ty - 130,
                duration:650,
                ease: "Quad.easeIn"
            }),
            tweenTo(this.cloud3, {
                y: randomCup.getWorldTransformMatrix().ty - 130,
                duration:650,
                ease: "Quad.easeIn"
            }),
        ]);
        this.gem1.setVisible(true);
        await delay(500);
        this.cloud.setVisible(false);
        this.cloud2.setVisible(false);
        this.cloud3.setVisible(false);


        this.choiceWindowStart = Date.now();
        this.recordedFirstClick = false;
        (randomCup as any).gem = this.gem1;

        [this.targetCup1, this.targetCup2, this.targetCup3].forEach(cup => {
            cup.removeAllListeners("pointerdown");
            cup.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
            this.onCupClick(cup),
            AudioManager.I.playSfx(this, "cup_sound");
            });
        });
        this.resetButton.setInteractive({ useHandCursor: true }).setAlpha(1);
    }

    protected doReset(): void {
        this.resetScene();
        }

        protected recordScoreDataForCurrentTry(): tryData_basic {
        const total = Number(this.registry.get(this.scoreDataKey) ?? 0);
        const seconds = Number((this.duration / 1000).toFixed(2));
        const click = Number((this.firstClick / 1000).toFixed(2));
        return {
            targetScore: isNaN(total) ? 0 : total,
            distractorScore: 0,
            firstClick: isNaN(click) ? 0 : click,
            clickLocations: this.clickLocations,
            totalClicks: this.clickLocations.length,
            gem_location: this.gem_placement,
            startTime: this.startTime,
            startTimeUnix: this.startTimeUnix,
            endTime: this.endTime,
            endTimeUnix: this.endTimeUnix,
            tryDuration: isNaN(seconds) ? 0 : seconds,
            correct: (total ?? 0) > 0,
        };
    }

    private setupGems() {
        this.gem1 = this.add
        .sprite(HALF_WIDTH, gemY, 'gem_00000')
        .setOrigin(0.5)
        .setScale(0.1)
        .play("gemSpin");
    }

    private setupCups() {
        const cupBases = Phaser.Utils.Array.Shuffle([...this.cupTextures]);
        const cupBottom1 = this.add.image(0, 0, `${cupBases[0]}_bottom`).setOrigin(0.5).setScale(0.34);
        const cupTop1    = this.add.image(0, 0, `${cupBases[0]}_top`).setOrigin(0.5).setScale(0.34);
        const container1 = this.add.container(QUARTER_WIDTH + 60, cupY, [cupTop1, cupBottom1]);
        (cupBottom1 as any).cupContainer = container1;
        (cupBottom1 as any).cupBottom = cupBottom1;
        (cupBottom1 as any).cupTop = cupTop1;
        container1.setName("Left Cup");
        this.targetCup1 = cupBottom1;

        const cupBottom2 = this.add.image(0, 0, `${cupBases[1]}_bottom`).setOrigin(0.5).setScale(0.34);
        const cupTop2    = this.add.image(0, 0, `${cupBases[1]}_top`).setOrigin(0.5).setScale(0.34);
        const container2 = this.add.container(HALF_WIDTH, cupY, [cupTop2, cupBottom2]);
        (cupBottom2 as any).cupContainer = container2;
        (cupBottom2 as any).cupBottom = cupBottom2;
        (cupBottom2 as any).cupTop = cupTop2;
        container2.setName("Middle Cup");
        this.targetCup2 = cupBottom2;

        const cupBottom3 = this.add.image(0, 0, `${cupBases[2]}_bottom`).setOrigin(0.5).setScale(0.34);
        const cupTop3    = this.add.image(0, 0, `${cupBases[2]}_top`).setOrigin(0.5).setScale(0.34);
        const container3 = this.add.container(HALF_WIDTH + QUARTER_WIDTH - 60, cupY, [cupTop3, cupBottom3]);
        (cupBottom3 as any).cupContainer = container3;
        (cupBottom3 as any).cupBottom = cupBottom3;
        (cupBottom3 as any).cupTop = cupTop3;
        container3.setName("Right Cup");
        this.targetCup3 = cupBottom3;

        this.enableHoverLift(this.targetCup1);
        this.enableHoverLift(this.targetCup2);
        this.enableHoverLift(this.targetCup3);
    }

    private setCupsInteractive(enabled: boolean) {
        [this.targetCup1, this.targetCup2, this.targetCup3].forEach(c => {
            if (!c) return;
            if (enabled) c.setInteractive({ useHandCursor: true });
            else c.disableInteractive();
        });
    }

    private setupCloud(){
        this.cloud = this.add.image(-200, cloudY, "cloud")
        .setOrigin(0.5)
        .setScale(0.25)
        .setVisible(false);

        this.cloud2 = this.add.image(-400, cloudY - 40, "cloud")
        .setOrigin(0.5)
        .setScale(0.25)
        .setVisible(false);

        this.cloud3 = this.add.image(WIDTH + 200, cloudY + 30, "cloud")
        .setOrigin(0.5)
        .setScale(0.25)
        .setVisible(false);
    }

    private chooseCup(cups: GameObjects.Image[]) {
        let idx = Math.floor(Math.random() * cups.length);
        if (this.lastTwoCupDrops.length === 2 && this.lastTwoCupDrops[0] === this.lastTwoCupDrops[1] && idx === this.lastTwoCupDrops[0]) {
        const poolIdx = [0,1,2].filter(i => i !== this.lastTwoCupDrops[0]);
        idx = poolIdx[Math.floor(Math.random() * poolIdx.length)];
        this.lastTwoCupDrops = [];
        }

        if (this.lastTwoCupDrops.length === 0) {
            this.lastTwoCupDrops.push(idx);
        } else if (this.lastTwoCupDrops.length === 1) {
            const a = this.lastTwoCupDrops[0];
            this.lastTwoCupDrops.push(idx);
            if (this.lastTwoCupDrops[1] !== a) {
                this.lastTwoCupDrops[0] = idx;
                this.lastTwoCupDrops.length = 1;
            }
        } else {
            this.lastTwoCupDrops = [idx];
        }

        return cups[idx];
    }

    private onCupClick(cup: GameObjects.Image) {
        if (!this.recordedFirstClick) {
            this.firstClick = Date.now() - this.choiceWindowStart;
            this.recordedFirstClick = true;
        }

        console.log("Cup clicked");
        this.isAnimating = true;
        this.setCupsInteractive(false);

        if (!this.roundOver) {
            this.cupClicks = Math.max(0, this.cupClicks - 1);
            this.clicksText.setText(`Clicks left: ${this.cupClicks} `);
        }

        const gem = (cup as any).gem as Phaser.GameObjects.Image | undefined;
        const cupContainer = (cup as any).cupContainer as Phaser.GameObjects.Container | undefined;
        if (!cupContainer) {
            this.isAnimating = false;
            this.setCupsInteractive(true);
            return;
        }
        (cupContainer as any).__tipped = true;

        const partsToTip = (cupContainer.list as Phaser.GameObjects.GameObject[]).filter(part => part !== gem);

        const tipAngle = -120;
        const dir = tipAngle >= 0 ? 1 : -1;

        this.tweens.add({
        targets: partsToTip,
        angle: tipAngle,
        duration: 700,
        ease: "Sine.easeOut",
        hold: 120,
        onComplete: () => {
            if (gem && !this.roundOver) {
                // Reveal & score (found within allowed clicks)
                AudioManager.I.playSfx(this, "gem_sound");
                const EJECT = 100, LIP = 65;
                const p = new Phaser.Math.Vector2();
                cupContainer.getWorldTransformMatrix().transformPoint(gem.x + dir * EJECT, gem.y + LIP, p);

                this.tweens.add({
                    targets: gem,
                    x: -EJECT, y: LIP,
                    duration: 2000,
                    ease: "Power2",
                    onComplete: () => {
                        cupContainer.remove(gem, false);
                        gem.setPosition(p.x, p.y);
                        const _nowEnd = new Date();
                        this.endTime = this.getTimestamp();
                        this.endTimeUnix = String(_nowEnd.getTime());
                        this.duration = Date.now() - this.dropClickTime;
                        if (!this.successShown) {
                            this.successShown = true;
                            this.createSuccessScene();
                        }
                        const currentScore = Number(this.registry.get(this.scoreDataKey) ?? 0);
                        this.registry.set(this.scoreDataKey, currentScore + 1);
                        this.resetButton.setInteractive({ useHandCurosr: true });
                        this.roundOver = true;
                        this.isAnimating = false;

                        //keeping the cups clickable even after succeeding
                        [this.targetCup1, this.targetCup2, this.targetCup3].forEach(c => c.setInteractive({ useHandCursor: true }));
                    }
                });
            }   else {
                    if (this.cupClicks === 0 && !this.roundOver) {
                        // auto-reveal the real cup
                        const _nowEnd = new Date();
                        this.endTime = this.getTimestamp();
                        this.endTimeUnix = String(_nowEnd.getTime());
                        this.duration = Date.now() - this.dropClickTime;
                        this.revealCorrectCups(false);  // reveal without awarding points
                        this.createFailScene()
                        this.roundOver = true;
                    } 

                    // Re-enable all cups for playful tipping after clicks run out
                    [this.targetCup1, this.targetCup2, this.targetCup3].forEach(c =>
                        c.setInteractive({ useHandCursor: true })
                    );
                }
            }
        });
    }

    private revealCorrectCups(awardPoints = false) {
        const cups: Phaser.GameObjects.Image[] = [
            (this as any).targetCup1 ?? null,
            (this as any).targetCup2 ?? null,
            (this as any).targetCup3 ?? null,
        ].filter(Boolean) as Phaser.GameObjects.Image[];

        cups.forEach((cup) => {
            const gem = (cup as any).gem as Phaser.GameObjects.Image | undefined;
            const cupContainer = (cup as any).cupContainer as Phaser.GameObjects.Container | undefined;
            if (!gem || !cupContainer) return;
            (cupContainer as any).__tipped = true;

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

    private resetScene() {
        this.successShown = false;
        if (this.successTimer) { this.successTimer.destroy(); this.successTimer = undefined; }
        if (this.failTimer) { this.failTimer.destroy(); this.successTimer = undefined; }
        // stop any animation and timed events
        this.tweens.killTweensOf([this.targetCup1, this.targetCup2, this.targetCup3, this.gem1,
                                this.successPeeko, this.successBubble, this.successText, this.successText2,
                                this.failPeeko, this.failBubble, this.failureText, this.failureText2
        ]);
        this.time.removeAllEvents();
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

        this.cupClicks = 1;
        this.clicksText.setText(`Clicks left: ${this.cupClicks} `);

        const parent = (this.gem1 as any).parentContainer as Phaser.GameObjects.Container;
        if (parent) {
            parent.remove(this.gem1, false);
        }

        this.gem1.setDepth(0);
        this.gem1.setPosition(HALF_WIDTH, gemY);
        
        const homeXs = [QUARTER_WIDTH + 60, HALF_WIDTH, HALF_WIDTH + QUARTER_WIDTH - 60];

        const cupImages = Phaser.Utils.Array.Shuffle([...this.cupTextures]);

        [this.targetCup1, this.targetCup2, this.targetCup3].forEach((cup, i) => {
            if (!cup) return;

            const cont = (cup as any).cupContainer as Phaser.GameObjects.Container | undefined;
            if (cont) {
                this.tweens.killTweensOf(cont);
                cont.list.forEach((go: any) => this.tweens.killTweensOf(go));

                cont.setPosition(homeXs[i], cupY);
                cont.setRotation(0).setAngle(0);
                cont.list.forEach((go: any) => {
                    if (go?.setRotation) go.setRotation(0);
                    if (go?.setAngle) go.setAngle(0);
                });

                (cont as any).__tipped = false;
                (cont as any).__baseY = cont.y;     
                (cont as any).__resetHover?.();     // snap back to baseY
            }

            const cupObj = cup as any;
            if (cupObj.cupContainer && cupObj.cupBottom && cupObj.cupTop) {
                cupObj.cupBottom.setTexture(`${cupImages[i]}_bottom`);
                cupObj.cupTop.setTexture(`${cupImages[i]}_top`);
            }

            cup.removeAllListeners("pointerdown");
            cup.disableInteractive();
            (cup as any).gem = null;

        });
        //reset cloud position
        this.cloud.setPosition(-200, cloudY).setVisible(false);
        this.cloud2.setPosition(-400, cloudY - 40).setVisible(false);
        this.cloud3.setPosition(WIDTH + 200, cloudY + 30).setVisible(false);
        
        this.outOfClicksText.setVisible(false);
        this.registry.set(this.scoreDataKey, 0);
        this.gem_placement = "";
        this.clickLocations = [];
    }

    private getTimestamp() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
    }

    private async animateCloudsCoverGem(): Promise<void> {
        const delay = (ms: number) => new Promise(resolve => this.time.delayedCall(ms, resolve));
        const tweenTo = (targets: any, props: any, duration = 1000): Promise<void> =>
            new Promise(resolve => this.tweens.add({ targets, ...props, duration, onComplete: () => resolve() }));

        this.cloud.setVisible(true);
        this.cloud2.setVisible(true);
        this.cloud3.setVisible(true);

        await Promise.all([
            AudioManager.I.playSfx(this, "cloud_sound"),
            tweenTo(this.cloud, { x: HALF_WIDTH, y: cloudY, duration:700, ease:"Sine.easeInOut" }),
            tweenTo(this.cloud2, { x: HALF_WIDTH - 120, y: cloudY + 30, duration:700, ease:"Sine.easeInOut" }),
            tweenTo(this.cloud3, { x: HALF_WIDTH + 120, y: cloudY + 50, duration:700, ease:"Sine.easeInOut" }),
        ]);

        this.gem1.setVisible(false);
        await delay(200);
    }

    private enableHoverLift(cupBottom: Phaser.GameObjects.Image) {
        const cont = (cupBottom as any).cupContainer as Phaser.GameObjects.Container;
        if (!cont) return;

        const LIFT = 8; // pixels to float upward
        const DURATION = 120;

        // remember home Y for reset
        if ((cont as any).__baseY === undefined) (cont as any).__baseY = cont.y;

        // kill any previous hover tweens before making new ones
        const killHoverTweens = () => {
            this.tweens.killTweensOf(cont);
        };

        const liftUp = () => {
            if (this.isAnimating || !cupBottom.input?.enabled) return;
            if ((cont as any).__tipped) return;
            killHoverTweens();
            this.tweens.add({
            targets: cont,
            y: (cont as any).__baseY - LIFT,
            duration: DURATION,
            ease: "Sine.easeOut"
            });
        };

        const settleDown = () => {
            killHoverTweens();
            this.tweens.add({
            targets: cont,
            y: (cont as any).__baseY,
            duration: DURATION,
            ease: "Sine.easeOut"
            });
        };

        (cont as any).__resetHover = () => {
            killHoverTweens();
            cont.setY((cont as any).__baseY);
            (cont as any).__tipped = false;
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
}
