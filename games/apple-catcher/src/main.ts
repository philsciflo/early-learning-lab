import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { ModeSelection } from "./scenes/ModeSelection.ts";


import { Game, Types } from "phaser";
import { BLACK_STRING, HEIGHT, ORANGE_STRING, WIDTH, BACKGROUND_STRING } from "./constants.ts";
import { Level0 } from "./scenes/Level0.ts";
import { Level1 } from "./scenes/Level1.ts";
import { Level2 } from "./scenes/Level2.ts";
import { Level3 } from "./scenes/Level3.ts";
import { Level4 } from "./scenes/Level4.ts";
import { Level0Drop } from "./scenes/Level0Drop.ts";
import { Level1Drop } from "./scenes/Level1Drop.ts";
import { Level2Drop } from "./scenes/Level2Drop.ts";
import { Level3Drop } from "./scenes/Level3Drop.ts";
import { Level4Drop } from "./scenes/Level4Drop.ts";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: BACKGROUND_STRING,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        x: 0,
        y: 100,
      },
      // debug: true,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true, // Allow inclusion of HTML
  },
  scene: [MainMenu, ModeSelection, Level0, Level1, Level2, Level3, Level4, Level0Drop, Level1Drop, Level2Drop, Level3Drop, Level4Drop, GameOver],
};

export default new Game(config);
