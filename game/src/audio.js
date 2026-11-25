// All sound is synthesized with WebAudio oscillators: no audio files, no network.
// The kitchen stays quiet until the first user gesture creates the audio context.

let context = null;

function ensure() {
  if (context !== null) return context;
  try {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (AudioContext === undefined) return null;
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

/** Play one short tone: frequency in Hz, length in seconds, kind of wave, volume. */
function tone(freq, seconds, kind, volume, when) {
  const audio = ensure();
  if (audio === null) return;
  try {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = kind;
    oscillator.frequency.value = freq;
    const start = audio.currentTime + (when ?? 0);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.02);
  } catch {
    // Sound is garnish: a failure here never stops the game.
  }
}

export const sounds = {
  /** Unlock audio on the first gesture; call from any key or pointer handler. */
  unlock() {
    ensure();
  },
  pick() {
    tone(520, 0.07, 'triangle', 0.12);
  },
  chop() {
    tone(180, 0.05, 'square', 0.06);
    tone(140, 0.05, 'square', 0.06, 0.08);
  },
  sizzle() {
    tone(3200, 0.12, 'sawtooth', 0.02);
  },
  ding() {
    tone(880, 0.12, 'sine', 0.15);
    tone(1318, 0.18, 'sine', 0.12, 0.1);
  },
  coin() {
    tone(988, 0.09, 'triangle', 0.16);
    tone(1319, 0.16, 'triangle', 0.16, 0.08);
  },
  wrong() {
    tone(220, 0.18, 'sawtooth', 0.08);
    tone(185, 0.22, 'sawtooth', 0.08, 0.12);
  },
  expire() {
    tone(330, 0.25, 'sine', 0.1);
    tone(247, 0.35, 'sine', 0.1, 0.18);
  },
  burn() {
    tone(110, 0.3, 'sawtooth', 0.09);
  },
};
