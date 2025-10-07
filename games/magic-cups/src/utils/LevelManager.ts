export class LevelManager {       // generate cup positions for the current level
  static generateCupPositions(level: number) {
    const positions: { x: number; y: number }[] = [];
    const cupCount = level;           // add more cups each level
    const spacing = 1024 / (cupCount + 1);              // space cups evenly

    for (let i = 1; i <= cupCount; i++) {
      positions.push({ x: i * spacing, y: 300 });
    }
    return positions;
  }
}
