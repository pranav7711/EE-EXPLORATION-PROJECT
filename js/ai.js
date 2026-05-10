const GEMINI_API_KEY = 'AIzaSyAS0O31dpl12AppI43ztLZmQ9GHRbPhglk';

async function getAIAdvice() {
  const acuity = JSON.parse(localStorage.getItem('acuityScore') || 'null');
  const color  = JSON.parse(localStorage.getItem('colorScore')  || 'null');
  const astig  = JSON.parse(localStorage.getItem('astigScore')  || 'null');
  const quiz   = JSON.parse(localStorage.getItem('quizScore')   || 'null');

  const acuityStr = acuity ? `Visual Acuity: ${acuity.rating || 'Unknown'}` : 'Visual Acuity: Not tested';
  const colorStr  = color  ? `Color Vision: ${color.wrong === 0 ? 'Normal' : color.wrong <= 2 ? 'Possible mild deficiency' : 'Significant deficiency detected'} (${color.correct} of ${color.correct + color.wrong} plates correct)` : 'Color Vision: Not tested';
  const astigStr  = astig  ? `Astigmatism: ${astig.detected ? astig.overall : 'Not detected'}` : 'Astigmatism: Not tested';
  const quizStr   = quiz   ? `Eye Strain Risk: ${quiz.level} (score ${quiz.score}/15)` : 'Eye Strain: Not tested';

  const prompt = `You are an eye health advisor. A user completed a browser-based vision screening with these results:

${acuityStr}
${colorStr}
${astigStr}
${quizStr}

Give exactly 4 specific, actionable eye health tips tailored to these results.
Format your response as exactly 4 tips, each on a new line starting with a number and period (1. 2. 3. 4.).
Keep each tip under 2 sentences. Be specific to their results, not generic.
Do not recommend replacing a professional eye exam. Do not use markdown or asterisks.`;

  const response = await fetch(
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!text) throw new Error('Empty response from Gemini');

  const tips = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\./.test(line))
    .map(line => line.replace(/^\d+\.\s*/, ''));

  return tips;
}

async function renderAIAdvice(loadingId, contentId, errorId) {
  const loadingEl = document.getElementById(loadingId);
  const contentEl = document.getElementById(contentId);
  const errorEl   = document.getElementById(errorId);

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    loadingEl.style.display = 'none';
    errorEl.style.display   = 'block';
    errorEl.innerHTML = `<strong>⚠️ API key not set.</strong><br>Open <code>js/ai.js</code> and replace the placeholder with your key from <a href="https://aistudio.google.com" target="_blank">aistudio.google.com</a>.`;
    return;
  }

  try {
    const tips = await getAIAdvice();
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    if (tips.length >= 2) {
      contentEl.innerHTML = tips.map((tip, i) => {
        const parts     = tip.split(':');
        const formatted = parts.length > 1
          ? `<strong>${parts[0]}:</strong>${parts.slice(1).join(':')}`
          : tip;
        return `<div class="ai-tip"><div class="ai-tip-num">${i + 1}</div><div class="ai-tip-text">${formatted}</div></div>`;
      }).join('');
    } else {
      contentEl.innerHTML = `<p style="color:var(--text-dim);line-height:1.7">${tips.join(' ')}</p>`;
    }

  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.style.display   = 'block';
    errorEl.textContent     = `⚠️ Could not load AI advice: ${err.message}. Check your API key and internet connection.`;
  }
}
