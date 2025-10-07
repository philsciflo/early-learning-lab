import { Level1 } from "./scenes/Level1.ts";
import { GameOver } from "./scenes/GameOver.ts";
import { MainMenu } from "./scenes/MainMenu.ts";
import { Game, Types } from "phaser";
import { LevelSelect } from "./scenes/LevelSelect.ts";
import { Level2 } from "./scenes/Level2.ts";
import { Level3 } from "./scenes/Level3.ts";
import { Level4 } from "./scenes/Level4.ts";
import { Level5 } from "./scenes/Level5.ts";
import { Level6 } from "./scenes/Level6.ts";
import { Level7 } from "./scenes/Level7.ts";
import { Level8 } from "./scenes/Level8.ts";
import { Level9 } from "./scenes/Level9.ts";
import { Level10 } from "./scenes/Level10.ts";
import { Level11 } from "./scenes/Level11.ts";
import { Level12 } from "./scenes/Level12.ts";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1200,
  parent: "game-container",
  backgroundColor: "#6ABFC1",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true, // Allow inclusion of HTML
  },
  scene: [
    MainMenu,
    Level1,
    Level2,
    Level3,
    Level4,
    Level5,
    Level6,
    Level7,
    Level8,
    Level9,
    Level10,
    Level11,
    Level12,
    LevelSelect,
    GameOver,
  ],
  physics: {
    default: "matter",
    matter: {
      gravity: { x: 0, y: 3 },
      debug: false,
    },
  },
};

export default new Game(config);
