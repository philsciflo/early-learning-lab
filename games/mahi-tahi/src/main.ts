import { HEIGHT, WIDTH} from "./constants";
import Phaser from "phaser";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import  UIScene from "./scenes/UIScene";
import { Level1 } from "./scenes/Level1";

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
  scene: [MainMenu, Level1, GameOver], 
};

const game = new Phaser.Game(config);