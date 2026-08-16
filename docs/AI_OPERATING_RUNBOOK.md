# GymDiary – provozní návod pro další AI

> Cíl: bezpečně upravovat GymDiary bez porušení plánu, bez ztráty záznamů a s kontrolovatelnou historií v GitHubu.

## 1. Přístup a start

Repozitář je soukromý: https://github.com/bulpug-hash/gymdiary. Vlastník musí další AI připojit k repozitáři; nikdy jí neposílejte heslo ani osobní přístupový token v chatu.

Úvodní prompt:

> „Pracuješ na GymDiary. Nejprve si přečti README.md, docs/AI_HANDOFF.md a docs/AI_OPERATING_RUNBOOK.md. Zachovej češtinu, mobilní rozložení a tmavý vizuální systém. Pracuj v nové větvi, před odevzdáním spusť pnpm check a pnpm build a vytvoř pull request do main. Neměň plán, cíle ani uživatelská data bez mého výslovného potvrzení.“

Před každou změnou spusť:

```bash
git checkout main
git pull --ff-only origin main
pnpm install
pnpm check
git checkout -b feat/kratky-popis-zmeny
```

AI musí před editací přečíst soubor, kterého se změna týká. Bez důvodu nemění stack, závislosti ani záložky aplikace.

| Zadání | Primární soubor |
|---|---|
| 16týdenní plán, váhy, cviky, warm-up | client/src/lib/data.ts |
| Obnovené záznamy 2026 | client/src/lib/recoveryData.ts |
| Silové záznamy a ukládání | client/src/hooks/useWorkoutData.ts |
| Deník, běhy a HIIT | client/src/components/Diary.tsx |
| Export/import záloh | client/src/components/Tools.tsx |
| Přehled, plán a progres | client/src/components/Overview.tsx, Plan.tsx, Progress.tsx |
| Vizuální tokeny | client/src/index.css |

## 2. Neměnitelné produktové mantinely

GymDiary je český osobní tréninkový deník. Základní pořadí týdne je **Po Upper, Út Rest, St HIIT, Čt Lower, Pá Run, So HIIT, Ne Full Body**; W16 má vlastní testovací strukturu.

Bez výslovného souhlasu uživatele neměňte cílové maximálky, datum startu plánu, rozložení záložek, tmavý vzhled se žlutým akcentem ani váhy jiných tréninkových dnů. Hack Squat/Hack Dřep je odstraněn ze všech týdnů a nesmí se vracet.

Obnovovací data: **W1–W14 jsou dokončeny dle potvrzeného plánu, W15 je prázdný a W16 obsahuje pouze Back Squat 170 kg × 1, Bench Press 125 kg × 1 a Deadlift 220 kg × 4 v jedné sérii.** Běhy a HIIT v recoveryData.ts odpovídají jen hodnotám čitelným ze screenshotů. Nikdy nevymýšlejte chybějící vzdálenost, tep, kalorie ani váhy.

## 3. Bezpečný GitHub workflow

Každá logická změna patří do samostatné větve.

```bash
pnpm check
pnpm build
git status
git add <jen-změněné-soubory>
git commit -m "feat: stručný popis změny"
git push -u origin feat/kratky-popis-zmeny
```

Pull request musí obsahovat: **co se změnilo**, **jak bylo ověřeno** a **co zůstává omezením**. Před sloučením ověřte plánové váhy, export a zobrazení deníku na mobilu.

## 4. Povinné zálohování

Před úpravou dat nebo smazáním dat prohlížeče otevřete v aplikaci **Nástroje → Export dat → Kompletní záloha (JSON)**. Soubor obsahuje silové záznamy, běhy, HIIT a tělesnou hmotnost. Uložte ho mimo prohlížeč: do iCloudu, Google Drive, OneDrive nebo do soukromé složky na disku.

Při obnově zvolte **Načíst zálohu (JSON)**. Import nahradí data v aktuálním prohlížeči a aplikace se znovu načte. XLSX slouží pro kontrolu a analýzu; JSON je obnovovací zdroj.

## 5. Proč cache nestačí

Současná statická verze ukládá záznamy do localStorage. Data přetrvají zavření prohlížeče, ale jsou svázána s konkrétním původem a prohlížečem a mohou být smazána uživatelem nebo politikou prohlížeče.[1] IndexedDB je lepší pro větší klientská data, stále však zůstává klientským úložištěm pod stejným původem.[2]

> Čistě statická aplikace proto nemůže automaticky zaručit přežití dat po vymazání dat prohlížeče. JSON export je bezplatná ochranná síť, ne automatická synchronizace.

## 6. Doporučené dlouhodobé řešení bez jiné externí služby

Převeďte GymDiary z web-static na **vestavěný full-stack projekt s databází a přihlášením v rámci stejné platformy**. Záznamy se budou ukládat na server podle přihlášeného uživatele; vymazání cache pak smaže jen lokální kopii, nikoli zdroj dat.

| Varianta | Přežije vymazání cache | Doporučení |
|---|---:|---|
| localStorage | Ne | Nedostatečné |
| IndexedDB | Ne | Pouze lepší offline UX |
| Ruční JSON záloha | Ano, pokud je soubor mimo prohlížeč | Povinné hned teď |
| Přímé ukládání do GitHubu z prohlížeče | Ano | Nedoporučeno: tokeny/OAuth a GitHub není databáze |
| Vestavěná databáze s přihlášením | Ano | **Doporučené trvalé řešení** |

Dostupnost databázové funkce v aktuálním účtu se musí ověřit v nastavení projektu; neodhadujte ani neslibujte cenu či limity.

## 7. Přesné zadání pro AI, která udělá trvalou synchronizaci

> „Převeď GymDiary na vestavěný full-stack projekt s uživatelským přihlášením a databází. Zachovej vzhled i záložky. Vytvoř tabulky pro silové záznamy, běhy, HIIT a tělesnou hmotnost, vždy vázané na přihlášeného uživatele. Přidej jednorázový import existující zálohy, který před zápisem ukáže počet položek a vyžádá potvrzení. Zachovej JSON/XLSX export. Po migraci nesmí smazání cache ani přechod na jiné zařízení odstranit data. Přidej testy CRUD operací a ověř import na obnovovací záloze.“

Lokální úložiště může zůstat jako krátkodobá offline cache, nikdy však jako jediný zdroj pravdy.

## Reference

[1] [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

[2] [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
