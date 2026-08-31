// Hero pás. Skládaný na telefon: plná šířka, obsah ukotvený dole,
// titulek přes celou šířku a hlavní číslo pod linkou na vlastním řádku –
// na 390 px se nemá s čím prát o místo.
import type { ReactNode } from 'react';
import Plate, { type PlateKey } from './Plate';

interface Props {
  plate: PlateKey;
  /** Mikropopisek nahoře – „garment tag“ kitu. */
  kicker: string;
  /** Hlavní titulek. Zalomení řeš pomocí <br />. */
  title: ReactNode;
  /** Řádek úplně dole – datum, fáze, verze. */
  meta?: ReactNode;
  /** Velké číslo pod linkou. */
  stat?: { label: string; value: string; unit?: string };
  /** Posterový režim podle plakátů 247 RUN: obří modrý titulek a pod ním
   *  mřížka popisek → hodnota vpravo. */
  poster?: boolean;
  /** Levý popisný řádek v mřížce. */
  lead?: ReactNode;
  /** Pravé dvojice popisek → hodnota. */
  specs?: { label: string; value: string }[];
  /** Obří duch číslice v pozadí desky. */
  ghost?: string;
  size?: 'lg' | 'sm';
}

export default function Hero({
  plate, kicker, title, meta, stat, ghost, size = 'sm', poster, lead, specs,
}: Props) {
  return (
    <header className={`gd-hero ${size === 'lg' ? 'gd-hero--lg' : ''} ${poster ? 'gd-hero--poster' : ''}`}>
      <Plate variant={plate} ghost={ghost} />

      <div className="gd-hero__inner">
        <div className="gd-hero__tagline">
          <span className="gd-lockup">247</span>
          <span className="gd-tag">{kicker}</span>
          <span className="gd-hero__rule" />
        </div>

        <h1 className="gd-display gd-hero__title">{title}</h1>

        {poster && (lead || specs) && (
          <div className="gd-poster__grid">
            {lead && <div className="gd-poster__lead">{lead}</div>}
            {specs && (
              <dl className="gd-poster__specs">
                {specs.map(sp => (
                  <div className="gd-poster__row" key={sp.label}>
                    <dt>{sp.label}</dt>
                    <dd>{sp.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        {stat && (
          <div className="gd-hero__stat">
            <span className="gd-tag">{stat.label}</span>
            <span className="gd-hero__statwrap">
              <span className="gd-display gd-hero__statnum">{stat.value}</span>
              {stat.unit && <span className="gd-hero__statunit">{stat.unit}</span>}
            </span>
          </div>
        )}

        {meta && <div className="gd-hero__meta">{meta}</div>}
      </div>
    </header>
  );
}
