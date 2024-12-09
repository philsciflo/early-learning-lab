import { Level1PlayerA } from "./scenes/Level1PlayerA.ts";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";

import { Game, Types } from "phaser";
import { HEIGHT, WIDTH } from "./constants.ts";
import { Level1PlayerB } from "./scenes/Level1PlayerB.ts";
import { Level2 } from "./scenes/Level2.ts";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true, // Allow inclusion of HTML
  },
  scene: [MainMenu, Level1PlayerA, Level1PlayerB, Level2, GameOver],
};

export default new Game(config);
