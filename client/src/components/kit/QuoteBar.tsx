// Pás s citáty pro celou appku.
//
// Sedí hned pod herem v každé záložce — přesně tam, kde dřív běžely popiskové
// pásy („Podzim ’26 · Bench 130“). Ty jsou pryč, citáty je nahradily.
//
// Neleze do shellu ani se nelepí pod horní lištu: v tomhle místě dělí hero
// od obsahu a nekrade pozornost, když scrolluješ dolů k číslům.
//
// Text jede LOMENÝM písmem (Pirata One) — viz index.css, .gd-marquee--quotes.
// Je to tentýž rejstřík jako gotické číslice „2 4 7" na jejich triku
// Fallen Angel. Ověřeno, že má plnou českou diakritiku (ě ř ů č š ž ď ť ň),
// takže se citáty nerozpadnou na půl gotiku a půl fallback.
//
// Lomené písmo se čte hůř než groteska, proto je tu větší stupeň.
// Kdyby to vadilo, stačí v .gd-marquee__item--quote přepnout font-family
// zpátky na 'Archivo'.
import Marquee from './Marquee';
import { quotesForToday } from '@/lib/quotes';

/** Kolik citátů se dá do jedné smyčky. Víc = delší běh, míň opakování. */
const COUNT = 8;

export default function QuoteBar() {
  const quotes = quotesForToday(COUNT);
  if (quotes.length === 0) return null;

  return (
    <div className="gd-quotebar">
      <Marquee quotes={quotes.map(q => ({ text: q.text, author: q.author }))} />
    </div>
  );
}
