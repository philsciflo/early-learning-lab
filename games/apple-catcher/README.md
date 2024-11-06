# Phaser Vite TypeScript Template

<game description / purpose>

## Available Commands

| Command        | Description                                    |
|----------------|------------------------------------------------|
| `yarn install` | Install project dependencies                   |
| `yarn dev`     | Launch a development web server                |
| `yarn build`   | Create a production build in the `dist` folder |

## Writing Code

After duplicating the folder, run `yarn install` from this directory.
Then, you can start the local development server by running `yarn dev`.

The local development server runs on [localhost](http://localhost:8080) by default.

Once the server is running you can edit any of the files in the `src` folder. Vite will automatically recompile your
code and then reload the browser.

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

This template provides support for both embedding assets and also loading them from a static folder. To embed an asset,
you can import it at the top of the JavaScript file you are using it in:

```js
import logoImg from './assets/logo.png'
```

To load static files such as audio files, videos, etc place them into the `public/assets` folder. Then you can use this
path in the Loader calls within Phaser:

```js
preload()
{
    //  This is an example of an imported bundled image.
    //  Remember to import it at the top of this file
    this.load.image('logo', logoImg);

    //  This is an example of loading a static image
    //  from the public/assets folder:
    this.load.image('background', 'assets/bg.png');
}
```

When you issue the `yarn build` command, all static assets are automatically copied to the `dist/assets` folder.

## Deploying to Production

When you issue the `yarn build` command, all static assets are automatically copied to a game-specific sub-folder in the `docs` folder to be served by Jekyll.


