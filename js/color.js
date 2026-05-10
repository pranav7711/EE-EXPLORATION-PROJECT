// ══════════════════════════════════════════════════════
//  VisionCheck — color.js
//  Color Blindness Test Logic
// ══════════════════════════════════════════════════════

const PLATES = [
  { answer:'12', bgHue:30,  fgHue:100, label:'Plate 1 — Demonstration'    },
  { answer:'8',  bgHue:355, fgHue:100, label:'Plate 2 — Red/Green Check'   },
  { answer:'6',  bgHue:120, fgHue:0,   label:'Plate 3 — Red/Green Check'   },
  { answer:'29', bgHue:200, fgHue:50,  label:'Plate 4 — Blue/Yellow Check'  },
  { answer:'57', bgHue:30,  fgHue:200, label:'Plate 5 — Demonstration'     },
  { answer:'5',  bgHue:0,   fgHue:130, label:'Plate 6 — Red/Green Check'   },
];

let currentPlate = 0;
let correctCount = 0;
let userAnswers  = [];

// ── Seedable RNG ──────────────────────────────────────
function rng32(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Digit pixel maps ──────────────────────────────────
const DM = {
  '0':['0111100','1000010','1000110','1001010','1010010','1100010','0111100'],
  '1':['0010000','0110000','0010000','0010000','0010000','0010000','0111000'],
  '2':['0111100','1000010','0000010','0001100','0110000','1000000','1111110'],
  '3':['0111100','1000010','0000010','0011100','0000010','1000010','0111100'],
  '4':['0001000','0011000','0101000','1001000','1111110','0001000','0001000'],
  '5':['1111110','1000000','1111100','0000010','0000010','1000010','0111100'],
  '6':['0111100','1000000','1000000','1111100','1000010','1000010','0111100'],
  '7':['1111110','0000010','0000100','0001000','0010000','0010000','0010000'],
  '8':['0111100','1000010','1000010','0111100','1000010','1000010','0111100'],
  '9':['0111100','1000010','1000010','0111110','0000010','0000010','0111100'],
};

function getDigitDots(numStr, cx, cy, size) {
  const digits = numStr.split('');
  const sp = size / (digits.length * 7 + (digits.length - 1) * 1.5);
  const cw = 7 * sp, gap = sp * 1.5;
  const tw = digits.length * cw + (digits.length - 1) * gap;
  const sx = cx - tw / 2, sy = cy - (7 * sp) / 2;
  const pts = [];
  digits.forEach((d, di) => {
    const map = DM[d] || DM['0'];
    const ox  = sx + di * (cw + gap);
    for (let r = 0; r < map.length; r++)
      for (let c = 0; c < map[r].length; c++)
        if (map[r][c] === '1') pts.push([ox + c * sp + sp / 2, sy + r * sp + sp / 2]);
  });
  return pts;
}

// ── Draw Ishihara-style plate on canvas ───────────────
function drawPlate(canvas, p) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, R = W / 2;
  const bg = rng32(p.bgHue * 17 + p.fgHue + 42);
  const fg = rng32(p.fgHue * 31 + p.bgHue + 99);
  const dr = W * 0.048;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, Math.PI * 2); ctx.clip();

  ctx.fillStyle = `hsl(${p.bgHue},15%,20%)`; ctx.fillRect(0, 0, W, H);

  // Background dots
  const placed = [];
  for (let i = 0; i < 600; i++) {
    const x = bg() * W, y = bg() * H;
    if (Math.hypot(x - cx, y - cy) + dr > R - 4) continue;
    let ok = true;
    for (const d of placed) if (Math.hypot(x - d[0], y - d[1]) < dr * 1.2) { ok = false; break; }
    if (!ok) continue;
    const r2 = dr * (0.5 + bg() * 0.9);
    ctx.beginPath(); ctx.arc(x, y, r2, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${p.bgHue + (bg()-0.5)*45},${48+bg()*28}%,${35+bg()*30}%)`;
    ctx.fill();
    placed.push([x, y]);
  }

  // Foreground number dots
  getDigitDots(p.answer, cx, cy, W * 0.58).forEach(([nx, ny]) => {
    const jx = nx + (fg() - 0.5) * dr;
    const jy = ny + (fg() - 0.5) * dr;
    const nr = dr * (0.6 + fg() * 0.7);
    ctx.beginPath(); ctx.arc(jx, jy, nr, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${p.fgHue + (fg()-0.5)*30},${62+fg()*22}%,${44+fg()*22}%)`;
    ctx.fill();
  });

  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, R - 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 3; ctx.stroke();
}

// ── Load plate ────────────────────────────────────────
function loadPlate(i) {
  const plate = PLATES[i];
  const pct   = Math.round((i / PLATES.length) * 100);

  document.getElementById('question-label').textContent  = plate.label;
  document.getElementById('progress-fill').style.width   = pct + '%';
  document.getElementById('progress-label').textContent  = `Plate ${i + 1} of ${PLATES.length}`;
  document.getElementById('progress-pct').textContent    = pct + '%';

  const wrap = document.getElementById('plate-wrap');
  wrap.classList.add('switching');
  setTimeout(() => {
    drawPlate(document.getElementById('plate-canvas'), plate);
    wrap.classList.remove('switching');
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('answer-input').focus();
  }, 220);
}

// ── Submit answer ─────────────────────────────────────
function submitAnswer(cantSee) {
  const plate   = PLATES[currentPlate];
  const raw     = cantSee ? '' : document.getElementById('answer-input').value.trim();
  const isRight = raw.toUpperCase() === plate.answer.toUpperCase();

  userAnswers.push({ plate: currentPlate, userAnswer: raw, correct: isRight });
  if (isRight) correctCount++;

  const fb = document.getElementById('feedback');
  fb.textContent = isRight ? '✓ Correct!' : '✗ Incorrect';
  fb.className   = 'feedback show ' + (isRight ? 'correct' : 'wrong');

  setTimeout(() => {
    currentPlate++;
    currentPlate < PLATES.length ? loadPlate(currentPlate) : showResults();
  }, 650);
}

// ── Show results ──────────────────────────────────────
function showResults() {
  document.getElementById('progress-fill').style.width = '100%';
  document.getElementById('progress-pct').textContent  = '100%';
  document.getElementById('test-card').style.display        = 'none';
  document.getElementById('instruction-card').style.display = 'none';

  const wrong = PLATES.length - correctCount;
  const pct   = Math.round((correctCount / PLATES.length) * 100);

  let status, cls, icon, heading, msg;
  if (wrong === 0) {
    status='No Color Blindness Detected'; cls='status-normal'; icon='✅';
    heading='Excellent Color Vision!';
    msg='You correctly identified all plates. Your color vision appears normal.';
  } else if (wrong <= 2) {
    status='Possible Mild Color Deficiency'; cls='status-mild'; icon='⚠️';
    heading='Mild Deficiency Possible';
    msg=`You missed ${wrong} plate(s). This may indicate a mild color vision deficiency.`;
  } else {
    status='Significant Color Blindness Detected'; cls='status-significant'; icon='🔴';
    heading='Color Vision Issue Detected';
    msg=`You missed ${wrong} plates. Please visit an eye care professional.`;
  }

  document.getElementById('result-icon').textContent    = icon;
  document.getElementById('result-heading').textContent = heading;
  document.getElementById('result-message').textContent = msg;
  document.getElementById('result-status-badge').innerHTML =
    `<span class="result-status ${cls}">${status}</span>`;
  document.getElementById('score-correct').textContent = correctCount;
  document.getElementById('score-wrong').textContent   = wrong;
  document.getElementById('score-pct').textContent     = pct + '%';

  localStorage.setItem('colorScore', JSON.stringify({
    status, correct: correctCount, wrong, pct, answers: userAnswers
  }));

  document.getElementById('results-view').style.display = 'flex';
}

// ── Events ────────────────────────────────────────────
document.getElementById('submit-btn').addEventListener('click', () => {
  if (document.getElementById('answer-input').value.trim()) submitAnswer(false);
});

document.getElementById('cant-see-btn').addEventListener('click', () => submitAnswer(true));

document.getElementById('answer-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.value.trim()) submitAnswer(false);
});

// ── Init ──────────────────────────────────────────────
loadPlate(0);
