import {
  DARKPURPLEBLUE, 
  DARKPURPLEBLUE_STRING,
  HALF_WIDTH,
  QUARTER_HEIGHT,
  QUARTER_WIDTH,
  CREAM,
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
  shadow?: boolean;
  stroke?: boolean;
};

export type TextParams = {
  text: string;
  // The y offset from the containing banner, so the text doesn't overlap
  yOffset: number;
};

export function renderBanner(scene: Scene, bannerParams: BannerParams) {
  const {
    backgroundColour = CREAM,
    x: bannerX = QUARTER_WIDTH,
    y: bannerY = QUARTER_HEIGHT,
    width = HALF_WIDTH,
    height = 100,
    backgroundAlpha = 1,
    shadow = true, //if the banner has a dropshadow or not 
    stroke = false,
  } = bannerParams;
  const bannerGraphic = scene.add.graphics();
  bannerGraphic.fillStyle(backgroundColour, backgroundAlpha);
  bannerGraphic.fillRoundedRect(bannerX, bannerY, width, height, 60);
  if(shadow == true){
    bannerGraphic.postFX.addShadow(0, 14, 0.004, 1, 0x333333, 30, 1); 
  }
  if(stroke == true){
    bannerGraphic.lineStyle(10, backgroundColour);
    bannerGraphic.strokeRoundedRect(bannerX, bannerY, width, height, 60);
  }
  return bannerGraphic;
}

export function renderTextBanner(
  scene: Phaser.Scene,
  bannerParams: BannerParams,
  textParams: TextParams,
) {
  renderBanner(scene, bannerParams);

  const { y: bannerY = QUARTER_HEIGHT } = bannerParams;

  const { text, yOffset } = textParams;
  renderText(scene, HALF_WIDTH, bannerY + yOffset, text);
}

export function renderText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  origin?: number,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: "Unbounded",
      fontSize: 32,
      color: "#5D576B",
      align: "center",
      fontStyle:"bold",
    })
    .setOrigin(origin ?? 0.5, 0);
}

export function levelSelectBanner(scene: Scene, bannerParams: BannerParams) {
  const {
    backgroundColour = CREAM,
    x: bannerX = QUARTER_WIDTH,
    y: bannerY = QUARTER_HEIGHT,
    width = HALF_WIDTH,
    height = 100,
    backgroundAlpha = 1,
    shadow = true, //if the banner has a dropshadow or not 
    stroke = false,
  } = bannerParams;
  const bannerGraphic = scene.add.graphics();
  bannerGraphic.fillStyle(backgroundColour, backgroundAlpha);
  bannerGraphic.fillEllipse(bannerX, bannerY, width, height, 60);
  if(shadow == true){
    bannerGraphic.postFX.addShadow(0, 14, 0.004, 1, 0x333333, 30, 1); 
  }
  if(stroke == true){
    bannerGraphic.lineStyle(10, backgroundColour);
    bannerGraphic.strokeRoundedRect(bannerX, bannerY, width, height, 60);
  }
  return bannerGraphic;
}