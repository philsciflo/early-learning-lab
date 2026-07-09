import 'phaser';
import {
  HALF_WIDTH,
  HEIGHT,
  HALF_HEIGHT,
} from "../constants";
import { AudioManager } from "../AudioManager";
export default class PauseScene extends Phaser.Scene {
    private parentSceneKey!: string;
    constructor() {
            super("PauseScene");
        }
    
    init(data: { fromScene: string }) {
        this.parentSceneKey = data.fromScene;
    }
    preload(){
        this.load.html("slider_continuous", "assets/html_slider_continuous.html");
    }
    create(){
        const w = this.scale.width;
        const h = this.scale.height;
        this.add.graphics()
            .fillStyle(0x000000, 0.5)
            .fillRect(0, 0, this.scale.width, this.scale.height);
            

        const panel = this.add.graphics();
              panel.lineStyle(2, 0xffffff, 1);
              panel.fillStyle(0x222222, 1);
              panel.fillRoundedRect(w * 0.365, h * 0.25, 520, 540, 10);
              panel.strokeRoundedRect(w * 0.365, h * 0.25, 520, 540, 10);
        

        const title = this.add.text(w * 0.5, h * 0.38, "Paused", {
            fontSize: "56px",
            color: "#ffffff",
            fontStyle: "bold",
            fontFamily: "Jengle_Jungallery"
        }).setOrigin(0.5).setDepth(2001);

        const resumeShadow = this.add.graphics();
        resumeShadow.fillStyle(0x000000, 0.3);
        resumeShadow.fillRoundedRect(HALF_WIDTH + 40, HEIGHT * 0.66, HALF_WIDTH/5, 80, 10);
        resumeShadow.setVisible(false);
    
        const resumeButton = this.add.graphics();
            resumeButton.lineStyle(2, 0xffffff, 1);
            resumeButton.fillStyle(0x2f5d50, 1);
            resumeButton.fillRoundedRect(HALF_WIDTH + 30, HEIGHT * 0.66, HALF_WIDTH/5, 80, 10);
            resumeButton.strokeRoundedRect(HALF_WIDTH + 30, HEIGHT * 0.66, HALF_WIDTH/5, 80, 10);
        
        resumeButton.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH + 30, HEIGHT * 0.66, HALF_WIDTH/5, 80), Phaser.Geom.Rectangle.Contains);
        const resumeText = this.add.text(HALF_WIDTH + 125, HEIGHT * 0.695, "Resume", {
            fontSize: "32px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"
    
    
        })
            .setOrigin(0.5);
    
        resumeButton.on('pointerover', () => {
                resumeShadow.setVisible(true);
                resumeButton.setY(-2); 
                resumeText.setY((HEIGHT * 0.695) - 2);
            });
        
        resumeButton.on('pointerout', () => {
            resumeShadow.setVisible(false);
            resumeButton.setY(0);
            resumeText.setY(HEIGHT * 0.695);
        });
        /*const resumeButton = this.add.text(w * 0.575 + 5, h * 0.7, "Resume", {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "#2f5d50",
            fontFamily: "Jengle_Jungallery",
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(2001);*/

        /*const homeButton = this.add.text(w * 0.445 + 5, h * 0.7, "Back To Home", {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "#5a2f2f",
            fontFamily: "Jengle_Jungallery",
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(2001);*/

        const homeShadow = this.add.graphics();
        homeShadow.fillStyle(0x000000, 0.3);
        homeShadow.fillRoundedRect(HALF_WIDTH - 220, HEIGHT * 0.66, HALF_WIDTH/4, 80, 10);
        homeShadow.setVisible(false);
    
        const homeButton = this.add.graphics();
            homeButton.lineStyle(2, 0xffffff, 1);
            homeButton.fillStyle(0x5a2f2f, 1);
            homeButton.fillRoundedRect(HALF_WIDTH - 230, HEIGHT * 0.66, HALF_WIDTH/4, 80, 10);
            homeButton.strokeRoundedRect(HALF_WIDTH - 230, HEIGHT * 0.66, HALF_WIDTH/4, 80, 10);
        
        homeButton.setInteractive(new Phaser.Geom.Rectangle(HALF_WIDTH - 230, HEIGHT * 0.66, HALF_WIDTH/4, 80), Phaser.Geom.Rectangle.Contains);
        const homeText = this.add.text(HALF_WIDTH - 110, HEIGHT * 0.695, "Return Home", {
            fontSize: "32px",
            color: "#FFFFFF",
            fontFamily: "Jengle_Jungallery"
    
    
        })
            .setOrigin(0.5);
    
        homeButton.on('pointerover', () => {
                homeShadow.setVisible(true);
                homeButton.setY(-2); 
                homeText.setY((HEIGHT * 0.695) - 2);
            });
        
        homeButton.on('pointerout', () => {
            homeShadow.setVisible(false);
            homeButton.setY(0);
            homeText.setY(HEIGHT * 0.695);
        });

        const bgmTitle = this.add.text(w * 0.395, h * 0.55, "BGM", {
            fontSize: "32px",
            color: "#FFD700",
            fontFamily: "Jengle_Jungallery",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(2001);

        const bgmSlider = this.add.dom(w * 0.5, h * 0.55).createFromCache("slider_continuous");
        bgmSlider.setOrigin(0.5);
        const bgSlider = bgmSlider.node.querySelector("input") as HTMLInputElement;
        if (bgSlider) {
            bgSlider.value = (AudioManager.I.getBgmVolume() * 100).toString();;
        }

        const bgmLabel = this.add.text(w * 0.6 + 5, h * 0.55, `${Math.round(AudioManager.I.getBgmVolume() * 100)}%`, {
            fontSize: "32px",
            color: "#FFD700",
            fontFamily: "Jengle_Jungallery",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(2001);

        if (bgSlider) {
            bgSlider.addEventListener("input", (e) => {
                const vol = parseFloat((e.target as HTMLInputElement).value);
                bgmLabel.setText(`${Math.round(vol)}%`);
                AudioManager.I.setBgmVolume(vol / 100);
            });
        }

        const sfxTitle = this.add.text(w * 0.395, h * 0.6, "SFX", {
            fontSize: "32px",
            color: "#FFD700",
            fontFamily: "Jengle_Jungallery",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(2001);

        const sfxSlider = this.add.dom(w * 0.5, h * 0.6).createFromCache("slider_continuous");
        sfxSlider.setOrigin(0.5);
        const sfSlider = sfxSlider.node.querySelector("input") as HTMLInputElement;
        if (sfSlider) {
            sfSlider.value = (AudioManager.I.getSfxVolume() * 100).toString();;
        }

        const sfxLabel = this.add.text(w * 0.6 + 5, h * 0.6, `${Math.round(AudioManager.I.getSfxVolume() * 100)}%`, {
            fontSize: "32px",
            color: "#FFD700",
            fontFamily: "Jengle_Jungallery",
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(2001);

        if (sfSlider) {
            sfSlider.addEventListener("input", (e) => {
                const vol = parseFloat((e.target as HTMLInputElement).value);
                sfxLabel.setText(`${Math.round(vol)}%`);
                AudioManager.I.setSfxVolume(vol / 100);
            });
        }

        resumeButton.on("pointerdown", () => {
            
            if (this.parentSceneKey) {
                AudioManager.I.playSfx(this, "click_sound");
                this.scene.resume(this.parentSceneKey);
        }
            this.scene.stop();
        });
        homeButton.on("pointerdown", () => {
            if (this.parentSceneKey) {
                AudioManager.I.playSfx(this, "click_sound");
                this.scene.stop(this.parentSceneKey);
        }
            this.time.timeScale = 1;
            this.tweens.resumeAll();
            this.scene.start("MainMenu");
        });

        
    }

}