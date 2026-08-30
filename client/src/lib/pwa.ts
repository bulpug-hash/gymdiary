// Registrace service workeru a stav aktualizace mimo React strom
// (stejný vzor jako lib/restTimer.ts).
import { useSyncExternalStore } from 'react';

export interface PwaState {
  /** Čeká nová verze na aktivaci. */
  updateReady: boolean;
  /** Shell je předcachovaný – appka pojede i bez signálu. */
  offlineReady: boolean;
}

let state: PwaState = { updateReady: false, offlineReady: false };
let waiting: ServiceWorker | null = null;
const subscribers = new Set<() => void>();

function set(next: Partial<PwaState>) {
  state = { ...state, ...next };
  subscribers.forEach(fn => fn());
}

export function registerSW() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;

  const swUrl = `${import.meta.env.BASE_URL || './'}sw.js`;

  navigator.serviceWorker
    // updateViaCache: 'none' – GitHub Pages posílá max-age=600, jinak by se
    // nová verze SW chytila až s desetiminutovým zpožděním.
    .register(swUrl, { updateViaCache: 'none' })
    .then(reg => {
      if (reg.active && !navigator.serviceWorker.controller) set({ offlineReady: true });
      if (reg.waiting) { waiting = reg.waiting; set({ updateReady: true }); }

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state !== 'installed') return;
          if (navigator.serviceWorker.controller) {
            waiting = sw;
            set({ updateReady: true });
          } else {
            set({ offlineReady: true });
          }
        });
      });
    })
    .catch(() => { /* bez SW appka funguje dál, jen ne offline */ });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

export function applyUpdate() {
  if (!waiting) { window.location.reload(); return; }
  waiting.postMessage('SKIP_WAITING');
}

export function dismissOfflineNotice() {
  set({ offlineReady: false });
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}

function getSnapshot() {
  return state;
}

export function usePwa(): PwaState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
