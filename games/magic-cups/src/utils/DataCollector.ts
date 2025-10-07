interface ClickRecord {
  level: number;
  cupId: number;
  time: number;
  correct: boolean;
}


interface MouseRecord {
  level: number;
  x: number;
  y: number;
  time: number;
}


export class DataCollector {
  private static clicks: ClickRecord[] = [];
  private static mouseMovements: MouseRecord[] = [];
  static playerAge: number | null = null;
  static playerLocation: string | null = null;
  private static canvasWidth: number | null = null;
  private static canvasHeight: number | null = null;


  // !!internal tracking helpers


  private static _tracking = false;
  private static _boundScene: Phaser.Scene | null = null;
  private static _pointerHandler:
    | ((pointer: Phaser.Input.Pointer) => void)
    | null = null;
  private static _lastRecordTime = 0;


  static addClick(level: number, cupId: number, time: number, correct: boolean) {
    this.clicks.push({ level, cupId, time, correct });
  }


  static setPlayerInfo(age: number | null, location: string | null) {
    this.playerAge = age;
    this.playerLocation = location;
  }



  // then start mouse sampling on a Phaser scene, sampling every intervalMs milliseconds  ↓


  static startMouseTracking(scene: Phaser.Scene, level: number, intervalMs = 50) {
    if (this._tracking) return;
    this._tracking = true;
    this._lastRecordTime = 0;
    this._boundScene = scene;
    this.canvasWidth = scene.scale.width;
    this.canvasHeight = scene.scale.height;
    this._pointerHandler = (pointer: Phaser.Input.Pointer) => {
      const now = Date.now();
      if (now - this._lastRecordTime >= intervalMs) {
        this.mouseMovements.push({
          level,
          x: pointer.x,
          y: pointer.y,
          time: now,
        });
        this._lastRecordTime = now;
      }
    };
    scene.input.on("pointermove", this._pointerHandler);
                            //  to ensure we stop if scene is shut down / changed
    scene.events.once("shutdown", () => {
      this.stopMouseTracking();
    });
  }


  static stopMouseTracking() {
    if (!this._tracking) return;
    if (this._boundScene && this._pointerHandler) {
      this._boundScene.input.off("pointermove", this._pointerHandler);
    }
    this._pointerHandler = null;
    this._boundScene = null;
    this._tracking = false;
    this._lastRecordTime = 0;
  }


  static exportClicksCSV() {
    const header = "age,location,level,cupId,time,correct\n";
    const rows = this.clicks
      .map(
        (c) =>
          `${this.playerAge ?? ""},${this.playerLocation ?? ""},${c.level},${c.cupId},${c.time},${c.correct}`,
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `magic_cups_clicks.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }


  static exportMouseCSV() {
    const header = "age,location,level,x,y,time\n";
    const rows = this.mouseMovements
      .map(
        (m) =>
          `${this.playerAge ?? ""},${this.playerLocation ?? ""},${m.level},${m.x},${m.y},${m.time}`,
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `magic_cups_mouse.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }


  static clearAllData() {
    this.clicks.length = 0;
    this.mouseMovements.length = 0;
    this.playerAge = null;
    this.playerLocation = null;
  }
  
  static getClickRecords() {
    return this.clicks;
  }


  static exportMousePathImage() {


    if (this.mouseMovements.length === 0) {
      alert("No mouse data to export!");
      return;
    }

    const sceneWidth = this._boundScene ? this._boundScene.scale.width : 1280;
    const sceneHeight = this._boundScene ? this._boundScene.scale.height : 720;

    const canvas = document.createElement("canvas");
    canvas.width = this.canvasWidth ?? 1280;
    canvas.height = this.canvasHeight ?? 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    //back ground
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.mouseMovements.length; i++) {
      const m = this.mouseMovements[i];
      if (i === 0) {
        ctx.moveTo(m.x, m.y);
      } else {
        ctx.lineTo(m.x, m.y);
      }
    }
    ctx.stroke();

    //start point
    const start = this.mouseMovements[0];
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();

    //end point
    const end = this.mouseMovements[this.mouseMovements.length - 1];
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(end.x, end.y - 8);
    ctx.lineTo(end.x - 6, end.y + 6);
    ctx.lineTo(end.x + 6, end.y + 6);
    ctx.closePath();
    ctx.fill();



    // download PNG
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "magic_cups_mouse_path.png";
    a.click();
  }

  static getClickRecords() {
    return this.clicks;
  }

  static getMouseMovements() {
    return this.mouseMovements;
  }

}
