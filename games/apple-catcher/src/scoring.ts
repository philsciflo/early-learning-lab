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
};

export type TRIES_SCORING_DATA = {
  /**
   * The overall number of tries the player made for this level
   */
  count: number;
};

export type PLAYER_SCORING_DATA = {
  Level0: { tries: Level1ScoringData[] } & TRIES_SCORING_DATA;
  Level1: { tries: Level1ScoringData[] } & TRIES_SCORING_DATA;
  Level2: { tries: Level1ScoringData[] } & TRIES_SCORING_DATA;
  Level3: { tries: Level1ScoringData[] } & TRIES_SCORING_DATA;
  Level4: { tries: Level1ScoringData[] } & TRIES_SCORING_DATA;
};

export type Level1ScoringData = {
  // Where the basket was, relative to (0,0) top-left corner
  basket: {
    x: number;
    y: number;
  };
  // 1 if the apple was caught, else 0
  score: 0 | 1;
};

export type Level2ScoringData = {
  // Where the basket was, relative to (0,0) top-left corner
  basket: {
    x: number;
    y: number;
  };
  // 1 if the apple was caught, else 0
  score: 0 | 1;
};

export type Level3ScoringData = {
  // Where the basket was, relative to (0,0) top-left corner
  basket: {
    x: number;
    y: number;
  };
  // 1 if the apple was caught, else 0
  score: 0 | 1;
};

export type Level4ScoringData = {
  // Where the apple was, relative to (0,0) top-left corner
  apple: {
    x: number;
    y: number;
  };
  // Where the basket was, relative to (0,0) top-left corner
  basket: {
    x: number;
    y: number;
  };
  // 1 if the apple was caught, else 0
  score: 0 | 1;
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
      Level0: { tries: [], count: 0 },
      Level1: { tries: [], count: 0 },
      Level2: { tries: [], count: 0 },
      Level3: { tries: [], count: 0 },
      Level4: { tries: [], count: 0 },
    },
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

export function storeScoringDataForPlayer(
  playerId: string,
  level: keyof PLAYER_SCORING_DATA,
  scoringData: PLAYER_SCORING_DATA[typeof level]["tries"],
): void {
  if (scoringData.length > 0) {
    const allData: ALL_SCORING_DATA = getScoreData();
    const playerData: PLAYER_INSTANCE_SCORING_DATA[] = allData[playerId];
    const latestPlayData: PLAYER_SCORING_DATA =
      playerData[playerData.length - 1].scores;
    latestPlayData[level].tries =
      latestPlayData[level].tries.concat(scoringData);
    latestPlayData[level].count += scoringData.length;

    setScoringData(allData);
  }
}
