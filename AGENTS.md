# Instrucțiuni pentru agenții AI

Acest document se aplică tuturor agenților AI care lucrează în acest repository. Răspunde utilizatorului în limba română, dacă acesta nu cere altă limbă.

## Reguli pentru proiect

- Proiectul este un manual web static pentru pregătirea examenului teoretic de paramotor.
- `data/questions.json` este sursa de adevăr pentru întrebări, răspunsuri și explicații; fiecare înregistrare are un `id` unic și proprietatea `chapter`. `data/chapters-meta.json` păstrează metadatele capitolelor. Nu modifica `index.html` sau `data/chapters.json` manual; regenerează-le cu `node tools/build.js`.
- Păstrează marcajul verde pe răspunsul indicat de sursă. Dacă răspunsul pare greșit, semnalează problema prin câmpul `warn`; nu schimba răspunsul corect fără verificare și justificare.
- Nu adăuga logo-uri, fotografii sau texte externe care nu au fost furnizate ori aprobate de utilizator.
- Pentru modificări de design, predă schimbarea prompt; verificarea vizuală în browser îi revine utilizatorului.
- Respectă modificările locale ale utilizatorului. La încheierea taskului, include în commit toate modificările din working tree, inclusiv modificările preexistente și fișierele noi, dacă utilizatorul nu cere explicit excluderea unora.
- Nu rula verificări care durează mult și nu ține utilizatorul în așteptare pentru verificări vizuale. Acestea sunt responsabilitatea utilizatorului: el va verifica în browser și va comunica problemele. Limitează-te la verificări rapide, precum sintaxa sau whitespace-ul, și predă schimbarea prompt.

## Încheierea fiecărui task

Este obligatoriu ca agentul să creeze un commit și să îl împingă (`push`) către branch-ul de lucru de fiecare dată când termină un task.

1. Verifică diferențele și starea repository-ului.
2. Rulează doar verificări rapide potrivite schimbării și repară problemele evidente. Nu porni verificări lente, capturi de ecran sau sesiuni de browser; verificarea vizuală îi revine utilizatorului.
3. Adaugă toate modificările raportate de `git status`, inclusiv fișierele necomise preexistente și fișierele noi; nu limita commitul la fișierele editate pentru taskul curent. Exclude ceva numai dacă utilizatorul cere explicit.
4. Creează un commit cu un mesaj clar, apoi împinge branch-ul curent către remote.
5. Confirmă utilizatorului hash-ul commitului și rezultatul push-ului. Dacă commitul sau push-ul nu reușește, explică motivul și lasă schimbările intacte pentru continuare.

Nu declara taskul încheiat înainte de commit și push reușite, cu excepția cazului în care utilizatorul cere explicit să nu fie făcute.
