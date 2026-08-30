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
];

/**
 * Deterministický výběr na den. Pořadí se drží celý den stejné (ať to
 * nepřeskakuje při každém překreslení), ale mezi dny se posouvá.
 */
export function quotesForToday(count = 6): Quote[] {
  if (QUOTES.length === 0) return [];
  const now = new Date();
  const dayIndex = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000),
  );
  const offset = ((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length;
  const out: Quote[] = [];
  for (let i = 0; i < Math.min(count, QUOTES.length); i++) {
    out.push(QUOTES[(offset + i) % QUOTES.length]);
  }
  return out;
}
