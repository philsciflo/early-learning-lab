## Scoring System (`scoring.ts`)

This module manages **all scoring data** for the game. It is responsible for recording player attempts, scores, and durations across all levels, and storing/retrieving this data in `localStorage`.

### Data Structures

- **`ALL_SCORING_DATA`**  
  A map of `playerId → [PLAYER_INSTANCE_SCORING_DATA]`.  
  Each `PLAYER_INSTANCE_SCORING_DATA` represents one complete playthrough by a player.

- **`PLAYER_INSTANCE_SCORING_DATA`**  
  Tracks data for a single playthrough:  
  - `start`: when the game started  
  - `scores`: per-level scoring data (`PLAYER_SCORING_DATA`)  
  - `totalTries`: total number of tries across all levels  
  - `totalScore`: total score across all levels  

- **`PLAYER_SCORING_DATA`**  
  Stores level-specific scoring data for Levels 0–4 and Level0Drop–Level4Drop.  
  Each level tracks:  
  - `tryData`: list of scoring attempts for that level  
  - `tries`: total tries for that level  
  - `levelScore`: total score for that level  
  - `totalDuration`: total time spent on that level  

- **Level Scoring Types**  
  - `LevelXScoringData`: basket-based levels (record basket path and scoring)  
  - `LevelXDropScoringData`: drop-based levels (record apple path and scoring)  

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
  "player123": [
    {
      "start": "2025-08-25T09:30:00.000Z",
      "scores": {
        "Level1": { 
          "tryData": [...], 
          "tries": 3, 
          "levelScore": 5, 
          "totalDuration": 12000 
        },
        "Level2": { 
          "tryData": [...], 
          "tries": 1, 
          "levelScore": 1, 
          "totalDuration": 4000 
        }
      },
      "totalTries": 4,
      "totalScore": 6
    }
  ]
}
```

### Extending the Scoring System

If you create a **new level**, you must update the scoring system to record its data correctly.  
For example, when adding **Level5**:

1. **Update `PLAYER_SCORING_DATA`**  
   Add a new entry for the level and its corresponding `Drop` level:
   ```ts
   export type PLAYER_SCORING_DATA = {
     Level5: { tryData: Level5ScoringData[] } & COMMON_SCORING_DATA;
     Level5Drop: { tryData: Level5DropScoringData[] } & COMMON_SCORING_DATA;
   };```

2. **Define new scoring data types**
   Create Level5ScoringData and/or Level5DropScoringData types.
```ts
   export type Level5ScoringData = basketData & scoringData & {
     specialField?: string; // add custom fields if needed
   };
   export type Level5DropScoringData = appleData & scoringData & {
     pipeLayout?: 0 | 1 | 2;
   };
```
3. **Initialize the new level in startNewScore()**
   Add empty entries for the new level so data can be recorded:
```ts
   Level5: { tryData: [], tries: 0, levelScore: 0, totalDuration: 0 },
   Level5Drop: { tryData: [], tries: 0, levelScore: 0, totalDuration: 0 },
```

4. **Use storeScoringDataForPlayer() when recording data**
   Pass the new level key ("Level5" or "Level5Drop") and the scoring data array.
   ```ts
   storeScoringDataForPlayer(playerId, "Level5", [newScoringData]);
```
