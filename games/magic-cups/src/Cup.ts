import Phaser from "phaser";

export class Cup extends Phaser.GameObjects.Container {
  private leftWall: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private rightWall: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private bottom: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private sprite: Phaser.Physics.Arcade.Image;
  public width = 140;
  public height = 150;
  public colour: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    coloursPresent: Set<number>,
  ) {
    super(scene, x, y);
    do {
      this.colour = Math.floor(Math.random() * 5) + 1;
    } while (coloursPresent.has(this.colour));
    const texture = "cup" + this.colour;
    // Add a visible sprite for the cup art
    this.sprite = scene.physics.add.image(0, 0, texture).setScale(0.25, 0.25);
    this.sprite.body.allowGravity = false;
    this.add(this.sprite);

    // Invisible physics walls
    const thickness = 10;

    // Left wall
    this.leftWall = scene.physics.add
      .image(-this.width / 2, 0, "")
      .setVisible(false);
    this.leftWall.displayWidth = thickness;
    this.leftWall.displayHeight = this.height;

    // Right wall
    this.rightWall = scene.physics.add
      .image(this.width / 2, 0, "")
      .setVisible(false);
    this.rightWall.displayWidth = thickness;
    this.rightWall.displayHeight = this.height;

    // Bottom
    this.bottom = scene.physics.add
      .image(0, this.height / 2, "")
      .setVisible(false);
    this.bottom.displayWidth = this.width;
    this.bottom.displayHeight = thickness;

    // Make them kinematic (not affected by gravity, but still collidable)
    [this.leftWall, this.rightWall, this.bottom].forEach((wall) => {
      wall.body.setImmovable(true);
      wall.body.allowGravity = false;
    });

    // Add walls to container (so they rotate with it)
    this.add(this.leftWall);
    this.add(this.rightWall);
    this.add(this.bottom);

    scene.add.existing(this);
  }

  /** Enable collision with other physics objects (like candy) */
  addColliders(
    targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  ) {
    const scene = this.scene as Phaser.Scene & {
      physics: Phaser.Physics.Arcade.ArcadePhysics;
    };
    scene.physics.add.collider(targets, [
      this.leftWall,
      this.rightWall,
      this.bottom,
    ]);
  }

  setVelocity(x: number, y: number) {
    this.leftWall.setVelocity(x, y);
    this.rightWall.setVelocity(x, y);
    this.bottom.setVelocity(x, y);
    this.sprite.setVelocity(x, y);
  }

  setAngularVelocity(angle: number) {
    // this.leftWall.setAngularVelocity(angle);
    // this.rightWall.setAngularVelocity(angle);
    // this.bottom.setAngularVelocity(angle);
    this.sprite.setAngularVelocity(angle);
  }

  drop() {
    this.bottom.disableBody(true, true);
    setTimeout(() => {
      this.bottom.enableBody(false, this.bottom.x, this.bottom.y, true);
    }, 250);
  }

  /** Tip the cup over */
  tipOver() {
    this.scene.tweens.add({
      targets: this,
      angle: 180, // rotate container
      duration: 2000,
      ease: "Linear",

      onComplete: () => {
        // hide the bottom physics wall
        this.bottom.disableBody(true, true);
      },
    });
    this.scene.tweens.add({
      delay: 2000,
      targets: this,
      angle: 0, // rotate container
      duration: 1000,
      ease: "Linear",

      onComplete: () => {
        // hide the bottom physics wall
        this.bottom.enableBody(false, this.bottom.x, this.bottom.y, true);
      },
    });
  }
}
