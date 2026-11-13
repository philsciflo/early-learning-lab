import { GameOver } from "./scenes/GameOver.ts";
import { MainMenu } from "./scenes/MainMenu.ts";
import { Level1 } from "./scenes/Level1.ts";

import { HEIGHT, WIDTH, MENU_BACKGROUND_COLOUR } from "./constants.ts";
import { Game, Types } from "phaser";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: MENU_BACKGROUND_COLOUR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true, // required for the login screen's HTML inputs
  },
  // MainMenu -> Level1 -> GameOver. Later stages insert Level2/Level3
  // between Level1 and GameOver; Level1 is written so that only its
  // Continue button's target needs to change, not this list's order.
  scene: [MainMenu, Level1, GameOver],
};

export default new Game(config);
