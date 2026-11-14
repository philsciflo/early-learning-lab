import { GAME_SCORE_DATA_KEY } from "./constants.ts";
import { ShapeType } from "./shapes.ts";

/** Fields every trial has, regardless of which level produced it. */
export type BaseTrialData = {
  startTime: string;
  trialDurationMs: number;
  /** True if the trial ended via a facilitator control (Back / Continue)
   * rather than the child ever tapping a number button. */
  endedByFacilitator: boolean;
  /** 0-100, or null if the child never got a result (eg Back/Continue
   * pressed before answering). */
  score: number | null;
};

/** Level1: "Count the objects." The child sees countObjectCount
 * instances of a single randomly-chosen shape, scattered in a loose
 * cluster, and taps the number button matching how many they counted.
 * Single-trial, binary-scored - there's nothing to partially credit in
 * a single count-and-select decision (same pattern as letters-salad's
 * Level2 find-the-letter task). */
export type CountTrialData = BaseTrialData & {
  level: "Level1";
  countObjectCount: number;
  countShapeType: ShapeType;
  countSelectedAnswer: number | null;
  countCorrect: boolean | null;
};

export type TrialData = CountTrialData;

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

const CSV_COLUMNS = [
  "playerId",
  "age",
  "location",
  "playthroughStart",
  "trialIndex",
  "level",
  "startTime",
  "trialDurationMs",
  "endedByFacilitator",
  "score",
  "countObjectCount",
  "countShapeType",
  "countSelectedAnswer",
  "countCorrect",
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
  return {
    playerId,
    age,
    location,
    playthroughStart,
    trialIndex,
    level: trial.level,
    startTime: trial.startTime,
    trialDurationMs: trial.trialDurationMs,
    endedByFacilitator: trial.endedByFacilitator,
    score: trial.score,
    countObjectCount: trial.countObjectCount,
    countShapeType: trial.countShapeType,
    countSelectedAnswer: trial.countSelectedAnswer,
    countCorrect: trial.countCorrect,
  };
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

/** Call once per trial, when it concludes (Continue / Back). Appends the
 * full trial record in a single write. */
export function recordTrial(playerId: string, trial: TrialData): void {
  const allData = getScoreData();
  const instance = getLatestPlayerInstance(allData, playerId);
  instance.trials.push(trial);
  setScoreData(allData);
}
