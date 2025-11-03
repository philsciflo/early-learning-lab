## Scoring System (`scoring.ts`)

This module manages **all scoring data** for the game. It is responsible for recording player attempts, scores, and durations across all levels, and storing/retrieving this data in `localStorage`.

### Data Structures

- **`ALL_SCORING_DATA`**  
  A map of `playerId → [PLAYER_INSTANCE_SCORING_DATA]`.  
  Each `PLAYER_INSTANCE_SCORING_DATA` represents one complete playthrough by a player.

- **`PLAYER_INSTANCE_SCORING_DATA`**  
  Tracks data for a single playthrough:  
  - `age`: when the game started  
  - `location`: where the game is played
  - `scores`: per-level scoring data (`PLAYER_SCORING_DATA`)  

- **`PLAYER_SCORING_DATA`**  
  Stores level-specific scoring data for Levels 0–4 and Level0Drop–Level4Drop.  
  Each level tracks:  
  - `tryData`: list of scoring attempts for that level (BlockGameStoringData)  
  - `tries`: total tries for that level  

- **`BlockGameScoringData`**  
  Stores data for each level
  - `attemptId`: how many times this level has been attempted
  - `stageId`: name of the level
  - `blockEvents`: list of (`BlockEvent`)
  - `amountOfBlocksMoved`: total amount of block movement events
  - `timeToEnd`: when the level ends
  - `structureCollapsed`: is `True` when the structure collapsed and the level is failed.

- **`BlockEvent`**  
  Stores block movement data (from pickup to placement)
  - `blockName`: name of block moved 
  - `pickup`: position of block when picked up (`Position`)
  - `path`: position(s) of block while being dragged (`Position` list)
  - `placement`: position of block when placed down (`Position`)

- **`Position`**  
  Stores position of block
  - `x`: x coordinate of block
  - `y`: y coordinate of block
  - `time`: time that block was in this position (in seconds)

### Key Functions

- **`removeScoreData()`**  
  Clears all saved score data in `localStorage`.

- **`getScoreDataJSONString()`**  
  Returns the raw JSON string of the stored score data.

- **`startNewScore(playerId: string)`**  
  Creates a new empty scoring record for the given player, initializing all levels.

- **`getPlayerOverallScore(playerId: string): number`**  
  Returns the player’s average score per try across all levels.

- **`storeScoringDataForPlayer(playerId, level, scoringData)`**  
  Appends scoring data for a given level, updates per-level aggregates (tries, score, duration), and recalculates totals for the entire playthrough.

### Storage

All data is saved in `localStorage` under the key defined by `GAME_SCORE_DATA_KEY`.  
The structure is:

```json
{
  "123456": [
    {
      "age": "2",
      "location": "Home",
      "scores": {
        "Level1": {
          "tryData": [
            [
              {
                "attemptId": 1,
                "stageId": "Level1",
                "blockEvents": [
                  {
                    "blockName": "BlockOne",
                    "pickup": {
                      "x": 1700,
                      "y": 732,
                      "time": 0.694
                    },
                    "path": [],
                    "placement": {
                      "x": 1112,
                      "y": 844,
                      "time": 1.313
                    }
                  },
                  {
                    "blockName": "BlockTwo",
                    "pickup": {
                      "x": 1700,
                      "y": 892,
                      "time": 1.75
                    },
                    "path": [],
                    "placement": {
                      "x": 1126,
                      "y": 726,
                      "time": 2.312
                    }
                  }
                ],
                "amountOfBlocksMoved": 2,
                "timeToEnd": 9.91,
                "structureCollapsed": false
              }
            ]
          ],
          "tries": 1
        },
        "Level2": {
          "tryData": [
            [
              {
                "attemptId": 0,
                "stageId": "Level2",
                "blockEvents": [],
                "amountOfBlocksMoved": 0,
                "timeToEnd": 0.14590000000000145
              }
            ]
          ],
          "tries": 1
        },
        "Level3": {
          "tryData": [
            [
              {
                "attemptId": 0,
                "stageId": "Level3",
                "blockEvents": [],
                "amountOfBlocksMoved": 0,
                "timeToEnd": 0.15979999999999928
              }
            ]
          ],
          "tries": 1
        },
        "Level4": {
          "tryData": [
            [
              {
                "attemptId": 0,
                "stageId": "Level4",
                "blockEvents": [],
                "amountOfBlocksMoved": 0,
                "timeToEnd": 0.153
              }
            ]
          ],
          "tries": 1
        },
        "Level5": {
          "tryData": [
            [
              {
                "attemptId": 0,
                "stageId": "Level5",
                "blockEvents": [],
                "amountOfBlocksMoved": 0,
                "timeToEnd": 0.18759999999999855
              }
            ]
          ],
          "tries": 1
        },
        "Level6": {
          "tryData": [
            [
              {
                "attemptId": 0,
                "stageId": "Level6",
                "blockEvents": [],
                "amountOfBlocksMoved": 0,
                "timeToEnd": 0.22929999999999928
              }
            ]
          ],
          "tries": 1
        }
      }
    }
  ]
}
```

### Extending the Scoring System

If you create a **new level**, you must update the scoring system to record its data correctly.  
For example, when adding **Level5**:

1. **Update `PLAYER_SCORING_DATA`**  
   Add a new entry for the level:
   ```ts
   export type PLAYER_SCORING_DATA = {
     Level7: { tryData: BlockGameScoringData[]; tries: number};
   };

2. **Initialize the new level in startNewScore()**
   Add empty entries for the new level so data can be recorded:
   ```ts
   scores: {
      Level7: { tryData: [], tries: 0},
    },

3. **Use recordScoreDataForCurrentTry() when recording data**

   Define **recordScoreDataForCurrentTry()** in Level7.ts to define the content of scoringData.
   example:
   ```ts
   protected recordScoreDataForCurrentTry(): BlockGameScoringData {
    //Combining pickup, placement, and blocknames into one blockEvents array.
    const blockEvents = this.startPositionList.map((pickup, index) => ({
      blockName: this.blockNameList[index],
      pickup: pickup,
      path: this.middlePositionList[index],
      placement: this.endPositionList[index],
    }));

    return {
      attemptId: this.registry.get(this.levelTriesDataKey),
      stageId: this.key,
      blockEvents: blockEvents,
      amountOfBlocksMoved: this.numberOfBlocksMoved,
      timeToEnd: (this.time.now - this.time.startTime) / 1000,
      structureCollapsed: this.didStructureCollapse(),
    };
  }

