import { Scene } from "phaser";
import { renderBanner } from "../banner.ts";
import {
    HALF_WIDTH,
    HEIGHT,
    HALF_HEIGHT,
} from "../constants";

type PlayerData = {
    playerId: string;
    age: string;
    location: string;
};

type GameCustomSettings = {
    totalCoins: number;
    npcSuccessChance: number;
    rows: number;
    cols: number;
    startingPlayer: "player" | "npc";
};
import { AudioManager } from "../AudioManager";

// This is the Settings Page Scene
export class SettingsScene extends Scene {
    private playerData?: PlayerData;
    private totalCoinsInput!: Phaser.GameObjects.DOMElement;
    private rowsInput!: Phaser.GameObjects.DOMElement;
    private colsInput!: Phaser.GameObjects.DOMElement;
    private chanceSlider!: Phaser.GameObjects.DOMElement;
    private chanceLabel!: Phaser.GameObjects.Text;
    private readonly SETTINGS_KEY = "gameCustomSettings";
    private startingPlayer: "player" | "npc" = "player";


    constructor() {
        super("SettingsScreen");
    }

    init(data: any) {
        if (data && data.playerData) {
            this.playerData = data.playerData;
        } else {
            const raw = localStorage.getItem("playerData");
            if (raw) {
                try {
                    this.playerData = JSON.parse(raw);
                } catch (e) { }
            }
        }
    }

    preload() {
        this.load.html("rows", "assets/html_rows.html");
        this.load.html("columns", "assets/html_columns.html");
        this.load.image("background", "assets/menu_background.jpg");
        this.load.html("number_input", "assets/html_int_input.html");
        this.load.html("slider_continuous", "assets/html_slider_continuous.html");
    }

    protected createBackground() {
        renderBanner(this, {
            x: HALF_WIDTH - 400,
            y: 20,
            height: 120,
            width: 800,
        });

        renderBanner(this, {
            x: HALF_WIDTH - 900,
            y: 155,
            height: 870,
            width: 1800,
        });

        this.add
            .image(0, 0, "background")
            .setScale(1.2)
            .setOrigin(0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(-5);
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Background image
        this.add
            .image(0, 0, "background")
            .setScale(1.2)
            .setOrigin(0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(-5);

        const panel = this.add.graphics();
        panel.lineStyle(2, 0xffffff, 1);
        panel.fillStyle(0x222222, 1);
        panel.fillRoundedRect(w * 0.3, h * 0.08, w * 0.4, h * 0.85, 10);
        panel.strokeRoundedRect(w * 0.3, h * 0.08, w * 0.4, h * 0.85, 10);


        this.add.text(w * 0.5, h * 0.17, "Settings", {
            fontSize: "56px",
            color: "#ffffff",
            fontStyle: "bold",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        const savedSettings = this.loadSettings();
        const defaultTotalCoins = savedSettings?.totalCoins ?? 10;
        const defaultChance = savedSettings?.npcSuccessChance ?? 0.5;
        const defaultRows = savedSettings?.rows ?? 3;
        const defaultCols = savedSettings?.cols ?? 7;
        const defaultStartingPlayer =
            savedSettings?.startingPlayer ?? "player";

        this.startingPlayer = defaultStartingPlayer;

        const addLabel = (label: string, yFrac: number) => {
            this.add.text(w * 0.38, h * yFrac, label, {
                fontSize: "32px",
                color: "#FFD700",
                fontFamily: "Jengle_Jungallery",
                padding: { x: 15, y: 5 }
            }).setOrigin(0.5);
        };

        //coins amount
        addLabel("Total Coins:", 0.30);
        this.totalCoinsInput = this.add.dom(w * 0.55, h * 0.30).createFromCache("number_input");
        this.totalCoinsInput.setOrigin(0.5);
        const coinInput = this.totalCoinsInput.node.querySelector("input") as HTMLInputElement;
        if (coinInput) {
            coinInput.value = defaultTotalCoins.toString();
            coinInput.min = "1";
            coinInput.step = "1";
            coinInput.required = true;
        }


        addLabel("Rows:", 0.40);
        this.rowsInput = this.add.dom(w * 0.55, h * 0.40).createFromCache("rows");
        this.rowsInput.setOrigin(0.5);
        const rowsSelectEl = this.rowsInput.node.querySelector("select") as HTMLSelectElement;
        if (rowsSelectEl) rowsSelectEl.value = defaultRows.toString();
        const rowsInputEl = this.rowsInput.node.querySelector("input") as HTMLInputElement;
        if (rowsInputEl) {
            rowsInputEl.value = defaultRows.toString();
            rowsInputEl.min = "1";
            rowsInputEl.max = "4";
            rowsInputEl.step = "1";
        }

        addLabel("Columns:", 0.50);
        this.colsInput = this.add.dom(w * 0.55, h * 0.50).createFromCache("columns");
        this.colsInput.setOrigin(0.5);
        const colsSelectEl = this.colsInput.node.querySelector("select") as HTMLSelectElement;
        if (colsSelectEl) colsSelectEl.value = defaultCols.toString();
        const colsInputEl = this.colsInput.node.querySelector("input") as HTMLInputElement;
        if (colsInputEl) {
            colsInputEl.value = defaultCols.toString();
            colsInputEl.min = "1";
            colsInputEl.max = "8";
            colsInputEl.step = "1";
        }


        const updateCoinMax = () => {
            const r = parseInt(rowsSelectEl?.value, 10) || 3;
            const c = parseInt(colsSelectEl?.value, 10) || 7;
            const max = r * c - 1;
            coinInput.max = max.toString();
        };
        rowsSelectEl?.addEventListener("change", updateCoinMax);
        colsSelectEl?.addEventListener("change", updateCoinMax);
        updateCoinMax();


        /*this.add.text(HALF_WIDTH - 300, HEIGHT * 0.60, "Card Size:", {
            fontSize: "36px",
            color: "#FFFFFF",
            backgroundColor: "#000000",
            padding: { x: 10, y: 5 },
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        this.cardSizeSlider = this.add.dom(HALF_WIDTH + 150, HEIGHT * 0.60).createFromCache("slider_continuous");
        this.cardSizeSlider.setOrigin(0.5);

        const cardSlider = this.cardSizeSlider.node.querySelector("input") as HTMLInputElement;

        if (cardSlider) {
            cardSlider.value = defaultCardScale.toString();
            cardSlider.min = "0.5";
            cardSlider.max = "1.5";
            cardSlider.step = "0.05";
            cardSlider.value = defaultCardScale.toString();
        }

        this.cardSizeLabel = this.add.text(HALF_WIDTH + 480, HEIGHT * 0.60, `${Math.round(defaultCardScale * 100)}%`, {
            fontSize: "32px",
            color: "#FFD700",
            backgroundColor: "#000000",
            padding: { x: 15, y: 5 },
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        if (cardSlider) {
            cardSlider.addEventListener("input", (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                this.cardSizeLabel.setText(`${Math.round(val * 100)}%`);
            });
        }*/

        // NPC success slider
        addLabel("NPC Chance:", 0.60);
        this.chanceSlider = this.add.dom(w * 0.55, h * 0.60).createFromCache("slider_continuous");
        this.chanceSlider.setOrigin(0.5);
        const slider = this.chanceSlider.node.querySelector("input") as HTMLInputElement;
        if (slider) {
            slider.min = "0";
            slider.max = "1";
            slider.step = "0.01";
            slider.value = defaultChance.toString();
            slider.dispatchEvent(new Event("input"));
        }
        this.chanceLabel = this.add.text(w * 0.655, h * 0.60, `${Math.round(defaultChance * 100)}%`, {
            fontSize: "32px",
            color: "#FFD700",
            fontFamily: "Jengle_Jungallery",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5);
        slider?.addEventListener("input", (e) => {
            const raw = parseFloat((e.target as HTMLInputElement).value);
            const snapPoints = [0, 0.25, 0.5, 0.75, 1.0];
            const threshold = 0.04; // snaps if within 4% of a point

            const nearest = snapPoints.reduce((prev, curr) =>
                Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev
            );

            const val = Math.abs(nearest - raw) <= threshold ? nearest : raw;
            slider.value = val.toString();
            this.chanceLabel.setText(`${Math.round(val * 100)}%`);
        });

        addLabel("First Turn:", 0.70);

        const playerFirstBtn = this.add.text(
            w * 0.50,
            h * 0.70,
            "Player",
            {
                fontSize: "28px",
                color: "#FFFFFF",
                fontFamily: "Jengle_Jungallery",
                backgroundColor: "#444444",
                padding: { x: 15, y: 8 }
            }
        )
            .setOrigin(0.5)
            .setInteractive();

        const npcFirstBtn = this.add.text(
            w * 0.62,
            h * 0.70,
            "NPC",
            {
                fontSize: "28px",
                color: "#FFFFFF",
                fontFamily: "Jengle_Jungallery",
                backgroundColor: "#444444",
                padding: { x: 15, y: 8 }
            }
        )
            .setOrigin(0.5)
            .setInteractive();

        const updateFirstPlayerButtons = () => {
            playerFirstBtn.setBackgroundColor(
                this.startingPlayer === "player"
                    ? "#2f5d50"
                    : "#444444"
            );

            npcFirstBtn.setBackgroundColor(
                this.startingPlayer === "npc"
                    ? "#2f5d50"
                    : "#444444"
            );
        };

        playerFirstBtn.on("pointerdown", () => {
            this.startingPlayer = "player";
            updateFirstPlayerButtons();
        });

        npcFirstBtn.on("pointerdown", () => {
            this.startingPlayer = "npc";
            updateFirstPlayerButtons();
        });

        updateFirstPlayerButtons();

        /*const backButton = this.add.text(HALF_WIDTH - 250, HEIGHT * 0.8, "Back to Menu", {
            fontSize: "42px",
            color: "#FFFFFF",
            backgroundColor: "#000000",
            padding: { x: 20, y: 10 },
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }); */

        /*const backShadow = this.add.graphics();
        backShadow.fillStyle(0x000000, 0.3);
        backShadow.fillRoundedRect(HALF_WIDTH - 840, HEIGHT * 0.16, HALF_WIDTH/3.5, 90, 10);
        backShadow.setVisible(false);

        const backButton = this.add.graphics();
        backButton.lineStyle(2, 0xffffff, 1);
        backButton.fillStyle(0x222222, 1);
        backButton.fillRoundedRect(HALF_WIDTH - 850, HEIGHT * 0.16, HALF_WIDTH/3.5, 90, 10);
        backButton.strokeRoundedRect(HALF_WIDTH - 850, HEIGHT * 0.16, HALF_WIDTH/3.5, 90, 10);
        
        backButton.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH - 850, HEIGHT * 0.16, HALF_WIDTH/3.5, 90), Phaser.Geom.Rectangle.Contains);
        const backText = this.add.text(HALF_WIDTH - 710, HEIGHT * 0.2, "Back to Menu", {
        fontSize: "32px",
        color: "#FFFFFF",
        fontFamily: "Jengle_Jungallery"


        })
        .setOrigin(0.5);

        backButton.on('pointerover', () => {
                backShadow.setVisible(true);
                backButton.setY(-2); 
                backText.setY((HEIGHT * 0.2) - 2);
            });
        
        backButton.on('pointerout', () => {
            backShadow.setVisible(false);
            backButton.setY(0);
            backText.setY(HEIGHT * 0.2);
        });

        backButton.on("pointerdown", () => {
            AudioManager.I.playSfx(this, "click_sound");

            this.scene.start("MainMenu");
        }); */
        this.add.image(this.scale.width * 0.05, this.scale.height * 0.10, "menuButton")
            .setInteractive()
            .on("pointerdown", () => {
                AudioManager.I.playSfx(this, "click_sound");
                this.totalCoinsInput.setVisible(false);
                this.rowsInput.setVisible(false);
                this.colsInput.setVisible(false);
                this.chanceSlider.setVisible(false);
                this.scene.pause();
                this.scene.launch('PauseScene', { fromScene: this.scene.key });
            })
            .setScale(0.25)
            .setDepth(1000);

        this.events.on('resume', () => {
            this.time.delayedCall(20, () => {
                this.totalCoinsInput.setVisible(true);
                this.rowsInput.setVisible(true);
                this.colsInput.setVisible(true);
                this.chanceSlider.setVisible(true);
            });
        });

        /* const startButton = this.add.text(HALF_WIDTH + 250, HEIGHT * 0.8, "Start Game", {
            fontSize: "42px",
            color: "#FFFFFF",
            backgroundColor: "#000000",
            padding: { x: 20, y: 10 },
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });*/

        const startShadow = this.add.graphics();
        startShadow.fillStyle(0x000000, 0.3);
        startShadow.fillRoundedRect(w * 0.365, h * 0.76, w * 0.27, 80, 10);
        startShadow.setVisible(false);

        const startButton = this.add.graphics();
        startButton.lineStyle(2, 0xffffff, 1);
        startButton.fillStyle(0x2f5d50, 1);
        startButton.fillRoundedRect(w * 0.355, h * 0.76, w * 0.27, 80, 10);
        startButton.strokeRoundedRect(w * 0.355, h * 0.76, w * 0.27, 80, 10);
        startButton.setInteractive(
            new Phaser.Geom.Rectangle(w * 0.355, h * 0.76, w * 0.27, 80),
            Phaser.Geom.Rectangle.Contains
        );

        const startText = this.add.text(w * 0.49, h * 0.795, "Start Game", {
            fontSize: "36px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5);

        startButton.on('pointerover', () => {
            startShadow.setVisible(true);
            startButton.setY(-2);
            startText.setY(h * 0.795 - 2);
        });
        startButton.on('pointerout', () => {
            startShadow.setVisible(false);
            startButton.setY(0);
            startText.setY(h * 0.795);
        });

        startButton.on("pointerdown", () => {
            const totalCoins = this.getTotalCoinsValue();
            const npcSuccessChance = this.getSuccessChance();
            const rows = parseInt(rowsSelectEl?.value, 10);
            const cols = parseInt(colsSelectEl?.value, 10);

            const hideDOM = () => {
                this.totalCoinsInput.setVisible(false);
                this.rowsInput.setVisible(false);
                this.colsInput.setVisible(false);
                this.chanceSlider.setVisible(false);
            };

            if (isNaN(rows) || rows < 1 || rows > 4) {
                hideDOM();
                this.scene.pause();
                this.scene.launch('AlertScene', { fromScene: this.scene.key, text: "Rows must be between 1 and 4." });
                return;
            }
            if (isNaN(cols) || cols < 1 || cols > 8) {
                hideDOM();
                this.scene.pause();
                this.scene.launch('AlertScene', { fromScene: this.scene.key, text: "Columns must be between 1 and 8." });
                return;
            }
            if (!coinInput.checkValidity()) { coinInput.reportValidity(); return; }
            if (!rowsSelectEl.checkValidity()) { rowsSelectEl.reportValidity(); return; }
            if (!colsSelectEl.checkValidity()) { colsSelectEl.reportValidity(); return; }

            const safeTotalCoins = Math.min(totalCoins, rows * cols - 1);
            const cardScale = this.computeCardScale(rows, cols);
            const settings: GameCustomSettings = { totalCoins: safeTotalCoins, npcSuccessChance, rows, cols, startingPlayer: this.startingPlayer };
            this.saveSettings(settings);

            let playerData = this.playerData;
            if (!playerData) {
                const raw = localStorage.getItem("playerData");
                if (raw) try { playerData = JSON.parse(raw); } catch (e) { }
            }
            if (!playerData?.playerId) {
                hideDOM();
                this.scene.pause();
                this.scene.launch('AlertScene', { fromScene: this.scene.key, text: "Please fill in your player information on the main menu first." });
                return;
            }

            AudioManager.I.playSfx(this, "click_sound");
            this.scene.start("scene-game-main", {
                ...playerData,
                totalCoins: settings.totalCoins,
                npcSuccessChance: settings.npcSuccessChance,
                rows: settings.rows,
                cols: settings.cols,
                cardScale,
                startingPlayer: this.startingPlayer
            });
        });
    }

    private getTotalCoinsValue(): number {
        const inputEl =
            this.totalCoinsInput.node.querySelector("input") as HTMLInputElement;

        return parseInt(inputEl.value, 10);
    }

    private getSuccessChance(): number {
        const slider = this.chanceSlider.node.querySelector("input") as HTMLInputElement;
        let val = slider ? parseFloat(slider.value) : 0.5;
        if (isNaN(val)) val = 0.5;
        return Math.min(1, Math.max(0, val));
    }

    private loadSettings(): GameCustomSettings | null {
        const raw = localStorage.getItem(this.SETTINGS_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }

    private saveSettings(settings: GameCustomSettings): void {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }



    /*private getCardScaleValue(): number {
        const slider = this.cardSizeSlider.node.querySelector("input") as HTMLInputElement;
        let val = slider ? parseFloat(slider.value) : 1.0;

        if (isNaN(val)) val = 1.0;

        return Math.min(1.5, Math.max(0.5, val));
    }*/

    private computeCardScale(rows: number, cols: number): number {
        // Available area for the board (matches game.ts layout logic)
        const availableWidth = 1920 * .75;   // board uses ~50% of width
        const availableHeight = 1080 * 0.68; // board uses ~55% of height

        const baseCardWidth = 180;
        const baseCardHeight = 210;
        const baseGap = 20;

        const totalBoardWidth = cols * baseCardWidth + (cols - 1) * baseGap;
        const totalBoardHeight = rows * baseCardHeight + (rows - 1) * baseGap;

        const scaleX = availableWidth / totalBoardWidth;
        const scaleY = availableHeight / totalBoardHeight;

        // Use the smaller scale so cards always fit, clamped to a sensible range
        return Math.min(scaleX, scaleY, 1.5);
    }

}