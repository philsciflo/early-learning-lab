import 'phaser';
import {
  HALF_WIDTH,
  HEIGHT,
  HALF_HEIGHT,
} from "../constants";
import { AudioManager } from "../AudioManager";
export default class PauseScene extends Phaser.Scene {
    private parentSceneKey!: string;
    private text!: string;
    private choice?: boolean;
    constructor() {
            super("AlertScene");
        }
    
    init(data: { fromScene: string, text: string, choice: boolean} ) {
        this.parentSceneKey = data.fromScene;
        this.text = data?.text;
        this.choice = data?.choice || false;
    }
    create(){
        const w = this.scale.width;
        const h = this.scale.height;
        /*this.add.graphics()
            .fillStyle(0x000000, 0.5)
            .fillRect(0, 0, this.scale.width, this.scale.height);*/
            

        const panel = this.add.graphics();
              panel.lineStyle(2, 0xffffff, 1);
              panel.fillStyle(0x222222, 1);
              panel.fillRoundedRect(w * 0.238, h * 0.335, 1000, 350, 10);
              panel.strokeRoundedRect(w * 0.238, h * 0.335, 1000, 350, 10);
        

        const title = this.add.text(w * 0.5, h * 0.44, this.text, {
            fontSize: "48px",
            color: "#ffffff",
            fontStyle: "bold",
            fontFamily: "Jengle_Jungallery",
            align: 'center',
            wordWrap: { width:  w *0.5}
        }).setOrigin(0.5).setDepth(2001);

        if (!this.choice){
        const resumeShadow = this.add.graphics();
            resumeShadow.fillStyle(0x000000, 0.3);
            resumeShadow.fillRoundedRect(HALF_WIDTH - 110, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
            resumeShadow.setVisible(false);
        
            const resumeButton = this.add.graphics();
                resumeButton.lineStyle(2, 0xffffff, 1);
                resumeButton.fillStyle(0x2f5d50, 1);
                resumeButton.fillRoundedRect(HALF_WIDTH - 120, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
                resumeButton.strokeRoundedRect(HALF_WIDTH - 120, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
            
            resumeButton.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH - 120, HEIGHT * 0.55, HALF_WIDTH/4, 80), Phaser.Geom.Rectangle.Contains);
            const resumeText = this.add.text(HALF_WIDTH, HEIGHT * 0.587, "Okay", {
                fontSize: "40px",
                color: "#FFFFFF",
                fontFamily: "Jengle_Jungallery"
        
        
            })
                .setOrigin(0.5);
        
            resumeButton.on('pointerover', () => {
                    resumeShadow.setVisible(true);
                    resumeButton.setY(-2); 
                    resumeText.setY((HEIGHT * 0.587) - 2);
                });
            
            resumeButton.on('pointerout', () => {
                resumeShadow.setVisible(false);
                resumeButton.setY(0);
                resumeText.setY(HEIGHT * 0.587);
            });

            resumeButton.on("pointerdown", () => {
                
                if (this.parentSceneKey) {
                    AudioManager.I.playSfx(this, "click_sound");
                    this.scene.resume(this.parentSceneKey, {choice: false});
            }
                this.scene.stop();
            });
                
        }
        else {
            const noShadow = this.add.graphics();
        noShadow.fillStyle(0x000000, 0.3);
        noShadow.fillRoundedRect(HALF_WIDTH + 60, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
        noShadow.setVisible(false);
    
        const noButton = this.add.graphics();
            noButton.lineStyle(2, 0xffffff, 1);
            noButton.fillStyle(0x2f5d50, 1);
            noButton.fillRoundedRect(HALF_WIDTH + 50, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
            noButton.strokeRoundedRect(HALF_WIDTH + 50, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
        
        noButton.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH + 50, HEIGHT * 0.55, HALF_WIDTH/4, 80), Phaser.Geom.Rectangle.Contains);
        const noText = this.add.text(HALF_WIDTH + 170, HEIGHT * 0.587, "No", {
            fontSize: "32px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"
    
    
        })
            .setOrigin(0.5);
    
        noButton.on('pointerover', () => {
                noShadow.setVisible(true);
                noButton.setY(-2); 
                noText.setY((HEIGHT * 0.587) - 2);
            });
        
        noButton.on('pointerout', () => {
            noShadow.setVisible(false);
            noButton.setY(0);
            noText.setY(HEIGHT * 0.587);
        });
        noButton.on("pointerdown", () => {
                
                if (this.parentSceneKey) {
                    AudioManager.I.playSfx(this, "click_sound");
                    this.events.emit('alert_result', false);
                    this.scene.resume(this.parentSceneKey);
            }
                this.scene.stop();
            });

        const yesShadow = this.add.graphics();
        yesShadow.fillStyle(0x000000, 0.3);
        yesShadow.fillRoundedRect(HALF_WIDTH - 260, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
        yesShadow.setVisible(false);
    
        const yesButton = this.add.graphics();
            yesButton.lineStyle(2, 0xffffff, 1);
            yesButton.fillStyle(0x5a2f2f, 1);
            yesButton.fillRoundedRect(HALF_WIDTH - 270, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
            yesButton.strokeRoundedRect(HALF_WIDTH - 270, HEIGHT * 0.55, HALF_WIDTH/4, 80, 10);
        
        yesButton.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH - 230, HEIGHT * 0.55, HALF_WIDTH/4, 80), Phaser.Geom.Rectangle.Contains);
        const yesText = this.add.text(HALF_WIDTH - 150, HEIGHT * 0.587, "Yes", {
            fontSize: "32px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"
    
    
        })
            .setOrigin(0.5);
    
        yesButton.on('pointerover', () => {
                yesShadow.setVisible(true);
                yesButton.setY(-2); 
                yesText.setY((HEIGHT * 0.587) - 2);
            });
        
        yesButton.on('pointerout', () => {
            yesShadow.setVisible(false);
            yesButton.setY(0);
            yesText.setY(HEIGHT * 0.587);
        });
        noButton.on("pointerdown", () => {
            
            if (this.parentSceneKey) {
                AudioManager.I.playSfx(this, "click_sound");
                this.events.emit('clear', false);
                this.scene.resume(this.parentSceneKey);
                
                
        }
            this.scene.stop();
        });
        yesButton.on("pointerdown", () => {
                
                if (this.parentSceneKey) {
                    AudioManager.I.playSfx(this, "click_sound");
                    this.events.emit('clear', true);
                    this.scene.resume(this.parentSceneKey);
            }
                this.scene.stop();
            });

        
        
        }
        
        
        


    }

}