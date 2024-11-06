import { Scene, GameObjects } from 'phaser';
import {HALF_WIDTH} from "../constants.ts";

export class MainMenu extends Scene
{
    prompt: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.prompt = this.add.text(HALF_WIDTH, 460, 'Play: \r "Apple Catcher"', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
