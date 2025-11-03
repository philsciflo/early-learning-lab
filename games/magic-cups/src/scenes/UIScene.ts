import Phaser from "phaser";
import { AudioManager } from "../AudioManager";
import { HEIGHT, WIDTH } from "../constants";

export default class UIScene extends Phaser.Scene {
  private transitionOverlay!: Phaser.GameObjects.DOMElement;
  private isTransitioning: boolean = false;

  constructor() {
    super({ key: "UIScene" });
  }

  preload() {
    this.load.audio("bgm", "assets/bgm.mp3");
    this.load.image("icon-music-on", "assets/icon-music-on.png");
    this.load.image("icon-music-off", "assets/icon-music-off.png");

    // HTML assets
    this.load.html("transition_animation", "assets/transition_animation.html");
    this.load.html("settings_panel", "assets/settings_panel.html");
  }

  create(): void {
    // --- Transition Overlay ---
    this.transitionOverlay = this.add.dom(0, 0)
      .createFromCache("transition_animation")
      .setOrigin(0, 0)
      .setDepth(1000)
      .setVisible(false);

    this.updateOverlaySize();
    this.scale.on('resize', this.updateOverlaySize, this);

    // --- Play BGM ---
    AudioManager.I.playBgm(this, "bgm");

    // --- Settings Panel DOM ---
    const settingsPanel = this.add.dom(0, 0)
      .createFromCache("settings_panel")
      .setOrigin(0, 0)
      .setDepth(1000)
      .setVisible(false);

    const settingsPanelEl = settingsPanel.node as HTMLElement;
    settingsPanelEl.style.left = `${WIDTH / 2 - 220}px`;
    settingsPanelEl.style.top = `${HEIGHT / 2 - 100}px`;
    settingsPanelEl.style.width = '400px';
    settingsPanelEl.style.height = '350px';

    settingsPanelEl.style.pointerEvents = 'none';

    const bgmSlider = settingsPanel.getChildByID('bgmSlider') as HTMLInputElement;
    const sfxSlider = settingsPanel.getChildByID('sfxSlider') as HTMLInputElement;
    const bgmMute = settingsPanel.getChildByID('bgmMute') as HTMLImageElement;
    const sfxMute = settingsPanel.getChildByID('sfxMute') as HTMLImageElement;
    const closeBtn = settingsPanel.getChildByID('closeBtn') as HTMLImageElement;

    // --- Settings Button DOM ---
    const settingsBtn = this.add.dom(WIDTH - 80, 30)
      .createFromHTML('<img id="settingsBtn" src="assets/icon-settings.png" style="width:60px;height:60px;cursor:pointer;" draggable="false">')
      .setOrigin(0, 0)
      .setDepth(999)
      .setInteractive({ useHandCursor: true }); 

    const settingsImg = settingsBtn.node.querySelector('#settingsBtn') as HTMLImageElement;

    settingsImg.onclick = () => {
      // Toggle panel
      const isVisible = settingsPanel.visible;
      
      if (isVisible) {
        //close
        settingsPanel.setVisible(false);
        (settingsPanel.node as HTMLElement).style.pointerEvents = 'none';
      } else {
        //open
        settingsPanel.setVisible(true);
        (settingsPanel.node as HTMLElement).style.pointerEvents = 'auto';

        // Sync sliders
        bgmSlider.value = (AudioManager.I.getBgmVolume() * 100).toString();
        sfxSlider.value = (AudioManager.I.getSfxVolume() * 100).toString();
        bgmMute.src = AudioManager.I.getBgmVolume() > 0 ? 'assets/icon-music-on.png' : 'assets/icon-music-off.png';
        sfxMute.src = AudioManager.I.getSfxVolume() > 0 ? 'assets/icon-music-on.png' : 'assets/icon-music-off.png';
      }
    };

    // --- Close Panel ---
    closeBtn.onclick = () => {
      settingsPanel.setVisible(false);
      (settingsPanel.node as HTMLElement).style.pointerEvents = 'none';
    };

    // --- BGM Slider ---
    bgmSlider.oninput = () => {
      const vol = parseInt(bgmSlider.value) / 100;
      AudioManager.I.setBgmVolume(vol);
      bgmMute.src = vol > 0 ? 'assets/icon-music-on.png' : 'assets/icon-music-off.png';
    };

    // --- SFX Slider ---
    sfxSlider.oninput = () => {
      const vol = parseInt(sfxSlider.value) / 100;
      AudioManager.I.setSfxVolume(vol);
      sfxMute.src = vol > 0 ? 'assets/icon-music-on.png' : 'assets/icon-music-off.png';
    };

    // --- Mute Buttons ---
    bgmMute.onclick = () => {
      if (AudioManager.I.getBgmVolume() > 0) {
        
        const previousVolume = AudioManager.I.getBgmVolume();
        AudioManager.I.setBgmVolume(0);
        bgmSlider.value = '0';
        bgmMute.src = 'assets/icon-music-off.png';
        (bgmMute as any).previousVolume = previousVolume;
      } else {
        const previousVolume = (bgmMute as any).previousVolume || 0.5;
        AudioManager.I.setBgmVolume(previousVolume);
        bgmSlider.value = (previousVolume * 100).toString();
        bgmMute.src = 'assets/icon-music-on.png';
      }
    };

    sfxMute.onclick = () => {
      if (AudioManager.I.getSfxVolume() > 0) {
        const previousVolume = AudioManager.I.getSfxVolume();
        AudioManager.I.setSfxVolume(0);
        sfxSlider.value = '0';
        sfxMute.src = 'assets/icon-music-off.png';
        (sfxMute as any).previousVolume = previousVolume;
      } else {
        const previousVolume = (sfxMute as any).previousVolume || 0.5;
        AudioManager.I.setSfxVolume(previousVolume);
        sfxSlider.value = (previousVolume * 100).toString();
        sfxMute.src = 'assets/icon-music-on.png';
      }
    };
  }

  // --- Transition functions ---
  public playTransitionAnimation(nextSceneName: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.isTransitioning) {
        resolve();
        return;
      }
      this.isTransitioning = true;
      const overlayElement = this.transitionOverlay.node as HTMLElement;
      const transitionText = overlayElement.querySelector('#transitionText') as HTMLElement;
      transitionText.textContent = message;
      this.transitionOverlay.setVisible(true);

      this.time.delayedCall(100, () => {
        overlayElement.classList.remove('curtain-open');
        overlayElement.classList.add('curtain-close');

        this.time.delayedCall(400, () => transitionText.classList.add('show-text'));

        this.time.delayedCall(500, () => {
          resolve();
          this.time.delayedCall(500, () => this.openCurtains());
        });
      });
    });
  }

  private openCurtains(): void {
    const overlayElement = this.transitionOverlay.node as HTMLElement;
    const transitionText = overlayElement.querySelector('#transitionText') as HTMLElement;
    transitionText.classList.remove('show-text');
    overlayElement.classList.remove('curtain-close');
    overlayElement.classList.add('curtain-open');

    this.time.delayedCall(500, () => {
      this.transitionOverlay.setVisible(false);
      this.isTransitioning = false;
    });
  }

  private updateOverlaySize(): void {
    if (this.transitionOverlay) {
      const overlayElement = this.transitionOverlay.node as HTMLElement;
      overlayElement.style.width = `${this.scale.width}px`;
      overlayElement.style.height = `${this.scale.height}px`;
    }
  }
}
