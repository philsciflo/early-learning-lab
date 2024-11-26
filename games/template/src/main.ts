import { Level } from "./scenes/Level.ts";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";

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
  scene: [MainMenu, Level, GameOver],
};

export default new Game(config);
