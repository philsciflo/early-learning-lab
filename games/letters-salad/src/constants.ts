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
