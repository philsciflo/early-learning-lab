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

// Shared "ink" colour: a warm, playful deep plum used everywhere the UI
// used to use a flat navy (0x2b2a6b) for text and strokes - keeps
// contrast against the lighter, warmer backgrounds/fills below while
// reading as friendlier than cold navy.
export const INK_COLOUR = 0x4a3b7a;
export const INK_TEXT = "#4a3b7a";

// MainMenu's decorative "scattered digits" backdrop (see
// numberBackdrop.ts) - a numbers-flavoured equivalent of letters-salad's
// scatterLetterBackdrop, used in place of the sky/ground backdrop other
// games in this repo use. Level1 is a focused counting task rather than
// a decorative landing screen, so it gets its own plain, neutral
// backdrop instead (same reasoning as letters-salad's
// LEVEL_BACKGROUND_COLOUR).
export const MENU_BACKGROUND_COLOUR = 0xffe8d6;
export const MENU_NUMBER_COUNT = 60;
export const LEVEL_BACKGROUND_COLOUR = 0xfff6d9;

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
//
// OBJECT_SIZE was doubled (64 -> 128) for a visual-polish pass. That
// alone would make the largest-count (8-object, 4x2 grid) layout
// overlap, so the cluster bounds/jitter were recomputed alongside it:
// cellWidth = (CLUSTER_X_MAX - CLUSTER_X_MIN) / GRID_COLS must satisfy
// cellWidth / 2 >= OBJECT_SIZE / 2 + OBJECT_JITTER (+ a safety margin),
// and likewise cellHeight / 2 for CLUSTER_Y_MIN/MAX over GRID_ROWS. With
// OBJECT_SIZE=128 (half=64) and OBJECT_JITTER trimmed to 16:
//   cellWidth  = (944 - 208) / 4 = 184 -> half 92 >= 64 + 16 (+12 margin)
//   cellHeight = (520 - 140) / 2 = 190 -> half 95 >= 64 + 16 (+15 margin)
// Both axes keep >=12px of slack beyond the worst-case object extent,
// comfortably clearing the number-button columns (which sit at
// x=70/x=1082, well outside 208..944) and the title/feedback text above
// and below the cluster.
export const GRID_COLS = 4;
export const GRID_ROWS = 2;
export const CLUSTER_X_MIN = 208;
export const CLUSTER_X_MAX = WIDTH - 208;
export const CLUSTER_Y_MIN = 140;
export const CLUSTER_Y_MAX = 520;
export const OBJECT_SIZE = 128;
export const OBJECT_JITTER = 16;

export const COUNT_FEEDBACK_Y = 560;
export const COUNT_SCREENSHOT_Y = 630;

// Two number-button columns running down the left and right edges of
// the screen. Each number 1-10 appears exactly once across the whole
// screen (not duplicated): the left column holds the first half
// (ascending top-to-bottom), the right column holds the second half -
// see Level1.ts's createNumberColumn().
export const NUMBER_BUTTON_COUNT = 10;
export const NUMBER_COLUMN_COUNT = NUMBER_BUTTON_COUNT / 2;
export const NUMBER_BUTTON_DIAMETER = 54;
export const NUMBER_BUTTON_GAP_Y = 12;
const NUMBER_COLUMN_HEIGHT =
  NUMBER_COLUMN_COUNT * NUMBER_BUTTON_DIAMETER +
  (NUMBER_COLUMN_COUNT - 1) * NUMBER_BUTTON_GAP_Y;
export const NUMBER_COLUMN_TOP_Y = (HEIGHT - NUMBER_COLUMN_HEIGHT) / 2;
export const NUMBER_COLUMN_LEFT_X = 70;
export const NUMBER_COLUMN_RIGHT_X = WIDTH - 70;

// Level2/Level3: "Put the numbers in order" task, shared by both via
// NumberOrderScene.ts. NUMBER_ORDER_COUNT numbers (a contiguous range -
// Level2: 1-5, Level3: 6-10) start scrambled in a single-row pile; the
// child drags each into one of NUMBER_ORDER_COUNT ordered slots, also
// laid out in a single row (position 1 = leftmost = smallest). Only 5
// items, so - unlike letters-salad's 26-letter Level3 - everything
// fits in one row with no grid wrapping needed.
export const NUMBER_ORDER_COUNT = 5;
export const NUMBER_ORDER_FONT_SIZE = 44;
export const NUMBER_ORDER_PADDING_X = 10;
export const NUMBER_ORDER_PADDING_Y = 8;

// Pile: one row of jittered number glyphs - same loose-pile-with-jitter
// look as Level1's object cluster.
export const NUMBER_ORDER_PILE_CENTER_Y = 210;
export const NUMBER_ORDER_PILE_X_JITTER = 10;
export const NUMBER_ORDER_PILE_Y_JITTER = 10;
export const NUMBER_ORDER_PILE_MARGIN_X = 220;

// Slots: one row of NUMBER_ORDER_COUNT ordered boxes, centred
// horizontally. Each slot gets its own colour from this small rainbow
// (cycled by slot index) instead of one uniform fill, so the row reads
// as five distinct, playful "homes" rather than a repeated grey box -
// the dark ink border/number stays constant across all of them to tie
// them together visually.
export const NUMBER_ORDER_SLOT_WIDTH = 140;
export const NUMBER_ORDER_SLOT_HEIGHT = 140;
export const NUMBER_ORDER_SLOT_GAP = 40;
export const NUMBER_ORDER_SLOT_RADIUS = 24;
export const NUMBER_ORDER_SLOTS_TOP_Y = 400;
const NUMBER_ORDER_SLOTS_GRID_WIDTH =
  NUMBER_ORDER_COUNT * NUMBER_ORDER_SLOT_WIDTH +
  (NUMBER_ORDER_COUNT - 1) * NUMBER_ORDER_SLOT_GAP;
export const NUMBER_ORDER_SLOTS_LEFT_X =
  (WIDTH - NUMBER_ORDER_SLOTS_GRID_WIDTH) / 2;

export const NUMBER_ORDER_SLOT_COLOURS = [
  0xffd3e0, 0xffe0b3, 0xfff3b0, 0xc8f0cc, 0xc9e3ff,
];
export const NUMBER_ORDER_SLOT_BORDER_COLOUR = INK_COLOUR;
