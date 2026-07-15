/* Web Audio API — works on mobile browsers.
 * Must call initSoundSystem() inside a user gesture (click on "Start").
 * After init, playReminderSound() and playFinishSound() work from setTimeout.
 */

let _audioCtx: AudioContext | null = null;
let _reminderBuffer: AudioBuffer | null = null;
let _finishBuffer: AudioBuffer | null = null;

let _finishRepeatCount = 0;
let _finishRepeatTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_REPEATS = 30;
const REPEAT_INTERVAL_MS = 4000;

const REMINDER_URL = '/sounds/reminder-bell.mp3';
const FINISH_URL = '/sounds/finish-bell.mp3';

function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.arrayBuffer();
  });
}

function playBuffer(audioCtx: AudioContext, buffer: AudioBuffer, volume = 0.9): AudioBufferSourceNode {
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
  return source;
}

/** Call once inside a user-gesture handler (click on Start button). */
export async function initSoundSystem(): Promise<void> {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') {
    await _audioCtx.resume();
  }

  if (!_reminderBuffer) {
    try {
      const ab = await fetchArrayBuffer(REMINDER_URL);
      _reminderBuffer = await _audioCtx.decodeAudioData(ab);
    } catch (e) {
      console.warn('Failed to load reminder sound:', e);
    }
  }
  if (!_finishBuffer) {
    try {
      const ab = await fetchArrayBuffer(FINISH_URL);
      _finishBuffer = await _audioCtx.decodeAudioData(ab);
    } catch (e) {
      console.warn('Failed to load finish sound:', e);
    }
  }
}

function playReminderOnce() {
  if (!_audioCtx || !_reminderBuffer) return;
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume().then(() => {
      if (_audioCtx && _reminderBuffer) playBuffer(_audioCtx, _reminderBuffer, 0.8);
    }).catch(() => {});
    return;
  }
  playBuffer(_audioCtx, _reminderBuffer, 0.8);
}

function playFinishOnce() {
  if (!_audioCtx || !_finishBuffer) return;
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume().then(() => {
      if (_audioCtx && _finishBuffer) playBuffer(_audioCtx, _finishBuffer, 0.9);
    }).catch(() => {});
    return;
  }
  playBuffer(_audioCtx, _finishBuffer, 0.9);
}

export function playReminderSound() {
  try { playReminderOnce(); } catch {}
}

export function startFinishSound() {
  stopFinishSound();
  _finishRepeatCount = 0;
  playFinishOnce();
  _finishRepeatCount++;

  const scheduleNext = () => {
    if (_finishRepeatCount >= MAX_REPEATS) return;
    _finishRepeatTimer = setTimeout(() => {
      playFinishOnce();
      _finishRepeatCount++;
      scheduleNext();
    }, REPEAT_INTERVAL_MS);
  };
  scheduleNext();
}

export function stopFinishSound() {
  if (_finishRepeatTimer !== null) {
    clearTimeout(_finishRepeatTimer);
    _finishRepeatTimer = null;
  }
  _finishRepeatCount = 0;
}

export function playFinishSound() {
  startFinishSound();
}
