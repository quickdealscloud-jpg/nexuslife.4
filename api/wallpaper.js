import sharp from 'sharp';

export default async function handler(req, res) {
  const W = 1170, H = 2532;

  const now = new Date();
  // IST offset
  const IST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const hr = IST.getHours();
  const yr = IST.getFullYear();

  const yearStart = new Date(yr, 0, 1);
  const yearEnd = new Date(yr + 1, 0, 1);
  const yearPct = (IST - yearStart) / (yearEnd - yearStart);
  const daysLeft = Math.ceil((yearEnd - IST) / 86400000);
  const pctDone = Math.round(yearPct * 100);

  const glassCount = Math.min(Math.floor(hr / 3), 8);
  const nextWaterMin = (3 * 60) - (hr % 3) * IST.getMinutes();

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = `${days[IST.getDay()]}, ${months[IST.getMonth()]} ${IST.getDate()}`;

  const getTaskBadge = (startH, endH) => {
    if (hr >= startH && hr < endH) return { text: 'NOW', color: '#a080ff', bg: 'rgba(120,80,255,0.3)', border: '#7850ff' };
    if (hr >= endH) return { text: 'DONE', color: '#4cff91', bg: 'rgba(76,255,145,0.12)', border: '#4cff91' };
    return { text: 'NEXT', color: 'rgba(255,255,255,0.42)', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.14)' };
  };

  const t1 = getTaskBadge(5, 6);
  const t2 = getTaskBadge(9, 11);

  const quotes = [
    'Small daily improvements lead to staggering long-term results.',
    'Discipline is choosing what you want most over what you want now.',
    'You do not rise to goals — you fall to your systems.',
    'Every day is a deposit into your future.',
    'Work in silence. Let results make the noise.',
  ];
  const quote = `"${quotes[Math.floor(Date.now() / (1000 * 60 * 60 * 4)) % quotes.length]}"`;

  // Dot grid
  const cols = 24, rows = 7, total = cols * rows;
  const filled = Math.round(total * yearPct);
  const dotAreaX = 44, dotAreaY = 820, dotAreaW = W - 88, dotAreaH = 400;
  const gapX = dotAreaW / cols, gapY = dotAreaH / rows;
  const dotR = 13;

  let dotsSVG = '';
  for (let i = 0; i < total; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = dotAreaX + col * gapX + gapX / 2;
    const cy = dotAreaY + row * gapY + gapY / 2;
    if (i === filled - 1) {
      dotsSVG += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="20" fill="#ff6b35"/>`;
      dotsSVG += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="30" fill="#ff6b35" opacity="0.2"/>`;
    } else if (i < filled) {
      dotsSVG += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dotR}" fill="#b48cff" opacity="0.85"/>`;
    } else {
      dotsSVG += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dotR}" fill="white" opacity="0.12"/>`;
    }
  }

  // Water drops
  let dropsSVG = '';
  const dropBaseX = 148, dropY = 2075, dropW = 20, dropH = 26, dropGap = 34;
  for (let i = 0; i < 8; i++) {
    const dx = dropBaseX + i * dropGap;
    const fill = i < glassCount ? '#00b4ff' : 'rgba(0,180,255,0.22)';
    dropsSVG += `<ellipse cx="${dx}" cy="${dropY}" rx="${dropW/2}" ry="${dropH/2}" fill="${fill}"/>`;
  }

  // Helper for rounded rect
  const rr = (x, y, w, h, r, fill, stroke = 'none', sw = 1) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

  // Random stars - fixed seed for consistency
  let stars = '';
  const starData = [
    [120,180,1.2,0.35],[450,95,0.8,0.2],[780,220,1.5,0.4],[230,450,1.0,0.25],
    [890,380,0.6,0.15],[560,120,1.3,0.3],[100,680,0.9,0.22],[340,290,1.1,0.28],
    [700,510,0.7,0.18],[980,160,1.4,0.38],[150,750,0.5,0.12],[620,640,1.2,0.32],
    [820,270,0.8,0.2],[410,830,1.0,0.26],[70,920,1.3,0.35],[950,720,0.6,0.16],
    [280,1050,1.1,0.29],[740,980,0.9,0.23],[500,1100,1.4,0.37],[170,1250,0.7,0.19],
    [830,1180,1.2,0.31],[360,1320,0.8,0.21],[650,1280,1.0,0.27],[920,1080,1.3,0.33],
    [110,1400,0.6,0.15],[480,1380,1.1,0.3],[760,1450,0.9,0.24],[240,1520,1.5,0.4],
    [590,1480,0.7,0.17],[870,1350,1.2,0.34],[50,1600,1.0,0.26],[430,1650,0.8,0.22],
    [710,1580,1.3,0.36],[190,1720,0.6,0.14],[560,1700,1.1,0.29],[940,1550,0.9,0.25],
    [310,1800,1.4,0.38],[670,1780,0.7,0.18],[1050,1650,1.2,0.32],[80,1900,0.5,0.13],
  ];
  stars = starData.map(([sx,sy,sr,sa]) =>
    `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="white" opacity="${sa}"/>`
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; }
    </style>
    <linearGradient id="bg" x1="0" y1="0" x2="600" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06001a"/>
      <stop offset="40%" stop-color="#0a0520"/>
      <stop offset="100%" stop-color="#000820"/>
    </linearGradient>
    <radialGradient id="neb1" cx="0" cy="0.15" r="0.6" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#5028a0" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#5028a0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="neb2" cx="1" cy="0.85" r="0.5" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#0078c8" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0078c8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="streakG" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#ff6b35"/>
      <stop offset="100%" stop-color="#ff3d71"/>
    </linearGradient>
  </defs>

  <!-- BG -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#neb1)"/>
  <rect width="${W}" height="${H}" fill="url(#neb2)"/>

  <!-- Stars -->
  ${stars}

  <!-- ── BADGE ROW ── y=650 -->
  ${rr(44, 650, 310, 60, 30, 'rgba(120,80,255,0.28)', '#8c64ff', 1.5)}
  <text x="199" y="692" text-anchor="middle" font-size="26" font-weight="700" fill="#b496ff">${daysLeft} days left</text>

  <text x="585" y="692" text-anchor="middle" font-size="24" fill="rgba(255,255,255,0.35)">${yr} · ${pctDone}% done</text>

  ${rr(816, 650, 310, 60, 30, 'url(#streakG)', 'none')}
  <text x="971" y="692" text-anchor="middle" font-size="26" font-weight="700" fill="white">&#x1F525; 12 streak</text>

  <!-- ── DOT GRID ── -->
  ${dotsSVG}

  <!-- ── GOAL PILL ── y=1270 -->
  ${rr(44, 1270, 1082, 90, 45, 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.14)', 1.5)}
  <circle cx="112" cy="1315" r="16" fill="#7850ff"/>
  <text x="148" y="1325" font-size="26" fill="rgba(255,255,255,0.5)">Yearly Goal</text>
  <text x="1102" y="1325" text-anchor="end" font-size="28" font-weight="700" fill="rgba(255,255,255,0.92)">Build your best year yet</text>

  <!-- ── TASK 1 ── y=1390 -->
  ${rr(44, 1390, 1082, 130, 36, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.11)', 1.5)}
  ${rr(80, 1410, 88, 88, 22, 'rgba(255,107,53,0.22)', 'none')}
  <text x="124" y="1466" text-anchor="middle" font-size="44">&#128170;</text>
  <text x="196" y="1452" font-size="28" font-weight="700" fill="rgba(255,255,255,0.92)">Morning Workout</text>
  <text x="196" y="1492" font-size="22" fill="rgba(255,255,255,0.38)">5:00 AM  ·  45 min</text>
  ${rr(980, 1413, 120, 56, 18, t1.bg, t1.border, 1.5)}
  <text x="1040" y="1449" text-anchor="middle" font-size="22" font-weight="700" fill="${t1.color}">${t1.text}</text>

  <!-- ── TASK 2 ── y=1540 -->
  ${rr(44, 1540, 1082, 130, 36, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.11)', 1.5)}
  ${rr(80, 1560, 88, 88, 22, 'rgba(120,80,255,0.22)', 'none')}
  <text x="124" y="1616" text-anchor="middle" font-size="44">&#128218;</text>
  <text x="196" y="1602" font-size="28" font-weight="700" fill="rgba(255,255,255,0.92)">Deep Work Session</text>
  <text x="196" y="1642" font-size="22" fill="rgba(255,255,255,0.38)">9:00 AM  ·  2 hrs</text>
  ${rr(980, 1563, 120, 56, 18, t2.bg, t2.border, 1.5)}
  <text x="1040" y="1599" text-anchor="middle" font-size="22" font-weight="700" fill="${t2.color}">${t2.text}</text>

  <!-- ── WATER BAR ── y=1700 -->
  ${rr(44, 1700, 1082, 116, 36, 'rgba(0,180,255,0.08)', 'rgba(0,180,255,0.22)', 1.5)}
  ${dropsSVG}
  <text x="440" y="1748" font-size="28" font-weight="700" fill="rgba(0,200,255,0.95)">Hydration</text>
  <text x="440" y="1792" font-size="22" fill="rgba(0,180,255,0.55)">${glassCount} of 8  ·  next in ${nextWaterMin} min</text>

  <!-- ── QUOTE ── y=1890 -->
  <text x="585" y="1890" text-anchor="middle" font-size="24" fill="rgba(255,255,255,0.28)" font-style="italic">${quote.length > 65 ? quote.substring(0,63) + '..."' : quote}</text>

  <!-- ── POWERED ── y=1970 -->
  <text x="585" y="1970" text-anchor="middle" font-size="18" fill="rgba(120,80,255,0.45)" letter-spacing="3">· POWERED BY NEURAL INTELLIGENCE ·</text>

  <!-- ── HOME PILL ── -->
  <rect x="410" y="2010" width="350" height="12" rx="6" fill="rgba(255,255,255,0.22)"/>
</svg>`;

  try {
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(W, H)
      .png({ quality: 95, compressionLevel: 6 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(pngBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
