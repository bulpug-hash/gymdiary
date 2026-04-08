// ============================================================
// EXERCISE DESCRIPTIONS – Gold Performance Design
// Vědecké zdůvodnění a technické provedení každého cviku
// Zdroj: treninkovy-plan-2026-v2.docx (50 stran vědecké syntézy)
// ============================================================

export interface ExerciseInfo {
  name: string;
  category: 'Hlavní cvik' | 'Slabinová variace' | 'Podpůrný cvik' | 'Prevence' | 'Core' | 'Kardio';
  why: string;       // Proč je v plánu (vědecké zdůvodnění)
  how: string;       // Jak se provádí (technické kroky)
  tip?: string;      // Klíčový tip / chyba k vyvarování
  targetMuscles?: string;
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  // ─── HLAVNÍ CVIKY ──────────────────────────────────────────
  'squat': {
    name: 'Back Squat (Low Bar)',
    category: 'Hlavní cvik',
    why: 'Soutěžní dřep je primárním pohybovým vzorcem plánu. Princip specificity (Israetel) říká: čím blíže testu maxima, tím více musí trénink odpovídat soutěžnímu provedení. Low bar umožňuje vyšší zátěž díky kratší páce a zapojení hýžďových svalů.',
    how: '1. Tyč na trapézech (low bar – pod hřebenem lopatek). 2. Postoj na šířku ramen, špičky mírně ven (30–45°). 3. Hluboký nádech a bracing (Valsalva manévr). 4. Iniciuj pohyb kyčlemi dozadu a dolů současně. 5. Kolena sledují směr špiček. 6. Hloubka: kyčle pod koleny. 7. Explozivní výstup – tlač podlahu od sebe.',
    tip: 'Slabina: vystávání z díry (bottom position). Pokud se trup příliš sklání vpřed při výstupu, zaměř se na Pause Squat a SSB Squat.',
    targetMuscles: 'Kvadricepsy, hýžďové svaly, hamstringy, vzpřimovače páteře',
  },
  'bench': {
    name: 'Bench Press (Competition)',
    category: 'Hlavní cvik',
    why: 'Soutěžní bench press v plném powerlifterském setupu. Leg drive, stažené lopatky a arch jsou klíčové pro maximální výkon. Frekvence 2×/týden (Út hlavní + Pá lehčí variace) odpovídá SRA křivce bench pressu (~48h zotavení).',
    how: '1. Plný soutěžní setup: arch, stažené lopatky, nohy na podlaze. 2. Úchop: malíčky na prstencích (nebo šířejší). 3. Tyč nad dolní část hrudníku. 4. Kontrolovaný sestup (2–3s) na hrudník. 5. Pauza na hrudi (1s). 6. Explozivní tlak s leg drive. 7. Lokty 45–75° od těla.',
    tip: 'Slabina: start z hrudníku. Pokud ztrácíš sílu v dolní třetině pohybu, zaměř se na Spoto Press a Larsen Press.',
    targetMuscles: 'Prsní svaly, přední deltoid, triceps',
  },
  'deadlift': {
    name: 'Deadlift (Konvenční)',
    category: 'Hlavní cvik',
    why: 'Mrtvý tah je blízko cíle (225→235 kg, +4,4%). Frekvence 1×/týden je záměrná – deadlift zotavuje nejdéle (72–96h) a je nejnáročnější na CNS. Vertikální dráha tyče a správný hip hinge jsou klíčové pro efektivní přenos síly.',
    how: '1. Postoj na šířku kyčlí, tyč nad středem chodidla. 2. Úchop těsně za koleny (double overhand nebo mixed). 3. Kyčle dolů, hrudník nahoru, záda rovná. 4. Bracing – hluboký nádech, napnutí břicha. 5. Odtrhni tyč tlakem nohou do podlahy (ne tahem zad). 6. Tyč jede vertikálně po holení. 7. Lockout: kyčle vpřed, lopatky stažené.',
    tip: 'Vertikální dráha tyče = maximální efektivita. Tyč se nesmí odklánět od těla. Pásek od W5 na těžkých sériích.',
    targetMuscles: 'Hamstringy, hýžďové svaly, vzpřimovače páteře, trapézy, předloktí',
  },

  // ─── SLABINOVÉ VARIACE – DŘEP ──────────────────────────────
  'ssb-squat': {
    name: 'SSB Squat (Safety Squat Bar)',
    category: 'Slabinová variace',
    why: 'Safety Squat Bar posouvá těžiště vpřed, čímž mimořádně cílí kvadricepsy a vzpřimovače páteře. Přímo potencuje sílu z díry (bottom position) – identifikovanou slabinu. Zároveň je šetrnější k ramenům a loktům. Zatsiorsky: variace pohybového vzorce buduje sílu v slabých bodech bez ztráty specificity.',
    how: '1. SSB bar na ramenou – rukojeti drž před tělem. 2. Postoj stejný jako back squat. 3. Trup zůstává vzpřímenější než u low bar (přirozené pro SSB). 4. Zaměř se na tlak kolen ven a aktivaci kvadricepsů. 5. Hloubka: kyčle pod koleny.',
    tip: 'SSB automaticky nutí vzpřímený trup – využij to pro nácvik správné pozice z díry.',
    targetMuscles: 'Kvadricepsy (primárně), vzpřimovače páteře, hýžďové svaly',
  },
  'pause-squat': {
    name: 'Pause Squat (2s pauza)',
    category: 'Slabinová variace',
    why: 'Pauza v dolní pozici eliminuje stretch reflex, který maskuje slabost kvadricepsů. Nutí svaly pracovat izometricky v nejslabším bodě pohybu. Přímý přenos na sílu z díry u soutěžního dřepu. Horschig: izometrická práce v problematické zóně je nejefektivnější metodou pro odstranění slabých bodů.',
    how: '1. Sestup jako u back squatu. 2. V dolní pozici (kyčle pod koleny) zastav na 2 sekundy. 3. Během pauzy: kolena ven, trup vzpřímený, bracing zachován. 4. Explozivní výstup ihned po pauze. 5. Váha ~65–70% 1RM (těžší než vypadá!).',
    tip: 'Nesmíš relaxovat v dolní pozici! Celá pauza = aktivní napětí ve všech svalech.',
    targetMuscles: 'Kvadricepsy, hýžďové svaly (izometricky v dolní pozici)',
  },
  'pin-squat': {
    name: 'Pin Squat',
    category: 'Slabinová variace',
    why: 'Tyč se pokládá na safety piny v dolní pozici – každá série začíná z mrtvého bodu bez excentrické předfáze. Maximální aktivace CNS a svalů z absolutně nejslabšího bodu. Smith: pin squats jsou nejspecifičtějším nástrojem pro rozvoj síly z díry u pokročilých lifterů.',
    how: '1. Nastav piny na hloubku tvého dřepu (kyčle pod koleny). 2. Vlezni pod tyč v dolní pozici. 3. Bracing, kolena ven. 4. Explozivní výstup z mrtvého bodu. 5. Vrať tyč na piny, reset, opakuj.',
    tip: 'Každé opakování je nové – žádný momentum. Zaměř se na maximální explozivitu.',
    targetMuscles: 'Kvadricepsy, hýžďové svaly (koncentrická síla z mrtvého bodu)',
  },
  'tempo-squat': {
    name: 'Tempo Squat (3-1-0)',
    category: 'Slabinová variace',
    why: 'Prodloužená excentrika (3s) zvyšuje čas pod napětím v problematické spodní zóně a buduje propriocepci a kontrolu pohybu. Kód 3-1-0: 3s dolů, 1s pauza dole, explozivně nahoru. Horschig: kontrola excentrické fáze je klíčová pro prevenci zranění a technické zdokonalení.',
    how: '1. Sestup kontrolovaně po dobu 3 sekund. 2. 1s pauza v dolní pozici (aktivní!). 3. Explozivní výstup. 4. Váha ~60–65% 1RM. 5. Zaměř se na kontrolu kolen a pozici trupu.',
    tip: 'Počítej nahlas nebo v hlavě: "tisíc jedna, tisíc dva, tisíc tři" při sestupu.',
    targetMuscles: 'Kvadricepsy, hýžďové svaly, vzpřimovače (excentricky)',
  },

  // ─── SLABINOVÉ VARIACE – BENCH ─────────────────────────────
  'spoto-press': {
    name: 'Spoto Press (2 cm nad hrudníkem)',
    category: 'Slabinová variace',
    why: 'Zastavení 2–3 cm nad hrudníkem eliminuje odraz od hrudníku a buduje izometrickou sílu přesně v místě, kde Tomáš ztrácí sílu (start z hrudníku). Bezpečnější než long pause bench pro ramena. Tuchscherer: autoregulace slabých bodů přes specifické variace je efektivnější než obecný objem.',
    how: '1. Plný bench setup. 2. Sestup jako u soutěžního benche. 3. Zastav 2 cm nad hrudníkem (ne na hrudi). 4. Drž 1 sekundu. 5. Explozivní tlak. 6. Váha ~70–75% 1RM.',
    tip: 'Pozice musí být konzistentní – vždy 2 cm, ne 5 cm. Použij vizuální referenci.',
    targetMuscles: 'Prsní svaly (dolní část), triceps, přední deltoid',
  },
  'larsen-press': {
    name: 'Larsen Press (nohy nahoře)',
    category: 'Slabinová variace',
    why: 'Nohy na lavici nebo nahoře eliminuje leg drive, čímž izoluje práci prsních svalů, předního deltoidu a tricepsu. Přímý přenos na sílu ze spodní pozice bez kompenzace nohama. Smith: eliminace leg drive odhalí skutečnou sílu horní části těla.',
    how: '1. Leh na lavici, nohy na lavici nebo nahoře (ne na podlaze). 2. Arch a stažené lopatky zachovej. 3. Sestup kontrolovaně na hrudník. 4. Pauza 1s. 5. Tlak bez pomoci nohou. 6. Váha ~65–70% 1RM.',
    tip: 'Bez leg drive je cvik výrazně těžší – sniž váhu o 10–15% oproti soutěžnímu benchi.',
    targetMuscles: 'Prsní svaly, přední deltoid, triceps (bez kompenzace nohama)',
  },
  'long-pause-bench': {
    name: 'Long Pause Bench (3s pauza)',
    category: 'Slabinová variace',
    why: 'Třísekundová pauza na hrudi buduje maximální izometrickou sílu v dolní pozici. Stejný princip jako pause squat – eliminuje stretch reflex a nutí svaly pracovat z mrtvého bodu. Zatsiorsky: izometrická práce v slabém bodě je nejdirektivnější metodou pro odstranění sticking pointu.',
    how: '1. Plný bench setup. 2. Sestup na hrudník. 3. Pauza 3 sekundy na hrudi – tyč leží na hrudníku, plné napětí. 4. Explozivní tlak. 5. Váha ~70–75% 1RM.',
    tip: 'Ramena musí zůstat stažená celou dobu pauzy. Nesmíš relaxovat!',
    targetMuscles: 'Prsní svaly (izometricky v dolní pozici), triceps',
  },
  'floor-press': {
    name: 'Floor Press',
    category: 'Slabinová variace',
    why: 'Podlaha omezuje rozsah pohybu na horní polovinu bench pressu, čímž cílí přesně oblast tricepsu a přední deltoid. Eliminuje dolní část pohybu kde Tomáš ztrácí – nutí ho pracovat na lockoutu a střední části. Horschig: omezení ROM na silnou část pohybu buduje sebedůvěru a nervovou adaptaci.',
    how: '1. Leh na podlaze, kolena pokrčená. 2. Tyč v rukou, lokty na podlaze. 3. Explozivní tlak do lockoutu. 4. Kontrolovaný sestup – lokty se dotknou podlahy. 5. Krátká pauza, opakuj.',
    tip: 'Cvik cílí horní polovinu pohybu – nevhodný pro práci na startu z hrudníku.',
    targetMuscles: 'Triceps, přední deltoid, prsní svaly (horní část)',
  },

  // ─── PODPŮRNÉ CVIKY – MRTVÝ TAH ────────────────────────────
  'deficit-dl': {
    name: 'Deficit Deadlift (5 cm podložka)',
    category: 'Slabinová variace',
    why: 'Stoj na 5cm podložce zvyšuje rozsah pohybu a sílu odtržení tyče od podlahy. Přímý přenos na první fázi konvenčního deadliftu. Smith: deficit deadlift je nejspecifičtějším nástrojem pro rozvoj síly odtržení u konvenčního stylu.',
    how: '1. Stoj na 5cm podložce (kotouč, dřevěná deska). 2. Setup jako u konvenčního deadliftu. 3. Tyč je nyní níže – vyžaduje hlubší kyčle a více práce kvadricepsů. 4. Pomalý, kontrolovaný sestup. 5. Váha ~55–60% 1RM.',
    tip: 'Nesmíš zakulacovat záda kvůli zvýšenému ROM. Sniž váhu a zaměř se na techniku.',
    targetMuscles: 'Hamstringy, kvadricepsy (více než u standardního DL), hýžďové svaly',
  },
  'paused-dl': {
    name: 'Paused Deadlift (pauza na koleních)',
    category: 'Slabinová variace',
    why: 'Pauza v tranzici (výška kolen) buduje kontrolu pozice a sílu v nejkritičtějším bodě konvenčního deadliftu. Tuchscherer: pauzy v tranzičních bodech odhalují technické nedostatky a budují sílu přesně tam kde je potřeba.',
    how: '1. Odtrhni tyč jako u standardního DL. 2. Zastav na 2 sekundy ve výšce kolen. 3. Záda rovná, kyčle a ramena stoupají stejnou rychlostí. 4. Explozivní dokončení pohybu. 5. Váha ~65% 1RM.',
    tip: 'Pauza na koleních = nejčastější místo technického selhání. Záda musí být rovná!',
    targetMuscles: 'Vzpřimovače páteře, trapézy, hamstringy (izometricky)',
  },
  'ghd': {
    name: 'GHD Raise (Glute-Ham Developer)',
    category: 'Podpůrný cvik',
    why: 'GHD raise je excelentní pro rozvoj hamstringů a celého zadního řetězce s výrazně nižší CNS zátěží než variace deadliftu. Horschig: silný zadní řetězec je základem zdravého a výkonného deadliftu. GHD navíc zlepšuje propriocepci a prevenci hamstringových zranění.',
    how: '1. Nastav GHD tak, aby kyčelní kloub byl na okraji podložky. 2. Kotníky fixovány. 3. Kontrolovaný sestup (excentrika) – záda rovná. 4. Aktivní výstup silou hamstringů a hýžďových svalů. 5. BW nebo +5–10 kg závaží na hrudníku.',
    tip: 'Začni s BW – GHD raise je těžší než vypadá. Excentrická fáze je klíčová.',
    targetMuscles: 'Hamstringy, hýžďové svaly, vzpřimovače páteře',
  },

  // ─── PODPŮRNÉ CVIKY – UPPER BODY ───────────────────────────
  'pull-up': {
    name: 'Weighted Pull-Up (Shyby se zátěží)',
    category: 'Podpůrný cvik',
    why: 'Silná záda jsou nezbytná pro stabilní bench press a deadlift. Weighted pull-ups budují latissimus, biceps a zadní deltoid – svaly zodpovědné za stažení lopatek a kontrolu tyče při sestupu. Israetel: záda jsou nejpodtrénovanou svalovou skupinou u powerlifterů.',
    how: '1. Závěs na hrazdě, úchop na šířku ramen nebo širší. 2. Závaží na opasku nebo vestě. 3. Plný ROM: z plného závěsu do brady nad hrazdou. 4. Kontrolovaný sestup (2s). 5. Žádné kymácení.',
    tip: 'Iniciuj pohyb stažením lopatek dolů a dozadu – ne ohnutím loktů.',
    targetMuscles: 'Latissimus dorsi, biceps, zadní deltoid, trapézy (dolní část)',
  },
  'barbell-row': {
    name: 'Barbell Row (Řady s činkou)',
    category: 'Podpůrný cvik',
    why: 'Silná záda = silný deadlift. Přímý přenos na schopnost udržet rovná záda při těžkých deadliftech. Zatsiorsky: antagonistické svaly (záda vs. prsní) musí být v rovnováze pro maximální výkon a prevenci zranění.',
    how: '1. Předklon ~45°, tyč v rukou na šířku ramen. 2. Táhni tyč k pupku (ne k hrudníku). 3. Lopatky stáhni na konci pohybu. 4. Kontrolovaný sestup. 5. Záda rovná po celou dobu.',
    tip: 'Nesmíš používat momentum trupu. Pokud se houpáš, sniž váhu.',
    targetMuscles: 'Střední záda (rhomboids, trapézy), latissimus, biceps',
  },
  'rdl': {
    name: 'Romanian Deadlift (RDL)',
    category: 'Podpůrný cvik',
    why: 'RDL cílí hamstringy a hýžďové svaly excentricky – buduje sílu v hip hinge pozici, která je základem konvenčního deadliftu. Schumann: excentrická práce hamstringů je klíčová pro prevenci zranění při kombinaci silového tréninku a běhu.',
    how: '1. Stoj, tyč v rukou. 2. Mírně pokrčená kolena (soft knees). 3. Předklon s rovnými zády – tyč jede po holeni. 4. Cítíš tah v hamstrinzích (ne v bedrech). 5. Výstup silou hýžďových svalů. 6. Váha ~50–60% DL maxima.',
    tip: 'RDL není deadlift – tyč nedosahuje na zem. Rozsah pohybu určuje flexibilita hamstringů.',
    targetMuscles: 'Hamstringy, hýžďové svaly, vzpřimovače páteře',
  },

  // ─── PREVENCE A PREHAB ─────────────────────────────────────
  'face-pull': {
    name: 'Face Pulls',
    category: 'Prevence',
    why: 'Face pulls jsou základním preventivním cvikem pro zdraví rotátorové manžety a zadního deltoidu. Horschig: každý lifter provádějící těžký bench press musí kompenzovat anteriorní dominanci ramen. Face pulls v KAŽDÉM upper body tréninku jsou nenegociabilní.',
    how: '1. Lano na kladce ve výšce obličeje. 2. Táhni k obličeji, lokty nahoru a ven. 3. Na konci pohybu: externální rotace ramen (palce dozadu). 4. Lehká váha, 15–20 opakování. 5. Pomalý, kontrolovaný pohyb.',
    tip: 'Váha musí být lehká – cvik je o pohybovém vzorci, ne o síle.',
    targetMuscles: 'Zadní deltoid, rotátorová manžeta, trapézy (střední část)',
  },
  'nordic': {
    name: 'Nordic Curls',
    category: 'Prevence',
    why: 'Nordic curls jsou nejefektivnějším preventivním cvikem pro hamstringy. Při kombinaci deadliftu a běhu je riziko hamstringového zranění zvýšené. Schumann: 1× týdně nordic curls snižuje incidenci hamstringových zranění o 51% (meta-analýza, n=8459).',
    how: '1. Klekni, kotníky fixovány (partner nebo GHD). 2. Kontrolovaný pád vpřed – hamstringy brzdí pohyb. 3. Ruce zachytí pád u podlahy. 4. Odtlač se zpět do výchozí pozice. 5. Začni s 3–5 opakováními (velmi těžké!).',
    tip: 'Pokud nemůžeš udělat ani jedno opakování, začni s excentrickou fází (jen pád, bez výstupu).',
    targetMuscles: 'Hamstringy (excentricky), hýžďové svaly',
  },
  'pallof': {
    name: 'Pallof Press',
    category: 'Core',
    why: 'Pallof press je anti-rotační core cvik – trénuje schopnost odolávat rotaci, ne ji provádět. Silný anti-rotační core je klíčový pro stabilitu při těžkých dřepech a deadliftech. Horschig: core stabilita = bezpečnější a výkonnější silový trénink.',
    how: '1. Kladka na výšce hrudníku, stoj bokem. 2. Drž lano oběma rukama u hrudníku. 3. Vystrč ruce před sebe (press) – odolávej rotaci. 4. Drž 1–2s. 5. Vrať k hrudníku. 6. Lehká váha, 8–12 opakování na stranu.',
    tip: 'Čím dál od kladky stojíš, tím těžší. Začni blíže.',
    targetMuscles: 'Příčný břišní sval, šikmé břišní svaly, vzpřimovače páteře',
  },

  // ─── KARDIO ────────────────────────────────────────────────
  'run-thu': {
    name: 'Čtvrteční běh',
    category: 'Kardio',
    why: 'Třetí tréninkový den v týdnu je zařazen jako běh (ne HIIT) kvůli minimalizaci interferenčního efektu. Čtvrtek je buffer den mezi středečním HIIT a pátečním deadliftem – 24h+ od HIIT, 24h+ před deadliftem. Schumann: Zone 2 běh (aerobní) má minimální interferenci se silovými přírůstky.',
    how: 'Fáze 1–2: 30–40 min Zone 2 (konverzační tempo, 60–70% max TF). Fáze 3: 25–30 min lehké tempo. Fáze 4 (peaking): vynechat poslední 2 týdny. Po běhu: 40–60g rychlých sacharidů + 30g bílkovin.',
    tip: 'Zone 2 = dokážeš mluvit celými větami. Pokud nemůžeš, zpomal.',
    targetMuscles: 'Kardiovaskulární systém, VO2max, tukový metabolismus',
  },
  'hiit-wed': {
    name: 'HIIT – Středa (Pevná lekce)',
    category: 'Kardio',
    why: 'Pevná HIIT lekce (kruhový trénink v posilovně) je součástí rozvrhu a není plánována tímto programem. Zabudována do únavového managementu – proto Po/Út silové tréninky, St HIIT, Čt běh (buffer), Pá deadlift. Viada: hybridní atleti musí strategicky rozmístit vytrvalostní a silové jednotky.',
    how: 'Pevná lekce – řiď se instruktorem. Po lekci: okamžitě 40–60g rychlých sacharidů (rýže, banán, sportovní nápoj) pro doplnění glykogenu před pátečním tréninkem.',
    tip: 'V deload týdnech (W4, W8) se na HIIT nemusíš tlačit na maximum.',
    targetMuscles: 'Celé tělo, kardiovaskulární systém',
  },
  'hiit-sat': {
    name: 'HIIT – Sobota (Pevná lekce)',
    category: 'Kardio',
    why: 'Druhá HIIT lekce v týdnu. Po pátečním deadliftu – regenerace zadního řetězce přes pohyb (active recovery). Celý neděle volno pro kompletní regeneraci před pondělním dřepem.',
    how: 'Pevná lekce – řiď se instruktorem. Sobota je po nejtěžším silovém dni (Pá deadlift) – buď připraven na sníženou výkonnost.',
    tip: 'Pokud cítíš výraznou únavu po pátečním deadliftu, komunikuj s instruktorem.',
    targetMuscles: 'Celé tělo, kardiovaskulární systém',
  },
};

// Helper to get exercise info by ID
export function getExerciseInfo(exerciseId: string): ExerciseInfo | null {
  return EXERCISE_INFO[exerciseId] || null;
}

// Category color mapping
export const CATEGORY_COLORS: Record<string, string> = {
  'Hlavní cvik': '#F5C842',
  'Slabinová variace': '#E8A020',
  'Podpůrný cvik': '#6EE7B7',
  'Prevence': '#93C5FD',
  'Core': '#C4B5FD',
  'Kardio': '#FCA5A5',
};
