// Značka odškrtnuté série.
//
// Předtím to byl textový znak '✓' — ten se kreslí systémovým fontem, takže
// na každém zařízení vypadá jinak, je oblý a s ničím v kitu nekoresponduje.
//
// Tohle je kreslený tvar v typografické logice 247: SAMÉ PŘÍMKY, spoje a konce
// seříznuté pod 45°, žádný oblouk. Stejná anatomie jako jejich displejové
// číslice „247" (viz Represent_247_dokumenty/TYPOGRAFIE_analyza.md).
//
// Represent sám žádnou fajfku nepoužívá — jejich UI zná jen ×, šipky a +/−.
// Tvar je proto odvozený z jejich typografie, ne okopírovaný z ikony.
//
// Varianty jsou zvenčí přepnutelné, ať se dá vzhled změnit jedním slovem.
// Náhledy všech deseti: ~/Desktop/Represent_check_varianty/index.html

export type TickVariant = 'solid' | 'cornerCut' | 'outline' | 'bracket';

interface Props {
  /** Výchozí 'solid' — plný signální čtverec s vyseknutou fajfkou. */
  variant?: TickVariant;
  className?: string;
}

/** Fajfka se zkosenými konci. Sdílí ji víc variant. */
const CHECK = 'M18.6 33.2 7.4 22l3.4-3.4 7.8 7.8L34.6 10.4 38 13.8 22 29.8z';

export default function Tick({ variant = 'solid', className }: Props) {
  const common = {
    className,
    viewBox: '0 0 48 48',
    'aria-hidden': true as const,
    focusable: 'false' as const,
  };

  if (variant === 'outline') {
    return (
      <svg {...common}>
        <path
          d="m9 23.4 9.6 9.6L39 12.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
      </svg>
    );
  }

  if (variant === 'bracket') {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M2 2h10v4.6H6.6v34.8H12V46H2zM46 2H36v4.6h5.4v34.8H36V46h10z"
        />
        <path fill="currentColor" d="m21.6 32-7.8-7.8 3-3 4.8 4.8L33.2 15l3 3z" />
      </svg>
    );
  }

  // 'solid' i 'cornerCut' jsou plný blok s vyseknutou fajfkou (fill-rule: evenodd).
  const box =
    variant === 'cornerCut'
      ? 'M0 0h34l14 14v34H0z' // seříznutý roh — podpis 247
      : 'M0 0h48v48H0z';

  return (
    <svg {...common}>
      <path fill="currentColor" fillRule="evenodd" d={`${box}${CHECK}`} />
    </svg>
  );
}
