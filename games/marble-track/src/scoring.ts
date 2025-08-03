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
  scores: PLAYER_SCORING_DATA[]; // Each level playthrough is an object
  /**
   * The sum of all tries over all levels
   */
  totalTries: number;
  /**
   * The sum of all scores over all levels
   */
  totalScore: number;

  totalTries_noIntro: number;
  totalScore_noIntro: number;
};




export type PLAYER_SCORING_DATA = {
  level: keyof LEVEL_TRYDATA_MAP;
  attempt: number;
  scoringData: LevelScoringData[];
  levelScore: number;
  duration: number;
};

type Position = {
  x: number;
  y: number;
};

export type BaseScoringData = {
  marble: Position;
};

export type LevelScoringData = {
  tries: number;    
  score: number;  
  duration: number;
};

export type TrackPathPoint = {
  trackId: string;  // "track-0", "track-1", etc.
  x: number;
  y: number;
  time: number;     // milliseconds since level start
}

export type Level0ScoringData = LevelScoringData;

export type Level1IntroScoringData = LevelScoringData;
export type Level1ScoringData = LevelScoringData & {
  path?: {x: number, y: number, time: number}[];
};

export type Level2IntroScoringData = LevelScoringData;
export type Level2ScoringData = LevelScoringData;

export type Level3IntroScoringData = LevelScoringData;

export type Level3ScoringData = LevelScoringData & {
  trackPaths?: TrackPathPoint[]; // Simple array of all track movements
};
export type Level4ScoringData = LevelScoringData & {
  path?: {x: number, y: number, time: number}[];
  DropToDragDuration?: number;
};


// Mapping
export type LEVEL_TRYDATA_MAP = {
  Level0: Level0ScoringData[];
  Level1Intro: Level1IntroScoringData[];
  Level1: Level1ScoringData[];
  Level2Intro: Level2IntroScoringData[];
  Level2: Level2ScoringData[];
  Level3Intro: Level3IntroScoringData[];
  Level3: Level3ScoringData[];
  Level4: Level4ScoringData[];
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
    scores: [],
    totalTries: 0,
    totalScore: 0,
    totalTries_noIntro: 0,
    totalScore_noIntro: 0,
  };

  if (currentData[playerId]) {
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
  return 100 * latestPlayerData.totalScore_noIntro / latestPlayerData.totalTries_noIntro;
}

function getLatestPlayerData(allData: ALL_SCORING_DATA, playerId: string) {
  const playerData: PLAYER_INSTANCE_SCORING_DATA[] = allData[playerId];
  return playerData[playerData.length - 1];
}

 export function storeScoringDataForPlayer(
   playerId: string,
   level: keyof LEVEL_TRYDATA_MAP,
   attempt: number,
   scoringData: LevelScoringData[],
   levelScore: number,
    duration: number,
 ): void {
   const allData: ALL_SCORING_DATA = getScoreData();
   const playerInstanceData = getLatestPlayerData(allData, playerId);

   let currentLevelData = playerInstanceData.scores.find(
     (s) => s.level === level && s.attempt === attempt,
   );

   if (!currentLevelData) {
   currentLevelData = { level, attempt, scoringData: [...scoringData], levelScore, duration };
     playerInstanceData.scores.push(currentLevelData);
   } else {
     currentLevelData.levelScore = levelScore;

   currentLevelData.scoringData.push(...scoringData);

    if (duration !== undefined) {
      currentLevelData.duration = currentLevelData.scoringData.reduce(
        (sum, d) => sum + d.duration,
        0
      );
    }
   }

   

   //  // Updates total score and tries
   playerInstanceData.totalTries += scoringData.length;
   playerInstanceData.totalScore += scoringData.reduce((sum, d) => sum + d.score, 0);
   if (!/^Level[123]Intro$/.test(level)) {
     playerInstanceData.totalTries_noIntro += scoringData.length;
     playerInstanceData.totalScore_noIntro += scoringData.reduce((sum, d) => sum + d.score, 0);
   }

   setScoringData(allData);
 }


