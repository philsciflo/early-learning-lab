// src/timer/TimerPatch.ts


import { MarbleTrackScene } from "../MarblesTrackScene";
// 
import * as Timer from "./Timer";

// any
const proto = MarbleTrackScene.prototype as any;

// intercept create() ——
// start timer when create 
const origCreate = proto.create;
proto.create = function (...args: any[]) {
  Timer.startTimer(this.scene.key);
  return origCreate.apply(this, args);
};

// —— intercept recordScoreForPlayer() ——
// end at end, and return
const origRecord = proto["recordScoreForPlayer"] as Function;
proto["recordScoreForPlayer"] = function (...args: any[]) {
  const duration = Timer.stopTimer(this.scene.key);
  return origRecord.apply(this, [...args, duration]);
};
