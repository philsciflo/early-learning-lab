import { Scene, GameObjects } from "phaser";

import { WIDTH, HEIGHT, HALF_WIDTH, FRIEND_DATA_KEY } from "../constants.ts";
import { createButton } from "../ui.ts";
import {
  buildFriend,
  ALL_FRIEND_IDS,
  FriendId,
  FRIEND_NAMES,
} from "../friends.ts";

const CARD_W = 220;
const CARD_H = 260;
const CARD_GAP = 30;
const CARDS_Y = 380;
const TOTAL_W = CARD_W * 4 + CARD_GAP * 3;
const START_X = HALF_WIDTH - TOTAL_W / 2 + CARD_W / 2;

const SELECTED_STROKE = 0xffd166;
const UNSELECTED_STROKE = 0xcfd6e8;

/**
 * Lets the child pick which of the 4 friends (see friends.ts) they'll
 * play with this session, before Level0. Sits between MainMenu and
 * Level0 in the scene flow - every level reads the choice back out of
 * the registry (FRIEND_DATA_KEY) rather than this scene threading it
 * through scene-start data, so levels reachable by other means (the
 * facilitator "← Back"/"Next Level" buttons, or starting a scene
 * directly during development) all see the same stored choice.
 */
export class SelectFriend extends Scene {
  private selected: FriendId = 1;
  private cardBgs: Partial<Record<FriendId, GameObjects.Rectangle>> = {};

  constructor() {
    super("SelectFriend");
  }

  create() {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0xf2f4fa).setOrigin(0, 0);

    this.add
      .text(WIDTH / 2, 56, "Choose your friend!", {
        fontFamily: "Arial Black",
        fontSize: 40,
        color: "#2b2a6b",
        align: "center",
      })
      .setOrigin(0.5);

    const back = createButton(this, 24, 24, "← Back", {
      variant: "secondary",
      height: 48,
      fontSize: 20,
      origin: [0, 0],
    });
    back.hitArea.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    ALL_FRIEND_IDS.forEach((friendId, i) => {
      const cardX = START_X + i * (CARD_W + CARD_GAP);
      const card = this.add.container(cardX, CARDS_Y);

      const bg = this.add
        .rectangle(0, 0, CARD_W, CARD_H, 0xffffff)
        .setStrokeStyle(4, UNSELECTED_STROKE)
        .setInteractive({ useHandCursor: true });
      this.cardBgs[friendId] = bg;

      // Reuse the exact same shapes the level scenes and postcards draw
      // (just scaled down to fit a card), so the preview here is
      // guaranteed to match what the child actually sees in-game.
      const build = buildFriend(this, friendId);
      // Feet sit here; comfortably clear of the name label below (which
      // sits at CARD_H/2 - 24) - the tallest friend design (Dot's head)
      // reaches roughly 170 * 0.55 =~ 94px above this point, well
      // inside the card's top edge.
      const charContainer = this.add.container(0, CARD_H / 2 - 50, build.parts);
      charContainer.setScale(0.55);

      const label = this.add
        .text(0, CARD_H / 2 - 24, FRIEND_NAMES[friendId], {
          fontFamily: "Arial Black",
          fontSize: 18,
          color: "#2b2a6b",
        })
        .setOrigin(0.5);

      card.add([bg, charContainer, label]);

      bg.on("pointerdown", () => this.selectFriend(friendId));
    });

    this.selectFriend(this.selected);

    const continueButton = createButton(
      this,
      WIDTH / 2,
      CARDS_Y + CARD_H / 2 + 70,
      "Continue",
      { variant: "primary", minWidth: 240 },
    );
    continueButton.hitArea.on("pointerdown", () => {
      this.registry.set(FRIEND_DATA_KEY, this.selected);
      this.scene.start("Level0");
    });
  }

  private selectFriend(friendId: FriendId) {
    this.selected = friendId;
    ALL_FRIEND_IDS.forEach((id) => {
      this.cardBgs[id]?.setStrokeStyle(
        4,
        id === friendId ? SELECTED_STROKE : UNSELECTED_STROKE,
      );
    });
  }
}
