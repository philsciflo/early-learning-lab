import { GAME_SCORE_DATA_KEY } from "./constants.ts";

/**
 * Data structures.
 */


//Scoring data by Player Id, potentially with multiple data sets per player from multiple plays or duplicate player Ids
export type ALL_SCORING_DATA = Record<string, PLAYER_INSTANCE_SCORING_DATA[]>;

//Scoring data for an individual playerId occurrence i.e. one play through by the player
export type PLAYER_INSTANCE_SCORING_DATA = {
    age: string;
    location: string;
    scores: PLAYER_SCORING_DATA;
}

//Storing game data specifically (including multiple attempts)
export type PLAYER_SCORING_DATA = {
  Level1: { tryData: BlockGameScoringData[]; tries: number};
  Level2: { tryData: BlockGameScoringData[]; tries: number};
  Level3: { tryData: BlockGameScoringData[]; tries: number};
  Level4: { tryData: BlockGameScoringData[]; tries: number};
  Level5: { tryData: BlockGameScoringData[]; tries: number};
  Level6: { tryData: BlockGameScoringData[]; tries: number};
  
};

//Storing one attempt at a level
export type BlockEvent = {
  blockName: string;
  pickup: Position;
  path: Position[];
  placement: Position;
};

export type BlockGameScoringData = {
  attemptId: string;
  stageId: string;

  blockEvents: BlockEvent[];   // now a flat list of events

  amountOfBlocksMoved: number;
  timeToEnd: number;
  structureCollapsed: boolean;
};

export type Position = {
  x: number;
  y: number;
  time: number;
};

/**
 * Functions
 */

export function removeScoreData(): void {
  localStorage.setItem(GAME_SCORE_DATA_KEY, "{}");
}

export function getScoreDataJSONString(): string {
  return localStorage.getItem(GAME_SCORE_DATA_KEY) ?? "{}";
}

export function startNewScore(playerId: string, playerAge: string, playerLocation: string): void {
  const currentData = getScoreData();

  const newScoreData: PLAYER_INSTANCE_SCORING_DATA = {
    age: playerAge,
    location: playerLocation,
    scores: {
      Level1: { tryData: [], tries: 0},
      Level2: { tryData: [], tries: 0},
      Level3: { tryData: [], tries: 0},
      Level4: { tryData: [], tries: 0},
      Level5: { tryData: [], tries: 0},
      Level6: { tryData: [], tries: 0},
    },
  };
  if (currentData[playerId]) { //If the player already exists, append the new playthrough to their existing array.
    currentData[playerId].push(newScoreData);
  } else {
    currentData[playerId] = [newScoreData];
  }

  setScoringData(currentData);
}

export function getScoreData(): ALL_SCORING_DATA {
  return JSON.parse(getScoreDataJSONString());
}

export function setScoringData(allData: ALL_SCORING_DATA) {
  localStorage.setItem(GAME_SCORE_DATA_KEY, JSON.stringify(allData));
}


export function getLatestPlayerData(allData: ALL_SCORING_DATA, playerId: string) {
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

    setScoringData(allData);
  }
}

//get score for gameover scene - update to show number of gifts saved/scores
export function getPlayerOverallScore(playerId: string): number {
  const latestPlayerData = getLatestPlayerData(getScoreData(), playerId);
  
  var totalTries = 0 ; 
  totalTries += latestPlayerData.scores.Level1.tries
  totalTries += latestPlayerData.scores.Level2.tries
  totalTries += latestPlayerData.scores.Level3.tries
  totalTries += latestPlayerData.scores.Level4.tries
  totalTries += latestPlayerData.scores.Level5.tries
  totalTries += latestPlayerData.scores.Level5.tries

  
  return totalTries;
}