import {DataCollector} from "./DataCollector.ts";

/**
 * Stores all game data collected of the current player ID. A player ID can have
 * multiple playthrough of the game. Each playthrough is a PLAYTHROUGH_DATA object.
 */
export type ALL_GAME_DATA = Record<string, PLAYTHROUGH_DATA[]>;


/**
 * Object that stores scoring data for the current playthrough.
 *
 * gameStartTime =  The time the player ID was entered and the game started.
 * levelData =      Stores the scoring data of the current playthrough. Each level is a LEVEL_DATA object.
 * totalAttempts =  Stores the sum of all attempts
 * totalScore =     Stores the sum of all scores.
 */
export type PLAYTHROUGH_DATA = {
    playerAge: number | null;
    playerLocation: string | null;
    gameStartTime: Date;
    levelData: LEVEL_DATA[];
    totalAttempts: number;
    totalScore: number;
};


/**
 * Object that stores the current level attempt data.
 *
 * levelName =          Current level.
 * score =              Score for current level.
 * resetCount =         Number of times the player reset the level.
 * levelStartTime =     The current level's start time.
 * attemptData =        Stores the attempt data for the current level. Each attempt is an ATTEMPT_DATA object.
 */
export type LEVEL_DATA = {
    levelName: string;
    score: number;
    resetCount: number;
    levelStartTime: Date;
    attemptData: ATTEMPT_DATA[];
};


/**
 * Object that stores the current attempt data.
 *
 * attemptNumber =      The current attempt number.
 * duration =           Time taken for current level.
 * mouseClicks =        Array of mouse click locations.
 * mouseLocation =      Array of mouse location at each given interval.
 */
export type ATTEMPT_DATA = {
    attemptNumber: number;
    duration: number;
    mouseClicks: ClickRecord[];
    mouseLocation: MouseRecord[];
}


interface ClickRecord {
    level: number;
    cupId: number;
    time: number;
    correct: boolean;
}


interface MouseRecord {
    level: number;
    x: number;
    y: number;
    time: number;
}


/**
 * =====================================================================
 */


/**
 * Returns the data stored in localStorage with key GAME_SCORE_DATA_KEY else returns
 * an empty object string if value is null or undefined.
 */
export function getScoreDataJSONString(): string {
    return localStorage.getItem("magic-cups-data") ?? "{}";
}


/**
 *  Calls getScoreDataJSONString() to read the game data from localStorage.
 *  Then parses the string into ALL_SCORING_DATA object.
 */
function getScoreData(): ALL_GAME_DATA {
    return JSON.parse(getScoreDataJSONString());
}


/**
 * Gets the scoring data for current ID.
 *
 * @param allData All Scoring Data
 * @param playerID Current ID
 */
export function getCurrentPlayerData(allData: ALL_GAME_DATA, playerID: string) {
    const playerData: PLAYTHROUGH_DATA[] = allData[playerID];
    return playerData[playerData.length - 1];
}


/**
 * Converts the allData: ALL_SCORING_DATA object into JSON string, then add to
 * local storage.
 */
function storeLocalStorage(allData: ALL_GAME_DATA) {
    localStorage.setItem("magic-cups-data", JSON.stringify(allData));
}


/**
 * Sets GAME_SCORE_DATA_KEY to empty object in the localStorage
 */
export function deleteLocalScore(): void {
    localStorage.setItem("magic-cups-data", "{}");
}


/**
 * ==================== Scoring ====================
 */


/**
 * Creates a new empty PLAYTHROUGH_DATA object for a new game playthrough.
 *
 * @param playerID
 */
export function startNewScore(playerID: string): void {
    const currentData = getScoreData();
    const newScoreData: PLAYTHROUGH_DATA = {
        playerAge: DataCollector.playerAge,
        playerLocation: DataCollector.playerLocation,
        gameStartTime: new Date,
        levelData: [],
        totalAttempts: 0,
        totalScore: 0
    }

    // Add data to current or new player ID
    if (currentData[playerID]) currentData[playerID].push(newScoreData);
    else currentData[playerID] = [newScoreData];

    storeLocalStorage(currentData);
}


/**
 * The storeScoringDataForPlayer() function gets called every time a scene ends in order
 * to store the current level's score data into the overall score data for the current player.
 *
 * @param playerID
 * @param levelName
 * @param score
 * @param resetCount
 * @param levelStartTime
 * @param attemptData
 */
export function storeScoringData(
    playerID: string,
    levelName: string,
    score: number,
    resetCount: number,
    levelStartTime: Date,
    attemptData: ATTEMPT_DATA[]
): void {
    const allData: ALL_GAME_DATA = getScoreData();
    const currentPlayerData = getCurrentPlayerData(allData, playerID);

    let currentLevelData = currentPlayerData.levelData.find(
        s => s.levelName === levelName
    );

    // Create new Level_Data object if first attempt
    if (!currentLevelData) {
        currentLevelData = {
            levelName,
            score,
            resetCount,
            levelStartTime,
            attemptData
        };
        currentPlayerData.levelData.push(currentLevelData);
    }
    // Otherwise update data
    else {
        currentLevelData.score = score;
        currentLevelData.resetCount = resetCount;
        currentLevelData.attemptData = attemptData;
    }

    // Updates total score and tries
    currentPlayerData.totalScore += score;
    currentPlayerData.totalAttempts += resetCount;
    storeLocalStorage(allData);
}


export function getAttemptData(playerID: string, levelName: string) {
    const allData: ALL_GAME_DATA = getScoreData();
    const currentPlayerData = getCurrentPlayerData(allData, playerID);
    let currentLevelData = currentPlayerData.levelData.find(
        s => s.levelName === levelName
    );

    if (currentLevelData == undefined) {
        return [];
    }
    return currentLevelData.attemptData;
}

/**
 * Downloads the scoring data into a JSON file by getting the stored the score data and
 * parsing it into a JSON file.
 */
export function downloadScoreDataJSON() {
    const jsonString = JSON.stringify(
        JSON.parse(getScoreDataJSONString()),
        null,
        4,
    );
    const blob = new Blob([jsonString], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "magic_cups_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

