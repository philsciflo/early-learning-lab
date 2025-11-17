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

import { AudioManager } from "../AudioManager";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.html("name_input", "assets/html_text_input.html");
    this.load.image("download-json", "assets/download-json.png");
    this.load.image("delete-data", "assets/delete-data.png");
    this.load.image("start", "assets/power-button.png");
    this.load.image("move", "assets/move.png");
    this.load.audio("bgm", "assets/bgm.mp3");
    this.load.image("icon-music-on", "assets/icon-music-on.png");
    this.load.image("icon-music-off", "assets/icon-music-off.png");
    this.load.image("download-csv", "assets/download-csv.png");
    this.load.image("download-png", "assets/download-png.png");
  }

  create() {
    // ① create the audio singleton exactly once
    AudioManager.init(this.game);
    AudioManager.I.playBgm();
    this.scene.launch("UIScene"); // ② now launch the overlay UI scene

    this.add
      .image(0, 0, "background")
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(-1);

    renderTextBanner(
      this,
      { backgroundAlpha: 0.8 },
      {
        text: 'Play: \r "Marble Track"',
        yOffset: 10,
      },
    );

    renderTextBanner(
      this,
      { y: HALF_HEIGHT, height: 150, backgroundAlpha: 0.8 },
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
        // Set data in the global registry that can be accessed by all scenes
        this.registry.set(PLAYER_ID_DATA_KEY, playerId);
        startNewScore(playerId);
        this.scene.start("Level0");
      }
    });

    this.add
      .sprite(HALF_WIDTH - 150, HEIGHT - 50, "delete-data")
      .setDisplaySize(100, 100)
      .setInteractive()
      .on("pointerdown", () => {
        const ok = window.confirm("Delete all saved score data?");
        if (!ok) return;
        removeScoreData();
      });

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
        const jsonStr = JSON.stringify(
          JSON.parse(raw),
          null,
          2,
        );
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

      this.add
      .image(HALF_WIDTH - 50, HEIGHT - 50, "download-csv")
      .setDisplaySize(100, 100)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        exportMouseCSVFromScoreJSON();
      });

      this.add
      .image(HALF_WIDTH + 50, HEIGHT - 50, "download-png")
      .setDisplaySize(100, 100)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const w = this.scale.width;
        const h = this.scale.height;
        exportMousePathPNGFromScoreJSON(w, h);
      });

      // =============== Helper types for mouse/track path export ===============

type MovementPoint = {
  x: number;
  y: number;
  time: number;
};

type MovementSegment = {
  playerId: string;
  sessionIndex: number; // the nth game session (index in outer ByteMe array)
  level: string;        // "Level0" / "Level3" / ...
  attempt: number;      // the nth attempt of entering this level
  tryIndex: number;     // index in scoringData array (corresponding to tries)
  trackId?: string;     // track id (used in Level3)
  points: MovementPoint[];
};

// =============== Collect all movement segments from scoring JSON ===============

function collectMovementSegments(): MovementSegment[] {
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
      const scores = session.scores;
      if (!Array.isArray(scores)) return;

      scores.forEach((scoreEntry: any) => {
        const level = scoreEntry.level;
        const attempt = scoreEntry.attempt;
        const scoringData = scoreEntry.scoringData;

        if (!Array.isArray(scoringData)) return;

        scoringData.forEach((sd: any, idx: number) => {
          const tryIndex = idx + 1;

          // 1) Dragging path (Level0/1/2/4)
          if (Array.isArray(sd.path) && sd.path.length > 0) {
            const points: MovementPoint[] = sd.path.map((p: any) => ({
              x: p.x,
              y: p.y,
              time: p.time,
            }));
            segments.push({
              playerId,
              sessionIndex,
              level,
              attempt,
              tryIndex,
              points,
            });
          }

          // 2) Track paths (Level3)
          if (Array.isArray(sd.trackPaths) && sd.trackPaths.length > 0) {
            sd.trackPaths.forEach((tp: any) => {
              if (!Array.isArray(tp.path) || tp.path.length === 0) return;
              const points: MovementPoint[] = tp.path.map((p: any) => ({
                x: p.x,
                y: p.y,
                time: p.time,
              }));

              segments.push({
                playerId,
                sessionIndex,
                level,
                attempt,
                tryIndex,
                trackId: tp.trackId,
                points,
              });
            });
          }
        });
      });
    });
  });

  return segments;
}

// =============== Export CSV ===============

function exportMouseCSVFromScoreJSON(): void {
  const segments = collectMovementSegments();
  if (segments.length === 0) {
    alert("No mouse or track path data to export!");
    return;
  }

  // Columns can be added or removed as needed; these include core information
  const header =
    "playerId,session,level,attempt,tryIndex,trackId,x,y,time\n";
  const rows: string[] = [];

  for (const seg of segments) {
    for (const p of seg.points) {
      rows.push(
        [
          seg.playerId,
          seg.sessionIndex,
          seg.level,
          seg.attempt,
          seg.tryIndex,
          seg.trackId ?? "",
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
  a.download = "marble_track_paths.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// =============== Export PNG (all paths overlayed) ===============

function exportMousePathPNGFromScoreJSON(
  width = 1280,
  height = 720,
): void {
  const segments = collectMovementSegments();
  if (segments.length === 0) {
    alert("No mouse or track path data to export!");
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

  // draw legend (top-left corner)
  ctx.font = "18px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Legend:", 20, 40);

  // legend-start point
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(40, 70, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.fillText("Start point", 60, 75);

  // legend-end point
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.moveTo(35, 100 - 8);
  ctx.lineTo(29, 100 + 6);
  ctx.lineTo(41, 100 + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.fillText("End point", 60, 105);

  // Different levels use different colors
  const levelKeys = Array.from(new Set(segments.map((s) => s.level)));
  const levelColors: Record<string, string> = {};
  levelKeys.forEach((lvl, i) => {
    const hue = (i / levelKeys.length) * 360;
    levelColors[lvl] = `hsl(${hue}, 80%, 60%)`;
  });

  // Draw each path
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

    // Start point: green dot
    const start = pts[0];
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // End point: blue triangle
    const end = pts[pts.length - 1];
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(end.x, end.y - 8);
    ctx.lineTo(end.x - 6, end.y + 6);
    ctx.lineTo(end.x + 6, end.y + 6);
    ctx.closePath();
    ctx.fill();
  });

  // Simple legend (level -> color)
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
  a.download = "marble_track_paths.png";
  a.click();
}

  }
}
