const app = document.getElementById('app');
const NAV = [['/records', 'Records'], ['/assignments', 'Assignments'], ['/capstone', 'Capstone'], ['/companies', 'Companies'], ['/evidence', 'Evidence'], ['/about', 'About']];
const EMAIL = '262697@astanait.edu.kz';
// Original files and the A2 video live in a public GitHub repository and are served through jsDelivr.
let FILES = null; // set from /config.json
const file = (p) => (FILES ? FILES + p : null);
const DOCS = {
  1: 'records/KNIAZEV_AIB-2602_Weekly_Record_1', 2: 'records/KNIAZEV_AIB-2602_Weekly_Record_2', 3: 'records/KNIAZEV_AIB-2602_Weekly_Record_3',
  4: 'records/KNIAZEV_AIB-2602_Weekly_Record_4', 5: 'records/KNIAZEV_AIB-2602_Weekly_Record_5',
  6: 'records/KNIAZEV_AIB-2602_Weekly_Record_6', 7: 'records/KNIAZEV_AIB-2602_Weekly_Record_7',
};
const PDF_ONLY = new Set([6, 7]); // these records are published as PDF only
const SHEETS = { 5: 'records/KNIAZEV_AIB-2602_Week5_Process_Map' };
const pdfBtn = (base, label) => (FILES && base ? `<a class="btn no-print" href="${file(base + '.pdf')}" target="_blank" rel="noopener">${label || 'Open'} PDF</a>` : '');
const dl = (base, label) => (FILES && base ? `<a class="btn no-print" href="${file(base + '.docx')}" download>${label || 'Download'} DOCX</a>${pdfBtn(base, label)}` : '');
let D = null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const STATUS = { filed: 'Filed', revision: 'In revision', upcoming: 'Upcoming', review: 'In review' };
const status = (s) => `<span class="status status--${s === 'review' ? 'revision' : s}">${STATUS[s]}</span>`;

function inline(s, mode = 'ev') {
  let h = esc(s);
  h = h.replace(/\[(\d+)(,\s*sec[^\]]*)?\]/g, (m, n) => mode === 'ev'
    ? `<a class="cite" href="/evidence#s${n}" data-link>[${n}]</a>`
    : `<a class="cite" href="#ref-${n}">[${n}]</a>`);
  h = h.replace(/\b(ADOPT|ADAPT|PILOT|DELAY|REJECT)\b/g, '<span class="verdict v-$1">$1</span>');
  return h;
}
const cell = (c, mode) => c.split('\n').map((x) => inline(x, mode)).join('<br>');
function table(rows, mode) {
  const [head, ...body] = rows;
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(head.join(', '))}"><table><thead><tr>${head.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${cell(c, mode)}</th>` : `<td>${cell(c, mode)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function blocks(list, mode = 'ev') {
  return list.map(([k, v]) => {
    if (k === 'h') {
      const m = v.match(/^(\d)\.?\s+(.*)$/);
      return m ? `<h2 class="field" id="field-${m[1]}"><span class="field__n">${m[1]}</span>${esc(m[2])}</h2>` : `<h2 class="field">${esc(v)}</h2>`;
    }
    if (k === 'h3') return `<h3>${esc(v)}</h3>`;
    if (k === 'cap') return `<p class="table-cap">${esc(v)}</p>`;
    if (k === 't') return table(v, mode);
    if (/^(Source|Sources|Basis):/.test(v)) return `<p class="note">${inline(v, mode)}</p>`;
    return `<p>${inline(v, mode)}</p>`;
  }).join('');
}
const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+?)(\.?)(\s|$)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>$2$3');

/* ---------- chrome ---------- */
function header(path, yellow) {
  return `<header class="site-header${yellow ? ' is-yellow' : ''}"><div class="wrap">
    <a class="brand" href="/" data-link><span class="brand__tag" aria-hidden="true"></span>Kniazev Daniil</a>
    <nav class="nav" aria-label="Main"><ul>${NAV.map(([h, l]) => `<li><a href="${h}" data-link${path.startsWith(h) ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul></nav>
    <button class="menu-btn" aria-expanded="false" aria-controls="menu">Menu</button>
  </div></header>
  <div class="menu" id="menu" hidden><ul><li><a href="/" data-link>Home</a></li>${NAV.map(([h, l]) => `<li><a href="${h}" data-link>${l}</a></li>`).join('')}</ul></div>`;
}
function footer() {
  return `<footer class="site-footer"><div class="wrap">
    <div class="footer__grid">
      <div><div class="footer__name">Kniazev Daniil</div>
        <p>AIB-2602, AI Business<br>Business Administration, Astana IT University, 2026–2027<br><a href="mailto:${EMAIL}">${EMAIL}</a></p></div>
      <ul class="footer__nav"><li><a href="/" data-link>Home</a></li>${NAV.map(([h, l]) => `<li><a href="${h}" data-link>${l}</a></li>`).join('')}</ul>
    </div>
    <p class="footer__small">Everything here comes from my weekly records and assignments for Business Administration.</p>
  </div></footer>`;
}
const page = (path, main, yellow = false) => `${header(path, yellow)}<main id="main">${main}</main>${footer()}`;
const phead = (crumbs, title, intro) => `<section class="phead"><div class="wrap">${crumbs ? `<p class="crumbs">${crumbs}</p>` : ''}<h1 class="h1">${title}</h1>${intro ? `<p class="intro">${intro}</p>` : ''}</div></section>`;

/* ---------- home ---------- */
function barcode(seed) {
  let x = 0, bars = '';
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    for (const w of [1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 3) % 3)]) { bars += `<rect x="${x}" y="0" width="${w}" height="46"/>`; x += w + 1 + ((c + w) % 2); }
  }
  return `<svg class="receipt__bar" viewBox="0 0 ${x} 46" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}
function receipt() {
  const filed = D.weeks.filter((w) => w.status === 'filed').length;
  const r = (a, b, href) => `<div class="receipt__row"><span>${href ? `<a href="${href}" data-link>${a}</a>` : a}</span><span>${b}</span></div>`;
  return `<div class="printer" aria-label="Portfolio receipt"><div class="printer__slot"></div><div class="printer__clip"><div class="receipt-feed"><div class="receipt">
    <div class="receipt__c">Astana IT University<br>Business Administration<br>2026–2027</div>
    <hr class="receipt__rule">
    ${r('Student', 'Kniazev Daniil')}${r('Group', 'AIB-2602')}${r('Company B', 'Magnum Cash&amp;Carry')}${r('Company A', 'Carrefour')}
    <hr class="receipt__rule">
    ${D.weeks.slice(0, 7).map((w) => r(`W${pad(w.n)} ${esc(w.short)}`, w.status === 'filed' ? 'Filed' : 'Revising', w.status === 'filed' ? `/records/week-${w.n}` : null)).join('')}
    ${r('W08–W10', 'Upcoming')}
    ${r('A1 Business report', 'Filed', '/assignments/business-report')}
    ${r('A2 Video essay', 'Filed', '/assignments/video-essay')}
    ${r('A3 Photo essay', 'Filed', '/assignments/photo-essay')}
    <hr class="receipt__rule">
    <div class="receipt__total">${r('Records filed', `${filed} / 9`)}${r('Sources in folder', D.evidence.length)}${r('Verdicts issued', 5)}</div>
    <hr class="receipt__rule">
    ${barcode('AIB2602KNIAZEVMAGNUM')}
    <div class="receipt__c">Keep this receipt<br>for the capstone</div>
  </div></div></div></div>`;
}
const VERDICTS = [
  ['Catalogue search in Kazakh and Russian', 'Carrefour launched Hopla in 2023 and later shopping through ChatGPT', [12, 19], 'ADAPT', 'Use Magnum’s catalogue, both languages and accurate availability. Keep ordinary search and staff help.'],
  ['Demand forecasting', 'Carrefour chose SAS forecasting after an 18-month test', [20], 'PILOT', 'Compare with current ordering in one category. Category managers approve every order.'],
  ['Supplier accountability', 'Carrefour Group Suppliers Ethics Charter', [21], 'ADOPT', 'Check that Magnum’s existing corporate rules shape purchasing and complaint handling.'],
  ['Personalisation from shopping histories', 'Purchase-history suggestions in Carrefour’s newer service', [19], 'DELAY', 'First establish the purpose, data handling and a benefit beyond Magnum Club offers.'],
  ['Fully autonomous order approval', 'Not documented at Carrefour; this is the boundary I set for Magnum', [], 'REJECT', 'An incorrect recommendation should not become a purchasing commitment.'],
];
function weekTag(w) {
  const inner = `<span class="ptag__clip" aria-hidden="true"></span><span class="ptag__week">Week</span><span class="ptag__n">${pad(w.n)}</span>
    <span class="ptag__title">${esc(w.short)}</span><span class="ptag__art">${esc(w.artifact)}</span>
    <span class="ptag__foot"><span>${esc(w.cap.split(' ')[0])}</span>${status(w.status)}</span>`;
  return w.status === 'filed'
    ? `<li class="ptag is-filed"><a href="/records/week-${w.n}" data-link aria-label="Week ${w.n}: ${esc(w.short)}">${inner}</a></li>`
    : `<li class="ptag is-${w.status}"><div>${inner}</div></li>`;
}
function home() {
  return page('/', `
  <section class="hero"><div class="wrap">
    <div>
      <h1 class="hero__name"><span>Kniazev</span><span>Daniil</span></h1>
      <p class="hero__lede">This is my e-portfolio for Business Administration at Astana IT University. For ten weeks I study one Kazakhstan company, Magnum Cash&amp;Carry, and decide where AI should help and where people must stay in charge. Carrefour is my comparison.</p>
      <div class="hero__actions"><a class="btn btn--ink" href="/records" data-link>Read the weekly records</a><a class="btn" href="/assignments/video-essay" data-link>Watch the Assignment 2 video</a></div>
    </div>
    ${receipt()}
  </div></section>

  <section class="section"><div class="wrap">
    <p class="question">How should Magnum Cash&amp;Carry operate and compete in an increasingly AI-enabled business environment?</p>
    <p class="intro">Every record, assignment and source on this site builds towards this capstone question.</p>
    <div class="pair">
      <div class="ctag ctag--b"><p class="ctag__role">Company B, the one I advise</p><h2 class="ctag__name">Magnum Cash&amp;Carry</h2>
        <p>A Kazakhstan retailer that also serves business customers through wholesale. The company reports more than 200 stores <a class="cite" href="/evidence#s3" data-link>[3]</a>.</p></div>
      <div class="ctag"><p class="ctag__role">Company A, the comparison</p><h2 class="ctag__name">Carrefour</h2>
        <p>An international retailer with 15,415 stores under its banners at 30 June 2026, franchise markets included <a class="cite" href="/evidence#s2" data-link>[2]</a>.</p></div>
    </div>
    <p style="margin-top:24px"><a href="/companies" data-link>Read both company profiles</a></p>
  </div></section>

  <section class="section section--shelf">
    <div class="wrap section__head"><div><h2 class="h2">Ten weeks on one shelf</h2>
      <p class="intro">One record a week, six fields, up to 900 words and one artifact. Filed records open in full.</p></div>
      <a class="btn" href="/records" data-link>All records</a></div>
    <div class="shelf"><div class="shelf__edge"></div>
      <ol class="shelf__rail" aria-label="Weekly records">${D.weeks.map(weekTag).join('')}</ol></div>
  </section>

  <section class="section"><div class="wrap">
    <div class="section__head"><div><h2 class="h2">Transfer verdicts so far</h2>
      <p class="intro">What Magnum should do with each Carrefour practice, as argued in Assignment 1. Company A is evidence, not a model to copy.</p></div></div>
    <div class="verdicts">${VERDICTS.map(([t, e, c, v, why]) => `<div class="vrow"><div><h3>${t}</h3><p>${why}</p></div>
      <p class="evid">${esc(e)} ${c.map((n) => `<a class="cite" href="/evidence#s${n}" data-link>[${n}]</a>`).join(' ')}</p>
      <span class="stamp stamp--${v}">${v}</span></div>`).join('')}</div>
  </div></section>

  <section class="section section--shelf"><div class="wrap">
    <div class="section__head"><div><h2 class="h2">Assignments</h2><p class="intro">Each assignment turns several records into one defended position.</p></div>
      <a class="btn" href="/assignments" data-link>All assignments</a></div>
    ${assignmentRows()}
  </div></section>`, true);
}

/* ---------- assignments ---------- */
const ASSIGN = [
  ['A1', 'Business report', 'Week 3', 'Records 1–3', 'filed', 'Individual written report with IEEE references and an individual defence. Submitted on 22 September 2026.', '/assignments/business-report'],
  ['A2', 'Video essay', 'Week 5', 'Records 3–5', 'filed', 'A 3:43 video with a 463-word script on the human–AI operating model for Magnum: who approves, who reviews AI output, where problems escalate and what happens when the system fails.', '/assignments/video-essay'],
  ['A3', 'Photo essay', 'Week 7', 'Records 6–7', 'filed', 'Ten curated visuals with a 487-word commentary on how customer, AI and data systems reshape value at Magnum, and how Magnum should govern them.', '/assignments/photo-essay'],
  ['A4', 'Argumentative essay', 'Week 9', 'Records 8–9', 'upcoming', '800–1000 words with a counterargument. It becomes the capstone recommendation.'],
];
function assignmentRows() {
  return `<ol class="rows">${ASSIGN.map(([id, t, wk, dev, st, d, href]) => {
    const inner = `<span class="row__n">${id}</span><div><h3>${t}</h3><p>${d}</p><p class="row__meta">Due ${wk}. Develops ${dev}.</p></div>${status(st)}`;
    return `<li class="row is-${st === 'filed' ? 'filed' : st === 'upcoming' ? 'upcoming' : 'revision'}">${href ? `<a href="${href}" data-link>${inner}</a>` : `<div>${inner}</div>`}</li>`;
  }).join('')}</ol>`;
}
function assignments(path) {
  return page(path, phead('', 'Assignments', 'Two assignments per attestation period, each worth half of it. Weekly records are the evidence base they are marked on.') +
    `<section class="section"><div class="wrap">${assignmentRows()}</div></section>`);
}
function a1(path) {
  const a = D.a1;
  return page(path, `<section class="phead"><div class="wrap">
    <p class="crumbs"><a href="/assignments" data-link>Assignments</a> / A1</p>
    <h1 class="h1">Business report</h1>
    <dl class="meta"><dt>Assignment</dt><dd>Assignment 1, first attestation, due Week 3</dd><dt>Develops</dt><dd><a href="/records/week-1" data-link>Record 1</a>, <a href="/records/week-2" data-link>Record 2</a> and <a href="/records/week-3" data-link>Record 3</a></dd><dt>Submitted</dt><dd>22 September 2026, 1,316 words</dd><dt>Companies</dt><dd>Company A: Carrefour. Company B: Magnum Cash&amp;Carry</dd></dl>
    <div class="actions no-print"><button class="btn btn--ink" data-print>Save as PDF</button>${dl('assignments/KNIAZEV_AIB-2602_BA2026_A1_BusinessReport', 'Report')}${dl('assignments/KNIAZEV_AIB-2602_BA2026_A1_Appendix', 'Appendix')}</div>
  </div></section>
  <div class="wrap doc">
    <aside class="doc__toc no-print"><p>Sections</p><ol>${a.blocks.filter((b) => b[0] === 'h').map(([, v]) => { const m = v.match(/^(\d)\.?\s+(.*)$/); return `<li><a href="#field-${m[1]}">${esc(v)}</a></li>`; }).join('')}<li><a href="#refs">References</a></li></ol></aside>
    <article class="prose">${blocks(a.blocks, 'a1')}
      <p class="note">The appendix submitted with this report carries forward the three artifacts: the environment and AI opportunity map (<a href="/records/week-1" data-link>Week 1</a>), the stakeholder and AI ethics map (<a href="/records/week-2" data-link>Week 2</a>) and the AI Business Model Stress Test (<a href="/records/week-3" data-link>Week 3</a>).</p>
      <section class="refs" id="refs"><h2>References</h2><ol>${a.refs.map((r) => { const m = r.match(/^\[(\d+)\]\s*(.*)$/); return `<li id="ref-${m[1]}"><b>[${m[1]}]</b><span>${linkify(m[2])}</span></li>`; }).join('')}</ol></section>
    </article>
  </div>`);
}

const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
function a2(path) {
  const a = D.a2;
  const video = file('media/KNIAZEV_AIB-2602_BA2026_A2_Video.mp4');
  const player = video
    ? `<video id="a2v" controls playsinline preload="metadata" poster="${file('media/poster.jpg')}"><source src="${video}" type="video/mp4">Your browser cannot play this video. <a href="${video}">Download the MP4</a>.</video>`
    : '<div class="player__wait"><strong>Video uploading</strong><span>The recording will play here shortly. The full script is below.</span></div>';
  const kit = [
    ['/records/week-3#sheet', 'Week 3 · AI Business Model Stress Test', 'Artifact sheet in Record 3'],
    ['/records/week-4#sheet', 'Week 4 · Human–AI Task Allocation Matrix', 'Artifact sheet in Record 4'],
    ['/records/week-5#sheet', 'Week 5 · Current- and future-state process map', 'Artifact sheet in Record 5'],
    ['/evidence', 'Evidence Folder', `${D.evidence.length} numbered sources`],
  ];
  const files = FILES ? [
    [file('assignments/KNIAZEV_AIB-2602_BA2026_A2_Slides.pptx'), 'Slides', 'PPTX, 6 slides'],
    [video, 'Video file', 'MP4, 1080p'],
  ] : [];
  return page(path, `<section class="phead"><div class="wrap">
    <p class="crumbs"><a href="/assignments" data-link>Assignments</a> / A2</p>
    <h1 class="h1">Video essay</h1>
    <dl class="meta"><dt>Assignment</dt><dd>Assignment 2, first attestation, due Week 5</dd><dt>Question</dt><dd>Which human–AI operating model should Magnum use for replenishment?</dd><dt>Develops</dt><dd><a href="/records/week-3" data-link>Record 3</a>, <a href="/records/week-4" data-link>Record 4</a> and <a href="/records/week-5" data-link>Record 5</a></dd><dt>Length</dt><dd>${mmss(a.duration)} video, ${a.words}-word script</dd><dt>Companies</dt><dd>Company A: Carrefour. Company B: Magnum Cash&amp;Carry</dd></dl>
  </div></section>
  <section class="screen"><div class="wrap">
    <figure class="player">${player}</figure>
    <ol class="chapters" aria-label="Chapters">${a.chapters.map((c) => `<li><button data-seek="${c.t}"${video ? '' : ' disabled'}><span>${mmss(c.t)}</span>${esc(c.title)}</button></li>`).join('')}</ol>
  </div></section>
  <div class="wrap doc">
    <aside class="doc__toc no-print"><p>On this page</p><ol><li><a href="#script">Script</a></li><li><a href="#kit">Submitted with the video</a></li><li><a href="#refs">References</a></li></ol></aside>
    <article class="prose">
      <h2 class="field" id="script"><span class="field__n">S</span>Script</h2>
      <p class="note">The spoken text, ${a.words} words.${video ? ' Each timestamp jumps the video to that line.' : ''}</p>
      ${a.chapters.map((c) => `<h3>${esc(c.title)}</h3><p class="script">${c.lines.map(([t, x]) => `${video ? `<button class="ts" data-seek="${t}" aria-label="Play from ${mmss(t)}">${mmss(t)}</button> ` : ''}${inline(x)}`).join(' ')}</p>`).join('')}
      <h2 class="field" id="kit"><span class="field__n">+</span>Submitted with the video</h2>
      <ul class="kit">${kit.map(([h, t, s]) => `<li><a href="${h}" data-link><span>${t}</span><small>${s}</small></a></li>`).join('')}${files.map(([h, t, s]) => `<li><a href="${h}" download><span>${t}</span><small>${s} · download</small></a></li>`).join('')}</ul>
      <section class="refs" id="refs"><h2>References</h2><ol>${a.refs.map(([n, t]) => `<li><b><a class="cite" href="/evidence#s${n}" data-link>[${n}]</a></b><span>${esc(t)}</span></li>`).join('')}</ol>
      <p class="note">Numbers follow the cumulative Evidence Folder, so they differ from the numbering inside the video.</p></section>
    </article>
  </div>`);
}

function a3(path) {
  const a = D.a3;
  const pptx = file('assignments/KNIAZEV_AIB-2602_BA2026_A3_PhotoEssay.pptx');
  const evid = file('assignments/KNIAZEV_AIB-2602_BA2026_A3_Evidence.pdf');
  const kit = [
    ['/records/week-6', 'Week 6 · Human-only versus AI-supported marketing comparison', 'Record 6'],
    ['/records/week-7', 'Week 7 · AI and data workflow with a governance risk register', 'Record 7'],
    ['/evidence', 'Evidence Folder', `${D.evidence.length} numbered sources`],
  ];
  return page(path, `<section class="phead"><div class="wrap">
    <p class="crumbs"><a href="/assignments" data-link>Assignments</a> / A3</p>
    <h1 class="h1">Photo essay</h1>
    <dl class="meta"><dt>Assignment</dt><dd>Assignment 3, second attestation, due Week 7</dd><dt>Question</dt><dd>How are customer, AI, technology and data systems reshaping the way Carrefour and Magnum create and deliver value, and how should Magnum govern those systems?</dd><dt>Develops</dt><dd><a href="/records/week-6" data-link>Record 6</a> and <a href="/records/week-7" data-link>Record 7</a></dd><dt>Length</dt><dd>${a.visuals.length} visuals, ${a.words}-word commentary</dd><dt>Companies</dt><dd>Company A: Carrefour. Company B: Magnum Cash&amp;Carry</dd></dl>
    ${FILES ? `<div class="actions no-print"><a class="btn btn--ink" href="${pptx}" download>Download essay PPTX</a><a class="btn" href="${evid}" target="_blank" rel="noopener">Open evidence PDF</a></div>` : ''}
  </div></section>
  <div class="wrap doc">
    <aside class="doc__toc no-print"><p>On this page</p><ol><li><a href="#claim">Claim</a></li>${a.visuals.map((v) => `<li><a href="#visual-${v.n}">Visual ${v.n}</a></li>`).join('')}<li><a href="#kit">Submitted with the essay</a></li><li><a href="#refs">References</a></li></ol></aside>
    <article class="prose">
      <h2 class="field" id="claim"><span class="field__n">C</span>Claim</h2>
      <p class="claim" style="font-size:21px;line-height:1.5;font-weight:500">${inline(a.claim)}</p>
      ${a.visuals.map((v) => `<h2 class="field" id="visual-${v.n}"><span class="field__n">${v.n}</span>${esc(v.title)}</h2>
      <p class="note">${esc(v.section)}</p>
      ${FILES ? `<figure class="vis" style="margin:8px 0 22px;max-width:980px"><img style="display:block;width:100%;height:auto;border:1.5px solid var(--ink);background:var(--paper)" src="${file(v.img)}" alt="Visual ${v.n}: ${esc(v.title)}" width="2000" height="1280" loading="lazy" decoding="async"></figure>` : ''}
      <p>${inline(v.comment)}</p>`).join('')}
      <h2 class="field" id="kit"><span class="field__n">+</span>Submitted with the essay</h2>
      <ul class="kit">${kit.map(([h, t, s]) => `<li><a href="${h}" data-link><span>${t}</span><small>${s}</small></a></li>`).join('')}${FILES ? `<li><a href="${pptx}" download><span>Photo essay</span><small>PPTX, ${a.visuals.length + 1} slides · download</small></a></li><li><a href="${evid}" target="_blank" rel="noopener"><span>Evidence file</span><small>PDF: Evidence Folder, Week 6–7 artifacts, data · open</small></a></li>` : ''}</ul>
      <section class="refs" id="refs"><h2>References</h2><ol>${a.refs.map(([n, t]) => `<li><b><a class="cite" href="/evidence#s${n}" data-link>[${n}]</a></b><span>${esc(t)}</span></li>`).join('')}</ol>
      <p class="note">Numbers follow the cumulative Evidence Folder, so a source keeps its number in every record and assignment.</p></section>
    </article>
  </div>`);
}

/* ---------- records ---------- */
function records(path) {
  return page(path, phead('', 'Weekly records', 'One section a week with six fields: concept, application, verification and AI record, transfer, evidence and capstone link. Weeks 3, 5, 7 and 9 are reduced to the first two fields because their analysis moves into that week’s assignment.') +
    `<section class="section"><div class="wrap"><ol class="rows">${D.weeks.map((w) => {
      const inner = `<span class="row__n">${pad(w.n)}</span><div><h3>${esc(w.title || w.short)}</h3><p>${esc(w.topic)}</p><p class="row__meta">Artifact: ${esc(w.artifact)}. Develops capstone ${esc(w.cap)}.${w.reduced ? ' Reduced record.' : ''}</p></div>${status(w.status)}`;
      return `<li class="row is-${w.status}">${w.status === 'filed' ? `<a href="/records/week-${w.n}" data-link>${inner}</a>` : `<div>${inner}</div>`}</li>`;
    }).join('')}</ol></div></section>`);
}
function record(path, n) {
  const w = D.weeks.find((x) => x.n === n && x.status === 'filed');
  if (!w) return notFound(path, n >= 1 && n <= 10 ? `Week ${n} is not published yet.` : null);
  const fields = w.blocks.filter((b) => b[0] === 'h').map(([, v]) => v.match(/^(\d)\s+(.*)$/)).filter(Boolean);
  const prev = D.weeks.find((x) => x.n === n - 1 && x.status === 'filed');
  const next = D.weeks.find((x) => x.n === n + 1 && x.status === 'filed');
  return page(path, `<section class="phead"><div class="wrap">
    <p class="crumbs"><a href="/records" data-link>Records</a> / Week ${n}</p>
    <div class="rhead"><div class="bigtag" aria-hidden="true"><div class="bigtag__w">Week</div><div class="bigtag__n">${pad(n)}</div></div>
      <div><h1 class="rtitle">${esc(w.title)}</h1>
      <dl class="meta"><dt>Topic</dt><dd>${esc(w.topic)}</dd><dt>Artifact</dt><dd>${esc(w.artifact)}</dd><dt>Capstone</dt><dd>${esc(w.cap)}</dd><dt>Companies</dt><dd>Company A: Carrefour. Company B: Magnum Cash&amp;Carry</dd></dl>
      <div class="actions no-print"><button class="btn btn--ink" data-print>Save as PDF</button>${PDF_ONLY.has(n) ? pdfBtn(DOCS[n], 'Record') : dl(DOCS[n], 'Record')}</div></div></div>
  </div></section>
  <div class="wrap doc">
    <aside class="doc__toc no-print"><p>${w.reduced ? 'Reduced record' : 'Fields'}</p><ol>${fields.map((m) => `<li><a href="#field-${m[1]}">${m[1]} ${esc(m[2])}</a></li>`).join('')}${w.sheet ? '<li><a href="#sheet">Artifact sheet</a></li>' : ''}<li><a href="#refs">References</a></li></ol></aside>
    <article class="prose">${blocks(w.blocks)}
      ${w.sheet ? `<details class="sheet" id="sheet"><summary>${esc(w.sheet.title)}</summary><div class="sheet__body">${blocks(w.sheet.blocks)}${SHEETS[n] && FILES ? `<div class="actions no-print">${dl(SHEETS[n], 'Artifact')}</div>` : ''}</div></details>` : ''}
      <section class="refs" id="refs"><h2>References</h2><ol>${w.refs.map((r) => { const m = r.match(/^\[(\d+)\]\s*(.*)$/); return `<li><b><a class="cite" href="/evidence#s${m[1]}" data-link>[${m[1]}]</a></b><span>${esc(m[2])}</span></li>`; }).join('')}</ol>
      <p class="note">Numbers follow the cumulative Evidence Folder, so a source keeps its number in every record.</p></section>
    </article>
  </div>
  <nav class="pager" aria-label="Records">${prev ? `<a href="/records/week-${prev.n}" data-link><small>Previous</small><strong>Week ${prev.n}</strong></a>` : '<span></span>'}${next ? `<a href="/records/week-${next.n}" data-link><small>Next</small><strong>Week ${next.n}</strong></a>` : `<a href="/records" data-link><small>Next</small><strong>All records</strong></a>`}</nav>`);
}

/* ---------- capstone ---------- */
const CAP = [
  ['§1', 'Business context', 1], ['§2', 'Environmental and stakeholder analysis', 2], ['§3', 'Business model', 3], ['§4', 'Human–AI operating model', 4],
  ['§5a', 'Operations and supply chain', 5], ['§5b', 'Marketing and customer', 6], ['§5c', 'Workforce and career capability', 9], ['§6', 'Governance, verification and assurance', 7],
  ['§7', 'Business case and KPIs', 8], ['§8', '12-month roadmap', 10], ['§9', 'Strategic transfer stress test', 10],
];
function capstone(path) {
  return page(path, phead('', 'Capstone', 'The final exam, worth 40% of the course. It integrates the nine sections below with a 12-month roadmap and a transfer stress test, and it is defended orally.') + `
  <section class="section"><div class="wrap">
    <div class="weights">
      <div><b>40%</b><h3>E-portfolio and impact deck</h3><p>This site, developed into the AI-enabled business impact deck. A3 is the visual starting point.</p></div>
      <div><b>40%</b><h3>Executive summary report</h3><p>5–7 pages in IEEE style. A1 is the starting point.</p></div>
      <div><b>20%</b><h3>Video presentation</h3><p>10–15 minutes. A2 is the starting point.</p></div>
      <div><b>Q&amp;A</b><h3>Individual defence</h3><p>Compulsory. Confirms the work is mine and tests a changed assumption live.</p></div>
    </div>
  </div></section>
  <section class="section section--shelf"><div class="wrap">
    <div class="section__head"><div><h2 class="h2">Nine sections</h2><p class="intro">Each section grows out of a weekly record. Developed into, not pasted into.</p></div></div>
    <ol class="rows">${CAP.map(([id, t, wk]) => {
      const w = D.weeks.find((x) => x.n === wk);
      const st = wk === 10 ? 'upcoming' : w.status;
      const src = wk === 10 ? 'Integration week' : `Grows from Week ${wk}: ${w.artifact}`;
      const inner = `<span class="row__n" style="font-size:56px">${id}</span><div><h3>${t}</h3><p>${esc(src)}</p></div>${status(st === 'filed' ? 'filed' : st)}`;
      return `<li class="row is-${st}">${st === 'filed' ? `<a href="/records/week-${wk}" data-link>${inner}</a>` : `<div>${inner}</div>`}</li>`;
    }).join('')}</ol>
  </div></section>
  <section class="section"><div class="wrap"><div class="placeholder"><strong>Deliverables appear here in Week 10.</strong> The impact deck, executive summary report and video presentation will be published on this page after the capstone submission.</div></div></section>`);
}

/* ---------- companies ---------- */
const c = (n) => `<a class="cite" href="/evidence#s${n}" data-link>[${n}]</a>`;
function companies(path) {
  return page(path, phead('', 'Companies', 'Chosen in Week 1 and kept for the whole course. Both sell groceries and household goods, so practices can be compared.') + `
  <section class="section"><div class="wrap profiles">
    <article class="profile profile--b"><div class="profile__head"><p class="ctag__role">Company B, the focal organisation</p><h2 class="ctag__name">Magnum Cash&amp;Carry</h2></div>
      <div class="profile__body"><dl>
        <dt>What it does</dt><dd>Kazakhstan retailer serving households, and businesses through wholesale ${c(14)}.</dd>
        <dt>Scale</dt><dd>More than 200 stores, company statement of 1 July 2026 ${c(3)}.</dd>
        <dt>Ownership</dt><dd>Limited liability partnership (ТОО) ${c(15)}. Participants generally risk their contributions; the general meeting is the highest body ${c(18)}. Beneficial owners are not established by my sources.</dd>
        <dt>Region</dt><dd>Entered Uzbekistan in 2021 ${c(14)}.</dd>
        <dt>Digital today</dt><dd>Magnum Club loyalty app with bonuses and personalised offers; its privacy policy lists purchase and location data ${c(15)}. This does not establish AI deployment.</dd>
        <dt>Rules</dt><dd>Corporate rules on customer safety, supplier selection, product acceptance and reporting ${c(22)}.</dd>
        <dt>What I still need</dt><dd><ul><li>The detailed replenishment workflow, which is not public</li><li>Stock-record accuracy and forecast performance</li><li>Audited financial data for the Week 8 ratios</li></ul></dd>
      </dl></div></article>
    <article class="profile"><div class="profile__head"><p class="ctag__role">Company A, the comparison</p><h2 class="ctag__name">Carrefour</h2></div>
      <div class="profile__body"><dl>
        <dt>What it does</dt><dd>International retailer, Carrefour SA, including franchised operations ${c(2)}.</dd>
        <dt>Scale</dt><dd>15,415 stores under its banners at 30 June 2026, franchise markets included ${c(2)}.</dd>
        <dt>Documented AI practices</dt><dd><ul>
          <li>Hopla, a shopping assistant built on OpenAI technology, launched in France on 8 June 2023 ${c(12)}</li>
          <li>Shopping through ChatGPT, announced 26 March 2026 ${c(19)}</li>
          <li>SAS demand forecasting chosen after an 18-month test, announced 14 January 2019 ${c(20)}</li></ul></dd>
        <dt>Supplier conduct</dt><dd>Group Suppliers Ethics Charter, 2024 edition ${c(21)}.</dd>
        <dt>How I use it</dt><dd>As evidence of what can be tested, never as proof that Magnum would earn the same return. Announcements describe intended improvements, not measured results.</dd>
      </dl></div></article>
  </div></section>`);
}

/* ---------- evidence ---------- */
function evidence(path) {
  const tags = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'A1', 'A2', 'A3'];
  return page(path, phead('', 'Evidence folder', `Every number in the records points here. The folder grows as the weeks add sources and never shrinks. Current to Week 7: ${D.evidence.length} sources.`) + `
  <section class="section"><div class="wrap">
    <div class="filters" role="group" aria-label="Filter sources"><button aria-pressed="true" data-f="all">All</button>${tags.map((t) => `<button aria-pressed="false" data-f="${t}">${t.startsWith('W') ? 'Week ' + t.slice(1) : 'Assignment ' + t.slice(1)}</button>`).join('')}</div>
    <ol class="elist">${D.evidence.map((e) => `<li class="eitem" id="s${e.n}" data-cited="${e.cited.join(' ')}"><span class="eitem__n">${e.n}</span>
      <div><p>${esc(e.text)}</p>${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.url.replace(/^https?:\/\//, '').slice(0, 80))}${e.url.length > 88 ? '…' : ''}</a>` : '<span class="muted" style="font-size:15px">Link recorded in the submitted Evidence Folder</span>'}</div>
      <div class="chips">${e.cited.map((t) => `<span class="chip${t[0] === 'A' ? ' chip--a' : ''}">${t}</span>`).join('')}</div></li>`).join('')}
      <li class="eitem" data-cited="A1"><span class="eitem__n">+</span><div><p>${esc(D.extra.text)} Cited in Assignment 1 as [${D.extra.n_a1}].</p><a href="${esc(D.extra.url)}" target="_blank" rel="noopener">${esc(D.extra.url.replace(/^https?:\/\//, ''))}</a></div><div class="chips"><span class="chip chip--a">A1</span></div></li>
    </ol>
  </div></section>`);
}

/* ---------- about ---------- */
function about(path) {
  return page(path, phead('', 'About me', '') + `
  <section class="section"><div class="wrap about">
    <div class="prose"><p style="font-size:22px;line-height:1.5">I am Kniazev Daniil, a first-year AI Business student at Astana IT University. In Business Administration I follow one Kazakhstan company for ten weeks and test where AI can support its work without taking accountability away from people.</p>
      <p>The course works as one evidence base. Each week I build an artifact in the practice session, verify at least one claim against an independent source, and decide whether a Carrefour practice should be adopted, adapted, piloted, delayed or rejected at Magnum. Assignments compress several weeks into one argument, and the capstone integrates everything.</p>
      <p>I remain accountable for every number, citation and recommendation here.</p></div>
    <dl class="facts">
      <div><dt>Programme</dt><dd>AI Business (6B04103), year 1</dd></div>
      <div><dt>Group</dt><dd>AIB-2602</dd></div>
      <div><dt>University</dt><dd>Astana IT University, School of Digital Public Administration</dd></div>
      <div><dt>Course</dt><dd>Business Administration (BA 1204), 5 ECTS, trimester 1, 2026–2027</dd></div>
      <div><dt>Instructor</dt><dd>Prof. Gaukhar Yeshenkulova</dd></div>
      <div><dt>Companies</dt><dd>Magnum Cash&amp;Carry and Carrefour</dd></div>
      <div><dt>Email</dt><dd><a href="mailto:${EMAIL}">${EMAIL}</a></dd></div>
    </dl>
  </div></section>`);
}

function notFound(path, msg) {
  return page(path, phead('', 'Not on the shelf', '') + `<section class="section"><div class="wrap"><div class="placeholder"><strong>${msg || 'This page does not exist.'}</strong> Go back to the <a href="/records" data-link>weekly records</a> or the <a href="/" data-link>home page</a>.</div></div></section>`);
}

/* ---------- router ---------- */
const TITLES = { '/': 'Kniazev Daniil · Business Administration e-portfolio' };
function route(path) {
  path = path.replace(/\/+$/, '') || '/';
  let m;
  if (path === '/') return [home(), 'E-portfolio'];
  if (path === '/records') return [records(path), 'Weekly records'];
  if ((m = path.match(/^\/records\/week-(\d+)$/))) return [record('/records', +m[1]), `Week ${m[1]} record`];
  if (path === '/assignments') return [assignments(path), 'Assignments'];
  if (path === '/assignments/business-report') return [a1('/assignments'), 'Assignment 1 business report'];
  if (path === '/assignments/video-essay') return [a2('/assignments'), 'Assignment 2 video essay'];
  if (path === '/assignments/photo-essay') return [a3('/assignments'), 'Assignment 3 photo essay'];
  if (path === '/capstone') return [capstone(path), 'Capstone'];
  if (path === '/companies') return [companies(path), 'Companies'];
  if (path === '/evidence') return [evidence(path), 'Evidence folder'];
  if (path === '/about') return [about(path), 'About'];
  return [notFound(path), 'Not found'];
}
function render(push) {
  const [html, title] = route(location.pathname);
  const swap = () => {
    app.innerHTML = html;
    document.title = TITLES[location.pathname] || `${title} · Kniazev Daniil`;
    bind();
    const id = location.hash.slice(1);
    const el = id && document.getElementById(id);
    if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ block: 'start' }); if (el.classList.contains('eitem')) { el.classList.add('is-target'); setTimeout(() => el.classList.remove('is-target'), 1800); } }
    else if (push) window.scrollTo(0, 0);
  };
  if (push && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(swap);
  else swap();
}
function bind() {
  const btn = app.querySelector('.menu-btn'), menu = app.querySelector('#menu');
  btn?.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu'; });
  app.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
  const hero = app.querySelector('.hero'), head = app.querySelector('.site-header');
  if (hero && head) new IntersectionObserver(([e]) => head.classList.toggle('is-yellow', e.isIntersecting), { rootMargin: '-68px 0px 0px 0px' }).observe(hero);
  const v = app.querySelector('#a2v');
  if (v) {
    const chips = [...app.querySelectorAll('.chapters button')];
    app.querySelectorAll('[data-seek]').forEach((b) => b.addEventListener('click', () => {
      v.currentTime = +b.dataset.seek;
      v.play().catch(() => {});
      const r = v.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) v.scrollIntoView({ block: 'center' });
    }));
    v.addEventListener('timeupdate', () => {
      let on = -1;
      chips.forEach((c, i) => { if (v.currentTime + 0.05 >= +c.dataset.seek) on = i; });
      chips.forEach((c, i) => c.classList.toggle('is-on', i === on));
    });
  }
  const fb = app.querySelectorAll('.filters button');
  fb.forEach((b) => b.addEventListener('click', () => {
    fb.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    app.querySelectorAll('.eitem').forEach((li) => { li.hidden = b.dataset.f !== 'all' && !li.dataset.cited.split(' ').includes(b.dataset.f); });
  }));
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  const url = new URL(a.href);
  if (url.origin !== location.origin) return;
  e.preventDefault();
  if (url.pathname === location.pathname && url.hash) { history.pushState(null, '', url); render(false); return; }
  history.pushState(null, '', url);
  render(true);
});
window.addEventListener('popstate', () => render(false));
window.addEventListener('beforeprint', () => document.querySelectorAll('details').forEach((d) => { d.dataset.wasOpen = d.open; d.open = true; }));
window.addEventListener('afterprint', () => document.querySelectorAll('details').forEach((d) => { d.open = d.dataset.wasOpen === 'true'; }));

const [cfg, data] = await Promise.all([
  fetch('/config.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
  fetch('/content.json').then((r) => r.json()),
]);
FILES = cfg.files || null;
D = data;
render(false);
