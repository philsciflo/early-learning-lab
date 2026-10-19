/** Short reward/feedback sounds, synthesised with the Web Audio API so
 * none of this needs audio asset files. Browsers block audio until a
 * user gesture, so callers should only invoke these after a click/tap
 * has already happened in the current turn. */

function playTone(
  audioContext: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  const start = audioContext.currentTime + startOffset;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  oscillator.start(start);
  oscillator.stop(start + duration);
}

/** A bright three-note ascending major triad - "well done". */
export function playChime(audioContext: AudioContext) {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((frequency, index) =>
    playTone(audioContext, frequency, index * 0.08, 0.4),
  );
}

/** A gentle two-note descending phrase - "not quite", not harsh. */
export function playGentleMiss(audioContext: AudioContext) {
  const notes = [392.0, 329.63]; // G4, E4
  notes.forEach((frequency, index) =>
    playTone(audioContext, frequency, index * 0.12, 0.35),
  );
}
