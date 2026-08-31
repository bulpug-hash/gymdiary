// Pás s citáty pro celou appku.
//
// Dřív visel jen v Plánu. Teď sedí v shellu (Home.tsx), takže běží na každé
// záložce — je to jediný prvek, který je v appce pořád, a drží tón.
//
// Lepí se pod horní lištu, ne pod obsah: citát se má dát přečíst kdykoli,
// ne jen na začátku stránky. Výška je záměrně malá, aby to nekradlo obsah.
//
// Text jede groteskem (Archivo), ne serifem — viz index.css, .gd-marquee--quotes.
// Důvod: sedí to k technickému tónu 247, kdežto kurzivní serif působil jako
// citace z knížky. Archivo je tady jediný legální stand-in za jejich Bureau Sans,
// který je komerční a na veřejný web ho nasadit nejde.
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
