import { GAME_SCORE_DATA_KEY } from "./constants.ts";

export type Side = "left" | "right";

/** One sample of the bag's position during a drag, timed relative to
 * when the trial started (not absolute wall-clock time) - that's what's
 * actually useful for duration/trajectory analysis. */
export type DragPoint = {
  x: number;
  y: number;
  tMs: number;
};

/** Everything recorded for a single attempt at the Hidden Bag task. */
export type TrialData = {
  /** Which side of the tree the NPC stood on this trial. */
  npcSide: Side;
  /** Which side of the tree the bag started hidden on (always the
   * opposite of npcSide, but recorded explicitly so it doesn't have to
   * be re-derived later). */
  bagStartSide: Side;
  /** ISO timestamp of when the trial started (Level1's `create()`). */
  startTime: string;
  /** The full drag path: every point the bag passed through, in order. */
  dragPath: DragPoint[];
  /** Time from trial start to the child's first touch on the bag, or
   * null if they never touched it. */
  timeToFirstDragMs: number | null;
  /** Where the bag was when the NPC first saw it, or null if that never
   * happened during this trial. */
  successPosition: { x: number; y: number } | null;
  /** Time from trial start to that first success, or null. */
  timeToSuccessMs: number | null;
  /** True if the trial ended via the facilitator's "End Test" button
   * rather than (in a future version) some automatic condition. */
  endedByFacilitator: boolean;
  /** Total wall-clock duration of the trial, in milliseconds. */
  trialDurationMs: number;
};

export type PLAYER_INSTANCE_SCORING_DATA = {
  start: Date;
  age: string;
  location: string;
  trials: TrialData[];
};

/** Scoring data by Player Id, potentially with multiple play-throughs
 * per player (repeat visits, duplicate IDs, etc). */
export type ALL_SCORING_DATA = Record<string, PLAYER_INSTANCE_SCORING_DATA[]>;

export function removeScoreData(): void {
  localStorage.setItem(GAME_SCORE_DATA_KEY, "{}");
}

export function getScoreDataJSONString(): string {
  return localStorage.getItem(GAME_SCORE_DATA_KEY) ?? "{}";
}

function getScoreData(): ALL_SCORING_DATA {
  return JSON.parse(getScoreDataJSONString());
}

function setScoreData(allData: ALL_SCORING_DATA): void {
  localStorage.setItem(GAME_SCORE_DATA_KEY, JSON.stringify(allData));
}

function getLatestPlayerInstance(allData: ALL_SCORING_DATA, playerId: string): PLAYER_INSTANCE_SCORING_DATA {
  const instances = allData[playerId];
  return instances[instances.length - 1];
}

/** Call once, from the login screen, when a player starts a new
 * play-through. Creates a fresh (empty) trial list for them. */
export function startNewScore(playerId: string, playerAge: string, playerLocation: string): void {
  const allData = getScoreData();

  const newInstance: PLAYER_INSTANCE_SCORING_DATA = {
    start: new Date(),
    age: playerAge,
    location: playerLocation,
    trials: [],
  };

  if (allData[playerId]) {
    allData[playerId].push(newInstance);
  } else {
    allData[playerId] = [newInstance];
  }

  setScoreData(allData);
}

/** Call once per trial, when the facilitator ends it (or, in future,
 * whenever else a trial naturally concludes). Appends the full trial
 * record in a single write, rather than writing to localStorage on
 * every drag-move event. */
export function recordTrial(playerId: string, trial: TrialData): void {
  const allData = getScoreData();
  const instance = getLatestPlayerInstance(allData, playerId);
  instance.trials.push(trial);
  setScoreData(allData);
}
