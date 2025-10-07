import { Level1 } from "./scenes/Level1.ts";
import { Level2 } from "./scenes/Level2.ts";
import { Level3 } from "./scenes/Level3.ts";
import { Level4 } from "./scenes/Level4.ts";
import { GameOver } from "./scenes/GameOver.ts";
import { MainMenu } from "./scenes/MainMenu.ts";

import { Game, Types } from "phaser";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1200,
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true, // Allow inclusion of HTML
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [MainMenu, Level1, Level2, Level3, Level4, GameOver],
};

export default new Game(config);
