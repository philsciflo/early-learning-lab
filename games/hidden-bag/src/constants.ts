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

// Tree (the occluder)
export const TREE_X = 620;
export const TREE_FEET_Y = 660;
// The tree's blocking silhouette, approximated as a single circle.
// Tune TREE_OCCLUDER_RADIUS to make the puzzle easier/harder: bigger
// radius = bigger hiding spot = harder for the player to find a gap.
export const TREE_OCCLUDER_X = TREE_X;
export const TREE_OCCLUDER_Y = 440;
export const TREE_OCCLUDER_RADIUS = 65;

// Bag
export const BAG_START_X = 640;
export const BAG_START_Y = 480;

// Where the player is allowed to drag the bag.
export const BAG_DRAG_BOUNDS = {
  minX: 380,
  maxX: 1050,
  minY: 320,
  maxY: 680,
};
