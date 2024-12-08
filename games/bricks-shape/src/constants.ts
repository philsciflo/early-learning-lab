export const HEIGHT = 768;
export const HALF_HEIGHT = HEIGHT / 2;
export const QUARTER_HEIGHT = HEIGHT / 4;

export const GUTTER_WIDTH = 50;
export const WIDTH = 1024; //px
export const GAME_AREA_WIDTH = WIDTH - 2 * GUTTER_WIDTH; //px
export const HALF_WIDTH = WIDTH / 2; //px
export const QUARTER_WIDTH = WIDTH / 4; //px
export const BACKGROUND_BOX_HEIGHT = 110;

export const BUILD_TILE_SIZE = 200;
export const TARGET_TILE_SIZE = 50;

export const BUILD_AREA_LEFT = GUTTER_WIDTH + 50;
export const BUILD_AREA_TOP = BACKGROUND_BOX_HEIGHT + 50;
export const TARGET_LEFT = WIDTH - GUTTER_WIDTH - 4 * TARGET_TILE_SIZE;
export const TARGET_TOP = BUILD_AREA_TOP;

export const WHITE = 0xffffff;
export const BLACK_STRING = "#000000";
export const BLACK = parseInt(BLACK_STRING.substring(1), 16);

export const ORANGE_STRING = "#ffa500";
export const ORANGE = parseInt(ORANGE_STRING.substring(1), 16);

// Tile colours
export const AQUA = 0x00ffff;
export const LIME = 0x00ff00;
export const FUSCHIA = 0xff00ff;
export const YELLOW = 0xffff00;
export const RED = 0xff0000;

export const GAME_SCORE_DATA_KEY = "bricks-shape-data";
export const PLAYER_ID_PAIR_DATA_KEY = "playerIds";
