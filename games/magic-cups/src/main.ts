import { GameOver } from "./scenes/GameOver.ts";
import { MainMenu } from "./scenes/MainMenu.ts";

import { HEIGHT, WIDTH } from "./constants.ts";
import { Game, Types } from "phaser";

import { Level0 } from "./scenes/Level0.ts";
import { Level1 } from "./scenes/Level1.ts";
import { Level2 } from "./scenes/Level2.ts";
import { Level3 } from "./scenes/Level3.ts";
import UIScene from "./scenes/UIScene.ts";
import { LevelSelect } from "./scenes/LevelSelect.ts";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: "#f6ddb1",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true, // Allow inclusion of HTML
  },
  scene: [MainMenu, Level0, Level1, Level2, Level3, GameOver, UIScene, LevelSelect],
};

export default new Game(config);
