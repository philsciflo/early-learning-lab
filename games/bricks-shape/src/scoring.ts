import { GAME_SCORE_DATA_KEY } from "./constants.ts";

/**
 * Scoring data by Player Id pairs, potentially with multiple data sets per player pair from multiple plays or duplicate player Id combinations
 */
export type ALL_SCORING_DATA = Record<string, PLAYER_INSTANCE_SCORING_DATA[]>;

/**
 * Scoring data for an individual player id pair occurrence i.e. one play through by the player pair
 */
export type PLAYER_INSTANCE_SCORING_DATA = {
  /**
   * When the player Ids were entered and the game started.
   */
  start: Date;
  /**
   * The scoring data for this play-through i.e. all the attempts on all the levels before returning to the main menu
   */
  scores: PLAYER_SCORING_DATA;
  /**
   * The sum of all correct shapes over all levels
   */
  totalShapes: number;
  /**
   * The sum of all elapsed time over all levels
   */
  totalTime: number;
};

export type LevelScoringData = {
  /**
   * True if the player correctly completed the shape, else false
   */
  complete: boolean;
  /**
   * How long the player spent on this attempt, in seconds.
   */
  time: number;
};

export type COMMON_SCORING_DATA = {
  totalShapes: number;
  totalTime: number;
};

export type PLAYER_SCORING_DATA = {
  PlayerA: { tryData: LevelScoringData[] } & COMMON_SCORING_DATA;
  PlayerB: { tryData: LevelScoringData[] } & COMMON_SCORING_DATA;
  Combo: { tryData: LevelScoringData[] } & COMMON_SCORING_DATA;
};

export function removeScoreData(): void {
  localStorage.setItem(GAME_SCORE_DATA_KEY, "{}");
}

export function getScoreDataJSONString(): string {
  return localStorage.getItem(GAME_SCORE_DATA_KEY) ?? "{}";
}

export function startNewScore(playerPairId: string): void {
  const currentData = getScoreData();

  const newScoreData: PLAYER_INSTANCE_SCORING_DATA = {
    start: new Date(),
    scores: {
      PlayerA: { tryData: [], totalShapes: 0, totalTime: 0 },
      PlayerB: { tryData: [], totalShapes: 0, totalTime: 0 },
      Combo: { tryData: [], totalShapes: 0, totalTime: 0 },
    },
    totalShapes: 0,
    totalTime: 0,
  };
  if (currentData[playerPairId]) {
    currentData[playerPairId].push(newScoreData);
  } else {
    currentData[playerPairId] = [newScoreData];
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

export function getPlayerOverallScore(playerIdPair: string): {
  totalShapes: number;
  totalTime: number;
} {
  // final 'score' is just to give the kids a sense of winning
  // overall number of shapes completed across all levels
  // overall time spent on all levels
  const latestPlayerData = getLatestPlayerData(getScoreData(), playerIdPair);
  return {
    totalShapes: latestPlayerData.totalShapes,
    totalTime: latestPlayerData.totalTime,
  };
}

function getLatestPlayerData(allData: ALL_SCORING_DATA, playerIdPair: string) {
  const playerData: PLAYER_INSTANCE_SCORING_DATA[] = allData[playerIdPair];
  return playerData[playerData.length - 1];
}

export function storeScoringDataForPlayers(
  playerIdPair: string,
  level: keyof PLAYER_SCORING_DATA,
  scoringData: LevelScoringData[],
): void {
  if (scoringData.length > 0) {
    const allData: ALL_SCORING_DATA = getScoreData();
    const playerPairInstanceData = getLatestPlayerData(allData, playerIdPair);

    const latestPlayerScoringData: PLAYER_SCORING_DATA =
      playerPairInstanceData.scores;
    const levelScoringData = latestPlayerScoringData[level];

    // Add data for this level
    levelScoringData.tryData.push(...scoringData);
    levelScoringData.totalShapes += scoringData.reduce(
      (previousValue, currentValue) =>
        previousValue + (currentValue.complete ? 1 : 0),
      0,
    );
    levelScoringData.totalTime += scoringData.reduce(
      (previousValue, currentValue) => previousValue + currentValue.time,
      0,
    );

    // Recalculate the overall aggregate data
    playerPairInstanceData.totalShapes = 0;
    playerPairInstanceData.totalTime = 0;
    Object.keys(latestPlayerScoringData).forEach((key) => {
      const levelData =
        latestPlayerScoringData[key as keyof PLAYER_SCORING_DATA];
      playerPairInstanceData.totalShapes += levelData.totalShapes;
      playerPairInstanceData.totalTime += levelData.totalTime;
    });

    setScoringData(allData);
  }
}
