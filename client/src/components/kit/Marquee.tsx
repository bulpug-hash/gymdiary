// Nekonečný pás. Dvě podoby:
//  - mikrotypografie (výchozí) – streetwearový detail mezi bloky
//  - citáty – větší, pomalejší, s autorem; text se má dát přečíst za chodu
// Respektuje prefers-reduced-motion (viz index.css).
import type { ReactNode } from 'react';

export interface MarqueeQuote {
  text: string;
  author: string;
}

interface Props {
  items?: string[];
  quotes?: MarqueeQuote[];
  /** Invertovaný pás – bílý text na černé, nebo signální barva. */
  tone?: 'line' | 'invert' | 'accent';
  speed?: number;
}

export default function Marquee({ items, quotes, tone = 'line', speed }: Props) {
  const isQuotes = !!quotes && quotes.length > 0;
  // Citáty jsou delší, takže potřebují víc času na projetí, ať se dají číst.
  const duration = speed ?? (isQuotes ? 150 : 42);

  const render = (): ReactNode[] => {
    if (isQuotes) {
      const run = [...quotes!, ...quotes!];
      return run.map((q, i) => (
        <span className="gd-marquee__item gd-marquee__item--quote" key={i}>
          <span className="gd-marquee__quote">„{q.text}“</span>
          <span className="gd-marquee__author">{q.author}</span>
          <i className="gd-marquee__dot" />
        </span>
      ));
    }
    const run = [...(items ?? []), ...(items ?? []), ...(items ?? []), ...(items ?? [])];
    return run.map((t, i) => (
      <span className="gd-marquee__item" key={i}>
        {t}
        <i className="gd-marquee__dot" />
      </span>
    ));
  };

  return (
    <div
      className={`gd-marquee gd-marquee--${tone} ${isQuotes ? 'gd-marquee--quotes' : ''}`}
      aria-hidden="true"
    >
      <div className="gd-marquee__track" style={{ animationDuration: `${duration}s` }}>
        {render()}
      </div>
    </div>
  );
}
