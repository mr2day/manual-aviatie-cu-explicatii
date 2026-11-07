# Plan: platforma digitală pentru o școală de paramotor

Status: **plan, nu implementare.** Nimic din acest document nu e construit încă. Fiecare funcționalitate intră în lucru doar când e aprobată explicit.

## 1. Ce problemă rezolvăm

Școlile de paramotor țin evidența pe hârtie sau în tabele: cine a făcut ce lecție, cât a zburat, ce documente expiră, cine e programat când. Instructorul pierde timp cu administrarea, iar elevul nu știe unde e în program. Scopul platformei: să scoată din calea instructorului și a elevului munca de administrare, fără să complice zborul.

## 2. Cine folosește platforma

- **Elev:** vrea să știe unde e în program, ce urmează, cât a zburat, ce documente trebuie să aibă valabile.
- **Instructor:** vrea să programeze lecții rapid, să noteze progresul pe loc și să nu scrie același lucru de două ori.
- **Administrator (școala):** vrea să vadă cine se înscrie, ce e plătit, ce resurse sunt libere.
- **Vizitator:** vrea să înțeleagă cursurile, prețurile și să ceară o programare.

## 3. Ce ne cere reglementarea (sursele din repo)

Acestea sunt cerințe reale, din documentele din `docs/` (RACR-LPAN ULM, RACR-CCO ULM, PAC-MED 2025, Reg. (UE) 2019/27):

- **Program teoretic:** minimum 50 de ore, sub supravegherea unui instructor (RACR-LPAN ULM, anexa 2).
- **Zbor:** minimum 15 ore pentru parapantă cu motor (RACR-LPAN ULM.2060 lit. a pct. i).
- **Examen teoretic:** prag de 75% la fiecare disciplină (RACR-LPAN ULM.2045).
- **Valabilitatea licenței:** 24 de luni de la examinarea teoretică (RACR-LPAN ULM.2025).
- **Vârsta minimă:** 16 ani împliniți (RACR-LPAN ULM.2040).
- **Certificat medical:** clasa 2, cu valabilitate în funcție de vârstă (MED.A.045: 60 de luni până la 40 de ani, 24 de luni între 40 și 50, 12 luni peste 50).
- **Carnet de zbor:** ține evidența zborurilor (RACR-LPAN ULM.4020).

Consecință: platforma poate calcula singură progresul față de aceste cerințe și poate avertiza când un document expiră.

## 4. Funcționalități, pe grupuri

Acestea sunt **candidate**, nu un angajament. Alegem din listă.

**Public (site de prezentare, Angular):**
- cursuri și prețuri, cu sau fără echipament;
- program, locații, instructori;
- formular de cerere de înscriere (fără plată);
- întrebări frecvente;
- modulul de teorie al manualului (conținutul existent din repo).

**Elev:**
- cont și profil;
- programul personal, cu ce urmează;
- carnet digital de zbor (locuri, durată, condiții, sign-off instructor);
- progres față de cerințele RACR-LPAN, cu bară de progres;
- documente încărcate (certificat medical, copie licență) cu data de expirare;
- memento pe e-mail înainte de expirarea documentelor;
- rezervarea lecțiilor disponibile, cu regula de anulare;
- teste de teorie din manual, cu progres salvat.

**Instructor:**
- calendar cu lecții, pe elev și pe loc de zbor;
- fișa elevului: program, carnet, documente;
- semnătură pe fiecare lecție (validă o singură dată, cu dată și oră);
- notă scurtă după lecție, vizibilă doar pentru elev și instructor;
- lista de așteptare pentru locurile anulate.

**Administrator:**
- înscrieri și pachete;
- resurse (aripi, motoare, locuri de zbor) cu disponibilitate;
- facturi și plăți (după faza 4);
- raport lunar: ore zburate, elevi activi, documente care expiră.

**Nu intră în planul inițial:** magazin, închirieri de echipament, simulator 3D, integrare cu meteo în timp real, aplicație mobilă nativă. Pot fi adăugate după ce restul funcționează.

## 5. Etape

**Faza 0: decizii (înainte de cod).** Răspunsurile la întrebările din secțiunea 8.

**Faza 1: site public.** Pagini de cursuri, prețuri, contact, formular de cerere de înscriere, modulul de teorie. Fără cont și fără plată. Obiectiv: școala are o prezență reală și primește cereri.

**Faza 2: cont elev și progres.** Autentificare, carnet digital, progres față de cerințele RACR-LPAN, documente cu expirare și memento pe e-mail. Obiectiv: elevul își vede singur stadiul, iar instructorul semnează în platformă.

**Faza 3: programare.** Calendar instructor, rezervări, resurse, anulări, listă de așteptare. Obiectiv: nu mai există programări pe WhatsApp.

**Faza 4: plăți și facturi.** Pachete plătite online (Stripe), facturi generate automat. Obiectiv: încasările se văd în platformă.

**Faza 5: instrumente pentru instructor și rapoarte.** Notă după lecție, rapoarte lunare, export pentru autoritate dacă e cerut.

Fiecare fază se livrează separat, se testează cu școala și abia apoi trece la următoarea.

## 6. Tehnologie propusă

- **Frontend:** Angular, cu componente standalone și rutare. Paginile publice pot fi randate pe server, pentru SEO.
- **Backend:** API (de exemplu NestJS), rulat pe Cloud Run.
- **Baza de date:** PostgreSQL pe Cloud SQL. Conținutul manualului migrează din JSON în baza de date.
- **Fișiere:** Cloud Storage, privat, pentru documentele elevilor. Fără acces public.
- **Autentificare:** de decis (secțiunea 8). Swirlock e amânat, dar rămâne opțiune.
- **E-mail:** SendGrid sau Mailgun, pentru memento-uri.
- **Plăți:** Stripe, din faza 4.
- **Deploy:** GitHub Actions, ca acum, cu Cloud Run pentru API și bucket pentru frontend.

## 7. Riscuri

- **Date medicale:** certificatul medical e dată sensibilă. Trebuie minimizată, protejată și ștearsă la cerere. Platforma are nevoie de o politică de confidențialitate și de consimțământ înainte de faza 2.
- **Răspundere:** platforma nu înlocuiește evidența oficială. Se clarifică ce e evidență oficială și ce e instrument de lucru.
- **Schimbări de reglementare:** cifrele din secțiunea 3 se pot schimba. Trebuie o sursă de adevăr pentru ele, nu valori fixe în cod.
- **Scope creep:** lista din secțiunea 4 e lungă. Regula noastră: fiecare funcționalitate intră doar când e cerută explicit.
- **Dependența de școală:** o platformă fără utilizatori activi nu valorează nimic. Faza 1 trebuie să fie folosită de la început.

## 8. Decizii de luat

1. **O școală sau mai multe?** Schimbă modelul de date. Eu propun una, cu structură care poate crește.
2. **Ce limbi?** Propun română, cu engleză pentru elevii străini, dacă apar.
3. **Plăți online din start sau mai târziu?** Propun mai târziu (faza 4).
4. **Cine e utilizatorul de zi cu zi?** Câți instructori, câți elevi activi pe lună.
5. **Autentificare:** Swirlock, Firebase Auth sau altceva. Decidem înainte de faza 2.
6. **Politica de date:** cine e operatorul, unde sunt stocate datele și cât timp.

## 9. Ce facem acum

1. Răspunzi la cele 6 întrebări din secțiunea 8.
2. Reducem lista din secțiunea 4 la ce vrei în prima versiune.
3. Scriem specificația fazei 1, cu pagini, conținut și comportament, și o aprobi.
4. Abia după aceea scriu cod.
