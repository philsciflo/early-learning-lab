import { GameOver } from "./scenes/GameOver.ts";
import { MainMenu } from "./scenes/MainMenu.ts";
import { Level0 } from "./scenes/Level0.ts";
import { Level1 } from "./scenes/Level1.ts";
import { Level2 } from "./scenes/Level2.ts";
import { Level3 } from "./scenes/Level3.ts";
import { Level4 } from "./scenes/Level4.ts";

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
  dom: {
    createContainer: true, // required for the login screen's HTML inputs
  },
  scene: [MainMenu, Level0, Level1, Level2, Level3, Level4, GameOver],
};

export default new Game(config);
