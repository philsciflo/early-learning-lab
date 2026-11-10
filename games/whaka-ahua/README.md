# Whaka-āhua

A Phaser 3 + TypeScript + Vite game for shape-copying research tasks, built from the
[`template`](../template) scaffold and following the conventions established by
[`tiro`](../tiro) and [`magic-cups`](../magic-cups).

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
- `src/ui.ts` - The shared `createButton()` helper.
- `src/scoring.ts` - LocalStorage-backed trial data recording and export.
- `src/triangleScoring.ts` - Pure, pixel-free scoring of a drawn triangle.
- `src/scenes/` - The Phaser Scenes (`MainMenu`, `Level1`, `GameOver`).
- `public/style.css` - Page layout and the small-screen notice.
- `public/assets` - Static assets used by the game.
