export const WIDTH = 1152;
export const HEIGHT = 768;
export const HALF_WIDTH = WIDTH / 2;
export const HALF_HEIGHT = HEIGHT / 2;

// Data tracking (see scoring.ts)
export const GAME_SCORE_DATA_KEY = "whaka-ahua-data";
export const PLAYER_ID_DATA_KEY = "playerId";
// Set by Level1 just before navigating to GameOver, so GameOver can show
// the result without re-deriving it or threading it through scene.start's
// (untyped) data argument.
export const LAST_SCORE_DATA_KEY = "lastScore";

// MainMenu's decorative sky/ground/cloud backdrop - same palette as tiro,
// for visual consistency across the games in this repo.
export const SKY_COLOUR = 0x9fd8ff;
export const GROUND_COLOUR = 0x8fcf6a;
export const GROUND_Y = 560;

// Level1 is a drawing task, not an outdoor scene, so it gets its own
// plain, neutral backdrop rather than reusing the sky/ground above.
export const LEVEL_BACKGROUND_COLOUR = 0xeef1f7;

// Level1's two side-by-side drawing canvases.
export const CANVAS_WIDTH = 440;
export const CANVAS_HEIGHT = 440;
export const CANVAS_GAP = 72;
export const CANVAS_TOP_Y = 150;
// Centres the pair of canvases (2 * CANVAS_WIDTH + CANVAS_GAP = 952) in
// the 1152-wide scene.
export const CANVAS_LEFT_X = (WIDTH - (2 * CANVAS_WIDTH + CANVAS_GAP)) / 2;
export const CANVAS_RIGHT_X = CANVAS_LEFT_X + CANVAS_WIDTH + CANVAS_GAP;

export const CANVAS_BACKGROUND_COLOUR = 0xffffff;
export const CANVAS_BORDER_COLOUR = 0x2b2a6b;
export const REFERENCE_LINE_COLOUR = 0x2b2a6b;
export const DRAWING_LINE_COLOUR = 0xff6f3c;
// Shared by both canvases so the reference and the player's drawing read
// as a visually matched pair - also used by renderDrawing.ts so the
// rasterized PNGs match what's shown live in-game.
export const REFERENCE_LINE_WIDTH = 8;
export const DRAWING_LINE_WIDTH = 8;

// The static reference triangle's vertices, in canvas-local coordinates
// (0,0 is the target canvas's own top-left corner) - roughly centred in
// the CANVAS_WIDTH x CANVAS_HEIGHT square with an even margin on every
// side.
export const REFERENCE_TRIANGLE_VERTICES: [
  { x: number; y: number },
  { x: number; y: number },
  { x: number; y: number },
] = [
  { x: 220, y: 60 },
  { x: 60, y: 380 },
  { x: 380, y: 380 },
];
