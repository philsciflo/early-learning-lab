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

export type BaseTrialData = {
  /** Which side of the tree the NPC stood on this trial. */
  npcSide: Side;
  /** ISO timestamp of when the trial started. */
  startTime: string;
  /** Total wall-clock duration of the trial, in milliseconds. */
  trialDurationMs: number;
  /** True if the trial ended via a facilitator control (Next Level /
   * End Test) rather than running to its own natural conclusion. */
  endedByFacilitator: boolean;
};

/** Level 1: free drag, with live "can Jerry see it yet" feedback the
 * whole time. There's no single right/wrong moment - the child can
 * drag in and out of view freely - so what's recorded is the full
 * trajectory plus whether/when a success happened at all. */
export type Level1TrialData = BaseTrialData & {
  level: "Level1";
  bagStartSide: Side;
  dragPath: DragPoint[];
  timeToFirstDragMs: number | null;
  successPosition: { x: number; y: number } | null;
  timeToSuccessMs: number | null;
};

/** Level 2: the same drag task, but blind - no live feedback. The
 * child commits to a single final position (via the "Done" button),
 * and only then finds out if Jerry could actually see it there. */
export type Level2TrialData = BaseTrialData & {
  level: "Level2";
  bagStartSide: Side;
  dragPath: DragPoint[];
  timeToFirstDragMs: number | null;
  /** Where the bag was when the child committed, or null if they ended
   * the trial without ever committing. */
  committedPosition: { x: number; y: number } | null;
  timeToCommitMs: number | null;
  /** Whether the committed position was actually visible to the NPC.
   * Null if never committed. */
  correct: boolean | null;
};

/** Level 3 and Level 4: the "postcard" recognition task - same shape,
 * differing only in how many options were on screen (2 vs 4). */
export type ChoiceTrialData = BaseTrialData & {
  level: "Level3" | "Level4";
  numOptions: number;
  correctOptionIndex: number;
  /** Null if the trial ended (facilitator control) before any card was
   * clicked. */
  chosenOptionIndex: number | null;
  correct: boolean | null;
  timeToChoiceMs: number | null;
};

export type TrialData = Level1TrialData | Level2TrialData | ChoiceTrialData;

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

/** Call once per trial, when it concludes (success, commit, choice, or
 * a facilitator control). Appends the full trial record in a single
 * write, rather than writing to localStorage on every drag-move event. */
export function recordTrial(playerId: string, trial: TrialData): void {
  const allData = getScoreData();
  const instance = getLatestPlayerInstance(allData, playerId);
  instance.trials.push(trial);
  setScoreData(allData);
}
