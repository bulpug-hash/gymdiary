// Tichá rotující záloha záznamů.
//
// Všechno visí na jednom klíči v localStorage – stačí vyčistit data prohlížeče
// a je pryč celá historie. Tohle drží dva starší otisky pod jiným klíčem
// a hlídá, jak dlouho si uživatel nestáhl zálohu do souboru.
import type { RecordsMap } from '@/lib/data';

const BACKUP_KEY = 'gymdiary_backup_v1';
const DOWNLOAD_KEY = 'gymdiary_backup_downloaded_at';
const KEEP = 2;
const DAY = 24 * 60 * 60 * 1000;
/** Po kolika dnech bez stažení souboru upozornit. */
export const REMIND_AFTER_DAYS = 14;

export interface Snapshot {
  ts: number;
  count: number;
  records: RecordsMap;
}

export function loadSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Snapshot[]) : [];
  } catch {
    return [];
  }
}

function countRecords(records: RecordsMap): number {
  let n = 0;
  for (const key of Object.keys(records)) {
    n += (records[key] ?? []).filter(r => !r.planned).length;
  }
  return n;
}

/** Zapíše otisk, pokud je poslední starší než den. Vrací true, když zapsala. */
export function maybeAutoBackup(records: RecordsMap): boolean {
  const count = countRecords(records);
  // Prázdná data nikdy nepřepíšou plnou zálohu – to je pojistka proti tomu,
  // aby vyčištěné localStorage smazalo i zálohu.
  if (count === 0) return false;

  const snaps = loadSnapshots();
  const last = snaps[0];
  if (last && Date.now() - last.ts < DAY) return false;
  if (last && count < last.count * 0.5) return false;

  const next: Snapshot[] = [{ ts: Date.now(), count, records }, ...snaps].slice(0, KEEP);
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(next));
    return true;
  } catch {
    // Kvóta – zkus uložit aspoň jeden otisk.
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(next.slice(0, 1)));
      return true;
    } catch {
      return false;
    }
  }
}

export function markDownloaded() {
  try { localStorage.setItem(DOWNLOAD_KEY, String(Date.now())); } catch { /* ignore */ }
}

export function daysSinceDownload(): number | null {
  try {
    const raw = localStorage.getItem(DOWNLOAD_KEY);
    if (!raw) return null;
    return Math.floor((Date.now() - Number(raw)) / DAY);
  } catch {
    return null;
  }
}

export function formatStamp(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}. ${p(d.getMonth() + 1)}. ${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
