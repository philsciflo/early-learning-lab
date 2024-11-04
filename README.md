# early-learning-lab
The Tākaro i tētahi kēmu (Play a game) is a website designed to host a number of learning games for early childhood research


## Developing the Site

This site is built using [Jekyll](https://jekyllrb.com/) and hosted using [Github Pages](https://docs.github.com/en/pages).

Every commit to the `main` branch will publish the site, to the URL shown in [the settings](/settings/pages)

Local development requires [Git](https://docs.github.com/en/get-started/getting-started-with-git/set-up-git), and [Ruby](https://www.ruby-lang.org/en/documentation/installation/)

From the `site` directory;

1. Run `bundle install` to install the Ruby dependencies
2. Run `bundle exec jekyll serve` to run the site locally
3. Make changes to the files, commit, push, and confirm the changes on the live site

## Developing a new Game

### Building the game

TBC

### Including the game on the site

1. Create a new file `<game-name>.md` in the `_games` directory
2. Include the following content in the file
```
---
heading: <the game name or title e.g A>
subheading: <the game name or title e.g Apple Catcher>
colour: <a CSS colour name for the game icon, from https://developer.mozilla.org/en-US/docs/Web/CSS/named-color, e.g orange> 
---
```
3. ???

