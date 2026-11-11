// Afișează catalogul capitolelor; fiecare capitol este încărcat când este selectat.
(function () {
  var chapters = [];
  var byId = {};
  var chapterCache = {};
  var allQuestionsPromise = null;
  var catalogReady = false;
  var routeVersion = 0;
  var activeChapterId = null;
  var activeExam = 'toate';
  var activeSearchRefresh = null;
  var searchQuery = '';
  var searchExpanded = false;
  var searchIndexPromise = null;
  var pendingSearchResult = null;
  var assetVersion = document.currentScript && document.currentScript.getAttribute('data-version') || '';
  var trickinessOverrides = readTrickinessOverrides();

  function readTrickinessOverrides() {
    try { return JSON.parse(localStorage.getItem('aviatie-trickiness-overrides') || '{}'); }
    catch (_) { return {}; }
  }

  function setQuestionTrickiness(chapterId, index, question, value) {
    var key = chapterId + ':' + index;
    trickinessOverrides[key] = value || '';
    question.trickiness = value || null;
    try { localStorage.setItem('aviatie-trickiness-overrides', JSON.stringify(trickinessOverrides)); }
    catch (error) { console.warn('Nu s-a putut salva eticheta de trickiness în acest browser.', error); }
    if (searchIndexPromise) {
      searchIndexPromise.then(function (items) {
        var item = items.find(function (entry) { return entry.chapterId === chapterId && entry.index === index; });
        if (item) item.trickiness = value || null;
      });
    }
  }

  document.addEventListener('click', function (event) {
    var bar = document.querySelector('.q-search');
    if (!searchExpanded || !bar || bar.contains(event.target)) return;
    searchExpanded = false;
    var results = bar.querySelector('.q-search-results');
    var toggle = bar.querySelector('.q-search-toggle');
    if (results) results.hidden = true;
    bar.classList.remove('results-expanded');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Deschide rezultatele căutării');
    }
  });

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

  function loadAllQuestions() {
    if (!allQuestionsPromise) {
      var url = 'data/questions.json' + (assetVersion ? '?v=' + encodeURIComponent(assetVersion) : '');
      allQuestionsPromise = fetch(url).then(function (response) {
        if (!response.ok) throw new Error('Întrebări HTTP ' + response.status);
        return response.json();
      }).then(function (questions) {
        if (!Array.isArray(questions)) throw new Error('Baza de întrebări este invalidă.');
        return questions;
      }).catch(function (error) {
        allQuestionsPromise = null;
        throw error;
      });
    }
    return allQuestionsPromise;
  }

  function loadChapter(meta) {
    if (!chapterCache[meta.id]) {
      chapterCache[meta.id] = loadAllQuestions().then(function (questions) {
        var chapterQuestions = questions.filter(function (question) { return question.chapter === meta.id; });
        if (!chapterQuestions.length) throw new Error('Nu există întrebări pentru capitolul ' + meta.id);
        chapterQuestions.forEach(function (question, index) {
          var key = meta.id + ':' + index;
          if (Object.prototype.hasOwnProperty.call(trickinessOverrides, key)) {
            var override = trickinessOverrides[key];
            question.trickiness = override === 'tricky' || override === 'super_tricky' ? override : null;
          }
        });
        return { id: meta.id, title: meta.title, questions: chapterQuestions };
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
    var meta = el('div', 'q-search-meta');
    var count = el('span', 'q-search-count');
    count.setAttribute('aria-live', 'polite');
    var toggle = el('button', 'q-search-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'question-search-results');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    meta.appendChild(count);
    meta.appendChild(toggle);
    bar.appendChild(input);
    var results = el('div', 'q-search-results');
    results.id = 'question-search-results';
    results.hidden = true;
    bar.appendChild(meta);
    bar.appendChild(results);
    bar.refs = { input: input, count: count, toggle: toggle, results: results };
    return bar;
  }

  function updateExamFilter(root) {
    (root || document).querySelectorAll('.exam-switcher-button').forEach(function (button) {
      var selected = button.getAttribute('data-exam') === activeExam;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  function buildExamFilter() {
    var filter = el('div', 'exam-switcher');
    filter.setAttribute('role', 'group');
    filter.setAttribute('aria-label', 'Filtreaz\u0103 \u00eentreb\u0103rile');
    filter.appendChild(el('span', 'exam-switcher-label', 'Afi\u0219eaz\u0103'));
    var choices = [
      { id: 'toate', label: 'Toate' },
      { id: 'deva', label: 'Deva' },
      { id: 'bucuresti', label: 'București' }
    ];
    choices.push(
      { id: 'tricky', label: 'TRICKY' },
      { id: 'super_tricky', label: 'SUPER TRICKY' }
    );
    var group = el('div', 'exam-switcher-options');
    choices.forEach(function (choice) {
      var button = el('button', 'exam-switcher-button', choice.label);
      button.type = 'button';
      button.setAttribute('data-exam', choice.id);
      button.addEventListener('click', function () {
        if (activeExam === choice.id) return;
        activeExam = choice.id;
        updateExamFilter();
        if (activeChapterId && byId[activeChapterId]) {
          var chapterId = activeChapterId;
          var scrollY = window.scrollY;
          loadChapter(byId[chapterId]).then(function (chapter) {
            if (activeChapterId === chapterId) renderChapter(chapter, scrollY);
          });
        } else if (activeSearchRefresh) {
          activeSearchRefresh();
        }
      });
      group.appendChild(button);
    });
    filter.appendChild(group);
    updateExamFilter(filter);
    return filter;
  }

  function stickyTop() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--q-top')) || 0;
  }

  function setStickyTop() {
    var mb = document.querySelector('.menu-bar');
    var h = mb && getComputedStyle(mb).display !== 'none' ? mb.offsetHeight : 0;
    document.documentElement.style.setProperty('--q-top', h + 'px');
  }

  function getSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise = Promise.all(chapters.map(function (chapter) {
        return loadChapter(chapter).then(function (data) {
          return data.questions.map(function (question, index) {
            return {
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              index: index,
              number: index + 1,
              exams: question.exams || ['deva'],
              trickiness: question.trickiness || null,
              text: question.text.replace(/^\d+:\s*/, ''),
              folded: foldText(question.text.replace(/^\d+:\s*/, ''))
            };
          });
        });
      })).then(function (groups) {
        return [].concat.apply([], groups);
      }).catch(function (error) {
        searchIndexPromise = null;
        throw error;
      });
    }
    return searchIndexPromise;
  }

  function searchLetterCount(value) {
    return (foldText(value).match(/[a-z]/g) || []).length;
  }

  function questionBelongsToExam(question, exam) {
    if (exam === 'toate') return true;
    if (exam === 'tricky') {
      return question.trickiness === 'tricky' || question.trickiness === 'super_tricky';
    }
    if (exam === 'super_tricky') return question.trickiness === 'super_tricky';
    return (question.exams || ['deva']).indexOf(exam) !== -1;
  }

  function navigateToSearchResult(result) {
    searchExpanded = false;
    var bar = document.querySelector('.q-search');
    if (bar) document.documentElement.style.setProperty('--q-search-h', bar.offsetHeight + 'px');
    if (result.chapterId === activeChapterId) {
      var target = document.querySelector('#content .question[data-question-index="' + result.index + '"]');
      if (target) {
        document.querySelectorAll('#content .question').forEach(function (section) { section.classList.remove('search-hit'); });
        target.classList.add('search-hit');
        target.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
      return;
    }
    pendingSearchResult = result;
    location.hash = '#' + result.chapterId;
  }

  function initSearch(bar, questions) {
    var refs = bar.refs;
    refs.input.value = searchQuery;
    var rawTitles = questions ? questions.map(function (question) { return question.text.replace(/^\d+:\s*/, ''); }) : [];
    var timer = null;
    var request = 0;
    var enterAfterSearch = false;
    function paintTitles(query) {
      if (!questions) return;
      var foldedQuery = foldText(query.trim());
      var re = foldedQuery ? queryRegex(foldedQuery) : null;
      var sections = document.querySelectorAll('#content .question');
      sections.forEach(function (section) {
        var index = Number(section.getAttribute('data-question-index'));
        var raw = rawTitles[index];
        var title = section.querySelector('.question-title');
        if (title) renderTitle(title, raw, foldedQuery && foldText(raw).indexOf(foldedQuery) !== -1 ? re : null);
      });
    }
    function updateExpanded() {
      var hasQuery = !!searchQuery.trim();
      var tooShort = hasQuery && searchLetterCount(searchQuery) < 3;
      refs.results.hidden = !searchExpanded || tooShort;
      bar.classList.toggle('results-expanded', searchExpanded && !tooShort);
      refs.toggle.hidden = !hasQuery;
      refs.toggle.disabled = tooShort;
      refs.toggle.setAttribute('aria-expanded', searchExpanded ? 'true' : 'false');
      refs.toggle.setAttribute('aria-label', searchExpanded ? 'Închide rezultatele căutării' : 'Deschide rezultatele căutării');
      refs.input.title = tooShort ? 'Introdu minimum 3 litere pentru a căuta.' : '';
      refs.count.title = tooShort ? 'Introdu minimum 3 litere pentru a căuta.' : '';
      refs.count.classList.toggle('q-search-count-inactive', tooShort);
    }
    refs.toggle.addEventListener('click', function () {
      searchExpanded = !searchExpanded;
      updateExpanded();
    });
    function search() {
      var query = foldText(refs.input.value.trim());
      searchQuery = refs.input.value;
      refs.results.textContent = '';
      refs.results.hidden = true;
      paintTitles(searchLetterCount(refs.input.value) >= 3 ? refs.input.value : '');
      if (!query) { refs.count.textContent = ''; updateExpanded(); return; }
      if (searchLetterCount(refs.input.value) < 3) {
        enterAfterSearch = false;
        searchExpanded = false;
        refs.count.textContent = 'min. 3 litere';
        updateExpanded();
        return;
      }
      var currentRequest = ++request;
      refs.count.textContent = 'Se caută…';
      getSearchIndex().then(function (index) {
        if (currentRequest !== request) return;
        var matches = index.filter(function (item) { return questionBelongsToExam(item, activeExam) && item.folded.indexOf(query) !== -1; });
        refs.count.textContent = matches.length + (matches.length === 1 ? ' rezultat' : ' rezultate');
        refs.results.textContent = '';
        if (!matches.length) {
          refs.results.appendChild(el('p', 'q-search-empty', 'Nu am găsit întrebări potrivite.'));
          updateExpanded();
          return;
        }
        var grouped = {};
        matches.forEach(function (item) {
          if (!grouped[item.chapterId]) grouped[item.chapterId] = [];
          grouped[item.chapterId].push(item);
        });
        chapters.forEach(function (chapter) {
          var items = grouped[chapter.id];
          if (!items) return;
          var group = el('section', 'q-search-group');
          group.appendChild(el('h3', 'q-search-chapter', chapter.title + ' · ' + items.length));
          items.forEach(function (item) {
            var button = el('button', 'q-search-result');
            button.type = 'button';
            button.appendChild(el('span', 'q-search-result-number', String(item.number)));
            button.appendChild(el('span', null, item.text));
            button.addEventListener('click', function () {
              searchExpanded = false;
              updateExpanded();
              navigateToSearchResult(item);
            });
            group.appendChild(button);
          });
          refs.results.appendChild(group);
        });
        updateExpanded();
        if (enterAfterSearch) {
          enterAfterSearch = false;
          var first = refs.results.querySelector('.q-search-result');
          if (matches.length === 1 && first) first.click();
          else if (first) first.focus();
        }
      }).catch(function () {
        if (currentRequest !== request) return;
        refs.count.textContent = 'Căutarea nu a reușit';
        refs.results.appendChild(el('p', 'q-search-empty', 'Verifică conexiunea și încearcă din nou.'));
        updateExpanded();
      });
    }
    activeSearchRefresh = search;
    refs.input.addEventListener('input', function () {
      if (timer) clearTimeout(timer);
      searchQuery = refs.input.value;
      paintTitles(searchQuery);
      searchExpanded = searchLetterCount(searchQuery) >= 3;
      request++;
      refs.count.textContent = '';
      refs.results.textContent = '';
      refs.results.hidden = true;
      updateExpanded();
      timer = setTimeout(function () { timer = null; search(); }, 350);
    });
    refs.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = refs.results.querySelector('.q-search-result');
        if (timer) {
          clearTimeout(timer);
          timer = null;
          enterAfterSearch = true;
          search();
        } else if (first) {
          if (refs.count.textContent.indexOf('1 rezultat') === 0) first.click();
          else first.focus();
        }
      }
      if (e.key === 'Escape') {
        if (timer) { clearTimeout(timer); timer = null; }
        refs.input.value = '';
        searchQuery = '';
        searchExpanded = false;
        request++;
        refs.results.textContent = '';
        refs.results.hidden = true;
        refs.count.textContent = '';
        updateExpanded();
      }
    });
    updateExpanded();
    if (searchQuery) search();
    setStickyTop();
  }

  window.addEventListener('resize', setStickyTop);


  function renderChapter(c, restoreScrollY) {
    activeChapterId = c.id;
    var main = document.getElementById('content');
    main.textContent = '';
    main.appendChild(el('h1', 'sr-only', c.title));
    main.appendChild(buildExamFilter());
    var searchBar = buildSearchBar();
    main.appendChild(searchBar);
    var sections = [];
    var sectionsByIndex = {};

    c.questions.forEach(function (q, index) {
      if (!questionBelongsToExam(q, activeExam)) return;
      var section = el('section', 'question');
      if (q.trickiness === 'super_tricky') section.classList.add('question-super-tricky');
      else if (q.trickiness === 'tricky') section.classList.add('question-tricky');
      section.setAttribute('data-question-index', String(index));
      var h2 = el('h2', 'question-title');
      h2.appendChild(el('span', 'question-number', String(index + 1)));
      var trickinessControl = el('div', 'question-trickiness-control');
      trickinessControl.setAttribute('role', 'group');
      trickinessControl.setAttribute('aria-label', 'Setează nivelul TRICKY pentru întrebarea ' + (index + 1));
      [
        { value: '', label: 'normal' },
        { value: 'tricky', label: 'tricky' },
        { value: 'super_tricky', label: 'super tricky' }
      ].forEach(function (option) {
        var button = el('button', 'trickiness-segment', option.label);
        button.type = 'button';
        button.setAttribute('aria-pressed', String((q.trickiness || '') === option.value));
        button.setAttribute('aria-label', option.value ? option.label : 'Fără etichetă');
        if ((q.trickiness || '') === option.value) button.classList.add('selected');
        button.addEventListener('click', function () {
          setQuestionTrickiness(c.id, index, q, option.value);
          trickinessControl.querySelectorAll('.trickiness-segment').forEach(function (segment) {
            var selected = segment === button;
            segment.classList.toggle('selected', selected);
            segment.setAttribute('aria-pressed', String(selected));
          });
          section.classList.toggle('question-tricky', option.value === 'tricky');
          section.classList.toggle('question-super-tricky', option.value === 'super_tricky');
          if (!questionBelongsToExam(q, activeExam)) renderChapter(c, window.scrollY);
          else if (activeSearchRefresh) activeSearchRefresh();
        });
        trickinessControl.appendChild(button);
      });
      section.appendChild(trickinessControl);
      // Codul (ex. "698: ") nu se mai afișează
      renderTitle(h2, q.text.replace(/^\d+:\s*/, ''), null);
      section.appendChild(h2);
      if (q.image) {
        var fig = el('img', 'question-image');
        // Reserve the 16:9 diagram space before lazy loading to prevent scroll shifts.
        fig.width = 1672;
        fig.height = 941;
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
      sectionsByIndex[index] = section;
      main.appendChild(section);
    });
    initSearch(searchBar, c.questions);
    var targetAfterRender = null;
    if (pendingSearchResult && pendingSearchResult.chapterId === c.id) {
      var pending = pendingSearchResult;
      pendingSearchResult = null;
      targetAfterRender = sectionsByIndex[pending.index];
      if (targetAfterRender) targetAfterRender.classList.add('search-hit');
    }
    window.scrollTo(0, typeof restoreScrollY === 'number' ? restoreScrollY : 0);
    if (targetAfterRender) {
      requestAnimationFrame(function () {
        setStickyTop();
        document.documentElement.style.setProperty('--q-search-h', searchBar.offsetHeight + 'px');
        targetAfterRender.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
  }

  // Documentele se afișează în zona principală, ca orice conținut. Fiecare document este
  // un fragment încărcat la cerere (docs/fragments/<slug>.js).
  function renderDoc(d) {
    var main = document.getElementById('content');
    main.textContent = '';
    activeChapterId = null;
    main.appendChild(buildExamFilter());
    var searchBar = buildSearchBar();
    main.appendChild(searchBar);
    initSearch(searchBar);
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
    activeChapterId = null;
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

