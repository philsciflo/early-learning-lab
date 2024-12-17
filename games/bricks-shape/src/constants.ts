export const HEIGHT = 768;
export const HALF_HEIGHT = HEIGHT / 2;
export const QUARTER_HEIGHT = HEIGHT / 4;

export const GUTTER_WIDTH = 50;
export const WIDTH = 1024; //px
export const GAME_AREA_WIDTH = WIDTH - 2 * GUTTER_WIDTH; //px
export const HALF_WIDTH = WIDTH / 2; //px
export const QUARTER_WIDTH = WIDTH / 4; //px
export const GAME_AREA_TOP = 110;
export const GAME_AREA_HEIGHT = HEIGHT - GAME_AREA_TOP - 10;

export const BUILD_AREA_LEFT = GUTTER_WIDTH + 50;
export const BUILD_AREA_TOP = GAME_AREA_TOP + 50;
export const BUILD_AREA_HEIGHT = 380;
export const BUILD_AREA_WIDTH = 650;
export const TARGET_LEFT = WIDTH - GUTTER_WIDTH - 200;
export const TARGET_TOP = BUILD_AREA_TOP;
export const TARGET_HEIGHT = 100;
export const TARGET_WIDTH = 150;

export const WHITE = 0xffffff;
export const BLACK_STRING = "#000000";
export const BLACK = parseInt(BLACK_STRING.substring(1), 16);

export const ORANGE_STRING = "#ffa500";
export const ORANGE = parseInt(ORANGE_STRING.substring(1), 16);

// Tile border
export const TILE_BORDER_COLOR = 0x000000;
export const TILE_BORDER_WIDTH = 3;

// Tile colours
export const AQUA = 0x00ffff;
export const LIME = 0x00ff00;
export const FUSCHIA = 0xff00ff;
export const YELLOW = 0xffff00;
export const RED = 0xff0000;
export const BLUE = 0x0000ff;
export const GREEN = 0x008000;
export const PEACH = 0xffa500;

export const GAME_SCORE_DATA_KEY = "bricks-shape-data";
export const PLAYER_ID_PAIR_DATA_KEY = "playerIds";
