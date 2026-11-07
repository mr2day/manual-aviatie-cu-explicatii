// Generates index.html: one page, data embedded from data/*.json.
// Usage: node tools/build.js   (no dependencies, no server needed to view the result)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');

const chapters = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('.json'))
  .sort()
  .map(f => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')));

// Embedded as JSON; "</" is escaped so the data can never close the script tag.
const embedded = JSON.stringify(chapters).replace(/<\//g, '<\\/');

const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Manual de pregătire – paramotor</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="brand"><strong>SKY</strong><span>TRANSYLVANIA</span></div>
    </div>
  </header>
  <div class="layout">
    <aside class="sidebar">
      <nav class="topics" id="topics"></nav>
      <p class="sidebar-link"><a href="legislatie.html">Documentație ULM</a></p>
    </aside>
    <main class="content" id="content"></main>
  </div>
  <script type="application/json" id="manual-data">${embedded}</script>
  <script>
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

    // Long explanations: paragraphs separated by blank lines, line breaks kept.
    function fillParagraphs(container, text) {
      String(text || '').split(/\\n\\s*\\n/).forEach(function (para) {
        if (!para.trim()) return;
        var p = el('p');
        var lines = para.split('\\n');
        lines.forEach(function (line, i) {
          if (i > 0) p.appendChild(document.createElement('br'));
          p.appendChild(document.createTextNode(line));
        });
        container.appendChild(p);
      });
    }

    function more(label, longText) {
      var d = el('details', 'more');
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
        nav.appendChild(a);
      });
    }

    function renderChapter(c) {
      var main = document.getElementById('content');
      main.textContent = '';
      main.appendChild(el('h1', 'sr-only', c.title));

      c.questions.forEach(function (q) {
        var section = el('section', 'question');
        var h2 = el('h2', 'question-title');
        h2.appendChild(el('span', 'question-number', q.number + '. '));
        h2.appendChild(document.createTextNode(q.text));
        section.appendChild(h2);
        section.appendChild(el('p', 'question-short', q.short));
        section.appendChild(more('Explicație detaliată', q.long));

        var ol = el('ol', 'answers');
        q.answers.forEach(function (a, k) {
          var li = el('li', 'answer' + (a.correct ? ' correct' : ''));
          li.appendChild(el('span', 'letter', 'ABCD'.charAt(k)));
          var body = el('div', 'answer-body');
          body.appendChild(el('span', 'answer-text', a.text));
          if (a.short) body.appendChild(el('p', 'answer-short', a.short));
          if (a.long) body.appendChild(more('Detalii', a.long));
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
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log('index.html written, chapters:', chapters.length, 'bytes:', html.length);
