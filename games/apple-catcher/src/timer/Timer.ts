// Timer.ts
const startTimes: Record<string, number> = {};

export function startTimer(levelKey: string) {
  startTimes[levelKey] = Date.now();
}

export function stopTimer(levelKey: string): number {
  const end = Date.now();
  const start = startTimes[levelKey] ?? end;
  return end - start;
}
