/** Short file-free UX sounds with an explicit mobile AudioContext unlock. */

let context: AudioContext | null = null;
let unlockListenersInstalled = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!context || context.state === "closed") {
      const AudioContextConstructor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return null;
      context = new AudioContextConstructor();
    }
    return context;
  } catch {
    return null;
  }
}

function resumeAudio(audio: AudioContext): void {
  if (audio.state === "suspended") {
    void audio.resume().catch(() => {});
  }
}

function installResumeListeners(): void {
  if (unlockListenersInstalled || typeof window === "undefined") return;
  unlockListenersInstalled = true;
  const resume = () => {
    const audio = getAudioContext();
    if (audio) resumeAudio(audio);
  };
  window.addEventListener("pageshow", resume, { passive: true });
  document.addEventListener("visibilitychange", resume, { passive: true });
}

export function initMemorySound(): void {
  const audio = getAudioContext();
  if (!audio) return;
  installResumeListeners();

  // Starting an oscillator during the button gesture unlocks Web Audio on
  // iOS Safari and Android Chrome. The tiny gain keeps this inaudible.
  try {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.02);
  } catch {
    // A missing/closed audio device must never interrupt the game.
  }
  resumeAudio(audio);
}

function scheduleTone(
  audio: AudioContext,
  frequency: number,
  duration: number,
  options: { type?: OscillatorType; volume?: number; delay?: number; slideTo?: number } = {},
): void {
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

function tone(
  frequency: number,
  duration: number,
  options: { type?: OscillatorType; volume?: number; delay?: number; slideTo?: number } = {},
): void {
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") {
    void audio.resume()
      .then(() => {
        if (audio.state === "running") scheduleTone(audio, frequency, duration, options);
      })
      .catch(() => {});
    return;
  }
  if (audio.state === "running") scheduleTone(audio, frequency, duration, options);
}

export function playTap(): void {
  tone(520, 0.07, { type: "triangle", volume: 0.12 });
}

export function playCorrect(): void {
  tone(740, 0.1, { volume: 0.16 });
}

export function playLevelUp(): void {
  tone(660, 0.1, { volume: 0.15 });
  tone(990, 0.14, { volume: 0.13, delay: 0.08 });
}

export function playFail(): void {
  tone(220, 0.22, { type: "sawtooth", volume: 0.11, slideTo: 110 });
}

export function playReward(): void {
  tone(587, 0.12, { volume: 0.15 });
  tone(784, 0.12, { volume: 0.15, delay: 0.1 });
  tone(1046, 0.24, { volume: 0.16, delay: 0.2 });
}