import { Scene } from "phaser";
import {
  HALF_HEIGHT,
  HALF_WIDTH,
  HEIGHT,
  PLAYER_ID_DATA_KEY,
  QUARTER_WIDTH,
  WIDTH,
} from "../constants.ts";
import { renderTextBanner } from "../banners.ts";
import {
  getScoreDataJSONString,
  removeScoreData,
  startNewScore,
} from "../scoring.ts";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-json", "assets/download-json.png");
    this.load.image("download-csv", "assets/download-csv.png");
    this.load.image("download-png", "assets/download-png.png");

    this.load.image("delete-data", "assets/delete-data.png");
    this.load.image("start", "assets/power-button.png");
    this.load.image("move", "assets/move.png");
  }

  create() {
    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1);

    renderTextBanner(
      this,
      { backgroundAlpha: 0.6 },
      {
        text: 'Play: \r "Apple Catcher"',
        yOffset: 10,
      },
    );

    renderTextBanner(
      this,
      { y: HALF_HEIGHT, height: 150, backgroundAlpha: 0.6 },
      {
        text: "Enter your player ID:",
        yOffset: 10,
      },
    );

    const nameInput = this.add.dom(0, 0).createFromCache("name_input");
    nameInput.setOrigin(0.5);
    nameInput.setPosition(HALF_WIDTH, HALF_HEIGHT + 90);

    const startButton = this.add
      .sprite(HALF_WIDTH + QUARTER_WIDTH + 50, HALF_HEIGHT + 70, "start")
      .setDisplaySize(100, 100)
      .setInteractive();

    startButton.on("pointerdown", () => {
      const playerId = (nameInput.getChildByName("input") as HTMLInputElement)
        .value;
      if (playerId?.length >= 6) {
        // Store player ID in global registry for access across scenes
        this.registry.set(PLAYER_ID_DATA_KEY, playerId);
        startNewScore(playerId);
        this.scene.start("ModeSelection");
      }
    });

    // ========== Button Area: Delete + JSON + CSV + PNG ==========

    // Delete saved data (with confirmation dialog)
    this.add
      .sprite(HALF_WIDTH - 150, HEIGHT - 50, "delete-data")
      .setDisplaySize(100, 100)
      .setInteractive()
      .on("pointerdown", () => {
        const ok = window.confirm("Delete all saved score data?");
        if (!ok) return;
        removeScoreData();
      });

    // JSON export (original logic kept, only added empty-data check)
    this.add
      .sprite(HALF_WIDTH + 150, HEIGHT - 50, "download-json")
      .setDisplaySize(100, 100)
      .setInteractive()
      .on("pointerdown", () => {
        const raw = getScoreDataJSONString();
        if (!raw || raw === "{}") {
          window.alert("No data to export!");
          return;
        }

        const jsonStr = JSON.stringify(JSON.parse(raw), null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "game_data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

    // CSV export button
    this.add
      .image(HALF_WIDTH - 50, HEIGHT - 50, "download-csv")
      .setDisplaySize(100, 100)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        exportMouseCSVFromScoreJSON();
      });

    // PNG export button
    this.add
      .image(HALF_WIDTH + 50, HEIGHT - 50, "download-png")
      .setDisplaySize(100, 100)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const w = this.scale.width;
        const h = this.scale.height;
        exportMousePathPNGFromScoreJSON(w, h);
      });

    // =============== Helper functions for Apple Catcher export tools ===============
    // Put inside create() to follow same style as Marble Track

    type MovementPoint = {
      x: number;
      y: number;
      time: number;
    };

    type MovementSegment = {
      playerId: string;
      sessionIndex: number; // Which session (index in PLAYER_INSTANCE_SCORING_DATA[])
      level: string;        // e.g., "Level0", "Level1Drop", etc.
      attemptIndex: number; // Which attempt (outer tryData index + 1)
      recordIndex: number;  // Which record inside one attempt (inner index + 1)
      pathType: "basket" | "apple";
      points: MovementPoint[];
    };

    /**
     * Extract all movement paths from Apple Catcher scoring JSON:
     * - Level0 ~ Level4: basketPath
     * - Level1Drop ~ Level4Drop: applePath
     */
    function collectMovementSegmentsFromScoreJSON(): MovementSegment[] {
      const jsonStr = getScoreDataJSONString();
      if (!jsonStr || jsonStr === "{}") {
        return [];
      }

      let allData: any;
      try {
        allData = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse score JSON:", e);
        return [];
      }

      const segments: MovementSegment[] = [];

      // allData: { [playerId: string]: PLAYER_INSTANCE_SCORING_DATA[] }
      Object.entries(allData).forEach(([playerId, sessions]) => {
        if (!Array.isArray(sessions)) return;

        (sessions as any[]).forEach((session, sessionIndex) => {
          const scores = session?.scores;
          if (!scores) return;

          // Iterate level entries (Level0 / Level1Drop / ...)
          Object.entries(scores).forEach(([levelKey, levelData]) => {
            const tryDataArr = (levelData as any)?.tryData;
            // tryDataArr is LevelXScoringData[][] at runtime
            if (!Array.isArray(tryDataArr)) return;

            tryDataArr.forEach((oneAttemptData: any, attemptIndex: number) => {
              if (!Array.isArray(oneAttemptData)) return;

              oneAttemptData.forEach(
                (record: any, recordIndex: number) => {
                  // Basket path (non-drop levels)
                  if (
                    Array.isArray(record.basketPath) &&
                    record.basketPath.length > 0
                  ) {
                    const points: MovementPoint[] = record.basketPath.map(
                      (p: any) => ({
                        x: p.x,
                        y: p.y,
                        time: p.time,
                      }),
                    );

                    segments.push({
                      playerId,
                      sessionIndex,
                      level: levelKey,
                      attemptIndex: attemptIndex + 1,
                      recordIndex: recordIndex + 1,
                      pathType: "basket",
                      points,
                    });
                  }

                  // Apple path (drop levels)
                  if (
                    Array.isArray(record.applePath) &&
                    record.applePath.length > 0
                  ) {
                    const points: MovementPoint[] = record.applePath.map(
                      (p: any) => ({
                        x: p.x,
                        y: p.y,
                        time: p.time,
                      }),
                    );

                    segments.push({
                      playerId,
                      sessionIndex,
                      level: levelKey,
                      attemptIndex: attemptIndex + 1,
                      recordIndex: recordIndex + 1,
                      pathType: "apple",
                      points,
                    });
                  }
                },
              );
            });
          });
        });
      });

      return segments;
    }

    // =============== Export CSV ===============
    function exportMouseCSVFromScoreJSON(): void {
      const segments = collectMovementSegmentsFromScoreJSON();
      if (segments.length === 0) {
        alert("No basket or apple path data to export!");
        return;
      }

      const header =
        "playerId,session,level,attemptIndex,recordIndex,pathType,x,y,time\n";
      const rows: string[] = [];

      for (const seg of segments) {
        for (const p of seg.points) {
          rows.push(
            [
              seg.playerId,
              seg.sessionIndex,
              seg.level,
              seg.attemptIndex,
              seg.recordIndex,
              seg.pathType,
              p.x,
              p.y,
              Math.round(p.time),
            ].join(","),
          );
        }
      }

      const csv = header + rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "apple_catcher_paths.csv";
      a.click();
      URL.revokeObjectURL(url);
    }

    // =============== Export PNG: Visualize all movement paths ===============
    function exportMousePathPNGFromScoreJSON(
      width = 1280,
      height = 720,
    ): void {
      const segments = collectMovementSegmentsFromScoreJSON();
      if (segments.length === 0) {
        alert("No basket or apple path data to export!");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get 2D context for canvas");
        return;
      }

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Legend (top-left corner)
      ctx.font = "18px Arial";
      ctx.fillStyle = "black";
      ctx.fillText("Legend:", 20, 40);

      // Start point (green circle)
      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(40, 70, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.fillText("Start point", 60, 75);

      // End point (blue triangle)
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.moveTo(35, 100 - 8);
      ctx.lineTo(29, 100 + 6);
      ctx.lineTo(41, 100 + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.fillText("End point", 60, 105);

      // Assign colors for each level
      const levelKeys = Array.from(new Set(segments.map((s) => s.level)));
      const levelColors: Record<string, string> = {};
      levelKeys.forEach((lvl, i) => {
        const hue = (i / levelKeys.length) * 360;
        levelColors[lvl] = `hsl(${hue}, 80%, 60%)`;
      });

      ctx.lineWidth = 2;

      segments.forEach((seg) => {
        const pts = seg.points;
        if (pts.length === 0) return;

        ctx.strokeStyle = levelColors[seg.level] || "#000000";

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Start point (green)
        const start = pts[0];
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // End point (blue)
        const end = pts[pts.length - 1];
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.moveTo(end.x, end.y - 7);
        ctx.lineTo(end.x - 5, end.y + 5);
        ctx.lineTo(end.x + 5, end.y + 5);
        ctx.closePath();
        ctx.fill();
      });

      // Level color legend
      ctx.font = "16px Arial";
      ctx.fillStyle = "black";
      ctx.fillText("Level Colors:", 20, 140);
      levelKeys.forEach((lvl, i) => {
        const y = 160 + i * 25;
        ctx.fillStyle = levelColors[lvl];
        ctx.fillRect(40, y - 10, 30, 10);
        ctx.fillStyle = "black";
        ctx.fillText(lvl, 80, y);
      });

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "apple_catcher_paths.png";
      a.click();
    }
  }
}
