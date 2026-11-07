// Afișează capitolele și întrebările din datele încorporate în index.html.
(function () {
  var chapters = JSON.parse(document.getElementById('manual-data').textContent);
  var byId = {};
  chapters.forEach(function (c) { byId[c.id] = c; });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  // Explicații lungi: blocuri separate de rânduri goale; un bloc care începe cu „## ” devine titlu;
  // „!!text!!” se afișează cu roșu și bold.
  function addInline(p, line) {
    line.split(/!!(.+?)!!/).forEach(function (part, i) {
      if (!part) return;
      if (i % 2 === 1) {
        p.appendChild(el('strong', 'alert-text', part));
      } else {
        p.appendChild(document.createTextNode(part));
      }
    });
  }

  function fillParagraphs(container, text) {
    String(text || '').split(/\n\s*\n/).forEach(function (block) {
      var lines = block.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;
      if (/^## /.test(lines[0])) {
        container.appendChild(el('h4', null, lines[0].replace(/^## /, '')));
        lines = lines.slice(1);
        if (!lines.length) return;
      }
      var p = el('p');
      lines.forEach(function (line, i) {
        if (i > 0) p.appendChild(document.createElement('br'));
        addInline(p, line);
      });
      container.appendChild(p);
    });
  }

  function more(label, longText, extraClass) {
    var d = el('details', 'more' + (extraClass ? ' ' + extraClass : ''));
    d.appendChild(el('summary', null, label));
    var body = el('div', 'more-body');
    fillParagraphs(body, longText);
    d.appendChild(body);
    return d;
  }

  function renderNav(activeId) {
    var nav = document.getElementById('topics');
    nav.textContent = '';
    chapters.forEach(function (c) {
      var a = el('a', 'topic' + (c.id === activeId ? ' current' : ''), c.title);
      a.href = '#' + c.id;
        if (c.id === activeId) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    });
    var label = el('div', 'topics-label', 'Documente');
    nav.appendChild(label);
    [["RACR-LPAN ULM – licențiere ULM","docs/html/racr-lpan-ulm.html"],["Codul aerian 2020","docs/html/codul-aerian-2020.html"],["HG 1.234/2021 – căutare și salvare","docs/html/hg-1234-2021-cautare-salvare.html"],["Anexele 1–6 (2007)","docs/html/anexele-1-6-2007.html"],["Reg. (UE) 2019/27 – medical","docs/html/reg-ue-2019-27-med.html"],["AIP ENR 1.4","docs/html/aip-enr-1-4.html"],["OMTIC 910/2020 – anexe","docs/html/omtic-910-2020-anexe.html"],["PAC-MED 2025","docs/html/pac-med-2025.html"],["RACR-CCO AUN","docs/html/racr-cco-aun.html"],["RACR-CCO ULM","docs/html/racr-cco-ulm.html"],["RACR-RA ediția 2","docs/html/racr-ra-ed2.html"]].forEach(function (d) {
      var a = el('a', 'topic', d[0]);
      a.href = d[1];
      a.target = '_blank';
      a.rel = 'noopener';
      nav.appendChild(a);
    });
  }

  function renderChapter(c) {
    var main = document.getElementById('content');
    main.textContent = '';
    main.appendChild(el('h1', 'sr-only', c.title));

    c.questions.forEach(function (q, index) {
      var section = el('section', 'question');
      var h2 = el('h2', 'question-title');
      h2.appendChild(el('span', 'question-number', String(index + 1)));
      // Codul (ex. "698: ") nu se mai afișează
      h2.appendChild(document.createTextNode(q.text.replace(/^\d+:\s*/, '')));
      section.appendChild(h2);
      if (q.image) {
        var fig = el('img', 'question-image');
        fig.src = q.image;
        fig.alt = 'Figura întrebării ' + (index + 1);
        fig.loading = 'lazy';
        section.appendChild(fig);
      }

      var ol = el('ol', 'answers');
      q.answers.forEach(function (a, k) {
        var li = el('li', 'answer' + (a.correct ? ' correct' : ''));
        li.appendChild(el('span', 'letter', 'ABCD'.charAt(k)));
        var body = el('div', 'answer-body');
        var txt = el('span', 'answer-text', a.text);
        if (a.tag) {
          var tag = el('span', 'answer-tag');
          tag.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" fill="#ff9800"/><path d="M12 8.5v5" stroke="#1a1e1e" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.9" fill="#1a1e1e"/></svg>';
          tag.appendChild(document.createTextNode(' - ' + a.tag));
          txt.appendChild(document.createTextNode(' '));
          txt.appendChild(tag);
        }
        body.appendChild(txt);
        if (a.short) body.appendChild(el('p', 'answer-short', a.short));
        if (a.long) {
          var det = more('', a.long, 'answer-more');
          det.firstChild.setAttribute('aria-label', 'Detalii');
          body.appendChild(det);
        }
        if (det) {
          li.classList.add('has-detail');
          li.addEventListener('click', function (e) {
            if (e.target.closest('details.answer-more')) return;
            det.open = !det.open;
          });
        }
        if (a.warn) {
          var w = el('p', 'warn');
          var strong = el('strong', null, 'Atenție: ');
          w.appendChild(strong);
          w.appendChild(document.createTextNode(a.warn));
          body.appendChild(w);
        }
        li.appendChild(body);
        ol.appendChild(li);
      });
      section.appendChild(ol);
      var explain = el('div', 'question-explain');
      explain.appendChild(el('p', 'question-short', q.short));
      explain.appendChild(more('Explicație detaliată', q.long, 'question-more'));
      section.appendChild(explain);
      main.appendChild(section);
    });
    window.scrollTo(0, 0);
  }

  function route() {
    var id = (location.hash || '#01').slice(1);
    var c = byId[id] || chapters[0];
    renderNav(c.id);
    renderChapter(c);
  }

  window.addEventListener('hashchange', route);
  route();
})();

