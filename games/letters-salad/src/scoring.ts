import { GAME_SCORE_DATA_KEY } from "./constants.ts";

/** Fields every trial has, regardless of which level produced it. */
export type BaseTrialData = {
  startTime: string;
  trialDurationMs: number;
  /** True if the trial ended via a facilitator control (Back / Continue)
   * rather than the child ever pressing "Check". */
  endedByFacilitator: boolean;
  /** 0-100, or null if the child never got a result (eg Back/Continue
   * pressed before checking). */
  score: number | null;
};

/** Level1: "Sort letters from symbols." The child drags a pile of
 * glyphs (a mix of uppercase letters and non-letter symbols) into one
 * of two drop zones. */
export type SortTrialData = BaseTrialData & {
  level: "Level1";
  sortGlyphCount: number;
  sortLetterCount: number;
  sortSymbolCount: number;
  /** Out of sortGlyphCount, or null if never checked. */
  sortCorrectCount: number | null;
};

/** Level2 (not built yet - stage 2): find/tap a named letter among
 * distractors. Shape reserved now so the union, recordTrial, and CSV
 * export don't need restructuring when Level2 lands. */
export type FindLetterTrialData = BaseTrialData & {
  level: "Level2";
  findTargetLetter: string | null;
  findAttemptCount: number | null;
  findCorrectCount: number | null;
};

/** Level3 (not built yet - stage 3): put letters into alphabet order.
 * Shape reserved now for the same reason as FindLetterTrialData. */
export type AlphabetOrderTrialData = BaseTrialData & {
  level: "Level3";
  orderSequenceLength: number | null;
  orderCorrectPositionCount: number | null;
};

export type TrialData =
  | SortTrialData
  | FindLetterTrialData
  | AlphabetOrderTrialData;

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

// One flat column set covering every level's trial shape - chosen now
// so it doesn't need revisiting as Level2/Level3 are added. Shared
// fields (level, startTime, trialDurationMs, endedByFacilitator,
// score) come first; each level's own fields are prefixed
// (sort*/find*/order*) so the same CSV sheet can hold rows from all
// three levels without any column name colliding across levels that
// happen to track a similarly-named thing (eg "correct count").
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
  "sortGlyphCount",
  "sortLetterCount",
  "sortSymbolCount",
  "sortCorrectCount",
  "findTargetLetter",
  "findAttemptCount",
  "findCorrectCount",
  "orderSequenceLength",
  "orderCorrectPositionCount",
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
  const base: CsvRow = {
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
    sortGlyphCount: null,
    sortLetterCount: null,
    sortSymbolCount: null,
    sortCorrectCount: null,
    findTargetLetter: null,
    findAttemptCount: null,
    findCorrectCount: null,
    orderSequenceLength: null,
    orderCorrectPositionCount: null,
  };

  switch (trial.level) {
    case "Level1":
      base.sortGlyphCount = trial.sortGlyphCount;
      base.sortLetterCount = trial.sortLetterCount;
      base.sortSymbolCount = trial.sortSymbolCount;
      base.sortCorrectCount = trial.sortCorrectCount;
      break;
    case "Level2":
      base.findTargetLetter = trial.findTargetLetter;
      base.findAttemptCount = trial.findAttemptCount;
      base.findCorrectCount = trial.findCorrectCount;
      break;
    case "Level3":
      base.orderSequenceLength = trial.orderSequenceLength;
      base.orderCorrectPositionCount = trial.orderCorrectPositionCount;
      break;
  }

  return base;
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
