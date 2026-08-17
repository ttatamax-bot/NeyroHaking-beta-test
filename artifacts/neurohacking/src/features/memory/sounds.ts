/** Quiet, file-free UX sounds. Audio is opt-in through a user gesture on mobile. */

let context: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!context) {
      const AudioContextConstructor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return null;
      context = new AudioContextConstructor();
    }
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

export function initMemorySound(): void {
  void getAudioContext();
}

function tone(
  frequency: number,
  duration: number,
  options: { type?: OscillatorType; volume?: number; delay?: number; slideTo?: number } = {},
): void {
  const audio = getAudioContext();
  if (!audio) return;
  const start = audio.currentTime + (options.delay ?? 0);
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (options.slideTo) oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.volume ?? 0.1, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playTap(): void {
  tone(520, 0.06, { type: "triangle", volume: 0.06 });
}

export function playCorrect(): void {
  tone(740, 0.09, { volume: 0.1 });
}

export function playLevelUp(): void {
  tone(660, 0.1, { volume: 0.1 });
  tone(990, 0.14, { volume: 0.09, delay: 0.08 });
}

export function playFail(): void {
  tone(220, 0.2, { type: "sawtooth", volume: 0.065, slideTo: 110 });
}

export function playReward(): void {
  tone(587, 0.12, { volume: 0.1 });
  tone(784, 0.12, { volume: 0.1, delay: 0.1 });
  tone(1046, 0.24, { volume: 0.11, delay: 0.2 });
}