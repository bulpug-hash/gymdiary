// Rytina jako vodoznak v sekci. Leží pod obsahem, nikdy nad ním.
// Zdroje a licence (vše CC0, Met Museum) jsou v client/public/ilu/ZDROJE.md.
export type WatermarkKey =
  | 'athlete' | 'triumph' | 'victory' | 'griffin'
  | 'eagle' | 'knight' | 'helm' | 'warrior';

const BASE = import.meta.env.BASE_URL || './';

interface Props {
  name: WatermarkKey;
  /** Kam v bloku rytinu posadit. */
  position?: string;
  /** Výška vůči bloku. */
  size?: string;
  opacity?: number;
}

export default function Watermark({
  name,
  position = '100% 50%',
  size = 'auto 150%',
  opacity = 0.07,
}: Props) {
  return (
    <div
      className="gd-watermark"
      aria-hidden="true"
      style={{
        backgroundImage: `url("${BASE}ilu/${name}.webp")`,
        backgroundPosition: position,
        backgroundSize: size,
        opacity,
      }}
    />
  );
}
