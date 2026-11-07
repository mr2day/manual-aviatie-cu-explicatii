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

  // Explicații lungi: blocuri separate de rânduri goale; un bloc care începe cu „## ” devine titlu.
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
        p.appendChild(document.createTextNode(line));
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
        body.appendChild(el('span', 'answer-text', a.text));
        if (a.short) body.appendChild(el('p', 'answer-short', a.short));
        if (a.long) {
          var det = more('', a.long, 'answer-more');
          det.firstChild.setAttribute('aria-label', 'Detalii');
          body.appendChild(det);
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

