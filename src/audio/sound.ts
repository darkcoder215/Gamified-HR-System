// Lightweight WebAudio sound engine — synthesizes all SFX + a calm ambient
// loop procedurally, so there are no audio files to ship or fetch.
import { EventBus } from '@/game/EventBus';

type Sfx = 'click' | 'correct' | 'wrong' | 'levelup' | 'badge' | 'enter' | 'talk' | 'promote';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let muted = false;
let musicTimer: number | null = null;
let started = false;

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.5;
    sfxGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  dest: GainNode,
  vol = 1
) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function sfx(name: Sfx) {
  if (!ensure() || !sfxGain) return;
  switch (name) {
    case 'click':
      tone(600, 0, 0.07, 'square', sfxGain, 0.5);
      break;
    case 'talk':
      tone(520, 0, 0.06, 'square', sfxGain, 0.4);
      break;
    case 'correct':
      tone(660, 0, 0.12, 'sine', sfxGain, 0.6);
      tone(880, 0.1, 0.16, 'sine', sfxGain, 0.6);
      break;
    case 'wrong':
      tone(220, 0, 0.18, 'sawtooth', sfxGain, 0.4);
      tone(160, 0.12, 0.22, 'sawtooth', sfxGain, 0.4);
      break;
    case 'enter':
      tone(440, 0, 0.1, 'triangle', sfxGain, 0.5);
      tone(660, 0.08, 0.14, 'triangle', sfxGain, 0.5);
      break;
    case 'badge':
      [784, 988, 1318].forEach((f, i) => tone(f, i * 0.08, 0.22, 'triangle', sfxGain!, 0.5));
      break;
    case 'levelup':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'sine', sfxGain!, 0.55));
      break;
    case 'promote':
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.3, 'triangle', sfxGain!, 0.55));
      break;
  }
}

// Calm pentatonic ambient loop.
const MELODY = [392, 440, 523, 587, 523, 440, 392, 330];
let step = 0;
function startMusic() {
  if (!ensure() || !musicGain || musicTimer !== null) return;
  const tick = () => {
    if (!ctx || !musicGain) return;
    const f = MELODY[step % MELODY.length];
    tone(f, 0, 0.5, 'triangle', musicGain, 0.5);
    if (step % 2 === 0) tone(f / 2, 0, 0.7, 'sine', musicGain, 0.35); // soft bass
    step += 1;
  };
  tick();
  musicTimer = window.setInterval(tick, 460);
}

export function setMuted(value: boolean) {
  muted = value;
  if (master && ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(value ? 0 : 1, ctx.currentTime + 0.15);
  }
}

// Wire game events to sounds, and start audio on the first user gesture
// (browser autoplay policy). Call once.
export function initAudio() {
  if (started) return;
  started = true;

  EventBus.on('player:levelup', () => sfx('levelup'));
  EventBus.on('badge:unlock', () => sfx('badge'));
  EventBus.on('station:enter', () => sfx('enter'));
  EventBus.on('npc:talk', () => sfx('talk'));
  EventBus.on('zone:unlock', () => sfx('promote'));

  const kick = () => {
    ensure();
    startMusic();
  };
  window.addEventListener('pointerdown', kick, { once: true });
  window.addEventListener('keydown', kick, { once: true });
}
