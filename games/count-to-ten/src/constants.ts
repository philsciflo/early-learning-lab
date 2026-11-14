export const WIDTH = 1152;
export const HEIGHT = 768;
export const HALF_WIDTH = WIDTH / 2;
export const HALF_HEIGHT = HEIGHT / 2;

// Data tracking (see scoring.ts)
export const GAME_SCORE_DATA_KEY = "count-to-ten-data";
export const PLAYER_ID_DATA_KEY = "playerId";
// Set by Level1 just before navigating to GameOver, so GameOver can show
// the result without re-deriving it or threading it through scene.start's
// (untyped) data argument.
export const LAST_SCORE_DATA_KEY = "lastScore";

// MainMenu's decorative "scattered digits" backdrop (see
// numberBackdrop.ts) - a numbers-flavoured equivalent of letters-salad's
// scatterLetterBackdrop, used in place of the sky/ground backdrop other
// games in this repo use. Level1 is a focused counting task rather than
// a decorative landing screen, so it gets its own plain, neutral
// backdrop instead (same reasoning as letters-salad's
// LEVEL_BACKGROUND_COLOUR).
export const MENU_BACKGROUND_COLOUR = 0xe8f6ff;
export const MENU_NUMBER_COUNT = 60;
export const LEVEL_BACKGROUND_COLOUR = 0xeef1f7;

// Level1: "Count the objects" single-trial task. One of COUNT_OPTIONS
// objects (all the same randomly-chosen SHAPE_TYPE - see shapes.ts) is
// scattered across a loose, non-overlapping grid in the centre of the
// screen; the child taps the matching number button to answer.
export const COUNT_OPTIONS = [5, 6, 7, 8] as const;

// The object cluster sits in a centred rectangle, laid out as a loose
// GRID_COLS x GRID_ROWS grid (one cell per possible object, since
// GRID_COLS * GRID_ROWS === the largest COUNT_OPTIONS value) with a
// little random per-object jitter so it reads as a scattered cluster
// rather than a perfect grid - see Level1.ts's layoutObjects(). The
// jitter is kept well inside half a cell (minus half an object) so
// objects can never overlap regardless of which cells get picked.
export const GRID_COLS = 4;
export const GRID_ROWS = 2;
export const CLUSTER_X_MIN = 250;
export const CLUSTER_X_MAX = WIDTH - 250;
export const CLUSTER_Y_MIN = 160;
export const CLUSTER_Y_MAX = 500;
export const OBJECT_SIZE = 64;
export const OBJECT_JITTER = 28;

export const COUNT_FEEDBACK_Y = 560;
export const COUNT_SCREENSHOT_Y = 630;

// Two duplicate columns of number buttons (1-10 on both the left and
// right edge of the screen, per spec, so either hand can reach one
// comfortably) - see Level1.ts's createNumberColumn().
export const NUMBER_BUTTON_COUNT = 10;
export const NUMBER_BUTTON_DIAMETER = 54;
export const NUMBER_BUTTON_GAP_Y = 12;
const NUMBER_COLUMN_HEIGHT =
  NUMBER_BUTTON_COUNT * NUMBER_BUTTON_DIAMETER +
  (NUMBER_BUTTON_COUNT - 1) * NUMBER_BUTTON_GAP_Y;
export const NUMBER_COLUMN_TOP_Y = (HEIGHT - NUMBER_COLUMN_HEIGHT) / 2;
export const NUMBER_COLUMN_LEFT_X = 70;
export const NUMBER_COLUMN_RIGHT_X = WIDTH - 70;
