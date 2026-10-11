const modal = document.querySelector('#generator');
const form = document.querySelector('#generator-form');
const activity = document.querySelector('#activity');
const result = document.querySelector('#preview-result');
const labels = {
  sumas: 'Sumas', restas: 'Restas', multiplicaciones: 'Multiplicaciones',
  divisiones: 'Divisiones', problemas: 'Problemas matemáticos', lectura: 'Lectura comprensiva'
};

const countSelect = document.querySelector('#count');
if (countSelect && !countSelect.querySelector('option[value="20"]')) {
  countSelect.insertAdjacentHTML('beforeend', '<option value="20">20 ejercicios</option>');
  countSelect.value = '20';
}

const openGenerator = type => {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  activity.value = type;
  result.innerHTML = '';
  setTimeout(() => activity.focus(), 50);
};

document.querySelectorAll('[data-type]').forEach(card => card.addEventListener('click', () => openGenerator(card.dataset.type)));
document.querySelector('.modal-close').addEventListener('click', () => {
  modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
});
modal.addEventListener('click', event => {
  if (event.target === modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.classList.remove('open'); });

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
  if (type === 'lectura') return [{ question: 'Lee el texto y responde a las preguntas.', answer: 'El texto se ha preparado para trabajar la comprensión lectora.' }];
  return Array.from({ length: count }, (_, i) => ({
    question: `En una actividad hay ${i + 2} grupos con ${i + 3} elementos. ¿Cuántos elementos hay en total?`,
    answer: (i + 2) * (i + 3)
  }));
}

function exerciseMarkup(config, item, index, solutions) {
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
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · Fichalia</title><style>
*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#20283f;margin:0;padding:20mm 15mm;max-width:210mm;min-height:297mm}h1{text-align:center;font-size:28px;margin:0 0 14px;color:#20283f}h2{text-align:center;font-size:14px;font-weight:normal;margin:0 0 18px;color:#697772}.worksheet-header{display:flex;justify-content:space-between;gap:30px;border-bottom:1.5px solid #20283f;padding-bottom:11px;margin-bottom:24px;font-size:13px;font-weight:700}.worksheet-header span{display:inline-block;min-width:145px;border-bottom:1px solid #20283f;margin-left:6px;height:16px}.exercise-grid{display:grid;gap:15px 20px}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.text-grid{grid-template-columns:1fr}.print-row{break-inside:avoid}.arithmetic{display:flex;align-items:flex-start;gap:5px;min-height:102px;padding:4px 2px}.print-row .number{font-size:11px;color:#6b7486;padding-top:3px}.operation{width:100%;font-size:22px;font-weight:700;line-height:1.05}.top-number{text-align:right;padding-right:5px;letter-spacing:5px;min-height:28px}.bottom-number{display:grid;grid-template-columns:1fr auto;gap:6px;text-align:right;padding-right:5px}.bottom-number span:first-child{text-align:left;font-weight:400}.operation-rule{border-bottom:1.5px solid #20283f;margin-top:4px}.answer-space{height:28px;border-bottom:1px solid #7f8998}.solution{font-size:20px;text-align:right;color:#ef8e69;padding:6px 5px 0}.text-exercise{display:grid;grid-template-columns:25px 1fr;grid-template-rows:auto 25px;align-items:end;gap:5px 7px;min-height:78px;padding:8px 4px;border-bottom:1px solid #e4ebe5}.text-exercise strong{font-size:19px;line-height:1.25}.text-exercise i{display:block;border-bottom:1.5px solid #82958b;height:22px}.text-exercise b{font-size:20px;color:#ef8e69;grid-column:2}.foot{position:fixed;bottom:8mm;font-size:10px;color:#89958f}@media print{body{padding:13mm 12mm}.exercise-grid{gap:13px 18px}}@media(max-width:650px){body{padding:18px 14px;max-width:none;min-height:0;overflow-x:hidden}h1{font-size:24px}.worksheet-header{font-size:11px;gap:12px}.worksheet-header span{min-width:90px}.math-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}.arithmetic{min-height:105px}.operation{font-size:22px}}</style></head><body><h1>${title}</h1><h2>Una ficha para aprender con confianza · ${config.level}</h2><div class="worksheet-header"><div>Nombre:<span>${name}</span></div><div>Fecha:<span></span></div></div><div class="exercise-grid ${arithmetic ? 'math-grid' : 'text-grid'}">${rows}</div><div class="foot">Fichalia · fichas que hacen sitio a la curiosidad</div></body></html>`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const config = { type: activity.value, level: document.querySelector('#level').value, difficulty: document.querySelector('#difficulty').value, count: Number(document.querySelector('#count').value), student: document.querySelector('#student').value.trim(), theme: document.querySelector('#theme').value, solutions: document.querySelector('#solutions')?.checked };
  const items = makeContent(config.type, config.count, config.difficulty);
  const simpleMath = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  const preparePrint = html => html
    .replace('<style>', `<style>@page{size:A4;margin:0}${simpleMath ? '.worksheet-header,h1,h2,.foot{display:none!important}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:34px 24px}.arithmetic{min-height:108px;justify-content:center;padding:0}.print-row .number{display:none}.operation{width:fit-content;min-width:58px}.top-number,.bottom-number{padding-right:0}.operation-rule{margin-top:5px}.answer-space{height:30px}' : ''}`)
    .replaceAll('@media(max-width:650px)', '@media screen and (max-width:650px)');
  const worksheet = preparePrint(printableHtml(config, items, false));
  const answerSheet = preparePrint(printableHtml(config, items, true));
  result.innerHTML = `<div class="success-box"><strong>La ficha está lista</strong>${labels[config.type]} · ${config.count} ejercicios<div class="download-actions"><button id="print-sheet">Imprimir ficha</button>${config.solutions ? '<button id="print-solutions">Imprimir soluciones</button>' : ''}<button id="new-sheet">Crear otra</button></div></div>`;
  const print = html => { const win = window.open('', '_blank'); win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 250); };
  document.querySelector('#print-sheet').onclick = () => print(worksheet);
  document.querySelector('#print-solutions')?.addEventListener('click', () => print(answerSheet));
  document.querySelector('#new-sheet').onclick = () => { result.innerHTML = ''; document.querySelector('#student').focus(); };
});
