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
| 03 Legislație | 105 | 1–70 făcute (cu excepțiile de mai jos) |
| 04 Meteorologie | 87 | nefăcut |
| 05 Navigație | 94 | nefăcut |
| 06 Performanțe de zbor | 101 | nefăcut |
| 07 Performanțe umane | 119 | nefăcut |
| 08 Proceduri operaționale | 117 | nefăcut |
| 09 Principii de zbor | 103 | nefăcut |

### Capitolul 03: rămâne de făcut

- Fără sursă clară încă: 20 (marcaj L), 22 (documente la bord), 26, 40, 41, 46, 47,
  48, 52, 53, 54, 57, 58, 64, 69.
- Nerecitite: 71–105.

## Pași

1. [x] Lotul 1 capitol 03 (Q1–10)
2. [x] Lotul 2 capitol 03 (Q11–33)
3. [x] Lotul 3 capitol 03 (Q32–70)
4. [ ] Capitol 03: Q71–105, apoi cele fără sursă (cu citate sau cu explicație
       care spune ce se știe, fără trimitere la verificare)
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
