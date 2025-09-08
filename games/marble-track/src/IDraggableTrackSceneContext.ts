export interface IDraggableTrackSceneContext {
  scene: Phaser.Scene;
  staticTracks: Phaser.Physics.Matter.Image[];
  allTracks: Phaser.Physics.Matter.Image[];
  levelKey: string;
  isAttempted: boolean;      // <- 改成 boolean
  markAttempted: () => void;
  trackPaths?: any[];
  triesDataKey?: string;
}