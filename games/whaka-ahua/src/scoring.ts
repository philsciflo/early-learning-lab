import { GAME_SCORE_DATA_KEY } from "./constants.ts";

/** Level1: the child traces a reference triangle freehand. Scored by
 * triangleScoring.ts's pixel-free Chamfer-style distance, run once per
 * "Check" press - `attempts` counts how many times they pressed it
 * (eg after Clear-ing and retrying) before moving on. */
export type TriangleTrialData = {
  level: "Level1";
  startTime: string;
  trialDurationMs: number;
  /** True if the trial ended via a facilitator control (Back / Continue)
   * rather than the child ever pressing "Check". */
  endedByFacilitator: boolean;
  attempts: number;
  drawnPointCount: number;
  /** Layer 1: categorical "is this even triangle-shaped?" check. */
  shapeMatch: boolean;
  /** Layer 2: continuous 0-100 accuracy number, banded by `shapeMatch`
   * so every match outscores every mismatch - null only when there
   * were too few drawn points to compute anything at all. */
  accuracyScore: number | null;
  /** The same continuous score *before* the `shapeMatch` band was
   * applied - kept for research/data-analysis so the underlying
   * geometric signal isn't lost to the banding transform. Null
   * alongside `accuracyScore` when nothing could be computed. */
  rawAccuracyScore: number | null;
  meanRefToDraw: number | null;
  meanDrawToRef: number | null;
  /** PNG data URL of the rasterized drawn polyline (see
   * renderDrawing.ts), or null when there was no valid attempt to
   * rasterize. Deliberately excluded from CSV_COLUMNS below - a full
   * base64 PNG per row would break CSV/spreadsheet usability - so it
   * only lives in the JSON/localStorage record. */
  drawnImageDataUrl: string | null;
};

export type TrialData = TriangleTrialData;

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
  "attempts",
  "drawnPointCount",
  "shapeMatch",
  "accuracyScore",
  "rawAccuracyScore",
  "meanRefToDraw",
  "meanDrawToRef",
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
    attempts: trial.attempts,
    drawnPointCount: trial.drawnPointCount,
    shapeMatch: trial.shapeMatch,
    accuracyScore: trial.accuracyScore,
    rawAccuracyScore: trial.rawAccuracyScore,
    meanRefToDraw: trial.meanRefToDraw,
    meanDrawToRef: trial.meanDrawToRef,
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
