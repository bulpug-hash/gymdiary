// Odpočinkový timer jako sdílený stav mimo React strom.
//
// Timer musí přežít přepnutí záložky a být vidět, i když jsi v Deníku nebo
// v Přehledu – proto nežije v komponentě, ale tady. Odpočítává se absolutní
// deadline, ne tiky intervalu; na zamčeném telefonu se setInterval uškrtí
// a odpočet by se opozdil o celý odpočinek.
import { useSyncExternalStore } from 'react';

export interface RestState {
  running: boolean;
  /** Zbývající sekundy. */
  remaining: number;
  /** Nastavená délka v sekundách. */
  duration: number;
  /** Kvůli čemu timer běží – ukáže se v liště. */
  label: string | null;
}

let state: RestState = { running: false, remaining: 0, duration: 90, label: null };
let deadline: number | null = null;
let ticker: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<() => void>();

// Wake Lock drží displej rozsvícený, dokud odpočinek běží. Bez toho se telefon
// během 180s pauzy u dřepu zamkne a konec odpočinku nepoznáš.
type WakeLockSentinelLike = { release: () => Promise<void> };
let wakeLock: WakeLockSentinelLike | null = null;

async function acquireWakeLock() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock) return;
    wakeLock = await nav.wakeLock.request('screen');
  } catch {
    /* zamítnutí nevadí, timer běží dál */
  }
}

function releaseWakeLock() {
  try { wakeLock?.release(); } catch { /* ignore */ }
  wakeLock = null;
}

/** Konec odpočinku: zavibruj a pípni. Zvuk je generovaný, žádný soubor. */
function signalEnd() {
  try { navigator.vibrate?.([200, 100, 200, 100, 320]); } catch { /* ignore */ }
  try {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const beep = (at: number, freq: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      // Náběh a doběh, ať to necvakne.
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + dur + 0.02);
    };
    beep(0, 880, 0.12);
    beep(0.18, 1320, 0.20);
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    /* bez zvuku to pořád funguje */
  }
}

function emit() {
  subscribers.forEach(fn => fn());
}

function set(next: Partial<RestState>) {
  state = { ...state, ...next };
  emit();
}

function tick() {
  if (deadline == null) return;
  const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
  if (left === state.remaining && state.running) return; // bez zbytečného překreslení
  if (left === 0) {
    stopTicker();
    deadline = null;
    releaseWakeLock();
    set({ running: false, remaining: 0 });
    signalEnd();
    return;
  }
  set({ remaining: left });
}

function startTicker() {
  stopTicker();
  ticker = setInterval(tick, 250);
}

function stopTicker() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}

export function startRest(seconds: number, label?: string) {
  deadline = Date.now() + seconds * 1000;
  set({ running: true, remaining: seconds, duration: seconds, label: label ?? null });
  startTicker();
  void acquireWakeLock();
}

export function pauseRest() {
  stopTicker();
  deadline = null;
  releaseWakeLock();
  set({ running: false });
}

export function resumeRest() {
  if (state.remaining <= 0) return;
  deadline = Date.now() + state.remaining * 1000;
  set({ running: true });
  startTicker();
  void acquireWakeLock();
}

export function resetRest(seconds?: number) {
  stopTicker();
  deadline = null;
  const d = seconds ?? state.duration;
  set({ running: false, remaining: d, duration: d });
}

export function dismissRest() {
  stopTicker();
  deadline = null;
  releaseWakeLock();
  set({ running: false, remaining: 0, label: null });
}

export function setRestDuration(seconds: number) {
  stopTicker();
  deadline = null;
  set({ running: false, duration: seconds, remaining: seconds });
}

/** Po návratu z pozadí dopočítej zbytek hned, ať se nečeká na další tik. */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (state.running) {
      tick();
      // Wake Lock se při přepnutí do pozadí uvolní sám, po návratu ho vrať.
      if (!wakeLock) void acquireWakeLock();
    }
  });
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}

function getSnapshot() {
  return state;
}

export function useRestTimer(): RestState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Doporučená délka odpočinku podle typu cviku. */
export function restForCategory(category?: string): number {
  if (category === 'main') return 180;
  if (category === 'accessory') return 120;
  return 90;
}

export function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
