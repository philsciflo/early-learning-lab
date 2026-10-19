export const WIDTH = 1152;
export const HEIGHT = 768;
export const HALF_WIDTH = WIDTH / 2;
export const HALF_HEIGHT = HEIGHT / 2;

// Data tracking (see scoring.ts)
export const GAME_SCORE_DATA_KEY = "hidden-bag-data";
export const PLAYER_ID_DATA_KEY = "playerId";

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

// Tree (the obstacle). Used for three things:
//  1. the visual canopy (a circle of TREE_RADIUS, centred on TREE_CENTER)
//     plus a trunk (TREE_TRUNK_WIDTH x TREE_TRUNK_HEIGHT)
//  2. a solid collider the bag cannot be dragged through
//  3. the pivot point for the "which side is the bag on" visibility check
export const TREE_CENTER_X = WIDTH / 2;
export const TREE_CENTER_Y = 410;
export const TREE_FEET_Y = 660;
export const TREE_RADIUS = 100;
export const TREE_TRUNK_HEIGHT = 180;
export const TREE_TRUNK_WIDTH = 34;

// Bag. BAG_RADIUS is "half the bag's on-screen size, for collision" -
// the actual visuals in hiddenBagScene.createBag() are a scaled-up
// version of a 60x86-at-BAG_RADIUS=30 reference bag, kept proportional
// via BAG_VISUAL_SCALE, so the drawn bag and its collision/drag-target
// size always agree with each other.
export const BAG_RADIUS = 40; // was 30 - bigger, easier-to-grab drag target
export const BAG_VISUAL_SCALE = BAG_RADIUS / 30;
export const TREE_COLLISION_RADIUS = TREE_RADIUS + BAG_RADIUS;
// How far outside the collision radius the bag starts, so it isn't
// touching the tree's edge at the very start of the level.
export const BAG_HIDDEN_CLEARANCE = 10;

// Where the player is allowed to drag the bag: almost the full canvas,
// just enough margin that the bag never goes fully off-screen or under
// the instruction text.
export const BAG_DRAG_BOUNDS = {
  minX: BAG_RADIUS,
  maxX: WIDTH - BAG_RADIUS,
  minY: 90,
  maxY: HEIGHT - BAG_RADIUS,
};
