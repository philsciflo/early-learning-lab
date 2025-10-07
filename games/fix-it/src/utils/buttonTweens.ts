import { Scene, GameObjects } from "phaser";

type ScalableGameObject = GameObjects.GameObject & {
  scale: number;
  setInteractive: (opts?: any) => this;
};

export function addButtonTweens(
  scene: Scene,
  button: ScalableGameObject,
  onClick: () => void,
  soundKey?: string,
) {
  const baseScale = button.scale;

  button
    .on("pointerover", () => {
      scene.tweens.add({
        targets: button,
        scale: baseScale * 1.1,
        duration: 150,
        ease: "Power2",
      });
    })
    .on("pointerout", () => {
      scene.tweens.add({
        targets: button,
        scale: baseScale,
        duration: 150,
        ease: "Power2",
      });
    })
    .on("pointerdown", () => {
      scene.tweens.add({
        targets: button,
        scale: baseScale * 0.9,
        duration: 100,
        ease: "Power2",
      });
      if (soundKey) scene.sound.play(soundKey);
    })
    .on("pointerup", () => {
      scene.tweens.add({
        targets: button,
        scale: baseScale * 1.1,
        duration: 100,
        ease: "Power2",
        onComplete: () => onClick(),
      });
    });
}
