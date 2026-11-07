# Handoff: manual de pregătire pentru examenul teoretic (paramotor)

Document pentru un alt agent care preia proiectul. Limba interfeței și a conținutului: română.

## 1. Ce este proiectul

Un manual static, fără server, pentru elevii care pregătesc examenul teoretic de paramotor. Conținutul vine din simulatorul de examen (WordPress, skytransylvania.ro): 9 capitole, 830 de întrebări cu variantele și răspunsul marcat. Fiecare întrebare are în plus:
- o descriere scurtă, vizibilă;
- o explicație detaliată, colapsibilă;
- pentru fiecare variantă: o descriere scurtă și o explicație colapsibilă;
- uneori un avertisment (`warn`) care spune că răspunsul marcat este greșit și dă răspunsul corect.

**Regula de bază:** marcajul verde rămâne pe răspunsul, pentru că elevul trebuie să bifeze la examen varianta. Greșelile se semnalează doar prin avertisment, niciodată prin mutarea marcajului.

## 2. Structura repo-ului

Repo: `https://github.com/mr2day/manual-aviatie-cu-explicatii`

| Branch | Stare |
|---|---|
| `main` | Primul commit: paginile vechi, cu fiecare capitol ca fișier HTML separat. Nu este actualizat. |
| `single-html-build` | **Branch-ul activ.** Site-ul ca o singură pagină, generată din date. Toată munca recentă este aici. |

Pe `single-html-build` (ultimul commit: `f0181a1`):

```
index.html              pagina principală, GENERATĂ de tools/build.js
data/01.json … 09.json  SURSA DE ADEVĂR: întrebările, variantele, explicațiile, avertismentele
tools/build.js          generează index.html (inclusiv antetul și datele încorporate)
js/app.js               scriptul de afișare (navigare între capitole, randare întrebări)
styles.css              toată tema vizuală (paletă, fonturi, layout, antet)
fonts/                  fonturile Rajdhani și DM Sans, descărcate local (fonts.css + 22 woff2)
img/header-bg.png       fotografia din antet (vezi secțiunea 6)
legislatie.html         pagina „Documentație ULM” (sumar al regulamentului)
regulament-ulm.html     textul RACR-CCO ULM (Ediția 1/2007), cu cuprins
```

## 3. Cum se rulează și se regenerează

- **Vizualizare:** deschide `index.html` direct în browser (dublu-clic). Nu este nevoie de server. Adresa capitolului este `index.html#01` … `#09`.
- **După orice modificare în `data/`:** `node tools/build.js` (fără dependențe npm, doar Node).
- **Alte fișiere** (`js/app.js`, `styles.css`, `legislatie.html`, `regulament-ulm.html`) se editează direct.
- **Testare vizuală:** Chrome headless funcționează: `chrome.exe --headless=new --screenshot=... file:///.../index.html#04`. Așa s-au verificat toate modificările de design.

## 4. Formatul datelor (data/NN.json)

```json
{ "id": "04", "title": "Meteorologie", "questions": [
  { "number": "#1", "text": "225: Temperatura la sol ...?",
    "short": "descrierea scurtă vizibilă",
    "long": "explicația detaliată (paragrafe separate prin linie goală)",
    "answers": [
      { "text": "varianta", "correct": true,
        "short": "descriere scurtă (goală dacă e identică cu textul)",
        "long": "explicație colapsibilă",
        "warn": "avertisment opțional: explicația corectă, când răspunsul marcat este greșit" }
    ] } ] }
```

- `text` poate începe cu codul (de ex. `"698: Care este..."`). Aplicația afișează întrebările cu un badge cu numărul din capitol și nu afișează codul.
- Exact o variantă are `correct: true` (marcajul). Asta este verificat la generare.
- Numărul de întrebări per capitol: 01=101, 02=104, 03=105, 04=87, 05=94, 06=101, 07=119, 08=117, 09=103.

## 5. Ce s-a făcut (rezumat)

1. Curățarea paginilor WordPress (Yoast, WooCommerce, Elementor, analitice) și eliminarea oricărei încărcări externe.
2. Explicații pentru toate cele 830 de întrebări, cu descrieri scurte și explicații colapsibile. Explicațiile sunt scrise din cunoștințe proprii și din câteva căutări pe net (vezi secțiunea 7).
3. Avertismente (12 în total) pentru răspunsurile greșite, pe paginile 03, 04, 06, 07, 08, 09. Exemple:
   - 04: presiunea standard (întrebarea 35), unitatea densității (37), răcirea adiabatică 3,5°C în loc de ~0,2°C (87);
   - 06: textul incomplet (6), raționamentul despre aerul umed (70);
   - 07: azotul 78,9% în loc de 78,09% (68), vederea roșie (49);
   - 08: contradicție cu pagina 05 despre zborul cu vântul (65), formularea „în formă de Z” (117);
   - 09: rezistența la unghi mare de atac (41).
   - 03: motoparapanta avansată are MTOM 300 kg (un loc) și 450 kg (două locuri), conform RACR-CCO ULM, anexa 1, pct. 1.2.3.1. Varianta marcată indică 250 kg (întrebarea 66) și 400 kg (întrebarea 18). Avertismentele sunt în `data/03.json`.
4. Clasele spațiului aerian explicate în 16 întrebări (A, C, G). Pentru clasa C, limita de FL105 din AIP ENR 1.4 (ediția 2023) trebuie verificată pe aisro.ro.
5. Site-ul ca o singură pagină (`single-html-build`), cu date din JSON, navigare cu hash, meniu lateral cu capitolul selectat evidențiat, linkuri secundare, antet.
6. Temă întunecată și paletă inspirate din paramotorartisan.com: albastru #004F7A, text #505454/#D7DADA, fundal #1A1E1E, Rajdhani pentru titluri, DM Sans pentru text. Fonturile sunt locale (fonts/).
7. Antet cu wordmark „PARAMOTOR / ARTISAN” (text, nu imagine) și slogan „Manual de pregătire pentru examenul teoretic”. Sub wordmark, „ARTISAN” este negru și se mărește la hover; cuvintele au animație smooth la hover, cu mărire 8%. Fundal: fotografia `img/header-bg.png`, cu gradient albastru peste ea.
8. Regulamentul RACR-CCO ULM ca pagină HTML (`regulament-ulm.html`), generată din PDF-ul descărcat. Diacriticele au fost refăcute doar pentru cuvintele neambigue, cu o listă; restul rămâne fără diacritice.
9. Sidebar: se derulează odată cu pagina (fără bară proprie și fără fixare).

## 6. Decizii luate de utilizator (de respectat)

- Marcajul verde rămâne pe varianta. Greșelile se marchează doar cu avertisment.
- Textul regulamentului RACR-CCO ULM poate fi folosit și reformatat, fără restricții.
- Fonturile se descarcă local, nu se încarcă din Google Fonts.
- Utilizatorul spune că este afiliat cu Paramotor Artisan. Antetul conține numele lor doar ca text, cu sloganul care precizează că este un manual de pregătire. **Nu s-a copiat logo-ul lor** (nu există imagine, doar text) și nu s-a copiat structura paginii lor.
- Fotografia din antet a fost furnizată de utilizator. **Drepturile asupra ei nu sunt verificate.**
- Pentru fiecare modificare de design, utilizatorul cere verificare vizuală. Verifică întotdeauna cu o captură.

## 7. Lucruri deschise

- **Legal, nevalidat:** cifrele din capitolul 03 despre licența de pilot (vârsta de 16 ani, pragul de 75%, valabilitatea de 24 de luni, orele de pregătire, limita de 3000 m în clasa G) nu au fost confirmate din textul oficial. Sursa oficială este RACR-LPAN ULM, care nu este în repo. Utilizatorul trebuie să o furnizeze sau să verifice.
- **Explicații necontrolate:** explicațiile au fost scrise fără căutare pe net pentru fiecare întrebare. Pentru paginile 04–09 nu s-a căutat deloc. Utilizatorul a propus să se revizuiască pe pagini, începând cu căutări pentru întrebările cu cifre sau reglementări.
- **Regulamentul:** diacriticele sunt parțiale (vezi secțiunea 5, punctul 8).
- **Publicare:** site-ul nu este publicat încă. Varianta propusă este Firebase Hosting. Trebuie verificat dreptul de a publica conținutul băncii și al fotografiei.
- **Fișiere ignorate:** `RACR-CCO_ULM.pdf` și formularul „Anexa nr. 1 RACR-CCO ULM – Cerere tip.pdf” au fost descărcate și nu sunt în repo. PDF-ul RACR a fost șters după ce a fost convertit în `regulament-ulm.html`.
- **Branch `main`:** rămâne cu paginile vechi. Dacă vrei să-l aduci la zi, trebuie făcut un merge sau o înlocuire, decizie a utilizatorului.

## 8. Convenții de lucru

- Commit-urile au la final linia `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>`.
- Git identity: `Nick Beres` (configurată local).
- Nu se pune conținut din afara site-ului (logo, fotografii, texte) fără să fie furnizat de utilizator.
- Înainte de publicare, orice schimbare vizuală se verifică într-o captură Chrome headless.
