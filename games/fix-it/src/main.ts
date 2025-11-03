import { HEIGHT, WIDTH} from "./constants";
import Phaser from "phaser";
import { Level1 } from "./scenes/Level1";
import { Level1Drop } from "./scenes/Level1Drop";
import { Level2 } from "./scenes/Level2";
import { Level2Drop } from "./scenes/Level2Drop";
import { Level3 } from "./scenes/Level3";
import { Level3Drop } from "./scenes/Level3Drop";
import { Level4 } from "./scenes/Level4";
import { Level4Drop } from "./scenes/Level4Drop";
import { Level5 } from "./scenes/Level5";
import { Level5Drop } from "./scenes/Level5Drop";
import { Level6 } from "./scenes/Level6";
import { Level6Drop } from "./scenes/Level6Drop";
import LevelSelectScene from "./scenes/LevelSelectScene";

import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import  UIScene from "./scenes/UIScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: "#9BC1BC",
  scale: {
    mode: Phaser.Scale.FIT,  
    autoCenter: Phaser.Scale.CENTER_BOTH, 
  },
  dom: {
    createContainer: true, // Allow inclusion of HTML
  },
  physics: {
    default: "matter",
    matter: {
      gravity: { y: 1 },
      debug: false,
    },
  },
  scene: [MainMenu, UIScene, LevelSelectScene, Level1Drop, Level1, Level2Drop, Level2, Level3Drop, Level3, Level4Drop, Level4, Level5Drop, Level5, Level6Drop, Level6, GameOver], 
};

const game = new Phaser.Game(config);