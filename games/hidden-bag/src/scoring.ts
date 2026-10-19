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

/** Level 1: free drag, with live "can Milo see it yet" feedback the
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
 * and only then finds out if Milo could actually see it there. */
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

// --- CSV export ---
//
// TrialData is a discriminated union with level-specific fields (see
// above). A spreadsheet needs one consistent row shape instead, so
// this flattens every trial into the same columns, leaving a column
// blank wherever it doesn't apply to that trial's level. `dragPath`
// (the full point-by-point trajectory) is left out here - a list of
// {x, y, tMs} points per cell is unwieldy in a spreadsheet - and
// replaced with `dragPointCount`; the full path is still in the JSON
// export for anyone who needs it.
const CSV_COLUMNS = [
  "playerId",
  "age",
  "location",
  "playthroughStart",
  "trialIndex",
  "level",
  "npcSide",
  "startTime",
  "trialDurationMs",
  "endedByFacilitator",
  "bagStartSide",
  "dragPointCount",
  "timeToFirstDragMs",
  "successPositionX",
  "successPositionY",
  "timeToSuccessMs",
  "committedPositionX",
  "committedPositionY",
  "timeToCommitMs",
  "correct",
  "numOptions",
  "correctOptionIndex",
  "chosenOptionIndex",
  "timeToChoiceMs",
] as const;

type CsvCell = string | number | boolean | null;
type CsvRow = Record<(typeof CSV_COLUMNS)[number], CsvCell>;

function trialToCsvRow(
  playerId: string,
  age: string,
  location: string,
  playthroughStart: string,
  trialIndex: number,
  trial: TrialData,
): CsvRow {
  const row: CsvRow = {
    playerId,
    age,
    location,
    playthroughStart,
    trialIndex,
    level: trial.level,
    npcSide: trial.npcSide,
    startTime: trial.startTime,
    trialDurationMs: trial.trialDurationMs,
    endedByFacilitator: trial.endedByFacilitator,
    bagStartSide: null,
    dragPointCount: null,
    timeToFirstDragMs: null,
    successPositionX: null,
    successPositionY: null,
    timeToSuccessMs: null,
    committedPositionX: null,
    committedPositionY: null,
    timeToCommitMs: null,
    correct: null,
    numOptions: null,
    correctOptionIndex: null,
    chosenOptionIndex: null,
    timeToChoiceMs: null,
  };

  if (trial.level === "Level1") {
    row.bagStartSide = trial.bagStartSide;
    row.dragPointCount = trial.dragPath.length;
    row.timeToFirstDragMs = trial.timeToFirstDragMs;
    row.successPositionX = trial.successPosition?.x ?? null;
    row.successPositionY = trial.successPosition?.y ?? null;
    row.timeToSuccessMs = trial.timeToSuccessMs;
  } else if (trial.level === "Level2") {
    row.bagStartSide = trial.bagStartSide;
    row.dragPointCount = trial.dragPath.length;
    row.timeToFirstDragMs = trial.timeToFirstDragMs;
    row.committedPositionX = trial.committedPosition?.x ?? null;
    row.committedPositionY = trial.committedPosition?.y ?? null;
    row.timeToCommitMs = trial.timeToCommitMs;
    row.correct = trial.correct;
  } else {
    row.numOptions = trial.numOptions;
    row.correctOptionIndex = trial.correctOptionIndex;
    row.chosenOptionIndex = trial.chosenOptionIndex;
    row.correct = trial.correct;
    row.timeToChoiceMs = trial.timeToChoiceMs;
  }

  return row;
}

function csvEscape(value: CsvCell): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Same underlying data as getScoreDataJSONString(), flattened into one
 * row per trial for spreadsheet use. */
export function getScoreDataCSVString(): string {
  const allData = getScoreData();
  const rows: CsvRow[] = [];

  for (const [playerId, instances] of Object.entries(allData)) {
    instances.forEach((instance) => {
      const playthroughStart = String(instance.start);
      instance.trials.forEach((trial, trialIndex) => {
        rows.push(
          trialToCsvRow(
            playerId,
            instance.age,
            instance.location,
            playthroughStart,
            trialIndex,
            trial,
          ),
        );
      });
    });
  }

  const lines = [CSV_COLUMNS.join(",")];
  rows.forEach((row) => {
    lines.push(CSV_COLUMNS.map((col) => csvEscape(row[col])).join(","));
  });

  return lines.join("\n");
}

function getScoreData(): ALL_SCORING_DATA {
  return JSON.parse(getScoreDataJSONString());
}

function setScoreData(allData: ALL_SCORING_DATA): void {
  localStorage.setItem(GAME_SCORE_DATA_KEY, JSON.stringify(allData));
}

function getLatestPlayerInstance(
  allData: ALL_SCORING_DATA,
  playerId: string,
): PLAYER_INSTANCE_SCORING_DATA {
  const instances = allData[playerId];
  return instances[instances.length - 1];
}

/** Call once, from the login screen, when a player starts a new
 * play-through. Creates a fresh (empty) trial list for them. */
export function startNewScore(
  playerId: string,
  playerAge: string,
  playerLocation: string,
): void {
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
