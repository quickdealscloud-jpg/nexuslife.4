import sharp from 'sharp';

function getDoy(d){const s=new Date(d.getFullYear(),0,0);return Math.floor((d-s)/86400000);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

export default async function handler(req,res){
  const W=1170,H=2532;
  const now=new Date();
  const ist=new Date(now.getTime()+5.5*3600000);
  const doy=getDoy(ist);
  const left=365-doy,pct=Math.round(doy/365*100),wkDone=Math.floor(doy/7);
  const cMin=ist.getHours()*60+ist.getMinutes(),cHour=ist.getHours();
  const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MNTH=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr=`${DAYS[ist.getDay()]}, ${MNTH[ist.getMonth()]} ${ist.getDate()}`;
  const streak=12;
  const glasses=Math.min(8,Math.max(0,Math.floor((cHour-7)/2)));
  const QUOTES=['Small daily improvements lead to staggering long-term results.','Push yourself. No one else will do it for you.','What you do today shapes who you become tomorrow.','Dream it. Believe it. Build it. The time is NOW.','Every morning is a new chance to become your best self.','The secret of getting ahead is getting started.'];
  const quote=QUOTES[doy%QUOTES.length];
  const TASKS=[
    {name:'Morning Meditation',time:'5:00 AM · 20 min',sh:5,sm:0,dur:20,color:'#8B7AFF'},
    {name:'Morning Workout',   time:'5:30 AM · 45 min',sh:5,sm:30,dur:45,color:'#34D399'},
    {name:'Deep Work Session', time:'9:00 AM · 2 hrs',  sh:9,sm:0,dur:120,color:'#FB923C'},
    {name:'Review & Plan',     time:'6:00 PM · 30 min', sh:18,sm:0,dur:30,color:'#38BDF8'},
  ];

  // Build SVG
  let s=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="r1" cx="15%" cy="7%" r="60%"><stop offset="0%" stop-color="#5A46FF" stop-opacity=".36"/><stop offset="100%" stop-color="#5A46FF" stop-opacity="0"/></radialGradient>
<radialGradient id="r2" cx="88%" cy="13%" r="48%"><stop offset="0%" stop-color="#9670FF" stop-opacity=".22"/><stop offset="100%" stop-color="#9670FF" stop-opacity="0"/></radialGradient>
<radialGradient id="r3" cx="50%" cy="97%" r="62%"><stop offset="0%" stop-color="#1E96F0" stop-opacity=".13"/><stop offset="100%" stop-color="#1E96F0" stop-opacity="0"/></radialGradient>
<linearGradient id="bg" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#6C52FF"/><stop offset="100%" stop-color="#A78BFA"/></linearGradient>
<linearGradient id="sh" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="white" stop-opacity="0"/><stop offset="50%" stop-color="white" stop-opacity=".13"/><stop offset="100%" stop-color="white" stop-opacity="0"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="#07070F"/>
<rect width="${W}" height="${H}" fill="url(#r1)"/>
<rect width="${W}" height="${H}" fill="url(#r2)"/>
<rect width="${W}" height="${H}" fill="url(#r3)"/>`;

  // Grid
  for(let x=0;x<W;x+=96)s+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(255,255,255,.018)" stroke-width="1"/>`;
  for(let y=0;y<H;y+=96)s+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(255,255,255,.018)" stroke-width="1"/>`;

  // Stars seeded
  let seed=doy*7919+137;
  const rnd=()=>{seed=(seed*1664525+1013904223)&0xffffffff;return(seed>>>0)/4294967295;};
  for(let i=0;i<80;i++){
    const sx=(rnd()*W).toFixed(1),sy=(rnd()*H).toFixed(1),sr=(rnd()*2+.4).toFixed(1),so=(rnd()*.28+.05).toFixed(2);
    s+=`<circle cx="${sx}" cy="${sy}" r="${sr}" fill="rgba(255,255,255,${so})"/>`;
  }

  // Dynamic Island
  s+=`<rect x="${W/2-168}" y="28" width="336" height="94" rx="55" fill="#000"/>`;

  // Date
  s+=`<text x="62" y="200" font-family="Arial,Helvetica,sans-serif" font-size="48" font-weight="400" fill="rgba(255,255,255,.45)">${esc(dateStr)}</text>`;

  // BADGE ROW y=595
  const BY=595,BH=80;
  const badges=[
    {t:`${left} days left`,bg:'rgba(95,75,255,.22)',st:'rgba(110,90,255,.5)',fc:'#C4B0FF',w:290},
    {t:`2026 · ${pct}% done`,bg:'rgba(255,255,255,.07)',st:'rgba(255,255,255,.13)',fc:'rgba(255,255,255,.52)',w:310},
    {t:`${streak} streak`,bg:'rgba(255,95,45,.22)',st:'rgba(255,115,50,.5)',fc:'#FF9060',w:220},
  ];
  let bx=62;
  badges.forEach((b,bi)=>{
    s+=`<rect x="${bx}" y="${BY}" width="${b.w}" height="${BH}" rx="40" fill="${b.bg}" stroke="${b.st}" stroke-width="2.5"/>`;
    if(bi===2){
      // fire emoji as SVG path (orange circle with flame shape)
      s+=`<circle cx="${bx+30}" cy="${BY+BH/2}" r="14" fill="#FF6030" opacity=".9"/>`;
      s+=`<text x="${bx+28}" y="${BY+52}" font-family="Arial" font-size="34" font-weight="700" fill="${b.fc}">${esc(b.t)}</text>`;
    } else {
      s+=`<text x="${bx+30}" y="${BY+52}" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="600" fill="${b.fc}">${esc(b.t)}</text>`;
    }
    bx+=b.w+20;
  });

  // DOT GRID y=705
  const PX=60,DY=705,DH=238;
  s+=`<rect x="${PX}" y="${DY}" width="${W-PX*2}" height="${DH}" rx="40" fill="rgba(255,255,255,.042)" stroke="rgba(255,255,255,.08)" stroke-width="2"/>`;
  s+=`<rect x="${PX}" y="${DY}" width="${W-PX*2}" height="3" fill="url(#sh)"/>`;

  const COLS=26,ROWS=2,DS=20,DG=9;
  const dtw=COLS*(DS+DG)-DG;
  const dsx=PX+(W-PX*2-dtw)/2,dsy=DY+(DH-ROWS*(DS+DG+6))/2;
  for(let i=0;i<COLS*ROWS;i++){
    const col=i%COLS,row=Math.floor(i/COLS);
    const wk=Math.round((i/(COLS*ROWS))*53);
    const dx=dsx+col*(DS+DG),dy=dsy+row*(DS+DG+6);
    if(wk<wkDone){
      s+=`<rect x="${dx}" y="${dy}" width="${DS}" height="${DS}" rx="5" fill="#7B6AFF"/>`;
      s+=`<rect x="${dx}" y="${dy}" width="${DS}" height="${DS}" rx="5" fill="#8B7AFF" opacity=".5"/>`;
    } else if(wk===wkDone){
      s+=`<rect x="${dx-2}" y="${dy-2}" width="${DS+4}" height="${DS+4}" rx="6" fill="rgba(255,255,255,.15)"/>`;
      s+=`<rect x="${dx}" y="${dy}" width="${DS}" height="${DS}" rx="5" fill="#FFFFFF"/>`;
    } else {
      s+=`<rect x="${dx}" y="${dy}" width="${DS}" height="${DS}" rx="5" fill="rgba(255,255,255,.09)"/>`;
    }
  }

  // GOAL y=968
  const GY=968,GH=96;
  s+=`<rect x="${PX}" y="${GY}" width="${W-PX*2}" height="${GH}" rx="30" fill="rgba(255,255,255,.042)" stroke="rgba(255,255,255,.075)" stroke-width="2"/>`;
  s+=`<circle cx="${PX+42}" cy="${GY+GH/2}" r="11" fill="#7C6AFF"/>`;
  s+=`<text x="${PX+66}" y="${GY+57}" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="500" fill="rgba(255,255,255,.32)">Yearly Goal</text>`;
  s+=`<text x="${PX+242}" y="${GY+57}" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="rgba(255,255,255,.9)">Build your best year yet</text>`;

  // TASKS
  let TY=1086,nextSet=false;
  TASKS.forEach((t,idx)=>{
    const sm=t.sh*60+t.sm,em=sm+t.dur;
    let state,badge;
    if(cMin>=sm&&cMin<em){state='now';badge='NOW';}
    else if(cMin<sm&&!nextSet){state='next';badge='NEXT';nextSet=true;}
    else if(cMin<sm){state='later';badge='LATER';}
    else{state='done';badge='DONE';}

    const TH=140;
    let cf='rgba(255,255,255,.048)',cs='rgba(255,255,255,.08)';
    if(state==='now'){cf='rgba(95,75,255,.15)';cs='rgba(100,82,255,.45)';}
    if(state==='done') cf='rgba(255,255,255,.025)';

    s+=`<rect x="${PX}" y="${TY}" width="${W-PX*2}" height="${TH}" rx="36" fill="${cf}" stroke="${cs}" stroke-width="2.5"/>`;

    // Accent bar
    const ac=state==='now'?'#7C6AFF':state==='next'?'#34D399':'rgba(255,255,255,.15)';
    s+=`<rect x="${PX}" y="${TY+24}" width="5" height="${TH-48}" rx="3" fill="${ac}"/>`;

    // Icon circle
    const IW=90,IX=PX+28,IY=TY+(TH-IW)/2;
    s+=`<rect x="${IX}" y="${IY}" width="${IW}" height="${IW}" rx="22" fill="rgba(255,255,255,.09)"/>`;
    s+=`<circle cx="${IX+IW/2}" cy="${IY+IW/2}" r="24" fill="${t.color}" opacity="${state==='done'?.3:.75}"/>`;

    // Task name
    const top=state==='done'?.38:1;
    s+=`<text x="${PX+138}" y="${TY+56}" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700" fill="rgba(255,255,255,${top})">${esc(t.name)}</text>`;
    s+=`<text x="${PX+138}" y="${TY+96}" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="400" fill="rgba(255,255,255,${state==='done'?.28:.38})">${esc(t.time)}</text>`;

    // Progress bar (NOW)
    if(state==='now'){
      const p=Math.min(100,Math.round(((cMin-sm)/t.dur)*100));
      const bx=PX+138,by=TY+114,bw=W-PX*2-224,bh=9;
      s+=`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="5" fill="rgba(255,255,255,.08)"/>`;
      s+=`<rect x="${bx}" y="${by}" width="${Math.max(bw*p/100,8)}" height="${bh}" rx="5" fill="url(#bg)"/>`;
    }

    // Badge
    let bf,bs2,bc;
    if(state==='now'){bf='rgba(100,82,255,.35)';bs2='rgba(120,100,255,.6)';bc='#C4B0FF';}
    else if(state==='next'){bf='rgba(52,211,153,.18)';bs2='rgba(52,211,153,.35)';bc='#34D399';}
    else{bf='rgba(255,255,255,.05)';bs2='rgba(255,255,255,.09)';bc='rgba(255,255,255,.32)';}
    const bw2=badge.length*20+56,bh2=54;
    const bx2=W-PX-bw2-16,by2=TY+20;
    s+=`<rect x="${bx2}" y="${by2}" width="${bw2}" height="${bh2}" rx="27" fill="${bf}" stroke="${bs2}" stroke-width="1.5"/>`;
    s+=`<text x="${bx2+bw2/2}" y="${by2+36}" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="${bc}" text-anchor="middle" letter-spacing="2">${badge}</text>`;

    TY+=TH+14;
  });

  // WATER
  const WY=TY,WH=126;
  s+=`<rect x="${PX}" y="${WY}" width="${W-PX*2}" height="${WH}" rx="34" fill="rgba(255,255,255,.042)" stroke="rgba(56,189,248,.22)" stroke-width="2"/>`;
  s+=`<text x="${PX+38}" y="${WY+44}" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="600" fill="rgba(255,255,255,.3)" letter-spacing="3">HYDRATION</text>`;
  for(let i=0;i<8;i++){
    const op=i<glasses?'1':'.14';
    const fill=i<glasses?'#38BDF8':'rgba(255,255,255,.3)';
    s+=`<ellipse cx="${PX+52+i*68}" cy="${WY+86}" rx="16" ry="20" fill="${fill}" opacity="${op}"/>`;
    if(i<glasses) s+=`<ellipse cx="${PX+52+i*68}" cy="${WY+78}" rx="5" ry="6" fill="rgba(255,255,255,.4)"/>`;
  }
  s+=`<text x="${W-PX-38}" y="${WY+74}" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="600" fill="rgba(56,189,248,.9)" text-anchor="end">${glasses} of 8 glasses</text>`;

  // QUOTE
  const QY=WY+WH+16,QH=172;
  s+=`<rect x="${PX}" y="${QY}" width="${W-PX*2}" height="${QH}" rx="34" fill="rgba(255,255,255,.033)" stroke="rgba(255,255,255,.06)" stroke-width="2"/>`;
  s+=`<text x="${W-PX+20}" y="${QY+158}" font-family="Georgia,serif" font-size="200" font-weight="900" fill="rgba(95,75,255,.12)" text-anchor="end">&#x201C;</text>`;

  // Quote text wrap
  const maxC=50;
  const qw=quote.split(' ');let ql='',qls=[];
  qw.forEach(w=>{if((ql+w).length>maxC&&ql){qls.push(ql.trim());ql=w+' ';}else ql+=w+' ';});
  if(ql.trim())qls.push(ql.trim());
  qls.forEach((l,li)=>{
    const txt=li===0?`"${l}`:li===qls.length-1?`${l}"`:l;
    s+=`<text x="${PX+40}" y="${QY+54+li*46}" font-family="Arial,Helvetica,sans-serif" font-size="32" font-style="italic" font-weight="500" fill="rgba(255,255,255,.5)">${esc(txt)}</text>`;
  });
  s+=`<text x="${PX+40}" y="${QY+54+qls.length*46+6}" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="600" fill="#9B8AFF">— Nexus Life OS</text>`;

  // POWERED
  s+=`<text x="${W/2}" y="${H-62}" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="400" fill="rgba(255,255,255,.1)" text-anchor="middle" letter-spacing="4">POWERED BY NEURAL INTELLIGENCE</text>`;

  // HOME BAR
  s+=`<rect x="${W/2-204}" y="${H-36}" width="408" height="14" rx="7" fill="rgba(255,255,255,.22)"/>`;
  s+=`</svg>`;

  const png=await sharp(Buffer.from(s)).png({compressionLevel:6}).toBuffer();
  res.setHeader('Content-Type','image/png');
  res.setHeader('Cache-Control','no-cache,no-store,must-revalidate');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.send(png);
}
