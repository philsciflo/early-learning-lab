import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";

import { Game, Types } from "phaser";
import { HEIGHT, ORANGE_STRING, WIDTH } from "./constants.ts";
import { Level0 } from "./scenes/Level0.ts";
import { Level1 } from "./scenes/Level1.ts";
import { Level2 } from "./scenes/Level2.ts";
import { Level3 } from "./scenes/Level3.ts";
import { Level4 } from "./scenes/Level4.ts";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: ORANGE_STRING,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        x: 0,
        y: 60,
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
  scene: [MainMenu, Level0, Level1, Level2, Level3, Level4, GameOver],
};

export default new Game(config);
