# early-learning-lab

The Tākaro i tētahi kēmu (Play a game) is a website designed to host a number of learning games for early childhood research

MacOS or Linux are recommended for development; consider using [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) if you only have Windows available

## Pre requisite tools

1. [Git](https://docs.github.com/en/get-started/getting-started-with-git/set-up-git)
2. [Node](https://nodejs.org/en). I recommend installing using [NVM](https://github.com/nvm-sh/nvm) and then following [these instructions](https://typicode.github.io/husky/how-to.html#node-version-managers-and-guis) to fix the Husky Git Hooks

## Developing the Landing page for all games

This site is built using [Jekyll](https://jekyllrb.com/) and hosted using [Github Pages](https://docs.github.com/en/pages).

Local development requires [Ruby](https://www.ruby-lang.org/en/documentation/installation/)

From the `docs` directory (the root of any github pages site);

1. Run `bundle install` to install the Ruby dependencies
2. Run `bundle exec jekyll serve` to run the site locally on [localhost](http://127.0.0.1:4000/)
3. Make changes to the files, commit, push, and confirm the changes on the live site

## Developing an individual Game

Games are built using [Phaser](https://phaser.io/) using [TypeScript](https://www.typescriptlang.org/).

Each game can (and should) be developed independently, without running the site landing page.

This repository is setup as a monorepo, a single repository containing multiple distinct projects with the ability to share code between.

Pre-requisite tools;

2. Run `corepack enable` to ensure that `yarn` is available
3. Run `yarn install` to resolve dependencies

### Modifying an existing game

In the game directory, e.g. `games/apple-catcher`

1. Run the game using `yarn dev`
2. Make changes to the game code under `src`
3. Verify the changes work [locally](http://localhost:8080) and as they will be deployed using the [developing the Site instructions](#developing-the-site)

### Adding a new game

1. Duplicate the `games/template` directory, with a new name, and
   1. Change the `name` in `package.json` to match the directory name.
   2. Change the final path segment in the `outDir` in `/vite/config.prod.mjs` to match the directory name.
   3. Change the `title` in `index.html` to the game name.
2. Create a new file `<game-name>.md` in the `_games` directory , with the following content

```
---
heading: <the game name or title e.g A>
subheading: <the game name or title e.g Apple Catcher>
colour: <a CSS colour name for the game icon, from https://developer.mozilla.org/en-US/docs/Web/CSS/named-color, e.g orange>
ref: <the folder name for the game e.g apple-catcher>
---
```

3. Develop and test as per [modifying an existing game](#modifying-an-existing-game)

## Deploying changes

Every commit to the `main` branch will publish the site to the URL shown in [the settings](../../settings/pages),
using the [Github Actions workflows](./.github/workflows/jekyll-gh-pages.yml).

The build process will build each game and copy the built output to the `docs/games/<game name>` directory.
