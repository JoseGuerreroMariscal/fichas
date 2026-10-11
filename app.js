const modal = document.querySelector('#generator');
const form = document.querySelector('#generator-form');
const activity = document.querySelector('#activity');
const result = document.querySelector('#preview-result');
const labels = {
  sumas: 'Sumas', restas: 'Restas', multiplicaciones: 'Multiplicaciones',
  divisiones: 'Divisiones', problemas: 'Problemas matemáticos', lectura: 'Lectura comprensiva'
};
let lastTrigger = null;
const preferenceIds = ['level', 'difficulty', 'count', 'theme'];
const preferenceKey = 'fichalia-preferences';
const updateConfigurationSummary = () => {
  const summary = document.querySelector('#configuration-summary');
  if (summary) summary.textContent = `${document.querySelector('#level').value} · ${document.querySelector('#difficulty').value} · ${document.querySelector('#count').selectedOptions[0].textContent}`;
};
const savePreferences = () => {
  try { localStorage.setItem(preferenceKey, JSON.stringify(Object.fromEntries(preferenceIds.map(id => [id, document.querySelector(`#${id}`).value])))); } catch (error) { /* almacenamiento opcional */ }
};
try {
  const saved = JSON.parse(localStorage.getItem(preferenceKey) || '{}');
  preferenceIds.forEach(id => { if (saved[id] && document.querySelector(`#${id}`)?.querySelector(`option[value="${CSS.escape(saved[id])}"]`)) document.querySelector(`#${id}`).value = saved[id]; });
} catch (error) { /* preferencias opcionales */ }
updateConfigurationSummary();

const countSelect = document.querySelector('#count');
if (countSelect && !countSelect.querySelector('option[value="20"]')) {
  countSelect.insertAdjacentHTML('beforeend', '<option value="20">20 ejercicios</option>');
  countSelect.value = '20';
}

const openGenerator = type => {
  lastTrigger = document.querySelector(`[data-type="${type}"]`);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  activity.value = type;
  result.innerHTML = '';
  document.querySelector('#generator-title').textContent = `Prepara tu ficha de ${labels[type].toLowerCase()}`;
  document.querySelector('#activity-summary').textContent = labels[type];
  document.querySelectorAll('.activity-card').forEach(card => {
    const selected = card.dataset.type === type;
    card.classList.toggle('is-selected', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
  setTimeout(() => activity.focus(), 50);
};

document.querySelectorAll('[data-type]').forEach(card => card.addEventListener('click', () => openGenerator(card.dataset.type)));
activity.addEventListener('change', () => {
  document.querySelector('#activity-summary').textContent = labels[activity.value];
  document.querySelector('#generator-title').textContent = `Prepara tu ficha de ${labels[activity.value].toLowerCase()}`;
});
preferenceIds.forEach(id => document.querySelector(`#${id}`).addEventListener('change', () => { updateConfigurationSummary(); savePreferences(); }));
document.querySelector('#reset-options').addEventListener('click', () => {
  document.querySelector('#level').value = 'Infantil';
  document.querySelector('#difficulty').value = 'Tranquila';
  document.querySelector('#count').value = '20';
  document.querySelector('#theme').selectedIndex = 0;
  document.querySelector('#solutions').checked = false;
  updateConfigurationSummary();
  savePreferences();
});
document.querySelector('.modal-close').addEventListener('click', () => {
  closeGenerator();
});
modal.addEventListener('click', event => {
  if (event.target === modal) closeGenerator();
});
modal.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || !modal.classList.contains('open')) return;
  const focusable = [...modal.querySelectorAll('button, select, input, [href], [tabindex]:not([tabindex="-1"])')].filter(element => !element.disabled);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
function closeGenerator() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  lastTrigger?.focus();
}
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeGenerator(); });

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeOperation(type, difficulty) {
  const max = difficulty === 'Tranquila' ? 20 : difficulty === 'Estándar' ? 99 : 999;
  let a = randomInt(1, max), b = randomInt(1, max);
  if (type === 'restas' && b > a) [a, b] = [b, a];
  if (type === 'divisiones') {
    b = randomInt(2, difficulty === 'Tranquila' ? 5 : 12);
    const q = randomInt(1, difficulty === 'Tranquila' ? 10 : 30);
    a = b * q;
    return { question: `${a} ÷ ${b} =`, answer: q };
  }
  const symbols = { sumas: '+', restas: '−', multiplicaciones: '×' };
  const answer = type === 'sumas' ? a + b : type === 'restas' ? a - b : a * b;
  return { question: `${a} ${symbols[type]} ${b} =`, answer };
}

function makeContent(type, count, difficulty) {
  if (['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(type)) {
    return Array.from({ length: count }, () => makeOperation(type, difficulty));
  }
  if (type === 'lectura') return [{
    kind: 'reading',
    title: 'La caja de semillas',
    text: 'El sábado, Nora ayudó a su abuelo a preparar el huerto. Juntos llenaron tres macetas con tierra y plantaron semillas de tomate. Después, Nora regó las plantas y colocó las macetas cerca de la ventana para que recibieran luz. Antes de terminar, escribió la fecha en una etiqueta para recordar cuándo las había plantado.',
    questions: ['¿Con quién preparó Nora el huerto?', '¿Qué semillas plantaron?', '¿Dónde colocaron las macetas?', '¿Para qué escribió Nora la fecha?'],
    answers: ['Con su abuelo.', 'Semillas de tomate.', 'Cerca de la ventana.', 'Para recordar cuándo las había plantado.']
  }];
  const people = ['Lucía', 'Mario', 'Sara', 'Leo', 'Amina'];
  const objects = ['pegatinas', 'lápices', 'canicas', 'cromos', 'libros'];
  return Array.from({ length: count }, (_, i) => {
    const first = i + 2;
    const second = i + 3;
    const person = people[i % people.length];
    const object = objects[i % objects.length];
    return { question: `${person} tiene ${first} cajas con ${second} ${object} en cada una. ¿Cuántos ${object} tiene en total?`, answer: first * second };
  });
}

function exerciseMarkup(config, item, index, solutions) {
  if (item.kind === 'reading') {
    const questions = item.questions.map((question, questionIndex) => `<div class="reading-question"><span>${questionIndex + 1}.</span><strong>${question}</strong>${solutions ? `<b>${item.answers[questionIndex]}</b>` : '<i aria-label="espacio para responder"></i>'}</div>`).join('');
    return `<article class="reading-sheet"><h3>${item.title}</h3><p class="reading-text">${item.text}</p><h4>Responde a las preguntas</h4>${questions}</article>`;
  }
  const arithmetic = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  if (arithmetic) {
    const match = item.question.match(/^(\d+)\s+([+−×÷])\s+(\d+)\s*=/);
    if (match) return `<div class="print-row arithmetic"><span class="number">${index + 1}.</span><div class="operation"><div class="top-number">${match[1]}</div><div class="bottom-number"><span>${match[2]}</span><span>${match[3]}</span></div><div class="operation-rule"></div>${solutions ? `<div class="solution">${item.answer}</div>` : '<div class="answer-space"></div>'}</div></div>`;
  }
  return `<div class="print-row text-exercise"><span class="number">${index + 1}.</span><strong>${item.question}</strong>${solutions ? `<b>${item.answer}</b>` : '<i aria-label="espacio para responder"></i>'}</div>`;
}

function printableHtml(config, items, solutions) {
  const name = config.student || '________________________';
  const title = labels[config.type];
  const arithmetic = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  const rows = items.map((item, index) => exerciseMarkup(config, item, index, solutions)).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · FichasFácil</title><style>
*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#20283f;margin:0;padding:20mm 15mm;max-width:210mm;min-height:297mm}h1{text-align:center;font-size:28px;margin:0 0 14px;color:#20283f}h2{text-align:center;font-size:14px;font-weight:normal;margin:0 0 18px;color:#697772}.worksheet-header{display:flex;justify-content:space-between;gap:30px;border-bottom:1.5px solid #20283f;padding-bottom:11px;margin-bottom:24px;font-size:13px;font-weight:700}.worksheet-header span{display:inline-block;min-width:145px;border-bottom:1px solid #20283f;margin-left:6px;height:16px}.exercise-grid{display:grid;gap:15px 20px}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.text-grid{grid-template-columns:1fr}.print-row{break-inside:avoid}.arithmetic{display:flex;align-items:flex-start;gap:5px;min-height:102px;padding:4px 2px}.print-row .number{font-size:11px;color:#6b7486;padding-top:3px}.operation{width:100%;font-size:22px;font-weight:700;line-height:1.05}.top-number{text-align:right;padding-right:5px;letter-spacing:5px;min-height:28px}.bottom-number{display:grid;grid-template-columns:1fr auto;gap:6px;text-align:right;padding-right:5px}.bottom-number span:first-child{text-align:left;font-weight:400}.operation-rule{border-bottom:1.5px solid #20283f;margin-top:4px}.answer-space{height:28px;border-bottom:1px solid #7f8998}.solution{font-size:20px;text-align:right;color:#ef8e69;padding:6px 5px 0}.text-exercise{display:grid;grid-template-columns:25px 1fr;grid-template-rows:auto 25px;align-items:end;gap:5px 7px;min-height:78px;padding:8px 4px;border-bottom:1px solid #e4ebe5}.text-exercise strong{font-size:19px;line-height:1.25}.text-exercise i{display:block;border-bottom:1.5px solid #82958b;height:22px}.text-exercise b{font-size:20px;color:#ef8e69;grid-column:2}.foot{position:fixed;bottom:8mm;font-size:10px;color:#89958f}@media print{body{padding:13mm 12mm}.exercise-grid{gap:13px 18px}}@media(max-width:650px){body{padding:18px 14px;max-width:none;min-height:0;overflow-x:hidden}h1{font-size:24px}.worksheet-header{font-size:11px;gap:12px}.worksheet-header span{min-width:90px}.math-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}.arithmetic{min-height:105px}.operation{font-size:22px}}</style></head><body><h1>${title}</h1><h2>Una ficha para aprender con confianza · ${config.level}</h2><div class="worksheet-header"><div>Nombre:<span>${name}</span></div><div>Fecha:<span></span></div></div><div class="exercise-grid ${arithmetic ? 'math-grid' : 'text-grid'}">${rows}</div><div class="foot">FichasFácil · fichas que hacen sitio a la curiosidad</div></body></html>`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  const config = { type: activity.value, level: document.querySelector('#level').value, difficulty: document.querySelector('#difficulty').value, count: Number(document.querySelector('#count').value), student: document.querySelector('#student').value.trim(), theme: document.querySelector('#theme').value, solutions: document.querySelector('#solutions')?.checked };
  const items = makeContent(config.type, config.count, config.difficulty);
  const simpleMath = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  const textStyles = '.text-exercise i{grid-column:2;width:100%}.text-exercise strong{font-size:17px;line-height:1.35}.reading-sheet{max-width:180mm;margin:0 auto}.reading-sheet h3{font-size:24px;margin:0 0 14px}.reading-text{font-size:16px;line-height:1.55;margin:0 0 20px}.reading-sheet h4{font-size:14px;margin:0 0 10px}.reading-question{display:grid;grid-template-columns:22px 1fr;gap:5px 7px;min-height:53px;align-items:start;margin-bottom:7px}.reading-question span{font-weight:700}.reading-question strong{font-size:15px;line-height:1.35}.reading-question i{grid-column:2;height:25px;border-bottom:1px solid #82958b}.reading-question b{grid-column:2;color:#275fac}';
  const preparePrint = html => html
    .replace('<style>', `<style>@page{size:A4;margin:0}${simpleMath ? '.worksheet-header,h1,h2,.foot{display:none!important}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:34px 24px}.arithmetic{min-height:108px;justify-content:center;padding:0}.print-row .number{display:none}.operation{width:fit-content;min-width:58px}.top-number,.bottom-number{padding-right:0}.operation-rule{margin-top:5px}.answer-space{height:30px}' : textStyles}`)
    .replaceAll('@media(max-width:650px)', '@media screen and (max-width:650px)');
  const worksheet = preparePrint(printableHtml(config, items, false));
  const answerSheet = preparePrint(printableHtml(config, items, true));
  const print = html => { const win = window.open('', '_blank'); if (!win) return false; win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 250); return true; };
  const printed = print(worksheet);
  setTimeout(() => { submitButton.disabled = false; }, 500);
  result.innerHTML = `<div class="success-box"><strong>La ficha está lista</strong><span class="print-hint">${printed ? 'Se ha abierto la ventana de impresión.' : 'Permite las ventanas emergentes para imprimir la ficha.'}</span>${labels[config.type]} · ${config.count} ejercicios<div class="download-actions"><button id="print-sheet">Imprimir de nuevo</button>${config.solutions ? '<button id="print-solutions">Imprimir soluciones</button>' : ''}<button id="new-sheet">Crear otra</button></div></div>`;
  document.querySelector('#print-sheet').onclick = () => print(worksheet);
  document.querySelector('#print-solutions')?.addEventListener('click', () => print(answerSheet));
  document.querySelector('#new-sheet').onclick = () => { result.innerHTML = ''; document.querySelector('#student').focus(); };
});
