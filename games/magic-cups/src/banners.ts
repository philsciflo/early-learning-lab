import {
  BEIGE,
  WIDTH,
  HEIGHT,
  QUARTER_WIDTH,
  QUARTER_HEIGHT,
  HALF_WIDTH,
} from "./constants.ts";
import { Scene } from "phaser";

export type BannerParams = {
  borderColour?: number;
  backgroundColour?: number;
  backgroundAlpha?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  shadow?: boolean;
  stroke?: boolean;
  strokeColour?: number;
  strokeWidth?: number;
  strokeAlpha?: number;
  radius?: number | { tl?: number; tr?: number; bl?: number; br?: number };
};

export type TextParams = {
  text: string;
  yOffset?: number;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
  depth?: number;
}

export function renderBanner(
  scene: Scene,
  params: BannerParams = {}
): Phaser.GameObjects.Graphics {
  const {
    backgroundColour = 0xFFF1CE,
    x = QUARTER_WIDTH, 
    y = QUARTER_HEIGHT, 
    width = HALF_WIDTH, 
    height = 100,
    stroke = false,
    strokeColour = 0x000000,
    strokeWidth = 2,
    strokeAlpha = 1,
    shadow = true,
    backgroundAlpha = 1,
    radius = 30 } = params;
  const g = scene.add.graphics();
  g.fillStyle(backgroundColour, backgroundAlpha);
  g.fillRoundedRect(x, y, width, height, radius);

  if (shadow) {
    g.postFX?.addShadow(0, 14, 0.005, 1, 0x000000, 30, 1);
  }

  if (stroke) {
    g.lineStyle(strokeWidth, strokeColour, strokeAlpha);
    g.strokeRoundedRect(x, y, width, height, 30);
  }

  return g;
}

export function renderTitleWithSubtitle(
  scene: Scene,
  title: string,
  subtitle: string
): {
  container: Phaser.GameObjects.Container;
  titleText: Phaser.GameObjects.Text;
  subtitleText: Phaser.GameObjects.Text;
} {
    // Title style 
  const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Magical Star",
    fontSize: "70px",
    color: "#FF7700",
    stroke: "#333333",
    strokeThickness: 4,
    align: "center",
    shadow: { offsetX: 3, offsetY: 3, color: "#323232ff", blur: 1, stroke: true, fill: true }
  };

  // Subtitle style 
  const subtitleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Body",
    fontSize: "30px",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
    align: "center",
    shadow: {
      offsetX: 3,
      offsetY: 3,
      color: "#3d3d3dff",
      blur: 1,
      stroke: true,
      fill: true,
    },
  };

  // Title text
  const titleText = scene.add.text(0, 0, title, titleStyle).setOrigin(0.5);

  // Subtitle text 
  const subtitleText = scene.add.text(0, 50, subtitle, subtitleStyle).setOrigin(0.5);

  //  Background panel 
  const padX = 40, padY = 25;
  const width = Math.max(titleText.width, subtitleText.width) + padX;
  const height = titleText.height + subtitleText.height + padY;
  const radius = height / 2;
  const r = Math.min(radius, Math.floor(height/2));

  const bg = scene.add.graphics();

  // shadow
  bg.fillStyle(0x000000, 0.25);
  bg.fillRoundedRect(-width / 2 - 60, -height / 2 + 30, width + 120, height, r);

  // main panel
  bg.fillStyle(0xFFF1CE, 1);
  bg.fillRoundedRect(-width / 2 - 60, -height / 2 + 20, width + 120, height, r);
  bg.setDepth(10);

  // Group all into a container 
  const container = scene.add.container(WIDTH / 2, HEIGHT / 11, [bg, titleText, subtitleText]);
  container.setDepth(10);

  return { container, titleText, subtitleText };
}