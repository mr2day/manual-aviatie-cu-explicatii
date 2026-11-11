# Instrucțiuni pentru agenții AI

Acest document se aplică tuturor agenților AI care lucrează în acest repository. Răspunde utilizatorului în limba română, dacă acesta nu cere altă limbă.

## Reguli pentru proiect

- Proiectul este un manual web static pentru pregătirea examenului teoretic de paramotor.
- Fișierele `data/01.json`–`data/09.json` sunt sursa de adevăr pentru întrebări, răspunsuri și explicații. Nu modifica `index.html` sau `data/chapters.json` manual când schimbarea trebuie făcută în surse; regenerează-le cu `node tools/build.js`.
- Păstrează marcajul verde pe răspunsul indicat de sursă. Dacă răspunsul pare greșit, semnalează problema prin câmpul `warn`; nu schimba răspunsul corect fără verificare și justificare.
- Nu adăuga logo-uri, fotografii sau texte externe care nu au fost furnizate ori aprobate de utilizator.
- Pentru modificări de design, verifică rezultatul vizual și fă o captură de ecran, conform cerinței existente a proiectului.
- Respectă modificările locale ale utilizatorului. La încheierea taskului, include în commit toate modificările din working tree, inclusiv modificările preexistente și fișierele noi, dacă utilizatorul nu cere explicit excluderea unora.

## Încheierea fiecărui task

Este obligatoriu ca agentul să creeze un commit și să îl împingă (`push`) către branch-ul de lucru de fiecare dată când termină un task.

1. Verifică diferențele și starea repository-ului.
2. Rulează verificările potrivite schimbării și repară problemele găsite.
3. Adaugă toate modificările raportate de `git status`, inclusiv fișierele necomise preexistente și fișierele noi; nu limita commitul la fișierele editate pentru taskul curent. Exclude ceva numai dacă utilizatorul cere explicit.
4. Creează un commit cu un mesaj clar, apoi împinge branch-ul curent către remote.
5. Confirmă utilizatorului hash-ul commitului și rezultatul push-ului. Dacă commitul sau push-ul nu reușește, explică motivul și lasă schimbările intacte pentru continuare.

Nu declara taskul încheiat înainte de commit și push reușite, cu excepția cazului în care utilizatorul cere explicit să nu fie făcute.
