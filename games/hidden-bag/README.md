# Tiro

A Level-1 visual perspective-taking game: an NPC is standing near a tree and
cannot see a bag that starts out hidden behind it. The player drags the bag
around the scene until it reaches a spot the NPC can actually see from where
*they* are standing — not just a spot the player (who can always see
everything) finds convenient.

This operationalises the classic Flavell, Everett, Croft & Flavell (1981)
"sees / doesn't see" Level-1 perspective-taking task as a simple drag-and-drop
game.

## How it works

- `src/constants.ts` — positions of the NPC, the NPC's "eye point", the tree,
  and the tree's occluder circle (the tree's approximate blocking shape).
  Tune `TREE_OCCLUDER_RADIUS` to make the hiding spot bigger/smaller.
- `src/lineOfSight.ts` — a small geometry helper (`canSee`) that checks
  whether the straight line from the NPC's eye to the bag's current position
  passes through the tree's occluder circle.
- `src/scenes/Level1.ts` — wires the above together: on every drag, it
  re-checks visibility, and once the bag is somewhere the NPC can see it,
  plays a short "success" animation before moving to the Game Over scene.

Note that the bag is always rendered on top and fully visible to the player —
only the NPC's in-game "knowledge" is ever hidden. That's deliberate: the
test is whether the child can reason about *someone else's* viewpoint, not
whether they can find an object that's visually hidden from themselves too.

See the repository root `README.md` for the general Phaser/Vite/TypeScript
monorepo setup (`yarn install`, `yarn dev`, `yarn build`).
