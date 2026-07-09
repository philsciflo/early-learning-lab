# Mahi Tahi (Phaser + TypeScript)


Mahi Tahi is a turn-based memory and sharing game built with Phaser 3.
Players first memorize where coins are, then take turns with an NPC (Parry) to flip cards and find coins, and finally share coins between player and NPC chests.
Game history is stored locally for review and export.


## Project Management


- GitHub Projects: https://github.com/orgs/uoa-compsci399-s1-2026/projects/35


## Project Description


This project was created for children aged 3 to 6 years old.
The Early Learning Lab at the University of Auckland requested a game that helps researchers explore variations in children's sharing behavior under workload.


The gameplay is designed around memory, turn-taking, and sharing:


- The child and an NPC (Parry the Parrot) take turns finding coins.
- After all coins are found, they are collected and moved into a sharing stage.
- The child allocates coins between self and NPC.
- The game records session data for display and download on the homepage.


## Tech Stack


- Phaser 3
- TypeScript
- Vite
- npm
- Git (version control)
- GitHub Projects (project management)
- HTML/CSS/JavaScript
- Krita (asset creation)
- Logic Pro (audio creation)
- Audacity (audio creation)


## Run and Build


To install npm, you may need to install Node.js first. https://nodejs.org/en/download/ is sufficient.


```bash
npm install
npm run dev
```


- Local dev server: `http://localhost:8080`
- `npm run build` uses `vite/config.prod.mjs` and outputs to `docs/`


Available scripts from `package.json`:


- `npm run dev`: start dev server with `vite/config.dev.mjs`
- `npm run build`: production build to `docs/`
- `npm run deploy`: currently `gh-pages -d dist` (does not match `build` output `docs/`; confirm publish folder before using)


## Game Flow (Current Code Behavior)


1. `MainMenu`
- Required fields: `Player ID`, `Age`, `Location`
- `Start Game` uses defaults: `10` coins, `3x7` board, NPC chance `50%`
- `Settings` opens custom configuration
- Additional options: view move history, download saved data, clear saved data


2. `SettingsScreen`
- `Total Coins`: limited to at most `rows * cols - 1`
- `Rows`: `1` to `4`
- `Columns`: `1` to `8`
- `NPC Chance`: `0%` to `100%` (snaps near `0/25/50/75/100`)
- Starts the game scene with saved settings


3. `scene-game-main` (Main Game)
- Starts in a memory phase with all cards revealed and a timer running
- Player presses `Start!` to begin the turn-based phase
- Player and NPC alternate turns flipping cards
- When all coins are found, remaining cards are revealed and `Share!` appears


4. `scene-share` (Sharing Stage)
- Drag each found coin into `YOU` or `PARRY` chest
- Confirm allocation (`Yes/No`) after all coins are placed
- Saves full game result and asks whether to start another game with the same player


5. `PauseScene` and `AlertScene`
- Menu button opens pause overlay
- Pause UI includes BGM/SFX volume sliders
- Alert UI is used for validation and confirmations


## Local Data and Export


The project stores data in `localStorage`:


- `playerData`: latest player input
- `playerDataHistory`: de-duplicated player records
- `gameCustomSettings`: latest settings from Settings screen
- `levelResultsHistory`: full game history including turn logs and sharing actions


Main menu data tools:


- `Download Player Data`: exports JSON with player and game history
- `View Move History`: visual replay summary for saved games
- `Clear Data`: clears local saved data keys above


## Usage Examples


- Play flow: main menu -> settings -> main game -> share scene -> return to menu
- Review flow: use `View Move History` on the main menu to inspect saved turns and outcomes
- Export flow: use `Download Player Data` to export the collected JSON dataset


## JSON Data Structure


- `exportedAt`: The date and time ‘Download Data’ was clicked in the main menu and this file was generated.
- `totalPlayers`: Total number of players within the file.
- `totalLevelResults`: Total number of rounds played within the file, regardless of who played.
  - `players`: a list of registered users, users have `playerId`, `age`, `location`, `submittedAt`.
  - `playerId`: the userID entered by the player.
  - `age`: age of the player.
  - `location`: where the player played the game.
  - `submittedAt`: time and date the player clicked `Start Game` on the main menu or settings screen.
- `levelResults`: the results of all the levels, structured per player.
  - `playerId`: player's userID.
  - `age`: player's age.
  - `games`: details for all the player's games.
    - `Location`: where the player played this particular round.
    - `Difficulty_As_Percentage`: the chance Parry (NPC) has of choosing a tile with a coin behind it (default is 50%).
    - `Total_Number_of_Coins`: total number of coins in the round to be found (default is 10).
    - `Number_of_Columns`: number of columns to the grid (default is 7).  
    - `Number_of_Rows`: number of rows to this game's grid (default is 3).
    - `Turns`: A log of each turn made by the player and NPC for this game.
      - `turn`: the turn number for this game.
      - `clicked_by`: whose turn it was for this round.
      - `player_clicked`: the location of the tile the player or NPC picked (in (x, y) form).
      - `coin`: is `yes` if there was a coin behind the chosen tile. `no` otherwise.
      - `player_thinking_time`: amount of time in seconds between the player's turn starting and the player choosing a card. 
    - `Total_Trash`: total number of trash that can be found in the round.
    - `Coin_Trash_Ratio`: the ratio of total coins to total trash. (`Total_Number_of_Coins` / `Total_Trash`)
    - `Coins_Found_by_Player`: the number of coins found by the player in this round.
    - `Coins_Found_by_NPC`: the number of coins found by the NPC in this round.
    - `Coins_Player_Shared_to_Self`: the final number of coins put in the player's chest by the player.
    - `Coins_Player_Shared_to_NPC`: the final number of coins put into the NPC's chest by the player.
    - `Time_Spent_Memorising`: amount of time the player spent observing and memorising the location of the coins within the grid before clicking `start`. Formatted as minutes:seconds.
    - `Recorded_At`: the date and time the player clicked `yes` to the question `Are you happy with these coins?`.
    - `Sharing_Responses`: a log of the sharing choices.
      - `session`: the iteration of the sharing action, will increment every time the player says `no` to `Are you happy with these coins?`
      - `response`: what the player clicked in response to the question `Are you happy with these coins?`. Either `yes` or `no`.
      - `actions`: a log of each sharing action made by the player during this session.
      - `turn`: the iteration of the coin moves to a chest. (if = 1, it was the first coin moved. If = 3, it was the 3rd coin moved).
      - `coin`: the ID of the coin that was moved.
      - `box`: which chest the coin was moved into by the player.
      - `coinsSharedToPlayer`: the number of coins put in the player's chest by the player in this session.
      - `coinsSharedToPlayer`: the number of coins put in the NPC's chest by the player in this session.
      - `recordedAt`: the date and time the player clicked `yes` or `no` to the question `Are you happy with these coins?` during this session.
    - `Trash_Found_by_Player`: the amount of trash found by the player in this round.
    - `Trash_Found_by_NPC`: amount of trash found by the NPC in this round.
    - `Player_Coin_Trash_Ratio`: the ratio of coins found to trash found by the player (`Coins_Found_by_Player` / `Trash_Found_by_Player`).
    - `NPC_Coin_Trash_Ratio`: the ratio of coins found to trash found by the NPC (`Coins_Found_by_NPC` / `Trash_Found_by_NPC`).


## Example JSON structure in exported data:


```json
{
  "exportedAt": "2026-05-25T05:05:22.725Z",
  "totalPlayers": 1,
  "totalLevelResults": 1,
  "players": [
    {
      "playerId": "kked212",
      "age": "22",
      "location": "Home",
      "submittedAt": "2026-05-25T05:04:07.816Z"
    }
  ],
  "levelResults": [
    {
      "playerId": "kked212",
      "age": "22",
      "games": [
        {
          "Location": "Home",
          "Difficulty_As_Percentage": "50%",
          "Total_Number_of_Coins": 10,
          "Number_of_Columns": 7,
          "Number_of_Rows": 3,
          "Turns": [
            {
              "turn": 1,
              "clicked_by": "player",
              "player_clicked": "1,1",
              "coin": "yes",
              "player_thinking_time": 2.67
            },
            {
              "turn": 2,
              "clicked_by": "npc",
              "player_clicked": "1,4",
              "coin": "no",
              "player_thinking_time": null
            },         
		.
		.
		.
		{
              "turn": 19,
              "clicked_by": "player",
              "player_clicked": "2,3",
              "coin": "yes",
              "player_thinking_time": 0.16
            }
          ],
          "Total_Trash": 11,
          "Coin_Trash_Ratio": 0.9090909090909091,
          "Coins_Found_by_Player": 6,
          "Coins_Found_by_NPC": 4,
          "Coins_Player_Shared_to_Self": 10,
          "Coins_Player_Shared_to_NPC": 0,
          "Time_Spent_Memorising": "00:03",
          "Recorded_At": "2026-05-25 17:05:14",
          "Sharing_Responses": [
            {
              "session": 1,
              "response": "yes",
              "actions": [
                {
                  "session": 1,
                  "turn": 1,
                  "coin": 8,
                  "box": "Player"
                },
                {
                  "session": 1,
                  "turn": 2,
                  "coin": 7,
                  "box": "Player"
                },
		    .
		    .
		    .
                {
                  "session": 1,
                  "turn": 10,
                  "coin": 3,
                  "box": "Player"
                }
              ],
              "coinsSharedToPlayer": 10,
              "coinsSharedToNPC": 0,
              "Recorded_At": "2026-05-25 17:05:14"
            }
          ],
          "Trash_Found_by_Player": 4,
          "Trash_Found_by_NPC": 5,
          "Player_Coin_Trash_Ratio": 1.5,
          "NPC_Coin_Trash_Ratio": 0.8,
        }
      ]
    }
  ]
}


```


## Project Structure


- `index.html`: app shell and game mount point
- `src/main.ts`: Phaser config and scene registration
- `src/scenes/MainMenu.ts`: player input and history tools
- `src/scenes/SettingsScreen.ts`: custom game settings
- `src/scenes/game.ts`: memory phase, turn logic, NPC logic, end-state
- `src/scenes/share.ts`: drag-share stage and final result saving
- `src/scenes/PauseScene.ts`: pause menu and audio controls
- `src/scenes/AlertScene.ts`: modal alerts and confirmations
- `src/AudioManager.ts`: global BGM/SFX manager
- `public/assets/`: images, audio, font, and DOM input templates
- `vite/config.dev.mjs`: Vite development config
- `vite/config.prod.mjs`: Vite production config


## Deployment URL


https://uoa-compsci399-s1-2026.github.io/capstone-project-s1-2026-team-2/


## Future Plans


- Add more gameplay balancing options for different age groups
- Improve data visualization for researchers on top of current history views
- Add clearer in-game onboarding prompts for first-time players


## Acknowledgements


- Phaser tutorial/video: https://www.youtube.com/watch?v=0qtg-9M3peI
- Menu icon: https://andelrodis.itch.io/
- Confetti SFX: https://pixabay.com/sound-effects/people-1gift-confetti-447240/
- Music and Other SFX: Andrew Huang
- Card icon art and Parry voice: Samuel Dong
- Parry, chest, and background art: Juice Ortanez

