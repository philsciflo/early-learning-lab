export const WIDTH = 1152;
export const HEIGHT = 768;
export const HALF_WIDTH = WIDTH / 2;
export const HALF_HEIGHT = HEIGHT / 2;

// Data tracking (see scoring.ts)
export const GAME_SCORE_DATA_KEY = "hidden-bag-data";
export const PLAYER_ID_DATA_KEY = "playerId";

// Which of the 4 selectable friends (see friends.ts) the child picked on
// the SelectFriend screen, before Level0. Read with a fallback of 1 by
// anything that draws a friend, so starting a level scene directly
// during development (skipping SelectFriend) still renders something.
export const FRIEND_DATA_KEY = "friendId";

// Shared outline/skin colours used by every friend design in friends.ts
// (and reused by the tree/bag outline colour for visual consistency).
export const OUTLINE_COLOUR = 0x2b2a6b;
export const SKIN_COLOUR = 0xffd9b3;

// Shared y-position for the "you got it!" success banner (see
// ui.ts's createSuccessBanner), used by Level2 and the postcard levels
// (Level3/Level4) so the positive feedback moment looks and sits the
// same way everywhere - clear of the instruction text above it and
// the facilitator buttons / next-round controls around it.
export const SUCCESS_BANNER_Y = 112;

// Sky / ground split
export const SKY_COLOUR = 0x9fd8ff;
export const GROUND_COLOUR = 0x8fcf6a;
export const GROUND_Y = 560;

// NPC. The NPC always stands this far from the tree's centre, but which
// SIDE it stands on (left or right) is picked randomly each time the
// level starts - see Level1.pickSide().
export const NPC_FEET_Y = 650;
export const NPC_EYE_Y = 430;
export const NPC_DISTANCE_FROM_TREE = 350;
export const NPC_EYE_DISTANCE_FROM_TREE = 350;
// Applied as a uniform container scale in hiddenBagScene.ts's
// createNpc() (on top of the facing-direction scaleX flip) - purely
// visual, doesn't move NPC_FEET_Y/NPC_EYE_Y/NPC_EYE_DISTANCE_FROM_TREE,
// so the line-of-sight "eye point" used by canSee() is unaffected.
export const NPC_DISPLAY_SCALE = 1.1;

// Tree (the obstacle). TREE_CENTER_X/Y and TREE_RADIUS are the actual
// gameplay geometry - the collider the bag can't be dragged through,
// and the pivot circle the "can the NPC see it" line-of-sight check
// (canSee() in lineOfSight.ts) uses - and are deliberately left
// unchanged by the tree_01.png image swap below, so collision and
// visibility behaviour stay exactly as already tuned/tested. The image
// is purely a visual approximation of this same circle+trunk, not a
// new source of truth for where the tree "really" is.
export const TREE_CENTER_X = WIDTH / 2;
export const TREE_CENTER_Y = 410;
export const TREE_FEET_Y = 660;
export const TREE_RADIUS = 100;
// Purely visual: shifts the tree IMAGE up on screen without moving
// TREE_FEET_Y itself (the actual ground/collision reference, also used
// by collision.ts's TRUNK_TOP) - see hiddenBagScene.ts's createTree().
export const TREE_VISUAL_Y_OFFSET = 45;
// Also actual collision geometry (see collision.ts's TRUNK_LEFT/RIGHT/
// TOP) - a rectangular trunk zone the bag can't be dragged into, on
// top of the canopy circle above. Not used by the visual any more
// (tree_01.png replaces the drawn trunk+canopy), but still load-
// bearing for the collider.
export const TREE_TRUNK_HEIGHT = 180;
export const TREE_TRUNK_WIDTH = 34;

// tree_01.png is 1262x1238. Displayed bottom-centre-anchored at
// (TREE_CENTER_X, TREE_FEET_Y) - see hiddenBagScene.ts's createTree() -
// sized so the image's canopy roughly fills the TREE_CENTER_Y/
// TREE_RADIUS circle above (trunk-base-to-canopy-centre distance in
// the source image is ~880px; scaling that to the 250px gap between
// TREE_FEET_Y and TREE_CENTER_Y gives this scale factor).
const TREE_IMAGE_SCALE = 250 / 880;
export const TREE_DISPLAY_WIDTH = Math.round(1262 * TREE_IMAGE_SCALE);
export const TREE_DISPLAY_HEIGHT = Math.round(1238 * TREE_IMAGE_SCALE);

// Bag. BAG_RADIUS is "half the bag's on-screen size, for collision".
// bag_01.png is 1184x1048 - BAG_DISPLAY_HEIGHT is the actual on-screen
// size judgement call (roughly hand-held-object scale next to the
// NPC), BAG_DISPLAY_WIDTH keeps the image's native aspect ratio, and
// BAG_RADIUS derives from the LARGER of the two so the collision
// circle (TREE_COLLISION_RADIUS below) fully contains the visible
// image rather than the bag visually overlapping the tree before
// collision kicks in.
export const BAG_DISPLAY_HEIGHT = 101; // 92, +10%
export const BAG_DISPLAY_WIDTH = Math.round(BAG_DISPLAY_HEIGHT * (1184 / 1048));
export const BAG_RADIUS = Math.round(
  Math.max(BAG_DISPLAY_WIDTH, BAG_DISPLAY_HEIGHT) / 2,
);
export const TREE_COLLISION_RADIUS = TREE_RADIUS + BAG_RADIUS;
// How far outside the collision radius the bag starts, so it isn't
// touching the tree's edge at the very start of the level.
export const BAG_HIDDEN_CLEARANCE = 10;

// Level1/Level2: the bag's starting spot is randomised within this
// area (on whichever side it's assigned to) each time the level
// loads, instead of always the exact same point - measured from a
// screenshot Florian marked up with the intended region. The distance
// from the tree's centre is TREE_COLLISION_RADIUS + BAG_HIDDEN_CLEARANCE
// (the same minimum the old fixed spot used, so the bag can never
// start closer to the tree than before - only further) plus a random
// extra amount up to BAG_START_X_EXTRA_RANGE. The marked-up box's own
// inner edge was actually a bit closer to the tree than that minimum
// allows, so the minimum wins there; its outer edge is what
// BAG_START_X_EXTRA_RANGE is sized to reach. Height-wise, the box ran
// from partway up the canopy down to the ground line.
export const BAG_START_X_EXTRA_RANGE = 180;
export const BAG_START_Y_MIN = 150;
export const BAG_START_Y_MAX = GROUND_Y;

// Where the player is allowed to drag the bag: almost the full canvas,
// just enough margin that the bag never goes fully off-screen or under
// the instruction text.
export const BAG_DRAG_BOUNDS = {
  minX: BAG_RADIUS,
  maxX: WIDTH - BAG_RADIUS,
  minY: 90,
  maxY: HEIGHT - BAG_RADIUS,
};
