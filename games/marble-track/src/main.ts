import "./scenes/timer/TimerPatch.ts";
import { Level1Intro } from "./scenes/Level1Intro.ts";
import { Level2Intro } from "./scenes/Level2Intro.ts";
import { Level3Intro } from "./scenes/Level3Intro.ts";
import { Level0 } from "./scenes/Level0.ts";
import { Level1 } from "./scenes/Level1.ts";
import { Level2 } from "./scenes/Level2.ts";
import { Level3 } from "./scenes/Level3.ts";
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
  //scene: [MainMenu, Level0, Level1Intro,Level1,Level2Intro,Level2,Level3Intro,Level3, GameOver],
  scene: [
    MainMenu,
    UIScene,
    MarbleTrackScene,
    Level0,
    Level1Intro,
    Level1,
    Level2Intro,
    Level2,
    Level3Intro,
    Level3,
    GameOver,
  ],
};

const game = new Game(config);
(window as any).game = game;
export default game;
