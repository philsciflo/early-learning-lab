import "./timer/TimerPatch.ts";

//import { Level0 } from "./scenes/Level0.ts";
//import { Level1Intro } from "./scenes/Level1Intro.ts";
//import { Level1 } from "./scenes/Level1.ts";
//import { Level2Intro } from "./scenes/Level2Intro.ts";
//import { Level2 } from "./scenes/Level2.ts";
//import { Level3Intro } from "./scenes/Level3Intro.ts";
//import { Level3 } from "./scenes/Level3.ts";
//import { Level4 } from "./scenes/Level4.ts";

import { Level0Test } from "./scenes/NewL0.ts";
import { Level1Intro } from "./scenes/NewL1Intro.ts";
import { Level1 } from "./scenes/NewL1Test.ts";
import { Level2Intro } from "./scenes/NewL2Intro.ts";
import { Level2 } from "./scenes/NewL2Test.ts";
import { Level3Intro } from "./scenes/NewL3Intro.ts";
import { Level3 } from "./scenes/NewL3Test.ts";
import { Level4 } from "./scenes/NewL4Test.ts";

import { GameOver } from "./scenes/GameOver.ts"; //GameOver is for testing, you can switch back to GameOver if you want the original one
import { MainMenu } from "./scenes/MainMenu.ts"; //MainMenu is for testing, you can switch back to MainMenu0 if you want the original one
import { HEIGHT, GREEN_STRING, WIDTH } from "./constants.ts";
import { Game, Types } from "phaser";
import { MarbleTrackScene } from "./scenes/MarblesTrackScene.ts";
import UIScene from "./scenes/UIScene.ts";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: GREEN_STRING,
  physics: {
    default: "matter",
    matter: {
      gravity: {
        x: 0,
        y: 1,
      },
      debug: true,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true, // Allow inclusion of HTML
  },
  //scene: [Level2Intro],
  scene: [
    MainMenu,
    UIScene,
    MarbleTrackScene,
    Level0Test,
    Level1Intro,
    Level1,
    Level2Intro,
    Level2,
    Level3Intro,
    Level3,
    Level4,
    GameOver,
  ],
};

const game = new Game(config);
(window as any).game = game;
export default game;
