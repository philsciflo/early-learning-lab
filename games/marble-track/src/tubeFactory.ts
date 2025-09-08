import Phaser from "phaser";
import { Body } from "matter-js";
import { gameAreaWidth, gameAreaHeight, gameAreaX, gameAreaY } from "./constants";
import { IDraggableTrackSceneContext } from "./IDraggableTrackSceneContext";

export class TubeFactory {
  static draggableTrackCategory: number = 0;

  static initializeCollisionCategories(scene: Phaser.Scene) {
    if (TubeFactory.draggableTrackCategory === 0) {
      TubeFactory.draggableTrackCategory = scene.matter.world.nextCategory();
    }
  }

  static createTube(
    scene: Phaser.Scene,
    length: number,
    angle: number,
    x: number,
    y: number
  ): Phaser.Physics.Matter.Image {
    const height = 10;
    const offset = 32;

    const top = scene.matter.add.image(x, y - offset, "track")
      .setDisplaySize(length, height)
      .setStatic(true)
      .setVisible(false);

    const bottom = scene.matter.add.image(x, y + offset, "track")
      .setDisplaySize(length, height)
      .setStatic(true)
      .setVisible(false);

    const main = scene.matter.add.image(x, y, "tube")
      .setDisplaySize(length + 10, offset * 2 + 7)
      .setAngle(angle)
      .setDepth(0)
      .setStatic(true);

    main.setSensor(true);
    main.setIgnoreGravity(true);

    const overlay = scene.add.image(x, y, "tube")
      .setDisplaySize(length + 10, offset * 2 + 7)
      .setAlpha(0.5)
      .setDepth(5);

    (main as any).overlay = overlay;
    (main as any).children = [top, bottom];

    (main as any).syncChildren = () => {
      const rad = Phaser.Math.DegToRad(main.angle);
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      const children = (main as any).children as Phaser.Physics.Matter.Image[];
      const offsetsArr = [-offset, offset];

      children.forEach((child, i) => {
        const ox = offsetsArr[i] * -sin;
        const oy = offsetsArr[i] * cos;
        Body.setPosition(child.body as Body, { x: main.x + ox, y: main.y + oy });
        Body.setAngle(child.body as Body, rad);
      });

      if ((main as any).overlay) {
        (main as any).overlay.setPosition(main.x, main.y);
        (main as any).overlay.setAngle(main.angle);
      }
    };

    (main as any).syncChildren();
    return main;
  }

  static createDraggableTrack(
    ctx: IDraggableTrackSceneContext,
    length: number,
    angle: number,
    x: number,
    y: number,
    index: number
  ): Phaser.Physics.Matter.Image {
    TubeFactory.initializeCollisionCategories(ctx.scene);

    const track = TubeFactory.createTube(ctx.scene, length, angle, x, y);
    const skin = (track as any).overlay as Phaser.Physics.Matter.Image;
    const originalAngle = angle;
    let dragInterval: Phaser.Time.TimerEvent;

    track.setCollisionCategory(TubeFactory.draggableTrackCategory);
    track.setCollidesWith(~TubeFactory.draggableTrackCategory);

    skin.setInteractive();
    ctx.scene.input.setDraggable(skin);

    skin.on("dragstart", () => {
      track.setSensor(false);
      ctx.staticTracks.forEach(t => t.setSensor(false));
      
      ctx.allTracks.forEach(t => {
        const children = (t as any).children as Phaser.Physics.Matter.Image[] | undefined;
        if (children) {
          children.forEach(c => {
            if (c) c.setSensor(true);
          });
        }
      });
      
      (track as any).overlay.setVisible(false);

      const startTime = ctx.scene.registry.get(`${ctx.levelKey}-startTime`) || 0;

      if (!ctx.trackPaths) ctx.trackPaths = [];
      ctx.trackPaths.push({
        trackId: `track-${index}`,
        path: [{ x: Math.round(track.x), y: Math.round(track.y), time: 0.0 }]
      });
      ctx.trackPaths[ctx.trackPaths.length - 1].path.push({
        x: Math.round(track.x),
        y: Math.round(track.y),
        time: Date.now() - startTime
      });

      if (!ctx.isAttempted && ctx.triesDataKey) {
        ctx.scene.registry.inc(ctx.triesDataKey, 1);
        ctx.isAttempted = true;
        ctx.scene.registry.set(`${ctx.levelKey}-isAttempted`, true);
      }

      dragInterval = ctx.scene.time.addEvent({
        delay: 500,
        callback: () => {
          ctx.trackPaths![ctx.trackPaths!.length - 1].path.push({
            x: Math.round(track.x),
            y: Math.round(track.y),
            time: Date.now() - startTime
          });
        },
        callbackScope: ctx.scene,
        loop: true
      });
    });

    skin.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      track.setStatic(false);
      track.setCollisionCategory(TubeFactory.draggableTrackCategory);
      track.setCollidesWith(~TubeFactory.draggableTrackCategory);

      const halfTrackWidth = track.displayWidth / 2;
      const halfTrackHeight = track.displayHeight / 2;
      const left = gameAreaX - gameAreaWidth / 2 + halfTrackWidth;
      const right = gameAreaX + gameAreaWidth / 2 - halfTrackWidth;
      const top = gameAreaY - gameAreaHeight / 2 + halfTrackHeight;
      const bottom = gameAreaY + gameAreaHeight / 2 - halfTrackHeight;

      const clampedX = Phaser.Math.Clamp(dragX, left, right);
      const clampedY = Phaser.Math.Clamp(dragY, top, bottom);

      const lerpFactor = 0.35;
      const newX = Phaser.Math.Linear(track.x, clampedX, lerpFactor);
      const newY = Phaser.Math.Linear(track.y, clampedY, lerpFactor);

      Body.setPosition(track.body as Body, { x: newX, y: newY });
      Body.setAngle(track.body as Body, Phaser.Math.DegToRad(originalAngle));
      track.setAngularVelocity(0);

      skin.setPosition(track.x, track.y);
      skin.setAngle(originalAngle);
      (track as any).syncChildren();
    });

    skin.on("dragend", () => {
      skin.setPosition(track.x, track.y);
      ctx.staticTracks.forEach(t => t.setSensor(true));
      ctx.allTracks.forEach(t => {
        const children = (t as any).children as Phaser.Physics.Matter.Image[] | undefined;
        if (children) {
          children.forEach(c => {
            if (c) c.setSensor(false);
          });
        }
      });

      const startTime = ctx.scene.registry.get(`${ctx.levelKey}-startTime`) || 0;
      if (ctx.trackPaths && ctx.trackPaths.length > 0) {
        ctx.trackPaths[ctx.trackPaths.length - 1].path.push({
          x: Math.round(track.x),
          y: Math.round(track.y),
          time: Date.now() - startTime
        });
      }

      if (dragInterval) dragInterval.destroy();

      ctx.scene.time.delayedCall(100, () => {
        track.setVelocity(0, 0);
        track.setAngularVelocity(0);
        track.setStatic(true);
        skin.setPosition(track.x, track.y);
        (track as any).syncChildren();
      });

      ctx.scene.time.delayedCall(500, () => {
        (track as any).syncChildren();
        (track as any).overlay.setVisible(true);
      });

      track.setCollisionCategory(TubeFactory.draggableTrackCategory);
      track.setCollidesWith(~TubeFactory.draggableTrackCategory);

      skin.setPosition(track.x, track.y);
      skin.setAngle(originalAngle);
    });

    return track;
  }
}

