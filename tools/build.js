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
  <div class="layout">
    <aside class="sidebar">
      <nav class="topics" id="topics"></nav>
      <p class="sidebar-link"><a href="legislatie.html">Documentație ULM</a></p>
      <p class="sidebar-link"><a href="regulament-ulm.html">Regulament RACR-CCO ULM</a></p>
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
