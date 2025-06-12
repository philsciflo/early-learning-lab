import {
  BLACK,
  BLACK_STRING,
  GREEN_DEEP,
  HALF_WIDTH,
  QUARTER_HEIGHT,
  QUARTER_WIDTH,
  WHITE,
} from "./constants.ts";
import { Scene } from "phaser";

export type BannerParams = {
  borderColour?: number;
  backgroundColour?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundAlpha?: number;
};

export type TextParams = {
  text: string;
  // The y offset from the containing banner, so the text doesn't overlap
  yOffset: number;
};

export function renderBanner(scene: Scene, bannerParams: BannerParams) {
  const {
    borderColour = BLACK,
    backgroundColour = WHITE,
    x: bannerX = QUARTER_WIDTH,
    y: bannerY = QUARTER_HEIGHT,
    width = HALF_WIDTH,
    height = 100,
    backgroundAlpha = 1,
  } = bannerParams;

  const bannerGraphic = scene.add.graphics();
  bannerGraphic.lineStyle(2, borderColour);
  bannerGraphic.fillStyle(backgroundColour, backgroundAlpha);

  bannerGraphic.fillRoundedRect(bannerX, bannerY, width, height, 10);
  bannerGraphic.strokeRoundedRect(bannerX, bannerY, width, height, 10);
}

export function renderTextBanner(
  scene: Phaser.Scene,
  bannerParams: BannerParams,
  textParams: TextParams,
) {
  renderBanner(scene, bannerParams);

  const { x: bannerX = HALF_WIDTH, y: bannerY = QUARTER_HEIGHT } = bannerParams;

  const { text, yOffset } = textParams;
  scene.add
    .text(bannerX, bannerY + yOffset, text, {
      fontFamily: "Comic Sans MS",
      fontStyle: "bold",
      fontSize: 30,
      color: GREEN_DEEP,
      align: "center",
    })
    .setOrigin(0.5, 0);
}

export function renderHint(
  scene: Phaser.Scene,
  message: string,
  duration = 2000,
  x: number = HALF_WIDTH,
  y: number = QUARTER_HEIGHT,
) {
  const text = scene.add.text(x, y, message, {
    fontFamily: "Comic Sans MS",
    fontStyle: "bold",
    fontSize: "24px",
    color: GREEN_DEEP,
    align: "center",
  });
  text.setOrigin(0.5);

  scene.time.delayedCall(duration, () => {
    text.destroy();
  });
}
