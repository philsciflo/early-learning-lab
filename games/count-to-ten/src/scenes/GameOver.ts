import { Scene } from "phaser";

import { WIDTH, HEIGHT, LAST_SCORE_DATA_KEY, INK_TEXT } from "../constants.ts";
import { createButton } from "../ui.ts";

// A cheerful warm gold, distinct from the other screens' backgrounds -
// this is the "celebration" screen, so it gets its own brighter tone
// rather than reusing MENU/LEVEL_BACKGROUND_COLOUR.
const CELEBRATION_BACKGROUND_COLOUR = 0xffe9a8;

export class GameOver extends Scene {
  gameover_text: Phaser.GameObjects.Text;
  score_text: Phaser.GameObjects.Text;

  constructor() {
    super("GameOver");
  }

  create() {
    this.add
      .rectangle(0, 0, WIDTH, HEIGHT, CELEBRATION_BACKGROUND_COLOUR)
      .setOrigin(0, 0);

    this.gameover_text = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 80, "Well done!", {
        fontFamily: "Fredoka, Arial Black, sans-serif",
        fontSize: 56,
        color: INK_TEXT,
        align: "center",
      })
      .setOrigin(0.5);

    const score = this.registry.get(LAST_SCORE_DATA_KEY) as number | null;
    this.score_text = this.add
      .text(
        WIDTH / 2,
        HEIGHT / 2,
        score === null || score === undefined
          ? "No score recorded"
          : `Score: ${score}/100`,
        {
          fontFamily: "Fredoka, Arial Black, sans-serif",
          fontSize: 32,
          color: INK_TEXT,
          align: "center",
        },
      )
      .setOrigin(0.5);

    const replayButton = createButton(
      this,
      WIDTH / 2,
      HEIGHT / 2 + 100,
      "Tap to play again",
      {
        variant: "primary",
        fontSize: 26,
        minWidth: 260,
      },
    );

    replayButton.hitArea.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
