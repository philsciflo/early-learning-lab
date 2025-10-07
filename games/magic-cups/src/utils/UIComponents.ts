import { Scene, GameObjects } from "phaser";

export class UIButton {
  // create a button with click scale effect

  static createButton(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    callback: () => void,
  ) {
    const button = scene.add
      .text(x, y, text, {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#0077ff",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setOrigin(0.5)
      .setInteractive();

    button.on("pointerdown", () => {
      button.setScale(0.9); // shrink on click
    });

    button.on("pointerup", () => {
      button.setScale(1); // restore scale
      callback();
    });

    return button;
  }
}

//this is the one used in fix-it
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
