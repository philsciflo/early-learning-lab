import Phaser from "phaser";

export class AudioManager {
  private static _instance: AudioManager;
  private bgm?: Phaser.Sound.BaseSound;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.5;

  private constructor() {}

  public static get I(): AudioManager {
    if (!this._instance) {
      this._instance = new AudioManager();
    }
    return this._instance;
  }

  // --- BGM ---
  public playBgm(scene: Phaser.Scene, key: string) {
    if (!this.bgm) {
      this.bgm = scene.sound.add(key, {
        loop: true,
        volume: this.bgmVolume,
      });
      this.bgm.play();
    }
  }

  public setBgmVolume(value: number) {
    this.bgmVolume = Phaser.Math.Clamp(value, 0, 1);
    if (this.bgm) {
      this.bgm.setVolume(this.bgmVolume);
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  // --- SFX ---
  public playSfx(scene: Phaser.Scene, key: string) {
    const sfx = scene.sound.add(key, { volume: this.sfxVolume });
    sfx.play();
  }

  public setSfxVolume(value: number) {
    this.sfxVolume = Phaser.Math.Clamp(value, 0, 1);
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }
}
