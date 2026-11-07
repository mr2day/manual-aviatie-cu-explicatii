# Plan: platforma digitală pentru școli de paramotor

Status: **plan, nu implementare.** Nimic din acest document nu e construit încă. Ordinea de lucru e în secțiunea 9.

## 1. Ce construim

O aplicație generală, multi-școală, pe care o putem vinde fiecărei școli de paramotor, în România și în străinătate. Paramotor Artisan o primește gratuit. Celelalte școli plătesc un abonament. Aplicația se traduce în orice limbă. Jocurile și simulatorul 3D se vând separat, după cât plătește fiecare școală.

Scopul: să scoată din calea instructorului munca de administrare și să-i dea elevului o evidență clară a propriului progres.

## 2. Cine folosește aplicația

- **Elev:** își loghează singur zborurile din școală, își vede progresul, documentele și programul.
- **Instructor:** programează lecțiile, semnează zborurile, notează ce a greșit și ce a făcut bine elevul. Are rol de administrator în școala lui și vede tot.
- **Administrator al școlii:** configurează școala, resursele, prețurile și abonamentul. Vede tot.
- **Vizitator:** vede site-ul public al școlii, cursurile, prețurile și poate cere o programare.

Conturile de elev și de instructor sunt furnizate de SwirlockIDP. Integrarea rămâne pentru mai târziu.

## 3. Ce ne cere reglementarea (surse din `docs/`)

Acestea sunt cerințe reale, din RACR-LPAN ULM, RACR-CCO ULM, PAC-MED 2025 și Reg. (UE) 2019/27:

- **Program teoretic:** minimum 50 de ore, sub supravegherea unui instructor (RACR-LPAN ULM, anexa 2).
- **Zbor:** minimum 15 ore pentru parapantă cu motor (RACR-LPAN ULM.2060 lit. a pct. i).
- **Examen teoretic:** prag de 75% la fiecare disciplină (RACR-LPAN ULM.2045).
- **Valabilitatea licenței:** 24 de luni de la examinarea teoretică (RACR-LPAN ULM.2025).
- **Vârsta minimă:** 16 ani împliniți (RACR-LPAN ULM.2040).
- **Certificat medical:** clasa 2, cu valabilitate în funcție de vârstă (MED.A.045: 60 de luni până la 40 de ani, 24 de luni între 40 și 50, 12 luni peste 50).
- **Carnet de zbor:** evidența zborurilor (RACR-LPAN ULM.4020).

**Consecință importantă:** cerințele depind de țară. Cifrele de mai sus sunt pentru România. Pentru fiecare piață străină avem nevoie de un „pachet de reglementare” separat, cu cerințele țării respective. Modelul de date trebuie să permită asta de la început.

## 4. Jurnalul de zbor al elevului

Acesta e miezul aplicației.

**Elevul își loghează singur zborurile din școală:**
- data, locul de decolare și aterizare, durata, tipul de zbor (școală, solo, tandem, tip de aripă);
- condițiile (vânt, temperatura, altitudinea maximă, dacă e cazul);
- **harta și datele zborului** (traseu, altitudine, viteză), importate din Gaggle.

**Import din Gaggle, pe etape:**
1. **Acum:** elevul încarcă fișierul de zbor exportat din Gaggle (IGC sau GPX). Gaggle acceptă aceste formate. Surse: [flygaggle.com/help](https://flygaggle.com/help/), [Gaggle, import din fișier](https://flygaggle.com/help/items/flight-logs-manage/).
2. **Dacă e posibil:** conectare directă, prin API-ul de conectare al Gaggle. Gaggle a anunțat în octombrie 2026 un „Connected apps API” pentru aplicații terțe, cu documentație în setările contului. Nu am văzut încă endpoint-urile de import. De verificat.
3. **Integrarea „Incoming Integrations” din Gaggle** permite aplicațiilor externe să citească datele, nu să le trimită. Nu ajunge pentru import.

**Vizibilitatea zborurilor:** instructorul decide, pentru fiecare zbor sau pentru tot, dacă e public pentru toți elevii logați pe site sau doar pentru elev și instructori. Administratorul vede totul oricum.

## 5. Rubrica instructorului pentru fiecare zbor

După fiecare zbor, instructorul completează o fișă scurtă, legată de zbor:
- **Ce a făcut bine:** lista de puncte forte.
- **Ce a greșit:** lista de greșeli, cu gravitatea (mică, medie, gravă).
- **Ce urmează:** exercițiul următor.
- **Semnătură:** validă o singură dată, cu data și ora.

Fișa e vizibilă elevului și instructorului. Dacă zborul e public, fișa rămâne privată, doar zborul e public. Nota nu se editează după semnare, doar se completează.

## 6. Alte funcționalități

Acestea sunt **candidate**, nu un angajament. Alegem din listă.

**Public (site-ul școlii):**
- cursuri și prețuri, cu sau fără echipament;
- program, locații, instructori;
- formular de cerere de înscriere (fără plată);
- întrebări frecvente;
- modulul de teorie al manualului.

**Elev:**
- programul personal, cu ce urmează;
- progres față de cerințele reglementării, cu bară de progres;
- documente cu dată de expirare (certificat medical, copie licență), cu memento pe e-mail;
- rezervarea lecțiilor disponibile, cu regula de anulare;
- teste de teorie, cu progres salvat.

**Instructor:**
- calendar cu lecții, pe elev și pe loc de zbor;
- fișa elevului: program, jurnal, documente;
- lista de așteptare pentru locurile anulate.

**Administrator:**
- înscrieri și pachete;
- resurse (aripi, motoare, locuri de zbor) cu disponibilitate;
- facturi și plăți;
- rapoarte lunare: ore zburate, elevi activi, documente care expiră.

**Produs (vânzare):**
- abonament pentru școli, cu facturare;
- traduceri, prima dată în română și engleză;
- pachete de reglementare pe țară;
- jocuri și simulator 3D, vândute separat.

## 7. Adoptarea de către instructori

Instructorii preferă hârtia și Excel-ul. Aplicația reușește doar dacă e mai ușoară decât ce folosesc acum. Planul de adoptare face parte din produs, nu e o idee de adăugat la final:

- **Import din Excel și din jurnalele pe hârtie:** instructorul nu trebuie să rescrie istoricul. Încărcăm tabelele existente.
- **Pornire cu un singur lucru:** prima versiune rezolvă un singur lucru bine, de exemplu jurnalul de zbor. Restul vine după ce instructorul îl folosește.
- **Antrenament pe teren:** un instructor-campion din fiecare școală, plătit sau cu beneficii, care ajută colegii.
- **Hârtia rămâne o vreme:** la început aplicația e sursa principală, dar nu se elimină brusc tot ce era pe hârtie.
- **Măsurarea adoptării:** procent de zboruri logate în aplicație, timp mediu de semnare, întrebări repetate.

## 8. Tehnologie propusă

- **Frontend:** Angular, cu componente standalone și rutare. Paginile publice sunt randate pe server, pentru SEO.
- **Traduceri:** sistem de i18n din prima zi, ca adăugarea unei limbi să fie simplă.
- **Backend:** API (de exemplu NestJS), pe Cloud Run.
- **Baza de date:** PostgreSQL pe Cloud SQL. Un singur schema, cu separare pe școală (multi-tenant).
- **Fișiere:** Cloud Storage privat, pentru documente și fișierele de zbor. Fără acces public.
- **Autentificare:** SwirlockIDP, ca furnizor de conturi. Se integrează în faza de autentificare.
- **Hărți și zboruri:** importul IGC/GPX într-un format intern, cu traseu și altitudine.
- **E-mail:** SendGrid sau Mailgun, pentru memento-uri.
- **Plăți:** Stripe, pentru abonamente și pachete.
- **Deploy:** GitHub Actions, ca acum.

## 9. Riscuri

- **Date medicale:** certificatul medical e dată sensibilă. Trebuie minimizat, protejat și șters la cerere. Pentru UE e nevoie de GDPR complet.
- **Date între școli:** o școală nu trebuie să vadă datele alteia. Separarea pe școală se testează, nu doar se presupune.
- **Reglementări diferite pe țară:** un pachet greșit poate induce elevul în eroare. Fiecare pachet are sursa lui, verificată.
- **Gaggle:** importul depinde de formatele și de API-ul lor. Dacă se schimbă, importul din fișier rămâne ca plan B.
- **Adoptarea:** cel mai mare risc. Dacă instructorii nu o folosesc, produsul nu valorează nimic.
- **Vânzarea internațională:** traduceri, plată, suport în fusuri orare, reglementări. Fiecare piață e un proiect în sine.
- **Scope:** lista din secțiunea 6 e lungă. Propun să alegem o primă versiune de câteva funcții, nu tot.

## 10. Decizii pe care le luăm acum

1. **Prima versiune:** jurnalul de zbor al elevului și fișa instructorului? Sau începem cu site-ul public?
2. **Prima școală:** Paramotor Artisan, gratuit. Câte instructori și câți elevi activi are?
3. **Prima țară:** România, cu pachetul de reglementare din `docs/`. Care alte țări urmează?
4. **Model de preț:** abonament lunar pe școală sau pe instructor? Prețul pentru jocuri și simulator separat?
5. **Import Gaggle:** începem cu fișier IGC/GPX? Verificăm API-ul lor pentru conectare directă?

## 11. Ordinea de lucru

1. Răspunzi la cele cinci decizii din secțiunea 10.
2. Alegem prima versiune: funcțiile din secțiunea 4 și 5, sau mai puțin.
3. Scriu specificația acelei versiuni: pagini, date, roluri, reguli. O aprobi.
4. Abia după aceea scriu cod.
