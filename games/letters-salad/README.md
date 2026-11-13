# Letters Salad

A Phaser 3 + TypeScript + Vite game for letter-recognition research tasks, built from
the [`template`](../template) scaffold and following the conventions established by
[`tiro`](../tiro), [`magic-cups`](../magic-cups), and
[`whaka-ahua`](../whaka-ahua) (its primary structural reference).

## Available Commands

| Command        | Description                                    |
| -------------- | ----------------------------------------------- |
| `yarn install` | Install project dependencies                   |
| `yarn dev`     | Launch a development web server                |
| `yarn build`   | Create a production build in the `docs` folder |

The local development server runs on [localhost](http://localhost:8080) by default.

## Project Structure

- `index.html` - A basic HTML page to contain the game.
- `src/main.ts` - The main entry point: game configuration and scene list.
- `src/constants.ts` - Shared dimensions, colours, and data keys.
- `src/ui.ts` - The shared `createButton()`/`createCircleButton()` helpers, plus
  `downloadCanvasSnapshot()` for capturing the actual rendered game canvas.
- `src/letterBackdrop.ts` - `scatterLetterBackdrop()`, the reusable decorative
  "letter salad" background used by MainMenu.
- `src/scoring.ts` - LocalStorage-backed trial data recording and export. `TrialData`
  is a discriminated union (`SortTrialData | FindLetterTrialData |
  AlphabetOrderTrialData`) covering this stage's Level1 plus the Level2/Level3 shapes
  reserved for later stages.
- `src/scenes/` - The Phaser Scenes (`MainMenu`, `Level1`, `GameOver`).
- `public/style.css` - Page layout and the small-screen notice.
- `public/assets` - Static assets used by the game.
