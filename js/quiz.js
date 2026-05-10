// ══════════════════════════════════════════════════════
//  VisionCheck — quiz.js
//  Eye Strain Quiz Logic
// ══════════════════════════════════════════════════════

const QUESTIONS = [
  {
    id: 1, category: 'Screen Time',
    text: 'How many hours per day do you spend on screens (phone, laptop, TV combined)?',
    options: [
      { label:'Less than 2 hours', desc:'Minimal screen exposure',          pts:0, emoji:'😎' },
      { label:'2 – 4 hours',       desc:'Moderate — within healthy range',  pts:1, emoji:'🙂' },
      { label:'4 – 6 hours',       desc:'Above average exposure',           pts:2, emoji:'😐' },
      { label:'6+ hours',          desc:'High daily screen exposure',       pts:3, emoji:'😬' },
    ]
  },
  {
    id: 2, category: 'Breaks',
    text: 'Do you take a break every 20 minutes using the 20-20-20 rule?',
    options: [
      { label:'Always',    desc:'Great habit — eyes get regular rest', pts:0, emoji:'✅' },
      { label:'Sometimes', desc:'Inconsistent — could improve',        pts:1, emoji:'🔄' },
      { label:'Rarely',    desc:'Eyes are under extended strain',      pts:2, emoji:'⚠️' },
      { label:'Never',     desc:'No break habit — high strain risk',   pts:3, emoji:'🚫' },
    ]
  },
  {
    id: 3, category: 'Symptoms',
    text: 'How often do you experience headaches or eye fatigue after using screens?',
    options: [
      { label:'Never',     desc:'No symptoms — good sign',          pts:0, emoji:'💚' },
      { label:'Rarely',    desc:'Occasional — likely not serious',  pts:1, emoji:'🟡' },
      { label:'Sometimes', desc:'Regular symptoms — worth noting',  pts:2, emoji:'🟠' },
      { label:'Often',     desc:'Frequent — consult an eye doctor', pts:3, emoji:'🔴' },
    ]
  },
  {
    id: 4, category: 'Brightness',
    text: 'How do you typically set your screen brightness?',
    options: [
      { label:'Auto / Low',     desc:'Easy on the eyes',               pts:0, emoji:'🌙' },
      { label:'Medium',         desc:'Acceptable in most conditions',  pts:1, emoji:'🔆' },
      { label:'High',           desc:'Can cause glare and strain',     pts:2, emoji:'☀️' },
      { label:'Maximum always', desc:'Significant strain risk',        pts:3, emoji:'🔥' },
    ]
  },
  {
    id: 5, category: 'Environment',
    text: 'How often do you use screens in complete darkness or very low lighting?',
    options: [
      { label:'Never',     desc:'Good — balanced lighting is ideal',       pts:0, emoji:'✅' },
      { label:'Rarely',    desc:'Occasionally — try to avoid it',          pts:1, emoji:'🌆' },
      { label:'Sometimes', desc:'Moderate risk — eyes work much harder',   pts:2, emoji:'🌃' },
      { label:'Always',    desc:'High risk — strong contrast strains eyes', pts:3, emoji:'🌑' },
    ]
  },
];

const TIPS = {
  high_screen: { icon:'⏱️', title:'Reduce Total Screen Time',     text:'Try the <strong>Pomodoro technique</strong> — 25 min work, 5 min break. Aim to keep daily screen use under 6 hours.' },
  breaks:      { icon:'👁️', title:'Start the 20-20-20 Rule',     text:'Every 20 minutes, look at something <strong>20 feet away for 20 seconds</strong>. Set a phone reminder.' },
  symptoms:    { icon:'🩺', title:'Address Existing Symptoms',    text:'Frequent headaches after screen use is a sign of <strong>Computer Vision Syndrome</strong>. See an optometrist.' },
  brightness:  { icon:'🌙', title:'Enable Night Mode',            text:'Use <strong>Night Mode</strong> after sunset and set brightness to auto to reduce blue light exposure.' },
  dark:        { icon:'💡', title:'Avoid Screens in Darkness',    text:'High contrast between a bright screen and dark room <strong>forces pupils to constantly adjust</strong>. Use a dim lamp.' },
  good:        { icon:'🌿', title:'Keep Up the Good Habits',      text:'Your screen habits are healthy. Maintain regular <strong>yearly eye checkups</strong>.' },
};

// ── State ─────────────────────────────────────────────
let currentQ   = 0;
let answers    = new Array(QUESTIONS.length).fill(null);

// ── Build step dots ───────────────────────────────────
function buildStepDots() {
  const wrap = document.getElementById('step-dots');
  wrap.innerHTML = '';
  QUESTIONS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'step-dot' + (i === 0 ? ' active' : '');
    d.id = 'sdot-' + i;
    wrap.appendChild(d);
  });
}

function updateStepDots(index) {
  QUESTIONS.forEach((_, i) => {
    const d = document.getElementById('sdot-' + i);
    d.className = 'step-dot';
    if (i < index)   d.classList.add('done');
    if (i === index) d.classList.add('active');
  });
}

// ── Render question ───────────────────────────────────
function renderQuestion(index) {
  const q    = QUESTIONS[index];
  const card = document.getElementById('quiz-card');

  card.classList.add('slide-out');

  setTimeout(() => {
    document.getElementById('q-number').textContent   = 'Q' + q.id;
    document.getElementById('q-category').textContent = q.category;
    document.getElementById('question-text').textContent = q.text;

    const list = document.getElementById('options-list');
    list.innerHTML = '';
    q.options.forEach((opt, oi) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn' + (answers[index] === oi ? ' selected' : '');
      btn.innerHTML = `
        <div class="opt-radio"></div>
        <div class="opt-content">
          <span class="opt-label">${opt.label}</span>
          <span class="opt-desc">${opt.desc}</span>
        </div>
        <span class="opt-emoji">${opt.emoji}</span>
      `;
      btn.addEventListener('click', () => selectOption(index, oi, btn));
      list.appendChild(btn);
    });

    const pct = Math.round((index / QUESTIONS.length) * 100);
    document.getElementById('progress-fill').style.width  = pct + '%';
    document.getElementById('progress-label').textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
    document.getElementById('progress-pct').textContent   = pct + '%';

    const preview = document.getElementById('score-preview');
    if (index > 0) {
      preview.style.display = 'flex';
      document.getElementById('score-preview-val').textContent = calcScore() + ' / 15';
    } else {
      preview.style.display = 'none';
    }

    document.getElementById('back-btn').style.visibility = index === 0 ? 'hidden' : 'visible';

    const nextBtn = document.getElementById('next-btn');
    nextBtn.textContent = index === QUESTIONS.length - 1 ? 'See Results →' : 'Next →';
    answers[index] !== null ? nextBtn.classList.add('active') : nextBtn.classList.remove('active');

    updateStepDots(index);

    card.classList.remove('slide-out');
    card.classList.add('slide-in');
    setTimeout(() => card.classList.remove('slide-in'), 300);
  }, 200);
}

// ── Select option ─────────────────────────────────────
function selectOption(qIndex, optIndex, clickedBtn) {
  answers[qIndex] = optIndex;
  document.querySelectorAll('#options-list .option-btn').forEach(b => b.classList.remove('selected'));
  clickedBtn.classList.add('selected');
  document.getElementById('next-btn').classList.add('active');
  if (qIndex > 0) document.getElementById('score-preview-val').textContent = calcScore() + ' / 15';
}

function calcScore() {
  return answers.reduce((sum, a, i) => sum + (a !== null ? QUESTIONS[i].options[a].pts : 0), 0);
}

// ── Navigation ────────────────────────────────────────
function nextQuestion() {
  if (answers[currentQ] === null) return;
  currentQ < QUESTIONS.length - 1 ? (currentQ++, renderQuestion(currentQ)) : showResults();
}

function prevQuestion() {
  if (currentQ > 0) { currentQ--; renderQuestion(currentQ); }
}

// ── Show results ──────────────────────────────────────
function showResults() {
  const totalScore = calcScore();

  document.getElementById('progress-fill').style.width  = '100%';
  document.getElementById('progress-pct').textContent   = '100%';
  document.getElementById('progress-label').textContent = 'Complete!';
  document.getElementById('quiz-card').style.display    = 'none';
  document.getElementById('step-dots').style.display    = 'none';

  let level, cls, icon, heading, msg;
  if (totalScore <= 4) {
    level='Low Risk';    cls='status-low';    icon='✅';
    heading='Great Eye Habits!';
    msg='Your screen habits are healthy. Keep maintaining good routines.';
  } else if (totalScore <= 9) {
    level='Medium Risk'; cls='status-medium'; icon='⚠️';
    heading='Some Strain Risk Detected';
    msg='A few habits are putting your eyes under extra stress. Small changes can help significantly.';
  } else {
    level='High Risk';   cls='status-high';   icon='🔴';
    heading='High Eye Strain Risk';
    msg='Your current screen habits are likely causing significant eye strain. Please adjust your routine.';
  }

  document.getElementById('result-icon').textContent    = icon;
  document.getElementById('result-heading').textContent = heading;
  document.getElementById('result-message').textContent = msg;
  document.getElementById('result-status-badge').innerHTML =
    `<span class="result-status ${cls}">${level}</span>`;

  // Animate score ring
  document.getElementById('ring-score').textContent = totalScore;
  const ringEl = document.getElementById('ring-fill');
  ringEl.style.stroke = totalScore <= 4 ? '#00e5c3' : totalScore <= 9 ? '#ffc107' : '#ff6b6b';
  setTimeout(() => { ringEl.style.strokeDashoffset = 314 - (314 * totalScore / 15); }, 100);

  // Tips
  const tipsList = document.getElementById('tips-list');
  tipsList.innerHTML = '';
  const toShow = [];
  answers.forEach((a, i) => {
    const pts = QUESTIONS[i].options[a].pts;
    if (i === 0 && pts >= 2) toShow.push(TIPS.high_screen);
    if (i === 1 && pts >= 1) toShow.push(TIPS.breaks);
    if (i === 2 && pts >= 2) toShow.push(TIPS.symptoms);
    if (i === 3 && pts >= 2) toShow.push(TIPS.brightness);
    if (i === 4 && pts >= 2) toShow.push(TIPS.dark);
  });
  if (toShow.length === 0) toShow.push(TIPS.good);
  const seen = new Set();
  toShow.filter(t => !seen.has(t.icon) && seen.add(t.icon)).slice(0, 4).forEach(tip => {
    tipsList.innerHTML += `
      <div class="tip-item">
        <span class="tip-icon">${tip.icon}</span>
        <div class="tip-text"><strong>${tip.title}:</strong> ${tip.text}</div>
      </div>`;
  });

  // Answer review
  const reviewList = document.getElementById('review-list');
  reviewList.innerHTML = '';
  answers.forEach((a, i) => {
    const opt = QUESTIONS[i].options[a];
    reviewList.innerHTML += `
      <div class="review-row">
        <span class="review-q">${QUESTIONS[i].text}</span>
        <span class="review-a">${opt.label}<span class="pts-chip pts-${opt.pts}">+${opt.pts}</span></span>
      </div>`;
  });

  // Save to localStorage
  localStorage.setItem('quizScore', JSON.stringify({
    level, score: totalScore, maxScore: 15,
    pct: Math.round((totalScore / 15) * 100),
    answers: answers.map((a, i) => ({
      question: QUESTIONS[i].text,
      answer:   QUESTIONS[i].options[a].label,
      pts:      QUESTIONS[i].options[a].pts,
    }))
  }));

  document.getElementById('results-view').style.display = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Expose nav functions to HTML ──────────────────────
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;

// ── Init ──────────────────────────────────────────────
buildStepDots();
renderQuestion(0);
