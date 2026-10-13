import { GameOver } from "./scenes/GameOver.ts";
import { MainMenu } from "./scenes/MainMenu.ts";
import { Level1 } from "./scenes/Level1.ts";

import { HEIGHT, WIDTH } from "./constants.ts";
import { Game, Types } from "phaser";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: "#9fd8ff",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenu, Level1, GameOver],
};

export default new Game(config);
