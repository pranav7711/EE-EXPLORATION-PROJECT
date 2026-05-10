// ══════════════════════════════════════════════════════
//  VisionCheck — acuity.js
//  Visual Acuity Test Logic
// ══════════════════════════════════════════════════════

const CHART_ROWS = [
  { size: 48, letters: 'E',        level: '20/200' },
  { size: 36, letters: 'FP',       level: '20/100' },
  { size: 28, letters: 'TOZ',      level: '20/70'  },
  { size: 22, letters: 'LPED',     level: '20/50'  },
  { size: 17, letters: 'PECFD',    level: '20/40'  },
  { size: 13, letters: 'EDFCZP',   level: '20/30'  },
  { size: 11, letters: 'FELOPZD',  level: '20/25'  },
  { size: 9,  letters: 'DEFPOTEC', level: '20/20'  },
];

let currentRow = 0;
let score      = 0;

// ── DOM refs ──────────────────────────────────────────
const lettersEl   = document.getElementById('letters');
const inputEl     = document.getElementById('answer-input');
const feedbackEl  = document.getElementById('feedback');
const progressFill= document.getElementById('progress-fill');
const progressLbl = document.getElementById('progress-label');
const progressPct = document.getElementById('progress-pct');

// ── Show a row ────────────────────────────────────────
function showRow(index) {
  const row = CHART_ROWS[index];
  lettersEl.textContent  = row.letters;
  lettersEl.style.fontSize = row.size + 'px';

  const pct = Math.round((index / CHART_ROWS.length) * 100);
  progressFill.style.width = pct + '%';
  progressLbl.textContent  = `Row ${index + 1} of ${CHART_ROWS.length}`;
  progressPct.textContent  = pct + '%';

  inputEl.value = '';
  feedbackEl.className = 'feedback';
  inputEl.focus();
}

// ── Check answer ──────────────────────────────────────
function checkAnswer(userInput) {
  const correct = CHART_ROWS[currentRow].letters;
  const isRight = userInput.toUpperCase().trim() === correct;

  if (isRight) score++;

  feedbackEl.textContent = isRight ? '✓ Correct!' : `✗ It was: ${correct}`;
  feedbackEl.className   = 'feedback show ' + (isRight ? 'correct' : 'wrong');

  currentRow++;

  setTimeout(() => {
    if (currentRow < CHART_ROWS.length) {
      showRow(currentRow);
    } else {
      showResult();
    }
  }, 600);
}

// ── Calculate result ──────────────────────────────────
function showResult() {
  progressFill.style.width = '100%';
  progressPct.textContent  = '100%';

  let rating, percentage;

  if      (score >= 8) { rating = '20/20';  percentage = 100; }
  else if (score >= 7) { rating = '20/25';  percentage = 90;  }
  else if (score >= 6) { rating = '20/30';  percentage = 78;  }
  else if (score >= 5) { rating = '20/40';  percentage = 65;  }
  else if (score >= 4) { rating = '20/50';  percentage = 50;  }
  else if (score >= 3) { rating = '20/70';  percentage = 35;  }
  else if (score >= 2) { rating = '20/100'; percentage = 20;  }
  else                 { rating = '20/200'; percentage = 10;  }

  // Save to localStorage
  localStorage.setItem('acuityScore', JSON.stringify({
    rating,
    percentage,
    score,
    maxScore: CHART_ROWS.length,
    testDate: new Date().toISOString()
  }));

  // Update result UI
  document.getElementById('test-card').style.display        = 'none';
  document.getElementById('instruction-card').style.display = 'none';

  document.getElementById('result-icon').textContent    = percentage >= 90 ? '✅' : percentage >= 60 ? '⚠️' : '🔴';
  document.getElementById('result-heading').textContent = percentage >= 90 ? 'Excellent Vision!' : percentage >= 60 ? 'Below Average' : 'Poor Vision';
  document.getElementById('acuity-val').textContent     = rating;
  document.getElementById('score-correct').textContent  = score;
  document.getElementById('score-wrong').textContent    = CHART_ROWS.length - score;
  document.getElementById('score-pct').textContent      = percentage + '%';

  const statusEl = document.getElementById('result-status-badge');
  if (percentage >= 90) {
    statusEl.innerHTML = `<span class="result-status status-normal">Normal Vision — ${rating}</span>`;
  } else if (percentage >= 60) {
    statusEl.innerHTML = `<span class="result-status status-mild">Reduced Vision — ${rating}</span>`;
  } else {
    statusEl.innerHTML = `<span class="result-status status-significant">Poor Vision — ${rating}</span>`;
  }

  document.getElementById('result-message').textContent =
    percentage >= 90 ? 'Your visual acuity is normal. Great job!' :
    percentage >= 60 ? 'Your vision is slightly below normal. Consider an eye check.' :
    'Your vision appears significantly reduced. Please see an eye specialist.';

  document.getElementById('results-view').style.display = 'flex';
}

// ── Events ────────────────────────────────────────────
document.getElementById('submit-btn').addEventListener('click', () => {
  if (inputEl.value.trim()) checkAnswer(inputEl.value);
});

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && inputEl.value.trim()) checkAnswer(inputEl.value);
});

// ── Init ──────────────────────────────────────────────
showRow(0);
