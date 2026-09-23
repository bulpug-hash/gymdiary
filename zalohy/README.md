# Zálohy tréninkového deníku

## Jak zálohovat

```bash
pnpm zaloha
```

Vytvoří `gymdiary-zaloha-RRRR-MM-DD.json` a uloží ho na **dvě místa**:

1. **`zalohy/` v repu** → po `git push` je na GitHubu. Online, verzované,
   dohledatelné zpětně i po letech a dostupné odkudkoli.
2. **`~/Desktop/GymDiary_zalohy/`** → po ruce na Macu, bez internetu.

Dvě místa schválně: GitHub tě podrží, když přijdeš o Mac; plocha tě podrží,
když nebude internet nebo GitHub.

## ⚠️ Co záloha obsahuje a co ne

**Obsahuje** kanonická data z repa (`data.ts` + `recoveryData.ts`): celou
historii cviků, běhů, HIIT, plán, výživu i cíle. Z tohohle se appka plní.

**Neobsahuje** to, co sis zapsal na telefonu a ještě to není v repu. Ta data
leží jen v `localStorage` prohlížeče a z počítače se k nim nedá dostat.

### Jak zazálohovat i data z telefonu

V appce: **Nástroje → Export → Kompletní záloha (JSON)**. Soubor ulož do
`~/Desktop/GymDiary_zalohy/`. Pojmenuj ho `telefon-RRRR-MM-DD.json`, ať je
poznat, odkud je.

⚠️ **Tohle je jediná obrana proti „Vymazat historii a data webů" v Safari.**
Ten příkaz smaže celý localStorage a nepomůže proti němu nic, co appka umí.
