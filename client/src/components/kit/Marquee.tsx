// Nekonečný pás mikrotypografie. Streetwearový detail, který drží stránku
// pohromadě mezi bloky. Respektuje prefers-reduced-motion (viz index.css).
interface Props {
  items: string[];
  /** Invertovaný pás – bílý text na černé, nebo signální barva. */
  tone?: 'line' | 'invert' | 'accent';
  speed?: number;
}

export default function Marquee({ items, tone = 'line', speed = 42 }: Props) {
  const run = [...items, ...items, ...items, ...items];
  return (
    <div className={`gd-marquee gd-marquee--${tone}`} aria-hidden="true">
      <div className="gd-marquee__track" style={{ animationDuration: `${speed}s` }}>
        {run.map((t, i) => (
          <span className="gd-marquee__item" key={i}>
            {t}
            <i className="gd-marquee__dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
