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
   * When the player Id was entered and the game started.
   */
  age: string;
  /**
   * When the player Id was entered and the game started.
   */
  location: string;
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
  /**
   * The sum of all elapsed time over all levels
   */
  totalTime:number
};


export type PLAYER_SCORING_DATA = {
    Level0: {  tryData: tryData_basic[]} & LevelScoringData_basic;
    Level1: {  tryData: tryData_basic[]} & LevelScoringData_basic;
    Level2: {  tryData: tryData_advanced[]} & LevelScoringData_advanced;
    Level3: {  tryData: tryData_advanced[]} & LevelScoringData_advanced;

};
/**
 * Level 0 and Level 1 scoring data (without distractors therefore no distractorChoice)
 */
export type LevelScoringData_basic = { //level data
  tries: number;
  total_targetScore: number;
  total_distractorScore: number;
  levelScore: number;
  levelDuration: number;
};

export type tryData_basic = { //try data
    targetScore: number;
    distractorScore: number;
    firstClick: number;
    clickLocations: {
      x: number;
      y: number;
      timestamp: string;
      timestampUnix: number;
    }[];
    totalClicks: number;
    gem_location: string;
    startTime: string;
    startTimeUnix: string;
    endTime: string;
    endTimeUnix: string;
    tryDuration: number;
    correct: boolean;
};
/**
 * Level 2 and Level 3 scoring data (with distractors)
 */
export type LevelScoringData_advanced = { //level data
  tries: number;    
  total_targetScore: number;
  total_distractorScore: number;
  levelScore: number;
  levelDuration: number;
};


export type tryData_advanced = { //try data
    targetScore: number;
    distractorScore: number;
    firstClick: number;
    clickLocations: {
      x: number;
      y: number;
      timestamp: string;
      timestampUnix: number;
    }[];
    totalClicks: number;
    cupChoices: string; // e.g. left, right
    gem_locations: string;
    startTime: string;
    startTimeUnix: string;
    endTime: string;
    endTimeUnix: string;
    tryDuration: number;
    correct: boolean;
};


/**
 * Question: do we want the max sore in a try to be 1 (gems collected add up to a score of 1), or the score to be the number of gems collected in that attempt?
 * i think it makes sense for the score to be the total number of gems collected
 */



/**
 * functions
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
    start: new Date(),
    age: playerAge,
    location: playerLocation,
    scores: {
      Level0: { tryData: [], tries: 0, total_targetScore: 0, total_distractorScore: 0, levelScore: 0, levelDuration: 0 },
      Level1: { tryData: [], tries: 0, total_targetScore: 0, total_distractorScore: 0, levelScore: 0, levelDuration: 0 },
      Level2: { tryData: [], tries: 0, total_targetScore: 0, total_distractorScore: 0, levelScore: 0, levelDuration: 0 },
      Level3: { tryData: [], tries: 0, total_targetScore: 0, total_distractorScore: 0, levelScore: 0, levelDuration: 0 },


    },
    totalTries: 0,
    totalScore: 0,
    totalTime: 0,
  };

  if (currentData[playerId]) { // If the playerId already exists, append the new score data
    currentData[playerId].push(newScoreData);
  } else {
    currentData[playerId] = [newScoreData];
  }

  setScoringData(currentData);
}


function getScoreData(): ALL_SCORING_DATA {
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
  return latestPlayerData.totalScore;
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
    levelScoringData.tryData.push(scoringData as never); //push the scoring data into the tryData array
    levelScoringData.tries += scoringData.length; // totalTries 
    levelScoringData.total_targetScore += scoringData.reduce( // targetScore 
      (previousValue, currentValue) => previousValue + currentValue.targetScore, 0);
    levelScoringData.total_distractorScore += scoringData.reduce( // distractorScore
      (previousValue, currentValue) => previousValue + currentValue.distractorScore, 0);
    levelScoringData.levelScore += scoringData.reduce( //totalScore 
      (previousValue, currentValue) => previousValue + currentValue.targetScore + currentValue.distractorScore,
      0,
    );
    levelScoringData.levelDuration += scoringData.reduce( //totalTime
      (previousValue, currentValue) => previousValue + currentValue.tryDuration,
      0,
    );

    // Recalculate the overall aggregate data
    playerInstanceData.totalTries = 0;
    playerInstanceData.totalScore = 0;
    playerInstanceData.totalTime = 0;

    Object.keys(latestPlayerScoringData).forEach((key) => { //Update values across all levels
      const levelData = latestPlayerScoringData[key as keyof PLAYER_SCORING_DATA];
      playerInstanceData.totalTries += levelData.tries;
      playerInstanceData.totalScore += levelData.levelScore;
      playerInstanceData.totalTime += levelData.levelDuration;
    });

    setScoringData(allData);
  }
}