// Generates the app shell and chapter catalog from components/, normalized question data and glossary/*.json.
// Usage: node tools/build.js   (no dependencies; preview with node tools/serve.js)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const componentsDir = path.join(root, 'components');
const glossaryDir = path.join(root, 'glossary');

const chapters = JSON.parse(fs.readFileSync(path.join(dataDir, 'chapters-meta.json'), 'utf8'));
const questions = JSON.parse(fs.readFileSync(path.join(dataDir, 'questions.json'), 'utf8'));
if (!Array.isArray(chapters) || !Array.isArray(questions)) {
  throw new Error('chapters-meta.json and questions.json must contain arrays.');
}
const chapterIds = new Set(chapters.map(chapter => chapter.id));
const questionIds = new Set();
questions.forEach(question => {
  if (!question.id || questionIds.has(question.id)) throw new Error(`Missing or duplicate question id: ${question.id}`);
  if (!chapterIds.has(question.chapter)) throw new Error(`Unknown chapter ${question.chapter} on question ${question.id}`);
  questionIds.add(question.id);
});

// The catalog contains only chapter navigation metadata; each question is a separate record in questions.json.
const chapterCatalog = chapters.map(chapter => ({ id: chapter.id, title: chapter.title }));
fs.writeFileSync(
  path.join(dataDir, 'chapters.json'),
  JSON.stringify(chapterCatalog) + '\n',
  'utf8'
);

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
  <script type="application/json" id="glossary-data">${glossaryEmbedded}</script>
  <script src="js/app.js?v=${version}" data-version="${version}"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log('index.html written, chapters:', chapters.length, 'questions:', questions.length, 'glossary:', glossary.length, 'bytes:', Buffer.byteLength(html));
