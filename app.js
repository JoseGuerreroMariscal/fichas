const modal = document.querySelector('#generator');
const form = document.querySelector('#generator-form');
const activity = document.querySelector('#activity');
const result = document.querySelector('#preview-result');
const labels = {
  sumas: 'Sumas', restas: 'Restas', multiplicaciones: 'Multiplicaciones',
  divisiones: 'Divisiones', problemas: 'Problemas matemáticos', lectura: 'Lectura comprensiva', copiado: 'Copiado'
};
const activityDescriptions = {
  sumas: 'Practica sumas colocadas en columna.',
  restas: 'Practica restas colocadas en columna.',
  multiplicaciones: 'Practica multiplicaciones paso a paso.',
  divisiones: 'Resuelve divisiones exactas.',
  problemas: 'Lee, piensa y resuelve situaciones cotidianas.',
  lectura: 'Lee un texto breve y responde preguntas.',
  copiado: 'Copia un texto breve siguiendo una pauta de escritura.'
};
let lastTrigger = null;
const pageBackground = [document.querySelector('.site-header'), document.querySelector('main'), document.querySelector('.site-footer')].filter(Boolean);
const preferenceIds = ['difficulty', 'count', 'operands', 'firstDigits', 'secondDigits', 'paragraphs'];
const preferenceKey = 'fichalia-preferences';
let installPrompt = null;
let sharedActivity = '';
let sharedSolutions = false;
const installButton = document.querySelector('#install-app');
const setSelectValue = (id, value) => {
  const select = document.querySelector(`#${id}`);
  if (!select || ![...select.options].some(option => option.value === value)) return false;
  select.value = value;
  return true;
};
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = false;
});
installButton?.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => { if (installButton) installButton.hidden = true; });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
const updateConfigurationSummary = () => {
  const summary = document.querySelector('#configuration-summary');
  if (summary) {
    const first = document.querySelector('#firstDigits').value;
    const second = document.querySelector('#secondDigits').value;
    const isMath = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(activity.value);
    const digits = isMath ? (first === 'auto' && second === 'auto' ? 'Según la dificultad' : `${first === 'auto' ? 'dificultad' : `${first} cifras`} / ${second === 'auto' ? 'dificultad' : `${second} cifras`}`) : '';
    const countSummary = ['lectura', 'copiado'].includes(activity.value) ? '' : ` · ${document.querySelector('#count').selectedOptions[0].textContent}`;
    const paragraphSummary = activity.value === 'copiado' ? ` · ${document.querySelector('#paragraphs').selectedOptions[0].textContent}` : '';
    summary.textContent = `${document.querySelector('#difficulty').value}${countSummary}${digits ? ` · ${digits}` : ''}${paragraphSummary}`;
  }
};
const updateDigitLabels = () => {
  const names = { multiplicaciones: ['Multiplicando', 'Multiplicador'], divisiones: ['Dividendo', 'Divisor'] }[activity.value] || ['Primer número', 'Segundo número'];
  document.querySelector('#first-digits-label').textContent = names[0];
  document.querySelector('#second-digits-label').textContent = names[1];
};
const updateActivityFields = () => {
  const isMath = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(activity.value);
  const isCopying = activity.value === 'copiado';
  const isReading = activity.value === 'lectura';
  ['operands-field', 'first-digits-field', 'second-digits-field'].forEach(id => document.querySelector(`#${id}`).classList.toggle('hidden-field', !isMath));
  document.querySelector('#count-field').classList.toggle('hidden-field', isReading || isCopying);
  document.querySelector('#paragraphs-field').classList.toggle('hidden-field', !isCopying);
  document.querySelector('#solutions-field').classList.toggle('hidden-field', isCopying);
};
const savePreferences = () => {
  try { localStorage.setItem(preferenceKey, JSON.stringify(Object.fromEntries(preferenceIds.map(id => [id, document.querySelector(`#${id}`).value])))); } catch (error) { /* almacenamiento opcional */ }
};
try {
  const saved = JSON.parse(localStorage.getItem(preferenceKey) || '{}');
  preferenceIds.forEach(id => { if (saved[id]) setSelectValue(id, saved[id]); });
} catch (error) { /* preferencias opcionales */ }
try {
  const shared = new URLSearchParams(window.location.search);
  sharedActivity = shared.get('actividad') || '';
  if (sharedActivity && labels[sharedActivity]) activity.value = sharedActivity;
  sharedSolutions = shared.get('soluciones') === '1';
  if (sharedSolutions) document.querySelector('#solutions').checked = true;
  preferenceIds.forEach(id => {
    const parameter = id === 'difficulty' ? 'dificultad' : id === 'count' ? 'ejercicios' : id === 'operands' ? 'numeros' : id === 'firstDigits' ? 'cifras1' : id === 'secondDigits' ? 'cifras2' : 'parrafos';
    const value = shared.get(parameter);
    if (value) setSelectValue(id, value);
  });
} catch (error) { /* enlaces compartidos opcionales */ }
updateConfigurationSummary();
updateDigitLabels();
updateActivityFields();

const countSelect = document.querySelector('#count');
if (countSelect && !countSelect.querySelector('option[value="20"]')) {
  countSelect.insertAdjacentHTML('beforeend', '<option value="20">20 ejercicios</option>');
  countSelect.value = '20';
}

const openGenerator = type => {
  lastTrigger = document.querySelector(`[data-type="${type}"]`);
  document.querySelectorAll('[data-type]').forEach(card => card.setAttribute('aria-expanded', String(card === lastTrigger)));
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  pageBackground.forEach(element => { element.inert = true; element.setAttribute('aria-hidden', 'true'); });
  activity.value = type;
  result.innerHTML = '';
  document.querySelector('#generator-title').textContent = `Prepara tu ficha de ${labels[type].toLowerCase()}`;
  document.querySelector('#activity-summary').textContent = labels[type];
  document.querySelector('#modal-note').textContent = activityDescriptions[type];
  updateDigitLabels();
  updateConfigurationSummary();
  updateActivityFields();
  if (sharedSolutions) document.querySelector('#solutions').checked = true;
  document.querySelectorAll('.activity-card').forEach(card => {
    const selected = card.dataset.type === type;
    card.classList.toggle('is-selected', selected);
  });
  setTimeout(() => activity.focus(), 50);
};

document.querySelectorAll('[data-type]').forEach(card => card.addEventListener('click', () => openGenerator(card.dataset.type)));
if (sharedActivity && labels[sharedActivity]) setTimeout(() => openGenerator(sharedActivity), 0);
activity.addEventListener('change', () => {
  document.querySelector('#activity-summary').textContent = labels[activity.value];
  document.querySelector('#generator-title').textContent = `Prepara tu ficha de ${labels[activity.value].toLowerCase()}`;
  document.querySelector('#modal-note').textContent = activityDescriptions[activity.value];
  updateDigitLabels();
  updateConfigurationSummary();
  updateActivityFields();
});
preferenceIds.forEach(id => document.querySelector(`#${id}`).addEventListener('change', () => { updateConfigurationSummary(); savePreferences(); }));
document.querySelector('#reset-options').addEventListener('click', () => {
  document.querySelector('#difficulty').value = 'Inicial';
  document.querySelector('#count').value = '20';
  document.querySelector('#operands').value = '2';
  document.querySelector('#firstDigits').value = 'auto';
  document.querySelector('#secondDigits').value = 'auto';
  document.querySelector('#paragraphs').value = '1';
  document.querySelector('#student').value = '';
  document.querySelector('#solutions').checked = false;
  result.innerHTML = '';
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
  pageBackground.forEach(element => { element.inert = false; element.removeAttribute('aria-hidden'); });
  document.querySelectorAll('[data-type]').forEach(card => card.setAttribute('aria-expanded', 'false'));
  lastTrigger?.focus();
}
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeGenerator(); });

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function levelIndex(level) {
  if (level === 'Infantil') return 0;
  const match = level.match(/([1-6])/);
  return match ? Number(match[1]) : 0;
}

function difficultyIndex(difficulty) {
  if (difficulty === 'Inicial' || difficulty === 'Tranquila') return 1;
  if (difficulty === 'Medio' || difficulty === 'Estándar') return 3;
  return 5;
}

function rangeForDigits(digits, fallback, minimum = 1) {
  if (digits === 'auto') return fallback;
  const size = Number(digits);
  return [size === 1 ? minimum : 10 ** (size - 1), 10 ** size - 1];
}

function makeOperation(type, difficulty, level = '', operands = 2, firstDigits = 'auto', secondDigits = 'auto') {
  const grade = level ? levelIndex(level) : difficultyIndex(difficulty);
  if (type === 'multiplicaciones') {
    const rangesByGrade = [[1, 9, 2, 5], [1, 20, 2, 5], [10, 99, 2, 9], [100, 999, 2, 9], [1000, 9999, 2, 9], [1000, 99999, 2, 12], [10000, 999999, 10, 99]];
    const ranges = [...(rangesByGrade[grade] || rangesByGrade[1])];
    if ((difficulty === 'Avanzado' || difficulty === 'Un poquito más') && grade < 6) { ranges[0] *= 10; ranges[1] *= 10; }
    const firstRange = rangeForDigits(firstDigits, ranges.slice(0, 2));
    const secondRange = rangeForDigits(secondDigits, ranges.slice(2, 4), 2);
    const a = randomInt(firstRange[0], firstRange[1]);
    const b = randomInt(secondRange[0], secondRange[1]);
    return { question: `${a} × ${b} =`, answer: a * b };
  }
  const rangesByGrade = [[1, 9], [1, 20], [10, 99], [10, 999], [100, 9999], [1000, 99999], [10000, 999999]];
  const range = rangesByGrade[grade] || rangesByGrade[1];
  let [minimum, maximum] = range;
  if ((difficulty === 'Avanzado' || difficulty === 'Un poquito más') && grade < 6) { minimum *= 10; maximum *= 10; }
  if (type === 'divisiones') {
    const dividendRange = rangeForDigits(firstDigits, [minimum, maximum]);
    const divisorRange = rangeForDigits(secondDigits, [2, grade >= 5 ? 12 : 9], 2);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const divisor = randomInt(divisorRange[0], divisorRange[1]);
      const minQuotient = Math.ceil(dividendRange[0] / divisor);
      const maxQuotient = Math.floor(dividendRange[1] / divisor);
      if (minQuotient <= maxQuotient) {
        const quotient = randomInt(Math.max(1, minQuotient), Math.max(1, maxQuotient));
        return { question: `${divisor * quotient} ÷ ${divisor} =`, answer: quotient };
      }
    }
    const fallbackDivisor = Math.max(2, Math.min(divisorRange[0], Math.floor(dividendRange[1] / 2)));
    const fallbackQuotient = Math.max(1, Math.floor(dividendRange[1] / fallbackDivisor));
    return { question: `${fallbackDivisor * fallbackQuotient} ÷ ${fallbackDivisor} =`, answer: fallbackQuotient };
  }
  let a = randomInt(minimum, maximum), b = randomInt(minimum, maximum);
  if (operands === 3 && ['sumas', 'restas'].includes(type)) {
    let c = randomInt(minimum, maximum);
    if (type === 'restas') [a, b, c] = [a, b, c].sort((first, second) => second - first);
    const symbol = type === 'sumas' ? '+' : '−';
    const answer = type === 'sumas' ? a + b + c : a - b - c;
    return { question: `${a} ${symbol} ${b} ${symbol} ${c} =`, answer };
  }
  if (type === 'restas' && b > a) [a, b] = [b, a];
  const symbols = { sumas: '+', restas: '−', multiplicaciones: '×' };
  const answer = type === 'sumas' ? a + b : type === 'restas' ? a - b : a * b;
  return { question: `${a} ${symbols[type]} ${b} =`, answer };
}

function makeContent(type, count, difficulty, level, operands, firstDigits, secondDigits, paragraphs = 1) {
  if (['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(type)) {
    return Array.from({ length: count }, () => makeOperation(type, difficulty, level, operands, firstDigits, secondDigits));
  }
  if (type === 'lectura') return [{
    kind: 'reading',
    title: 'La caja de semillas',
    text: 'El sábado, Nora ayudó a su abuelo a preparar el huerto. Juntos llenaron tres macetas con tierra y plantaron semillas de tomate. Después, Nora regó las plantas y colocó las macetas cerca de la ventana para que recibieran luz. Antes de terminar, escribió la fecha en una etiqueta para recordar cuándo las había plantado.',
    questions: ['¿Con quién preparó Nora el huerto?', '¿Qué semillas plantaron?', '¿Dónde colocaron las macetas?', '¿Para qué escribió Nora la fecha?'],
    answers: ['Con su abuelo.', 'Semillas de tomate.', 'Cerca de la ventana.', 'Para recordar cuándo las había plantado.']
  }];
  if (type === 'copiado') {
    const texts = [
      'Cada día aprendemos algo nuevo cuando observamos, escuchamos y practicamos con calma.',
      'El jardín estaba lleno de colores y los pájaros cantaban entre las ramas de los árboles.',
      'Antes de comenzar una tarea, preparo el material y leo las instrucciones con atención.',
      'La biblioteca es un lugar tranquilo donde podemos descubrir historias y conocer otros mundos.',
      'Cuando escribo despacio, cuido el tamaño de las letras y dejo espacios entre las palabras.'
    ];
    return Array.from({ length: paragraphs }, (_, index) => ({ kind: 'copying', title: `Párrafo ${index + 1}`, text: texts[index % texts.length] }));
  }
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

const digitMarkup = value => `<span class="digit-value">${String(value).split('').map(digit => `<b>${digit}</b>`).join('')}</span>`;

function exerciseMarkup(config, item, index, solutions) {
  if (item.kind === 'copying') return `<article class="copying-sheet"><h3>${item.title}</h3><p class="copying-text">${item.text}</p><div class="lamela-guide" aria-label="Pauta para copiar el texto">${Array.from({ length: 6 }, () => '<span aria-hidden="true"></span>').join('')}</div></article>`;
  if (item.kind === 'reading') {
    const questions = item.questions.map((question, questionIndex) => `<div class="reading-question"><span>${questionIndex + 1}.</span><strong>${question}</strong>${solutions ? `<b>${item.answers[questionIndex]}</b>` : '<i aria-label="espacio para responder"></i>'}</div>`).join('');
    return `<article class="reading-sheet"><h3>${item.title}</h3><p class="reading-text">${item.text}</p><h4>Responde a las preguntas</h4>${questions}</article>`;
  }
  const arithmetic = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  if (arithmetic) {
    const threeTermMatch = item.question.match(/^(\d+)\s+([+−])\s+(\d+)\s+([+−])\s+(\d+)\s*=/);
    if (threeTermMatch) return `<div class="print-row arithmetic arithmetic-three"><span class="number">${index + 1}.</span><div class="operation"><div class="top-number">${digitMarkup(threeTermMatch[1])}</div><div class="extra-number"><span class="operator">${threeTermMatch[2]}</span>${digitMarkup(threeTermMatch[3])}</div><div class="bottom-number"><span class="operator">${threeTermMatch[4]}</span>${digitMarkup(threeTermMatch[5])}</div><div class="operation-rule"></div>${solutions ? `<div class="solution">${item.answer}</div>` : '<div class="answer-space"></div>'}</div></div>`;
    const match = item.question.match(/^(\d+)\s+([+−×÷])\s+(\d+)\s*=/);
    if (match) return `<div class="print-row arithmetic"><span class="number">${index + 1}.</span><div class="operation"><div class="top-number">${digitMarkup(match[1])}</div><div class="bottom-number"><span class="operator">${match[2]}</span>${digitMarkup(match[3])}</div><div class="operation-rule"></div>${solutions ? `<div class="solution">${item.answer}</div>` : '<div class="answer-space"></div>'}</div></div>`;
  }
  return `<div class="print-row text-exercise"><span class="number">${index + 1}.</span><strong>${item.question}</strong>${solutions ? `<b>${item.answer}</b>` : '<i aria-label="espacio para responder"></i>'}</div>`;
}

function printableHtml(config, items, solutions) {
  const name = config.student.trim();
  const title = labels[config.type];
  const arithmetic = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  const rows = items.map((item, index) => exerciseMarkup(config, item, index, solutions)).join('');
  const worksheetHeader = `<div class="worksheet-header"><div>Nombre:<span>${name ? escapeHtml(name) : ''}</span></div><div>Nivel: <strong>${escapeHtml(config.difficulty)}</strong></div><div>Fecha:<span></span></div></div>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'; style-src 'unsafe-inline'"><title>${escapeHtml(title)} · FichasFácil</title><style>
*{box-sizing:border-box}html{background:#fff}body{font-family:ui-rounded,'Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif;color:#20283f;margin:0;padding:20mm 15mm;width:210mm;min-height:297mm;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1{text-align:center;font-size:28px;margin:0 0 14px;color:#20283f}h2{text-align:center;font-size:14px;font-weight:normal;margin:0 0 18px;color:#697772}.worksheet-header{display:flex;justify-content:flex-start;gap:30px;border-bottom:1.5px solid #20283f;padding-bottom:11px;margin-bottom:24px;font-size:13px;font-weight:700}.worksheet-header span{display:inline-block;min-width:145px;border-bottom:1px solid #20283f;margin-left:6px;height:16px}.exercise-grid{display:grid;gap:15px 20px}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.text-grid{grid-template-columns:1fr}.print-row{break-inside:avoid;page-break-inside:avoid}.arithmetic{display:flex;align-items:flex-start;gap:5px;min-height:102px;padding:4px 2px}.print-row .number{font-size:11px;color:#6b7486;padding-top:3px}.operation{width:100%;font-size:22px;font-weight:700;line-height:1.05}.top-number,.extra-number{text-align:right;padding-right:5px;letter-spacing:5px;min-height:28px}.bottom-number{display:grid;grid-template-columns:1fr auto;gap:6px;text-align:right;padding-right:5px}.bottom-number span:first-child{text-align:left;font-weight:400}.operation-rule{border-bottom:1.5px solid #20283f;margin-top:4px}.answer-space{height:28px;border-bottom:1px solid #7f8998}.solution{font-size:20px;text-align:right;color:#ef8e69;padding:6px 5px 0}.text-exercise{display:grid;grid-template-columns:25px 1fr;grid-template-rows:auto 25px;align-items:end;gap:5px 7px;min-height:78px;padding:8px 4px;border-bottom:1px solid #e4ebe5}.text-exercise strong{font-size:19px;line-height:1.25}.text-exercise i{display:block;border-bottom:1.5px solid #82958b;height:22px}.text-exercise b{font-size:20px;color:#ef8e69;grid-column:2}.foot{position:fixed;bottom:8mm;font-size:10px;color:#89958f}@page{size:A4;margin:0}@media print{body{padding:13mm 12mm}.exercise-grid{gap:13px 18px}}@media(max-width:650px){body{padding:18px 14px;max-width:none;min-height:0;overflow-x:hidden}h1{font-size:24px}.worksheet-header{font-size:11px;gap:12px}.worksheet-header span{min-width:90px}.math-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}.arithmetic{min-height:105px}.operation{font-size:22px}}</style></head><body><h1>${title}</h1>${worksheetHeader}<div class="exercise-grid ${arithmetic ? 'math-grid' : 'text-grid'}">${rows}</div></body></html>`;
}

const readConfig = () => ({ type: activity.value, level: '', difficulty: document.querySelector('#difficulty').value, count: Number(document.querySelector('#count').value), operands: Number(document.querySelector('#operands').value), firstDigits: document.querySelector('#firstDigits').value, secondDigits: document.querySelector('#secondDigits').value, paragraphs: Number(document.querySelector('#paragraphs').value), student: document.querySelector('#student').value.trim(), solutions: document.querySelector('#solutions')?.checked });

const shareUrl = config => {
  const url = new URL(window.location.href);
  url.hash = 'actividades';
  url.search = new URLSearchParams({ actividad: config.type, dificultad: config.difficulty, ejercicios: String(config.count), numeros: String(config.operands), cifras1: config.firstDigits, cifras2: config.secondDigits, parrafos: String(config.paragraphs), ...(config.solutions ? { soluciones: '1' } : {}) }).toString();
  return url.toString();
};

function createSheets(config) {
  const items = makeContent(config.type, config.count, config.difficulty, config.level, config.operands, config.firstDigits, config.secondDigits, config.paragraphs);
  const simpleMath = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  const textStyles = '.text-exercise i{grid-column:2;width:100%}.text-exercise strong{font-size:17px;line-height:1.35}.reading-sheet{max-width:180mm;margin:0 auto}.reading-sheet h3{font-size:24px;margin:0 0 14px}.reading-text{font-size:16px;line-height:1.55;margin:0 0 20px}.reading-sheet h4{font-size:14px;margin:0 0 10px}.reading-question{display:grid;grid-template-columns:22px 1fr;gap:5px 7px;min-height:53px;align-items:start;margin-bottom:7px}.reading-question span{font-weight:700}.reading-question strong{font-size:15px;line-height:1.35}.reading-question i{grid-column:2;height:25px;border-bottom:1px solid #82958b}.reading-question b{grid-column:2;color:#275fac}.copying-sheet{break-inside:avoid;margin:0 auto 16mm;max-width:180mm}.copying-sheet h3{font-size:14px;margin:0 0 8px;color:#697772}.copying-text{font-size:17px;line-height:1.45;margin:0 0 9mm}.lamela-guide{height:55mm;border-top:1px solid #9aaabd}.lamela-guide span{display:block;height:9mm;border-bottom:1px solid #9aaabd}.lamela-guide span:nth-child(3n){border-bottom-color:#d2dce7}';
  const printPolish = '<style>html,body{width:210mm!important;min-width:210mm!important;max-width:210mm!important}body{font-family:ui-rounded,"Arial Rounded MT Bold","Trebuchet MS",Arial,sans-serif!important;color:#20283f!important;background:#fff!important;padding:13mm 12mm!important;overflow:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}h1{text-align:center!important;font-size:15px!important;font-weight:700!important;line-height:1.2!important;color:#20283f!important;margin:0 0 19px!important}.worksheet-header{display:flex!important;justify-content:space-between!important;gap:20px!important;margin-bottom:24px!important;padding:0 8px!important;border:0!important;font-size:10px!important;font-weight:700!important}.worksheet-header>div:first-child{flex:1}.worksheet-header>div:last-child{min-width:72px}.worksheet-header span{min-width:100px;height:13px}.worksheet-header>div:last-child span{min-width:62px}.math-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:repeat(5,minmax(0,1fr))!important;gap:0 22px!important;min-height:246mm!important;padding:0 2mm!important}.math-grid .arithmetic{width:100%!important;min-height:0!important;justify-content:center!important;align-items:center!important;padding:0!important}.math-grid .operation{display:block!important;flex:0 0 116px!important;width:116px!important;min-width:116px!important;max-width:116px!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important;font-size:17px!important;line-height:1.15!important}.math-grid .digit-value{display:inline-flex!important;gap:3px!important;letter-spacing:0!important}.math-grid .digit-value b{letter-spacing:0!important}.math-grid .top-number,.math-grid .extra-number{padding-right:0!important;letter-spacing:0!important;min-height:23px!important;white-space:nowrap!important}.math-grid .bottom-number{grid-template-columns:18px 1fr!important;gap:0!important;padding-right:0!important;letter-spacing:0!important;line-height:1.15!important;white-space:nowrap!important}.math-grid .bottom-number .operator{text-align:center!important;letter-spacing:0!important}.math-grid .bottom-number .digit-value{justify-self:end!important}.math-grid .operation-rule{display:block!important;width:116px!important;max-width:116px!important;margin-top:5px!important}.math-grid .answer-space{display:none!important}@media print{h1{letter-spacing:-.02em}.worksheet-header{break-inside:avoid;page-break-inside:avoid}.text-exercise,.reading-question{break-inside:avoid;page-break-inside:avoid}.reading-sheet{break-inside:avoid;page-break-inside:avoid}.copying-sheet{break-inside:avoid;page-break-inside:avoid}p,h1,h2,h3,h4{orphans:3;widows:3}}</style>';
  const screenLayout = '<style>body{width:210mm!important;min-width:210mm!important;max-width:210mm!important;padding:13mm 12mm!important;overflow:visible!important}.worksheet-header{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:18px!important}.worksheet-header>div:first-child{flex:1}.worksheet-header>div{white-space:nowrap!important}.worksheet-header strong{color:#315c9b!important}.math-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:repeat(5,minmax(0,1fr))!important;gap:0 22px!important;min-height:246mm!important;align-items:center!important}.math-grid .arithmetic{min-height:0!important;justify-content:center!important}.math-grid .operation{display:block!important;flex:0 0 116px!important;width:116px!important;min-width:116px!important;max-width:116px!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important;font-size:17px!important;line-height:1.15!important}.math-grid .extra-number{display:grid!important;grid-template-columns:18px 1fr!important;gap:0!important;white-space:nowrap!important}.math-grid .extra-number .operator{text-align:center!important}.math-grid .extra-number .digit-value{justify-self:end!important}.math-grid .print-row .number{display:none!important}.math-grid .answer-space{display:block!important;height:20px!important;border-bottom:1px solid #9aaabd!important}@media(max-width:650px){body{padding:18px 14px!important}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0 22px!important}}</style>';
  const preparePrint = html => html
    .replace('<style>', `<style>@page{size:A4;margin:0}${simpleMath ? 'h1{display:block!important;font-size:15px;letter-spacing:0;margin:0 0 19px}.worksheet-header{display:flex!important;justify-content:space-between;gap:20px;margin-bottom:24px;padding:0 8px;border:0;font-size:10px}.worksheet-header>div:first-child{flex:1}.worksheet-header>div:last-child{min-width:72px}.worksheet-header span{min-width:100px;height:13px}.worksheet-header>div:last-child span{min-width:62px}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));gap:0 22px;min-height:246mm;align-items:center;padding:0 2mm}.arithmetic{width:100%;min-height:0;justify-content:center;align-items:center;padding:0}.arithmetic-three .operation{min-height:54px}.print-row .number{display:none}.arithmetic .operation{display:block!important;flex:0 0 116px!important;width:116px!important;min-width:116px!important;max-width:116px!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:17px;line-height:1.15}.digit-value{display:inline-flex;gap:3px;letter-spacing:0}.digit-value b{letter-spacing:0}.top-number,.extra-number{padding-right:0;letter-spacing:0;font-variant-numeric:tabular-nums;white-space:nowrap;min-height:23px}.bottom-number{grid-template-columns:18px 1fr;gap:0;padding-right:0;letter-spacing:0;font-variant-numeric:tabular-nums;white-space:nowrap;line-height:1.15}.bottom-number .operator{text-align:center;letter-spacing:0}.bottom-number .digit-value{justify-self:end}.arithmetic .operation-rule{display:block!important;width:116px!important;max-width:116px!important;margin-top:5px}.answer-space{display:none}' : textStyles}`)
    .replaceAll('@media(max-width:650px)', simpleMath ? '@media print and (max-width:0px)' : '@media screen and (max-width:650px)')
    .replace('</head>', `${printPolish}${screenLayout}</head>`);
  const worksheet = preparePrint(printableHtml(config, items, false));
  const answerSheet = preparePrint(printableHtml(config, items, true));
  const print = html => {
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const win = window.open(blobUrl, '_blank');
    if (!win) { URL.revokeObjectURL(blobUrl); return false; }
    try { win.opener = null; } catch (error) { /* protección opcional del navegador */ }
    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      try { win.focus(); win.print(); } finally { setTimeout(() => URL.revokeObjectURL(blobUrl), 1000); }
    };
    win.addEventListener('load', triggerPrint, { once: true });
    setTimeout(triggerPrint, 1500);
    return true;
  };
  return { worksheet, answerSheet, print };
}

document.querySelector('#share-direct').addEventListener('click', async () => {
  const config = readConfig();
  const shareText = `He preparado una ficha de ${labels[config.type]} con FichasFácil.`;
  const shareData = { title: `${labels[config.type]} · FichasFácil`, text: shareText, url: shareUrl(config) };
  const shareButton = document.querySelector('#share-direct');
  shareButton.disabled = true;
  const fallbackMarkup = (message, linkLabel = 'Abrir enlace') => `<div class="success-box"><strong>Enlace listo para compartir</strong><span class="print-hint">${message}</span><a class="share-url" href="${escapeHtml(shareData.url)}">${linkLabel}</a></div>`;
  try {
    if (navigator.share) await navigator.share(shareData);
    else if (navigator.clipboard) { await navigator.clipboard.writeText(`${shareText} ${shareData.url}`); result.innerHTML = `<div class="success-box"><strong>Enlace listo para compartir</strong><span class="print-hint">Hemos copiado el enlace con la configuración de esta ficha.</span></div>`; }
    else result.innerHTML = fallbackMarkup('Copia o abre este enlace para compartir la configuración.');
  } catch (error) {
    if (error.name === 'AbortError') result.innerHTML = fallbackMarkup('Has cancelado la ventana de compartir. Puedes abrir el enlace directamente.');
    else result.innerHTML = fallbackMarkup('El navegador no permite compartir automáticamente. Puedes abrir el enlace directamente.');
  }
  finally { shareButton.disabled = false; }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const submitButton = document.querySelector('#print-direct');
  submitButton.disabled = true;
  const config = readConfig();
  form.setAttribute('aria-busy', 'true');
  const { worksheet, answerSheet, print } = createSheets(config);
  const printed = print(worksheet);
  setTimeout(() => { submitButton.disabled = false; form.setAttribute('aria-busy', 'false'); }, 500);
  result.innerHTML = `<div class="success-box"><strong>${printed ? 'Ficha lista para imprimir' : 'Permite las ventanas emergentes'}</strong><span class="print-hint">${printed ? `${labels[config.type]} · ${config.count} ejercicios` : 'El navegador ha bloqueado la ventana de impresión.'}</span>${config.solutions ? '<button class="solutions-link" id="print-solutions" type="button">Imprimir soluciones</button>' : ''}</div>`;
  document.querySelector('#print-solutions')?.addEventListener('click', () => print(answerSheet));
});
