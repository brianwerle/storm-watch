// STORM WATCH — cutaway lunar base crisis game.
const $ = s => document.querySelector(s);
const SPEED = +new URLSearchParams(location.search).get('speed') || 1; // ?speed=5 for quick testing
const DT = 0.25;

const SPECIAL_FLARES = [
  { sev: 0.8, warn: 7, storm: 8 },
  { sev: 1.0, warn: 5, storm: 8 },
  { sev: 1.2, warn: 5, storm: 9 },
  { sev: 1.5, warn: 4, storm: 10 }
];

function isSpecialRound() {
  return S.round === EVENTS.length - 1;
}

function currentFlare() {
  if (isSpecialRound()) {
    return SPECIAL_FLARES[S.flare - 1];
  }
  return EVENTS[S.round];
}



// ---------- NASA DONKI space-weather data ----------
// Storm 1 is the strongest flare of the last 30 days (fetched live).
// Storms 2 and 3 are fixed famous events, also fetched from DONKI by ID.
// Each has a saved copy so the game still works with no internet.
const DONKI = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/';
const SAVED_LIVE = { cls: 'M3.5', peak: '2026-11-05T18:33Z', region: null, loc: null };
const CAMPAIGN = [
  { key: 'live', title: 'Latest Big Flare', calm: 1 , warn: 1, storm: 1 },
  { key: '2024', flrID: '2024-05-11T01:10:00-FLR-001', from: '2024-05-11', to: '2024-05-11',
    title: 'The Gannon Storm', sev: 2.5, calm: 1 ,warn: 1, storm: 1,
    fact: 'This flare was part of a chain of eruptions in May 2024 that caused the strongest geomagnetic storm at Earth in over 20 years. People saw auroras much farther south than usual.',
    saved: { cls: 'X5.8', peak: '2024-05-11T01:23Z', region: 13664, loc: 'S17W47', sepTime: '2024-05-11T02:10Z', sepInst: 'GOES-P: SEISS >100 MeV' } },
  { key: '2017', 
    flrID: '2017-09-10T15:35:00-FLR-001', 
    from: '2017-09-10', to: '2017-09-10',
    title: 'The X8.2 Flare', 
    sev: 2.8, 
    calm: 1,
    warn: 1, 
    storm: 1,
    fact: 'One of the biggest flares of its solar cycle. On Mars, NASA\'s Curiosity rover measured surface radiation roughly doubling with its RAD instrument, the same kind of data future crews will use to plan for deep-space missions.',
    saved: { cls: 'X8.2', peak: '2017-09-10T16:06Z', region: 12673, loc: 'S08W88', sepTime: '2017-09-10T16:25Z', sepInst: 'GOES13: SEM/EPS >100 MeV' } 
  },
  { key: '2023', 
    flrID: '2023-05-11T08:47:00-FLR-001',
    from: '2023-05-11', to: '2023-05-11',
    title: 'The X3.3 Flare',
    sev: 2.3,
    calm: 1,
    warn: 1,
    storm: 1,
    fact: 'This flare is immediately preceded by a C-class flare, with approximate peak intensity C7.9 and peak time 2023-05-11T18:23Z from AR 3297 (N10W40).',
    saved: {cls: 'X3.3', peak: '2023-05-11T08:47:00-FLR-001', region: '13294', loc: 'S06W46', sepTime: '2023-05-11T09:01Z', sepInst: 'GOES-P: EXIS 1.0-8.0'}
  },  
  {
    key: '2022',
    flrID: '2022-06-13T03:01:00-FLR-001',
    from: '2022-06-13T03:01Z', to: '2022-06-13T03:01Z',
    title: "The M3.4 Flare",
    sev: 1.3,
    calm: 1,
    warn: 1,
    storm: 1,
    Fact: 'The intense extreme ultraviolet (EUV) radiation ionized Earth upper atmosphere, causing an R1 (minor) shortwave radio blackout over parts of Japan, Southeast Asia, and the Asia-Pacific region.',
    saved: {cls: 'M3.4', peak: '2022-06-13T04:07Z', region: '13032', loc: 'N26E53', sepTIME: '2022-06-13T03:01Z', sepInst: 'GOES-P: EXIS 1.0-8.0'}
  },
  {
    key: '2026',
    flrID: '2026-10-16T15:38:00-FLR-001',
    from: '2026-10-16', to: '2026-10-16',
    title: "The M1.3 Flare",
    sev: 1.1,
    calm: 1,
    warn: 1,
    storm: 1,
    Fact: 'NASA and space weather monitors recorded M-class flare events alongside general background C-class activity. This is the most recent record',
    saved: {cls: "M1.3", peak: '2026-10-16T15:42Z', region: '14551', loc: 'S15W48', sepTIME: '2026-10-19T08:54Z', sepInst: 'GOES-P: EXIS 1.0-8.0'} 
  },
  {
    key: '2023',
    flrID: '2023-08-08T09:20:00-FLR-001',
    from: '2023-08-08', to: '023-08-08',
    title: "The X1.6 Flare",
    sev: 2.2,
    calm: 1,
    warn: 1,
    storm: 1,
    Fact: 'On August 8, 2023, two consecutive X-class solar flares (an X1.6 flare on August 5 and an X1.5 flare on August 7 from sunspot region AR3386) combined their coronal mass ejections (CMEs) in a fast-moving storm front.',
    saved: {cls: "X1.6", peak: '2023-08-08T09:31Z', region: '13387', loc: 'N18W78', sepTIME: '2023-08-08T09:20Z', sepInst: 'GOES-P: EXIS 1.0-8.0'}
  },
  {
    key: '2022',
    flrID: '2022-12-09T13:59:00-FLR-001',
    from: '2022-12-09', to: '2022-12-09',
    title: "The C6 Flare",
    sev: '0.6',
    calm: 1,
    warn: 1,
    storm: 1,
    Fact: 'On December 9, 2022, minor to moderate solar activity included small C-class solar flares, such as a C-class eruption recorded around active sunspot regions',
    saved: {cls: 'C6', peak: '2022-12-09T14:13Z', region: '13163', loc: 'S20E90', sepTIME: '2022-12-09T13:59Z', sepInst: 'GOES-P: EXIS 1.0-8.0'}
  },
  {
    key: '2025',
    flrID: '2025-10-09T12:11:00-FLR-001',
    from: '2025-10-09', to: '2025-10-09',
    title: 'The M2 Flare',
    sev: 1.2,
    calm: 1,
    warn: 1,
    storm: 1,
    Fact: 'On October 9, 2025, an M2-class solar flare erupted from the Sun west limb, which was also associated with a prominence eruption observed by India Aditya-L1 spacecraft Visible Emission Line Coronagraph.',
    saved: {cls: 'M2', peak: '2025-10-09T12:31Z', region: 14236, loc: 'N05W95', sepTIME: '2025-10-09T12:11Z', sepInst: 'GOES-P: EXIS 1.0-8.0'}
  }
  
];

// Flare classes go A, B, C, M, X; each letter is 10x stronger. Returns strength in "M units".
const mUnits = c => ({ A: 1e-3, B: 1e-2, C: 0.1, M: 1, X: 10 }[c[0]] || 0) * (parseFloat(c.slice(1)) || 1);
const iso = d => d.toISOString().slice(0, 10);

function makeEvent(c, d, fromNasa) {
  const mins = d.sepTime ? Math.round((new Date(d.sepTime) - new Date(d.peak)) / 6e4) : null;
  const date = new Date(d.peak).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  const ev = { ...c, ...d, mins, date, fromNasa };
  if (c.key === 'live') {
    ev.sev = Math.max(0.6, Math.min(1.3, 0.6 + 0.4 * Math.log10(Math.max(1, mUnits(d.cls)))));
    ev.fact = 'This is the strongest solar flare NASA recorded in the last 30 days. ' + (mins != null
      ? `Radiation particles from it were detected ${mins} minutes later.`
      : 'It did not send a radiation storm toward the Moon. Most flares don\'t, but a crew has to be ready every time, so this drill treats it as the real thing.');
  } 
  
  return ev;
}

let EVENTS = CAMPAIGN.map(c => makeEvent(c, c.key === 'live' ? SAVED_LIVE : c.saved, false));

async function getJSON(path) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(DONKI + path, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } finally { clearTimeout(to); }
}

// Flare record + list of particle events (SEP) -> the fields the game uses
function pick(flr, seps) {
  const linked = (seps || [])
    .filter(s => (s.linkedEvents || []).some(l => l.activityID === flr.flrID) && s.eventTime > flr.peakTime)
    .sort((a, b) => a.eventTime < b.eventTime ? -1 : 1);
  const inst = s => (s.instruments && s.instruments[0] && s.instruments[0].displayName) || '';
  const sep = linked.find(s => />100 MeV/.test(inst(s))) || linked[0];
  return { cls: flr.classType, peak: flr.peakTime, region: flr.activeRegionNum, loc: flr.sourceLocation, link: flr.link,
    sepTime: sep && sep.eventTime, sepInst: sep && inst(sep) };
}

async function loadEvents() {
  const now = new Date(), start = new Date(now - 30 * 864e5);
  EVENTS = await Promise.all(CAMPAIGN.map(async c => {
    try {
      const range = c.key === 'live' ? `startDate=${iso(start)}&endDate=${iso(now)}` : `startDate=${c.from}&endDate=${c.to}`;
      const [flrs, seps] = await Promise.all([getJSON('FLR?' + range), getJSON('SEP?' + range)]);
      const flr = c.key === 'live' ? flrs.sort((a, b) => mUnits(b.classType) - mUnits(a.classType))[0] : flrs.find(f => f.flrID === c.flrID);
      if (!flr) throw new Error('no flare');
      return makeEvent(c, pick(flr, seps), true);
    } catch (e) {
      return makeEvent(c, c.key === 'live' ? SAVED_LIVE : c.saved, false);
    }
  }));
}

// ---------- world layout (canvas units: 1200 x 640) ----------
const W = 1200, H = 640, SURF = 250, SHAFT = 600;
const ZONES = {
  eva:     { name: 'MOON SURFACE',  tag: 'no protection',  rad: 1.0, x: 30,  y: 110, w: 520, h: 140, floor: 250, slot: i => 130 + i * 85 },
  green:   { name: 'GREENHOUSE',    tag: 'thin walls',     rad: 0.5, x: 230, y: 290, w: 350, h: 140, floor: 422, slot: i => 280 + i * 75 },
  work:    { name: 'WORKSHOP',      tag: 'thin walls',     rad: 0.5, x: 620, y: 290, w: 350, h: 140, floor: 422, slot: i => 665 + i * 75 },
  shelter: { name: 'STORM SHELTER', tag: 'deep + shielded', rad: 0.1, x: 425, y: 470, w: 350, h: 130, floor: 592, slot: i => 480 + i * 80 },
};
const SYSTEMS = {
  o2:     { name: 'Oxygen', icon: '💨', tank: 'o2',   at: [715, 318] },
  h2o:    { name: 'Water',  icon: '💧', tank: 'h2o',  at: [885, 318] },
  farm:   { name: 'Food',   icon: '🌱', tank: 'food', at: [405, 312] },
  shield: { name: 'Shield', icon: '🛡️', tank: null,   at: [600, 455] },
};


const KW_PER_LEVEL = 2, WALK = 110;

let S; // game state

const CARGO_BUDGET = 12;

const CARGO = {
  o2:   { label: 'Oxygen', cost: 2, amount: 10 },
  h2o:  { label: 'Water',  cost: 2, amount: 10 },
  food: { label: 'Food',   cost: 1, amount: 10 },
};


function newGame() {
S = {
    round: 0,
    flare: 1,
    phase: 'brief',
    t: 0,
    dur: 1,
    I: 0,
    supply: 14,
    sel: null,
    drag: null,
    ptr: null,
    science: 0,
    tanks: { o2: 70, h2o: 70, food: 70 },
    loadout: { o2: 0, h2o: 0, food: 0 },
    sys: { o2: { lvl: 2 }, h2o: { lvl: 2 }, farm: { lvl: 2 }, shield: { lvl: 0 } },
    crew: [
      { id: 'ada',  name: 'Ada',  role: 'Pilot',     perk: 'runs 2x faster',     color: '#37d6ff', zone: 'work' },
      { id: 'kai',  name: 'Kai',  role: 'Engineer',  perk: 'easier repairs',     color: '#ffb938', zone: 'work' },
      { id: 'rosa', name: 'Rosa', role: 'Botanist',  perk: 'grows 2x food',      color: '#4be38a', zone: 'green' },
      { id: 'sam',  name: 'Sam',  role: 'Geologist', perk: '2x science outside', color: '#c58bff', zone: 'eva' }
    ],
    stats: { breaks: 0 },
    fx: [],
    banner: null,
    shake: 0
  };
  S.crew.forEach((c, i) => Object.assign(c, { i, x: ZONES[c.zone].slot(i), y: ZONES[c.zone].floor, path: [], dir: 1, dose: 0, health: 100, out: false }));
  for (const k in S.sys) Object.assign(S.sys[k], { broken: false, repair: 0 });
  buildUI();
  render();
}

const at = z => S.crew.filter(c => !c.out && !c.path.length && c.zone === z);
const lvl = k => S.sys[k].broken ? 0 : S.sys[k].lvl;
const used = () => Object.values(S.sys).reduce((a, s) => a + s.lvl * KW_PER_LEVEL, 0);
const playing = () => ['calm', 'warning', 'storm'].includes(S.phase);

// ---------- sound + voice ----------
let muted = false, actx;
function beep(freq = 440, dur = 0.15, type = 'square') {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = 0.05;
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) {}
}
function say(text) {
  if (muted || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; u.pitch = 0.9;
    speechSynthesis.speak(u);
  } catch (e) {}
}
let capTimer;
function log(text, cls = '', speak = false) {
  const el = $('#caption');
  el.textContent = text; el.className = 'show ' + cls;
  clearTimeout(capTimer); capTimer = setTimeout(() => el.className = cls, 6000);
  if (speak) say(text);
}

// ---------- bottom bars (crew chips, power, systems) ----------
function buildUI() {  
  $('#crewbar').innerHTML = '';
  S.crew.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.innerHTML = `<b><i class="dot" style="background:${c.color}"></i>${c.name} <small>${c.role}</small></b><span class="st"></span>
      <div class="bar dose" title="Radiation dose (red line = NASA career limit)"><i></i></div>`;
    b.onclick = () => { S.sel = S.sel === c.id ? null : c.id; render(); };
    $('#crewbar').appendChild(b); c.el = b;
  });
  $('#systems').innerHTML = Object.entries(SYSTEMS).map(([k, s]) =>
    `<div class="sys" data-s="${k}"><div class="name">${s.icon} ${s.name} <small></small></div>
     <div class="bar"><i></i></div>
     <div class="ctl"><button data-d="-1">−</button><div class="pips"><i></i><i></i><i></i></div><button data-d="1">+</button></div>
     <button class="fix">🔧 FIX IT</button></div>`).join('');
  document.querySelectorAll('.sys .ctl button').forEach(b => b.onclick = () => setLevel(b.closest('.sys').dataset.s, +b.dataset.d));
  document.querySelectorAll('.sys .fix').forEach(b => b.onclick = () => openFix(b.closest('.sys').dataset.s));
}

function setLevel(k, d) {
  const s = S.sys[k], n = s.lvl + d;
  if (n < 0 || n > 3) return;
  if (d > 0 && used() + KW_PER_LEVEL > S.supply) { log('Not enough power. Turn something else down first.', 'warn'); beep(180, 0.1); return; }
  s.lvl = n; beep(600 + n * 80, 0.05, 'sine'); render();
}

function render() {
  document.body.className = S.phase;

  if (isSpecialRound() && playing()) {
    $('#round').textContent = 'SPECIAL ROUND · FLARE ' + S.flare + ' / ' + SPECIAL_FLARES.length;
  } else {
    $('#round').textContent = 'Storm ' + Math.min(S.round + 1, EVENTS.length) + ' / ' + EVENTS.length;
  }

  $('#phase').textContent = { brief: 'STANDBY', calm: 'ALL CLEAR', warning: 'STORM INCOMING', storm: 'RADIATION STORM', debrief: 'DEBRIEF', end: 'MISSION OVER' }[S.phase];
  $('#timer').textContent = playing() ? Math.ceil(S.t) : '--';
  $('#pwrUsed').textContent = used();
  $('#pwrMax').textContent = S.supply;
  $('#pwrBar').style.width = Math.min(100, used() / S.supply * 100) + '%';
  $('#science').textContent = Math.floor(S.science);

  for (const k in S.sys) {
    const s = S.sys[k];
    const def = SYSTEMS[k];
    const el = document.querySelector('.sys[data-s="' + k + '"]');
    const v = def.tank ? S.tanks[def.tank] : lvl('shield') * 20;

    el.classList.toggle('broken', s.broken);
    el.classList.toggle('low', !!def.tank && v < 25);
    el.querySelectorAll('.pips i').forEach((p, i) => p.classList.toggle('on', i < s.lvl));
    el.querySelector('small').textContent = s.broken ? 'BROKEN' : def.tank ? Math.round(v) + '%' : v ? '-' + v + '% radiation' : 'off';
    el.querySelector('.bar i').style.width = (def.tank ? v : v / 0.6) + '%';
  }

  S.crew.forEach(c => {
    c.el.className = 'chip' + (S.sel === c.id ? ' sel' : '') + (c.out ? ' out' : '');
    c.el.querySelector('.st').textContent = c.out ? 'Evacuated to medical' : `${c.perk} · ${Math.round(c.dose * 10)} mSv`;
    c.el.querySelector('.dose i').style.width = Math.min(100, c.dose) + '%';
  });
}

// ---------- crew movement ----------
function orderMove(c, zone) {
  if (!c || c.out || !playing() || (c.zone === zone && !c.path.length)) return;
  const z = ZONES[zone], tx = z.slot(c.i);
  c.zone = zone; c.path = [];
  if (Math.abs(c.y - z.floor) > 1) {            // different level: go via the ladder shaft
    if (Math.abs(c.x - SHAFT) > 1) c.path.push([SHAFT, c.y]);
    c.path.push([SHAFT, z.floor]);
  }
  c.path.push([tx, z.floor]);
  beep(520, 0.06, 'sine');
}
function stepCrew(dt) {
  S.crew.forEach(c => {
    let d = WALK * (c.role === 'Pilot' ? 2 : 1) * dt;
    while (c.path.length && d > 0) {
      const [tx, ty] = c.path[0], dx = tx - c.x, dy = ty - c.y, len = Math.hypot(dx, dy);
      if (dx) c.dir = Math.sign(dx);
      if (len <= d) { c.x = tx; c.y = ty; c.path.shift(); d -= len; }
      else { c.x += dx / len * d; c.y += dy / len * d; d = 0; }
    }
  });
}
// radiation factor depends on where the astronaut actually is right now
const radAt = c => !c.path.length ? ZONES[c.zone].rad : c.y <= SURF + 2 ? 1 : c.y < 440 ? 0.5 : c.y >= 590 ? 0.1 : 0.3;

// ---------- game loop ----------
function setPhase(p, dur, banner) { S.phase = p; S.t = S.dur = dur; if (banner) S.banner = { text: banner, t: 2.2 }; }

function startRound() {
  S.stats = { breaks: 0 };
  if (!isSpecialRound()) S.flare = 1;

  const ev = EVENTS[S.round];

  if (isSpecialRound()) {
    setPhase('calm', 2, 'ALL CLEAR');
  } else {
    setPhase('calm', ev.calm, 'ALL CLEAR');
  }

  $('#modal').classList.remove('show', 'fixing');
  log('All clear. Collect science outside and keep supplies topped up.', 'good', true);
}

function tick() {
   walkClock();
  if (!playing()) return;

  const dt = DT * SPEED;
  const flare = currentFlare();
  const ev = isSpecialRound() ? flare : EVENTS[S.round];

  S.t -= dt;

  // power: solar arrays fold into safe mode during the storm
  S.supply = S.phase === 'storm' ? 10 : 14;
  let shed = false;
  for (const k of ['farm', 'h2o', 'o2', 'shield']) while (used() > S.supply && S.sys[k].lvl > 0) { S.sys[k].lvl--; shed = true; }
  if (shed) log('Solar panels folded for safety. Less power: some systems were turned down.', 'warn');

  // storm intensity rises, peaks, then fades
  S.I = S.phase === 'storm' ? ev.sev * 3 * Math.pow(Math.sin(Math.PI * (1 - S.t / S.dur)), 0.7) || 0 : 0;

  const active = S.crew.filter(c => !c.out);

  // supplies
  const eat = active.length / 4;
  const farmers = at('green').reduce((a, c) => a + (c.role === 'Botanist' ? 2 : 1), 0);
  const T = S.tanks;
  T.o2   += (0.6 * lvl('o2')  - 1.2 * eat) * dt;
  T.h2o  += (0.5 * lvl('h2o') - 1.0 * eat) * dt;
  T.food += ((lvl('farm') ? 0.25 * lvl('farm') + 0.2 * farmers : 0) - 0.8 * eat) * dt;
  for (const k in T) T[k] = Math.max(0, Math.min(100, T[k]));

  // science from the surface
  at('eva').forEach(c => {
    const g = c.role === 'Geologist' ? 2 : 1;
    S.science += g * dt;
    if (Math.random() < 0.35 * dt) S.fx.push({ x: c.x, y: c.y - 70, text: '★+' + g, t: 1.2, color: '#ffb938' });
  });

  // storm breaks things
  if (S.phase === 'storm' && Math.random() < 0.05 * ev.sev * dt) {
    const ok = Object.keys(S.sys).filter(k => !S.sys[k].broken && S.sys[k].lvl > 0);
    if (ok.length) {
      const k = ok[Math.floor(Math.random() * ok.length)];
      S.sys[k].broken = true; S.sys[k].repair = 0; S.stats.breaks++; S.shake = 0.4;
      log(`${SYSTEMS[k].name} system knocked out! Send someone to the Workshop and press FIX.`, 'bad', true);
      beep(140, 0.4, 'sawtooth');
    }
  }
  // slow automatic repair while someone is in the Workshop (the mini-game is much faster)
  const broken = Object.keys(S.sys).find(k => S.sys[k].broken);
  if (broken && at('work').length) {
    S.sys[broken].repair += 4 * at('work').length * dt;
    if (S.sys[broken].repair >= 100) repaired(broken);
  }

  // radiation dose + health
  const cut = 1 - 0.2 * lvl('shield');
  active.forEach(c => {
    c.dose += S.I * radAt(c) * cut * dt;
    if (T.o2 <= 0) c.health -= 4 * dt;
    if (T.h2o <= 0) c.health -= 1.5 * dt;
    if (T.food <= 0) c.health -= 1 * dt;
    if (c.dose >= 100) c.health = 0;
    if (c.health <= 0) {
      c.health = 0; c.out = true; c.path = [];
      log(`${c.name} is too sick to continue and has been evacuated.`, 'bad', true);
    }
  });

  if (S.phase === 'storm' && Math.round(S.t / dt) % 4 === 0) beep(330, 0.08);
  if (S.phase === 'warning' && Math.round(S.t / dt) % 4 === 0) beep(700, 0.04, 'sine');

  // phase changes
  if (!S.crew.some(c => !c.out)) endGame();
  else if (S.t <= 0) {
    if (S.phase === 'calm') {
      const warnTime = isSpecialRound() ? flare.warn : ev.warn;
      setPhase('warning', warnTime, 'STORM INCOMING');
      const label = isSpecialRound() ? `Special flare ${S.flare} of ${SPECIAL_FLARES.length}` : `${ev.cls} solar flare`;
      log(`${label} detected! Radiation storm hits in ${warnTime} seconds. Everyone to the Storm Shelter!`, 'warn', true);
    } else if (S.phase === 'warning') {
      const stormTime = isSpecialRound() ? flare.storm : ev.storm;
      setPhase('storm', stormTime, 'RADIATION STORM'); S.shake = 0.8;
      log('The radiation storm has reached the outpost!', 'bad', true);
    } else if (isSpecialRound()) {
      if (S.flare >= SPECIAL_FLARES.length) {
        debrief();
      } else {
        S.flare++;
        setPhase('calm', 2, 'NEXT FLARE');
        log(`Flare ${S.flare} is incoming. Stay ready!`, 'warn', true);
      }
    } else {
      debrief();
    }
  }

  render();
}

function repaired(k) {
  S.sys[k].broken = false; S.sys[k].repair = 0;
  log(`${SYSTEMS[k].name} system repaired.`, 'good'); beep(880, 0.12, 'sine');
  const [x, y] = SYSTEMS[k].at; S.fx.push({ x, y, text: '✔ FIXED', t: 1.5, color: '#4be38a' });
}

// ---------- repair mini-game: match the plugs ----------
function openFix(k) {
  if (!S.sys[k].broken || !playing()) return;
  if (!at('work').length) { log('Nobody is in the Workshop. Drag a crew member there first.', 'warn'); beep(180, 0.1); return; }
  const n = at('work').some(c => c.role === 'Engineer') ? 3 : 4;
  const plugs = [['#ff4d5e', '●'], ['#37d6ff', '▲'], ['#4be38a', '■'], ['#ffb938', '◆']].slice(0, n);
  const order = plugs.map((_, i) => i).sort(() => Math.random() - 0.5);
  const btn = (i, side) => `<button data-i="${i}" data-side="${side}" style="background:${plugs[i][0]};border-color:${plugs[i][0]}">${plugs[i][1]}</button>`;
  $('#card').innerHTML = `<h2>🔧 FIX: ${SYSTEMS[k].name.toUpperCase()}</h2><p>Tap a plug on the left, then its matching socket on the right.</p>
    <div class="wires"><div>${plugs.map((_, i) => btn(i, 'L')).join('')}</div><div>${order.map(i => btn(i, 'R')).join('')}</div></div>`;
  $('#modal').classList.add('show', 'fixing');
  let picked = null, done = 0;
  $('#card').querySelectorAll('.wires button').forEach(b => b.onclick = () => {
    if (b.dataset.side === 'L') {
      $('#card').querySelectorAll('.pick').forEach(p => p.classList.remove('pick'));
      picked = b; b.classList.add('pick'); beep(500, 0.04, 'sine');
    } else if (picked && picked.dataset.i === b.dataset.i) {
      picked.classList.remove('pick'); picked.classList.add('done'); b.classList.add('done'); picked = null; beep(760, 0.06, 'sine');
      if (++done === n) { $('#modal').classList.remove('show', 'fixing'); repaired(k); render(); }
    } else beep(160, 0.15);
  });
}

// ---------- cards ----------
function crewLine(c) { return `<li><b style="color:${c.color}">${c.name}</b>: ${c.out ? 'evacuated' : `health ${Math.round(c.health)}%`}, total dose ${Math.round(c.dose * 10)} mSv</li>`; }

function debrief() {
  const ev = EVENTS[S.round];
  S.phase = 'debrief'; S.I = 0;
  const worst = Math.max(...S.crew.map(c => c.dose));
  const last = S.round === EVENTS.length - 1;
  say('Storm has passed. Stand by for debrief.');
  showCard(`
    <h2>STORM ${S.round + 1} SURVIVED</h2>
    <ul>${S.crew.map(crewLine).join('')}</ul>
    <p>Systems knocked out: <b>${S.stats.breaks}</b> · Highest crew dose so far: <b>${Math.round(worst * 10)} mSv</b> (NASA career limit: 600 mSv)</p>
    <h3>${ev.mins != null ? 'THIS REALLY HAPPENED' : 'REAL FLARE, PRACTICE STORM'} — ${ev.date}</h3>
    <div class="real"><b>${ev.title}.</b> ${ev.fact || 'No additional event details are available.'}</div>
    <table class="data">
      <tr><td>Flare class</td><td><b>${ev.cls}</b> (peak ${ev.peak.slice(11, 16)} UTC)</td></tr>
      ${ev.region ? `<tr><td>Sunspot region</td><td>${ev.region}${ev.loc ? ` at ${ev.loc}` : ''}</td></tr>` : ''}
      <tr><td>Real warning time</td><td>${ev.mins != null
        ? `<b>${ev.mins} minutes</b> from flare peak to radiation at ${ev.sepTime.slice(11, 16)} UTC (${ev.sepInst})`
        : 'No radiation storm recorded for this flare'}</td></tr>
    </table>
    <p class="src">${ev.fromNasa ? '● Loaded live from NASA DONKI' : '○ Saved copy of NASA DONKI data (offline)'}${ev.link ? ` · <a href="${ev.link}" target="_blank" rel="noopener">view NASA record</a>` : ''}</p>
    <button class="go" id="go">${last ? 'See final rating' : 'Next storm ▶'}</button>`,
    () => { if (last) endGame(); else { S.round++; startRound(); } });
}

function endGame() {
  S.phase = 'end'; S.I = 0;
  const alive = S.crew.filter(c => !c.out);
  const T = S.tanks;
  const score = Math.round(S.science + S.crew.reduce((a, c) => a + c.health, 0) * 2 + T.o2 + T.h2o + T.food
    - S.crew.reduce((a, c) => a + c.dose, 0));
  let rating = score >= 1000 ? 'FLIGHT DIRECTOR' : score >= 800 ? 'MISSION COMMANDER' : score >= 550 ? 'MISSION SPECIALIST' : 'CADET — BACK TO TRAINING';
  if (alive.length < 4 && score >= 800) rating = 'MISSION SPECIALIST';
  if (!alive.length) rating = 'MISSION FAILED';
  say(`Mission over. Your flight readiness rating is ${rating}.`);
  showCard(`
    <h2>FLIGHT READINESS RATING</h2>
    <div class="rating">${rating}</div>
    <p>Score: <b>${score}</b> · Science: <b>${Math.floor(S.science)}</b> · Crew still on duty: <b>${alive.length} / 4</b></p>
    <ul>${S.crew.map(crewLine).join('')}</ul>
    <p>Supplies left: oxygen ${Math.round(T.o2)}%, water ${Math.round(T.h2o)}%, food ${Math.round(T.food)}%</p>
    <button class="go" id="go">Play again</button>`, () => { newGame(); intro(); });
}

function showCard(html, onGo) {
  $('#card').innerHTML = html;
  $('#modal').classList.remove('fixing'); $('#modal').classList.add('show');
  $('#go').onclick = onGo;
  render();
}

function launchMission() {
  for (const k in CARGO) {
    S.tanks[k] = Math.min(100, 30 + S.loadout[k] * CARGO[k].bonus);
  }
  startRound();
}

function showPrep() {
  const redraw = () => {
    const spent = Object.entries(CARGO).reduce((sum, [k, item]) => sum + S.loadout[k] * item.cost, 0);
    const remaining = CARGO_BUDGET - spent;

    showCard(`
      <h2>PREPARE FOR LAUNCH</h2>
      <p>Choose supplies for the trip. Cargo points remaining: <b>${remaining}</b> / ${CARGO_BUDGET}</p>
      <ul class="how">
        ${Object.entries(CARGO).map(([k, item]) => `
          <li>
            <b>${item.label}</b> · ${S.loadout[k]} packs
            <div class="prep-ctrl">
              <button type="button" data-cargo="${k}" data-d="-1" ${S.loadout[k] === 0 ? 'disabled' : ''}>−</button>
              <button type="button" data-cargo="${k}" data-d="1" ${remaining < item.cost ? 'disabled' : ''}>+</button>
            </div>
          </li>
        `).join('')}
      </ul>
      <button class="go" id="go">Launch mission ▶</button>
    `, launchMission);

    $('#card').querySelectorAll('[data-cargo]').forEach(button => {
      button.onclick = () => {
        const k = button.dataset.cargo;
        const change = Number(button.dataset.d);
        const next = S.loadout[k] + change;
        if (next < 0) return;

        const newSpent = Object.entries(CARGO).reduce((sum, [key, item]) => {
          const value = key === k ? next : S.loadout[key];
          return sum + value * item.cost;
        }, 0);

        if (newSpent > CARGO_BUDGET) return;

        S.loadout[k] = next;
        redraw();
      };
    });
  };

  redraw();
}

let loaded;
function intro() {
  showCard(`
    <h2>STORM WATCH</h2>
    <p>You run a Moon base. Three <b>real solar storms</b> are coming. Keep your crew safe!</p>
    <ul class="how">
      <li>🧑‍🚀 <b>Drag astronauts</b> between rooms.</li>
      <li>⭐ Outside they collect <b>science</b>, but have no protection.</li>
      <li>🚨 When the alarm sounds, get everyone <b>down to the Storm Shelter</b>.</li>
      <li>🔧 If something breaks, send someone to the <b>Workshop</b> and press <b>FIX</b>.</li>
      <li>⚡ Use <b>+ / −</b> to share power between oxygen, water, food and the shield.</li>
    </ul>
    <p class="src" id="src">Contacting NASA for solar storm data…</p>
    <button class="go" id="go" disabled>Begin mission ▶</button>`, showPrep);
  loaded = loaded || loadEvents();
  loaded.then(() => {
    const n = EVENTS.filter(e => e.fromNasa).length;
    $('#src').textContent = n === EVENTS.length ? `● Live NASA DONKI data loaded. Storm 1 is the strongest flare of the last 30 days: ${EVENTS[0].cls} on ${EVENTS[0].date}.`
      : n ? `◐ ${n} of ${EVENTS.length} storms loaded live from NASA; the rest use saved NASA data.`
      : '○ NASA is unreachable right now. Using saved NASA DONKI data.';
    $('#go').disabled = false;
  });
}

// ---------- pointer input on the scene ----------
const cv = $('#scene'), g = cv.getContext('2d');
const toWorld = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
const zoneAt = (x, y) => Object.keys(ZONES).find(k => { const z = ZONES[k]; return x >= z.x && x <= z.x + z.w && y >= z.y - 10 && y <= z.y + z.h + 10; });
const crewAt = (x, y) => S.crew.find(c => !c.out && Math.abs(x - c.x) < 24 && y > c.y - 78 && y < c.y + 12);
const fixAt = (x, y) => Object.keys(SYSTEMS).find(k => S.sys[k].broken && Math.hypot(x - SYSTEMS[k].at[0], y - SYSTEMS[k].at[1]) < 26);
let downAt = null;

cv.addEventListener('pointerdown', e => {
  if (!playing()) return;
  const [x, y] = toWorld(e), fk = fixAt(x, y), c = crewAt(x, y);
  if (fk) return openFix(fk);
  if (c) { S.drag = S.sel = c.id; S.ptr = [x, y]; downAt = [x, y]; cv.setPointerCapture(e.pointerId); }
  else { const z = zoneAt(x, y); if (z && S.sel) { orderMove(S.crew.find(c => c.id === S.sel), z); S.sel = null; } }
  render();
});
cv.addEventListener('pointermove', e => { S.ptr = toWorld(e); });
cv.addEventListener('pointerup', e => {
  if (!S.drag) return;
  const [x, y] = toWorld(e), c = S.crew.find(c => c.id === S.drag), moved = Math.hypot(x - downAt[0], y - downAt[1]) > 12;
  S.drag = null;
  if (moved) { const z = zoneAt(x, y); if (z) orderMove(c, z); S.sel = null; }
  render();
});

// ---------- drawing ----------
const stars = Array.from({ length: 140 }, () => [Math.random() * W, Math.random() * SURF, Math.random() * 1.4 + 0.3]);
const rain = Array.from({ length: 110 }, () => ({ p: Math.random(), o: Math.random() * 1500 - 250, depth: Math.random() }));
const rocks = Array.from({ length: 60 }, () => [Math.random() * W, SURF + 20 + Math.random() * (H - SURF - 20), 2 + Math.random() * 6]);

function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function circ(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); }
function txt(s, x, y, size = 13, color = '#cfe6ff', align = 'left', font = 'Consolas, monospace') {
  g.font = `bold ${size}px ${font}`; g.fillStyle = color; g.textAlign = align; g.fillText(s, x, y);
}

function drawSky(ts) {
  const sky = g.createLinearGradient(0, 0, 0, SURF);
  sky.addColorStop(0, '#02040a'); sky.addColorStop(1, S.phase === 'storm' ? '#2a0a12' : '#0a1424');
  g.fillStyle = sky; g.fillRect(0, 0, W, SURF);
  g.fillStyle = '#b9cfe8'; stars.forEach(([x, y, r]) => g.fillRect(x, y, r, r));
  // Earth
  circ(1090, 62, 22); g.fillStyle = '#2a6fd6'; g.fill();
  g.save(); circ(1090, 62, 22); g.clip();
  g.fillStyle = '#3fae6a'; circ(1082, 56, 9); g.fill(); circ(1100, 72, 7); g.fill();
  g.fillStyle = 'rgba(2,4,10,.55)'; circ(1104, 62, 24); g.fill(); g.restore();
  // Sun
  const hot = S.phase === 'warning' || S.phase === 'storm';
  const R = 120 + (hot ? 45 : 0) + Math.sin(ts / 280) * 8;
  const sg = g.createRadialGradient(60, 50, 8, 60, 50, R);
  sg.addColorStop(0, '#fffbe0'); sg.addColorStop(0.3, hot ? '#ff7a1f' : '#ffc23d'); sg.addColorStop(1, 'rgba(255,120,30,0)');
  g.fillStyle = sg; g.fillRect(0, 0, 300, SURF);
  // storm front racing toward the base
  if (S.phase === 'warning') {
    const p = 1 - S.t / S.dur;
    g.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = `rgba(255,${110 + i * 20},60,${0.9 - i * 0.2})`;
      g.beginPath(); g.arc(60, 50, Math.max(1, 40 + p * 600 - i * 22), -0.15, 1.1); g.stroke();
    }
  }
}

function drawGround() {
  const gr = g.createLinearGradient(0, SURF, 0, H);
  gr.addColorStop(0, '#5b5f68'); gr.addColorStop(0.08, '#3a3d45'); gr.addColorStop(1, '#1d1f25');
  g.fillStyle = gr; g.fillRect(0, SURF, W, H - SURF);
  g.fillStyle = 'rgba(0,0,0,.22)'; rocks.forEach(([x, y, r]) => { circ(x, y, r); g.fill(); });
  g.fillStyle = '#8a8f99'; g.fillRect(0, SURF - 2, W, 4);
  // craters on the surface
  g.fillStyle = '#4a4e57'; [[60, 30], [470, 22], [1150, 36]].forEach(([x, w]) => { g.beginPath(); g.ellipse(x, SURF + 3, w, 5, 0, 0, 7); g.fill(); });
}

function drawSurface(ts) {
  // rover + sample rocks (where EVA crew work)
  g.fillStyle = '#c9d2dc'; rr(62, 222, 46, 16, 4); g.fill();
  g.fillStyle = '#37d6ff'; g.fillRect(70, 212, 18, 10);
  g.fillStyle = '#2b2f36'; circ(72, 242, 8); g.fill(); circ(98, 242, 8); g.fill();
  g.fillStyle = '#767b85'; [[180, 6], [262, 8], [345, 5], [430, 7]].forEach(([x, r]) => { circ(x, SURF - r + 2, r); g.fill(); });
  // airlock dome over the shaft
  g.fillStyle = '#aab4c0'; g.beginPath(); g.arc(SHAFT, SURF, 34, Math.PI, 0); g.fill();
  g.fillStyle = '#0d1726'; rr(SHAFT - 12, SURF - 26, 24, 26, 4); g.fill();
  // solar panels: tilted to the Sun, folded flat in a storm
  const fold = S.phase === 'storm';
  [760, 860, 960, 1060].forEach(x => {
    g.strokeStyle = '#9aa4b0'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, SURF); g.lineTo(x, SURF - (fold ? 10 : 34)); g.stroke();
    g.save(); g.translate(x, SURF - (fold ? 10 : 34)); g.rotate(fold ? 0 : -0.5);
    g.fillStyle = fold ? '#27384f' : '#2f6fd0'; g.fillRect(-38, -4, 76, 8);
    g.strokeStyle = '#9fc4ff'; g.lineWidth = 1; for (let i = -38; i <= 38; i += 19) { g.beginPath(); g.moveTo(i, -4); g.lineTo(i, 4); g.stroke(); }
    g.restore();
  });
  txt(fold ? 'SOLAR PANELS FOLDED' : 'SOLAR PANELS', 910, SURF - 62, 11, fold ? '#ff9aa4' : '#6f8bab', 'center');
}

function drawRoom(k, ts) {
  const z = ZONES[k], storm = S.phase === 'storm', sh = lvl('shield');
  const hover = S.drag && S.ptr && zoneAt(S.ptr[0], S.ptr[1]) === k;
  if (sh) { g.shadowColor = '#37d6ff'; g.shadowBlur = 8 + sh * 8; }
  rr(z.x, z.y, z.w, z.h, 14);
  g.fillStyle = k === 'shelter' ? '#12283a' : '#16202e'; g.fill();
  g.shadowBlur = 0;
  g.lineWidth = k === 'shelter' ? 9 : 4;
  g.strokeStyle = hover ? '#ffffff' : sh ? '#37d6ff' : k === 'shelter' ? '#3f8f66' : '#52607a'; g.stroke();
  g.fillStyle = '#2a3446'; g.fillRect(z.x + 6, z.floor, z.w - 12, 6);
  txt(z.name, z.x + 14, z.y + 22, 13, '#cfe6ff');
  txt(z.tag, z.x + z.w - 14, z.y + 22, 11, k === 'shelter' ? '#4be38a' : '#6f8bab', 'right');
}

function drawMachines(ts) {
  const T = S.tanks, blink = Math.sin(ts / 90) > 0;
  // greenhouse: grow lights + plants that grow with the food supply
  const gz = ZONES.green, lit = lvl('farm');
  g.fillStyle = lit ? `rgba(200,110,255,${0.25 + lit * 0.2})` : '#222a38'; g.fillRect(gz.x + 40, gz.y + 34, gz.w - 80, 6);
  if (lit) { const lg = g.createLinearGradient(0, gz.y + 40, 0, gz.floor); lg.addColorStop(0, `rgba(200,110,255,${0.08 * lit})`); lg.addColorStop(1, 'rgba(200,110,255,0)'); g.fillStyle = lg; g.fillRect(gz.x + 40, gz.y + 40, gz.w - 80, gz.floor - gz.y - 40); }
  for (let i = 0; i < 7; i++) {
    const px = gz.x + 45 + i * 44, hgt = 8 + T.food * 0.42;
    g.fillStyle = '#5a4634'; g.fillRect(px - 12, gz.floor - 8, 24, 8);
    g.strokeStyle = T.food < 25 ? '#9a8f3a' : '#4be38a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(px, gz.floor - 8); g.lineTo(px + Math.sin(ts / 700 + i) * 2, gz.floor - 8 - hgt); g.stroke();
    g.fillStyle = g.strokeStyle; g.beginPath(); g.ellipse(px - 6, gz.floor - 8 - hgt * 0.6, 7, 3, -0.5, 0, 7); g.fill();
    g.beginPath(); g.ellipse(px + 6, gz.floor - 8 - hgt * 0.85, 7, 3, 0.5, 0, 7); g.fill();
  }
  // workshop: oxygen and water tanks double as supply gauges
  [['o2', 715, '#9fe8ff', 'O₂'], ['h2o', 885, '#3d8bff', 'H₂O']].forEach(([k, x, col, label]) => {
    const y0 = 335, hh = 80, v = T[k] / 100, dead = S.sys[k].broken;
    g.fillStyle = '#0a1220'; rr(x - 24, y0, 48, hh, 10); g.fill();
    g.save(); rr(x - 24, y0, 48, hh, 10); g.clip();
    g.fillStyle = T[k] < 25 ? '#ff4d5e' : col; g.globalAlpha = dead ? 0.35 : 0.85; g.fillRect(x - 24, y0 + hh * (1 - v), 48, hh * v);
    g.restore(); g.globalAlpha = 1;
    g.lineWidth = 3; g.strokeStyle = dead ? (blink ? '#ff4d5e' : '#5a1f28') : '#8fa3bd'; rr(x - 24, y0, 48, hh, 10); g.stroke();
    txt(label, x, y0 + hh / 2 + 5, 14, '#06101c', 'center');
  });
  // shield pump on top of the shelter
  const sh = lvl('shield');
  g.fillStyle = sh ? '#37d6ff' : '#3a4558'; rr(SHAFT - 44, 458, 26, 14, 4); g.fill(); rr(SHAFT + 18, 458, 26, 14, 4); g.fill();
  // broken: sparks + FIX bubble
  for (const k in SYSTEMS) if (S.sys[k].broken) {
    const [x, y] = SYSTEMS[k].at;
    g.strokeStyle = '#ffe36b'; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) { const a = Math.random() * 7, r = 18 + Math.random() * 22; g.beginPath(); g.moveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
    circ(x, y, 18 + Math.sin(ts / 120) * 3); g.fillStyle = '#ff4d5e'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
    txt('🔧', x, y + 6, 17, '#fff', 'center', 'sans-serif');
    txt('FIX', x, y + 36, 11, '#ff9aa4', 'center');
  }
}

function drawShaft() {
  g.fillStyle = '#16202e'; g.fillRect(SHAFT - 18, SURF, 36, 222);
  g.strokeStyle = '#52607a'; g.lineWidth = 3; g.strokeRect(SHAFT - 18, SURF, 36, 222);
  g.strokeStyle = '#8fa3bd'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(SHAFT - 8, SURF); g.lineTo(SHAFT - 8, 590); g.moveTo(SHAFT + 8, SURF); g.lineTo(SHAFT + 8, 590); g.stroke();
  for (let y = SURF + 10; y < 590; y += 14) { g.beginPath(); g.moveTo(SHAFT - 8, y); g.lineTo(SHAFT + 8, y); g.stroke(); }
  // doorways into the two side rooms
  g.fillStyle = '#16202e'; g.fillRect(SHAFT - 24, 380, 48, 42);
}

function drawAstro(c, x, y, ts, alpha = 1) {
  const walking = c.path.length && alpha === 1, climbing = walking && Math.abs(c.x - SHAFT) < 1 && c.path[0][0] === SHAFT;
  const sw = walking ? Math.sin(ts / 80) * 6 : 0;
  g.save(); g.globalAlpha = alpha;
  if (S.sel === c.id && alpha === 1) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 2, 20, 6, 0, 0, 7); g.stroke(); }
  g.strokeStyle = '#dfe6ee'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 5, y - 16); g.lineTo(x - 5 - (climbing ? 0 : sw), y - (climbing ? Math.max(0, sw) : 0));
  g.moveTo(x + 5, y - 16); g.lineTo(x + 5 + (climbing ? 0 : sw), y - (climbing ? Math.max(0, -sw) : 0)); g.stroke();
  g.fillStyle = '#9aa7b6'; rr(x + (c.dir > 0 ? -17 : 9), y - 40, 8, 20, 3); g.fill();  // backpack
  g.fillStyle = '#eef3f8'; rr(x - 10, y - 40, 20, 26, 6); g.fill();
  g.fillStyle = c.color; g.fillRect(x - 10, y - 30, 20, 5);
  g.strokeStyle = '#eef3f8'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(x - 9, y - 34); g.lineTo(x - 14 + sw * 0.6, y - 20); g.moveTo(x + 9, y - 34); g.lineTo(x + 14 - sw * 0.6, y - 20); g.stroke();
  circ(x, y - 50, 12); g.fillStyle = '#eef3f8'; g.fill();
  g.fillStyle = '#16263a'; g.beginPath(); g.ellipse(x + c.dir * 3, y - 50, 7, 6, 0, 0, 7); g.fill();
  g.fillStyle = c.color; circ(x + c.dir * 5, y - 52, 2); g.fill();
  g.lineCap = 'butt';
  if (alpha === 1) {
    txt(c.name, x, y - 70, 12, c.color, 'center', '"Segoe UI", sans-serif');
    g.fillStyle = '#081120'; g.fillRect(x - 16, y - 66, 32, 4);
    g.fillStyle = c.dose > 60 ? '#ff4d5e' : '#ffb938'; g.fillRect(x - 16, y - 66, 32 * Math.min(1, c.dose / 100), 4);
  }
  g.restore();
}

function drawStorm(ts, dt) {
  if (S.phase !== 'storm') return;
  const k = Math.min(1, S.I / 5), sh = lvl('shield');
  g.lineWidth = 2;
  rain.forEach(r => {
    r.p += dt * (0.9 + r.depth * 0.5); if (r.p > 1) { r.p = 0; r.o = Math.random() * 1500 - 250; r.depth = Math.random(); }
    // streaks fall from the Sun's side; most stop in the first metres of soil, few reach the deep shelter
    const maxY = SURF + r.depth * r.depth * 330 * (1 - sh * 0.15), y = r.p * (H + 60) - 40;
    if (y > maxY) return;
    const x = r.o + y * 0.55, a = (y < SURF ? 0.75 : 0.75 * (1 - (y - SURF) / (maxY - SURF + 1))) * (0.3 + k * 0.7);
    g.strokeStyle = `rgba(255,95,80,${a})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 12, y - 22); g.stroke();
  });
  g.fillStyle = `rgba(255,30,50,${0.06 + k * 0.1 * (0.6 + 0.4 * Math.sin(ts / 150))})`; g.fillRect(0, 0, W, H);
}

// Crew walk on a real-time clock, called from both the draw loop and the game tick,
// so they keep moving at full speed even if the browser slows down drawing.
let lastWalk = performance.now();
function walkClock() {
  const now = performance.now(), dt = Math.min(1, (now - lastWalk) / 1000); lastWalk = now;
  if (playing()) stepCrew(dt * SPEED);
}

let lastTs = 0;
function draw(ts) {
  const dt = Math.min(0.1, (ts - lastTs) / 1000) || 0; lastTs = ts;
  walkClock();
  g.setTransform(2, 0, 0, 2, 0, 0);
  if (S.shake > 0) { S.shake -= dt; g.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10); }
  drawSky(ts); drawGround(); drawSurface(ts); drawShaft();
  ['green', 'work', 'shelter'].forEach(k => drawRoom(k, ts));
  if (S.drag && S.ptr && zoneAt(S.ptr[0], S.ptr[1]) === 'eva') { g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([8, 6]); rr(34, 120, 512, 128, 12); g.stroke(); g.setLineDash([]); }
  txt('MOON SURFACE', 44, 142, 13, '#cfe6ff'); txt('no protection', 44, 158, 11, '#ffb938');
  drawMachines(ts);
  S.crew.filter(c => !c.out).sort((a, b) => a.y - b.y).forEach(c => drawAstro(c, c.x, c.y, ts));
  drawStorm(ts, dt);
  // dragged astronaut ghost
  if (S.drag && S.ptr) drawAstro(S.crew.find(c => c.id === S.drag), S.ptr[0], S.ptr[1] + 30, ts, 0.6);
  // floating texts
  S.fx = S.fx.filter(f => (f.t -= dt) > 0);
  S.fx.forEach(f => { g.globalAlpha = Math.min(1, f.t); txt(f.text, f.x, f.y - (1.5 - f.t) * 22, 15, f.color, 'center'); g.globalAlpha = 1; });
  // radiation meter
  txt('RADIATION', 1040, 112, 11, '#6f8bab', 'right'); g.fillStyle = '#081120'; g.fillRect(1048, 102, 120, 11);
  g.fillStyle = '#ff4d5e'; g.fillRect(1048, 102, 120 * Math.min(1, S.I / 7.2), 11);
  // big phase banner
  if (S.banner && (S.banner.t -= dt) > 0) {
    g.globalAlpha = Math.min(1, S.banner.t);
    txt(S.banner.text, W / 2, 200, 54, S.phase === 'storm' ? '#ff4d5e' : S.phase === 'warning' ? '#ffb938' : '#4be38a', 'center');
    g.globalAlpha = 1;
  }
  requestAnimationFrame(draw);
}

$('#mute').onclick = () => { muted = !muted; $('#mute').textContent = muted ? '🔇' : '🔊'; if (muted && window.speechSynthesis) speechSynthesis.cancel(); };

newGame();
intro();
setInterval(tick, DT * 1000);
requestAnimationFrame(draw);
