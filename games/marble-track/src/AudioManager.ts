// games/marble-track/src/AudioManager.ts
import Phaser from "phaser";

/**
 * Singleton that owns ALL global sounds (especially the looping BGM).
 * Sounds created via game.sound survive scene switches.
 */
export class AudioManager {
  private static _instance: AudioManager;
  private bgm?: Phaser.Sound.BaseSound;

  private constructor(private readonly game: Phaser.Game) {}

  /** Call once (e.g. in MainMenu) to create the singleton */
  static init(game: Phaser.Game): AudioManager {
    if (!this._instance) this._instance = new AudioManager(game);
    return this._instance;
  }

  /** Quick accessor after init() */
  static get I(): AudioManager {
    if (!this._instance) throw new Error("AudioManager not initialised");
    return this._instance;
  }

  /** Start background music once and keep it looping */
  playBgm(key = "bgm", config: Phaser.Types.Sound.SoundConfig = {}): void {
    if (this.bgm?.isPlaying) return; // already running – do nothing
    this.bgm = this.game.sound.add(key, {
      loop: true,
      volume: 0.1,
      ...config,
    });
    this.bgm.play();
  }

  /** Stop & destroy the bgm (e.g. if you need silence on credits scene) */
  stopBgm(): void {
    this.bgm?.stop();
    this.bgm?.destroy();
    this.bgm = undefined;
  }

  /** Pause BGM without destroying, so we can resume later */
  pauseBgm(): void {
    this.bgm?.pause();
  }

  /** Resume BGM; if instance missing, create & play again */
  resumeBgm(): void {
    if (this.bgm) {
      this.bgm.resume();
    } else {
      this.playBgm(); // fallback
    }
  }

  /** Check if BGM is currently playing */
  isBgmPlaying(): boolean {
    return !!this.bgm && this.bgm.isPlaying;
  }

  /** Toggle play / pause. */
  toggleBgm(): void {
    if (this.isBgmPlaying()) {
      this.pauseBgm();
    } else {
      this.resumeBgm();
    }
  }
}

export default AudioManager; // default export -- matches `import AudioManager from "...";`
