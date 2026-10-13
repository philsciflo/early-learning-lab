export const WIDTH = 1152;
export const HEIGHT = 768;
export const HALF_WIDTH = WIDTH / 2;
export const HALF_HEIGHT = HEIGHT / 2;

// Sky / ground split
export const SKY_COLOUR = 0x9fd8ff;
export const GROUND_COLOUR = 0x8fcf6a;
export const GROUND_Y = 560;

// NPC
export const NPC_X = 220;
export const NPC_FEET_Y = 650;
// The point the NPC "sees" from. Roughly head height.
export const NPC_EYE_X = 270;
export const NPC_EYE_Y = 430;

// Tree (the obstacle). Used for three things:
//  1. the visual canopy (a circle of TREE_RADIUS, centred on TREE_CENTER)
//  2. a solid collider the bag cannot be dragged through
//  3. the pivot point for the "which side is the bag on" visibility check
export const TREE_X = 620;
export const TREE_FEET_Y = 660;
export const TREE_CENTER_X = TREE_X;
export const TREE_CENTER_Y = 410;
export const TREE_RADIUS = 100;
export const TREE_TRUNK_HEIGHT = 180;
export const TREE_TRUNK_WIDTH = 34;

// Bag
export const BAG_RADIUS = 30; // half the bag's on-screen size, for collision
export const TREE_COLLISION_RADIUS = TREE_RADIUS + BAG_RADIUS;

export const BAG_START_X = 760;
export const BAG_START_Y = 402;

// Where the player is allowed to drag the bag.
export const BAG_DRAG_BOUNDS = {
  minX: 380,
  maxX: 1050,
  minY: 320,
  maxY: 680,
};
