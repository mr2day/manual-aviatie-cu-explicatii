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
      <a class="brand-box" href="index.html">
        <span class="brand-top">PARAMOTOR</span>
        <span class="brand-bottom">ARTISAN</span>
      </a>
      <p class="brand-tagline">Manual de pregătire pentru examenul teoretic</p>
    </div>
  </header>
  <div class="layout">
    <aside class="sidebar">
      <nav class="topics" id="topics"></nav>
      <div class="extra-links">
        <a class="link-card" href="legislatie.html">Documentație ULM</a>
        <a class="link-card" href="regulament-ulm.html">Regulament RACR-CCO ULM</a>
      </div>
    </aside>
    <main class="content" id="content"></main>
  </div>
  <script type="application/json" id="manual-data">${embedded}</script>
  <script src="js/app.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log('index.html written, chapters:', chapters.length, 'bytes:', html.length);
