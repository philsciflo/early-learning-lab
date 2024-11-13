import {
  BLACK,
  BLACK_STRING,
  HALF_WIDTH,
  QUARTER_HEIGHT,
  QUARTER_WIDTH,
  WHITE,
} from "./constants.ts";
import { Scene } from "phaser";

export interface BannerParams {
  borderColour?: number;
  backgroundColour?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface TextParams {
  text: string;
  x?: number;
  y?: number;
}

export function renderBanner(scene: Scene, bannerParams: BannerParams) {
  const {
    borderColour = BLACK,
    backgroundColour = WHITE,
    x: bannerX = QUARTER_WIDTH,
    y: bannerY = QUARTER_HEIGHT,
    width = HALF_WIDTH,
    height = 100,
  } = bannerParams;
  const bannerGraphic = scene.add.graphics();
  bannerGraphic.lineStyle(2, borderColour);
  bannerGraphic.fillStyle(backgroundColour);

  bannerGraphic.fillRoundedRect(bannerX, bannerY, width, height, 10);
  bannerGraphic.strokeRoundedRect(bannerX, bannerY, width, height, 10);
}

export function renderTextBanner(
  scene: Phaser.Scene,
  bannerParams: BannerParams,
  textParams: TextParams,
) {
  renderBanner(scene, bannerParams);

  const { text, x: textX = HALF_WIDTH, y: textY = QUARTER_HEIGHT } = textParams;
  scene.add
    .text(textX, textY, text, {
      fontFamily: "Arial",
      fontSize: 30,
      color: BLACK_STRING,
      align: "center",
    })
    .setOrigin(0.5, 0);
}
