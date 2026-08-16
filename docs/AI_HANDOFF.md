# Handoff pro AI asistenta

## Účel aplikace

GymDiary je statická mobilně orientovaná aplikace v češtině pro jednoho powerliftera. Slouží k prohlížení 16týdenního plánu a zápisu silových tréninků, běhů, HIIT a tělesné hmotnosti.

## Technický kontext

| Téma | Pravidlo |
|---|---|
| Stack | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Wouter. |
| Jazyk UI | Výhradně čeština, pokud uživatel výslovně nepožádá jinak. |
| Typ projektu | Statický frontend bez databáze a bez backendové logiky. |
| Správce balíčků | `pnpm`; neměňte na npm ani yarn. |
| Ověření | Před předáním vždy spusťte `pnpm check`; při změně chování také ručně ověřte relevantní tok v prohlížeči. |
| Vzhled | Neměňte rozložení nebo vizuální jazyk bez výslovného požadavku uživatele. |

## Kde se co mění

| Potřeba | Primární soubor | Poznámka |
|---|---|---|
| Týdny plánu, cviky, váhy, cíle, rozehřívací série | `client/src/lib/data.ts` | Změny musí zachovat pořadí dní: Po Upper, Út Rest, St HIIT, Čt Lower, Pá Run, So HIIT, Ne Full Body. |
| Zápis a historie silových tréninků | `client/src/components/Diary.tsx`, `client/src/hooks/useWorkoutData.ts` | Současné záznamy cviků jsou v `localStorage`. |
| Běhy a HIIT | `client/src/components/Diary.tsx` | Používají vlastní localStorage klíče. |
| Domovská obrazovka | `client/src/components/Overview.tsx` | Zobrazuje dnešní plán a rozehřívací série. |
| Celý plán | `client/src/components/Plan.tsx` | Neprovádějte plošné přeuspořádání karet bez žádosti uživatele. |
| Statistiky | `client/src/components/Progress.tsx` | Pracuje s existujícími záznamy z hooku. |
| Export, kalkulačky a dokumenty | `client/src/components/Tools.tsx` | Pozor na kompatibilitu exportu XLSX. |
| Design tokeny | `client/src/index.css` | Zachovejte tmavý základ a žlutý akcent. |

## Datová pravidla

> Historické záznamy v `DEFAULT_RECORDS` jsou výchozí ukázkové/historické hodnoty v aplikaci. Nikdy nevytvářejte smyšlené recenze, hodnocení, svědectví ani sportovní výkony.

Tréninkové zápisy jsou nyní uložené pouze lokálně v prohlížeči. Při požadavku na bezpečné ukládání dat navrhněte nejprve export/import zálohy nebo přechod na databázi. Neprohlašujte, že lze ztracená localStorage data obnovit, pokud neexistuje export, záloha prohlížeče nebo původní zařízení.

## Povinný postup pro změnu

1. Nejdřív přečtěte relevantní soubor a určete co přesně se mění.
2. Zachovejte stávající strukturu aplikace, češtinu a mobilní použitelnost.
3. Upravujte konkrétní data nebo komponenty; neměňte bez potřeby technologický stack.
4. Spusťte `pnpm check`. Pokud se mění UX, ověřte ho v prohlížeči.
5. Do pull requestu napište rozsah změny, ověření a případné omezení.

## Příklad zadání pro AI

> „V GymDiary uprav pouze Lower Body v týdnech W2–W14. Zachovej cílové testovací váhy, strukturu dnů i vzhled. Před úpravou ukaž tabulku výpočtů, po úpravě spusť `pnpm check` a napiš přehled změněných souborů.“

## Zakázané zkratky

Nemažte uživatelské záznamy z localStorage. Neměňte automaticky 1RM, cílové maxy nebo váhy v jiných tréninkových dnech, pokud uživatel požádal jen o jednu část plánu. Nevkládejte velké binární soubory do `client/public` ani `client/src/assets`; používejte externí persistentní URL pro větší média.
