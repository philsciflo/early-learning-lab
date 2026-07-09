import Phaser from "phaser";

// helper type for each card
type CardData = {
    back: Phaser.GameObjects.Rectangle;
    backLabel: Phaser.GameObjects.Text;
    front: Phaser.GameObjects.Rectangle;
    frontLabel: Phaser.GameObjects.Text;
    hasCoin: boolean;
    flipped: boolean;
};

// helper type for data from homepage
type PlayerData = {
    playerId: string;
    age: string;
    location: string;
};

type LevelResultRecord = {
    playerId: string;
    level: string;
    totalCoins: number;
    playerCoinsFound: number;
    npcCoinsFound: number;
    recordedAt: string;
};

// This is the custom game scene
export default class CustomGameScene extends Phaser.Scene {
    // here we can decide how many cards we want in the game and how many coins there are to find
    private rows = 3;
    private cols = 7;
    private totalCards = this.rows * this.cols;
    private totalCoins = 10;
    private level: string = "Custom";

    
    // keeping track of how many coins found, card data, number of cards flipped
    private cards: CardData[] = [];
    private playerCoinsFound = 0;
    private npcCoinsFound = 0;
    private cardsFlipped = 0;

    private playerScoreText!: Phaser.GameObjects.Text; // displays number of coins npc/player has found
    private npcScoreText!: Phaser.GameObjects.Text;
    private playerCoinIcons: Phaser.GameObjects.Image[] = [];
    private npcCoinIcons: Phaser.GameObjects.Image[] = [];
    private playerData!: PlayerData; // carrys over userId from homepage

    private currentTurn: "player" | "npc" = "player"; // indicates whose turn it is, player is first by default
    private npcSuccessChance: number;

    private turnText!: Phaser.GameObjects.Text; // indicates whose turn it is
    //private npcBox!: Phaser.GameObjects.Rectangle; // temporary box for the NPC
    //private npcLabel!: Phaser.GameObjects.Text;
    private readonly LEVEL_RESULTS_KEY = "levelResultsHistory";
    private isPaused = false;
    private pauseOverlayContainer?: Phaser.GameObjects.Container;

    constructor() {
        // gives the scene a unique name
        super("CustomGameScene");
    }

    // declares userID from homepage for welcome message
    init(data: any) {
        //Console for testing
        console.log("CustomGameScene RAW DATA:", data);

        this.playerData = {
            playerId: data.playerId ?? "Player",
            age: data.age ?? "",
            location: data.location ?? ""
        };

        let customTotalCoins = data.totalCoins !== undefined ? Number(data.totalCoins) : NaN;
        if (isNaN(customTotalCoins)) customTotalCoins = 10;
        const maxCoins = this.rows * this.cols;
        this.totalCoins = Math.min(maxCoins, Math.max(1, customTotalCoins));

        let chance = data.npcSuccessChance !== undefined ? Number(data.npcSuccessChance) : NaN;
        if (isNaN(chance)) chance = 0.5;
        this.npcSuccessChance = Math.min(1, Math.max(0, chance));
    }

    // preload runs before the scene starts, its used to load images, sounds, etc
    preload() {
        // right now its just some terribly laid out sprites i found online
        this.load.image("menuButton", "assets/menu.png");
        //this.load.image("prevLevelButton", "assets/left.png"); // hide for now it looks ugly
        //this.load.image("nextLevelButton", "assets/right.png");
        this.load.image("settingsButton", "assets/settings.png");
        this.load.image("parrot", "assets/parry_default.png");
        this.load.image("speech", "assets/speech_bubble.png");
        this.load.image("background2", "assets/background_island_test.png");
        this.load.image("coinIcon", "assets/coin.png");
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
        this.cardsFlipped = 0;
        this.playerCoinIcons = [];
        this.npcCoinIcons = [];
        this.currentTurn = "player";

        //temp background. testing border size
        this.add.image(w / 2, h / 2, "background2");

        // top buttons
        this.add.image(w * 0.05, h * 0.10, "menuButton")
            .setInteractive()
            .on("pointerdown", () => {
                if (this.isPaused) this.resumeGame();
                else this.pauseGame();
            })
            .setScale(0.25)
            .setDepth(1000);

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

        this.add.image(w * 0.95, h * 0.10, "settingsButton")
            .setInteractive()
            .on("pointerdown", () => {
                this.scene.start("SettingsScreen", {
                    ...this.playerData,
                    level: this.level
                });
            })
            .setScale(0.25)
            .setDepth(1000);

        // displays userID with welcome
        this.add.text(
            w * 0.5,
            h * 0.05,
            `Welcome ${this.playerData.playerId}`
        ).setOrigin(0.5);

        // status text for tracking coins found. og height h*0.18
        this.playerScoreText = this.add.text(w * 0.65, h * 0.82, "Player coins: 0").setOrigin(0.5);
        this.npcScoreText = this.add.text(w * 0.35, h * 0.82, "NPC coins: 0").setOrigin(0.5);

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
        this.add.image(w * 0.1, h * 0.55, "parrot");
        //bubble for parrot text
        this.add.image(w * 0.45, h * 0.15, "speech");

        // shows whose turn it is
        this.turnText = this.add.text(w * 0.5, h * 0.12, "Your turn!", 
            {
                fontSize: "80px",
                fontStyle: "bold",
                color: "#000000"
            }).setOrigin(0.5);

        // calls createBoard() function
        this.createBoard();
    }

    // creates the main board player will be using
    private createBoard() {
        // constants declared for scaling
        const w = this.scale.width;
        const h = this.scale.height;

        // card dimensions
        const cardWidth = 150; //originally 90
        const cardHeight = 180; //originally 120
        const gapX = 20;
        const gapY = 20;

        const boardWidth = this.cols * cardWidth + (this.cols - 1) * gapX;
        const boardHeight = this.rows * cardHeight + (this.rows - 1) * gapY;
        const startX = (w - boardWidth) * 0.75;
        const startY = (h - boardHeight) * 0.50;

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
                        color: "#ffffff"
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

                // all cards are defaulted to not being flipped
                const card: CardData = {
                    back,
                    backLabel,
                    front,
                    frontLabel,
                    hasCoin,
                    flipped: false
                };

                // if the player clicks/taps on the card, it will call the function (flipCard()) that flips it
                back.on("pointerdown", () => {
                    if (this.currentTurn !== "player" || this.isPaused) return;
                    this.flipCard(card, "player");
                });

                this.cards.push(card);
            }
        }
    }

    // function that will flip the card
    private flipCard(card: CardData, flippedBy: "player" | "npc") {
        if (card.flipped || this.isPaused) return;

        // disables the card if already flipped
        card.flipped = true;
        card.back.disableInteractive();

        // first half of flip
        this.tweens.add({
            targets: [card.back, card.backLabel],
            scaleX: 0,
            duration: 120,

            // basically turns off the back visuals, while turning on the front visuals
            onComplete: () => {
                card.back.setVisible(false);
                card.backLabel.setVisible(false);

                card.front.setVisible(true).setScale(0, 1);
                card.frontLabel.setVisible(true).setScale(0, 1);

                // second half of flip
                this.tweens.add({
                    targets: [card.front, card.frontLabel],
                    scaleX: 1,
                    duration: 120
                });
            }
        });

        // keeping count of the number of cards flipped
        this.cardsFlipped++;

        // keeping count of number of coins found by npc/player
        if (card.hasCoin) {
            if (flippedBy === "player") {
                this.playerCoinsFound++;
                this.addCoinTrackerIcon("player");
            } else {
                this.npcCoinsFound++;
                this.addCoinTrackerIcon("npc");
            }
        }

        // displaying how many coins have been found by npc and player
        this.playerScoreText.setText(`Player coins: ${this.playerCoinsFound}`);
        this.npcScoreText.setText(`NPC coins: ${this.npcCoinsFound}`);

        // once all the cards have been flipped, this will change the scene to the shareScene with a message
        if (this.cardsFlipped === this.totalCards) {
            const message = "You have flipped all the cards, Well done!";
            this.add.text(this.scale.width / 2, this.scale.height * 0.88, message).setOrigin(0.5);
            this.time.delayedCall(4500, () => {
                this.scene.start("scene-share", {
                    playerData: this.playerData,
                    playerCoinsFound: this.playerCoinsFound,
                    npcCoinsFound: this.npcCoinsFound,
                    totalCoins: this.totalCoins,
                    level: this.level,
                    isCustomMode: true,
                    customTotalCoins: this.totalCoins,
                    customNpcSuccessChance: this.npcSuccessChance
                });
            });
            return;
        }

        // this will enact the npc's turn, disabling any input from the player till the turn is done
        // swap turns only if game is not over
        if (flippedBy === "player") {
            this.currentTurn = "npc";
            this.turnText.setText("My turn!");

            this.time.delayedCall(1000, () => {
                this.npcTakeTurn();
            });
        } else {
            // once npcs turn is complete, swap back to players turn
            this.currentTurn = "player";
            this.turnText.setText("Your turn!");
        }
    }

    // the npc's turn
    private npcTakeTurn() {
        if (this.isPaused) return;

        // list of of unflipped cards
        const unflippedCards = this.cards.filter(c => !c.flipped);

        if (unflippedCards.length === 0) return;

        // the cards with gold behind them
        const goldCards = unflippedCards.filter(c => c.hasCoin);
        // the rest of the cards without gold
        const nonGoldCards = unflippedCards.filter(c => !c.hasCoin);

        // calls getNpcSuccessChance() to get the odds of NPC finding gold
        const roll = Math.random();
        let chosenCard: CardData;

        // NPC tries to find gold based on difficulty chance
        if (goldCards.length > 0 && roll < this.npcSuccessChance) {
            chosenCard = Phaser.Utils.Array.GetRandom(goldCards);
        } else {
            if (nonGoldCards.length > 0) {
                chosenCard = Phaser.Utils.Array.GetRandom(nonGoldCards);
            } else {
                chosenCard = Phaser.Utils.Array.GetRandom(unflippedCards);
            }
        }

        // calls flipCard() with generated odds
        this.flipCard(chosenCard, "npc");
    }

    private addCoinTrackerIcon(owner: "player" | "npc") {
        const icons = owner === "player" ? this.playerCoinIcons : this.npcCoinIcons;
        const w = this.scale.width;
        const h = this.scale.height;
        const iconsPerRow = 5;
        const spacing = 34;
        const col = icons.length % iconsPerRow;
        const row = Math.floor(icons.length / iconsPerRow);
        const baseX = owner === "npc" ? w * 0.10 : w * 0.90;
        const baseY = h * 0.88;
        const x = baseX + (col - (iconsPerRow - 1) / 2) * spacing;
        const y = baseY + row * spacing;
        const targetScale = 0.40;

        const icon = this.add.image(x, y, "coinIcon").setScale(0).setDepth(900);
        icons.push(icon);

        this.tweens.add({
            targets: icon,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 180,
            ease: "Back.Out"
        });
    }

    private getLevelResultHistory(): LevelResultRecord[] {
        const raw = localStorage.getItem(this.LEVEL_RESULTS_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch {}
        return [];
    }

    private saveLevelResult() {
        const history = this.getLevelResultHistory();
        const entry: LevelResultRecord = {
            playerId: this.playerData.playerId,
            level: this.level,
            totalCoins: this.totalCoins,
            playerCoinsFound: this.playerCoinsFound,
            npcCoinsFound: this.npcCoinsFound,
            recordedAt: new Date().toISOString()
        };
        const latest = history[history.length - 1];
        const isDuplicate = latest && latest.playerId === entry.playerId && latest.level === entry.level &&
            latest.totalCoins === entry.totalCoins && latest.playerCoinsFound === entry.playerCoinsFound &&
            latest.npcCoinsFound === entry.npcCoinsFound;
        if (!isDuplicate) {
            history.push(entry);
            localStorage.setItem(this.LEVEL_RESULTS_KEY, JSON.stringify(history));
        }
    }

    private pauseGame() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.time.timeScale = 0;
        this.tweens.pauseAll();
        this.showPauseOverlay();
    }

    private resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.time.timeScale = 1;
        this.tweens.resumeAll();
        this.hidePauseOverlay();
    }

    private showPauseOverlay() {
        if (this.pauseOverlayContainer) {
            this.pauseOverlayContainer.setVisible(true);
            return;
        }
        const w = this.scale.width;
        const h = this.scale.height;
        const backdrop = this.add.rectangle(w*0.5, h*0.5, w, h, 0x000000, 0.55).setInteractive().setDepth(2000);
        const panel = this.add.rectangle(w*0.5, h*0.5, 520, 340, 0x1f1f1f).setStrokeStyle(3, 0xffffff).setDepth(2001);
        const title = this.add.text(w*0.5, h*0.38, "Paused", { fontSize: "56px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(2001);
        const resumeButton = this.add.text(w*0.5, h*0.50, "Resume", { fontSize: "36px", color: "#ffffff", backgroundColor: "#2f5d50", padding: { x:22, y:10 } })
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2001);
        const homeButton = this.add.text(w*0.5, h*0.62, "Back To Home", { fontSize: "32px", color: "#ffffff", backgroundColor: "#5a2f2f", padding: { x:20, y:10 } })
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2001);
        resumeButton.on("pointerdown", () => this.resumeGame());
        homeButton.on("pointerdown", () => {
            this.time.timeScale = 1;
            this.tweens.resumeAll();
            this.scene.start("MainMenu");
        });
        this.pauseOverlayContainer = this.add.container(0, 0, [backdrop, panel, title, resumeButton, homeButton]);
        this.pauseOverlayContainer.setDepth(2000);
    }

    private hidePauseOverlay() {
        if (this.pauseOverlayContainer) this.pauseOverlayContainer.setVisible(false);
    }

    update() {}
}
