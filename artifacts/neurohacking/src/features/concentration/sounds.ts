/** Short phase sounds for the concentration practice, with mobile audio unlock. */

let context: AudioContext | null = null;
let listenersInstalled = false;

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

function ensureAudioReady(): AudioContext | null {
  const audio = getAudioContext();
  if (!audio) return null;
  if (!listenersInstalled) {
    listenersInstalled = true;
    const resume = () => {
      const current = getAudioContext();
      if (current?.state === "suspended") void current.resume().catch(() => {});
    };
    window.addEventListener("pageshow", resume, { passive: true });
    document.addEventListener("visibilitychange", resume, { passive: true });
  }
  if (audio.state === "suspended") void audio.resume().catch(() => {});
  return audio;
}

export function initConcentrationSound(): void {
  const audio = ensureAudioReady();
  if (!audio) return;
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
    // Audio must never interrupt the game.
  }
}

function scheduleTone(audio: AudioContext, frequency: number, duration: number, delay: number, volume: number, type: OscillatorType, slideTo?: number): void {
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function tone(frequency: number, duration: number, delay = 0, volume = 0.1, type: OscillatorType = "sine", slideTo?: number): void {
  const audio = ensureAudioReady();
  if (!audio) return;
  if (audio.state === "suspended") {
    void audio.resume()
      .then(() => {
        if (audio.state === "running") scheduleTone(audio, frequency, duration, delay, volume, type, slideTo);
      })
      .catch(() => {});
    return;
  }
  if (audio.state !== "running") return;
  scheduleTone(audio, frequency, duration, delay, volume, type, slideTo);
}

export function playConcentrationPrepare(): void {
  tone(440, 0.12, 0, 0.11, "triangle");
  tone(660, 0.16, 0.16, 0.12, "triangle");
}

export function playConcentrationSignal(): void {
  tone(820, 0.08, 0, 0.1, "sine");
}

export function playConcentrationResult(): void {
  tone(740, 0.1, 0, 0.14, "sine");
  tone(990, 0.14, 0.1, 0.13, "sine");
}

export function playConcentrationCorrect(): void {
  tone(880, 0.08, 0, 0.14, "triangle");
}

export function playConcentrationLevelSuccess(): void {
  tone(660, 0.1, 0, 0.13, "triangle");
  tone(880, 0.12, 0.1, 0.14, "triangle");
  tone(1320, 0.18, 0.22, 0.16, "sine");
}

export function playConcentrationFail(): void {
  tone(220, 0.22, 0, 0.12, "sawtooth", 110);
}