# GymDiary — kontext pro AI asistenta

Osobní tréninkový deník Tomáše Jirků (26 let, 95 kg, 184 cm, česky).
Jednouživatelská PWA. Živě běží na **https://bulpug-hash.github.io/gymdiary/**

---

## 1. Rychlý start

```bash
pnpm install
pnpm dev        # vite dev server
pnpm check      # tsc --noEmit  — MUSÍ projít před každým commitem
pnpm build      # vite build + esbuild serveru → dist/
```

**Před každým pushem spusť `pnpm check` i `pnpm build`.** Deploy je automatický a rozbitý build znamená rozbitý web.

---

## 2. Deploy

`.github/workflows/deploy.yml` → push do `main` → GitHub Actions → GitHub Pages.
Build běží s `vite build --base=./`, takže všechny cesty jsou relativní.
Trvá ~90–120 s. Ověř výsledek přes Actions API nebo tvrdým reloadem s cache-busting query (`?v=N`).

Repo: `bulpug-hash/gymdiary` (public, kvůli Pages na free plánu).
Manus (původní hosting) je **kompletně odstraněný** — nic na něm nesmí záviset.

**Pozor:** kontejner Claude Cowork nemá přístup na `api.github.com` ani `git push` (agent proxy vrací 403).
Push se dělá přes uživatelův počítač — `mcp__remote-devices__device_bash` na jeho stroji síť má:

```bash
# na jeho stroji
git clone https://x-access-token:$TOKEN@github.com/bulpug-hash/gymdiary.git
```

Soubory se tam dostanou přes `SendUserFile` (tarball) → `device_commit_files` do `~/Downloads/`
→ `tar xzf` v klonu → commit → push. Base64 v heredocu **nefunguje spolehlivě** (data se komolí),
tarball přes `device_commit_files` je ověřená cesta. Vždy porovnej `sha256` na obou stranách.

---

## 3. Architektura

```
client/
  index.html               ← Google Fonts (Archivo), theme-color, manifest
  public/docs/             ← zdrojové dokumenty ke stažení (plán v5.2 .docx)
  src/
    index.css              ← DESIGN TOKENY (--gd-*) pro obě témata + Tailwind aliasy
    App.tsx                ← ThemeProvider (dark default, switchable), Toaster
    pages/Home.tsx         ← shell + spodní navigace (6 záložek)
    contexts/ThemeContext.tsx
    hooks/useWorkoutData.ts← localStorage persistence + merge záznamů
    lib/
      data.ts              ← ⭐ JEDINÝ ZDROJ PRAVDY (~200 KB)
      weekGuide.ts         ← texty pro záložku Průvodce
      exerciseDescriptions.ts
      recoveryData.ts      ← obnovená historie W1–W14 (čte LEGACY_PLAN_WEEKS)
      types.ts             ← type Tab
    components/
      Overview.tsx Plan.tsx Guide.tsx Diary.tsx Progress.tsx Tools.tsx
```

### Záložky (pořadí v `TABS` v Home.tsx)
`01 Přehled · 02 Plán · 03 Průvodce · 04 Deník · 05 Progres · 06 Nástroje`

### Klíčové exporty v `lib/data.ts`

| Export | Význam |
|---|---|
| `GOALS` | `{ bench: 130, squat: 190, deadlift: 230 }` |
| `STARTING_MAXES` / `CURRENT_MAXES` | `{ bench: 127, squat: 185, deadlift: 230 }` |
| `PLAN_START_DATE` | `'2026-08-31'` — pondělí, začátek T1 |
| `PHASE3_WEEKS` | aktuální plán, 13 týdnů (`np1`…`np13`), Po–Ne |
| `LEGACY_PLAN_WEEKS` | starý plán `w1`…`w16` — **nemazat**, drží historii |
| `DEFAULT_RECORDS` | reálná historie (únor–srpen 2026) |
| `PLANNED_RECORDS` | 295 předepsaných sérií, `planned: true` |
| `WARMUP_SERIES_BY_WEEK` | rozehřívací série (Zatsiorsky) |
| `Exercise.setPlan` | `{ label, weight, reps, rpe }[]` — rozpis pracovních sérií |

### Jak fungují předepsané záznamy (`planned`)

- `PLANNED_RECORDS` mají id `plan-w{tyden}-{po|ut|pa}-{exId}[-i]` a `planned: true`.
- `loadRecords()` v `useWorkoutData.ts` při **každém** načtení zahodí uložené záznamy
  s `planned === true` a `id.startsWith('plan-')` a nahradí je aktuální verzí z `data.ts`.
  Díky tomu se posun termínů plánu propíše i do prohlížeče, kde už data leží.
- Jakmile uživatel sérii přepíše, `updateRecord` nastaví `planned: false` → záznam je jeho
  a synchronizace se ho už nikdy nedotkne.
- `planned` záznamy jsou **vyloučené** z: grafů v Progresu, „poslední" hodnoty,
  ALL-TIME PR odznaku a týdenního objemu.

**Když měníš plán, měň i `PLANNED_RECORDS` — jinak se deník rozejde s Plánem.**

---

## 4. Design systém — kit „247"

Vizuál vychází ze značky **Represent / 247** (representclo.com): tonální monochrom,
ostré hrany, obří grotesková čísla, jedna signální barva, hodně vzduchu.
**Skládá se na telefon** — 390 px je referenční šířka, desktop je jen dorovnání.

### Obrázky — pozor

V appce **nejsou žádné fotky**. Původně tam byly volně licencované snímky z Unsplash,
uživatel je odmítl a chtěl fotky přímo z Representu / jejich sítí. To jsou cizí
autorské snímky a web běží veřejně na github.io, takže se nenasadily.
Místo nich je **`Plate.tsx`** — grafická deska kreslená celá v CSS/SVG
(halftone rastr, světelná louže, duch číslice, technické linky, zrno).
Nic se nestahuje, na retině je to ostré a načte se to okamžitě.

Až uživatel dodá **vlastní fotky** (nebo doloží licenci), stačí je hodit do
`client/public/img/` a v `Hero.tsx` vyměnit `<Plate>` za `<img>`. Grade, který
sjednotí libovolné snímky do kitu:
```bash
convert vstup.jpg -colorspace Gray -sigmoidal-contrast 3.5,48% -modulate 96,100,100 \
  -resize 1600x900^ -gravity center -extent 1600x900 -quality 72 out.webp
```

### Tokeny (`client/src/index.css`)

Všechny barvy v komponentách jdou přes `var(--gd-*)`. **Nikdy nepiš hex přímo do komponent** —
rozbil bys světlé téma.

| Token | Tmavé (default) | Světlé |
|---|---|---|
| `--gd-ink` | `#0E0E0E` jet black | `#FFFFFF` flat white |
| `--gd-surface` / `-2` | `#161615` / `#1E1E1C` | `#F4F4F2` / `#EAEAE7` |
| `--gd-line` | `#2C2C28` | `#D8D8D4` |
| `--gd-text` → `-4` | `#E6E3D9` → `#4C4A44` | `#0A0A0A` → `#A3A39E` |
| `--gd-accent` | `#D9F24B` hi-vis volt | `#0A0A0A` (signálem je inverze) |
| `--gd-accent-ink` | `#0E0E0E` | `#FFFFFF` |
| `--gd-fern` | `#8C9B63` | `#4A5732` |
| `--gd-danger` | `#C9663F` | `#9E4526` |

**Jedna signální barva, volt.** Zkoušela se displejová modrá z plakátů
247 RUN na posterový titulek, ale appka pak měla dvě signálky. Sjednoceno
zpátky na volt: `--hero-hi` je `#D9F24B` v OBOU tématech (deska pod herem
je vždycky černá, takže volt drží i ve světlém režimu).

**Průhlednost NIKDY nedělej spojováním hexu.** `` `${color}20` `` vyrobí
`var(--gd-accent)20`, což je neplatné CSS a prohlížeč celou deklaraci zahodí —
tinty a rámečky pak byly půl roku neviditelné. Používej `tint()` z `@/lib/tint`:
```ts
background: tint(catColor, 13)   // color-mix(in srgb, <barva> 13%, transparent)
```

### Kit komponenty (`client/src/components/kit/`)

| Soubor | K čemu |
|---|---|
| `Hero.tsx` | Celoplošná hlavička záložky: lockup 247, titulek, velké číslo pod linkou, meta řádek |
| `Plate.tsx` | Kreslená deska pod hero (halftone, světlo, duch číslice, zrno) |
| `Marquee.tsx` | Nekonečný pás. Používá ho už jen `QuoteBar` — popiskové pásy v záložkách jsou pryč |
| `QuoteBar.tsx` | Citáty pod horní lištou, běží na každé záložce |
| `SectionHead.tsx` | Číslo + popisek + linka. Jednotná hlavička každé sekce |
| `Reveal.tsx` | Odhalení při scrollu přes IntersectionObserver (bez knihovny) |

### Pravidla kitu

1. **Žádné rádiusy.** `borderRadius: 0` všude; `'50%'` jen pro tečky.
2. **Žádné stíny, žádný `backdrop-filter`.** Hranu dělá barva nebo linka 1 px `var(--gd-line)`.
   Blur na lištách žral baterku a dělal artefakty při překreslování.
3. **Písmo: tři registry.** Značka sama vrství víc typografických rejstříků
   (grotesk + patky + gotické číslice „2 4 7" na triku Fallen Angel).
   Jejich vlastní STK Bureau Sans/Serif jsou komerční a nasadit je nejde,
   ale princip ano:
   - **Archivo** (osa `wdth 62..125`) — data, displej, mikropopisky
   - **Source Serif 4** přes `.gd-serif` — próza: popisy fází a týdnů,
     výklad v Průvodci
   - **Pirata One** (lomené) — citáty v pásu a popisky spodní lišty.
     Má jediný řez 400, takže **nikdy nenastavuj `font-weight` nad 400** —
     tučné by se jen syntetizovalo a rozmazalo. Aktivní záložka se proto
     odlišuje barvou, ne váhou. Ověřeno, že má plnou českou diakritiku.
     Gotika snese malý stupeň hůř než groteska: v liště 12,5 px (ne 7,5),
     v citátech 17 px.
   Display = třída `.gd-display` (`fontStretch 118%`, `weight 800`, `line-height 0.92`).
   `line-height` **nesmí pod 0.92** — ořezávalo by háčky u Ě/Ř/Č.
   Mikropopisky = `.gd-tag` (9 px, `700`, `letterSpacing .24em`, uppercase).
4. **Signální barva jen na:** dnešní den, aktuální týden, top/overload sérii,
   osobní rekord, aktivní záložku. Nikde jinde.
5. **Žádné emoji v UI.** Místo ikon typografické kódy (`247`, `WU`, `XLS`) nebo
   kreslené ikony (`NavIcon.tsx`).

   Ikony jsou **plné siluety, ne obrysy** — to je jazyk jejich vlastní grafiky
   (Noble Knight, Fallen Angel jsou plné černé siluety, ne linky) a zároveň
   jediné, co v 26 px drží tvar. Motivy: helm, korouhev, kodex, brk, křídlo,
   zkřížená kladiva.

   Rytiny z knihovny se do lišty použít **nedají** — ověřeno dvakrát: přímo
   i přes prahování na siluetu. Jsou to kresby čarou, ne masa, takže v téhle
   velikosti z nich zbude šum.
   Šipky `→ ← ↑ ↓ ▼` jsou typografie, ne emoji — ty zůstávají.
6. **Hero je vždycky tmavý**, i ve světlém tématu — deska pod ním je černá.
   Ve světlém kitu je jeho signálkou bílá (`--hero-hi`), ne volt.
7. **České plurály:** `1 cvik / 2–4 cviky / 5+ cviků`.
8. **Desetinná čárka** u vah (`sp.weight.replace('.', ',')`).
9. **Inputy nikdy pod 16 px.** Safari na iOSu při fokusu na menší pole samo
   přiblíží stránku a uživatel ji musí odštípnout zpátky — v posilovně jednou
   rukou mezi sériemi je to nepoužitelné. Platí i pro inline `inputStyle`
   objekty v komponentách, které přebíjejí globální CSS.
   Textová pole na čísla potřebují `inputMode` (`numeric` / `decimal`),
   jinak iOS nabídne písmenkovou klávesnici.
10. **Recharts:** vždy `isAnimationActive={false}`. Animace kreslí čáru přes
   `stroke-dasharray` a když se graf připojí mimo obrazovku, rAF se uškrtí,
   animace se nedokončí a z čáry zůstane 1 px — graf vypadá prázdný.

### 4b. Deset funkcí (30. 8. 2026)

| # | Funkce | Kde |
|---|---|---|
| 1 | Zápis série jedním tapem z Přehledu | `components/SetLogger.tsx` |
| 2 | Timer se spustí sám po zapsání série | `lib/restTimer.ts`, `kit/RestBar.tsx` |
| 3 | Offline režim | `scripts/sw-template.js`, plugin v `vite.config.ts`, `lib/pwa.ts`, `kit/UpdateBar.tsx` |
| 4 | Undo po smazání (6 s) | `lib/undo.ts` + náhrobky v `useWorkoutData.ts` |
| 5 | Deník nabízí cviky ze všech týdnů + historii | `Diary.tsx` `getTrainingDays` / `getLegacyExercises` |
| 6 | Automatická rotující záloha | `lib/backup.ts`, panel v Nástroje → Export |
| 7 | Porovnání s minulou expozicí | `lib/planLink.ts` `exerciseHistory()` |
| 8 | Ukazatel splnění týdne | `lib/planLink.ts` `weekProgress()`, sekce 02 v Přehledu |
| 9 | Rychlý zápis HIIT | `Diary.tsx` `quickAdd()` |
| 10 | Varování při odskoku od plánu | `SetLogger.tsx` `deviationNote()` |

**Most mezi Plánem a Deníkem je `lib/planLink.ts`.** Předepsané záznamy mají id
`plan-w{týden}-{po|ut|pa}-{cvik}[-{index}]`. Hlavní cviky (jen `squat`, `bench`,
`deadlift` – jediné se `setPlan`) mají jeden záznam na sérii s indexem; ostatní
cviky mají jeden souhrnný záznam, kde pole `sets` drží počet **hotových** sérií,
zatímco celkový počet se bere ze šablony v `PLANNED_RECORDS`.

**ID se nikdy neparsuje zpátky, vždy se skládá.** `bicep-curl-2` je samostatný
cvik, ne druhá série cviku `bicep-curl`. Kolize dnes nehrozí, protože žádný cvik
se `setPlan` nekončí číslicí – ale kdyby takový přibyl, tohle praskne.

**Odškrtnutí nikdy nezakládá nový záznam** – volá `updateRecord()` na existující
plan-id, takže se objem nemůže započítat dvakrát.

**Náhrobky (`gymdiary_deleted_v1`).** Bez nich se smazaný `plan-*` nebo
`recovered-*` záznam po reloadu vždy vrátil, protože `loadRecords()` je pokaždé
znovu mergne z `data.ts` / `recoveryData.ts`. Aplikují se až úplně na konci
`loadRecords()`, po obou mergích.

**Service worker se skládá až po buildu** – šablona ve `scripts/sw-template.js`
nezná hashovaná jména assetů, plugin je dosadí v `closeBundle`. Šablona záměrně
neleží v `client/public/`, aby se při selhání pluginu nenasadila nenahrazená.
Navigace jede cache-first (assety mají hash, SW se aktualizuje atomicky), písma
stale-while-revalidate. V `activate` se mažou **jen** klíče `gd-app-*`.

⚠️ **Registrace SW není ověřená na reálném zařízení** – vestavěný prohlížeč
v Claude Code odmítá zaregistrovat i jednořádkový service worker, takže se to
nedalo otestovat. Ověř na telefonu: DevTools → Application → Service Workers,
pak zapni letadlo a appku otevři znovu.

### 4c. Citáty (`lib/quotes.ts`)

Běžící pás v Plánu ukazuje výroky Jiřího Procházky (11), Davida Gogginse (8)
a Ondřeje Vetchého (3). Rotují po dnech (`quotesForToday`), šest naráz.

Vetchý jich má nejmíň schválně — k tématu odhodlání a disciplíny toho má
doloženého podstatně míň než zbylí dva. Radši tři jisté než osm vymyšlených.

⚠️ **Sem patří jen doložené výroky.** Jsou to skuteční žijící lidé a web je
veřejný — vymyslet nebo parafrázovat větu a podepsat ji jejich jménem se nesmí.
Všech 13 současných je dohledaných v konkrétním rozhovoru nebo knize
(Seznam Zprávy, iSport, Deník.cz 2015, *Can't Hurt Me*, The Rich Roll Podcast),
ne v citátové sbírce. U každého drž pole `source`.

Když seznam vyprázdníš, pás spadne zpátky na popisky plánu — nikdy tam
nezůstane díra.

### 4d. Grafické prvky a dalších 10 funkcí (30. 8. 2026)

**Rytiny** — `client/public/ilu/`, 8 souborů, autoři a díla v `ZDROJE.md`.
Všechny jsou **CC0 z Metropolitního muzea** (Dürer, Schongauer, Hollar…),
takže bez podmínek a bez povinné atribuce. Sedí jako duch v desce hero
(`Plate.tsx`, opacity 0,13–0,16, maska do ztracena) a jako vlys za spodní lištou.
Nejsou v precache service workeru — jsou dekorativní, offline shell má zůstat malý.

⛔ **Co použít nejde:** vlastní grafika Representu (Fallen Angel, Noble Knight,
lockup TEAM 247) je jejich autorské dílo — i repozitář značky ji má označenou
jako referenční. Kolaborace s kapelami a značkami jsou navíc cizí ochranné známky.
Fonty **STK Bureau Sans/Serif** jsou komerční (Smuss Type Kiosk) — self-hostovat
je na veřejném webu bez licence nejde. Fotky soch z Wikimedia Commons jsou
většinou CC BY-SA a v dodaném CSV u nich chybí autor.

| # | Funkce | Kde |
|---|---|---|
| 1 | Odškrtnutí i za jiný den a týden | `Overview.tsx` — klikatelný rozvrh, `dateForDay()` |
| 2 | Skutečné RPE u série | `TrainingRecord.rpe`, čipy 6–10 v `SetLogger.tsx` |
| 3 | Maxima z reálných dat + potvrzení | `lib/maxes.ts`, panel v Progresu |
| 4 | Graf: bod na trénink + trend | `Progress.tsx` — agregace po dnech, lineární regrese |
| 5 | Steppery místo klávesnice | `SetLogger.tsx`, krok 2,5 kg (bench 1,25) |
| 6 | Vibrace, pípnutí, Wake Lock | `lib/restTimer.ts` |
| 7 | Kalkulačka kotoučů | `lib/plates.ts` + sekce v Nástrojích |
| 8 | Poslední tři expozice | `planLink.exerciseHistory()` |
| 9 | Export bez předepsaných sérií | `Tools.tsx` `realOf()` ve všech třech listech |
| 10 | Souhrn dne | `planLink.daySummary()`, panel v sekci 03 |

**Pozor u bodu 3:** `CURRENT_MAXES` v `data.ts` zůstává jako výchozí hodnota
z dokumentu. Override se drží v `gymdiary_maxes_v1` a `getCurrentMaxes()` vrací
vyšší z obou — komponenty už nikdy nemají číst `CURRENT_MAXES` přímo.

### 4e. Záchranná obrazovka (`components/ErrorBoundary.tsx`)

Když appka spadne, tohle je jediné, co uživatel uvidí. Schválně **nemá žádné
importy z `lib/` ani `ui/`** — čte localStorage přímo a styluje se inline, aby
fungovala i tehdy, když je rozbité všechno ostatní.

Původní verze nabízela jediné tlačítko „Reload Page". U pádu způsobeného
poškozeným úložištěm je to nekonečná smyčka: reload spustí přesně tentýž pád
a data z appky nejde dostat ven. Proto je **první akce stažení dat do souboru**
(včetně poškozených hodnot jako syrový text), teprve pak obnova ze zálohy
a restart. Obrazovka rovnou vypíše, kolik reálných záznamů v úložišti leží —
uživatel už jednou o data přišel a potřebuje to vidět černé na bílém.

Ověřeno vyvoláním skutečného pádu: napočítala 366 záznamů a vyrobila soubor.

---

## 5. Tréninkový plán — Podzim 2026 v5.2

13 týdnů, **31. 8. – 29. 11. 2026**, týdny pondělí–neděle.

| Blok | Týdny | Zaměření |
|---|---|---|
| A — Akumulace | T1–T3 (+T4 deload) | objem 8/6 op., jedna overload expozice |
| B — Síla | T5–T7 (+T8 deload) | 6/5 op., těžší top série |
| C — Intenzifikace | T9–T11 | dvojky/single na top, objemové back-offy |
| Taper | T12 | ostrost, minimum objemu |
| Test maxim | T13 | 3 samostatné dny (Po dřep, Út bench, Pá tah) |

**Týdenní split (pevný):**
Po = DŘEP (nohy, silově) · Út = BENCH (tlak) · **St = HIIT** · Čt = volno ·
Pá = MRTVÝ TAH (tah/posterior) · **So = HIIT** · Ne = volno (± lehký Z2 běh)

Středa a sobota HIIT jsou **neměnné** — je to skupinová lekce.
Dřep i tah jsou schválně 4 dny od sebe a vždy 2 dny po HIIT, aby na ně šel na čerstvé nohy.

**Vlnový systém** (jeho vlastní, aplikovaný na všechny tři hlavní cviky):
objemová série → OVERLOAD (těžší, méně opakování) → back-off série.
Např. bench T1: `100×8 → 112,5×3 → 105×6 → 105×6`.

**Cíle:** bench 130 · dřep 190 · mrtvý tah 230 kg.
Reálná výchozí maxima: bench 127, dřep 185, tah 220×3 (odhad 1RM 230).

**Pevná pravidla jeho zadání:**
- pull-up v každém push i pull tréninku (jednou bicepsový úchop, jednou zádový)
- břicho v každém tréninku
- ~7 hlavních sérií na nohy s 6/8 opakováními
- **žádné dipy** (dělají mu rameno)
- nohy držet silově — ničí mu je běhy a HIIT
- cviky rotují po blocích (výpady, leg press, bulharský dřep, veslování atd.)
- střídat silové a objemové týdny u doplňků

Zdrojový dokument: `client/public/docs/treninkovy-plan-podzim-2026-v5.2.docx`
(generuje ho `/home/claude/plan/build.js` z `plan.json` — mimo repo).

Literatura, o kterou se plán opírá: Israetel (MRV, deload), Tuchscherer (RPE autoregulace),
Smith (vlnové zatížení), Zatsiorsky (rozehřívací série), Horschig (mobilita),
Viada + Schumann (concurrent training, interference běhu a síly).

---

## 6. Co po mně chtěl a v jakém je to stavu

| # | Zadání | Stav |
|---|---|---|
| 1 | Nový 3měsíční plán z jeho dat, PDF učebnic a health analýzy | ✅ hotovo, v5.2 |
| 2 | Doložit plán literaturou (přesné pasáže a strany) | ✅ hotovo |
| 3 | Opravit mrtvý tah na reálné max 220×3 | ✅ hotovo |
| 4 | Vyhodit dipy, přidat variabilitu nohou, rotovat cviky | ✅ hotovo |
| 5 | Nasadit plán na web, zrušit závislost na Manusu | ✅ hotovo (GitHub Actions → Pages) |
| 6 | Zkontrolovat, že web sedí s plánem — proklikat ho | ✅ hotovo |
| 7 | Zkontrolovat jednotlivé váhy, předepsat vše do deníku | ✅ 295 záznamů, 2 váhy sníženy (T2 152,5 / T3 155) |
| 8 | Přehlednější Plán — každá série s vahou a opakováními | ✅ tabulka `setPlan` |
| 9 | Nová záložka s detailním rozpisem týdne | ✅ záložka Průvodce |
| 10 | Posunout start plánu na **31. 8. 2026** | ✅ posun o 13 dní, týdny nově Po–Ne |
| 11 | Zkontrolovat celý web + 5 návrhů na vizuální osvěžení | ✅ artefakt s návrhy + 4 opravené chyby |
| 12 | Předělat vizuál do stylu **Represent / 247** | ✅ hero + desky + mikrotypografie, mobile first |
| 13 | Fotky přímo z Representu | ⛔ neuděláno — cizí autorské snímky na veřejném webu. Čeká se na jeho vlastní fotky. |
| 14 | Ilustrovaná spodní lišta | ✅ `NavIcon.tsx` — plné siluety (helm, korouhev, kodex, brk, křídlo, kladiva) |
| 15 | Hloubkový audit funkčnosti | ✅ 95 nálezů, 15 opraveno (viz níže), zbytek v seznamu nápadů |
| 16 | 10 funkcí na zlepšení fungování | ✅ všech 10 nasazeno (viz sekce 4b) |
| 17 | Citáty do běžícího pásu v Plánu | ✅ `lib/quotes.ts` — 13 ověřených výroků, rotace po dnech |
| 18 | Grafické prvky ze značky | ✅ 8 rytin (CC0, Met) v hero deskách a za lištou |
| 19 | Dalších 10 funkcí | ✅ všech 10 nasazeno (viz sekce 4d) |

### Chyby nalezené při kontrole a opravené

- **Světlý režim byl rozbitý** — nadpisy bílé na krémové. Příčina: natvrdo zapsané hexy
  v komponentách. Vyřešeno tokeny `--gd-*`.
- **Docs mířily na mrtvou Manus CDN** (HTTP 403) a nabízely starý plán v4.
  Teď `./docs/treninkovy-plan-podzim-2026-v5.2.docx` přímo z appky.
- **RPE kalkulačka počítala blbě** — `1RM × RPE/10`, což odporovalo její vlastní
  tabulce pod ní. Pro 130 kg / 5 op. / RPE 8 hlásila 89 kg místo ~102,5 kg.
  Opraveno na `1RM × rpeToPercent(rpe) / (1 + reps/30)`, vstupy jsou clampované.
- **Tlačítko „zpět na aktuální týden"** bylo až za T13 v rolovacím stripu — nikdy na
  něj nenarazil. Strip nahrazen pravítkem 01–13 (2 řádky po 7), tlačítko je v hlavičce.
- **Detekce aktuálního týdne** ignorovala časové pásmo (`new Date('2026-08-25')` je
  UTC půlnoc). Řešeno `+ 'T00:00:00'` / `'T23:59:59'`.
- **ALL-TIME PR odznak** se ukazoval i na předepsaných sériích.
- **Rozpis sérií** se vykresloval uvnitř flex hlavičky a mačkal název cviku.
- **Tinty a rámečky byly neviditelné** — 22 míst skládalo `` `${color}20` `` nad
  `var(--gd-*)`, což je neplatné CSS. Nahrazeno `tint()` (`color-mix`).
- **`getCategoryColor()` vracela Tailwind třídy** (`'text-yellow-400'`), které se
  cpaly do `style={{ background }}` → proužky kategorií se nekreslily. Vrací tokeny.
- **Graf v Progresu byl prázdný** — Recharts nedokončil `stroke-dasharray` animaci
  a z čáry zůstal 1 px z 450. Vypnuto `isAnimationActive`.
- **Popisek „Cíl 130"** v grafu přetékal 11 px za pravý okraj (`position: 'right'`).
- **Globální zrno** přes `mix-blend-mode: overlay` viditelně sráželo kontrast všech
  dat. Zrno je teď jen v desce hero.

### Audit 30. 8. 2026 — opravené vady

- **KRITICKÉ: `RecordForm` přepisoval cizí záznam.** State se plnil jen v `useState`
  initializeru, ale komponenta se při přepnutí na jiný záznam nepřemountovala
  (podmínka `showAddForm || editingRecord` zůstala pravdivá). Kliknutí na Upravit
  u záznamu A a pak u B uložilo do B hodnoty A. Řešeno `key={editingRecord.id}`
  na `<RecordForm>` i `<RunForm>`. **Ověřeno živě před i po opravě.**
- **Týdenní objem počítal předepsané série.** `getWeeklyVolume` jako jediná
  z helperů nefiltrovala `planned`. Týden 31. 8.–6. 9. hlásil 14 830 kg
  z 25 předepsaných záznamů, než se vůbec šlo trénovat. Teď 0.
- **Dlaždice „Aktuální maxima" braly odhad 1RM z plánu.** `Progress.tsx` u grafu
  filtroval, u dlaždic ne — dřep hlásil 1RM 195 z tréninku plánovaného na listopad.
- **Desetinná čárka se tiše ořezávala.** „152,5" se uložilo doslova a `parseFloat`
  z toho udělal 152 ve všech výpočtech. Nově `normalizeDecimal()` při ukládání
  (kanonicky s tečkou) a `formatWeight()` při zobrazení (česky s čárkou).
  Váha má `inputMode="decimal"`.
- **Mazání bez potvrzení.** Reálný záznam šel smazat dvěma klepnutími bez undo.
  Nově dvoukrokové („Smazat" → „Opravdu smazat?").
- **PWA se instalovala rozbitá.** `start_url: "/"` vedlo na kořen github.io = 404,
  ikony `/icon-192.png` neexistovaly. Cesty jsou relativní, ikony vygenerované
  (černá + volt „247" v registračních značkách).
- **Problikávání tématu.** `class="dark"` viselo natvrdo v HTML → při uloženém
  světlém tématu každý start blikl černou. Nově inline skript v `<head>`.
  `theme-color` se mění s tématem (ThemeContext).
- **Chyběl `viewport-fit=cover`** → všechny `env(safe-area-inset-*)` byly nulové.
  Horní lišta navíc neměla `safe-area-inset-top` a ve standalone ležela pod notchem.
  Zároveň odstraněno `user-scalable=no` (blokovalo přiblížení).
- **Timer odpočítával tiky `setInterval`.** Na zamčeném telefonu se zastavil.
  Nově se drží absolutní deadline (`Date.now()`) + dopočet na `visibilitychange`.
- **RPE kalkulačka:** při 1 opakování ignorovala identitu (130 kg → 126),
  popisek pod výsledkem vypisoval nezclampovaný vstup („99 opakování" u čísla
  spočítaného z 20) a směr Váha→1RM neměl strop vůbec (100 kg × 99 = 430 kg).
  Meze jsou teď v `clampReps/clampRpe/clampRM` a popisky je používají.
- **297 emoji v `data.ts`** (📋 v poznámkách předepsaných sérií) a 17 v Nástrojích
  — proti pravidlu kitu č. 5. Nahrazeno typografickými kódy (`PLÁN ·`, `AM`, `BÍL`…).
- **Mrtvý kód:** `Map.tsx` a `ManusDialog.tsx` nikdo neimportoval, smazáno.
  `Overview.tsx` odkazoval na třídy `.gd-cols--sidebar` / `--gap`, které
  v mobile-first CSS už neexistují.

---

## 7. Co nesmíš měnit bez jeho výslovného souhlasu

- cílová maxima (130 / 190 / 230)
- datum startu plánu
- strukturu záložek
- HIIT ve středu a v sobotu
- vracet zpátky Hack Squat
- **mazat nebo přepisovat jeho reálné záznamy** — 366 záznamů od února 2026,
  včetně ALL-TIME PR (dřep 170 kg z 3. 8. 2026)

Když si nejsi jistý, jestli je změna v pořádku, zeptej se — ale **rozporuj**.
Výslovně řekl, že nechce slepou poslušnost: *„klidně to nějak rozporuj, vysvětluj,
já zase ti nechci to úplně diktovat."*

---

## 8. Ověřování změn

Kontejner nemá přístup na živý web ani na GitHub API. Máš dvě cesty:

**a) Lokální render (rychlé, spolehlivé).** Playwright + Chromium jsou předinstalované:

```bash
node -e "require('playwright')"   # pokud chybí: npm i playwright v /tmp
# executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
```

Naservíruj `dist/public` přes malý http server, projdi všech 6 záložek,
udělej screenshoty a hlídej dvě věci:
- `pageerror` / console errors
- přetékání: element s `getBoundingClientRect().right > window.innerWidth`

Fonty se v kontejneru nenačtou (Google Fonts je blokované) — typografie proto
ve screenshotech vypadá jinak než na jeho telefonu. Layout to neovlivní.

**b) Živý web přes prohlížeč uživatele** (`mcp__claude-in-chrome__*`).
Tohle je jediný způsob, jak vidět skutečný výsledek včetně jeho dat v localStorage.
Vždy s cache-busting query (`?v=N`).

**Nespoléhej na vlastní ověřovací skripty proti lokálnímu klonu** — už jednou
hlásily falešné chyby, protože četly zastaralý checkout. Ověřuj proti nasazenému
bundlu nebo proti živému webu.

---

## 9. Tón a jazyk

Všechno UI i komunikace **česky**. Píše mluvenou češtinou, často diktuje —
počítej s překlepy a nedokončenými větami, ptej se, když je zadání dvojznačné.
Chce věcnost, ne nadšení. Ocení, když mu řekneš, co je špatně a proč.
