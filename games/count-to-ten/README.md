# Count to Ten

A Phaser 3 + TypeScript + Vite game for counting-recognition research tasks, built
from the [`template`](../template) scaffold and following the conventions
established by [`tiro`](../tiro), [`magic-cups`](../magic-cups),
[`whaka-ahua`](../whaka-ahua), and [`letters-salad`](../letters-salad) (its primary
structural reference).

**Stage 1 of this game**: setup screen + Level1 only. Later levels are separate
follow-up work, the same way letters-salad and whaka-ahua were both built
incrementally.

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
- `src/numberBackdrop.ts` - `scatterNumberBackdrop()`, the reusable decorative
  scattered-digits background used by MainMenu.
- `src/shapes.ts` - `drawShape()`, the single place that decides how a `ShapeType`
  ("circle" | "triangle" | "square") is rendered. Currently draws Phaser Graphics
  primitives; swapping in real PNG assets later only means changing this function's
  body (eg to `scene.add.image(...)`) - callers don't change.
- `src/scoring.ts` - LocalStorage-backed trial data recording and export.
  `TrialData` is currently just `CountTrialData`, covering this stage's Level1.
- `src/scenes/` - The Phaser Scenes (`MainMenu`, `Level1`, `GameOver`).
- `public/style.css` - Page layout and the small-screen notice.
- `public/assets` - Static assets used by the game.
