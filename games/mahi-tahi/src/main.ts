import { HEIGHT, WIDTH } from "./constants";
import Phaser from "phaser";

// import your other scenes
import { MainMenu } from "./scenes/MainMenu.ts";
import { SettingsScene } from "./scenes/SettingsScreen.ts";
import GameScene from "./scenes/game.ts";
import ShareScene from "./scenes/share.ts";
import PauseScene from './scenes/PauseScene.ts';
import AlertScene from './scenes/AlertScene.ts';

// this is for the games configuration

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: WIDTH,
  height: HEIGHT,
  parent: "game-container",
  backgroundColor: "#927d57",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080
  },
  input: {
    activePointers: 3,
    touch: {
      capture: true
    }
  },
  render: {
      antialias: false,
      pixelArt: false,
      powerPreference: "high-performance"
  },
  fps: {
      target: 30,              
      forceSetTimeOut: false
  },
  dom: {
    createContainer: true,
  },
  scene: [MainMenu, SettingsScene, GameScene, ShareScene, PauseScene, AlertScene],
};


async function loadFont() {
    const fontData = await fetch("assets/font/Jengle_Jungallery.ttf").then(res => res.arrayBuffer());
    const fontFace = new FontFace("Jengle_Jungallery", fontData);
    await fontFace.load();
    (document as any).fonts.add(fontFace);
}


// creates the games instance, this is what starts everything
loadFont().then(() => {
    const game = new Phaser.Game(config);
});