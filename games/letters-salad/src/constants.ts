export const WIDTH = 1152;
export const HEIGHT = 768;
export const HALF_WIDTH = WIDTH / 2;
export const HALF_HEIGHT = HEIGHT / 2;

// Data tracking (see scoring.ts)
export const GAME_SCORE_DATA_KEY = "letters-salad-data";
export const PLAYER_ID_DATA_KEY = "playerId";
// Set by Level1 just before navigating to GameOver, so GameOver can show
// the result without re-deriving it or threading it through scene.start's
// (untyped) data argument.
export const LAST_SCORE_DATA_KEY = "lastScore";

// MainMenu's decorative "letter salad" backdrop (see letterBackdrop.ts) -
// a scatter of alphabet letters at random size/rotation/opacity, used
// in place of the sky/ground backdrop other games in this repo use.
// Level1 is a focused sorting task rather than a decorative landing
// screen, so it gets its own plain, neutral backdrop instead (same
// reasoning as whaka-ahua's LEVEL_BACKGROUND_COLOUR).
export const MENU_BACKGROUND_COLOUR = 0xfff7e6;
export const MENU_LETTER_COUNT = 60;
export const LEVEL_BACKGROUND_COLOUR = 0xeef1f7;

// Level1: "Sort letters from symbols" drag task. GLYPH_COUNT glyphs
// (half letters, half non-letter symbols - see Level1.ts's
// buildGlyphPile for the exact randomization) start in a loose pile
// and get dragged into one of two labelled drop zones.
export const GLYPH_COUNT = 8;
export const GLYPH_FONT_SIZE = 96;
// Padding added around each glyph's text for its backgroundColor card
// and (since Phaser sizes a Text object's default interactive hit area
// to match its full background box) its drag/touch target - narrow
// characters like "!" or "1" get noticeably more generous hit areas
// than their raw glyph width would give them.
export const GLYPH_PADDING_X = 20;
export const GLYPH_PADDING_Y = 14;

// The pile sits in a horizontal band above the drop zones, GLYPH_COUNT
// evenly spaced slots with a little random jitter so it reads as a
// loose pile rather than a perfect grid.
export const PILE_CENTER_Y = 180;
export const PILE_X_JITTER = 10;
export const PILE_Y_JITTER = 15;
export const PILE_MARGIN_X = 100;

// Two side-by-side drop zones, sized and spaced so the buttons/feedback
// text below land at the same Y offsets whaka-ahua's Level1 uses below
// its canvases (BUTTONS_Y = zone bottom + 60, FEEDBACK_Y = + 70 more),
// for visual consistency across games.
export const ZONE_WIDTH = 420;
export const ZONE_HEIGHT = 280;
export const ZONE_TOP_Y = 310;
export const ZONE_GAP = 80;
export const LETTERS_ZONE_X = (WIDTH - (2 * ZONE_WIDTH + ZONE_GAP)) / 2;
export const OTHER_ZONE_X = LETTERS_ZONE_X + ZONE_WIDTH + ZONE_GAP;

export const LETTERS_ZONE_COLOUR = 0xd7ecff;
export const OTHER_ZONE_COLOUR = 0xffe3d1;
export const ZONE_BORDER_COLOUR = 0x2b2a6b;

// Level2: "Find the correct letter out of 8" - single-trial task. One
// target letter is shown large; FIND_OPTION_COUNT letter tiles (the
// target plus confusable/random distractors - see Level2.ts's
// buildOptions) sit in a FIND_OPTION_COLUMNS-wide grid below it.
// Tapping any tile ends the trial immediately (single attempt).
export const FIND_OPTION_COUNT = 8;
export const FIND_OPTION_COLUMNS = 4;
export const FIND_OPTION_DIAMETER = 120;
export const FIND_OPTION_GAP_X = 36;
export const FIND_OPTION_GAP_Y = 40;
export const FIND_OPTIONS_TOP_Y = 380;
const FIND_GRID_WIDTH =
  FIND_OPTION_COLUMNS * FIND_OPTION_DIAMETER +
  (FIND_OPTION_COLUMNS - 1) * FIND_OPTION_GAP_X;
export const FIND_OPTIONS_LEFT_X = (WIDTH - FIND_GRID_WIDTH) / 2;

export const FIND_TARGET_Y = 230;
export const FIND_TARGET_FONT_SIZE = 110;
export const FIND_FEEDBACK_Y = 620;
export const FIND_SCREENSHOT_Y = 700;

// Level3: "Sort the alphabet" ordering task. ORDER_COUNT letters start
// scrambled in a pile and get dragged into ORDER_COUNT ordered slots,
// earliest-to-latest alphabetically. ORDER_COUNT is the full alphabet
// (26), which no longer fits a single row at a legible/touch-friendly
// size, so both the ordered slots and the scrambled pile wrap into a
// grid of ORDER_ITEMS_PER_ROW columns x ceil(ORDER_COUNT /
// ORDER_ITEMS_PER_ROW) rows (2 rows of 13) - see Level3.ts's
// createSlots/slotCenter/slotAt/createPile for the row-wrapping math
// (column = i % ORDER_ITEMS_PER_ROW, row = Math.floor(i /
// ORDER_ITEMS_PER_ROW)).
export const ORDER_COUNT = 26;
export const ORDER_ITEMS_PER_ROW = 13;
export const ORDER_FONT_SIZE = 44;
export const ORDER_PADDING_X = 10;
export const ORDER_PADDING_Y = 8;

// Pile: ORDER_ITEMS_PER_ROW-wide rows of jittered glyphs, stacked
// ORDER_PILE_ROW_GAP apart (same loose-pile-with-jitter look as the
// original single-row design, just wrapped into rows).
export const ORDER_PILE_TOP_CENTER_Y = 170;
export const ORDER_PILE_ROW_GAP = 100;
export const ORDER_PILE_X_JITTER = 8;
export const ORDER_PILE_Y_JITTER = 8;
export const ORDER_PILE_MARGIN_X = 90;

// Slots: ORDER_ITEMS_PER_ROW-wide rows, ORDER_SLOT_ROW_GAP apart
// vertically (big enough to fit each row's own position-number label
// without touching the row above).
export const ORDER_SLOT_WIDTH = 70;
export const ORDER_SLOT_HEIGHT = 86;
export const ORDER_SLOT_GAP = 14;
export const ORDER_SLOT_ROW_GAP = 44;
export const ORDER_SLOTS_TOP_Y = 360;
const ORDER_SLOTS_GRID_WIDTH =
  ORDER_ITEMS_PER_ROW * ORDER_SLOT_WIDTH +
  (ORDER_ITEMS_PER_ROW - 1) * ORDER_SLOT_GAP;
export const ORDER_SLOTS_LEFT_X = (WIDTH - ORDER_SLOTS_GRID_WIDTH) / 2;

export const ORDER_SLOT_COLOUR = 0xd7ecff;
export const ORDER_SLOT_BORDER_COLOUR = 0x2b2a6b;
