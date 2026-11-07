# PLAN: explicații complete pentru toate întrebările

Scop: fiecare întrebare și fiecare variantă are o explicație care explică de ce
răspunsul este corect sau greșit, fără să trimită elevul să verifice altundeva.
Răspunsurile marcate verde rămân cum sunt în bancă; dacă sunt greșite, primesc
un avertisment (`warn`) și explicația corectă.

## Reguli de lucru

- Sursele sunt în `docs/` (RACR-LPAN ULM, RACR-CCO ULM/AUN, RACR-RA, Codul aerian,
  HG 1.234/2021, Reg. (UE) 2019/27 MED.A.045, PAC-MED 2025, AIP ENR 1.4, Anexele 2007/2020).
- Când o cifră sau o regulă nu apare în documentele din `docs/`, explicația nu
  inventează și nu cere elevului să verifice: se scrie ce se știe și se pune
  avertisment la răspunsul verde dacă e greșit.
- Fără cuvintele „banca” și „simulator” în text.
- Un lot = ~30 de întrebări. După fiecare lot: aplicare, `node tools/build.js`,
  commit cu linia Co-Authored-By, push, și actualizarea tabelului de mai jos.

## Progres

| Capitol | Întrebări | Stare |
|---|---|---|
| 01 Comunicații | 101 | nefăcut |
| 02 Cunoașterea aeronavei / întreținere | 104 | nefăcut |
| 03 Legislație | 105 | 1–105 făcute, cu 4 blocate (20, 58, 90, 105): lipsesc sursele |
| 04 Meteorologie | 87 | nefăcut |
| 05 Navigație | 94 | nefăcut |
| 06 Performanțe de zbor | 101 | nefăcut |
| 07 Performanțe umane | 119 | nefăcut |
| 08 Proceduri operaționale | 117 | nefăcut |
| 09 Principii de zbor | 103 | nefăcut |

### Capitolul 03: blocat de surse lipsă

- **20** (marcajul L): marcajele de aerodrom (ICAO Anexa 14, volumul I) nu sunt în `docs/`.
- **90** (cruce dublă albă): același motiv, Anexa 14.
- **58** (condițiile de autorizare a zborului): partea de asigurare nu apare în
  documentele din `docs/`. Lipsește textul despre asigurarea aeronavei (Codul aerian
  sau o normă de asigurare).
- **105** (eșalonare la turbulența de siaj, 2 minute): RACR-RA menționează turbulența,
  dar nu dă cifra de eșalonare. Lipsește procedura de trafic (RACR-RA sau un document
  de exploatare cu eșalonările).

## Pași

1. [x] Lotul 1 capitol 03 (Q1–10)
2. [x] Lotul 2 capitol 03 (Q11–33)
3. [x] Lotul 3 capitol 03 (Q32–70)
4. [x] Capitol 03: Q71–105 (lotul 4, 5, 6, 7, 8); blocate doar 20, 58, 90, 105
5. [ ] Capitol 01
6. [ ] Capitol 02
7. [ ] Capitol 04
8. [ ] Capitol 05
9. [ ] Capitol 06
10. [ ] Capitol 07
11. [ ] Capitol 08
12. [ ] Capitol 09
13. [ ] Verificare finală: nicio explicație care e doar instrucțiune, niciun
        „banca”/„simulator”, toate întrebările au explicații la toate variantele.
