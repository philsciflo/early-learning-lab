# Phaser Vite TypeScript Template

This Phaser 3 project template uses [Vite](https://vitejs.dev/) for bundling. It supports hot-reloading for quick development workflow, includes [TypeScript](https://www.typescriptlang.org/). support and scripts to generate production-ready builds.

It is adapted from https://github.com/phaserjs/template-vite-ts

## Available Commands

| Command        | Description                                    |
| -------------- | ---------------------------------------------- |
| `yarn install` | Install project dependencies                   |
| `yarn dev`     | Launch a development web server                |
| `yarn build`   | Create a production build in the `dist` folder |

## Writing Code

After duplicating the folder, run `yarn install` from this directory.
Then, you can start the local development server by running `yarn dev`.

The local development server runs on [localhost](http://localhost:8080) by default.

Once the server is running you can edit any of the files in the `src` folder. Vite will automatically recompile your code and then reload the browser.

## Template Project Structure

We have provided a default project structure to get you started. This is as follows:

- `index.html` - A basic HTML page to contain the game.
- `src` - Contains the game source code.
- `src/main.ts` - The main **entry** point. This contains the game configuration and starts the game.
- `src/vite-env.d.ts` - Global TypeScript declarations, provide types information.
- `src/scenes/` - The Phaser Scenes are in this folder.
- `public/style.css` - Some simple CSS rules to help with page layout.
- `public/assets` - Contains the static assets used by the game.

## Handling Assets

Vite supports loading assets via JavaScript module `import` statements.

This template provides support for both embedding assets and also loading them from a static folder. To embed an asset, you can import it at the top of the JavaScript file you are using it in:

```js
import logoImg from "./assets/logo.png";
```

To load static files such as audio files, videos, etc place them into the `public/assets` folder. Then you can use this path in the Loader calls within Phaser:

```js
preload();
{
  //  This is an example of an imported bundled image.
  //  Remember to import it at the top of this file
  this.load.image("logo", logoImg);

  //  This is an example of loading a static image
  //  from the public/assets folder:
  this.load.image("background", "assets/bg.png");
}
```

When you issue the `yarn build` command, all static assets are automatically copied to a game-specific sub-folder in the `docs` folder to be served by Jekyll.


## Scoring System (`scoring.ts`)

This module manages all **scoring data** for the game, It is responsible for recording player attempts, scores, and durations across all levels, and storing/retrieving this data in `localStorage`.

## Data Structures
### `ALL_SCORING_DATA`
A map of `playerId → [PLAYER_INSTANCE_SCORING_DATA]`.  
Each `PLAYER_INSTANCE_SCORING_DATA` represents one complete playthrough by a player.

### `PLAYER_INSTANCE_SCORING_DATA`
Tracks data for a single playthrough:
- `start`: when the game started  
- `age`: player-reported age at start  
- `location`: player-reported location at start  
- `scores`: per-level scoring data (`PLAYER_SCORING_DATA`)  
- `totalTries`: total number of tries across all levels  
- `totalScore`: total score across all levels  
- `totalTime`: total elapsed time across all levels

### `PLAYER_SCORING_DATA`
Stores level-specific scoring data for Magic Cups levels:
- `Level0`: `{ tryData: tryData_basic[] } & LevelScoringData_basic`
- `Level1`: `{ tryData: tryData_basic[] } & LevelScoringData_basic`
- `Level2`: `{ tryData: tryData_advanced[] } & LevelScoringData_advanced`
- `Level3`: `{ tryData: tryData_advanced[] } & LevelScoringData_advanced`

### Level Scoring Types
#### `LevelScoringData_basic`
A collection of tries for levels without distractors:
- `tries`, `total_targetScore`, `total_distractorScore`, `levelScore`, `levelDuration`

#### `tryData_basic`
Per-try payload used by `Level0` and `Level1`:
- `targetScore`, `distractorScore` (always 0 for basic levels)
- `firstClick` (seconds)
- `clickLocations` (list of `{ x, y, timestamp, timestampUnix }`)
- `totalClicks`, `gem_location` (e.g. “left cup", "right cup”)
- `startTime`, `startTimeUnix`, `endTime`, `endTimeUnix`
- `tryDuration` (seconds), `correct` (boolean)

#### `LevelScoringData_advanced`
A collection of tries for levels with distractors:
- `tries`, `total_targetScore`, `total_distractorScore`, `levelScore`, `levelDuration`

#### `tryData_advanced`
Per-try payload used by `Level2` and `Level3`:
- `targetScore`, `distractorScore`
- `firstClick` (seconds)
- `clickLocations` (list of `{ x, y, timestamp, timestampUnix }`)
- `totalClicks`, `cupChoices` (e.g. “LeftTargetCup, rightDistractorCup”), `gem_locations`
- `startTime`, `startTimeUnix`, `endTime`, `endTimeUnix`
- `tryDuration` (seconds), `correct` (boolean)

#### `Target and Distractor cups`
Within Magic Cups, each level presents **two main types of cups** that influence scoring outcomes:

`Target Cups (Sure Bets)`

Are guaranteed positive choices.

The correct option is always shown to the users without showing the gem.

`Distractor Cups (Risky Bets)`

Distractor cups introduce risk and uncertainty to each level.

When a player chooses a distractor cup, the outcome is always **50/50 or less** - they might gain a point or none at all.

Each try in the scoring system therefore tracks both `targetScore` and `distractorScore` to capture the player’s performance across various scenarios.

Basic levels (`Level0`, `Level1`) use only **target cups**, while advanced levels (`Level2`, `Level3`) introduce **distractor cups**.

---

## Key Functions

### `removeScoreData()`
Clears all saved score data in `localStorage`.

### `getScoreDataJSONString()`
Returns the raw JSON string of the stored score data.

### `startNewScore(playerId: string, playerAge: string, playerLocation: string)`
Creates a new empty scoring record for the given player, initializing `Level0`–`Level3` with zeroed aggregates and empty `tryData` arrays, and saving `age` and `location`.

### `getPlayerOverallScore(playerId: string): number`
Returns the player’s overall total score for the latest playthrough.

### `storeScoringDataForPlayer(playerId, level, scoringData)`
Appends the level’s `tryData` entry and updates `levelScoringData` for each level:
- `tries += scoringData.length`
- `total_targetScore += sum(targetScore)`
- `total_distractorScore += sum(distractorScore)`
- `levelScore += sum(targetScore + distractorScore)`
- `levelDuration += sum(tryDuration)`

Then recalculates `totalTries`, `totalScore`, and `totalTime` across **all** levels for the current playthrough.

---

## How Level Scenes Populate Scoring Data

### `MagicCupsScene.ts` (base scene)
Provides shared flow/hooks used by levels to collect timing and input metadata, and ultimately to call `storeScoringDataForPlayer(...)` with the per-try payload returned by each level’s `recordScoreDataForCurrentTry()`.

### `Level1.ts` (basic)
Implements `recordScoreDataForCurrentTry()` returning a **`tryData_basic`** object with:
- `targetScore` (from the level’s running score), `distractorScore: 0`
- `firstClick` in seconds (time from level start to first pointer click)
- `clickLocations`: each click captured as `{ x, y, timestamp, timestampUnix }`
- `totalClicks`, `gem_location` (where the gem was)
- `startTime`, `startTimeUnix`, `endTime`, `endTimeUnix`
- `tryDuration` (seconds), `correct` (true if player scored)

### `Level2.ts` (advanced)
Implements `recordScoreDataForCurrentTry()` returning a **`tryData_advanced`** object with:
- `targetScore`, `distractorScore` (separately tracked)
- `cupChoices` (comma-separated history of chosen cups), `gem_locations` (sequence of gem placements)
- `firstClick` (seconds), `clickLocations` (same structure as above)
- `totalClicks`, `startTime`, `startTimeUnix`, `endTime`, `endTimeUnix`
- `tryDuration` (seconds), `correct`

---

## Storage

All data is saved in `localStorage` under the key defined by `GAME_SCORE_DATA_KEY`.

## Example Game Data

Below is a real output snippet from `game_data.json`, showing how gameplay data is structured and saved for a single player (`szho113`):

```json
{
  "szho113": [
    {
      "start": "2025-10-16T07:12:45.215Z",
      "age": "21",
      "location": "Home",
      "scores": {
        "Level0": { 
          "tryData": [ /* tryData_basic[] */ ],
          "tries": 2,
          "total_targetScore": 2,
          "total_distractorScore": 0,
          "levelScore": 2,
          "levelDuration": 8.5
        },
        "Level1": { 
          "tryData": [ /* tryData_basic[] */ ],
          "tries": 3,
          "total_targetScore": 2,
          "total_distractorScore": 0,
          "levelScore": 2,
          "levelDuration": 12.1
        },
        "Level2": { 
          "tryData": [ /* tryData_advanced[] */ ],
          "tries": 1,
          "total_targetScore": 1,
          "total_distractorScore": 0,
          "levelScore": 1,
          "levelDuration": 5.0
        },
        "Level3": { 
          "tryData": [ /* tryData_advanced[] */ ],
          "tries": 0,
          "total_targetScore": 0,
          "total_distractorScore": 0,
          "levelScore": 0,
          "levelDuration": 0
        }
      },
      "totalTries": 6,
      "totalScore": 5,
      "totalTime": 25.6
    }
  ]
}
```

---

## Extending the Scoring System

If you create a **new level**, you must update the scoring system to record its data correctly.

### 1. Update `PLAYER_SCORING_DATA`
Add a new entry for the level using the appropriate scoring type:
```ts
export type PLAYER_SCORING_DATA = {
  // ...
  Level4: { tryData: tryData_advanced[] } & LevelScoringData_advanced;
};

```

### 2. Define (or reuse) scoring data types
If the level has distractors, reuse `tryData_advanced` and `LevelScoringData_advanced`.  
For no-distractor gameplay, reuse `tryData_basic` and `LevelScoringData_basic`.

### 3. Initialize the new level in `startNewScore()`
Add an empty aggregate so data can be recorded:
```ts
Level4: { tryData: [], tries: 0, total_targetScore: 0, total_distractorScore: 0, levelScore: 0, levelDuration: 0 },
```

### 4. Return the correct per-try payload in the level scene
Implement `protected recordScoreDataForCurrentTry()` in your level scene to return either `tryData_basic` or `tryData_advanced` with all required fields populated (scores, clicks, timestamps, durations, etc.).  
The scene should then call `storeScoringDataForPlayer(playerId, "Level4", /* returned try data */)` so the attempt is persisted and level scoring data are updated.

---