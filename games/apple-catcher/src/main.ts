import {Boot} from './scenes/Boot';
import {Game as MainGame} from './scenes/Game';
import {GameOver} from './scenes/GameOver';
import {MainMenu} from './scenes/MainMenu';
import {Preloader} from './scenes/Preloader';

import {Game, Types} from "phaser";
import {WIDTH} from "./constants.ts";

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#ffa500',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

export default new Game(config);
