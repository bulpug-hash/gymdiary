// Hmatová odezva na potvrzené úkony.
//
// V posilovně máš oči jinde než na displeji — cvaknutí je potvrzení, že se
// série opravdu zapsala, aniž bys musel kontrolovat obrazovku.
//
// iOS Safari `navigator.vibrate` NEPODPORUJE (Apple ho záměrně neimplementoval).
// Na Androidu a v desktopovém Chrome funguje. Necháváme to tady proto, že to
// nic nestojí a je to graceful — kde to nejde, prostě se nic nestane.
// Nikdy na tom nesmí viset logika, je to jenom potvrzení navíc.

function vibruj(vzor: number | number[]) {
  try { navigator.vibrate?.(vzor); } catch { /* nepodstatné */ }
}

/** Drobné cvaknutí — odškrtnutí série, přepnutí volby. */
export function tap() { vibruj(12); }

/** Potvrzení uloženého záznamu. */
export function ulozeno() { vibruj([14, 40, 14]); }

/** Něco se nepovedlo. */
export function chyba() { vibruj([50, 60, 50]); }
