import Phaser from "phaser";
import { AudioManager } from "../AudioManager";


// helper type for each card
type CardData = {
    back: Phaser.GameObjects.Rectangle;
    backLabel: Phaser.GameObjects.Text;
    front: Phaser.GameObjects.Rectangle;
    frontLabel: Phaser.GameObjects.Text;
    frontCoinIcon?: Phaser.GameObjects.Image;
    frontTrashIcon?: Phaser.GameObjects.Image;
    frontTrashScale?: number;
    hasCoin: boolean;
    flipped: boolean;
    row: number;
    col: number;
};

// helper type for data from homepage
type PlayerData = {
    playerId: string;
    age: string;
    location: string;
};

type LevelResultRecord = {
    playerId: string;
    totalCoins: number;
    playerCoinsFound: number;
    npcCoinsFound: number;
    "memory time": string;
    recordedAt: string;
    turnLogs?: any[];
    Game_Turns?: any
};

// This is the main game scene
export default class GameScene extends Phaser.Scene {
    // here we can decide how many cards we want in the game and how many coins there are to find
    private rows = 3;
    private cols = 7;
    private totalCards = 21;
    private totalCoins = 10;
    private totalTrash = 0;

    // keeping track of how many coins found, card data, number of cards flipped
    private cards: CardData[] = [];
    private playerCoinsFound = 0;
    private npcCoinsFound = 0;
    private playerTrashFound = 0;
    private npcTrashFound = 0;
    private cardsFlipped = 0;

    //private playerScoreText!: Phaser.GameObjects.Text; // displays number of coins npc/player has found
    //private npcScoreText!: Phaser.GameObjects.Text;
    private playerCoinIcons: Phaser.GameObjects.Image[] = [];
    private npcCoinIcons: Phaser.GameObjects.Image[] = [];
    private playerData!: PlayerData; // carrys over userId from homepage

    private currentTurn: "player" | "npc" = "player"; // indicates whose turn it is, player is first by default
    private npcSuccessChance: number = 0.5;

    private turnText!: Phaser.GameObjects.Text; // indicates whose turn it is
    //private npcBox!: Phaser.GameObjects.Rectangle; // temporary box for the NPC
    //private npcLabel!: Phaser.GameObjects.Text;
    private parrot: Phaser.GameObjects.Sprite;
    private speechBox: Phaser.GameObjects.Rectangle;
    private speechTri: Phaser.GameObjects.Triangle;
    private hidingRect: Phaser.GameObjects.Rectangle;
    private boardGlow: Phaser.GameObjects.Rectangle;
    private storyBox: Phaser.GameObjects.Rectangle;
    private storyText: Phaser.GameObjects.Text;
    private readonly LEVEL_RESULTS_KEY = "levelResultsHistory";
    private isPaused = false;
    private pauseOverlayContainer: Phaser.GameObjects.Container;
    private isMemoryPhase = true;
    private memoryPhaseSeconds = 0;
    private memoryTimeFormatted = "00:00";
    private memoryTimerText!: Phaser.GameObjects.Text;
    private memoryTimerEvent?: Phaser.Time.TimerEvent;
    private startGameButton?: Phaser.GameObjects.Text;
    private cardScale = 1;
    private readonly trackerCoinsPerRow = 5;
    private readonly trackerCoinSpacing = 34;
    private readonly trackerCoinScale = 0.32;
    private turnCount = 0;
    private turnLogs: any[] = [];
    private startingPlayer: "player" | "npc" = "player";
    private playerTurnStartTimestampMs: number | null = null;

    constructor() {
        // gives the scene a unique name
        super("scene-game-main");
    }

    // declares userID from homepage for welcome message
    init(data: any) {
        //Console for testing
        console.log("RAW DATA:", data);
        console.log("cardScale received:", data.cardScale, "-> final:", this.cardScale);

        this.startingPlayer = data.startingPlayer ?? "player";
        this.playerData = {
            playerId: data.playerId ?? "Player",
            age: data.age ?? "",
            location: data.location ?? ""
        };

        this.rows = data.rows ?? 3;
        this.cols = data.cols ?? 7;
        this.totalCards = this.rows * this.cols;

        this.totalCoins = data.totalCoins ?? 10;
        this.npcSuccessChance = data.npcSuccessChance ?? 0.5;
        this.cardScale = data.cardScale ?? 1;
        this.totalTrash = this.totalCards - this.totalCoins;
    }

    // preload runs before the scene starts, its used to load images, sounds, etc
    preload() {
        // right now its just some terribly laid out sprites i found online
        this.load.image("menuButton", "assets/menu.png");
        //this.load.image("prevLevelButton", "assets/left.png"); // hide for now it looks ugly
        //this.load.image("nextLevelButton", "assets/right.png");
        //this.load.image("settingsButton", "assets/settings.png"); // hide for now
        //this.load.image("parrot", "assets/parry_default.png");
        //this.load.spritesheet("parrot", "assets/parry_spritesheet.png", { frameWidth: 1900, frameHeight: 830 });
        this.load.spritesheet("parrotUp", "assets/parry_up_2_small.png", { frameWidth: 950, frameHeight: 415 });
        this.load.spritesheet("parrotDown", "assets/parry_down_2_small.png", { frameWidth: 950, frameHeight: 415 });
        this.load.spritesheet("parrotMid", "assets/parry_mid_2_small.png", { frameWidth: 950, frameHeight: 415 });
        //this.load.image("speech", "assets/speech_bubble.png");
        this.load.image("background2", "assets/background_island_test.png");
        this.load.image("coinIcon", "assets/coin.png");
        this.load.image("trashBottle", "assets/bottle.png");
        this.load.image("trashSeaweed", "assets/seaweed.png");
        this.load.image("trashFishbone", "assets/fishbone.png");
        this.load.html("slider_continuous", "assets/html_slider_continuous.html");
        this.load.spritesheet("confetti", "assets/confetti.png", { frameWidth: 16, frameHeight: 16 });
    }

    // create runs after preload has finished, its used to create objects within a scene
    create() {
        // constants for the scenes height/width
        const w = this.scale.width;
        const h = this.scale.height;

        //Initialize the level
        this.cards = [];
        this.playerCoinsFound = 0;
        this.npcCoinsFound = 0;
        this.playerTrashFound = 0;
        this.npcTrashFound = 0;
        this.cardsFlipped = 0;
        this.playerCoinIcons = [];
        this.npcCoinIcons = [];
        this.currentTurn = this.startingPlayer;
        (this as any).gameEnded = false;
        this.isMemoryPhase = true;
        this.memoryPhaseSeconds = 0;
        this.memoryTimeFormatted = "00:00";
        this.turnLogs = [];
        this.turnCount = 0;
        this.playerTurnStartTimestampMs = null;

        //temp background. testing border size
        this.add.image(w / 2, h / 2, "background2");

        // top buttons
        this.add.image(this.scale.width * 0.05, this.scale.height * 0.10, "menuButton")
            .setInteractive()
            .on("pointerdown", () => {

                AudioManager.I.playSfx(this, "click_sound");
                this.scene.pause();
                this.scene.launch('PauseScene', { fromScene: this.scene.key });

            })
            .setScale(0.25)
            .setDepth(1000);

        /* this.add.image(w * 0.05, h * 0.10, "menuButton")
            .setInteractive()
            .on("pointerdown", () => {
                if (this.isPaused) {
                    this.resumeGame();
                } else {
                    this.pauseGame();
                }
            })
            .setScale(0.25)
            .setDepth(1000); */

        /*this.add.image(w * 0.25, h * 0.10, "prevLevelButton")
            .setInteractive()
            .on("pointerdown", () => {
                console.log("Previous Level Clicked");
            })
            .setScale(0.25);

        this.add.image(w * 0.75, h * 0.10, "nextLevelButton")
            .setInteractive()
            .on("pointerdown", () => {
                console.log("Next Level Clicked");
            })
            .setScale(0.25);*/

        /*this.add.image(w * 0.95, h * 0.10, "settingsButton")
            .setInteractive()
            .on("pointerdown", () => {
                this.scene.start("SettingsScreen", {
                    playerData: this.playerData
                });
            })
            .setScale(0.25)
            .setDepth(1000);*/

        // displays userID with welcome
        /*this.add.text(
            w * 0.5,
            h * 0.05,
            `Welcome ${this.playerData.playerId}`
        ).setOrigin(0.5); */

        // status text for tracking coins found. og height h*0.18
        //this.playerScoreText = this.add.text(w * 0.65, h * 0.82, "Player coins: 0").setOrigin(0.5);
        //this.npcScoreText = this.add.text(w * 0.35, h * 0.82, "NPC coins: 0").setOrigin(0.5);

        /*// button to open the drag-and-share prototype
        const shareButtonBg = this.add.rectangle(w * 0.88, h * 0.93, 170, 48, 0x2f5d50)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.add.text(w * 0.88, h * 0.93, "Share Demo", {
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);

        shareButtonBg.on("pointerdown", () => {
            this.scene.start("scene-share", {
                playerData: this.playerData,
                playerCoinsFound: this.playerCoinsFound,
                npcCoinsFound: this.npcCoinsFound,
                totalCoins: this.totalCoins,
                level: this.level
            });
        });*/

        // placeholder NPC box
        /*this.npcBox = this.add.rectangle(w * 0.92, h * 0.32, 120, 140, 0x666666)
            .setStrokeStyle(3, 0xffffff);

        this.npcLabel = this.add.text(w * 0.92, h * 0.32, "NPC", {
            fontSize: "28px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);*/

        //parrot without animations yet
        //this.add.image(w * 0.1, h * 0.55, "parrot")
        //bubble for parrot text
        //this.add.image(w * 0.45, h * 0.15, "speech")

        // parrot speech bubble
        this.speechBox = this.add.rectangle(w * 0.4, h * 0.1, 700, 130, 0xFFFFFF) // w*0.45, h*0.1, 660
            .setStrokeStyle(10, 0x000000).setRounded(50).setVisible(false);
        // triangle for pointing speech bubble at parrot
        this.speechTri = this.add.triangle(0, 0, w * 0.5, h * 0.168, w * 0.6, h * 0.168, w * 0.32, h * 0.2, 0xFFFFFF)
            .setStrokeStyle(5, 0x000000).setVisible(false);
        this.hidingRect = this.add.rectangle(w * 0.41, h * 0.15, 400, 11, 0xFFFFFF).setVisible(false);

        // narrator speech box
        this.storyBox = this.add.rectangle(w + 5, -5, 1000, 200, 0xe6c894) // 700,200
            .setStrokeStyle(10, 0x000000).setOrigin(1, 0);
        this.storyText = this.add.text(w * 0.5, h * 0.02, "Look at the things on the beach!\nTry to remember where all the\ncoins are!",  // w*0.65
            {
                fontSize: "48px",
                fontStyle: "bold",
                color: "#000000"
            })//.setWordWrapWidth(1000).getWrappedText();

        // shows whose turn it is
        this.turnText = this.add.text(w * 0.45, h * 0.1, "Your turn!",
            {
                fontSize: "80px",
                fontStyle: "bold",
                color: "#000000"
            }).setOrigin(0.5).setVisible(false);

        // calls createBoard() function
        this.createBoard();
        this.setupMemoryPhase();

        // creates parrot and its animations
        this.createAnimations();
        this.parrot = this.add.sprite(w * -0.5, h * 0.55, "parrotMid"); // proper location w * -0.2, h * 0.55
        this.parrot.setScale(2);
    }

    // creates the main board player will be using
    private createBoard() {
        // constants declared for scaling
        const w = this.scale.width;
        const h = this.scale.height;

        // card dimensions
        const cardWidth = 180 * this.cardScale; // orig 150
        const cardHeight = 210 * this.cardScale; // orig 180
        const gapX = 20 * this.cardScale;
        const gapY = 20 * this.cardScale;

        // how far the board will spread
        const boardWidth = this.cols * cardWidth + (this.cols - 1) * gapX;
        const boardHeight = this.rows * cardHeight + (this.rows - 1) * gapY;

        const startX = (w - boardWidth) * 0.75; // originally  ()/2
        const startY = (h - boardHeight) * 0.55; // orig () * 0.50

        // creates board glow effect and hides it at first
        this.boardGlow = this.add.rectangle(startX - 20, startY - 20, boardWidth + 40, boardHeight + 40, 0x00ff00, 0.5)
            .setOrigin(0, 0).setVisible(false);

        // choose random positions for coins
        const coinIndexes = new Set<number>();

        // while the size of this index is less than the total number of coins we want, we generate a random number
        while (coinIndexes.size < this.totalCoins) {
            const randomIndex = Phaser.Math.Between(0, this.totalCards - 1);
            coinIndexes.add(randomIndex);
        }

        // this will be the list of cards
        this.cards = [];

        // sorted by rows and columns
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const index = row * this.cols + col;
                const x = startX + col * (cardWidth + gapX);
                const y = startY + row * (cardHeight + gapY);

                // the back of the card (blank)
                const back = this.add.rectangle(
                    x + cardWidth / 2,
                    y + cardHeight / 2,
                    cardWidth,
                    cardHeight,
                    0x8b5a2b
                )
                    .setStrokeStyle(3, 0xffffff)
                    .setInteractive({ useHandCursor: true });

                const backLabel = this.add.text(
                    x + cardWidth / 2,
                    y + cardHeight / 2,
                    "?",
                    {
                        fontSize: "42px",
                        color: "#ffffff",
                        fontFamily: "Jengle_Jungallery"
                    }
                ).setOrigin(0.5);

                // the front of the card
                const front = this.add.rectangle(
                    x + cardWidth / 2,
                    y + cardHeight / 2,
                    cardWidth,
                    cardHeight,
                    0xf5deb3
                )
                    .setStrokeStyle(3, 0x333333)
                    .setVisible(false);

                // now we determine which of the cards has a coin behind it from the previously generated random list
                const hasCoin = coinIndexes.has(index);

                // if the card has a coin, it gets the coin emoji, if not, it gets the X
                const frontLabel = this.add.text(
                    x + cardWidth / 2,
                    y + cardHeight / 2,
                    hasCoin ? "🪙" : "✖",
                    {
                        fontSize: "80px", //og 40px
                        color: hasCoin ? "#d4af37" : "#aa2222"
                    }
                )
                    .setOrigin(0.5)
                    .setVisible(false);
                frontLabel.setText("");

                const frontCoinIcon = hasCoin
                    ? this.add.image(
                        x + cardWidth / 2,
                        y + cardHeight / 2,
                        "coinIcon"
                    )
                        .setScale(0.36 * this.cardScale)
                        .setVisible(false)
                    : undefined;

                const frontTrashIcon = hasCoin
                    ? undefined
                    : this.add.image(
                        x + cardWidth / 2,
                        y + cardHeight / 2,
                        Phaser.Utils.Array.GetRandom(["trashBottle", "trashSeaweed", "trashFishbone"])
                    ).setVisible(false);

                let frontTrashScale: number | undefined;
                if (frontTrashIcon) {
                    const source = frontTrashIcon.texture.getSourceImage() as { width: number; height: number };
                    const fitWidth = cardWidth * 0.66;
                    const fitHeight = cardHeight * 0.66;
                    frontTrashScale = Math.min(fitWidth / source.width, fitHeight / source.height);
                    frontTrashIcon.setScale(frontTrashScale);
                }

                // all cards are defaulted to not being flipped
                const card: CardData = {
                    back,
                    backLabel,
                    front,
                    frontLabel,
                    frontCoinIcon,
                    frontTrashIcon,
                    frontTrashScale,
                    hasCoin,
                    flipped: false,
                    row: row + 1,
                    col: col + 1
                };

                // if the player clicks/taps on the card, it will call the function (flipCard()) that flips it
                back.on("pointerdown", () => {
                    if (this.currentTurn !== "player" || this.isPaused || this.isMemoryPhase) return;
                    this.flipCard(card, "player");
                });

                this.cards.push(card);
            }
        }
    }

    // function that will flip the card
    private flipCard(card: CardData, flippedBy: "player" | "npc") {
        if (card.flipped || this.isPaused || this.isMemoryPhase) return;

        // disables the card if already flipped
        card.flipped = true;
        card.back.disableInteractive();

        if (flippedBy == "npc") {
            var flipDelay = 800; //don't touch anymore
        } else {
            flipDelay = 0;
        }

        // first half of flip
        this.tweens.add({
            targets: [card.back, card.backLabel],
            scaleX: 0,
            duration: 240,//prev 120
            delay: flipDelay, // changing this changes coin size for some reason. use delay at end of npctaketurn instead

            // basically turns off the back visuals, while turning on the front visuals
            onComplete: () => {
                card.back.setVisible(false);
                card.backLabel.setVisible(false);

                card.front.setVisible(true).setScale(0, 1);
                card.frontLabel.setVisible(false).setScale(0, 1);
                if (card.frontCoinIcon) {
                    card.frontCoinIcon.setVisible(true).setScale(0);
                }
                if (card.frontTrashIcon) {
                    card.frontTrashIcon.setVisible(true).setScale(0);
                }

                // second half of flip
                this.tweens.add({
                    targets: [card.front, card.frontLabel],
                    scaleX: 1,
                    duration: 240 //prev 120
                });

                if (card.frontCoinIcon) {
                    this.tweens.add({
                        targets: card.frontCoinIcon,
                        scaleX: 0.36 * this.cardScale,
                        scaleY: 0.36 * this.cardScale,
                        duration: 240 //prev 120
                    });
                }
                if (card.frontTrashIcon) {
                    this.tweens.add({
                        targets: card.frontTrashIcon,
                        scaleX: card.frontTrashScale ?? 0.06 * this.cardScale,
                        scaleY: card.frontTrashScale ?? 0.06 * this.cardScale,
                        duration: 240 //prev 120
                    });
                }
            }
        });

        // keeping count of the number of cards flipped
        // keeping count of the number of cards flipped
        this.cardsFlipped++;
        // Log turns for both player and NPC
        this.turnCount++;
        const playerThinkingTime =
            flippedBy === "player" ? this.getAndResetPlayerThinkingTimeSeconds() : null;

        const log: any = {
            turn: this.turnCount,
            clicked_by: flippedBy,
            player_clicked: `${card.row},${card.col}`,
            coin: card.hasCoin ? "yes" : "no",
            player_thinking_time: playerThinkingTime
        };

        this.turnLogs.push(log);

        console.log(log);



        // keeping count of number of coins found by npc/player
        if (card.hasCoin) {
            if (flippedBy === "player") {
                this.playerCoinsFound++;
                this.time.delayedCall(480, () => {
                    AudioManager.I.playSfx(this, "ding_sound");
                    this.animateCoinPopThenTracker("player", card.front.x, card.front.y, card.frontCoinIcon);
                })

            } else {
                //AudioManager.I.playSfx(this, "ding_sound", .9);
                this.npcCoinsFound++;
                this.time.delayedCall(1380, () => { //prev 900
                    AudioManager.I.playSfx(this, "ding_sound");
                    this.animateCoinPopThenTracker("npc", card.front.x, card.front.y, card.frontCoinIcon);
                });
            }
        } else {
            if (flippedBy === "player") {
                this.playerTrashFound++;
            } else {
                this.npcTrashFound++;
            }
        }

        // displaying how many coins have been found by npc and player
        //this.playerScoreText.setText(`Player coins: ${this.playerCoinsFound}`);
        //this.npcScoreText.setText(`NPC coins: ${this.npcCoinsFound}`);

        // once all the coins have been flipped, this will change the scene to the shareScene with a message
        const totalFound = this.playerCoinsFound + this.npcCoinsFound;

        if (totalFound === this.totalCoins) {

            if ((this as any).gameEnded) return;
            (this as any).gameEnded = true;
            this.saveLevelResult();

            if (this.currentTurn == "npc") {
                var endDelay = 1140;
            } else {
                endDelay = 0;
            }

            this.time.delayedCall(0 + endDelay, () => {
                this.currentTurn = "player";

                this.revealAllCards();

                /*this.add.text(
                    this.scale.width / 2,
                    this.scale.height * 0.85,
                    "All coins found!",
                    { fontSize: "40px", color: "#000000" }
                ).setOrigin(0.5).setDepth(2000);*/
                this.turnText.setStyle({ fontSize: "52px" }).setText("We found the coins!");

                this.boardGlow.setVisible(false);

                this.createConfetti();
                AudioManager.I.playSfx(this, "yay_sound", 0.100);

                this.showFinishButton();
            });

            return;
        }

        // this will enact the npc's turn, disabling any input from the player till the turn is done
        // swap turns only if game is not over
        if (flippedBy === "player") {
            this.currentTurn = "npc";
            this.turnText.setStyle({ fontSize: "80px" }).setText("My turn!");
            this.boardGlow.setVisible(false);
            this.time.delayedCall(1000, () => {
                AudioManager.I.playSfx(this, "my_turn");
                this.npcTakeTurn();
            });
        } else {
            // once npcs turn is complete, swap back to players turn
            if (card.back.x > (this.scale.width * 0.3)) {
                var returnDelay = 1600;
            } else {
                returnDelay = 0;
            }
            this.time.delayedCall(1140 + returnDelay, () => { // orig 900+delay
                this.currentTurn = "player";
                this.turnText.setText("Your turn!");
                this.boardGlow.setVisible(true);
                this.startPlayerThinkingTimer();
                AudioManager.I.playSfx(this, "your_turn", 0.2);
            });
        }
    }

    // the npc's turn
    private npcTakeTurn() {
        if (this.isPaused) return;

        // list of of unflipped cards
        const unflippedCards = this.cards.filter(card => !card.flipped);

        if (unflippedCards.length === 0) return;

        // the cards with gold behind them
        const goldCards = unflippedCards.filter(card => card.hasCoin);
        // the rest of the cards without gold
        const nonGoldCards = unflippedCards.filter(card => !card.hasCoin);

        // calls getNpcSuccessChance() to get the odds of NPC finding gold
        const successChance = this.npcSuccessChance;
        const roll = Math.random();

        let chosenCard: CardData;

        // NPC tries to find gold based on difficulty chance
        if (goldCards.length > 0 && roll < successChance) {
            chosenCard = Phaser.Utils.Array.GetRandom(goldCards);
        } else {
            if (nonGoldCards.length > 0) {
                chosenCard = Phaser.Utils.Array.GetRandom(nonGoldCards);
            } else {
                chosenCard = Phaser.Utils.Array.GetRandom(unflippedCards);
            }
        }

        const w = this.scale.width;
        const h = this.scale.height;

        // parrot moves to and from card
        if (chosenCard.back.x > (w * 0.3)) { // if not already next to parrot
            this.tweens.add({
                targets: this.parrot,
                x: chosenCard.back.x - 924, // rough alignment with first default column
                duration: 1000,
                ease: "Quad.easeInOut",
                hold: 1000,
                yoyo: true,
                onUpdate: () => { // moves speech triangle with parrot
                    this.speechTri.setTo(w * 0.5, h * 0.168, w * 0.6, h * 0.168, this.parrot.x + 1000, h * 0.2).update();
                }
            });
            var moveDelay = 700;
        } else {
            moveDelay = 0;
        }

        // parrot points at card
        if (chosenCard.back.y < (h / 3)) { //top third
            this.parrot.playAfterDelay("point_up", moveDelay);
        } else if (chosenCard.back.y > (h / 3 * 2)) { //bottom third
            this.parrot.playAfterDelay("point_down", moveDelay);
        } else {
            this.parrot.playAfterDelay("point_mid", moveDelay);
        }


        // calls flipCard() with generated odds
        this.time.delayedCall(moveDelay * 0.57, () => { // gives 399ms or 0ms delay
            this.flipCard(chosenCard, "npc");
        });
    }

    // makes parrot animations
    private createAnimations() {
        this.anims.create({
            key: "point_up",
            frames: this.anims.generateFrameNumbers("parrotUp", { frames: [0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 8, 9, 10, 11, 12, 13, 0] }),
            frameRate: 12,
            repeat: 0
        })
        this.anims.create({
            key: "point_down",
            frames: this.anims.generateFrameNumbers("parrotDown", { frames: [0, 1, 2, 3, 4, 5, 5, 5, 5, 6, 7, 8, 9, 0] }),
            frameRate: 12,
            repeat: 0
        })
        this.anims.create({
            key: "point_mid",
            frames: this.anims.generateFrameNumbers("parrotMid", { frames: [0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 8, 9, 10, 11, 12, 13, 0] }),
            frameRate: 12,
            repeat: 0
        })
    }

    //makes endgame confetti
    private createConfetti() {
        this.add.particles(0, 0, 'confetti', {
            speed: 100,
            lifespan: 7000,
            duration: 5000,
            gravityY: 100,
            frame: [0, 1, 2, 3, 4, 5],
            x: { min: 0, max: 1920 },
            scaleX: {
                onEmit: (particle) => {
                    return -1.0
                },
                onUpdate: (particle) => {
                    return (particle.scaleX > 1.0 ? -1.0 : particle.scaleX + 0.05)
                }
            },
            rotate: {
                onEmit: (particle) => {
                    return 0
                },
                onUpdate: (particle) => {
                    return particle.angle + 1
                }
            }
        });
    }

    private setupMemoryPhase() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.turnText
            .setPosition(w * 0.45, h * 0.1) //orig h *0.12
            .setText("Remember the coins!")
            .setStyle({
                fontSize: "52px",
                fontStyle: "bold",
                color: "#000000",
                fontFamily: "Jengle_Jungallery",
                align: "center",
                //wordWrap: { width: 560, useAdvancedWrap: true }
            });
        this.showAllCardsForMemoryPhase();

        this.memoryTimerText = this.add.text(w * 0.80, h * 0.90, "             00:00", { //og h * 0.10
            fontSize: "36px",
            color: "#000000",
            fontStyle: "bold"
        }).setOrigin(0.5).setDepth(1500);

        /* this.startGameButton = this.add.text(
            w * 0.5,
            h * 0.93,
            "Ready to play!",
            {
                fontSize: "22px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 20, y: 10 },
                align: "center",
                wordWrap: { width: 460, useAdvancedWrap: true }
            }
        )
            .setOrigin(0.5)
            .setDepth(1500)
            .setInteractive({ useHandCursor: true }); */

        const startGameShadow = this.add.graphics();
        startGameShadow.fillStyle(0x000000, 0.3);
        startGameShadow.fillRoundedRect(w / 2.4 + 10, h * 0.85, w / 6, 100, 10); // orig w / 1.52 + 10, h * 0.05, etc
        startGameShadow.setVisible(false);

        const startGameButton = this.add.graphics();
        startGameButton.lineStyle(2, 0xffffff, 1);
        startGameButton.fillStyle(0x222222, 1);
        startGameButton.fillRoundedRect(w / 2.4, h * 0.85, w / 6, 100, 10); // orig w/1.52, h * 0.05, etc
        startGameButton.strokeRoundedRect(w / 2.4, h * 0.85, w / 6, 100, 10);    // orig w/1.52, h * 0.05, etc

        startGameButton.setInteractive(new Phaser.Geom.Rectangle(w / 2.4, h * 0.85, w / 6, 100), Phaser.Geom.Rectangle.Contains); // orig w/1.52, h * 0.05, etc
        const startGameText = this.add.text(w / 2, h * 0.892, "Start!", { // orig w / 1.35, h * 0.1,
            fontSize: "42px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"
        })
            .setOrigin(0.5);

        startGameButton.on('pointerover', () => {
            startGameShadow.setVisible(true);
            startGameButton.setY(-2);
            startGameText.setY((h * 0.892) - 2); // orig (h * 0.1) - 2
        });

        startGameButton.on('pointerout', () => {
            startGameShadow.setVisible(false);
            startGameButton.setY(0);
            startGameText.setY(h * 0.892); // orig (h * 0.1)
        });

        startGameButton.on("pointerdown", () => {
            AudioManager.I.playSfx(this, "click_sound");
            startGameButton.setVisible(false);
            startGameText.setVisible(false);
            this.startMainGame();
        });

        this.memoryTimerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.memoryPhaseSeconds++;
                this.memoryTimerText.setText(`             ${this.formatSeconds(this.memoryPhaseSeconds)}`);
            }
        });
    }

    private showAllCardsForMemoryPhase() {
        for (const card of this.cards) {
            card.back.disableInteractive();
            card.back.setVisible(false).setScale(1, 1);
            card.backLabel.setVisible(false).setScale(1, 1);
            card.front.setVisible(true).setScale(1, 1);
            card.frontLabel.setVisible(false).setScale(1, 1);
            if (card.frontCoinIcon) {
                card.frontCoinIcon.setVisible(true).setScale(0.36 * this.cardScale);
            }
            if (card.frontTrashIcon) {
                card.frontTrashIcon.setVisible(true).setScale(card.frontTrashScale ?? 0.06 * this.cardScale);
            }
        }
    }

    private startMainGame() {
        if (!this.isMemoryPhase) return;

        this.isPaused = false;
        this.isMemoryPhase = false;
        this.currentTurn = this.startingPlayer;
        this.memoryTimeFormatted = this.formatSeconds(this.memoryPhaseSeconds);

        if (this.memoryTimerEvent) {
            this.memoryTimerEvent.remove(false);
            this.memoryTimerEvent = undefined;
        }

        if (this.memoryTimerText) {
            this.memoryTimerText.destroy();
        }

        if (this.startGameButton) {
            this.startGameButton.disableInteractive();
            this.startGameButton.destroy();
            this.startGameButton = undefined;
        }

        for (const card of this.cards) {
            card.flipped = false;
            card.front.setVisible(false).setScale(1, 1);
            card.frontLabel.setVisible(false).setScale(1, 1);
            if (card.frontCoinIcon) {
                card.frontCoinIcon.setVisible(false).setScale(0.36 * this.cardScale);
            }
            if (card.frontTrashIcon) {
                card.frontTrashIcon.setVisible(false).setScale(card.frontTrashScale ?? 0.06 * this.cardScale);
            }
            card.back.setVisible(true).setScale(1, 1);
            card.backLabel.setVisible(true).setScale(1, 1);
            //card.back.disableInteractive();
            //card.back.setInteractive({ useHandCursor: true }); //sets active after story starts
        }

        this.runStory()
    }

    // intro after start game button pressed
    private runStory() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.storyBox.setVisible(false);
        this.storyText.setVisible(false);

        this.tweens.add({
            targets: this.parrot,
            x: this.scale.width * -0.2, // orig location
            duration: 1000,
            ease: "Quad.easeOut"
        });

        this.time.delayedCall(1100, () => {
            this.speechBox.setVisible(true);
            this.speechTri.setVisible(true);
            this.hidingRect.setVisible(true);
            this.turnText
                .setPosition(w * 0.4, h * 0.1) //og w * 0.5, h * 0.12, then w*0.45, h*0.1
                .setStyle({ fontSize: "48px" }) // orig 80px
                .setText("Where did the coins go?").setVisible(true); //orig "Your turn!"
            AudioManager.I.playSfx(this, "parry_bloop");
        });

        this.time.delayedCall(3000, () => {
            this.storyBox.setSize(700, 200).setVisible(true);
            this.storyText
                .setX(w * 0.65)
                .setText("Help Parry the Parrot\nfind as many coins as\nyou can!")
                .setVisible(true);
            AudioManager.I.playSfx(this, "narrator_sound");
        });



        this.time.delayedCall(8000, () => {
            this.storyBox.setVisible(false);
            this.storyText.setVisible(false);

            for (const card of this.cards) {
                card.back.setInteractive({ useHandCursor: true });
            }

            if (this.currentTurn === "player") {
                this.boardGlow.setVisible(true);
                this.turnText.setStyle({ fontSize: "80px" }).setText("Your turn!");
                this.startPlayerThinkingTimer();
                AudioManager.I.playSfx(this, "your_turn");
            } else {
                this.boardGlow.setVisible(false);
                this.turnText.setStyle({ fontSize: "80px" }).setText("My turn!");
                AudioManager.I.playSfx(this, "my_turn");

                this.time.delayedCall(1000, () => {
                    this.npcTakeTurn();
                });
            }
        });
    }

    private formatSeconds(totalSeconds: number): string {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
        const seconds = (totalSeconds % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    }

    private startPlayerThinkingTimer() {
        this.playerTurnStartTimestampMs = performance.now();
    }

    private getAndResetPlayerThinkingTimeSeconds(): number | null {
        if (this.playerTurnStartTimestampMs === null) {
            return null;
        }

        const elapsedSeconds = Math.max(
            0,
            (performance.now() - this.playerTurnStartTimestampMs) / 1000
        );
        this.playerTurnStartTimestampMs = null;
        return Number(elapsedSeconds.toFixed(2));
    }

    private getTrackerSlot(owner: "player" | "npc", index: number): { x: number; y: number } {
        const w = this.scale.width;
        const h = this.scale.height;
        const col = index % this.trackerCoinsPerRow;
        const row = Math.floor(index / this.trackerCoinsPerRow);
        const rowStartX = owner === "npc" ? w * 0.04 : w * 0.78;

        return {
            x: rowStartX + col * this.trackerCoinSpacing,
            y: h * 0.90 - row * this.trackerCoinSpacing
        };
    }

    private addCoinTrackerIcon(owner: "player" | "npc") {
        const icons = owner === "player" ? this.playerCoinIcons : this.npcCoinIcons;
        const target = this.getTrackerSlot(owner, icons.length);
        const icon = this.add
            .image(target.x, target.y, "coinIcon")
            .setScale(0)
            .setDepth(900);
        icons.push(icon);

        this.tweens.add({
            targets: icon,
            scaleX: this.trackerCoinScale,
            scaleY: this.trackerCoinScale,
            duration: 180,
            ease: "Back.Out"
        });
    }

    private animateCoinPopThenTracker(
        owner: "player" | "npc",
        fromX: number,
        fromY: number,
        sourceCoinIcon?: Phaser.GameObjects.Image
    ) {
        if (!sourceCoinIcon || !sourceCoinIcon.active) {
            this.animateCoinToTracker(owner, fromX, fromY);
            return;
        }

        const baseScale = sourceCoinIcon.scaleX;
        const popScale = baseScale * 1.55;

        this.tweens.add({
            targets: sourceCoinIcon,
            scaleX: popScale,
            scaleY: popScale,
            duration: 170,
            ease: "Back.Out",
            yoyo: true,
            hold: 50,
            onComplete: () => {
                sourceCoinIcon.setScale(baseScale);
                this.animateCoinToTracker(owner, fromX, fromY);
            }
        });
    }

    private animateCoinToTracker(owner: "player" | "npc", fromX: number, fromY: number) {
        const icons = owner === "player" ? this.playerCoinIcons : this.npcCoinIcons;
        const target = this.getTrackerSlot(owner, icons.length);
        const flyingCoin = this.add
            .image(fromX, fromY, "coinIcon")
            .setScale(this.trackerCoinScale * 1.5)
            .setDepth(1300);

        this.tweens.add({
            targets: flyingCoin,
            x: target.x,
            y: target.y,
            scaleX: this.trackerCoinScale,
            scaleY: this.trackerCoinScale,
            duration: 950,
            ease: "Cubic.Out",
            onComplete: () => {
                flyingCoin.destroy();
                this.addCoinTrackerIcon(owner);
            }
        });
    }
    private getLevelResultHistory(): LevelResultRecord[] {
        const raw = localStorage.getItem(this.LEVEL_RESULTS_KEY);
        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as LevelResultRecord[];
            }
        } catch {
            return [];
        }

        return [];
    }

    private saveLevelResult() {
        const history = this.getLevelResultHistory() as any[];

        let playerRecord = history.find(
            (record) =>
                record.playerId === this.playerData.playerId &&
                record.age === this.playerData.age
        );

        if (!playerRecord) {
            playerRecord = {
                playerId: this.playerData.playerId,
                age: this.playerData.age,
                games: []
            };

            history.push(playerRecord);
        }

        const gameEntry = {
            Location: this.playerData.location,
            Difficulty_As_Percentage: `${Math.round(this.npcSuccessChance * 100)}%`,
            Total_Number_of_Coins: this.totalCoins,
            Number_of_Columns: this.cols,
            Number_of_Rows: this.rows,
            Turns: this.turnLogs,
            Total_Trash: this.totalTrash,
            Coin_Trash_Ratio: this.totalTrash === 0 ? this.totalCoins : this.totalCoins / this.totalTrash,
            Coins_Found_by_Player: this.playerCoinsFound,
            Coins_Found_by_NPC: this.npcCoinsFound,
            Coins_Player_Shared_to_Self: 0,
            Coins_Player_Shared_to_NPC: 0,
            Time_Spent_Memorising: this.memoryTimeFormatted,
            Recorded_At: new Date().toISOString()
        };

        playerRecord.games.push(gameEntry);

        localStorage.setItem(this.LEVEL_RESULTS_KEY, JSON.stringify(history));
    }

    private pauseGame() {
        if (this.isPaused) return;
        AudioManager.I.playSfx(this, "click_sound");
        this.isPaused = true;
        this.time.timeScale = 0;
        this.tweens.pauseAll();
        this.showPauseOverlay();
    }

    private resumeGame() {
        if (!this.isPaused) return;
        AudioManager.I.playSfx(this, "click_sound");
        this.isPaused = false;
        this.time.timeScale = 1;
        this.tweens.resumeAll();
        this.hidePauseOverlay();
    }

    private showPauseOverlay() {

        const w = this.scale.width;
        const h = this.scale.height;

        const backdrop = this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x000000, 0.55)
            .setInteractive()
            .setDepth(2000);

        const panel = this.add.rectangle(w * 0.5, h * 0.5, 520, 540, 0x1f1f1f)
            .setStrokeStyle(3, 0xffffff)
            .setDepth(2001);

        const title = this.add.text(w * 0.5, h * 0.38, "Paused", {
            fontSize: "56px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5).setDepth(2001);

        const resumeButton = this.add.text(w * 0.575 + 5, h * 0.7, "Resume", {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "#2f5d50",
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(2001);

        const homeButton = this.add.text(w * 0.445 + 5, h * 0.7, "Back To Home", {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "#5a2f2f",
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(2001);

        const bgmTitle = this.add.text(w * 0.395, h * 0.55, "BGM", {
            fontSize: "32px",
            color: "#FFD700",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(2001);

        const bgmSlider = this.add.dom(w * 0.5, h * 0.55).createFromCache("slider_continuous");
        bgmSlider.setOrigin(0.5);
        const bgSlider = bgmSlider.node.querySelector("input") as HTMLInputElement;
        if (bgSlider) {
            bgSlider.value = (AudioManager.I.getBgmVolume() * 100).toString();;
        }

        const bgmLabel = this.add.text(w * 0.6 + 5, h * 0.55, `${Math.round(AudioManager.I.getBgmVolume() * 100)}%`, {
            fontSize: "32px",
            color: "#FFD700",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(2001);

        if (bgSlider) {
            bgSlider.addEventListener("input", (e) => {
                const vol = parseFloat((e.target as HTMLInputElement).value);
                bgmLabel.setText(`${Math.round(vol)}%`);
                AudioManager.I.setBgmVolume(vol / 100);
            });
        }

        const sfxTitle = this.add.text(w * 0.395, h * 0.6, "SFX", {
            fontSize: "32px",
            color: "#FFD700",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(2001);

        const sfxSlider = this.add.dom(w * 0.5, h * 0.6).createFromCache("slider_continuous");
        sfxSlider.setOrigin(0.5);
        const sfSlider = sfxSlider.node.querySelector("input") as HTMLInputElement;
        if (sfSlider) {
            sfSlider.value = (AudioManager.I.getSfxVolume() * 100).toString();;
        }

        const sfxLabel = this.add.text(w * 0.6 + 5, h * 0.6, `${Math.round(AudioManager.I.getSfxVolume() * 100)}%`, {
            fontSize: "32px",
            color: "#FFD700",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(2001);

        if (sfSlider) {
            sfSlider.addEventListener("input", (e) => {
                const vol = parseFloat((e.target as HTMLInputElement).value);
                sfxLabel.setText(`${Math.round(vol)}%`);
                AudioManager.I.setSfxVolume(vol / 100);
            });
        }

        resumeButton.on("pointerdown", () => this.resumeGame());
        homeButton.on("pointerdown", () => {
            this.time.timeScale = 1;
            this.tweens.resumeAll();
            this.scene.start("MainMenu");
        });


        this.pauseOverlayContainer = this.add.container(0, 0, [
            backdrop,
            panel,
            title,
            resumeButton,
            homeButton,
            bgmTitle,
            bgmSlider,
            bgmLabel,
            sfxTitle,
            sfxSlider,
            sfxLabel
        ]);
        this.pauseOverlayContainer.setDepth(2000);
    }

    private hidePauseOverlay() {
        this.pauseOverlayContainer.setVisible(false);
    }

    private revealAllCards() {
        for (const card of this.cards) {
            if (card.flipped) continue;

            card.flipped = true;
            card.back.disableInteractive();

            card.back.setVisible(false);
            card.backLabel.setVisible(false);

            card.front.setVisible(true);
            card.frontLabel.setVisible(false);
            if (card.frontCoinIcon) {
                card.frontCoinIcon.setVisible(true).setScale(0.36 * this.cardScale);
            }
            if (card.frontTrashIcon) {
                card.frontTrashIcon.setVisible(true).setScale(card.frontTrashScale ?? 0.06 * this.cardScale);
            }
        }
    }

    private showFinishButton() {
        const w = this.scale.width;
        const h = this.scale.height;

        /*const btn = this.add.rectangle(w * 0.5, h * 0.9, 240, 60, 0x2f5d50)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setDepth(2000);

        this.add.text(btn.x, btn.y, "Go to Share", {
            fontSize: "28px",
            color: "#ffffff"
        })
            .setOrigin(0.5)
            .setDepth(2000);*/

        const shareShadow = this.add.graphics();
        shareShadow.fillStyle(0x000000, 0.3);
        shareShadow.fillRoundedRect(w / 1.52 + 10, h * 0.05, w / 6, 100, 10);
        shareShadow.setVisible(false);

        const shareButton = this.add.graphics();
        shareButton.lineStyle(2, 0xffffff, 1);
        shareButton.fillStyle(0x222222, 1);
        shareButton.fillRoundedRect(w / 1.52, h * 0.05, w / 6, 100, 10);
        shareButton.strokeRoundedRect(w / 1.52, h * 0.05, w / 6, 100, 10);

        shareButton.setInteractive(new Phaser.Geom.Rectangle(w / 1.52, h * 0.05, w / 6, 100), Phaser.Geom.Rectangle.Contains);
        const shareText = this.add.text(w / 1.35, h * 0.1, "Share!", {
            fontSize: "42px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"


        })
            .setOrigin(0.5);

        shareButton.on('pointerover', () => {
            shareShadow.setVisible(true);
            shareButton.setY(-2);
            shareText.setY((h * 0.1) - 2);
        });

        shareButton.on('pointerout', () => {
            shareShadow.setVisible(false);
            shareButton.setY(0);
            shareText.setY(h * 0.1);
        });


        shareButton.on("pointerdown", () => {
            AudioManager.I.playSfx(this, "click_sound");
            this.scene.start("scene-share", {
                playerData: this.playerData,
                playerCoinsFound: this.playerCoinsFound,
                npcCoinsFound: this.npcCoinsFound,
                playerTrashFound: this.playerTrashFound,
                npcTrashFound: this.npcTrashFound,
                totalCoins: this.totalCoins,
                totalTrash: this.totalTrash,
                memoryTime: this.memoryTimeFormatted,
                npcSuccessChance: this.npcSuccessChance,
                rows: this.rows,
                columns: this.cols,
                turnLogs: this.turnLogs
            });
        });
    }


    update() {
        // not needed right now
    }
}