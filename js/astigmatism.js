// ══════════════════════════════════════════════════════
//  VisionCheck — astigmatism.js
//  Astigmatism Test Logic
// ══════════════════════════════════════════════════════

let currentRound = 0;
const answers    = [];
let selectedValue = null;

const LABELS       = ['Round 1 of 2 — Left Eye', 'Round 2 of 2 — Right Eye'];
const CHART_LABELS = ['Eye 1 — Focus on the center dot', 'Eye 2 — Focus on the center dot'];

const DIRECTION_LABELS = {
  'horizontal':     'Horizontal Astigmatism',
  'vertical':       'Vertical Astigmatism',
  'diagonal-right': 'Oblique Astigmatism (↘)',
  'diagonal-left':  'Oblique Astigmatism (↗)',
  'none':           'Not Detected',
};

// ── Draw radial spoke chart ───────────────────────────
function drawAstigChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx    = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, r = W * 0.44;

  ctx.clearRect(0, 0, W, H);

  // Background circle
  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1120'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

  // Subtle rings
  [r * 0.35, r * 0.65, r].forEach(ring => {
    ctx.beginPath(); ctx.arc(cx, cy, ring, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.stroke();
  });

  // Radial spokes — every 15°
  for (let angle = 0; angle < 180; angle += 15) {
    const rad = (angle * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx - r * Math.cos(rad), cy - r * Math.sin(rad));
    ctx.lineTo(cx + r * Math.cos(rad), cy + r * Math.sin(rad));
    ctx.strokeStyle = '#e8edf2'; ctx.lineWidth = 1.4; ctx.stroke();
  }

  // Degree labels
  const DEG = ['0°','30°','60°','90°','120°','150°'];
  ctx.font = '500 10px DM Sans, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  DEG.forEach((lbl, i) => {
    const a = (i * 30 * Math.PI) / 180;
    ctx.fillText(lbl, cx + (r + 26) * Math.cos(a), cy - (r + 26) * Math.sin(a));
  });

  // Center dot
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#00e5c3'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,229,195,0.3)'; ctx.lineWidth = 2; ctx.stroke();
}

// ── Select option ─────────────────────────────────────
function selectOption(btn) {
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('none-btn').classList.remove('selected');
  btn.classList.add('selected');
  selectedValue = btn.dataset.value;
  document.getElementById('next-btn').classList.add('active');
}

function selectNone() {
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('none-btn').classList.add('selected');
  selectedValue = 'none';
  document.getElementById('next-btn').classList.add('active');
}

// ── Next round ────────────────────────────────────────
function nextRound() {
  if (selectedValue === null) return;
  answers.push(selectedValue);

  if (currentRound === 0) {
    currentRound = 1;
    selectedValue = null;

    document.getElementById('progress-label').textContent = LABELS[1];
    document.getElementById('progress-pct').textContent   = '50%';
    document.getElementById('progress-fill').style.width  = '50%';
    document.getElementById('chart-label').textContent    = CHART_LABELS[1];

    document.getElementById('step-0').classList.remove('active');
    document.getElementById('step-0').classList.add('done');
    document.getElementById('step-1').classList.add('active');

    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('none-btn').classList.remove('selected');
    document.getElementById('next-btn').classList.remove('active');
    document.getElementById('next-btn').textContent = 'See Results →';

    drawAstigChart('astig-canvas');
  } else {
    answers.push(selectedValue);
    showResults();
  }
}

// ── Show results ──────────────────────────────────────
function showResults() {
  document.getElementById('progress-fill').style.width  = '100%';
  document.getElementById('progress-pct').textContent   = '100%';
  document.getElementById('progress-label').textContent = 'Complete';
  document.getElementById('test-card').style.display        = 'none';
  document.getElementById('instruction-card').style.display = 'none';

  const eye1    = answers[0];
  const eye2    = answers[1];
  const noAstig = eye1 === 'none' && eye2 === 'none';
  const bothSame = eye1 === eye2 && eye1 !== 'none';

  let status, cls, icon, heading, msg, overall;

  if (noAstig) {
    status='No Astigmatism Detected'; cls='status-none'; icon='✅';
    heading='Clear Vision Pattern';
    msg='All lines appeared equally dark — a good sign that astigmatism is unlikely.';
    overall='No Astigmatism Detected';
  } else if (bothSame) {
    status='Astigmatism Possible'; cls='status-detected'; icon='⚠️';
    heading='Consistent Pattern Detected';
    msg=`Both eyes showed darker lines in the same direction (${DIRECTION_LABELS[eye1]}). Please consult an eye specialist.`;
    overall=DIRECTION_LABELS[eye1];
  } else if (eye1 === 'none' || eye2 === 'none') {
    status='Astigmatism Possible (One Eye)'; cls='status-detected'; icon='⚠️';
    heading='One Eye May Be Affected';
    msg='One eye showed a clear line preference while the other did not.';
    overall=eye1 !== 'none' ? `Left: ${DIRECTION_LABELS[eye1]}` : `Right: ${DIRECTION_LABELS[eye2]}`;
  } else {
    status='Mixed Pattern — Astigmatism Possible'; cls='status-detected'; icon='⚠️';
    heading='Different Pattern in Each Eye';
    msg='Each eye showed a different line preference. We recommend a full refraction test.';
    overall='Bilateral — Different Axes';
  }

  document.getElementById('result-icon').textContent    = icon;
  document.getElementById('result-heading').textContent = heading;
  document.getElementById('result-message').textContent = msg;
  document.getElementById('result-status-badge').innerHTML =
    `<span class="result-status ${cls}">${status}</span>`;
  document.getElementById('eye1-result').textContent     = DIRECTION_LABELS[eye1];
  document.getElementById('eye2-result').textContent     = DIRECTION_LABELS[eye2];
  document.getElementById('overall-result').textContent  = overall;

  localStorage.setItem('astigScore', JSON.stringify({
    status, eye1, eye2, overall, detected: !noAstig
  }));

  document.getElementById('results-view').style.display = 'flex';
}

// ── Expose functions to HTML onclick attributes ───────
window.selectOption = selectOption;
window.selectNone   = selectNone;
window.nextRound    = nextRound;

// ── Init ──────────────────────────────────────────────
drawAstigChart('astig-canvas');
document.getElementById('progress-label').textContent = LABELS[0];
