// Citáty do běžícího pásu v Plánu.
//
// PRAVIDLO: sem patří jen DOLOŽENÉ výroky. Web je veřejný a jsou to skuteční
// žijící lidé — vymyslet nebo parafrázovat větu a podepsat ji jejich jménem
// se nesmí. U každého citátu proto drž `source`; nezobrazuje se, ale je to
// stopa, podle které se dá původ dohledat.
//
// Všechny níže jsou dohledané v konkrétním rozhovoru nebo knize, ne v citátové
// sbírce. Když budeš přidávat další, drž stejnou laťku: primární zdroj, doslovné
// znění, žádné zkracování ani „vylepšování“.
export interface Quote {
  text: string;
  author: string;
  lang: 'cs' | 'en';
  /** Odkud výrok pochází – kvůli dohledatelnosti. */
  source: string;
}

export const QUOTES: Quote[] = [
  // ——— Jiří Procházka ———————————————————————————————————————————
  // Rozhovor pro Seznam Zprávy: „Krvavý boj jako umění: Je to cesta samurajů“
  { text: 'Je to o pokoře, cti, rozhodnosti.',
    author: 'Jiří Procházka', lang: 'cs', source: 'Seznam Zprávy, rozhovor' },
  { text: 'Člověk to musí mít v hlavě srovnané, aby byl klidný a soustředěný.',
    author: 'Jiří Procházka', lang: 'cs', source: 'Seznam Zprávy, rozhovor' },
  // Rozhovor pro iSport: „Procházka o návratu i kodexu bushido“
  { text: 'Já znám skutečnou váhu slova.',
    author: 'Jiří Procházka', lang: 'cs', source: 'iSport, rozhovor' },
  { text: 'Chci se soustředit pouze na svou cestu, tréninky a nejbližší.',
    author: 'Jiří Procházka', lang: 'cs', source: 'iSport, rozhovor' },
  { text: 'S upřímností mohu mluvit pouze o sobě samém, protože pouze sám sebe opravdu znám.',
    author: 'Jiří Procházka', lang: 'cs', source: 'iSport, rozhovor' },
  { text: 'Chci s upřímností přistupovat ke každému aspektu života, ke každému momentu, jako by byl tím posledním.',
    author: 'Jiří Procházka', lang: 'cs', source: 'iSport, rozhovor' },
  // Rozhovor pro Reportér: „Nikomu nechci způsobit zbytečnou bolest"
  { text: 'Posun je život. Člověk se buď vyvíjí a mění, nebo stagnuje a ochabuje.',
    author: 'Jiří Procházka', lang: 'cs', source: 'Reportér, rozhovor' },
  { text: 'Mysl je jen nástroj, takže na ten trénink vstanu vždycky.',
    author: 'Jiří Procházka', lang: 'cs', source: 'Reportér, rozhovor' },
  { text: 'Každodenní dosahování mistrovství. Zlepšování disciplíny.',
    author: 'Jiří Procházka', lang: 'cs', source: 'Reportér, rozhovor' },
  { text: 'Semtam jsem unavený, ano, ale dávno už znám klíče, jak probudit energii.',
    author: 'Jiří Procházka', lang: 'cs', source: 'Reportér, rozhovor' },
  { text: 'Dokud vnitřně cítím, že je potřeba něco doladit nebo ještě jednou projet, zůstávám.',
    author: 'Jiří Procházka', lang: 'cs', source: 'Reportér, rozhovor' },

  // ——— Ondřej Vetchý ————————————————————————————————————————————
  // Rozhovor pro Deník.cz, červenec 2015:
  // „Sport jednoznačně profiluje charakter člověka“
  { text: 'Sport je jedna z věcí, která naprosto profiluje charakter člověka.',
    author: 'Ondřej Vetchý', lang: 'cs', source: 'Deník.cz, rozhovor 2015' },
  { text: 'Věřím, že úspěch ve sportu je triumfem nejenom talentu a potřebného štěstí, ale i vůle, ducha, vytrvalosti a odhodlání.',
    author: 'Ondřej Vetchý', lang: 'cs', source: 'Deník.cz, rozhovor 2015' },
  { text: 'Odvaha, osobní odpovědnost, zatáhnout za druhého, když mu to nejde.',
    author: 'Ondřej Vetchý', lang: 'cs', source: 'Deník.cz, rozhovor 2015' },

  // ——— David Goggins ————————————————————————————————————————————
  { text: 'Stay hard.',
    author: 'David Goggins', lang: 'en', source: 'jeho dlouhodobé heslo (knihy, sítě, přednášky)' },
  { text: 'Motivation is crap.',
    author: 'David Goggins', lang: 'en', source: "kniha Can't Hurt Me" },
  { text: 'You must go to war with yourself before you find peace.',
    author: 'David Goggins', lang: 'en', source: 'The Rich Roll Podcast' },
  { text: 'You build calluses on your feet to endure the road. You build callouses on your mind to endure the pain.',
    author: 'David Goggins', lang: 'en', source: "kniha Can't Hurt Me" },
  { text: "I don't stop when I'm tired. I stop when I'm done.",
    author: 'David Goggins', lang: 'en', source: "kniha Can't Hurt Me" },
  { text: "We're either getting better or we're getting worse.",
    author: 'David Goggins', lang: 'en', source: "kniha Can't Hurt Me" },
  { text: 'Denial is the ultimate comfort zone.',
    author: 'David Goggins', lang: 'en', source: "kniha Can't Hurt Me" },
  { text: "The most important conversations you'll ever have are the ones you'll have with yourself.",
    author: 'David Goggins', lang: 'en', source: "kniha Can't Hurt Me" },
];

/**
 * Autoři prostřídaní po jednom. Pole je psané po autorech, takže brát šest
 * po sobě jdoucích znamenalo šest Gogginsů za sebou — takhle je v pásu
 * pokaždé mix.
 */
/** Výroky rozdělené po autorech, v pořadí, v jakém jsou v QUOTES. */
const PODLE_AUTORU: Quote[][] = (() => {
  const map = new Map<string, Quote[]>();
  for (const q of QUOTES) {
    const arr = map.get(q.author) ?? [];
    arr.push(q);
    map.set(q.author, arr);
  }
  return Array.from(map.values());
})();

/**
 * Deterministický výběr na den. Pořadí se drží celý den stejné (ať to
 * nepřeskakuje při každém překreslení), ale mezi dny se posouvá.
 *
 * ⚠️ KAŽDÝ AUTOR MUSÍ BÝT V KAŽDÉM DNI ZASTOUPENÝ. Původní verze skládala
 * jeden společný seznam střídavě po autorech a pak z něj brala okno šesti
 * po sobě jdoucích. Protože Vetchý má jen tři výroky, seděl v tom seznamu
 * na pozicích 1, 4 a 7 — a okno ho na 10 z 22 dní minulo úplně.
 * Teď se bere kolo po autorech: dokud má autor co nabídnout, dostane slovo.
 */
export function quotesForToday(count = 6): Quote[] {
  if (QUOTES.length === 0) return [];
  const now = new Date();
  const dayIndex = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000,
  );

  const out: Quote[] = [];
  const limit = Math.min(count, QUOTES.length);
  // Kolo po autorech: v každém kole si každý autor vezme další svůj výrok,
  // posunutý o den. Tím je i tříprvkový autor vidět vždycky.
  for (let kolo = 0; out.length < limit; kolo++) {
    let pridano = false;
    for (const list of PODLE_AUTORU) {
      if (out.length >= limit) break;
      if (kolo >= list.length) continue;
      const idx = (((dayIndex + kolo) % list.length) + list.length) % list.length;
      const q = list[idx];
      if (!out.includes(q)) { out.push(q); pridano = true; }
    }
    // Pojistka proti nekonečné smyčce, kdyby se výroky vyčerpaly.
    if (!pridano) break;
  }
  return out;
}
