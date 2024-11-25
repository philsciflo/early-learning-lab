import { GAME_SCORE_DATA_KEY } from "./constants.ts";

/**
 * Scoring data by Player Id, potentially with multiple data sets per player from multiple plays or duplicate player Ids
 */
export type ALL_SCORING_DATA = Record<string, PLAYER_INSTANCE_SCORING_DATA[]>;

/**
 * Scoring data for an individual playerId occurrence i.e. one play through by the player
 */
export type PLAYER_INSTANCE_SCORING_DATA = {
  /**
   * When the player Id was entered and the game started.
   */
  start: Date;
  /**
   * The scoring data for this play-through i.e. all the attempts on all the levels before returning to the main menu
   */
  scores: PLAYER_SCORING_DATA;
  /**
   * The sum of all tries over all levels
   */
  totalTries: number;
  /**
   * The sum of all scores over all levels
   */
  totalScore: number;
};

export type COMMON_SCORING_DATA = {
  /**
   * The overall number of tries the player made for this level
   */
  tries: number;
  /**
   * The sum of all scores for all tries for this level
   */
  levelScore: number;
};

export type PLAYER_SCORING_DATA = {
  Level0: { tryData: Level0ScoringData[] } & COMMON_SCORING_DATA;
  Level1: { tryData: Level1ScoringData[] } & COMMON_SCORING_DATA;
  Level2: { tryData: Level2ScoringData[] } & COMMON_SCORING_DATA;
  Level3: { tryData: Level3ScoringData[] } & COMMON_SCORING_DATA;
  Level4: { tryData: Level4ScoringData[] } & COMMON_SCORING_DATA;
};

/**
 * How many apples were caught
 */
export type CaughtAppleCount = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * 1 if the apple was caught, else 0
 */
type AppleCaught = 0 | 1;

/**
 * Where the centre of the element was, relative to (0,0) top-left corner
 */
type Position = {
  x: number;
  y: number;
};

type BaseScoringData = {
  basket: Position;
};

export type Level0ScoringData = BaseScoringData & {
  score: CaughtAppleCount;
};

export type BinaryScoringData = BaseScoringData & {
  score: AppleCaught;
};

export type Level1ScoringData = BinaryScoringData;

export type Level2ScoringData = BinaryScoringData;

export type Level3ScoringData = BinaryScoringData;

export type Level4ScoringData = BinaryScoringData & {
  apple: Position;
};

export function removeScoreData(): void {
  localStorage.setItem(GAME_SCORE_DATA_KEY, "{}");
}

export function getScoreDataJSONString(): string {
  return localStorage.getItem(GAME_SCORE_DATA_KEY) ?? "{}";
}

export function startNewScore(playerId: string): void {
  const currentData = getScoreData();

  const newScoreData: PLAYER_INSTANCE_SCORING_DATA = {
    start: new Date(),
    scores: {
      Level0: { tryData: [], tries: 0, levelScore: 0 },
      Level1: { tryData: [], tries: 0, levelScore: 0 },
      Level2: { tryData: [], tries: 0, levelScore: 0 },
      Level3: { tryData: [], tries: 0, levelScore: 0 },
      Level4: { tryData: [], tries: 0, levelScore: 0 },
    },
    totalTries: 0,
    totalScore: 0,
  };
  if (currentData[playerId]) {
    currentData[playerId].push(newScoreData);
  } else {
    currentData[playerId] = [newScoreData];
  }

  setScoringData(currentData);
}

function getScoreData(): ALL_SCORING_DATA {
  // TODO consider validating the shape of the returned JSON
  return JSON.parse(getScoreDataJSONString());
}

function setScoringData(allData: ALL_SCORING_DATA) {
  localStorage.setItem(GAME_SCORE_DATA_KEY, JSON.stringify(allData));
}

export function getPlayerOverallScore(playerId: string): number {
  const latestPlayerData = getLatestPlayerData(getScoreData(), playerId);
  if (latestPlayerData.totalTries === 0) {
    return 0;
  }
  return latestPlayerData.totalScore / latestPlayerData.totalTries;
}

function getLatestPlayerData(allData: ALL_SCORING_DATA, playerId: string) {
  const playerData: PLAYER_INSTANCE_SCORING_DATA[] = allData[playerId];
  return playerData[playerData.length - 1];
}

export function storeScoringDataForPlayer(
  playerId: string,
  level: keyof PLAYER_SCORING_DATA,
  scoringData: PLAYER_SCORING_DATA[typeof level]["tryData"],
): void {
  if (scoringData.length > 0) {
    const allData: ALL_SCORING_DATA = getScoreData();
    const playerInstanceData = getLatestPlayerData(allData, playerId);

    const latestPlayerScoringData: PLAYER_SCORING_DATA =
      playerInstanceData.scores;
    const levelScoringData = latestPlayerScoringData[level];

    // Add data for this level
    levelScoringData.tryData.push(scoringData as never);
    levelScoringData.tries += scoringData.length;
    levelScoringData.levelScore += scoringData.reduce(
      (previousValue, currentValue) => previousValue + currentValue.score,
      0,
    );

    // Recalculate the overall aggregate data
    playerInstanceData.totalScore = 0;
    playerInstanceData.totalTries = 0;
    Object.keys(latestPlayerScoringData).forEach((key) => {
      const levelData =
        latestPlayerScoringData[key as keyof PLAYER_SCORING_DATA];
      playerInstanceData.totalScore += levelData.levelScore;
      playerInstanceData.totalTries += levelData.tries;
    });

    setScoringData(allData);
  }
}
