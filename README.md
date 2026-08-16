# GymDiary

> Český osobní tréninkový deník pro 16týdenní silově-hypertrofický plán. Aplikace sleduje tréninky, běhy, HIIT, tělesnou hmotnost, progres a tréninkový plán.

## Rychlý start

Projekt používá **React 19**, **TypeScript**, **Vite**, **Tailwind CSS 4** a komponenty shadcn/ui.

| Úkon | Příkaz |
|---|---|
| Instalace závislostí | `pnpm install` |
| Lokální vývoj | `pnpm dev` |
| Kontrola TypeScriptu | `pnpm check` |
| Produkční build | `pnpm build` |
| Formátování | `pnpm format` |

## Důležité informace

| Oblast | Umístění | Poznámka |
|---|---|---|
| Tréninkový plán a výchozí historie | `client/src/lib/data.ts` | Obsahuje 16 týdnů, váhy, cviky, rozehřívací série a historické výchozí záznamy. |
| Zápisy cviků | `client/src/hooks/useWorkoutData.ts` | Ukládají se do `localStorage` pod klíčem `gymdiary_records_v3`. |
| Běhy a HIIT | `client/src/components/Diary.tsx` | Ukládají se do `localStorage` samostatně. |
| Přehled, plán, deník, progres a nástroje | `client/src/components/` | Zachovávejte existující strukturu záložek. |
| Sdílený vzhled | `client/src/index.css` | Jde o tmavý, sportovní design se žlutým akcentem. |

> **Omezení současné verze:** Záznamy uživatele nejsou v databázi. Vymazání dat prohlížeče, změna prohlížeče nebo použití nového zařízení může data odstranit. Než se přidá databáze nebo export/import, nepovažujte localStorage za zálohu.

## Jak zadat úkol jiné AI

Nejprve ji nechte přečíst soubor [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md). Poté může dostat například tento prompt:

> „Pracuješ na GymDiary. Nejdřív si přečti `README.md`, `docs/AI_HANDOFF.md` a relevantní soubory. Zachovej rozložení aplikace a češtinu. Změnu proveď v samostatné větvi, spusť `pnpm check` a před otevřením pull requestu stručně popiš, co se změnilo a jak byla změna ověřena.“

## GitHub workflow

Používejte jednu větev pro jednu logickou změnu. Po ověření vytvořte pull request do `main`; tím zůstane historie změn přehledná a projekt půjde kdykoli vrátit k funkční verzi.

```bash
git checkout -b feat/popisek-zmeny
# upravit soubory
pnpm check
git add .
git commit -m "feat: stručný popis změny"
git push -u origin feat/popisek-zmeny
```

## Soukromí

Repozitář ponechte **soukromý**. Nevkládejte do něj osobní přístupové údaje, `.env` soubory ani kopie exportovaných osobních tréninkových dat.
