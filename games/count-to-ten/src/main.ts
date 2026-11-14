import { GameOver } from "./scenes/GameOver.ts";
import { MainMenu } from "./scenes/MainMenu.ts";
import { Level1 } from "./scenes/Level1.ts";
import { Level2 } from "./scenes/Level2.ts";
import { Level3 } from "./scenes/Level3.ts";

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
  // MainMenu -> Level1 -> Level2 -> Level3 -> GameOver.
  scene: [MainMenu, Level1, Level2, Level3, GameOver],
};

/** Phaser renders text straight onto the canvas using whatever font is
 * loaded at that instant - unlike DOM text, a scene's text never
 * re-renders on its own once a web font finishes loading afterwards.
 * Waiting here for the Google Fonts "Fredoka" family (with a short
 * timeout, so a slow or failed font load can't block the game
 * forever) avoids every scene silently falling back to Arial Black on
 * its first render. */
async function waitForFredoka(): Promise<void> {
  const load = Promise.all(
    ["500", "600", "700"].map((weight) =>
      document.fonts.load(`${weight} 32px Fredoka`),
    ),
  ).catch(() => undefined);
  const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
  await Promise.race([load, timeout]);
}

async function start(): Promise<void> {
  await waitForFredoka();
  new Game(config);
}

void start();
