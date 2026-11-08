// Generates index.html from components/, data/*.json and glossary/*.json.
// Usage: node tools/build.js   (no dependencies, no server needed to view the result)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const componentsDir = path.join(root, 'components');
const glossaryDir = path.join(root, 'glossary');

const chapters = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('.json'))
  .sort()
  .map(f => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')));

// Embedded as JSON; "</" is escaped so the data can never close the script tag.
const embedded = JSON.stringify(chapters).replace(/<\//g, '<\\/');

// Glosar: termeni care devin linkuri în titlurile întrebărilor și deschid un modal.
const glossary = fs.readdirSync(glossaryDir)
  .filter(f => f.endsWith('.json'))
  .sort()
  .map(f => JSON.parse(fs.readFileSync(path.join(glossaryDir, f), 'utf8')));
const glossaryEmbedded = JSON.stringify(glossary).replace(/<\//g, '<\\/');

const component = name => fs.readFileSync(path.join(componentsDir, name), 'utf8').replace(/\n$/, '');

const header = component('header.html');
const sidebar = component('sidebar.html');
const mainContent = component('main-content.html');
const menuBar = component('menu-bar.html');
const modal = component('modal.html');

// Versiune pentru ocolirea cache-ului: fiecare build schimbă adresele de CSS și JS.
const version = Date.now().toString(36);

const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Manual de pregătire – paramotor</title>
  <link rel="stylesheet" href="styles.css?v=${version}">
</head>
<body>
${header}
${menuBar}
  <div class="layout">
${sidebar}
${mainContent}
  </div>
${modal}
  <script type="application/json" id="manual-data">${embedded}</script>
  <script type="application/json" id="glossary-data">${glossaryEmbedded}</script>
  <script src="js/app.js?v=${version}"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log('index.html written, chapters:', chapters.length, 'glossary:', glossary.length, 'bytes:', html.length);
