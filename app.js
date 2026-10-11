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
let lastReadingTitle = '';
let lastCopyingSequence = -1;
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
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=20261011-28', { updateViaCache: 'none' }).catch(() => {}));
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
  const usesMultipleTerms = ['sumas', 'restas'].includes(activity.value);
  const isCopying = activity.value === 'copiado';
  const isReading = activity.value === 'lectura';
  document.querySelector('#operands-field').classList.toggle('hidden-field', !usesMultipleTerms);
  ['first-digits-field', 'second-digits-field'].forEach(id => document.querySelector(`#${id}`).classList.toggle('hidden-field', !isMath));
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

const makeReading = (level, data) => {
  const [title, text, ...pairs] = data;
  return { level, title, text, questions: pairs.filter((_, index) => index % 2 === 0), answers: pairs.filter((_, index) => index % 2 === 1) };
};

const readingActivitiesByLevel = {
  Inicial: [
    ["La caja de semillas", "Nora ayuda a su abuelo en el huerto. Llenan una maceta y plantan semillas de tomate. Después, Nora riega la tierra.", "¿A quién ayuda Nora?", "A su abuelo.", "¿Qué plantan?", "Semillas de tomate.", "¿Qué hace Nora después?", "Riega la tierra."],
    ["El balón rojo", "Leo tiene un balón rojo. Sale al parque con su hermana y juegan cerca de un árbol. Cuando empieza a llover, vuelven a casa.", "¿De qué color es el balón?", "Rojo.", "¿Con quién sale Leo?", "Con su hermana.", "¿Por qué vuelven a casa?", "Porque empieza a llover."],
    ["La merienda", "Paula prepara una merienda con pan y queso. Guarda una manzana en su mochila y se sienta a comer con sus amigos.", "¿Qué prepara Paula?", "Una merienda.", "¿Qué guarda en la mochila?", "Una manzana.", "¿Con quién come?", "Con sus amigos."],
    ["El gato blanco", "El gato de Ana es blanco y duerme en una cesta. Por la mañana, Ana le pone agua y un poco de comida.", "¿De qué color es el gato?", "Blanco.", "¿Dónde duerme?", "En una cesta.", "¿Qué le pone Ana?", "Agua y comida."],
    ["La mochila azul", "Tomás prepara su mochila azul para ir al colegio. Mete un cuaderno, dos lápices y una goma.", "¿De qué color es la mochila?", "Azul.", "¿Dónde va Tomás?", "Al colegio.", "¿Cuántos lápices mete?", "Dos."],
    ["Las botas de agua", "Clara se pone sus botas porque ha llovido. Camina despacio y salta sobre un charco pequeño.", "¿Por qué se pone las botas?", "Porque ha llovido.", "¿Cómo camina Clara?", "Despacio.", "¿Sobre qué salta?", "Sobre un charco."],
    ["El dibujo de Mario", "Mario dibuja una casa con ventanas y una puerta. Luego pinta el tejado de color naranja.", "¿Qué dibuja Mario?", "Una casa.", "¿Qué tiene la casa?", "Ventanas y una puerta.", "¿De qué color pinta el tejado?", "Naranja."],
    ["La planta pequeña", "Lola tiene una planta pequeña en su habitación. Cada mañana la coloca junto a la ventana y le da un poco de agua.", "¿Dónde está la planta?", "En su habitación.", "¿Cuándo la cuida?", "Cada mañana.", "¿Dónde la coloca?", "Junto a la ventana."],
    ["El desayuno", "Álex desayuna leche y una tostada. Antes de salir, guarda la servilleta y deja el plato en la cocina.", "¿Qué desayuna Álex?", "Leche y una tostada.", "¿Qué guarda?", "La servilleta.", "¿Dónde deja el plato?", "En la cocina."],
    ["La cometa", "Sara lleva una cometa amarilla al campo. El viento sopla fuerte y la cometa sube muy alto.", "¿De qué color es la cometa?", "Amarilla.", "¿Dónde la lleva Sara?", "Al campo.", "¿Qué hace el viento?", "Sopla fuerte."],
    ["El libro nuevo", "Diego recibe un libro nuevo sobre animales. Lo abre después de cenar y lee una página antes de dormir.", "¿Sobre qué trata el libro?", "Sobre animales.", "¿Cuándo lo abre?", "Después de cenar.", "¿Cuánto lee?", "Una página."],
    ["La pelota perdida", "Marta busca su pelota debajo de la mesa. La encuentra junto a una silla y la guarda en una caja.", "¿Qué busca Marta?", "Su pelota.", "¿Dónde la encuentra?", "Junto a una silla.", "¿Dónde la guarda?", "En una caja."],
    ["El autobús escolar", "El autobús llega temprano a la parada. Bruno saluda al conductor y se sienta junto a la ventana.", "¿Cuándo llega el autobús?", "Temprano.", "¿A quién saluda Bruno?", "Al conductor.", "¿Dónde se sienta?", "Junto a la ventana."],
    ["La sopa caliente", "Mamá sirve sopa en un cuenco. Julia espera un poco porque está caliente y después la prueba con una cuchara.", "¿Qué sirve mamá?", "Sopa.", "¿Por qué espera Julia?", "Porque está caliente.", "¿Con qué la prueba?", "Con una cuchara."],
    ["El jardín", "En el jardín hay flores rojas y amarillas. Hugo lleva una regadera y moja la tierra con cuidado.", "¿Qué hay en el jardín?", "Flores.", "¿De qué colores son?", "Rojas y amarillas.", "¿Qué lleva Hugo?", "Una regadera."],
    ["La bufanda", "Hace frío y Elena se pone una bufanda verde. Su padre le abrocha el abrigo antes de salir.", "¿Qué tiempo hace?", "Hace frío.", "¿De qué color es la bufanda?", "Verde.", "¿Quién le abrocha el abrigo?", "Su padre."],
    ["El pez dorado", "En la pecera vive un pez dorado. Óscar le da comida por la mañana y observa cómo nada.", "¿Dónde vive el pez?", "En una pecera.", "¿De qué color es?", "Dorado.", "¿Cuándo le da comida Óscar?", "Por la mañana."],
    ["El castillo de arena", "En la playa, Inés construye un castillo de arena. Decora la torre con una concha grande.", "¿Dónde construye Inés?", "En la playa.", "¿Qué construye?", "Un castillo de arena.", "¿Con qué decora la torre?", "Con una concha."],
    ["La bicicleta", "Pablo limpia su bicicleta con un paño. Luego comprueba que las ruedas tienen aire.", "¿Con qué limpia la bicicleta?", "Con un paño.", "¿Qué comprueba?", "Que las ruedas tienen aire.", "¿De quién es la bicicleta?", "De Pablo."],
    ["La fiesta", "Hoy es el cumpleaños de Carmen. Sus amigos llevan globos y cantan una canción antes de comer la tarta.", "¿Qué celebra Carmen?", "Su cumpleaños.", "¿Qué llevan sus amigos?", "Globos.", "¿Qué comen?", "Tarta."],
    ["El paraguas amarillo", "Samuel ve nubes oscuras y coge su paraguas amarillo. Llega al colegio sin mojarse.", "¿Qué ve Samuel?", "Nubes oscuras.", "¿De qué color es el paraguas?", "Amarillo.", "¿Dónde llega?", "Al colegio."],
    ["La caja de colores", "Amina ordena sus pinturas en una caja. Coloca juntos el azul, el verde y el morado.", "¿Qué ordena Amina?", "Sus pinturas.", "¿Dónde las coloca?", "En una caja.", "¿Qué colores junta?", "Azul, verde y morado."],
    ["El paseo", "Nico pasea con su perro por la plaza. El perro se para junto a una fuente y bebe agua.", "¿Con quién pasea Nico?", "Con su perro.", "¿Dónde pasean?", "Por la plaza.", "¿Qué hace el perro?", "Bebe agua."],
    ["La carta", "Vera escribe una carta para su abuela. Dibuja una flor en el sobre y la deja junto a la puerta.", "¿Para quién escribe Vera?", "Para su abuela.", "¿Qué dibuja?", "Una flor.", "¿Dónde deja la carta?", "Junto a la puerta."],
    ["La ventana", "Por la mañana, Lucas abre la ventana de su habitación. Entra aire fresco y escucha a los pájaros.", "¿Cuándo abre Lucas la ventana?", "Por la mañana.", "¿Qué entra?", "Aire fresco.", "¿Qué escucha?", "A los pájaros."]
  ],
  Medio: [
    ["Una visita a la biblioteca", "El martes, Iván fue a la biblioteca con su clase. La bibliotecaria explicó cómo cuidar los libros y les enseñó cuentos de aventuras. Iván eligió una historia sobre un barco y apuntó la fecha de devolución.", "¿Con quién fue Iván?", "Con su clase.", "¿Qué explicó la bibliotecaria?", "Cómo cuidar los libros.", "¿Qué apuntó Iván?", "La fecha de devolución."],
    ["El paseo en bicicleta", "Claudia preparó su bicicleta para ir al parque. Revisó las ruedas, se puso el casco y guardó agua en la mochila. Allí encontró a Pablo y juntos continuaron hasta el estanque para observar los patos.", "¿Qué revisó Claudia?", "Las ruedas.", "¿Qué llevaba en la mochila?", "Agua.", "¿Qué observaron en el estanque?", "Los patos."],
    ["La receta de galletas", "Marta preparó galletas para la merienda. Mezcló harina, azúcar y un huevo. Su padre extendió la masa con ella y después esperaron a que las galletas estuvieran doradas.", "¿Para qué preparó las galletas?", "Para la merienda.", "¿Quién la ayudó con la masa?", "Su padre.", "¿Cómo supieron que estaban listas?", "Cuando estuvieron doradas."],
    ["El huerto del colegio", "La clase de tercero comenzó un pequeño huerto. Cada equipo se ocupó de una tarea: unos prepararon la tierra, otros plantaron lechugas y el último grupo colocó carteles con los nombres de las plantas.", "¿Qué comenzó la clase?", "Un pequeño huerto.", "¿Qué plantó uno de los equipos?", "Lechugas.", "¿Para qué sirvieron los carteles?", "Para poner los nombres de las plantas."],
    ["El paraguas amarillo", "Samuel salió de casa cuando empezaba a llover. Cogió un paraguas amarillo y se puso las botas. En la entrada del colegio encontró un charco, lo rodeó y llegó a clase con los pies secos.", "¿Qué hizo Samuel antes de salir?", "Cogió el paraguas y se puso las botas.", "¿Dónde encontró el charco?", "En la entrada del colegio.", "¿Por qué lo rodeó?", "Para mantener secos los pies."],
    ["El gato de la vecina", "Elena escuchó maullidos cerca del jardín y descubrió al gato de su vecina sobre un muro. Dejó agua junto a la valla y avisó a la dueña. La vecina llegó poco después y llevó al animal a casa.", "¿Dónde estaba el gato?", "Sobre un muro.", "¿Qué dejó Elena?", "Agua.", "¿Qué hizo la vecina?", "Llevó al gato a casa."],
    ["La brújula", "En una excursión, el grupo de Marcos aprendió a usar una brújula. La monitora explicó que la aguja señala el norte. Después, los niños compararon el instrumento con el mapa para encontrar el camino de vuelta.", "¿Qué aprendió el grupo?", "A usar una brújula.", "¿Qué señala la aguja?", "El norte.", "¿Con qué compararon la brújula?", "Con el mapa."],
    ["El banco de semillas", "La asociación del barrio guardó semillas de varias plantas en pequeños sobres. Escribieron el nombre y la fecha en cada uno. Así podrían plantarlas en primavera y recordar cuánto tiempo habían estado guardadas.", "¿Dónde guardaron las semillas?", "En pequeños sobres.", "¿Qué escribieron en cada sobre?", "El nombre y la fecha.", "¿Para qué las guardarían?", "Para plantarlas en primavera."],
    ["La exposición de minerales", "La clase visitó una exposición de minerales. Lucía se fijó en una piedra brillante y el guía explicó que algunos minerales forman cristales. Antes de irse, cada alumno anotó el nombre de su pieza favorita.", "¿Qué visitó la clase?", "Una exposición de minerales.", "¿Qué explicó el guía?", "Que algunos minerales forman cristales.", "¿Qué anotaron los alumnos?", "El nombre de su pieza favorita."],
    ["La radio del colegio", "Un grupo de alumnos preparó un programa de radio para el colegio. Primero eligieron las noticias, después repartieron los papeles y finalmente grabaron sus voces. Tuvieron que repetir una parte porque se oyó demasiado ruido.", "¿Qué prepararon los alumnos?", "Un programa de radio.", "¿Qué hicieron después de elegir las noticias?", "Repartieron los papeles.", "¿Por qué repitieron una parte?", "Porque había demasiado ruido."],
    ["El puente de madera", "Durante una salida, el camino terminó frente a un pequeño arroyo. El profesor pidió al grupo que esperara mientras comprobaba el puente de madera. Cuando vio que era seguro, cruzaron de uno en uno para no moverlo demasiado.", "¿Qué había al final del camino?", "Un pequeño arroyo.", "¿Qué comprobó el profesor?", "El puente.", "¿Cómo cruzaron?", "De uno en uno."],
    ["El calendario de plantas", "Sara observó una semilla durante varias semanas. Dibujó el tallo cada lunes y midió su altura con una regla. Al final comparó los dibujos y descubrió que la planta había crecido más después de recibir luz.", "¿Qué observó Sara?", "Una semilla.", "¿Cuándo dibujaba el tallo?", "Cada lunes.", "¿Qué descubrió?", "Que creció más después de recibir luz."],
    ["El mercado de la plaza", "En el mercado, Tomás acompañó a su padre a comprar fruta. Compararon dos puestos y eligieron el que tenía naranjas más maduras. Al volver, colocaron la compra en una cesta para que no se aplastara.", "¿A quién acompañó Tomás?", "A su padre.", "¿Qué compararon?", "Dos puestos.", "¿Por qué usaron una cesta?", "Para que la fruta no se aplastara."],
    ["La sombra del árbol", "Durante el recreo, el patio estaba muy soleado. Unos niños se sentaron bajo un árbol porque allí había sombra y podían leer tranquilos. Después observaron que la sombra cambiaba de lugar a medida que avanzaba la mañana.", "¿Por qué se sentaron bajo el árbol?", "Porque había sombra.", "¿Qué hicieron allí?", "Leyeron.", "¿Qué observaron después?", "Que la sombra cambiaba de lugar."],
    ["El cuaderno de recetas", "La abuela de Julia guardaba recetas en un cuaderno antiguo. Julia copió la de la sopa de verduras y dibujó al lado los ingredientes. Así podría prepararla algún día y conservar una parte de la historia familiar.", "¿Dónde guardaba las recetas la abuela?", "En un cuaderno.", "¿Qué receta copió Julia?", "La de la sopa de verduras.", "¿Por qué la copió?", "Para poder prepararla y conservar la historia familiar."],
    ["El club de ajedrez", "Álvaro se apuntó al club de ajedrez del colegio. Al principio le costaba recordar cómo se movían algunas piezas, pero practicó con una compañera. Después de varias partidas, empezó a pensar antes de mover.", "¿A qué club se apuntó Álvaro?", "Al club de ajedrez.", "¿Qué le costaba al principio?", "Recordar cómo se movían algunas piezas.", "¿Qué empezó a hacer después?", "Pensar antes de mover."],
    ["La lluvia de estrellas", "La familia de Noa salió al campo para observar una lluvia de estrellas. Llevaron mantas y esperaron a que oscureciera. Como había una nube sobre el horizonte, cambiaron de sitio y pudieron ver varias estrellas fugaces.", "¿Para qué salió la familia?", "Para observar una lluvia de estrellas.", "¿Qué llevaron?", "Mantas.", "¿Por qué cambiaron de sitio?", "Porque había una nube."],
    ["El mural del pasillo", "Los alumnos decoraron el pasillo con un mural sobre los paisajes. Unos pintaron montañas, otros dibujaron un río y un tercer grupo escribió los nombres de los lugares. Antes de colgarlo, revisaron que todos los equipos aparecieran.", "¿Sobre qué era el mural?", "Sobre los paisajes.", "¿Qué dibujó un grupo?", "Un río.", "¿Qué revisaron antes de colgarlo?", "Que aparecieran todos los equipos."],
    ["La caja de herramientas", "A Diego le regalaron una caja de herramientas para construir pequeños objetos. Su madre le enseñó a guardar cada pieza en su sitio y a pedir ayuda para usar las herramientas difíciles. Diego empezó haciendo un pequeño barco de madera.", "¿Qué recibió Diego?", "Una caja de herramientas.", "¿Qué le enseñó su madre?", "A guardar cada pieza y pedir ayuda.", "¿Qué construyó primero?", "Un barco de madera."],
    ["El sendero de los pinos", "El grupo siguió un sendero marcado con señales azules. Cuando llegaron a una bifurcación, consultaron el mapa y escogieron el camino que llevaba al mirador. Desde allí pudieron ver el lago que aparecía en la guía.", "¿De qué color eran las señales?", "Azules.", "¿Qué consultaron en la bifurcación?", "El mapa.", "¿Qué vieron desde el mirador?", "El lago."],
    ["La carta del intercambio", "Amina recibió una carta de una niña de otro colegio. En ella contaba cómo era su pueblo y describía una fiesta de primavera. Amina respondió explicando las actividades que hacían en su barrio y añadió un dibujo.", "¿De quién recibió Amina la carta?", "De una niña de otro colegio.", "¿Qué describía la carta?", "Una fiesta de primavera.", "¿Qué añadió Amina a su respuesta?", "Un dibujo."],
    ["El experimento del hielo", "En clase, los alumnos colocaron cubitos de hielo en tres lugares: al sol, a la sombra y dentro de un armario. Anotaron la hora y observaron cuál se derretía antes. El cubito del sol desapareció primero.", "¿Dónde colocaron los cubitos?", "Al sol, a la sombra y en un armario.", "¿Qué anotaron?", "La hora.", "¿Cuál se derritió primero?", "El cubito del sol."],
    ["El refugio de aves", "El colegio construyó un refugio para aves con madera reciclada. Lo colocaron en un árbol tranquilo y dejaron semillas cerca. Durante los días siguientes, los alumnos observaron desde lejos para no asustar a los pájaros.", "¿Con qué construyeron el refugio?", "Con madera reciclada.", "¿Dónde lo colocaron?", "En un árbol tranquilo.", "¿Por qué observaron desde lejos?", "Para no asustar a los pájaros."],
    ["La carrera solidaria", "La clase organizó una carrera para recoger alimentos. Cada participante buscó patrocinadores entre sus familiares y llevó una bolsa al colegio. Al terminar, contaron las bolsas y las entregaron a una asociación del barrio.", "¿Para qué organizaron la carrera?", "Para recoger alimentos.", "¿Qué llevó cada participante?", "Una bolsa.", "¿A quién entregaron los alimentos?", "A una asociación del barrio."],
    ["El reloj de la torre", "Durante una excursión, el grupo llegó a una plaza con una torre antigua. El guía explicó que el reloj ayudaba a los vecinos a saber la hora antes de que hubiera relojes en todas las casas. Los alumnos dibujaron la torre en sus cuadernos.", "¿Qué había en la plaza?", "Una torre antigua.", "¿Para qué servía el reloj?", "Para que los vecinos supieran la hora.", "¿Qué hicieron los alumnos?", "Dibujaron la torre."]
  ],
  Avanzado: [
    ["El banco de tiempo", "En el barrio de Valdemar, varias personas crearon un banco de tiempo. Allí no se intercambiaba dinero: cada vecino ofrecía una hora de ayuda y podía recibir otra a cambio. Así, una persona que enseñaba informática podía pedir ayuda para cuidar sus plantas.", "¿Qué se intercambiaba en el banco?", "Horas de ayuda.", "¿Qué podía ofrecer una persona?", "Enseñar informática.", "¿Qué podía pedir a cambio?", "Ayuda para cuidar sus plantas."],
    ["El mapa de los sonidos", "La clase de Lucía realizó un mapa sonoro del colegio. Durante varios días anotaron qué sonidos escuchaban en cada lugar y a qué hora aparecían. Descubrieron que el patio era el espacio más ruidoso, mientras que la biblioteca tenía sonidos suaves y breves.", "¿Qué elaboró la clase?", "Un mapa sonoro del colegio.", "¿Qué anotaron?", "Los sonidos de cada lugar y su horario.", "¿Qué descubrieron de la biblioteca?", "Que tenía sonidos suaves y breves."],
    ["La semilla viajera", "Una semilla de arce llegó al jardín de Celia después de recorrer varios metros impulsada por el viento. Celia no la arrancó: la dejó en una maceta y observó cómo cambiaba. Semanas después apareció un tallo, aunque todavía no sabía si conseguiría convertirse en un árbol.", "¿Cómo llegó la semilla al jardín?", "Impulsada por el viento.", "¿Qué hizo Celia con ella?", "La dejó en una maceta y la observó.", "¿Qué apareció semanas después?", "Un tallo."],
    ["El taller de reparación", "El centro juvenil organizó un taller para reparar objetos en lugar de tirarlos. Los participantes aprendieron a cambiar una cremallera, ajustar una lámpara y arreglar una rueda. Además de ahorrar materiales, descubrieron que comprender cómo funciona un objeto facilita encontrar la avería.", "¿Qué objetivo tenía el taller?", "Reparar objetos en vez de tirarlos.", "¿Qué aprendieron a ajustar?", "Una lámpara.", "¿Qué facilita encontrar una avería?", "Comprender cómo funciona el objeto."],
    ["La carta náutica", "En el museo marítimo, Omar observó una carta náutica dibujada hace más de cien años. No tenía la precisión de los mapas actuales, pero mostraba la costa, los puertos y algunos peligros para los barcos. El guía explicó que los navegantes la completaban con sus propios viajes.", "¿Cuándo se dibujó la carta?", "Hace más de cien años.", "¿Qué mostraba?", "La costa, los puertos y peligros.", "¿Cómo se completaba?", "Con la información de los viajes de los navegantes."],
    ["El jardín de lluvia", "Para evitar que el agua se acumulara en el patio, el colegio transformó una zona de cemento en un jardín de lluvia. Plantaron especies capaces de soportar periodos húmedos y secos. Cuando llueve, el terreno absorbe parte del agua y la libera poco a poco.", "¿Por qué crearon el jardín?", "Para evitar que el agua se acumulara.", "¿Qué plantas eligieron?", "Especies resistentes a periodos húmedos y secos.", "¿Qué ocurre cuando llueve?", "El terreno absorbe y libera el agua poco a poco."],
    ["La entrevista", "Para un trabajo de historia, Irene entrevistó a su bisabuela sobre la escuela de su infancia. Descubrió que entonces había menos libros, pero los alumnos compartían materiales y aprendían canciones de memoria. Irene comprendió que comparar épocas no consiste en decidir cuál es mejor, sino en observar sus diferencias.", "¿A quién entrevistó Irene?", "A su bisabuela.", "¿Qué compartían los alumnos?", "Los materiales.", "¿Qué comprendió Irene al comparar épocas?", "Que se deben observar sus diferencias sin decidir cuál es mejor."],
    ["El faro y la niebla", "Una mañana de niebla, la luz del faro apenas se distinguía desde el puerto. La guardiana revisó el mecanismo y comprobó que funcionaba correctamente. El problema no estaba en la lámpara, sino en la humedad del aire, que impedía que la luz viajara con claridad.", "¿Qué dificultaba ver la luz?", "La niebla.", "¿Qué revisó la guardiana?", "El mecanismo del faro.", "¿Cuál era el problema?", "La humedad del aire."],
    ["El cuaderno de campo", "Mateo llevaba un cuaderno de campo durante sus paseos. No se limitaba a dibujar animales: anotaba la hora, el lugar y el tiempo que hacía. Gracias a esos datos, pudo comprobar que veía más mariposas en las zonas con flores y durante las horas de mayor luz.", "¿Qué anotaba Mateo además de dibujar?", "La hora, el lugar y el tiempo.", "¿Qué pudo comprobar?", "Que veía más mariposas en zonas con flores.", "¿Cuándo veía más mariposas?", "Durante las horas de mayor luz."],
    ["La biblioteca viajera", "Un pueblo sin biblioteca fija creó una biblioteca viajera. Cada semana, una furgoneta llevaba libros distintos a una plaza. Los vecinos podían devolverlos allí o en la siguiente parada, lo que permitió que muchas familias leyeran sin desplazarse a otra localidad.", "¿Por qué crearon una biblioteca viajera?", "Porque el pueblo no tenía biblioteca fija.", "¿Dónde paraba la furgoneta?", "En una plaza.", "¿Qué facilitó el servicio?", "Que las familias leyeran sin desplazarse a otra localidad."],
    ["El puente de los animales", "En una carretera cercana al bosque, los atropellos de animales aumentaron durante el otoño. El ayuntamiento construyó un paso cubierto sobre la vía y colocó vallas para guiar a los animales hasta él. Al cabo de unos meses, las cámaras mostraron que lo utilizaban erizos, zorros y tejones.", "¿Qué problema había en la carretera?", "Aumentaron los atropellos de animales.", "¿Cómo guiaron a los animales?", "Con vallas.", "¿Qué animales utilizaron el paso?", "Erizos, zorros y tejones."],
    ["La energía del sol", "El laboratorio escolar instaló una pequeña placa solar para alimentar un sensor de temperatura. Los alumnos midieron la energía producida a distintas horas y comprobaron que no dependía solo de que hubiera luz: la inclinación de la placa y las nubes también influían.", "¿Para qué servía la placa solar?", "Para alimentar un sensor de temperatura.", "¿Qué midieron los alumnos?", "La energía producida a distintas horas.", "¿Qué factores influían además de la luz?", "La inclinación de la placa y las nubes."],
    ["El silencio del museo", "Durante una visita, el guía pidió al grupo que guardara silencio en una sala concreta. No era una norma arbitraria: allí se conservaban documentos muy frágiles y las vibraciones podían dañarlos. Los estudiantes entendieron que cuidar el patrimonio también implica modificar nuestro comportamiento.", "¿Por qué debían guardar silencio?", "Para proteger documentos frágiles.", "¿Qué podían causar las vibraciones?", "Podían dañarlos.", "¿Qué entendieron los estudiantes?", "Que cuidar el patrimonio exige adaptar nuestro comportamiento."],
    ["La ruta del agua", "El grupo siguió el recorrido de una gota desde la montaña hasta el mar. Pasó por un arroyo, una planta de tratamiento y una tubería antes de llegar a las casas. La actividad mostró que el agua no desaparece al cerrar el grifo: continúa formando parte de un ciclo que debemos cuidar.", "¿Qué recorrido siguió el grupo?", "El de una gota desde la montaña hasta el mar.", "¿Qué lugares atravesó el agua?", "Un arroyo, una planta de tratamiento y una tubería.", "¿Qué idea principal aprendieron?", "Que el agua forma parte de un ciclo y debemos cuidarla."],
    ["El teatro de sombras", "Para representar una leyenda, el grupo de teatro utilizó una pantalla blanca y figuras de cartón. La distancia entre la luz y las figuras cambiaba el tamaño de las sombras. Después de varios ensayos, decidieron colocar la lámpara más lejos para que todos los personajes cupieran en la pantalla.", "¿Qué materiales utilizaron?", "Una pantalla blanca y figuras de cartón.", "¿Qué cambiaba el tamaño de las sombras?", "La distancia entre la luz y las figuras.", "¿Por qué alejaron la lámpara?", "Para que todos los personajes cupieran en la pantalla."],
    ["El archivo de fotografías", "Nadia ordenó las fotografías antiguas de su familia. En lugar de guardarlas solo por fechas, escribió también quién aparecía y dónde se había tomado cada una. Así, sus primos podrían comprender las imágenes aunque no hubieran conocido a las personas retratadas.", "¿Cómo ordenó Nadia las fotografías?", "Por fechas, personas y lugares.", "¿Qué escribió además de la fecha?", "Quién aparecía y dónde se tomó cada foto.", "¿Para qué lo hizo?", "Para que sus primos comprendieran las imágenes."],
    ["El bosque después del incendio", "Tras un incendio, el bosque parecía vacío, pero los técnicos encontraron brotes bajo la ceniza y semillas protegidas en el suelo. Decidieron retirar algunos restos peligrosos y dejar otras zonas sin tocar. Querían evitar la erosión y permitir que la recuperación comenzara de forma natural.", "¿Qué encontraron los técnicos?", "Brotes y semillas protegidas.", "¿Qué zonas decidieron dejar sin tocar?", "Algunas zonas del bosque.", "¿Qué querían evitar?", "La erosión."],
    ["La fábrica de papel", "En una visita a una fábrica de papel, Elena observó cómo el papel usado se convertía en una pasta nueva. El proceso necesitaba agua, energía y máquinas, por lo que reciclar no significaba que el material no tuviera ningún coste. Aun así, reutilizar fibras reducía la cantidad de residuos y de árboles necesarios.", "¿En qué se convertía el papel usado?", "En una pasta nueva.", "¿Qué necesitaba el proceso?", "Agua, energía y máquinas.", "¿Qué ventaja tenía reutilizar fibras?", "Reducir residuos y la cantidad de árboles necesarios."],
    ["El observatorio", "Desde el observatorio, Sara observó la Luna durante cuatro noches. Dibujó la parte iluminada y comparó los cambios. Comprendió que la Luna no cambiaba de forma, sino que desde la Tierra veíamos distintas zonas iluminadas por el Sol.", "¿Durante cuánto tiempo observó Sara la Luna?", "Durante cuatro noches.", "¿Qué dibujó?", "La parte iluminada.", "¿Qué comprendió?", "Que vemos distintas zonas iluminadas por el Sol."],
    ["El debate del recreo", "En el colegio surgió un debate sobre si debía haber más bancos en el patio. Un grupo defendía que ayudarían a descansar y otro prefería reservar espacio para jugar. La clase recogió opiniones, midió la zona disponible y propuso colocar los bancos junto a la pared.", "¿Sobre qué debatieron?", "Sobre colocar más bancos.", "¿Qué hizo la clase antes de proponer una solución?", "Recogió opiniones y midió el espacio.", "¿Dónde propuso colocar los bancos?", "Junto a la pared."],
    ["La abeja y las flores", "Elena observó que las abejas visitaban varias flores antes de volver a la colmena. Al consultar una guía, descubrió que al transportar polen ayudan a que algunas plantas produzcan frutos. Desde entonces dejó una zona del jardín sin cortar para ofrecerles alimento.", "¿Qué transportaban las abejas?", "Polen.", "¿Cómo ayudan a las plantas?", "Favorecen que produzcan frutos.", "¿Qué decidió hacer Elena?", "Dejar una zona del jardín sin cortar."],
    ["El tren nocturno", "El tren salió de la estación al anochecer y atravesó varias comarcas. Durante el viaje, Daniel observó cómo las luces de las ciudades desaparecían y aumentaban las estrellas visibles. Pensó que la oscuridad del campo no significaba que hubiera menos vida, sino menos iluminación artificial.", "¿Cuándo salió el tren?", "Al anochecer.", "¿Qué observó Daniel en el viaje?", "Que aumentaban las estrellas visibles.", "¿Qué pensó sobre el campo?", "Que tenía menos iluminación artificial, no menos vida."],
    ["La decisión de Inés", "Inés debía elegir entre comprar un cuaderno nuevo o reparar el que ya tenía. Revisó las páginas y comprobó que solo se había soltado la tapa. Como aún quedaban muchas hojas limpias, decidió repararlo con cartón y reservar el dinero para los materiales de clase.", "¿Qué problema tenía el cuaderno?", "Se había soltado la tapa.", "¿Por qué decidió repararlo?", "Porque tenía muchas hojas limpias.", "¿Para qué reservó el dinero?", "Para los materiales de clase."],
    ["La exposición de inventos", "En la exposición escolar, cada equipo presentó un invento para ahorrar agua. Algunos construyeron un avisador para grifos abiertos y otros diseñaron un sistema para recoger el agua de lluvia. El jurado destacó que una buena idea debía ser útil, pero también fácil de mantener.", "¿Qué tema tenían los inventos?", "Ahorrar agua.", "¿Qué recogía uno de los sistemas?", "El agua de lluvia.", "¿Qué debía cumplir una buena idea?", "Ser útil y fácil de mantener."],
    ["Una decisión compartida", "Cuando la asociación vecinal tuvo que elegir el destino de una pequeña ayuda, no votó inmediatamente. Primero pidió propuestas, calculó los costes y comprobó cuántas personas se beneficiarían de cada opción. El resultado fue instalar una rampa, porque era la propuesta que mejoraba el acceso de todo el edificio.", "¿Qué hizo la asociación antes de votar?", "Pidió propuestas, calculó costes y estudió sus beneficios.", "¿Qué instalaron finalmente?", "Una rampa.", "¿Por qué la eligieron?", "Porque mejoraba el acceso de todo el edificio."]
  ]
};

const readingActivities = Object.entries(readingActivitiesByLevel).flatMap(([level, activities]) => activities.map(activity => makeReading(level, activity)));

const copyingSequences = [
  [
    'El sábado por la mañana, Lucía salió al parque con su abuelo. El día estaba despejado y los dos tenían ganas de dar un paseo tranquilo.',
    'Llevaron una cesta pequeña y una botella de agua para el camino. Lucía también guardó una libreta porque quería dibujar lo que encontraran.',
    'Primero caminaron junto al estanque y observaron los patos. Uno de ellos se acercó a la orilla, pero después volvió a nadar con los demás.',
    'Más tarde se sentaron bajo un árbol para descansar y merendar. El abuelo le contó a Lucía que aquel árbol llevaba muchos años en el parque.',
    'Antes de volver a casa, Lucía recogió la basura de la merienda. Su abuelo le explicó que cuidar los lugares compartidos es responsabilidad de todos.'
  ],
  [
    'En la clase de ciencias, el grupo decidió cuidar una planta. La profesora les pidió que observaran sus cambios durante varias semanas.',
    'Cada alumno escribió su nombre en una lista de turnos. Así sabrían quién debía revisar la maceta cada día.',
    'El lunes, Mateo comprobó que la tierra estaba demasiado seca. También vio que una de las hojas empezaba a inclinarse.',
    'Añadió un poco de agua y colocó la maceta cerca de la ventana. Después anotó lo que había hecho para que sus compañeros lo supieran.',
    'Durante las semanas siguientes, todos observaron cómo crecía. La clase descubrió que una planta necesita cuidados constantes y no solo agua de vez en cuando.'
  ],
  [
    'Clara preparó su mochila antes de salir hacia la biblioteca. Quería devolver un libro y buscar una historia nueva para el fin de semana.',
    'Guardó un cuaderno, un lápiz y la tarjeta de préstamo. También comprobó que llevaba la merienda para el camino de vuelta.',
    'En la sala infantil encontró un libro sobre animales del bosque. La portada mostraba un zorro entre los árboles y le llamó mucho la atención.',
    'Lo leyó en silencio y anotó una palabra que no conocía. Al llegar a casa pensaba buscar su significado en el diccionario.',
    'Al terminar, devolvió el libro en el mostrador de entrada. La bibliotecaria le recomendó otro título para su próxima visita.'
  ],
  [
    'La familia de Hugo decidió preparar una merienda en el campo. Querían aprovechar la tarde y caminar por un sendero cercano.',
    'Cada persona llevó algo distinto dentro de su mochila. Antes de salir, revisaron la lista para no olvidar el agua.',
    'Su madre llevó fruta y su hermano preparó unos bocadillos. Hugo se encargó de guardar unas servilletas y una bolsa para los residuos.',
    'Cuando llegaron, extendieron una manta junto a los árboles. Desde allí podían escuchar el viento y ver las montañas a lo lejos.',
    'Al marcharse, revisaron el lugar para dejarlo limpio. La familia pensó que disfrutar de la naturaleza también implica protegerla.'
  ],
  [
    'El colegio organizó una pequeña exposición sobre el agua. La actividad invitaba a pensar cómo utilizarla sin desperdiciarla.',
    'Cada equipo preparó un cartel con una idea para ahorrar agua. Unos hablaron de la ducha y otros de la cocina.',
    'El grupo de Sara explicó por qué conviene cerrar bien los grifos. También recordaron que una pequeña fuga puede desperdiciar mucha agua.',
    'Además, enseñaron un recipiente para recoger el agua de lluvia. Querían mostrar que algunos recursos pueden aprovecharse de nuevo.',
    'Al final, todos eligieron una costumbre para practicar en casa. Sara decidió cerrar el grifo mientras se cepillaba los dientes.'
  ],
  [
    'Martín encontró una caja de madera en el desván de su casa. Estaba detrás de unas mantas y tenía una pequeña cerradura oxidada.',
    'Dentro había fotografías antiguas y una carta doblada. Algunas imágenes mostraban una casa que Martín no había visto nunca.',
    'Su abuela le explicó quién aparecía en las fotografías. También le contó cómo era el pueblo cuando ella era pequeña.',
    'Juntos ordenaron las imágenes y escribieron las fechas detrás. Martín escuchó con atención para no confundir los nombres de la familia.',
    'Después guardaron la caja en un lugar seguro para volver a verla. Martín comprendió que las fotografías también pueden conservar recuerdos e historias.'
  ]
];

function randomReadingActivity(difficulty) {
  const level = difficulty === 'Inicial' || difficulty === 'Tranquila' ? 'Inicial' : difficulty === 'Medio' || difficulty === 'Estándar' ? 'Medio' : 'Avanzado';
  const available = readingActivities.filter(activity => activity.level === level && activity.title !== lastReadingTitle);
  const selected = available[randomInt(0, available.length - 1)] || readingActivities.find(activity => activity.level === level) || readingActivities[0];
  lastReadingTitle = selected.title;
  return selected;
}

function makeContent(type, count, difficulty, level, operands, firstDigits, secondDigits, paragraphs = 1) {
  if (['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(type)) {
    return Array.from({ length: count }, () => makeOperation(type, difficulty, level, operands, firstDigits, secondDigits));
  }
  if (type === 'lectura') return [{ kind: 'reading', ...randomReadingActivity(difficulty) }];
  if (type === 'copiado') {
    const available = copyingSequences.map((_, index) => index).filter(index => index !== lastCopyingSequence);
    const sequenceIndex = available[randomInt(0, available.length - 1)] ?? 0;
    lastCopyingSequence = sequenceIndex;
    return copyingSequences[sequenceIndex].slice(0, paragraphs).map(text => ({ kind: 'copying', text }));
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
  if (item.kind === 'copying') return `<article class="copying-sheet"><p class="copying-text">${item.text}</p></article>`;
  if (item.kind === 'reading') {
    const questions = item.questions.map((question, questionIndex) => `<div class="reading-question"><span>${questionIndex + 1}.</span><strong>${question}</strong>${solutions ? `<b>${item.answers[questionIndex]}</b>` : '<i aria-label="espacio para responder"></i>'}</div>`).join('');
    return `<article class="reading-sheet"><h3>${item.title}</h3><p class="reading-text">${item.text}</p><h4>Responde a las preguntas</h4>${questions}</article>`;
  }
  const arithmetic = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  if (arithmetic) {
    if (config.type === 'divisiones') {
      const division = item.question.match(/^(\d+)\s+÷\s+(\d+)\s*=/);
      if (division) {
        const spaced = value => String(value).split('').join('&nbsp;');
        const layout = `<table role="presentation" width="150" align="center" border="0" cellspacing="0" cellpadding="0" style="width:150px;table-layout:fixed;border-collapse:collapse;font:700 17px/1.15 Arial,Helvetica,sans-serif;color:#20283f"><tbody><tr><td width="64%" align="right" valign="middle" style="padding:0 12px 0 0;white-space:nowrap;letter-spacing:1px">${spaced(division[1])}</td><td width="36%" align="left" valign="middle" style="height:34px;padding:0 4px 3px 14px;border-left:1.5px solid #20283f;border-bottom:1.5px solid #20283f;white-space:nowrap;letter-spacing:1px">${spaced(division[2])}</td></tr></tbody></table>`;
        return solutions ? `<div style="width:150px;margin:0 auto">${layout}<div style="padding:5px 7px 0 0;text-align:right;font:700 13pt Arial,Helvetica,sans-serif;color:#20283f">${item.answer}</div></div>` : layout;
      }
    }
    const threeTermMatch = item.question.match(/^(\d+)\s+([+−])\s+(\d+)\s+([+−])\s+(\d+)\s*=/);
    const numberRow = (operator, value) => `<tr><td width="20%" align="center" valign="middle"><font face="Arial,Helvetica,sans-serif" size="4"><b>${operator || '&nbsp;'}</b></font></td><td width="80%" align="right" valign="middle"><font face="Arial,Helvetica,sans-serif" size="4"><b>${String(value).split('').join('&nbsp;')}</b></font></td></tr>`;
    const answerRows = solutions
      ? `<tr><td colspan="2" height="8mm" align="right" valign="middle" style="font:700 13pt Arial,Helvetica,sans-serif;padding-right:2mm;color:#20283f">${item.answer}</td></tr>`
      : config.type === 'multiplicaciones'
        ? Array.from({ length: 3 }, () => '<tr><td colspan="2" height="25" align="center" valign="bottom"><hr width="100%" size="1" color="#c4cbd4" noshade></td></tr>').join('')
        : '';
    const operationRows = threeTermMatch
      ? `${numberRow('', threeTermMatch[1])}${numberRow(threeTermMatch[2], threeTermMatch[3])}${numberRow(threeTermMatch[4], threeTermMatch[5])}`
      : (() => {
        const match = item.question.match(/^(\d+)\s+([+−×÷])\s+(\d+)\s*=/);
        return match ? `${numberRow('', match[1])}${numberRow(match[2], match[3])}` : '';
      })();
    if (operationRows) return `<table role="presentation" width="120" align="center" border="0" cellspacing="0" cellpadding="0"><tbody>${operationRows}<tr><td colspan="2" align="center"><hr width="100%" size="1" color="#20283f" noshade></td></tr>${answerRows}</tbody></table>`;
  }
  return `<div class="print-row text-exercise"><span class="number">${index + 1}.</span><strong>${item.question}</strong>${solutions ? `<b>${item.answer}</b>` : '<i aria-label="espacio para responder"></i>'}</div>`;
}

function printableHtml(config, items, solutions) {
  const name = config.student.trim();
  const title = labels[config.type];
  const arithmetic = ['sumas', 'restas', 'multiplicaciones', 'divisiones'].includes(config.type);
  const rows = items.map((item, index) => exerciseMarkup(config, item, index, solutions)).join('');
  const copyingGuide = config.type === 'copiado' ? `<section class="copying-final-guide" style="display:block;break-before:auto;page-break-before:auto;break-inside:avoid;page-break-inside:avoid;width:180mm;margin:7mm auto 0"><h3 style="font-size:14px;margin:0 0 7px;color:#697772">Escribe el texto</h3><div class="lamela-guide" aria-label="Pauta Lamela para copiar el texto" style="display:block;width:100%;height:108mm;border-top:1.2px solid #647b9b">${Array.from({ length: 12 }, (_, index) => `<div class="lamela-line lamela-line-${index % 3}" aria-hidden="true" style="display:block;width:100%;height:9mm;border-bottom:${index % 3 === 0 ? '1.2px solid #7890af' : index % 3 === 1 ? '1px dashed #b7c4d2' : '1.2px solid #ef9b9b'}"></div>`).join('')}</div></section>` : '';
  const worksheetHeader = `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td width="12%" align="left" valign="middle"><font face="Arial,Helvetica,sans-serif" size="2">Nombre:</font></td><td width="65%" align="left" valign="bottom"><font face="Arial,Helvetica,sans-serif" size="2">${name ? escapeHtml(name) : '&nbsp;'}</font><hr width="100%" size="1" color="#20283f" noshade></td><td width="8%" align="right" valign="middle"><font face="Arial,Helvetica,sans-serif" size="2">Fecha:</font></td><td width="15%" align="left" valign="bottom"><hr width="100%" size="1" color="#20283f" noshade></td></tr></tbody></table>`;
  let worksheetContent;
  if (arithmetic) {
    const cellsPerRow = config.type === 'divisiones' ? 3 : 4;
    const cellWidth = 100 / cellsPerRow;
    const operationRows = [];
    const rowHeightMm = Math.min(90, Math.floor(230 / Math.ceil(items.length / cellsPerRow)));
    const rowHeightPx = Math.round(rowHeightMm * 96 / 25.4);
    for (let start = 0; start < items.length; start += cellsPerRow) {
      const cells = items.slice(start, start + cellsPerRow).map((item, offset) => `<td width="${cellWidth}%" height="${rowHeightPx}" align="center" valign="middle" style="height:${rowHeightPx}px;padding:1mm 2mm">${exerciseMarkup(config, item, start + offset, solutions)}</td>`);
      while (cells.length < cellsPerRow) cells.push(`<td width="${cellWidth}%" height="${rowHeightPx}" style="height:${rowHeightPx}px">&nbsp;</td>`);
      operationRows.push(`<tr>${cells.join('')}</tr>`);
    }
    worksheetContent = `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout:fixed;border-collapse:collapse"><tbody><tr><td colspan="${cellsPerRow}" height="45">&nbsp;</td></tr>${operationRows.join('')}</tbody></table>`;
  } else {
    worksheetContent = `<div class="exercise-grid text-grid">${rows}</div>${copyingGuide}`;
  }
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'; style-src 'unsafe-inline'"><title>${escapeHtml(title)} · FichasFácil</title><style>
*{box-sizing:border-box}html{background:#fff}body{font-family:ui-rounded,'Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif;color:#20283f;margin:0;padding:20mm 15mm;width:210mm;min-height:297mm;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1{text-align:center;font-size:28px;margin:0 0 14px;color:#20283f}h2{text-align:center;font-size:14px;font-weight:normal;margin:0 0 18px;color:#697772}.worksheet-header{display:flex;justify-content:flex-start;gap:30px;border-bottom:1.5px solid #20283f;padding-bottom:11px;margin-bottom:24px;font-size:13px;font-weight:700}.worksheet-header span{display:inline-block;min-width:145px;border-bottom:1px solid #20283f;margin-left:6px;height:16px}.exercise-grid{display:grid;gap:15px 20px}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.text-grid{grid-template-columns:1fr}.print-row{break-inside:avoid;page-break-inside:avoid}.arithmetic{display:flex;align-items:flex-start;gap:5px;min-height:102px;padding:4px 2px}.print-row .number{font-size:11px;color:#6b7486;padding-top:3px}.operation{width:100%;font-size:22px;font-weight:700;line-height:1.05}.top-number,.extra-number{text-align:right;padding-right:5px;letter-spacing:5px;min-height:28px}.bottom-number{display:grid;grid-template-columns:1fr auto;gap:6px;text-align:right;padding-right:5px}.bottom-number span:first-child{text-align:left;font-weight:400}.operation-rule{border-bottom:1.5px solid #20283f;margin-top:4px}.answer-space{height:28px;border-bottom:1px solid #7f8998}.solution{font-size:20px;text-align:right;color:#ef8e69;padding:6px 5px 0}.text-exercise{display:grid;grid-template-columns:25px 1fr;grid-template-rows:auto 25px;align-items:end;gap:5px 7px;min-height:78px;padding:8px 4px;border-bottom:1px solid #e4ebe5}.text-exercise strong{font-size:19px;line-height:1.25}.text-exercise i{display:block;border-bottom:1.5px solid #82958b;height:22px}.text-exercise b{font-size:20px;color:#ef8e69;grid-column:2}.copying-sheet{break-inside:avoid;page-break-inside:avoid;margin:0 auto 9mm;max-width:180mm}.copying-text{font-size:17px;line-height:1.55;margin:0}.copying-final-guide{break-inside:avoid;page-break-inside:avoid;max-width:180mm;margin:7mm auto 0}.copying-final-guide h3{font-size:14px;margin:0 0 7px;color:#697772}.lamela-guide{height:108mm;border-top:1.2px solid #647b9b}.lamela-guide span,.lamela-guide div{display:block;height:9mm;border-bottom:1px solid #9aaabd}.lamela-line-0{border-bottom:1.2px solid #7890af!important}.lamela-line-1{border-bottom:1px dashed #b7c4d2!important}.lamela-line-2{border-bottom:1.2px solid #ef9b9b!important}.foot{position:fixed;bottom:8mm;font-size:10px;color:#89958f}@page{size:A4;margin:0}@media print{body{padding:13mm 12mm}.exercise-grid{gap:13px 18px}}@media(max-width:650px){body{padding:18px 14px;max-width:none;min-height:0;overflow-x:hidden}h1{font-size:24px}.worksheet-header{font-size:11px;gap:12px}.worksheet-header span{min-width:90px}.math-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}.arithmetic{min-height:105px}.operation{font-size:22px}}</style></head><body><h1 align="center"><font face="Arial,Helvetica,sans-serif" size="4">${title}</font></h1>${worksheetHeader}${worksheetContent}</body></html>`;
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
  const textStyles = '.text-exercise i{grid-column:2;width:100%}.text-exercise strong{font-size:17px;line-height:1.35}.reading-sheet{max-width:180mm;margin:0 auto}.reading-sheet h3{font-size:24px;margin:0 0 14px}.reading-text{font-size:16px;line-height:1.55;margin:0 0 20px}.reading-sheet h4{font-size:14px;margin:0 0 10px}.reading-question{display:grid;grid-template-columns:22px 1fr;gap:5px 7px;min-height:78px;align-items:start;margin-bottom:9px;break-inside:avoid;page-break-inside:avoid}.reading-question span{font-weight:700}.reading-question strong{font-size:15px;line-height:1.35}.reading-question i{grid-column:2;height:48px;border-bottom:1px solid #82958b;background:repeating-linear-gradient(to bottom,transparent 0,transparent 22px,#d9e2ea 22px,#d9e2ea 23px)}.reading-question b{grid-column:2;color:#275fac}.copying-sheet{break-inside:avoid;page-break-inside:avoid;margin:0 auto 9mm;max-width:180mm}.copying-text{font-size:17px;line-height:1.55;margin:0}.copying-final-guide{break-inside:avoid;page-break-inside:avoid;max-width:180mm;margin:7mm auto 0}.copying-final-guide h3{font-size:14px;margin:0 0 7px;color:#697772}.lamela-guide{height:108mm;border-top:1.2px solid #647b9b}.lamela-guide span{display:block;height:9mm;border-bottom:1px solid #9aaabd}.lamela-line-0{border-bottom:1.2px solid #7890af!important}.lamela-line-1{border-bottom:1px dashed #b7c4d2!important}.lamela-line-2{border-bottom:1.2px solid #ef9b9b!important}';
  const printPolish = '<style>html,body{width:210mm!important;min-width:210mm!important;max-width:210mm!important}body{font-family:ui-rounded,"Arial Rounded MT Bold","Trebuchet MS",Arial,sans-serif!important;color:#20283f!important;background:#fff!important;padding:13mm 12mm!important;overflow:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}h1{text-align:center!important;font-size:15px!important;font-weight:700!important;line-height:1.2!important;color:#20283f!important;margin:0 0 19px!important}.worksheet-header{display:flex!important;justify-content:space-between!important;gap:20px!important;margin-bottom:24px!important;padding:0 8px!important;border:0!important;font-size:10px!important;font-weight:700!important}.worksheet-header>div:first-child{flex:1}.worksheet-header>div:last-child{min-width:72px}.worksheet-header span{min-width:100px;height:13px}.worksheet-header>div:last-child span{min-width:62px}.math-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:repeat(5,minmax(0,1fr))!important;gap:0 22px!important;min-height:246mm!important;padding:0 2mm!important}.math-grid .arithmetic{width:100%!important;min-height:0!important;justify-content:center!important;align-items:center!important;padding:0!important}.math-grid .operation{display:block!important;flex:0 0 116px!important;width:116px!important;min-width:116px!important;max-width:116px!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important;font-size:17px!important;line-height:1.15!important}.math-grid .digit-value{display:inline-flex!important;gap:3px!important;letter-spacing:0!important}.math-grid .digit-value b{letter-spacing:0!important}.math-grid .top-number,.math-grid .extra-number{padding-right:0!important;letter-spacing:0!important;min-height:23px!important;white-space:nowrap!important}.math-grid .bottom-number{grid-template-columns:18px 1fr!important;gap:0!important;padding-right:0!important;letter-spacing:0!important;line-height:1.15!important;white-space:nowrap!important}.math-grid .bottom-number .operator{text-align:center!important;letter-spacing:0!important}.math-grid .bottom-number .digit-value{justify-self:end!important}.math-grid .operation-rule{display:block!important;width:116px!important;max-width:116px!important;margin-top:5px!important}.math-grid .answer-space{display:none!important}@media print{h1{letter-spacing:-.02em}.worksheet-header{break-inside:avoid;page-break-inside:avoid}.text-exercise,.reading-question{break-inside:avoid;page-break-inside:avoid}.reading-sheet{break-inside:avoid;page-break-inside:avoid}.copying-sheet{break-inside:avoid;page-break-inside:avoid}p,h1,h2,h3,h4{orphans:3;widows:3}}</style>';
  const screenLayout = '<style>body{width:210mm!important;min-width:210mm!important;max-width:210mm!important;padding:13mm 12mm!important;overflow:visible!important}.worksheet-header{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:18px!important}.worksheet-header>div:first-child{flex:1}.worksheet-header>div{white-space:nowrap!important}.worksheet-header strong{color:#315c9b!important}.math-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:repeat(5,minmax(0,1fr))!important;gap:0 22px!important;min-height:246mm!important;align-items:center!important}.math-grid .arithmetic{min-height:0!important;justify-content:center!important}.math-grid .operation{display:block!important;flex:0 0 116px!important;width:116px!important;min-width:116px!important;max-width:116px!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important;font-size:17px!important;line-height:1.15!important}.math-grid .extra-number{display:grid!important;grid-template-columns:18px 1fr!important;gap:0!important;white-space:nowrap!important}.math-grid .extra-number .operator{text-align:center!important}.math-grid .extra-number .digit-value{justify-self:end!important}.math-grid .print-row .number{display:none!important}.math-grid .answer-space{display:block!important;height:20px!important;border-bottom:1px solid #9aaabd!important}@media(max-width:650px){body{padding:18px 14px!important}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0 22px!important}}</style>';
  const finalPdfLayout = '<style>.math-grid{min-height:198mm!important}</style>';
  const preparePrint = html => {
    const inlineLayout = html
      .replace('<body>', '<body style="margin:0;background:#fff;color:#20283f;font-family:Arial,Helvetica,sans-serif;width:210mm;min-height:297mm;padding:13mm 12mm;box-sizing:border-box;overflow:visible;-webkit-print-color-adjust:exact;print-color-adjust:exact">')
      .replace(/<h1>/, '<h1 style="display:block;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.2;font-weight:700;color:#20283f;margin:0 0 19px">')
      .replace(/<div class="worksheet-header">/, '<div class="worksheet-header" style="display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:0 0 24px;padding:0 8px;font:700 10px Arial,Helvetica,sans-serif;white-space:nowrap">')
      .replace(/<div class="exercise-grid math-grid">/, '<div class="exercise-grid math-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));gap:0 22px;min-height:198mm;align-items:center">')
      .replaceAll('class="print-row arithmetic arithmetic-three"', 'class="print-row arithmetic arithmetic-three" style="display:flex;align-items:center;justify-content:center;min-height:0;padding:0;break-inside:avoid"')
      .replaceAll('class="print-row arithmetic"', 'class="print-row arithmetic" style="display:flex;align-items:center;justify-content:center;min-height:0;padding:0;break-inside:avoid"')
      .replaceAll('class="operation"', 'class="operation" style="display:block;flex:0 0 116px;width:116px;min-width:116px;max-width:116px;font:700 17px/1.15 ui-monospace,SFMono-Regular,Menlo,monospace"')
      .replaceAll('class="top-number"', 'class="top-number" style="text-align:right;min-height:23px;white-space:nowrap"')
      .replaceAll('class="extra-number"', 'class="extra-number" style="display:grid;grid-template-columns:18px 1fr;gap:0;min-height:23px;white-space:nowrap"')
      .replaceAll('class="bottom-number"', 'class="bottom-number" style="display:grid;grid-template-columns:18px 1fr;gap:0;line-height:1.15;white-space:nowrap"')
      .replaceAll('class="operation-rule"', 'class="operation-rule" style="width:116px;border-bottom:1.5px solid #20283f;margin-top:5px"')
      .replaceAll('class="answer-space"', 'class="answer-space" style="display:block;height:20px;border-bottom:1px solid #9aaabd"');
    return inlineLayout
    .replace('<style>', `<style>@page{size:A4;margin:0}${simpleMath ? 'h1{display:block!important;font-size:15px;letter-spacing:0;margin:0 0 19px}.worksheet-header{display:flex!important;justify-content:space-between;gap:20px;margin-bottom:24px;padding:0 8px;border:0;font-size:10px}.worksheet-header>div:first-child{flex:1}.worksheet-header>div:last-child{min-width:72px}.worksheet-header span{min-width:100px;height:13px}.worksheet-header>div:last-child span{min-width:62px}.math-grid{grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));gap:0 22px;min-height:246mm;align-items:center;padding:0 2mm}.arithmetic{width:100%;min-height:0;justify-content:center;align-items:center;padding:0}.arithmetic-three .operation{min-height:54px}.print-row .number{display:none}.arithmetic .operation{display:block!important;flex:0 0 116px!important;width:116px!important;min-width:116px!important;max-width:116px!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:17px;line-height:1.15}.digit-value{display:inline-flex;gap:3px;letter-spacing:0}.digit-value b{letter-spacing:0}.top-number,.extra-number{padding-right:0;letter-spacing:0;font-variant-numeric:tabular-nums;white-space:nowrap;min-height:23px}.bottom-number{grid-template-columns:18px 1fr;gap:0;padding-right:0;letter-spacing:0;font-variant-numeric:tabular-nums;white-space:nowrap;line-height:1.15}.bottom-number .operator{text-align:center;letter-spacing:0}.bottom-number .digit-value{justify-self:end}.arithmetic .operation-rule{display:block!important;width:116px!important;max-width:116px!important;margin-top:5px}.answer-space{display:none}' : textStyles}`)
    .replaceAll('@media(max-width:650px)', simpleMath ? '@media print and (max-width:0px)' : '@media screen and (max-width:650px)')
    .replace('</head>', `${printPolish}${screenLayout}${finalPdfLayout}</head>`);
  };
  const worksheet = preparePrint(printableHtml(config, items, false));
  const answerSheet = preparePrint(printableHtml(config, items, true));
  const print = html => {
    const frame = document.createElement('iframe');
    frame.title = 'Ficha preparada para imprimir';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;';
    const removeFrame = () => { if (frame.isConnected) frame.remove(); };
    try {
      document.body.appendChild(frame);
      const printWindow = frame.contentWindow;
      const printDocument = frame.contentDocument;
      if (!printWindow || !printDocument) { removeFrame(); return false; }
      printDocument.open();
      printDocument.write(html);
      printDocument.close();
      printWindow.addEventListener('afterprint', removeFrame, { once: true });
      setTimeout(() => {
        try { printWindow.focus(); printWindow.print(); }
        catch (error) { removeFrame(); }
      }, 250);
      setTimeout(removeFrame, 300000);
      return true;
    } catch (error) {
      removeFrame();
      return false;
    }
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
  const contentSummary = config.type === 'copiado'
    ? `${config.paragraphs} ${config.paragraphs === 1 ? 'párrafo' : 'párrafos'}`
    : config.type === 'lectura' ? '1 lectura' : `${config.count} ejercicios`;
  result.innerHTML = `<div class="success-box"><strong>${printed ? 'Ficha lista para imprimir' : 'Permite las ventanas emergentes'}</strong><span class="print-hint">${printed ? `${labels[config.type]} · ${contentSummary}` : 'El navegador ha bloqueado la ventana de impresión.'}</span>${config.solutions ? '<button class="solutions-link" id="print-solutions" type="button">Imprimir soluciones</button>' : ''}</div>`;
  document.querySelector('#print-solutions')?.addEventListener('click', () => print(answerSheet));
});
