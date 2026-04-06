import sharp from 'sharp';

// iPhone sizes
const SIZES = {
  iphone13: { w: 1170, h: 2532 },
  iphone15: { w: 1179, h: 2556 },
};

export default async function handler(req, res) {
  const device = req.query.device || 'iphone13';
  const { w, h } = SIZES[device] || SIZES.iphone13;

  const now = new Date();
  const IST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const hr = IST.getHours();
  const mn = IST.getMinutes().toString().padStart(2, '0');
  const yr = IST.getFullYear();

  const yearStart = new Date(yr, 0, 1);
  const yearEnd = new Date(yr + 1, 0, 1);
  const yearPct = (IST - yearStart) / (yearEnd - yearStart);
  const daysLeft = Math.ceil((yearEnd - IST) / 86400000);
  const pctDone = Math.round(yearPct * 100);

  // Water & tasks
  const glassCount = Math.min(Math.floor(hr / 3), 8);
  const nextWaterMin = (3 * 60) - (hr % 3) * 60 - IST.getMinutes();

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = `${days[IST.getDay()]}, ${months[IST.getMonth()]} ${IST.getDate()}`;

  // Task badges
  const getTaskBadge = (startH, endH) => {
    if (hr >= startH && hr < endH) return { text: 'NOW', color: '#a080ff', bg: 'rgba(120,80,255,0.3)', border: '#7850ff' };
    if (hr >= endH) return { text: 'DONE', color: '#4cff91', bg: 'rgba(76,255,145,0.12)', border: '#4cff91' };
    return { text: 'NEXT', color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)' };
  };

  const t1 = getTaskBadge(5, 6);
  const t2 = getTaskBadge(9, 11);

  // Quotes
  const quotes = [
    'Small daily improvements lead to staggering long-term results.',
    'Discipline is choosing what you want most over what you want now.',
    'You do not rise to goals — you fall to your systems.',
    'Every day is a deposit into your future.',
    'Work in silence. Let your results make the noise.',
  ];
  const quote = quotes[Math.floor(Date.now() / (1000 * 60 * 60 * 4)) % quotes.length];

  // Dot grid
  const cols = 24, rows = 7, total = cols * rows;
  const filled = Math.round(total * yearPct);
  const dotAreaW = w - 88;
  const dotAreaH = Math.round(h * 0.185);
  const dotAreaX = 44;
  const dotAreaY = Math.round(h * 0.325);
  const gapX = dotAreaW / cols;
  const gapY = dotAreaH / rows;
  const dotR = Math.min(gapX, gapY) * 0.30;

  let dotsSVG = '';
  for (let i = 0; i < total; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = dotAreaX + col * gapX + gapX / 2;
    const cy = dotAreaY + row * gapY + gapY / 2;
    if (i === filled - 1) {
      dotsSVG += `<circle cx="${cx}" cy="${cy}" r="${dotR + 4}" fill="#ff6b35" opacity="0.9"/>`;
      dotsSVG += `<circle cx="${cx}" cy="${cy}" r="${dotR + 8}" fill="#ff6b35" opacity="0.25"/>`;
    } else if (i < filled) {
      dotsSVG += `<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#b48cff" opacity="0.82"/>`;
    } else {
      dotsSVG += `<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="white" opacity="0.13"/>`;
    }
  }

  // Water drops
  let dropsSVG = '';
  const dropStartX = Math.round(w * 0.12);
  const dropY = Math.round(h * 0.806);
  for (let i = 0; i < 8; i++) {
    const dx = dropStartX + i * Math.round(w * 0.028);
    const fill = i < glassCount ? '#00b4ff' : 'rgba(0,180,255,0.22)';
    const op = i < glassCount ? '1' : '0.5';
    dropsSVG += `<ellipse cx="${dx}" cy="${dropY}" rx="${Math.round(w*0.009)}" ry="${Math.round(w*0.012)}" fill="${fill}" opacity="${op}"/>`;
  }

  // Scale values
  const fs = (base) => Math.round(base * w / 1170); // font scale
  const rr = (x, y, bw, bh, r, fill, stroke, sw = 1) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${r}" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;

  // Layout Y positions (proportional)
  const badgeY = Math.round(h * 0.253);
  const badgeH = Math.round(h * 0.028);
  const goalY = Math.round(h * 0.525);
  const goalH = Math.round(h * 0.038);
  const t1Y = Math.round(h * 0.573);
  const t1H = Math.round(h * 0.055);
  const t2Y = Math.round(h * 0.635);
  const t2H = Math.round(h * 0.055);
  const waterY = Math.round(h * 0.697);
  const waterH = Math.round(h * 0.048);
  const quoteY = Math.round(h * 0.775);
  const poweredY = Math.round(h * 0.815);
  const pillY = Math.round(h * 0.838);

  const cardPad = Math.round(w * 0.056);
  const cardW = w - cardPad * 2;
  const orbSize = Math.round(h * 0.042);
  const orbX = cardPad + Math.round(w * 0.022);
  const textX = cardPad + orbSize + Math.round(w * 0.065);
  const badgeW = Math.round(w * 0.118);
  const badgeTX = cardPad + cardW - Math.round(w * 0.01);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#06001a"/>
      <stop offset="40%" stop-color="#0a0520"/>
      <stop offset="100%" stop-color="#000820"/>
    </linearGradient>
    <radialGradient id="neb1" cx="0" cy="0" r="1">
      <stop offset="0%" stop-color="#5028a0" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#5028a0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="neb2" cx="1" cy="1" r="0.7">
      <stop offset="0%" stop-color="#0078c8" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0078c8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="streakGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff6b35"/>
      <stop offset="100%" stop-color="#ff3d71"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#neb1)"/>
  <rect width="${w}" height="${h}" fill="url(#neb2)"/>

  <!-- Stars -->
  ${Array.from({length:80}, () => {
    const sx = Math.floor(Math.random()*w), sy = Math.floor(Math.random()*h);
    const sr = (Math.random()*1.5+0.3).toFixed(1);
    const sa = (Math.random()*0.5+0.05).toFixed(2);
    return `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="white" opacity="${sa}"/>`;
  }).join('')}

  <!-- DOT GRID -->
  ${dotsSVG}

  <!-- BADGE ROW -->
  <!-- Days left -->
  ${rr(cardPad, badgeY, Math.round(w*0.265), badgeH, Math.round(badgeH/2), 'rgba(120,80,255,0.28)', '#8c64ff', 1)}
  <text x="${cardPad + Math.round(w*0.133)}" y="${badgeY + Math.round(badgeH*0.68)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(22)}" font-weight="700" fill="#b496ff">${daysLeft} days left</text>

  <!-- Year % -->
  <text x="${Math.round(w/2)}" y="${badgeY + Math.round(badgeH*0.68)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(20)}" fill="rgba(255,255,255,0.35)">${yr} · ${pctDone}% done</text>

  <!-- Streak badge -->
  ${rr(w - cardPad - Math.round(w*0.265), badgeY, Math.round(w*0.265), badgeH, Math.round(badgeH/2), 'url(#streakGrad)', 'none')}
  <text x="${w - cardPad - Math.round(w*0.133)}" y="${badgeY + Math.round(badgeH*0.68)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(22)}" font-weight="700" fill="white">&#128293; 12 streak</text>

  <!-- GOAL PILL -->
  ${rr(cardPad, goalY, cardW, goalH, Math.round(goalH*0.5), 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.14)', 1)}
  <circle cx="${cardPad + Math.round(w*0.04)}" cy="${goalY + goalH/2}" r="${fs(7)}" fill="#7850ff"/>
  <text x="${cardPad + Math.round(w*0.065)}" y="${goalY + goalH/2 + fs(7)}" font-family="Arial,Helvetica,sans-serif" font-size="${fs(21)}" fill="rgba(255,255,255,0.5)">Yearly Goal</text>
  <text x="${cardPad + cardW - Math.round(w*0.022)}" y="${goalY + goalH/2 + fs(7)}" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="${fs(22)}" font-weight="700" fill="rgba(255,255,255,0.92)">Build your best year yet</text>

  <!-- TASK 1 -->
  ${rr(cardPad, t1Y, cardW, t1H, Math.round(t1H*0.35), 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.11)', 1)}
  ${rr(orbX, t1Y + Math.round(t1H*0.15), orbSize, orbSize, Math.round(orbSize*0.3), 'rgba(255,107,53,0.22)', 'none')}
  <text x="${orbX + orbSize/2}" y="${t1Y + Math.round(t1H*0.65)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(24)}" fill="white">&#128170;</text>
  <text x="${textX}" y="${t1Y + Math.round(t1H*0.44)}" font-family="Arial,Helvetica,sans-serif" font-size="${fs(24)}" font-weight="700" fill="rgba(255,255,255,0.92)">Morning Workout</text>
  <text x="${textX}" y="${t1Y + Math.round(t1H*0.75)}" font-family="Arial,Helvetica,sans-serif" font-size="${fs(19)}" fill="rgba(255,255,255,0.38)">5:00 AM  45 min</text>
  ${rr(badgeTX - badgeW, t1Y + Math.round(t1H*0.27), badgeW, Math.round(t1H*0.45), Math.round(t1H*0.18), t1.bg, t1.border, 1)}
  <text x="${badgeTX - badgeW/2}" y="${t1Y + Math.round(t1H*0.59)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(18)}" font-weight="700" fill="${t1.color}">${t1.text}</text>

  <!-- TASK 2 -->
  ${rr(cardPad, t2Y, cardW, t2H, Math.round(t2H*0.35), 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.11)', 1)}
  ${rr(orbX, t2Y + Math.round(t2H*0.15), orbSize, orbSize, Math.round(orbSize*0.3), 'rgba(120,80,255,0.22)', 'none')}
  <text x="${orbX + orbSize/2}" y="${t2Y + Math.round(t2H*0.65)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(24)}" fill="white">&#128218;</text>
  <text x="${textX}" y="${t2Y + Math.round(t2H*0.44)}" font-family="Arial,Helvetica,sans-serif" font-size="${fs(24)}" font-weight="700" fill="rgba(255,255,255,0.92)">Deep Work Session</text>
  <text x="${textX}" y="${t2Y + Math.round(t2H*0.75)}" font-family="Arial,Helvetica,sans-serif" font-size="${fs(19)}" fill="rgba(255,255,255,0.38)">9:00 AM  2 hrs</text>
  ${rr(badgeTX - badgeW, t2Y + Math.round(t2H*0.27), badgeW, Math.round(t2H*0.45), Math.round(t2H*0.18), t2.bg, t2.border, 1)}
  <text x="${badgeTX - badgeW/2}" y="${t2Y + Math.round(t2H*0.59)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(18)}" font-weight="700" fill="${t2.color}">${t2.text}</text>

  <!-- WATER BAR -->
  ${rr(cardPad, waterY, cardW, waterH, Math.round(waterH*0.4), 'rgba(0,180,255,0.08)', 'rgba(0,180,255,0.22)', 1)}
  ${dropsSVG}
  <text x="${Math.round(w*0.38)}" y="${waterY + Math.round(waterH*0.44)}" font-family="Arial,Helvetica,sans-serif" font-size="${fs(22)}" font-weight="700" fill="rgba(0,200,255,0.95)">Hydration</text>
  <text x="${Math.round(w*0.38)}" y="${waterY + Math.round(waterH*0.78)}" font-family="Arial,Helvetica,sans-serif" font-size="${fs(18)}" fill="rgba(0,180,255,0.55)">${glassCount} of 8  next in ${nextWaterMin} min</text>

  <!-- QUOTE -->
  <text x="${Math.round(w/2)}" y="${quoteY}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(19)}" fill="rgba(255,255,255,0.28)" font-style="italic">&quot;${quote}&quot;</text>

  <!-- POWERED -->
  <text x="${Math.round(w/2)}" y="${poweredY}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs(14)}" fill="rgba(120,80,255,0.45)" letter-spacing="2">· POWERED BY NEURAL INTELLIGENCE ·</text>

  <!-- HOME PILL -->
  <rect x="${Math.round(w/2) - Math.round(w*0.15)}" y="${pillY}" width="${Math.round(w*0.30)}" height="${Math.round(h*0.006)}" rx="${Math.round(h*0.003)}" fill="rgba(255,255,255,0.22)"/>
</svg>`;

  try {
    const png = await sharp(Buffer.from(svg)).png({ quality: 95, compressionLevel: 6 }).toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(png);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
