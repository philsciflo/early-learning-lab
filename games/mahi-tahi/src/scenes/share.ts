import Phaser from "phaser";
import { AudioManager } from "../AudioManager";
import {
    HALF_WIDTH,
    HEIGHT,
    HALF_HEIGHT,
} from "../constants";

// This is the drag-and-share scene
export default class ShareScene extends Phaser.Scene {
    private shareCircles: Phaser.GameObjects.Image[] = [];
    private playerZone!: Phaser.GameObjects.Image;
    private npcZone!: Phaser.GameObjects.Image;
    private playerCountText!: Phaser.GameObjects.Text;
    private npcCountText!: Phaser.GameObjects.Text;
    private npcSuccessChance: number = 0.5;
    private playerData: any;
    private playerCoinsFound = 0;
    private npcCoinsFound = 0;
    private playerTrashFound = 0;
    private npcTrashFound = 0;
    private totalCoins = 0;
    private totalTrash = 0;
    private shareActions: any[] = [];
    private shareSession = 1;
    private shareTurnCounter = 0;
    private allocatableCoins = 0;
    private memoryTime = "00:00";
    private playerSharedToSelf = 0;
    private playerSharedToNpc = 0;
    private nextButtonBg!: Phaser.GameObjects.Rectangle;
    private nextButtonText!: Phaser.GameObjects.Text;
    private isConfirmPhase = false;
    private gridColumns = 0;
    private gridRows = 0;
    private rows = 0;
    private columns = 0;
    private gameTurnLogs: any[] = [];
    private allowRelock = true;
    private confirmText: Phaser.GameObjects.Text | null = null;
    private newGamePopupObjects: Phaser.GameObjects.GameObject[] = [];
    private sharingResponses: any[] = [];


    //Get player information
    init(data: any) {
        const pd = data.playerData ?? data;
        this.playerData = pd;
        this.npcSuccessChance = data.npcSuccessChance ?? 0.5;
        this.playerCoinsFound = Math.max(0, Math.floor(data.playerCoinsFound ?? 0));
        this.npcCoinsFound = Math.max(0, Math.floor(data.npcCoinsFound ?? 0));
        this.playerTrashFound = Math.max(0, Math.floor(data.playerTrashFound ?? 0));
        this.npcTrashFound = Math.max(0, Math.floor(data.npcTrashFound ?? 0));
        this.totalCoins = Math.max(0, Math.floor(data.totalCoins ?? 0));
        this.totalTrash = data.totalTrash ?? 0;
        this.allocatableCoins = this.totalCoins;
        this.memoryTime = data.memoryTime ?? "00:00";
        this.rows = data.rows;
        this.columns = data.columns;
        this.gameTurnLogs = data.turnLogs ?? [];

    }

    constructor() {
        super("scene-share");
    }

    preload() {
        this.load.image("background", "assets/background_island_test.jpg");
        this.load.image("background2", "assets/background_island_test.png");
        this.load.image("coinIcon", "assets/coin.png");
        this.load.image("parryChest", "assets/sharing_chest_parry.png");
        this.load.image("playerChest", "assets/sharing_chest.png");
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.isConfirmPhase = false;
        this.allowRelock = true;
        this.shareCircles = [];
        this.playerSharedToSelf = 0;
        this.playerSharedToNpc = 0;
        this.sharingResponses = [];
        this.shareActions = [];
        this.shareSession = 1;
        this.shareTurnCounter = 0;

        this.cameras.main.setBackgroundColor("#f5f5f5");
        this.add.image(w / 2, h / 2, "background2");

        const titleBg = this.add.rectangle(w * 0.5, h * 0.08, 260, 50, 0x2f5d50)
            .setStrokeStyle(2, 0xffffff);

        this.add.text(titleBg.x, titleBg.y, "Sharing", {
            fontSize: "24px",
            color: "#ffffff",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        /* const backButtonBg = this.add.rectangle(w * 0.12, h * 0.08, 120, 42, 0x8B0000)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.add.text(backButtonBg.x, backButtonBg.y, "Menu", {
            fontSize: "22px",
            color: "#ffffff",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5); */

        /* const backShadow = this.add.graphics();
        backShadow.fillStyle(0x000000, 0.3);
        backShadow.fillRoundedRect(HALF_WIDTH - 840, HEIGHT * 0.08, HALF_WIDTH/3.5, 90, 10);
        backShadow.setVisible(false);

        const backButton = this.add.graphics();
        backButton.lineStyle(2, 0xffffff, 1);
        backButton.fillStyle(0x222222, 1);
        backButton.fillRoundedRect(HALF_WIDTH - 850, HEIGHT * 0.08, HALF_WIDTH/3.5, 90, 10);
        backButton.strokeRoundedRect(HALF_WIDTH - 850, HEIGHT * 0.08, HALF_WIDTH/3.5, 90, 10);
        
        backButton.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH - 850, HEIGHT * 0.08, HALF_WIDTH/3.5, 90), Phaser.Geom.Rectangle.Contains);
        const backText = this.add.text(HALF_WIDTH - 710, HEIGHT * 0.12, "Menu", {
        fontSize: "32px",
        color: "#FFFFFF",
        fontFamily: "Jengle_Jungallery"


        })
        .setOrigin(0.5);

        backButton.on('pointerover', () => {
                backShadow.setVisible(true);
                backButton.setY(-2); 
                backText.setY((HEIGHT * 0.12) - 2);
            });
        
        backButton.on('pointerout', () => {
            backShadow.setVisible(false);
            backButton.setY(0);
            backText.setY(HEIGHT * 0.12);
        });

        backButton.on("pointerdown", () => {
            AudioManager.I.playSfx(this, "click_sound");
            this.scene.start("MainMenu");
        });*/
        this.add.image(this.scale.width * 0.05, this.scale.height * 0.10, "menuButton")
            .setInteractive()
            .on("pointerdown", () => {
                AudioManager.I.playSfx(this, "click_sound");
                this.scene.pause();
                this.scene.launch('PauseScene', { fromScene: this.scene.key });

            })
            .setScale(0.25)
            .setDepth(1000);

        this.nextButtonBg = this.add.rectangle(w * 0.5, h * 0.16, 220, 42, 0x8B0000)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.nextButtonText = this.add.text(
            this.nextButtonBg.x,
            this.nextButtonBg.y,
            "Back to Main",
            {
                fontSize: "25px",
                color: "#ffffff",
                fontFamily: "Jengle_Jungallery"
            }
        ).setOrigin(0.5);


        this.nextButtonBg.on("pointerdown", () => {
            if (!this.allCoinsDistributed()) {
                return;
            }

            //this.saveLevelResult();

            // Always return to main menu
            this.scene.start("MainMenu");
        });

        this.nextButtonBg.setVisible(false);
        this.nextButtonText.setVisible(false);

        /*this.playerZone = this.add.rectangle(w * 0.25, h * 0.55, 220, 260, 0xd0e6ff)
            .setStrokeStyle(3, 0x4a90e2);

        this.npcZone = this.add.rectangle(w * 0.75, h * 0.55, 220, 260, 0xffd6d6)
            .setStrokeStyle(3, 0xe26a6a);*/

        this.playerZone = this.add.image(w * 0.75, h * 0.55, "playerChest")
            .setScale(0.8);

        this.npcZone = this.add.image(w * 0.25, h * 0.55, "parryChest")
            .setScale(0.8);

        this.add.text(w * 0.75, h * 0.22, "YOU", { //orig h*0.32
            fontSize: "28px",
            color: "#000000",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        this.add.text(w * 0.25, h * 0.22, "PARRY", {
            fontSize: "28px",
            color: "#000000",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        this.playerCountText = this.add.text(w * 0.75, h * 0.28, "Count: 0", { //orig h*0.38
            fontSize: "24px",
            color: "#000000",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        this.npcCountText = this.add.text(w * 0.25, h * 0.28, "Count: 0", {
            fontSize: "24px",
            color: "#000000",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        this.shareCircles = [];

        const coinsPerRow = Math.min(8, Math.max(1, this.allocatableCoins));
        const spacing = 68;
        const totalRows = Math.ceil(this.allocatableCoins / coinsPerRow);
        const startY = h * 0.82 - ((totalRows - 1) * spacing) / 2;
        this.gridColumns = this.columns;
        this.gridRows = this.rows;

        for (let i = 0; i < this.allocatableCoins; i++) {
            const row = Math.floor(i / coinsPerRow);
            const col = i % coinsPerRow;
            const coinsInRow = Math.min(coinsPerRow, this.allocatableCoins - row * coinsPerRow);
            const rowWidth = (coinsInRow - 1) * spacing;

            const circle = this.add.image(
                w * 0.5 - rowWidth / 2 + col * spacing,
                startY + row * spacing,
                "coinIcon"
            )
                .setScale(0.22)
                .setOrigin(0.5);
            circle.setInteractive({ useHandCursor: true });

            this.input.setDraggable(circle);
            (circle as any).assignedTo = null;
            (circle as any).locked = false;


            this.shareCircles.push(circle);
        }

        if (this.allocatableCoins === 0) {
            this.add.text(w * 0.5, h * 0.82, "No coins found in this level", {
                fontSize: "24px",
                color: "#4a4a4a"
            }).setOrigin(0.5);
        }

        this.input.on(
            "dragstart",
            (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
                const circle = gameObject as Phaser.GameObjects.Image;
                this.input.setDraggable(circle, true);
                (circle as any).dragOffsetX = circle.x - pointer.x;
                (circle as any).dragOffsetY = circle.y - pointer.y;
            });

        this.input.on(
            "drag",
            (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
                const circle = gameObject as Phaser.GameObjects.Image;
                const dragOffsetX = (circle as any).dragOffsetX ?? 0;
                const dragOffsetY = (circle as any).dragOffsetY ?? 0;
                circle.x = pointer.x + dragOffsetX;
                circle.y = pointer.y + dragOffsetY;
            }
        );

        this.input.on(
            "dragend",
            (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
                const circle = gameObject as Phaser.GameObjects.Image;
                this.assignCircleToZone(circle);
                this.updateShareCounts();
            }
        );

        this.updateShareCounts();
    }

    private assignCircleToZone(circle: Phaser.GameObjects.Image) {
        const pBounds = new Phaser.Geom.Polygon([
            new Phaser.Geom.Point(1570, 450),
            new Phaser.Geom.Point(1175, 340),
            new Phaser.Geom.Point(1300, 490),
            new Phaser.Geom.Point(1175, 670),
            new Phaser.Geom.Point(1580, 800),
            new Phaser.Geom.Point(1690, 610)
        ]);

        const nBounds = new Phaser.Geom.Polygon([
            new Phaser.Geom.Point(350, 450),
            new Phaser.Geom.Point(745, 340),
            new Phaser.Geom.Point(620, 490),
            new Phaser.Geom.Point(745, 670),
            new Phaser.Geom.Point(340, 800),
            new Phaser.Geom.Point(230, 610)
        ]);

        /*const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xff0000);

        graphics.strokePoints(
            pBounds.points,
            true
        );

        graphics.strokePoints(
            nBounds.points,
            true
        );*/

        const centerX = circle.x;
        const centerY = circle.y;

        if (Phaser.Geom.Polygon.Contains(pBounds, centerX, centerY)) {
            AudioManager.I.playSfx(this, "ding_sound");
            (circle as any).assignedTo = "player";
            this.shareTurnCounter++;

            this.shareActions.push({
                session: this.shareSession,
                turn: this.shareTurnCounter,
                coin: this.shareCircles.indexOf(circle) + 1,
                box: "Player"
            });
        }
        else if (Phaser.Geom.Polygon.Contains(nBounds, centerX, centerY)) {
            AudioManager.I.playSfx(this, "ding_sound");
            (circle as any).assignedTo = "npc";
            this.shareTurnCounter++;

            this.shareActions.push({
                session: this.shareSession,
                turn: this.shareTurnCounter,
                coin: this.shareCircles.indexOf(circle) + 1,
                box: "NPC"
            });
        }
        else {
            (circle as any).assignedTo = null;
        }

        if ((circle as any).assignedTo !== null && !this.isConfirmPhase && this.allowRelock) {
            (circle as any).locked = true;
            this.input.setDraggable(circle, false);
        }
    }

    private updateShareCounts() {
        let playerCount = 0;
        let npcCount = 0;

        for (const circle of this.shareCircles) {
            const assignedTo = (circle as any).assignedTo;

            if (assignedTo === "player") {
                playerCount++;
            } else if (assignedTo === "npc") {
                npcCount++;
            }
        }

        this.playerSharedToSelf = playerCount;
        this.playerSharedToNpc = npcCount;
        this.playerCountText.setText(`Count: ${playerCount}`);
        this.npcCountText.setText(`Count: ${npcCount}`);

        if (this.allCoinsDistributed() && !this.isConfirmPhase) {
            this.enterConfirmPhase();
        }
    }

    private readonly LEVEL_RESULTS_KEY = "levelResultsHistory";

    private getLevelResultHistory(): any[] {
        const raw = localStorage.getItem(this.LEVEL_RESULTS_KEY);
        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            return [];
        }

        return [];
    }

    private saveLevelResult(): void {
        const history = this.getLevelResultHistory();

        const playerId = this.playerData?.playerId ?? "";
        const age = this.playerData?.age ?? null;
        const location = this.playerData?.location ?? "";

        // Find existing player entry
        let playerEntry = history.find(
            (entry: any) => entry.playerId === playerId && entry.age === age
        );

        // If no existing entry, create one
        if (!playerEntry) {
            playerEntry = {
                playerId: playerId,
                age: age,
                games: []
            };
            history.push(playerEntry);
        }

        // Add this game session with location included
        const gameEntry = {
            Location: location,
            Difficulty_As_Percentage: `${Math.round(this.npcSuccessChance * 100)}%`,
            Total_Number_of_Coins: this.totalCoins,
            Total_Trash: this.totalTrash,
            Number_of_Columns: this.columns,
            Number_of_Rows: this.rows,
            Turns: this.gameTurnLogs,
            Sharing_Responses: this.sharingResponses,
            Coins_Found_by_Player: this.playerCoinsFound,
            Coins_Found_by_NPC: this.npcCoinsFound,
            Trash_Found_by_Player: this.playerTrashFound,
            Trash_Found_by_NPC: this.npcTrashFound,
            Player_Coin_Trash_Ratio: this.playerTrashFound > 0 ? Number((this.playerCoinsFound / this.playerTrashFound).toFixed(2)) : this.playerCoinsFound,
            NPC_Coin_Trash_Ratio: this.npcTrashFound > 0 ? Number((this.npcCoinsFound / this.npcTrashFound).toFixed(2)) : this.npcCoinsFound,
            Coins_Player_Shared_to_Self: this.playerSharedToSelf,
            Coins_Player_Shared_to_NPC: this.playerSharedToNpc,
            Time_Spent_Memorising: this.memoryTime,
            Recorded_At: new Date().toLocaleString("sv-SE", {
                timeZone: "Pacific/Auckland",
                hour12: false
            })
        };

        const latestGame = playerEntry.games[playerEntry.games.length - 1];

        if (
            latestGame &&
            JSON.stringify(latestGame.Turns) === JSON.stringify(this.gameTurnLogs)
        ) {
            Object.assign(latestGame, gameEntry);
        } else {
            playerEntry.games.push(gameEntry);
        }

        localStorage.setItem(this.LEVEL_RESULTS_KEY, JSON.stringify(history));
    }



    private allCoinsDistributed(): boolean {
        return this.shareCircles.every(circle => (circle as any).assignedTo !== null);
    }

    private enterConfirmPhase() {
        this.isConfirmPhase = true;
        const w = this.scale.width;
        const h = this.scale.height;

        this.confirmText = this.add.text(w * 0.5, h * 0.2,
            "Are you happy with these coins?",
            {
                fontSize: "32px",
                color: "#ffffff",
                backgroundColor: "#000000",
                fontFamily: "Jengle_Jungallery",
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5);

        /* const yesBtn = this.add.text(w * 0.4, h * 0.3, "Yes", {
            fontSize: "36px",
            color: "#ffffff",
            backgroundColor: "#2f5d50",
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true }); */

        const yesShadow = this.add.graphics();
        yesShadow.fillStyle(0x000000, 0.3);
        yesShadow.fillRoundedRect(HALF_WIDTH - 290, HEIGHT * 0.25, HALF_WIDTH / 3.5, 90, 10);
        yesShadow.setVisible(false);

        const yesBtn = this.add.graphics();
        yesBtn.lineStyle(2, 0xffffff, 1);
        yesBtn.fillStyle(0x2f5d50, 1);
        yesBtn.fillRoundedRect(HALF_WIDTH - 300, HEIGHT * 0.25, HALF_WIDTH / 3.5, 90, 10);
        yesBtn.strokeRoundedRect(HALF_WIDTH - 300, HEIGHT * 0.25, HALF_WIDTH / 3.5, 90, 10);

        yesBtn.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH - 300, HEIGHT * 0.25, HALF_WIDTH / 3.5, 90), Phaser.Geom.Rectangle.Contains);
        const yesText = this.add.text(HALF_WIDTH - 160, HEIGHT * 0.29, "Yes", {
            fontSize: "32px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"


        })
            .setOrigin(0.5);

        yesBtn.on('pointerover', () => {
            yesShadow.setVisible(true);
            yesBtn.setY(-2);
            yesText.setY((HEIGHT * 0.29) - 2);
        });

        yesBtn.on('pointerout', () => {
            yesShadow.setVisible(false);
            yesBtn.setY(0);
            yesText.setY(HEIGHT * 0.29);
        });

        yesBtn.on("pointerdown", () => {
            if (!this.allCoinsDistributed()) {
                this.showIncompleteWarning();
                return;
            }
            AudioManager.I.playSfx(this, "click_sound");
            this.recordSharingResponse("yes");

            // Destroy the yes/no coins confirm UI first
            yesBtn.destroy();
            yesShadow.destroy();
            yesText.destroy();
            noBtn.destroy();
            noShadow.destroy();
            noText.destroy();
            this.confirmText?.destroy();

            this.finishSharing();
        });
        /* const noBtn = this.add.text(w * 0.6, h * 0.3, "No", {
            fontSize: "36px",
            color: "#ffffff",
            backgroundColor: "#8B0000",
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true }); */


        const noShadow = this.add.graphics();
        noShadow.fillStyle(0x000000, 0.3);
        noShadow.fillRoundedRect(HALF_WIDTH + 30, HEIGHT * 0.25, HALF_WIDTH / 3.5, 90, 10);
        noShadow.setVisible(false);

        const noBtn = this.add.graphics();
        noBtn.lineStyle(2, 0xffffff, 1);
        noBtn.fillStyle(0x8B0000, 1);
        noBtn.fillRoundedRect(HALF_WIDTH + 20, HEIGHT * 0.25, HALF_WIDTH / 3.5, 90, 10);
        noBtn.strokeRoundedRect(HALF_WIDTH + 20, HEIGHT * 0.25, HALF_WIDTH / 3.5, 90, 10);

        noBtn.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH + 20, HEIGHT * 0.25, HALF_WIDTH / 3.5, 90), Phaser.Geom.Rectangle.Contains);
        const noText = this.add.text(HALF_WIDTH + 155, HEIGHT * 0.29, "No", {
            fontSize: "32px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"


        })
            .setOrigin(0.5);

        noBtn.on('pointerover', () => {
            noShadow.setVisible(true);
            noBtn.setY(-2);
            noText.setY((HEIGHT * 0.29) - 2);
        });

        noBtn.on('pointerout', () => {
            noShadow.setVisible(false);
            noBtn.setY(0);
            noText.setY(HEIGHT * 0.29);
        });

        noBtn.on("pointerdown", () => {
            this.recordSharingResponse("no");
            this.unlockAllCoins();
            this.allowRelock = false;
            AudioManager.I.playSfx(this, "click_sound");
            yesBtn.destroy();
            yesShadow.destroy();
            yesText.destroy();
            noBtn.destroy();
            noShadow.destroy();
            noText.destroy();
            this.confirmText?.destroy();

            this.isConfirmPhase = false;
            this.shareSession++;
            this.shareTurnCounter = 0;
            this.shareActions = [];
        });
    }

    private unlockAllCoins() {
        for (const circle of this.shareCircles) {
            (circle as any).locked = false;
            this.input.setDraggable(circle, true);
        }
    }

    private showIncompleteWarning() {
        const w = this.scale.width;
        const h = this.scale.height;

        const warning = this.add.text(
            w * 0.5,
            h * 0.4,
            "Please place all coins into boxes!",
            {
                fontSize: "28px",
                color: "#ffffff",
                backgroundColor: "#8B0000",
                fontFamily: "Jengle_Jungallery",
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            warning.destroy();
        });
    }



    private finishSharing() {
        const w = this.scale.width;
        const h = this.scale.height;
        const objs = this.newGamePopupObjects;

        // Dim overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.5);
        overlay.fillRect(0, 0, w, h);
        objs.push(overlay);

        // Panel
        const panel = this.add.graphics();
        panel.lineStyle(2, 0xffffff, 1);
        panel.fillStyle(0x222222, 1);
        panel.fillRoundedRect(w * 0.3, h * 0.3, w * 0.4, h * 0.4, 10);
        panel.strokeRoundedRect(w * 0.3, h * 0.3, w * 0.4, h * 0.4, 10);
        objs.push(panel);

        // Question text
        const question = this.add.text(w * 0.5, h * 0.42,
            "Start a new game\nwith the same player?",
            {
                fontSize: "32px",
                color: "#ffffff",
                fontFamily: "Jengle_Jungallery",
                align: "center"
            }
        ).setOrigin(0.5);
        objs.push(question);

        // ── Yes button (green) ──
        const yesShadow = this.add.graphics();
        yesShadow.fillStyle(0x000000, 0.3);
        yesShadow.fillRoundedRect(w * 0.33, h * 0.58, w * 0.15, 70, 10);
        yesShadow.setVisible(false);
        objs.push(yesShadow);

        const yesBtn = this.add.graphics();
        yesBtn.lineStyle(2, 0xffffff, 1);
        yesBtn.fillStyle(0x2f5d50, 1);
        yesBtn.fillRoundedRect(w * 0.32, h * 0.58, w * 0.15, 70, 10);
        yesBtn.strokeRoundedRect(w * 0.32, h * 0.58, w * 0.15, 70, 10);
        yesBtn.setInteractive(
            new Phaser.Geom.Rectangle(w * 0.32, h * 0.58, w * 0.15, 70),
            Phaser.Geom.Rectangle.Contains
        );
        objs.push(yesBtn);

        const yesText = this.add.text(w * 0.395, h * 0.615, "Yes", {
            fontSize: "32px",
            color: "#ffffff",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);
        objs.push(yesText);

        yesBtn.on("pointerover", () => { yesShadow.setVisible(true); yesBtn.setY(-2); yesText.setY(h * 0.615 - 2); });
        yesBtn.on("pointerout", () => { yesShadow.setVisible(false); yesBtn.setY(0); yesText.setY(h * 0.615); });

        yesBtn.on("pointerdown", () => {
            AudioManager.I.playSfx(this, "click_sound");
            // Pass existing player data straight into SettingsScene
            this.scene.start("SettingsScreen", {
                playerData: {
                    playerId: this.playerData?.playerId ?? "",
                    age: this.playerData?.age ?? "",
                    location: this.playerData?.location ?? "",
                }
            });
        });

        // ── No button (red) ──
        const noShadow = this.add.graphics();
        noShadow.fillStyle(0x000000, 0.3);
        noShadow.fillRoundedRect(w * 0.54, h * 0.58, w * 0.15, 70, 10);
        noShadow.setVisible(false);
        objs.push(noShadow);

        const noBtn = this.add.graphics();
        noBtn.lineStyle(2, 0xffffff, 1);
        noBtn.fillStyle(0x8B0000, 1);
        noBtn.fillRoundedRect(w * 0.53, h * 0.58, w * 0.15, 70, 10);
        noBtn.strokeRoundedRect(w * 0.53, h * 0.58, w * 0.15, 70, 10);
        noBtn.setInteractive(
            new Phaser.Geom.Rectangle(w * 0.53, h * 0.58, w * 0.15, 70),
            Phaser.Geom.Rectangle.Contains
        );
        objs.push(noBtn);

        const noText = this.add.text(w * 0.605, h * 0.615, "No", {
            fontSize: "32px",
            color: "#ffffff",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);
        objs.push(noText);

        noBtn.on("pointerover", () => { noShadow.setVisible(true); noBtn.setY(-2); noText.setY(h * 0.615 - 2); });
        noBtn.on("pointerout", () => { noShadow.setVisible(false); noBtn.setY(0); noText.setY(h * 0.615); });

        noBtn.on("pointerdown", () => {
            AudioManager.I.playSfx(this, "click_sound");
            this.scene.start("MainMenu");
        });
    }
    private recordSharingResponse(response: "yes" | "no"): void {
        this.sharingResponses.push({
            session: this.shareSession,
            response: response,
            actions: [...this.shareActions],
            coinsSharedToPlayer: this.playerSharedToSelf,
            coinsSharedToNPC: this.playerSharedToNpc,
            recordedAt: new Date().toLocaleString("sv-SE", {
                timeZone: "Pacific/Auckland",
                hour12: false
            })
        });

        this.saveLevelResult();
    }
}
