import {
    LIGHTYELLOW,
    HALF_WIDTH,
    QUARTER_HEIGHT,
    QUARTER_WIDTH,
} from "./constants.ts";
import { Scene } from "phaser"

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

export function renderBanner(scenes: Scene, bannerParams: BannerParams) {
    const {
        backgroundColour = LIGHTYELLOW,
        x: bannerX = QUARTER_WIDTH,
        y: bannerY = QUARTER_HEIGHT,
        width = HALF_WIDTH,
        height = 100,
        backgroundAlpha = 1,
    } = bannerParams
    const bannerGraphic = scenes.add.graphics();
    bannerGraphic.fillStyle(backgroundColour, backgroundAlpha)
    bannerGraphic.fillRoundedRect(bannerX, bannerY, width, height, 60)
    return bannerGraphic
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
    return scene.add.text(x, y, text, {
        fontFamily: "Comic Sans MS",
        fontSize: 32,
        align: "center"
    }).setOrigin(origin ?? 0.5, 0)
}
