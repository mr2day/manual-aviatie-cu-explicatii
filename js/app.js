// Afișează catalogul capitolelor; fiecare capitol este încărcat când este selectat.
(function () {
  var chapters = [];
  var byId = {};
  var chapterCache = {};
  var catalogReady = false;
  var routeVersion = 0;
  var assetVersion = document.currentScript && document.currentScript.getAttribute('data-version') || '';

  function showStatus(message, retry) {
    var main = document.getElementById('content');
    main.textContent = '';
    var status = el('div', 'load-status');
    status.setAttribute('role', 'status');
    status.appendChild(el('p', null, message));
    if (retry) {
      var button = el('button', 'retry-load', 'Încearcă din nou');
      button.type = 'button';
      button.addEventListener('click', retry);
      status.appendChild(button);
    }
    main.appendChild(status);
  }

  function loadCatalog() {
    showStatus('Se încarcă lista capitolelor…');
    var url = 'data/chapters.json' + (assetVersion ? '?v=' + encodeURIComponent(assetVersion) : '');
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Catalog HTTP ' + response.status);
      return response.json();
    }).then(function (items) {
      if (!Array.isArray(items) || !items.length) throw new Error('Catalogul capitolelor este gol.');
      chapters = items;
      byId = {};
      chapters.forEach(function (chapter) { byId[chapter.id] = chapter; });
      catalogReady = true;
      route();
    }).catch(function (error) {
      console.error('Nu s-a putut încărca catalogul capitolelor.', error);
      showStatus('Lista capitolelor nu s-a putut încărca. Verifică conexiunea și încearcă din nou.', loadCatalog);
    });
  }

  function loadChapter(meta) {
    if (!chapterCache[meta.id]) {
      var url = meta.file + (meta.file.indexOf('?') === -1 ? '?' : '&') + 'v=' + encodeURIComponent(assetVersion);
      chapterCache[meta.id] = fetch(url).then(function (response) {
        if (!response.ok) throw new Error('Capitol HTTP ' + response.status);
        return response.json();
      }).then(function (chapter) {
        if (chapter.id !== meta.id || !Array.isArray(chapter.questions)) {
          throw new Error('Date invalide pentru capitolul ' + meta.id);
        }
        return chapter;
      }).catch(function (error) {
        delete chapterCache[meta.id];
        throw error;
      });
    }
    return chapterCache[meta.id];
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  // Explicații lungi: blocuri separate de rânduri goale; un bloc care începe cu „## ” devine titlu;
  // „!!text!!” se afișează cu roșu și bold.
  // Frazele mnemonice pentru coduri de transponder (ex. „Seventy-five, stay alive”) apar mov și italic.
  function appendMnemonic(parent, text) {
    var re = /(["„]Seventy-[^"”]*["”])/g;
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      parent.appendChild(el('em', 'mnemonic', m[1]));
      last = m.index + m[1].length;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }

  function addInline(p, line) {
    line.split(/(!!.+?!!|\*\*.+?\*\*|~~.+?~~|__.+?__)/).forEach(function (part) {
      if (!part) return;
      if (part.indexOf('!!') === 0 && part.slice(-2) === '!!') {
        p.appendChild(el('strong', 'alert-text', part.slice(2, -2)));
      } else if (part.indexOf('__') === 0 && part.slice(-2) === '__' && part.length > 4) {
        p.appendChild(el('em', 'mnemonic', part.slice(2, -2)));
      } else if (part.indexOf('~~') === 0 && part.slice(-2) === '~~') {
        p.appendChild(el('strong', 'hl-green', part.slice(2, -2)));
      } else if (part.indexOf('**') === 0 && part.slice(-2) === '**') {
        p.appendChild(el('strong', 'emph', part.slice(2, -2)));
      } else {
        appendMnemonic(p, part);
      }
    });
  }

  function fillParagraphs(container, text) {
    String(text || '').split(/\n\s*\n/).forEach(function (block) {
      var lines = block.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;
      if (/^## /.test(lines[0])) {
        var h4 = el('h4');
        addInline(h4, lines[0].replace(/^## /, ''));
        container.appendChild(h4);
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
  }

  // Căutare în titlurile întrebărilor, ca Ctrl+F: săgețile trec la următoarea sau precedenta potrivire.
  function foldText(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  // Căutarea ignoră diacriticele: „a” găsește și „ă” și „â”, „s” găsește și „ș”, „t” și „ț”.
  function queryRegex(folded) {
    var variants = { a: '[aăâ]', i: '[iî]', s: '[sș]', t: '[tț]' };
    var src = '';
    for (var k = 0; k < folded.length; k++) {
      var ch = folded.charAt(k);
      src += variants[ch] || ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp(src, 'gi');
  }

  // Glosar: termenii din titluri devin linkuri care deschid un modal.
  var glossary = JSON.parse(document.getElementById('glossary-data').textContent);
  var termRe = (function () {
    var parts = glossary.map(function (g) { return queryRegex(foldText(g.term)).source + '[a-zăâîșțĂÂÎȘȚ]*'; });
    return parts.length ? new RegExp(parts.join('|'), 'gi') : null;
  })();

  function glossaryEntry(text) {
    var f = foldText(text);
    for (var i = 0; i < glossary.length; i++) {
      if (f.indexOf(foldText(glossary[i].term)) !== -1) return glossary[i];
    }
    return null;
  }

  // Scrie titlul întrebării: termenii din glosar devin linkuri, fragmentul găsit în căutare devine <mark>.
  function renderTitle(h2, raw, re) {
    var num = h2.querySelector('.question-number');
    h2.textContent = '';
    if (num) h2.appendChild(num);
    var segs = [];
    var pos = 0;
    if (termRe) {
      termRe.lastIndex = 0;
      var t;
      var linked = false;
      while ((t = termRe.exec(raw)) !== null) {
        if (t[0].length === 0) { termRe.lastIndex++; continue; }
        var entry = linked ? null : glossaryEntry(t[0]);
        if (entry) linked = true;
        segs.push({ text: raw.slice(pos, t.index), term: null });
        segs.push({ text: t[0], term: entry });
        pos = t.index + t[0].length;
      }
    }
    segs.push({ text: raw.slice(pos), term: null });
    segs.forEach(function (s) {
      if (!s.text) return;
      if (s.term) { h2.appendChild(termLink(s.text, s.term, re)); return; }
      appendMarked(h2, s.text, re);
    });
  }

  function appendMarked(h2, text, re) {
    if (!re) { h2.appendChild(document.createTextNode(text)); return; }
    re.lastIndex = 0;
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      if (m.index > last) h2.appendChild(document.createTextNode(text.slice(last, m.index)));
      h2.appendChild(el('mark', 'q-hit', m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) h2.appendChild(document.createTextNode(text.slice(last)));
  }

  function termLink(text, entry, re) {
    var b = el('button', 'term-link');
    appendMarked(b, text, re);
    b.type = 'button';
    b.addEventListener('click', function (e) { e.stopPropagation(); openModal(entry.title, entry.text); });
    return b;
  }

  // Modal reutilizabil: openModal(titlu, text). Textul folosește aceleași reguli ca explicațiile.
  var lastFocus = null;
  function openModal(title, text) {
    var modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    var body = document.getElementById('modal-body');
    body.textContent = '';
    fillParagraphs(body, text);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    var modal = document.getElementById('modal');
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initModal() {
    var modal = document.getElementById('modal');
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-modal-close]')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }
  initModal();

  function buildSearchBar() {
    var bar = el('div', 'q-search');
    bar.setAttribute('role', 'search');
    var input = el('input', 'q-search-input');
    input.type = 'search';
    input.placeholder = 'Caută în întrebări…';
    input.setAttribute('aria-label', 'Caută în titlurile întrebărilor');
    var count = el('span', 'q-search-count');
    count.setAttribute('aria-live', 'polite');
    var prev = el('button', 'q-search-btn');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Întrebarea anterioară');
    prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var next = el('button', 'q-search-btn');
    next.type = 'button';
    next.setAttribute('aria-label', 'Întrebarea următoare');
    next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    bar.appendChild(input);
    bar.appendChild(count);
    bar.appendChild(prev);
    bar.appendChild(next);
    bar.refs = { input: input, count: count, prev: prev, next: next };
    return bar;
  }

  function stickyTop() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--q-top')) || 0;
  }

  function setStickyTop() {
    var mb = document.querySelector('.menu-bar');
    var h = mb && getComputedStyle(mb).display !== 'none' ? mb.offsetHeight : 0;
    document.documentElement.style.setProperty('--q-top', h + 'px');
  }

  function initSearch(bar, sections, questions) {
    var refs = bar.refs;
    var raw = questions.map(function (q) { return q.text.replace(/^\d+:\s*/, ''); });
    var folded = raw.map(foldText);
    var matches = [];
    var pos = -1;
    var current = null;
    var re = null;

    function show() {
      if (!matches.length) {
        refs.count.textContent = refs.input.value.trim() ? '0 rezultate' : '';
      } else {
        refs.count.textContent = (pos + 1) + ' / ' + matches.length;
      }
      refs.prev.disabled = refs.next.disabled = matches.length === 0;
    }

    // Derulează astfel încât întrebarea să fie sub bara de căutare, nu ascunsă în spatele ei.
    function scrollToCurrent() {
      setStickyTop();
      document.documentElement.style.setProperty('--q-search-h', bar.offsetHeight + 'px');
      current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    function go(p) {
      if (current) current.classList.remove('search-hit');
      pos = p;
      current = sections[matches[pos]];
      current.classList.add('search-hit');
      scrollToCurrent();
      show();
    }

    function paint() {
      sections.forEach(function (sec, i) {
        var h2 = sec.querySelector('.question-title');
        renderTitle(h2, raw[i], matches.indexOf(i) !== -1 ? re : null);
      });
    }

    function recalc() {
      var q = foldText(refs.input.value.trim());
      matches = [];
      if (current) { current.classList.remove('search-hit'); current = null; }
      pos = -1;
      re = q ? queryRegex(q) : null;
      if (q) {
        folded.forEach(function (t, i) { if (t.indexOf(q) !== -1) matches.push(i); });
      }
      paint();
      if (matches.length) go(0); else show();
    }

    function step(d) {
      flush();
      if (!matches.length) return;
      go((pos + d + matches.length) % matches.length);
    }

    // Căutarea pornește la o secundă după ultimul caracter introdus.
    var timer = null;
    function flush() {
      if (timer) { clearTimeout(timer); timer = null; recalc(); }
    }
    refs.input.addEventListener('input', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { timer = null; recalc(); }, 1000);
    });
    refs.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
      if (e.key === 'Escape') { if (timer) { clearTimeout(timer); timer = null; } refs.input.value = ''; recalc(); }
    });
    refs.prev.addEventListener('click', function () { step(-1); });
    refs.next.addEventListener('click', function () { step(1); });
    show();
    setStickyTop();
  }

  window.addEventListener('resize', setStickyTop);


  function renderChapter(c) {
    var main = document.getElementById('content');
    main.textContent = '';
    main.appendChild(el('h1', 'sr-only', c.title));
    var searchBar = buildSearchBar();
    main.appendChild(searchBar);
    var sections = [];

    c.questions.forEach(function (q, index) {
      var section = el('section', 'question');
      var h2 = el('h2', 'question-title');
      h2.appendChild(el('span', 'question-number', String(index + 1)));
      // Codul (ex. "698: ") nu se mai afișează
      renderTitle(h2, q.text.replace(/^\d+:\s*/, ''), null);
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
        var txt = el('span', 'answer-text');
        addInline(txt, a.text);
        if (a.tag) {
          var tag = el('span', 'answer-tag');
          tag.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" fill="#ff9800"/><path d="M12 8.5v5" stroke="#1a1e1e" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.9" fill="#1a1e1e"/></svg>';
          tag.appendChild(document.createTextNode(' ' + a.tag));
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
      sections.push(section);
      main.appendChild(section);
    });
    initSearch(searchBar, sections, c.questions);
    window.scrollTo(0, 0);
  }

  // Documentele se afișează în zona principală, ca orice conținut. Fiecare document este
  // un fragment încărcat la cerere (docs/fragments/<slug>.js).
  function renderDoc(d) {
    var main = document.getElementById('content');
    main.textContent = '';
    if (d.title) main.appendChild(el('h1', 'doc-title', d.title));
    var meta = el('p', 'doc-meta');
    meta.innerHTML = d.meta;
    if (d.meta) main.appendChild(meta);
    var body = el('div', 'doc');
    body.innerHTML = d.html;
    main.appendChild(body);
    window.scrollTo(0, 0);
  }

  function showDocMissing() {
    var main = document.getElementById('content');
    main.textContent = '';
    main.appendChild(el('h1', 'doc-title', 'Documentul nu a putut fi încărcat.'));
  }

  function loadDoc(slug, requestVersion) {
    var frags = window.DOC_FRAGMENTS || {};
    if (frags[slug]) { if (requestVersion === routeVersion) renderDoc(frags[slug]); return; }
    var s = document.createElement('script');
    s.src = 'docs/fragments/' + slug + '.js';
    s.onload = function () {
      var f = (window.DOC_FRAGMENTS || {})[slug];
      if (requestVersion !== routeVersion) return;
      if (f) renderDoc(f); else showDocMissing();
    };
    s.onerror = function () { if (requestVersion === routeVersion) showDocMissing(); };
    document.body.appendChild(s);
  }

  // Titlul secțiunii curente, afișat în butonul Meniu pe mobil.
  function setCurrent(text) {
    var e = document.getElementById('menu-current');
    if (e) e.textContent = text || '';
  }

  function route() {
    var requestVersion = ++routeVersion;
    if (!catalogReady) return;
    var hash = location.hash || '#01';
    if (hash.indexOf('#doc/') === 0) {
      renderNav(null);
      setCurrent((document.querySelector('.sidebar a[href="' + hash + '"]') || {}).textContent || '');
      loadDoc(hash.slice(5), requestVersion);
      return;
    }
    var c = byId[hash.slice(1)] || chapters[0];
    renderNav(c.id);
    setCurrent(c.title);
    showStatus('Se încarcă ' + c.title + '…');
    loadChapter(c).then(function (chapter) {
      if (requestVersion === routeVersion) renderChapter(chapter);
    }).catch(function (error) {
      console.error('Nu s-a putut încărca capitolul ' + c.id + '.', error);
      if (requestVersion === routeVersion) {
        showStatus('Capitolul nu s-a putut încărca. Verifică conexiunea și încearcă din nou.', function () {
          delete chapterCache[c.id];
          route();
        });
      }
    });
  }


  // Meniu pe mobil: butonul Meniu deschide bara laterală; alegerea unui link o închide.
  var menuToggle = document.getElementById('menu-toggle');
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('menu-backdrop');
  function setMenu(open) {
    sidebar.classList.toggle('open', open);
    backdrop.hidden = !open;
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  menuToggle.addEventListener('click', function () { setMenu(!sidebar.classList.contains('open')); });
  backdrop.addEventListener('click', function () { setMenu(false); });
  sidebar.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  setMenu(false);

  window.addEventListener('hashchange', route);
  loadCatalog();
})();

