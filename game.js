// STORM WATCH: game rules and flow. Drawing is in scene.js, sound in sfx.js, learning content in
// learn.js, the crew (portraits, customization, introductions) in crew.js.
const $ = s => document.querySelector(s);
const SPEED = +new URLSearchParams(location.search).get('speed') || 1; // ?speed=5 for quick testing
const DT = 0.25;

// ---------- difficulty: tuned for ages 7-12, with a harder level for older players ----------
// These multipliers are game settings (not NASA values).
const LEVELS = {
  cadet:     { name: 'Cadet',     who: 'ages 7 to 9',         dose: 0.5,  brk: 0.5, use: 0.85,  calm: 1.2, warn: 1.5, hints: true },
  pilot:     { name: 'Pilot',     who: 'ages 10 to 12',       dose: 0.75, brk: 0.8, use: 1.0,  calm: 1.0, warn: 1.2, hints: false },
  commander: { name: 'Commander', who: 'teens and grown-ups', dose: 1.1,  brk: 1.1, use: 1.15, calm: 0.9, warn: 1.0, hints: false },
};
let LEVEL = 'cadet';
try { LEVEL = LEVELS[localStorage.getItem('stormwatch.level')] ? localStorage.getItem('stormwatch.level') : 'cadet'; } catch (e) {}
const LV = () => LEVELS[LEVEL];

// ---------- NASA DONKI space-weather data ----------
// Storm 1 is the strongest flare of the last 30 days (fetched live). The others are real storms
// fetched from DONKI by ID. Each has a saved copy so the game still works with no internet.
// calm / warn / storm are seconds of play; sev is the in-game strength (a game setting).
const DONKI = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/';
const SAVED_LIVE = { cls: 'M3.5', peak: '2026-11-05T18:33Z', region: null, loc: null };
const CAMPAIGN = [
  { key: 'live', title: 'Latest Big Flare', calm: 30, warn: 22, storm: 24 },
  { key: '2023', flrID: '2023-05-09T18:20:00-FLR-001', from: '2023-05-09', to: '2023-05-09',
    title: 'The Sneaky Medium Flare', sev: 1.2, calm: 26, warn: 20, storm: 28,
    fact: 'This was only a medium (M class) flare, but it still sent a radiation storm toward Earth and the Moon. Size is not everything: where a flare points matters too.',
    saved: { cls: 'M4.2', peak: '2023-05-09T18:58Z', region: 13296, loc: 'N17W32', sepTime: '2023-05-09T23:15Z', sepInst: 'GOES-P: SEISS >10 MeV' } },
  // Storm 3 idea from Quan (PR #3): the August 2023 storms from sunspot region 13386. The X1.5 flare of Aug 7
  // is the one NASA DONKI links to a radiation storm at GOES.
  { key: '2023b', flrID: '2023-08-07T20:30:00-FLR-001', from: '2023-08-07', to: '2023-08-08',
    title: 'The Edge-of-the-Sun Flare', sev: 1.4, calm: 26, warn: 16, storm: 30,
    fact: 'This X flare erupted right at the edge of the Sun, two days after an X1.6 flare from the same sunspot group. Even from the edge, its particles reached the satellites near Earth a few hours later.',
    saved: { cls: 'X1.5', peak: '2023-08-07T20:46Z', region: 13386, loc: 'N11W90', sepTime: '2023-08-08T01:00Z', sepInst: 'GOES-P: SEISS >10 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/26403/-1' } },
  { key: '2017', flrID: '2017-09-10T15:35:00-FLR-001', from: '2017-09-10', to: '2017-09-10',
    title: 'The X8.2 Monster', sev: 2.2, calm: 24, warn: 13, storm: 36, cme: 'Over 2,300 km every second (NASA DONKI)',
    fact: 'One of the biggest flares of its solar cycle. It reached all the way to Mars, where NASA\'s Curiosity rover measured the highest surface radiation since it landed in 2012, more than double its previous record, and the MAVEN spacecraft saw the whole planet glow.',
    saved: { cls: 'X8.2', peak: '2017-09-10T16:06Z', region: 12673, loc: 'S08W88', sepTime: '2017-09-10T16:25Z', sepInst: 'GOES13: SEM/EPS >100 MeV' } },
  // Finale idea from Quan (PR #3): several flares back to back. Built on a real sequence: in May 2024 sunspot region 13664
  // fired 7 X-class flares in four days (NASA DONKI). The game plays four of them in a row with a short break between.
  { key: 'swarm', title: 'The Flare Swarm', from: '2024-05-08', to: '2024-05-12', calm: 24, flareCalm: 8,
    cme: 'Over 1,200 km every second for the last one (NASA DONKI)',
    fact: 'In May 2024 one sunspot group, region 13664, fired seven X-class flares in just four days. Together they caused the strongest storm at Earth in over 20 years, and people saw the northern lights much farther south than usual.',
    swarm: [
      { flrID: '2024-05-08T04:37:00-FLR-001', sev: 1.1, warn: 12, storm: 14, saved: { cls: 'X1.0', peak: '2024-05-08T05:09Z', region: 13664, loc: 'S22W10', sepTime: '2024-05-10T13:35Z', sepInst: 'GOES-P: SEISS >10 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30551/-1' } },
      { flrID: '2024-05-09T08:45:00-FLR-001', sev: 1.4, warn: 10, storm: 15, saved: { cls: 'X2.2', peak: '2024-05-09T09:13Z', region: 13664, loc: 'S20W25', sepTime: '2024-05-10T13:35Z', sepInst: 'GOES-P: SEISS >10 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30605/-1' } },
      { flrID: '2024-05-10T06:27:00-FLR-001', sev: 1.7, warn: 9, storm: 16, saved: { cls: 'X3.9', peak: '2024-05-10T06:54Z', region: 13664, loc: 'S18W37', sepTime: '2024-05-10T13:35Z', sepInst: 'GOES-P: SEISS >10 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30666/-1' } },
      { flrID: '2024-05-11T01:10:00-FLR-001', sev: 2.0, warn: 8, storm: 20, saved: { cls: 'X5.8', peak: '2024-05-11T01:23Z', region: 13664, loc: 'S17W47', sepTime: '2024-05-11T02:10Z', sepInst: 'GOES-P: SEISS >100 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30711/-1' } },
    ] },
];
// More real storms for Endless mode (saved from NASA DONKI: strongest X flare of each year that sent particles to GOES).
const EXTRA = [
  { cls: 'X5.4', peak: '2012-03-07T00:24Z', region: 11429, loc: 'N18E31', sepTime: '2012-03-07T04:05Z', sepInst: 'GOES13: SEM/EPS >100 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/197/-1' },
  { cls: 'X3.3', peak: '2024-02-09T13:14Z', region: 13575, loc: 'S37W110', sepTime: '2024-02-09T15:30Z', sepInst: 'GOES-P: SEISS >10 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/29062/-1' },
  { cls: 'X1.8', peak: '2024-10-09T01:56Z', region: 13848, loc: 'N13W08', sepTime: '2024-10-09T03:50Z', sepInst: 'GOES-P: SEISS >100 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/33863/-1' },
  { cls: 'X1.0', peak: '2021-10-28T15:35Z', region: 12887, loc: 'S26W04', sepTime: '2021-10-28T16:35Z', sepInst: 'GOES-P: SEISS >100 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/18096/-1' },
  { cls: 'X1.6', peak: '2014-09-10T17:45Z', region: 12158, loc: 'N15E05', sepTime: '2014-09-11T02:40Z', sepInst: 'GOES13: SEM/EPS >10 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/6606/-1' },
  { cls: 'X1.2', peak: '2014-01-07T18:32Z', region: 11943, loc: 'S15W10', sepTime: '2014-01-07T19:45Z', sepInst: 'GOES13: SEM/EPS >10 MeV', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/4351/-1' },
];

// Flare classes go A, B, C, M, X; each letter is 10x stronger. Returns strength in "M units".
const mUnits = c => ({ A: 1e-3, B: 1e-2, C: 0.1, M: 1, X: 10 }[c[0]] || 0) * (parseFloat(c.slice(1)) || 1);
const iso = d => d.toISOString().slice(0, 10);
const fmtMins = m => m >= 120 ? `${Math.floor(m / 60)} hours ${m % 60 ? m % 60 + ' minutes' : ''}`.trim() : `${m} minutes`;

function makeEvent(c, d, fromNasa) {
  const mins = d.sepTime ? Math.round((new Date(d.sepTime) - new Date(d.peak)) / 6e4) : null;
  const date = new Date(d.peak).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  const ev = { ...c, ...d, mins, date, fromNasa };
  if (c.key === 'live') {
    ev.sev = Math.max(0.7, Math.min(1.1, 0.6 + 0.4 * Math.log10(Math.max(1, mUnits(d.cls)))));
    ev.fact = 'This is the strongest solar flare NASA recorded in the last 30 days. ' + (mins != null
      ? `Radiation particles from it were detected ${fmtMins(mins)} later.`
      : 'It did not send a radiation storm toward the Moon. Most flares don\'t, but a crew has to be ready every time, so this one is a practice drill.');
  }
  return ev;
}

function makeSwarm(c, flares, fromNasa) {
  const list = flares.map((d, i) => makeEvent({ ...c.swarm[i], key: c.key, title: c.title }, d, fromNasa));
  return { ...list[list.length - 1], ...c, flares: list, fromNasa };
}
let EVENTS = CAMPAIGN.map(c => c.swarm ? makeSwarm(c, c.swarm.map(f => f.saved), false) : makeEvent(c, c.key === 'live' ? SAVED_LIVE : c.saved, false));
// The flare being played right now (one of the swarm's flares during the finale).
const cur = () => { const e = EVENTS[S.round]; return e.flares ? e.flares[Math.min(S.flare || 0, e.flares.length - 1)] : e; };

async function getJSON(path) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(DONKI + path, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } finally { clearTimeout(to); }
}

// Flare record + list of particle events (SEP) -> the fields the game uses.
// Prefers detectors near Earth and the Moon (GOES), strongest energy channel first.
function pick(flr, seps) {
  const inst = s => (s.instruments && s.instruments[0] && s.instruments[0].displayName) || '';
  const linked = (seps || [])
    .filter(s => (s.linkedEvents || []).some(l => l.activityID === flr.flrID) && s.eventTime > flr.peakTime)
    .sort((a, b) => a.eventTime < b.eventTime ? -1 : 1);
  const sep = linked.find(s => /GOES.*>100 MeV/.test(inst(s))) || linked.find(s => /GOES/.test(inst(s))) || linked[0];
  return { cls: flr.classType, peak: flr.peakTime, region: flr.activeRegionNum, loc: flr.sourceLocation, link: flr.link,
    sepTime: sep && sep.eventTime, sepInst: sep && inst(sep) };
}

async function loadEvents() {
  const now = new Date(), start = new Date(now - 30 * 864e5);
  EVENTS = await Promise.all(CAMPAIGN.map(async c => {
    try {
      const range = c.key === 'live' ? `startDate=${iso(start)}&endDate=${iso(now)}` : `startDate=${c.from}&endDate=${c.to}`;
      const [flrs, seps] = await Promise.all([getJSON('FLR?' + range), getJSON('SEP?' + range)]);
      if (c.swarm) return makeSwarm(c, c.swarm.map(s => { const f = flrs.find(f => f.flrID === s.flrID); if (!f) throw new Error('no flare'); return pick(f, seps); }), true);
      const flr = c.key === 'live' ? flrs.sort((a, b) => mUnits(b.classType) - mUnits(a.classType))[0] : flrs.find(f => f.flrID === c.flrID);
      if (!flr) throw new Error('no flare');
      return makeEvent(c, pick(flr, seps), true);
    } catch (e) {
      return c.swarm ? makeSwarm(c, c.swarm.map(f => f.saved), false) : makeEvent(c, c.key === 'live' ? SAVED_LIVE : c.saved, false);
    }
  }));
}

// ---------- world layout (canvas units; W, H, SURF and SHAFT are in scene.js) ----------
const ZONES = {
  eva:     { name: 'MOON SURFACE',  tag: 'no protection',   rad: 1.0, x: 30,  y: 110, w: 520, h: 140, floor: 250, slot: i => 130 + i * 85 },
  green:   { name: 'GREENHOUSE',    tag: 'thin walls',      rad: 0.5, x: 230, y: 290, w: 350, h: 140, floor: 422, slot: i => 280 + i * 75 },
  work:    { name: 'WORKSHOP',      tag: 'thin walls',      rad: 0.5, x: 620, y: 290, w: 350, h: 140, floor: 422, slot: i => 665 + i * 75 },
  shelter: { name: 'STORM SHELTER', tag: 'deep + shielded', rad: 0.1, x: 425, y: 470, w: 350, h: 130, floor: 592, slot: i => 480 + i * 80 },
};
const SYSTEMS = {
  o2:     { name: 'Oxygen', icon: '💨', tank: 'o2',   at: [715, 318] },
  h2o:    { name: 'Water',  icon: '💧', tank: 'h2o',  at: [885, 318] },
  farm:   { name: 'Food',   icon: '🌱', tank: 'food', at: [405, 312] },
  shield: { name: 'Shield', icon: '🛡️', tank: null,   at: [600, 455] },
};
const KW_PER_LEVEL = 2, WALK = 110;
// Which machine has its planned breakdown in which storm: water (Leak Patrol), oxygen (Scrubber Sprint),
// shield (Shield Sync), grow lights (Cosmic Match), then oxygen again in the finale (Cosmic Match).
const SHOWCASE = { live: 'h2o', 2023: 'o2', '2023b': 'shield', 2017: 'farm', swarm: 'o2' };

// ---------- life support: real NASA consumption rates ----------
// kg per crew member per day, from NASA's Life Support Baseline Values and Assumptions Document
// (BVAD, NASA/TP-2015-218570 Rev2, Feb 2022), as summarized in NASA NTRS 20230013896 and 20220002294.
//   Oxygen: 0.84 (surface) / 0.89 (nominal) / 1.08 (high) kg/day
//   Drinking water: 1.78 (5th percentile) / 2.79 (baseline) / 3.89 (95th percentile) kg/day
//   Food: 1.80 kg/day as shipped (30%-hydration food)
// Game choice, not NASA: which rate goes with which activity. Resting in the shelter uses
// the low end, working inside the baseline, hard work outside on the surface the high end.
const BVAD = {
  rest:    { o2: 0.84, h2o: 1.78, food: 1.80 },
  work:    { o2: 0.89, h2o: 2.79, food: 1.80 },
  outside: { o2: 1.08, h2o: 3.89, food: 1.80 },
};
const activity = c => c.path.length ? 'work' : c.zone === 'shelter' ? 'rest' : c.zone === 'eva' ? 'outside' : 'work';
// The oxygen machine splits water by electrolysis (2 H2O -> 2 H2 + O2): 18 kg of water gives 16 kg of oxygen.
const H2O_PER_O2 = 18 / 16;
// Tank sizes (kg) and machine output per power level (kg per hour). Game settings, sized so that
// power level 2 roughly keeps up with 4 crew working inside.
const TANK = { o2: 12, h2o: 46, food: 38 };
const MAKE = { o2: 0.075, h2o: 0.32, farm: 0.10, farmer: 0.09 };
// Time scale: 1 game second = 1 hour on the base. During the warning countdown the clock slows
// down so that the countdown covers the real warning time from NASA's records.
const warnMins = ev => ev.mins != null ? ev.mins : 30;
const hoursPerSec = ev => S.phase === 'warning' ? warnMins(ev) / 60 / S.dur : 1;
const pct = k => S.tanks[k] / TANK[k] * 100;
// Background radiation on the Moon's surface: 1,369 microsieverts per day (Chang'e-4 LND, Zhang et al. 2020).
// In game dose units (1 unit = 10 mSv) per hour, before room shielding.
const BACKGROUND = 1.369 / 24 / 10;
// Greenhouse: only severe storms (X-class flares with a real radiation storm) damage the plants.
const severe = ev => ev.sev >= 1.5;
const GARDEN_DMG = 0.3;   // % garden health lost per second per unit of storm intensity, unprotected
const PROTECT_AT = [505, 330];
const canProtect = () => S.phase === 'storm' && !S.ggDone && severe(cur());
function clock(h) {
  const m = Math.floor(h * 60);
  return `Day ${Math.floor(m / 1440) + 1} · ${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// ---------- packing for launch: the rocket only lifts 10 crates, so every choice costs another ----------
const CRATES = 10;
const CARGO = {
  h2o:   { icon: '💧', name: 'Water crate',      cost: 1, max: 4, tip: '+8 kg of water. Water also makes your oxygen.' },
  o2:    { icon: '💨', name: 'Oxygen tank',      cost: 1, max: 4, tip: '+2.5 kg of oxygen, ready to breathe.' },
  food:  { icon: '🥫', name: 'Food crate',       cost: 1, max: 4, tip: '+7 kg of food.' },
  parts: { icon: '🔧', name: 'Spare parts kit',  cost: 2, max: 1, tip: 'The first surprise breakdown in every storm is fixed instantly.' },
  vest:  { icon: '🦺', name: 'Radiation vests',  cost: 2, max: 1, tip: 'Crew caught outside the shelter soak up less radiation. Tested on Artemis I.' },
  sci:   { icon: '🔬', name: 'Science kit',      cost: 2, max: 1, tip: 'Crew outside collect science stars 50% faster.' },
  batt:  { icon: '🔋', name: 'Backup battery',   cost: 2, max: 1, tip: '+2 kW of power while the solar panels are folded.' },
};
const CARGO_ADD = { h2o: 8, o2: 2.5, food: 7 };
const START_FILL = 0.42;

function newGame() {
  S = {
    round: 0, phase: 'brief', t: 0, dur: 1, I: 0, supply: 14, sel: null, drag: null, ptr: null, science: 0,
    tanks: { o2: TANK.o2 * START_FILL, h2o: TANK.h2o * START_FILL, food: TANK.food * START_FILL },
    hours: 0, rate: { o2: 0, h2o: 0, food: 0 }, dry: false, o2Fixes: 0, minis: {}, cmFor: null, reading: false, garden: 100, gg: false,
    sys: { o2: { lvl: 2 }, h2o: { lvl: 2 }, farm: { lvl: 2 }, shield: { lvl: 0 } },
    crew: TEAM.map(t => t.id === 'cmd'
      ? { ...t, name: CMD.name, color: CMD.color, look: { ...CMD.look } }
      : { ...t, look: { ...t.look } }),
    stats: { breaks: 0 }, fx: [], parts: [], banner: null, shake: 0, meet: null, hint: null, call: null, callAt: 0,
    paused: false, cut: null, panelsDown: false, foldA: 0, pendingFix: null,
    cargo: { h2o: 2, o2: 2, food: 2, parts: 1, vest: 1, sci: 0, batt: 0 },
    asked: [], quizRight: 0, quizTotal: 0, fixes: 0, endless: false, flags: {}, chatAt: 6, stepAt: 0,
    cam: { z: 1, x: W / 2, y: H / 2, to: { z: 1, x: W / 2, y: H / 2 } },
  };
  S.crew.forEach((c, i) => Object.assign(c, { i, x: ZONES[c.zone].slot(i), y: ZONES[c.zone].floor, path: [], dir: 1, dose: 0, health: 100, out: false }));
  for (const k in S.sys) Object.assign(S.sys[k], { broken: false, repair: 0 });
  EVENTS = EVENTS.slice(0, CAMPAIGN.length);
  Learn.reset();
  buildUI();
  render();
}

const at = z => S.crew.filter(c => !c.out && !c.path.length && c.zone === z);
const lvl = k => S.sys[k].broken ? 0 : S.sys[k].lvl;
const used = () => Object.values(S.sys).reduce((a, s) => a + s.lvl * KW_PER_LEVEL, 0);
const playing = () => ['calm', 'warning', 'storm'].includes(S.phase);
const frozen = () => S.gg || S.paused || S.reading;    // a mini-game is open, the player pressed pause, or a fact card is open
// Fact cards pause the base during play (see learn.js); they wait while a mini-game or repair puzzle is open.
Learn.hooks.hold = () => playing();
Learn.hooks.wait = () => !!S.gg || $('#modal').classList.contains('show');
Learn.hooks.onHold = on => { S.reading = on; lastWalk = performance.now(); if (on) SFX.hush(); render(); };
const once = k => S.flags[k] ? false : (S.flags[k] = true);

// Caption at the top of the scene, read out over the "radio".
let capTimer;
function log(text, cls = '', who = 'capcom') {
  const el = $('#caption');
  el.textContent = text; el.className = 'show ' + cls;
  clearTimeout(capTimer); capTimer = setTimeout(() => el.className = cls, 7000);
  if (who) SFX.say(text, who, cls === 'bad' || cls === 'warn');
}
const emote = (c, icon, life = 1.6) => { c.emote = { icon, t: life, life }; };
const speak = (c, text) => { c.say = { text, t: 3 }; };

// ---------- bottom bars (crew chips, power, systems) ----------
function buildUI() {
  $('#crewbar').innerHTML = '';
  S.crew.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.innerHTML = `${portrait(c, 40)}<div class="who"><b style="color:${c.color}">${esc(c.name)} <small>${c.name === c.role ? '' : c.role}</small></b><span class="st"></span>
      <div class="bar dose" title="Radiation dose (red line = NASA career limit)"><i></i></div></div>`;
    b.onclick = () => { S.sel = S.sel === c.id ? null : c.id; SFX.play('select'); render(); };
    $('#crewbar').appendChild(b); c.el = b;
  });
  $('#systems').innerHTML = Object.entries(SYSTEMS).map(([k, s]) =>
    `<div class="sys" data-s="${k}"><div class="name">${s.icon} ${s.name} <small></small></div>
     <div class="bar"><i></i></div>
     <div class="ctl"><button data-d="-1" aria-label="Less power for ${s.name}">−</button><div class="pips"><i></i><i></i><i></i></div><button data-d="1" aria-label="More power for ${s.name}">+</button></div>
     <button class="fix">🔧 FIX IT</button>${k === 'farm' ? '<button class="protect">🌱 PROTECT</button>' : ''}</div>`).join('');
  document.querySelectorAll('.sys .ctl button').forEach(b => b.onclick = () => setLevel(b.closest('.sys').dataset.s, +b.dataset.d));
  document.querySelectorAll('.sys .fix').forEach(b => b.onclick = () => openFix(b.closest('.sys').dataset.s));
  document.querySelector('.sys .protect').onclick = openGarden;
}

function setLevel(k, d) {
  const s = S.sys[k], n = s.lvl + d;
  if (n < 0 || n > 3) return;
  if (d > 0 && used() + KW_PER_LEVEL > S.supply) {
    log('Not enough power. Turn something else down first.', 'warn', null); SFX.play('deny');
    if (once('tradeoff')) Learn.overlay(`<h2>⚡ POWER IS LIMITED</h2><p class="big">Your base makes only <b>${S.supply} kW</b>. To give more power to one machine, you must take it from another. Real mission planners make trade-offs like this every day.</p>`);
    return;
  }
  s.lvl = n; SFX.play(d > 0 ? 'power' : 'powerdn'); render();
}

function render() {
  document.body.className = S.phase + (S.paused ? ' paused' : '') + (LV().hints ? ' cadet' : '');
  const ev = S.round < EVENTS.length ? cur() : EVENTS[EVENTS.length - 1], sw = EVENTS[S.round] && EVENTS[S.round].flares;
  $('#round').textContent = sw && S.phase !== 'debrief' ? `Finale · Flare ${(S.flare || 0) + 1} / ${sw.length}` : S.endless ? `Endless · Storm ${S.round + 1}` : `Storm ${Math.min(S.round + 1, EVENTS.length)} / ${EVENTS.length}`;
  $('#phase').textContent = { brief: 'STANDBY', meet: 'CREW BRIEFING', prep: 'PACKING', cut: 'IN FLIGHT', calm: 'ALL CLEAR', warning: 'STORM INCOMING', storm: 'RADIATION STORM', debrief: 'DEBRIEF', end: 'MISSION OVER' }[S.phase];
  const hps = playing() ? hoursPerSec(ev) : 1, mins = S.t * hps * 60;
  const left = !playing() ? '--' : S.phase === 'warning' ? (mins >= 120 ? (mins / 60).toFixed(1) + ' h' : Math.ceil(mins) + ' min') : Math.ceil(S.t * hps) + ' h';
  const what = !playing() ? '' : { calm: 'next storm in', warning: 'radiation hits in', storm: 'storm ends in' }[S.phase] || '';
  $('#timer').innerHTML = what ? `<small>${what}</small> ${left}` : left;
  $('#phasebar i').style.width = (playing() ? Math.max(0, S.t / S.dur * 100) : 0) + '%';
  $('#clock').textContent = clock(S.hours);
  $('#pwrUsed').textContent = used(); $('#pwrMax').textContent = S.supply;
  $('#pwrBar').style.width = Math.min(100, used() / S.supply * 100) + '%';
  $('#science').textContent = Math.floor(S.science);
  $('#logbtn').textContent = `📖 Logbook · 🏅 ${Learn.log.badges.length}/${Object.keys(Learn.BADGES).length}`;
  $('#pause').textContent = S.paused ? '▶' : '⏸';
  $('#allShelter').hidden = !(LV().hints && (S.phase === 'warning' || S.phase === 'storm'));
  $('#call').disabled = !playing() || !!S.call || performance.now() < S.callAt;
  for (const k in S.sys) {
    const s = S.sys[k], def = SYSTEMS[k], el = document.querySelector(`.sys[data-s="${k}"]`);
    const v = def.tank ? pct(def.tank) : lvl('shield') * 20;
    el.classList.toggle('broken', s.broken);
    if (k === 'farm') el.classList.toggle('threat', canProtect());
    el.classList.toggle('low', !!def.tank && v < 25);
    el.querySelectorAll('.pips i').forEach((p, i) => p.classList.toggle('on', i < s.lvl));
    let label = v ? `-${v}% radiation` : 'off';
    if (def.tank) {
      const kg = S.tanks[def.tank], r = S.rate[def.tank];
      label = kg.toFixed(1) + ' kg' + (r < -1e-6 ? ` · ${Math.min(99, Math.floor(kg / -r))} h left` : r > 1e-6 ? ' ▲' : '');
    }
    el.querySelector('small').textContent = s.broken ? 'BROKEN' : label;
    el.querySelector('.bar i').style.width = (def.tank ? v : v / 0.6) + '%';
  }
  S.crew.forEach(c => {
    c.el.className = 'chip' + (S.sel === c.id ? ' sel' : '') + (c.out ? ' out' : '');
    c.el.querySelector('.st').textContent = c.out ? 'Resting in medical bay' : `${c.perk} · ${Math.round(c.dose * 10)} mSv`;
    c.el.querySelector('.dose i').style.width = Math.min(100, c.dose) + '%';
  });
}

// ---------- crew movement ----------
// NASA's career radiation limit for astronauts is 600 mSv (NASA-STD-3001). Dose is stored in tens of mSv.
const CAREER = 60, grounded = c => c.dose >= CAREER;
function orderMove(c, zone, quiet) {
  if (!c || c.out || !playing() || (c.zone === zone && !c.path.length)) return;
  if (zone === 'eva' && grounded(c)) {          // past NASA's 600 mSv career limit: no more moonwalks
    if (!quiet) { log(`Flight surgeon: ${c.name} has passed NASA's 600 mSv career limit and is grounded. No more moonwalks.`, 'warn'); emote(c, '🚫', 2); SFX.play('click'); }
    return;
  }
  const z = ZONES[zone], tx = z.slot(c.i);
  c.zone = zone; c.path = [];
  if (Math.abs(c.y - z.floor) > 1) {            // different level: go via the ladder shaft
    if (Math.abs(c.x - SHAFT) > 1) c.path.push([SHAFT, c.y]);
    c.path.push([SHAFT, z.floor]);
  }
  c.path.push([tx, z.floor]);
  if (!quiet) SFX.play('drop');
  if (zone === 'shelter' && S.phase !== 'calm') emote(c, '🏃');
}
function stepCrew(dt) {
  let moving = false;
  S.crew.forEach(c => {
    let d = WALK * (c.job === 'pilot' ? 2 : 1) * dt;
    if (c.path.length) moving = true;
    while (c.path.length && d > 0) {
      const [tx, ty] = c.path[0], dx = tx - c.x, dy = ty - c.y, len = Math.hypot(dx, dy);
      if (dx) c.dir = Math.sign(dx);
      if (len <= d) { c.x = tx; c.y = ty; c.path.shift(); d -= len; }
      else { c.x += dx / len * d; c.y += dy / len * d; d = 0; }
    }
  });
  if (moving && (S.stepAt -= dt) <= 0) { S.stepAt = 0.26; SFX.play('step'); }
}
// radiation factor depends on where the astronaut actually is right now
const radAt = c => !c.path.length ? ZONES[c.zone].rad : c.y <= SURF + 2 ? 1 : c.y < 440 ? 0.5 : c.y >= 590 ? 0.1 : 0.3;

// Crew walk on a real-time clock, called from both the draw loop and the game tick,
// so they keep moving at full speed even if the browser slows down drawing.
let lastWalk = performance.now();
function walkClock() {
  const now = performance.now(), dt = Math.min(1, (now - lastWalk) / 1000); lastWalk = now;
  if (playing() && !frozen()) stepCrew(dt * SPEED);
}

// ---------- game loop ----------
const BANNER = { calm: '#4be38a', warning: '#ffb938', storm: '#ff4d5e' };
function setPhase(p, dur, banner, sub) { S.phase = p; S.t = S.dur = dur; if (banner) S.banner = { text: banner, sub, t: 2.6, color: BANNER[p] || '#37d6ff' }; }

function startRound() {
  const ev = EVENTS[S.round];
  S.flare = 0;
  S.stats = { breaks: 0, hours: 0, use: { o2: 0, h2o: 0, food: 0 }, split: 0, garden0: S.garden, shieldH: 0, caught: [], partsUsed: false };
  S.ggDone = false; S.hint = null; S.pendingFix = null;
  setPhase('calm', (ev.calm || 25) * LV().calm, 'ALL CLEAR', S.round ? `Get ready for storm ${S.round + 1}` : 'Collect science while it is calm');
  $('#modal').classList.remove('show', 'fixing'); $('#dossier').className = '';
  // solar panels unfold: put the machines back to how they were set before the storm, as far as power allows
  restorePower();
  SFX.ambience('calm'); SFX.play('allclear');
  log(S.panelsDown ? 'All clear, but the solar panels are offline. Tap the yellow REBOOT bubble to bring power back.'
    : S.round ? 'All clear. Check your supplies and collect science before the next storm.'
    : 'Welcome to the Moon! Send crew outside to collect science stars while it is calm.', 'good');
  render();
}

function restorePower() {
  if (S.preLvl) { S.supply = S.panelsDown ? 10 : 14; for (const k of ['o2', 'h2o', 'farm']) while (S.sys[k].lvl < S.preLvl[k] && used() + KW_PER_LEVEL <= S.supply) S.sys[k].lvl++; S.preLvl = null; }
}

// Context-aware pointer for new players (always on in Cadet level, first storm in the others).
function updateHint(ev) {
  S.hint = null;
  if (!(LV().hints || S.round === 0) || S.gg) return;
  const active = S.crew.filter(c => !c.out);
  if (S.phase === 'warning' || (S.phase === 'storm' && S.I > 0.4)) {
    const c = active.find(c => c.zone !== 'shelter');
    if (c && S.phase === 'warning') S.hint = { x: c.x, y: c.y - 70, text: `Drag ${c.name} to the Storm Shelter!`, zone: 'shelter' };
  }
  const broken = Object.keys(S.sys).find(k => S.sys[k].broken);
  if (!S.hint && broken && S.phase !== 'warning') S.hint = { x: SYSTEMS[broken].at[0], y: SYSTEMS[broken].at[1] - 6, text: 'Tap FIX!' };
  if (!S.hint && canProtect()) S.hint = { x: PROTECT_AT[0], y: PROTECT_AT[1] - 6, text: 'Tap to protect the plants!' };
  if (!S.hint && S.panelsDown && S.phase === 'calm') S.hint = { x: REBOOT_AT[0], y: REBOOT_AT[1] - 6, text: 'Tap to reboot the panels!' };
  if (!S.hint && S.phase === 'calm' && S.round === 0 && S.dur - S.t < 9 && !at('eva').length) {
    const c = active.find(c => c.job === 'geologist') || active[0];
    if (c) S.hint = { x: c.x, y: c.y - 70, text: `Drag ${c.name} outside to collect ★`, zone: 'eva' };
  }
}

const CHATTER = {
  eva: ['Found a shiny rock!', 'Sample bagged!', 'What a view of Earth!', 'One small hop…'],
  green: ['The tomatoes look happy.', 'Watering time!', 'Smells like salad.'],
  work: ['All systems humming.', 'Tightening a bolt.', 'Tools ready.'],
  shelter: ['Safe and sound.', 'Cozy down here.', 'Good call, Commander.'],
  scared: ['Uh oh…', 'Should I head in?', 'That Sun looks angry!'],
};
function chatter(dt) {
  if ((S.chatAt -= dt) > 0) return;
  S.chatAt = 5 + Math.random() * 4;
  const pool = S.crew.filter(c => !c.out && !c.path.length); if (!pool.length) return;
  const c = pool[Math.floor(Math.random() * pool.length)];
  const scared = S.phase !== 'calm' && c.zone !== 'shelter';
  const lines = CHATTER[scared ? 'scared' : c.zone];
  speak(c, lines[Math.floor(Math.random() * lines.length)]);
  if (scared) emote(c, '😨', 2);
}

function tick() {
  walkClock();
  if (!playing() || frozen()) return;
  const dt = DT * SPEED, ev = cur(), L = LV();
  S.t -= dt;

  // power: solar arrays fold into safe mode during the storm, and can stay offline after a big one
  S.supply = S.phase === 'storm' ? 10 + (S.cargo.batt ? 2 : 0) + (L.hints ? 2 : 0) : S.panelsDown ? 10 : 14;   // Cadet level keeps a little more storm power
  let shed = false;
  for (const k of ['farm', 'h2o', 'o2', 'shield']) while (used() > S.supply && S.sys[k].lvl > 0) { S.sys[k].lvl--; shed = true; }
  if (shed) { log('Less solar power now. Some machines were turned down: check your power!', 'warn', null); SFX.play('powerdn'); }

  // storm intensity rises, peaks, then fades
  S.I = S.phase === 'storm' ? ev.sev * 3 * Math.pow(Math.sin(Math.PI * (1 - S.t / S.dur)), 0.7) || 0 : 0;
  SFX.geiger(S.I);

  const active = S.crew.filter(c => !c.out);

  // supplies, in real kg, at NASA BVAD rates (see BVAD above)
  const h = dt * Math.min(1, hoursPerSec(ev)), T = S.tanks;   // a very long real warning (days) must not fast-forward the base and eat the supplies
  S.hours += h; S.stats.hours += h;
  const use = { o2: 0, h2o: 0, food: 0 };            // kg per hour for the whole crew
  active.forEach(c => { const r = BVAD[activity(c)]; for (const k in use) use[k] += r[k] / 24 * L.use; });
  const farmers = at('green').reduce((a, c) => a + (c.job === 'botanist' ? 2 : 1), 0);
  // food grows in proportion to garden health (storm-damaged plants grow less)
  const makeFood = (lvl('farm') ? MAKE.farm * lvl('farm') + MAKE.farmer * farmers : 0) * S.garden / 100;
  const makeH2o = MAKE.h2o * lvl('h2o');
  // oxygen is made from water: no water, no oxygen
  const wantO2 = MAKE.o2 * lvl('o2');
  const makeO2 = Math.min(wantO2, Math.max(0, T.h2o + (makeH2o - use.h2o) * h) / H2O_PER_O2 / Math.max(h, 1e-9));
  if (wantO2 > 0 && makeO2 < wantO2 * 0.5 && !S.dry) { S.dry = true; log('Water tank empty! The oxygen machine needs water to make air.', 'bad'); Learn.flash('water', false); }
  if (makeO2 >= wantO2 * 0.5) S.dry = false;
  S.rate = { o2: makeO2 - use.o2, h2o: makeH2o - use.h2o - makeO2 * H2O_PER_O2, food: makeFood - use.food };
  for (const k in T) T[k] = Math.max(0, Math.min(TANK[k], T[k] + S.rate[k] * h));
  for (const k in use) S.stats.use[k] += use[k] * h;
  S.stats.split += makeO2 * H2O_PER_O2 * h;
  if (lvl('shield')) S.stats.shieldH += h;
  for (const k in T) if (pct(k) < 20 && once('low' + k + S.round)) log(`${{ o2: 'Oxygen', h2o: 'Water', food: 'Food' }[k]} is running low! Give that machine more power.`, 'warn');

  // science from the surface
  at('eva').forEach(c => {
    const gain = (c.job === 'geologist' ? 2 : 1) * (S.cargo.sci ? 1.5 : 1);
    S.science += gain * dt;
    if (Math.random() < 0.3 * dt) { S.fx.push({ x: c.x, y: c.y - 84, text: '★+' + Math.round(gain * 3), t: 1.2, color: '#ffd84a' }); SFX.play('star'); for (let i = 0; i < 5; i++) S.parts.push({ x: c.x, y: c.y - 60, vx: rnd(-40, 40), vy: rnd(-70, -20), t: 0.7, life: 0.7, color: '255,216,74', size: 2 }); }
  });

  // storm breaks things
  if (S.phase === 'storm' && S.stats.breaks < (L.hints ? 2 : 3) && Math.random() < 0.05 * ev.sev * L.brk * dt) {   // at most 2 or 3 breakdowns per storm
    const ok = Object.keys(S.sys).filter(k => !S.sys[k].broken && S.sys[k].lvl > 0);
    if (ok.length) {
      const k = ok[Math.floor(Math.random() * ok.length)];
      S.stats.breaks++; S.shake = 0.4; SFX.play('break');
      if (S.cargo.parts && !S.stats.partsUsed) {
        S.stats.partsUsed = true; S.fx.push({ x: SYSTEMS[k].at[0], y: SYSTEMS[k].at[1], text: '🔧 SPARE PART!', t: 1.6, color: '#4be38a' });
        log(`${SYSTEMS[k].name} machine was hit, but your spare parts kit fixed it right away!`, 'good');
      } else {
        S.sys[k].broken = true; S.sys[k].repair = 0;
        log(`${SYSTEMS[k].name} machine knocked out! Tap the red FIX bubble.`, 'bad');
        if (once('zap')) Learn.flash('zap', false);
      }
    }
  }
  // One planned breakdown per storm, so every player meets each repair game once in a mission
  // (game design, not NASA data). Surprise breakdowns above still happen on top.
  const planned = !S.endless && SHOWCASE[EVENTS[S.round].key];
  if (planned && S.phase === 'storm' && !S.stats.planned && S.t < S.dur * 0.7 && (!EVENTS[S.round].flares || S.flare === 1) && !S.sys[planned].broken) {
    S.stats.planned = true; S.stats.breaks++; S.shake = 0.4; SFX.play('break');
    S.sys[planned].broken = true; S.sys[planned].repair = 0;
    log(`${SYSTEMS[planned].name} machine knocked out! Tap the red FIX bubble.`, 'bad');
    if (once('zap')) Learn.flash('zap', false);
  }
  // slow automatic repair while someone is in the Workshop (the mini-game is much faster)
  const broken = Object.keys(S.sys).find(k => S.sys[k].broken);
  if (broken && at('work').length) {
    S.sys[broken].repair += 4 * at('work').length * dt;
    if (S.sys[broken].repair >= 100) repaired(broken);
  }
  if (S.pendingFix && S.sys[S.pendingFix].broken && at('work').length) { const k = S.pendingFix; S.pendingFix = null; openFix(k); }

  // radiation dose + health
  const cut = 1 - 0.2 * lvl('shield');
  // greenhouse garden: only severe storms hurt the plants (thin walls); the water shield helps.
  // Playing Greenhouse Guard protects it for the rest of the storm. Between storms it regrows
  // while the grow lights are on, fastest with the Botanist tending it.
  if (S.phase === 'storm' && severe(ev) && !S.ggDone) S.garden = Math.max(0, S.garden - GARDEN_DMG * S.I * cut * L.dose * dt);
  else if (S.phase !== 'storm' && lvl('farm')) S.garden = Math.min(100, S.garden + (at('green').some(c => c.job === 'botanist') ? 1.2 : 0.3) * dt);
  active.forEach(c => {
    const where = radAt(c), vest = S.cargo.vest && where > 0.1 ? 0.75 : 1;
    const before = c.dose;
    c.dose += S.I * where * cut * L.dose * vest * dt + BACKGROUND * where * h;
    if (before < 15 && c.dose >= 15 && once('bio' + c.id)) {          // 150 mSv: bio-telemetry alert (a game threshold; the fact card it shows cites NASA OSDR radiation-biology studies)
      log(`Bio-telemetry alert: ${c.name}'s radiation dose is climbing. Get them to the shelter.`, 'warn'); emote(c, '⚠️', 2.5); Learn.flash('cells', false);
    }
    if (before < CAREER && grounded(c) && once('career' + c.id)) {
      log(`${c.name} just passed NASA's 600 mSv career limit. The flight surgeon has grounded them: no more moonwalks.`, 'bad'); emote(c, '🚫', 3);
      if (c.zone === 'eva') orderMove(c, 'shelter', true);
    }
    if (T.o2 <= 0) c.health -= 4 * L.use * dt;
    if (T.h2o <= 0) c.health -= 1.5 * L.use * dt;
    if (T.food <= 0) c.health -= 1 * L.use * dt;
    if (c.dose >= 100) c.health = 0;
    if (c.health <= 0) {
      c.health = 0; c.out = true; c.path = [];
      const heir = c.id === 'cmd' && S.crew.find(o => !o.out && o.id !== 'cmd');
      log(heir ? `Commander ${c.name} is too sick to work and is resting in the medical bay. ${heir.name} takes command.`
        : `${c.name} is too sick to work and is resting in the medical bay.`, 'bad');
      SFX.play('lose');
    }
  });
  chatter(dt);
  updateHint(ev);

  // phase changes
  if (!S.crew.some(c => !c.out)) endGame();
  else if (S.t <= 0) {
    if (S.phase === 'calm') {
      setPhase('warning', ev.warn * L.warn, 'STORM INCOMING', 'Everyone to the Storm Shelter!');
      SFX.ambience('warning'); SFX.play('alarm'); showDossier(ev);
      log(`Storm Watch, this is Mission Control. ${/[AMX]/.test(ev.cls[0]) ? 'An' : 'A'} ${ev.cls[0]} class solar flare, strength ${ev.cls.slice(1)}, has been detected. Radiation arrives in ${fmtMins(warnMins(ev))}${ev.mins != null ? '' : ', this is a drill'}. All crew to the Storm Shelter!`, 'warn');
    } else if (S.phase === 'warning') {
      S.preLvl = Object.fromEntries(Object.keys(S.sys).map(k => [k, S.sys[k].lvl]));
      setPhase('storm', ev.storm, 'RADIATION STORM', 'Stay in the shelter. Fix what breaks.'); S.shake = 0.9;
      SFX.ambience('storm'); SFX.play('stormhit'); $('#dossier').className = 'mini';
      const outside = active.filter(c => c.zone !== 'shelter' || c.path.length);
      S.stats.caught = [...new Set([...S.stats.caught, ...outside.map(c => c.name)])];
      outside.forEach(c => emote(c, '😱', 2.5));
      if (!outside.length) { log('Everyone is in the shelter. Great work, Commander!', 'good'); Learn.flash('shelter'); S.science += 10; S.fx.push({ x: 600, y: 520, text: '★+10 ALL SAFE', t: 1.8, color: '#4be38a', size: 20 }); }
      else { log(`The storm has hit! ${outside.map(c => c.name).join(' and ')} ${outside.length > 1 ? 'are' : 'is'} not in the shelter yet!`, 'bad'); Learn.flash(outside.some(c => c.y <= SURF + 2) ? 'outside' : S.cargo.vest ? 'vest' : 'shelter', false); }
      if (severe(ev)) setTimeout(() => S.phase === 'storm' && !S.ggDone && log('Severe storm! Radiation is hitting the greenhouse plants. Tap the green PROTECT bubble!', 'bad'), 5000);
    } else {
      const sw = EVENTS[S.round].flares;
      if (sw && S.flare < sw.length - 1) {          // Flare Swarm: the next flare from the same sunspot is already on its way
        S.flare++; restorePower();
        setPhase('calm', EVENTS[S.round].flareCalm * L.calm, `FLARE ${S.flare + 1} OF ${sw.length}`, 'Same sunspot, bigger flare. Get ready!');
        SFX.ambience('calm'); $('#dossier').className = '';
        log(`That was flare ${S.flare} of ${sw.length}. The same sunspot is firing again! Fix what broke and stay close to the shelter.`, 'warn');
        render(); return;
      }
      if ((S.endless || S.round < EVENTS.length - 1) && (severe(ev) || ev.key === '2023')) S.panelsDown = true;   // big storms leave the panels needing a reboot
      debrief();
    }
  }
  render();
}

function spill(tank, kg, name) {
  if (kg < 0.05) return;
  S.tanks[tank] = Math.max(0, S.tanks[tank] - kg);
  log(`Fixed, but ${kg.toFixed(1)} kg of ${name} was lost during the repair.`, 'warn', null);
}
function repaired(k) {
  S.sys[k].broken = false; S.sys[k].repair = 0; S.fixes++;
  // whoever ran over to do the repair goes straight back to safety if a storm is on
  S.crew.forEach(c => { if (c.backTo && !c.out && S.phase !== 'calm' && !Object.values(S.sys).some(x => x.broken)) { orderMove(c, c.backTo, true); speak(c, 'Fixed! Heading back.'); c.backTo = null; } else if (S.phase === 'calm') c.backTo = null; });
  log(`${SYSTEMS[k].name} machine repaired. Nice work!`, 'good'); SFX.play('fixed');
  const [x, y] = SYSTEMS[k].at; S.fx.push({ x, y, text: '✔ FIXED', t: 1.5, color: '#4be38a', size: 20 });
  for (let i = 0; i < 14; i++) S.parts.push({ x, y, vx: rnd(-80, 80), vy: rnd(-90, 10), t: 0.8, life: 0.8, color: '75,227,138', size: 2.5 });
  Learn.flash({ o2: 'oxygen', h2o: 'water', farm: 'salad', shield: 'backgnd' }[k]);
}

// ---------- repairs ----------
// Oxygen is rebooted with the Cosmic Match mini-game; the other machines with a quick plug puzzle.
function openFix(k) {
  if (!S.sys[k].broken || !playing() || S.gg) return;
  if (!at('work').length) {
    const c = S.crew.find(c => !c.out && c.job === 'engineer') || S.crew.find(c => !c.out && c.job === 'pilot') || S.crew.find(c => !c.out);
    if (c) { if (c.zone !== 'work') c.backTo = c.zone; orderMove(c, 'work'); S.pendingFix = k; log(`${c.name} is running to the Workshop to fix it!`, 'warn', null); }
    return;
  }
  // Oxygen: Scrubber Sprint and Cosmic Match take turns. Water: Leak Patrol.
  // In the two quick games, a sloppy repair wastes a little of that supply (game setting, not a NASA number).
  if (k === 'o2') {
    const kind = S.o2Fixes % 2 ? 'cm' : 'ss'; S.cmFor = null;
    return openMini(kind, r => {
      if (!r) return log('The oxygen machine is still broken. Tap FIX to try again.', 'warn', null);
      S.o2Fixes++; repaired('o2');
      if (kind === 'ss') spill('o2', (100 - r.resource) / 100 * 1, 'oxygen');
    });
  }
  if (k === 'h2o') return openMini('lp', r => {
    if (!r || r.ok === false) return log('The water recycler is still broken. Tap FIX to try again.', 'warn', null);
    repaired('h2o'); spill('h2o', Math.max(0, 75 - r.resource) / 75 * 3, 'water');
  });
  if (k === 'shield') return openMini('sy', r => {
    if (!r) return log('The shield machine is still broken. Tap FIX to try again.', 'warn', null);
    repaired('shield');
  });
  S.cmFor = 'farm';
  return openMini('cm', r => {
    S.cmFor = null;
    if (!r) return log('The grow lights are still broken. Tap FIX to try again.', 'warn', null);
    repaired('farm');
  });
}

// ---------- the team's three mini-games, opened inside the main game ----------
// Each one runs in its own frame and reports back when finished. The base is paused meanwhile.
const MINI = {
  gg: { title: '🌱 GREENHOUSE GUARD', sub: 'Shield the plants from the storm', color: '#4be38a', big: false,
        src: () => `greenhouse-guard.html?embed=1&waves=${cur().sev >= 2 && !LV().hints ? 2 : 1}&health=${Math.round(S.garden)}`, leave: 'Leave plants unprotected' },
  cm: { title: '🛰️ COSMIC MATCH', sub: 'Match the NASA pictures to reboot the computer', color: '#37d6ff', big: true, src: () => 'cosmic-match.html?embed=1' + (S.cmFor === 'farm' ? '&system=Grow%20Light' : ''), leave: 'Back to base' },
  lp: { title: '💧 LEAK PATROL', sub: 'Seal the leaks to restart the water recycler', color: '#7fd8ff', big: false, src: () => 'leak-patrol.html?embed=1', leave: 'Back to base' },
  ss: { title: '🫧 SCRUBBER SPRINT', sub: 'Trap the CO₂ to restart the air system', color: '#a7ffdc', big: false, src: () => 'scrubber-sprint.html?embed=1', leave: 'Back to base' },
  sy: { title: '🛡️ SHIELD SYNC', sub: 'Lock the water-wall pumps back in', color: '#5ad8ff', big: true, src: () => 'shield-sync.html?embed=1', leave: 'Back to base' },
  sr: { title: '⚡ SOLAR REBOOT', sub: 'Reconnect the solar panels', color: '#ffb938', big: true, src: () => 'solar-panels.html?embed=1', leave: 'Back to base' },
};
// A mini-game sends { finished: true } the moment it is won, and a second message when the player taps its
// Continue button. miniResult keeps the finished result, so the button at the top right also counts it.
let miniDone = null, miniResult = null;
function openMini(kind, done) {
  if (S.gg) return;
  const m = MINI[kind];
  S.gg = kind; miniDone = done; miniResult = null; SFX.hush(); SFX.play('whoosh'); render();
  // transition: a coloured iris closes over the base with the mini-game's name, then the game opens
  const warp = document.createElement('div');
  warp.id = 'warp'; warp.style.setProperty('--c', m.color);
  warp.innerHTML = `<div><b>${m.title}</b><span>${m.sub}</span></div>`;
  document.body.appendChild(warp);
  setTimeout(() => {
    const wrap = document.createElement('div');
    wrap.id = 'ggwrap'; wrap.className = m.big ? 'big' : '';
    wrap.innerHTML = `<div class="ggbox" style="border-color:${m.color}"><div class="gghead"><b style="color:${m.color}">${m.title}</b><span>The base is paused</span><button id="ggleave">✕ ${m.leave}</button></div>
      <iframe src="${m.src()}" title="${m.title} mini-game"></iframe></div>`;
    document.body.appendChild(wrap);
    $('#ggleave').onclick = () => closeMini(miniResult);
    warp.classList.add('out'); setTimeout(() => warp.remove(), 600);
  }, 950);
}
function closeMini(result) {
  const w = $('#ggwrap'); if (!w) return;
  w.classList.add('closing'); SFX.play('whooshout');
  if (result) S.minis[S.gg] = true;
  setTimeout(() => { w.remove(); S.gg = false; const d = miniDone; miniDone = null; lastWalk = performance.now(); d && d(result); render(); }, 380);
}
addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data || !S.gg) return;
  const src = { 'greenhouse-guard': 'gg', 'cosmic-match': 'cm', 'solar-reboot': 'sr', 'leak-patrol': 'lp', 'scrubber-sprint': 'ss', 'shield-sync': 'sy' }[e.data.source];
  if (src !== S.gg) return;
  const result = src === 'cm' || src === 'sr' ? e.data.ok : e.data;
  if (e.data.finished) {                       // won, but still looking at the results screen
    miniResult = result;
    const b = $('#ggleave'); if (b) { b.textContent = 'Continue ▶'; b.classList.add('done'); }
    return;
  }
  closeMini(miniResult || result);
});
function openGarden() {
  if (!canProtect() || S.gg) return;
  openMini('gg', result => {
    if (result) {
      S.garden = Math.max(0, Math.min(100, result.health)); S.ggDone = true;
      log(`Greenhouse protected! Garden health ${Math.round(S.garden)}%. The water shield covers it for the rest of this storm.`, 'good'); Learn.flash('salad');
    } else log('The plants are still exposed. Tap PROTECT to go back.', 'warn', null);
  });
}
function openReboot() {
  if (!S.panelsDown || S.gg || !playing()) return;
  openMini('sr', ok => {
    if (ok) { S.panelsDown = false; log('Solar panels are back online. Full power restored!', 'good'); SFX.play('fixed'); Learn.flash('sunlight'); }
    else log('The solar panels are still offline. Tap REBOOT to try again.', 'warn', null);
  });
}

// ---------- Call Mission Control: real signal delay, then advice ----------
// A radio signal takes about 1.3 seconds to cross the 384,400 km to Earth, and 1.3 back.
function advice() {
  const active = S.crew.filter(c => !c.out), out = active.filter(c => c.zone !== 'shelter');
  const broken = Object.keys(S.sys).find(k => S.sys[k].broken), spare = S.supply - used();
  if (S.phase !== 'calm' && out.length) return `Get ${out.map(c => c.name).join(' and ')} into the Storm Shelter now.`;
  if (broken) return `The ${SYSTEMS[broken].name.toLowerCase()} machine is broken. Tap its red FIX bubble.`;
  if (canProtect()) return 'The greenhouse is taking radiation. Tap the green PROTECT bubble.';
  if (S.panelsDown) return 'Your solar panels are offline. Tap the yellow REBOOT bubble on the surface.';
  for (const k of ['o2', 'h2o', 'food']) if (pct(k) < 35) return `${{ o2: 'Oxygen', h2o: 'Water', food: 'Food' }[k]} is getting low. Give ${k === 'food' ? 'the grow lights' : 'that machine'} more power${k === 'food' ? ' and keep the Botanist in the Greenhouse' : ''}.`;
  if (S.phase === 'storm' && !lvl('shield') && spare >= 2) return 'You have spare power. Turn on the water shield to cut the radiation.';
  if (S.phase === 'calm' && lvl('shield')) return 'The Sun is quiet. Turn the shield off and use that power to make supplies.';
  if (S.phase === 'calm' && !at('eva').length) return 'It is calm. Send the Geologist outside to collect science stars.';
  if (S.garden < 70) return 'The garden is hurt. Keep the Botanist in the Greenhouse so it grows back.';
  return 'You are doing great, Commander. Keep an eye on your supplies.';
}
function callHome() {
  if (!playing() || S.call || performance.now() < S.callAt) return;
  S.call = { t0: performance.now() }; SFX.hush(); SFX.play('signal');
  log('Calling Mission Control… your message takes 1.3 seconds to reach Earth.', '', null); render();
  setTimeout(() => {
    S.call = null; S.callAt = performance.now() + 9000;
    if (playing()) { log('Mission Control: ' + advice(), 'good'); Learn.flash('delay'); }
    render(); setTimeout(render, 9100);
  }, 2600);
}

// ---------- cards ----------
function crewLine(c) { return `<li>${portrait(c, 28)}<span><b style="color:${c.color}">${esc(c.name)}</b> <small>${c.name === c.role ? '' : c.role}</small>: ${c.out ? 'in the medical bay' : `health ${Math.round(c.health)}%`}, dose ${Math.round(c.dose * 10)} mSv</span></li>`; }

// The storm's real NASA record, shown during the countdown and again in the debrief.
function stormPanel(ev) {
  return `<div class="storm"><div class="scale">${['A', 'B', 'C', 'M', 'X'].map(l => `<i class="${l === ev.cls[0] ? 'on' : ''}">${l}</i>`).join('')}<b>${ev.cls}</b>${Learn.chip('flare', 'solar flare')}</div>
    <dl><dt>When</dt><dd>${ev.date}, ${ev.peak.slice(11, 16)} UTC</dd>
    ${ev.region ? `<dt>Sunspot</dt><dd>Region ${ev.region}${ev.loc ? ` (${ev.loc})` : ''}</dd>` : ''}
    <dt>Real warning</dt><dd>${ev.mins != null ? `<b>${fmtMins(ev.mins)}</b> from flare to radiation (${ev.sepInst})` : 'No radiation storm followed this flare, so this one is a practice drill.'}</dd>
    ${ev.cme ? `<dt>Gas cloud</dt><dd>${ev.cme} ${Learn.chip('cme', 'CME')}</dd>` : ''}</dl>
    <p class="src">${ev.fromNasa ? '● Live from NASA DONKI' : '○ Saved NASA DONKI data'}${ev.link ? ` · <a href="${ev.link}" target="_blank" rel="noopener">see the NASA record</a>` : ''}</p></div>`;
}
function swarmPanel(ev) {
  const when = t => t ? t.slice(5, 10).replace('-', '/') + ' ' + t.slice(11, 16) + ' UTC' : '(none recorded)';
  return `<div class="storm"><p><b>Four real X-class flares from sunspot region ${ev.region}, one after another:</b></p>
    <ul class="swarm">${ev.flares.map(f => `<li><b>${f.cls}</b> ${f.date}, ${f.peak.slice(11, 16)} UTC · particles reached GOES ${when(f.sepTime)}${f.link ? ` · <a href="${f.link}" target="_blank" rel="noopener">record</a>` : ''}</li>`).join('')}</ul>
    ${ev.cme ? `<dl><dt>Gas cloud</dt><dd>${ev.cme} ${Learn.chip('cme', 'CME')}</dd></dl>` : ''}
    <p class="src">${ev.fromNasa ? '● Live from NASA DONKI' : '○ Saved NASA DONKI data'} · Finale idea by Quan</p></div>`;
}
function finaleIntro() {
  const ev = EVENTS[S.round + 1];
  S.phase = 'brief';
  showCard(`<h2>⚠️ FINAL CHALLENGE: THE FLARE SWARM</h2>
    <p class="big">In May 2024, one sunspot group fired <b>seven X-class flares in four days</b>. Four of them are heading for your base, one after another.</p>
    <ul class="how"><li>🔥 Each flare is bigger than the one before.</li><li>⏱️ You get only a few seconds between flares to fix machines and turn the power back up.</li><li>🛡️ Keep your crew close to the shelter!</li></ul>
    <p class="src">Real data: NASA DONKI flares ${ev.flares.map(f => f.cls).join(', ')} from region ${ev.region}. Finale idea by Quan.</p>
    <button class="go" id="go">Bring it on ▶</button>`, () => { S.round++; startRound(); });
  SFX.say('Final challenge, Commander. Four flares from the same sunspot, one after another. Keep your crew close to the shelter.', 'capcom', true);
}
function showDossier(ev) { const d = $('#dossier'); d.innerHTML = `<h4>🛰️ STORM TRACKER</h4>${stormPanel(ev)}`; d.className = 'show'; }

function debrief() {
  const ev = EVENTS[S.round];
  S.phase = 'debrief'; S.I = 0; S.hint = null; $('#dossier').className = '';
  const worst = Math.max(...S.crew.map(c => c.dose));
  const last = !S.endless && S.round === EVENTS.length - 1, aurora = !S.endless && ev.key === '2017';
  SFX.ambience('off'); SFX.play('allclear'); SFX.say('The storm has passed. Stand by for your debrief.', 'capcom', true);
  $('#caption').className = '';
  const firstBadge = Learn.award('first');
  // "today's choices, tomorrow's costs": the trade-off report
  const costs = [];
  if (S.stats.caught.length) costs.push(`☢️ ${S.stats.caught.join(' and ')} ${S.stats.caught.length > 1 ? 'were' : 'was'} outside the shelter when the storm hit and soaked up extra radiation. Dose never goes back down.`);
  if (S.stats.shieldH > 1) costs.push(`🛡️ You ran the water shield for ${Math.round(S.stats.shieldH)} hours. It cut the radiation, but that power could not make air, water or food.`);
  if (S.garden < 99) costs.push(`🌱 The garden is at ${Math.round(S.garden)}%. Food will grow slower in the next days until the plants recover.`);
  if (S.panelsDown) costs.push('⚡ The storm knocked the solar panels offline. You will have less power until you reboot them.');
  for (const k of ['o2', 'h2o', 'food']) if (pct(k) < 30) costs.push(`${SYSTEMS[k === 'food' ? 'farm' : k].icon} ${{ o2: 'Oxygen', h2o: 'Water', food: 'Food' }[k]} is down to ${Math.round(pct(k))}%. Hiding in the shelter kept the crew safe, but nobody was making supplies.`);
  if (!costs.length) costs.push('✅ Great balance! Your crew stayed safe and your supplies held up.');
  showCard(`
    <h2>STORM ${S.round + 1} SURVIVED!</h2>
    <ul class="crewlist">${S.crew.map(crewLine).join('')}</ul>
    <p>Highest crew dose so far: <b>${Math.round(worst * 10)} mSv</b> ${Learn.chip('dose', 'mSv')} · NASA's career limit for astronauts is 600 mSv.</p>
    ${firstBadge ? '<p class="newbadge">🏅 Badge earned: <b>First Storm</b>! Tap 📖 Logbook any time to see all your badges.</p>' : ''}
    <h3>${ev.mins != null ? 'THIS REALLY HAPPENED' : 'REAL FLARE, PRACTICE STORM'}: ${ev.title.toUpperCase()}</h3>
    <div class="real">${ev.fact}</div>
    ${ev.flares ? swarmPanel(ev) : stormPanel(ev)}
    <div class="quiz" id="quiz"></div>
    <h3>YOUR CHOICES AND WHAT THEY COST</h3>
    <ul class="costs">${costs.map(c => `<li>${c}</li>`).join('')}</ul>
    <p class="life">In these <b>${Math.round(S.stats.hours)} hours</b> your crew breathed <b>${S.stats.use.o2.toFixed(1)} kg</b> of oxygen,
      drank <b>${S.stats.use.h2o.toFixed(1)} kg</b> of water and ate <b>${S.stats.use.food.toFixed(1)} kg</b> of food.
      <small>Rates from NASA's Life Support BVAD.</small></p>
    <button class="go" id="go">${aurora ? 'One more thing… ▶' : last ? 'See your rating ▶' : 'Next storm ▶'}</button>
    ${S.endless ? '<button id="finish">Finish mission</button>' : ''}`,
    () => {
      if (aurora) return startCut('aurora');
      if (last) return endGame();
      if (S.endless && S.round === EVENTS.length - 1) addEndlessStorm();
      S.round++; startRound();
    });
  if ($('#finish')) $('#finish').onclick = endGame;
  S.quizTotal++;
  Learn.quiz($('#quiz'), ev, S.asked, ok => { if (ok) { S.quizRight++; S.science += 25; render(); } }, { cadet: 1, pilot: 2, commander: 3 }[LEVEL]);
  setTimeout(() => Learn.flash({ live: 'classes', 2023: 'speed', '2023b': 'speed', swarm: 'gannon', 2017: 'cells' }[ev.key] || 'apollo'), 1500);
  if (S.round === 1) setTimeout(() => Learn.flash('bones'), 14000);
}

function addEndlessStorm() {
  const n = S.round + 1 - CAMPAIGN.length, x = EXTRA[n % Math.max(1, EXTRA.length)];
  if (!x) return EVENTS.push({ ...EVENTS[EVENTS.length - 1] });
  EVENTS.push(makeEvent({ key: 'x' + n, title: `The ${x.cls} Flare of ${x.peak.slice(0, 4)}`, sev: Math.min(3.2, 2 + n * 0.15), calm: 22, warn: 12, storm: 34,
    fact: `A real ${x.cls} flare from NASA's records. It sent solar particles all the way to the GOES satellites near Earth.` }, x, false));
}

function endGame() {
  S.phase = 'end'; S.I = 0; S.hint = null; S.cut = null; $('#dossier').className = '';
  SFX.ambience('off');
  const alive = S.crew.filter(c => !c.out), T = S.tanks, L = Learn.log;
  const score = Math.round(S.science + S.crew.reduce((a, c) => a + c.health, 0) * 2 + pct('o2') + pct('h2o') + pct('food')
    - S.crew.reduce((a, c) => a + c.dose, 0));
  let rating = score >= 1300 ? 'FLIGHT DIRECTOR' : score >= 1100 ? 'MISSION COMMANDER' : score >= 850 ? 'MISSION SPECIALIST' : 'CADET IN TRAINING';
  if (alive.length < 4 && score >= 1100) rating = 'MISSION SPECIALIST';
  const overLimit = S.crew.filter(grounded);
  if (overLimit.length && rating !== 'CADET IN TRAINING') rating = 'CADET IN TRAINING';   // real flight directors never let crew pass the career limit
  if (!alive.length) rating = 'MISSION CUT SHORT';
  const fresh = [];
  const give = (id, cond) => { if (cond && Learn.award(id)) fresh.push(id); };
  give('safe', alive.length === 4); give('quiz', S.quizTotal >= 4 && S.quizRight === S.quizTotal); give('garden', alive.length && S.garden > 80);
  give('fixer', S.fixes >= 5); give('director', rating === 'FLIGHT DIRECTOR');
  give('minis', ['gg', 'cm', 'lp', 'ss', 'sy', 'sr'].every(k => S.minis[k]));
  give('swarm', alive.length === 4 && !S.endless && EVENTS[S.round] && EVENTS[S.round].key === 'swarm');
  const nBadges = L.badges.length, allBadges = Object.keys(Learn.BADGES).length;
  L.plays++; const record = score > L.best; if (record) L.best = score; Learn.save();
  SFX.play(alive.length ? 'win' : 'lose');
  SFX.say(alive.length ? `Mission complete. Your flight readiness rating is ${rating.toLowerCase()}. Well done, Commander.` : 'Mission cut short. Every astronaut trains many times. Try again, Commander.', 'capcom', true);
  showCard(`
    <h2>FLIGHT READINESS RATING</h2>
    <div class="rating">${rating}</div>
    <p class="scoreline">Score <b>${score}</b>${record ? ' <em>NEW BEST!</em>' : ` · best ${L.best}`} · Science ★ <b>${Math.floor(S.science)}</b> · Quiz <b>${S.quizRight}/${S.quizTotal}</b> · Storms survived <b>${S.round + (alive.length ? 1 : 0)}</b></p>
    <ul class="crewlist">${S.crew.map(crewLine).join('')}</ul>
    ${overLimit.length && alive.length ? `<p>⚠️ ${overLimit.map(c => esc(c.name)).join(', ')} went past NASA's 600 mSv career limit. A real flight director would never allow that, so your rating is capped. Use the Storm Shelter sooner next time!</p>` : ''}
    ${S.crew[0].out && alive.length ? `<p>Commander ${esc(S.crew[0].name)} needed the medical bay; ${esc(alive[0].name)} led the crew.</p>` : ''}
    <h3>YOUR BADGES: ${nBadges} OF ${allBadges}${fresh.length ? ` · ${fresh.length} NEW!` : ''}</h3>
    ${Learn.badgeGrid(fresh)}
    <p>Mission length: ${clock(S.hours).replace(' · ', ', ')} · Supplies left: oxygen ${T.o2.toFixed(1)} kg, water ${T.h2o.toFixed(1)} kg, food ${T.food.toFixed(1)} kg</p>
    <p class="src">Fact cards collected: <b>${L.cards.length} / ${Object.keys(Learn.CARDS).length}</b>. Play again to find them all. Storm 1 changes whenever the real Sun does.</p>
    <button class="go" id="go">Play again ▶</button>
    ${alive.length && !S.endless ? '<button id="endless">♾ Keep going: more real storms</button>' : ''}
    <button id="lb2">📖 Logbook</button>`, () => { newGame(); intro(); });
  $('#lb2').onclick = Learn.logbook;
  if ($('#endless')) $('#endless').onclick = () => { S.endless = true; addEndlessStorm(); S.round++; startRound(); };
  if (fresh.length) setTimeout(() => SFX.play('badge'), 1600);
}

function showCard(html, onGo) {
  $('#card').innerHTML = html;
  $('#modal').classList.remove('fixing'); $('#modal').classList.add('show');
  $('#card').scrollTop = 0;
  $('#go').onclick = () => { SFX.unlock(); SFX.play('click'); onGo(); };
  render();
}

// ---------- title screen ----------
let loaded, srcText = 'Contacting NASA for today\'s solar storm data…';
function roster() {
  return `<div class="roster">${S.crew.map(c => `<div>${portrait(c, 54)}<b style="color:${c.color}">${esc(c.name)}</b><small>${c.role} · ${c.perk}</small></div>`).join('')}</div>`;
}
function intro() {
  S.phase = 'brief';
  showCard(`
    <div class="title"><span>NASA SPACE APPS 2026 · JUNIOR ASTRONAUT MISSION TRAINER</span><h1>STORM WATCH</h1>
    <p>You are the Commander of a Moon base. <b>Real solar storms</b> are on the way. Pack your rocket, look after your crew and keep everyone safe!</p></div>
    ${roster()}
    <div class="levels" id="levels">${Object.entries(LEVELS).map(([k, l]) => `<button data-l="${k}" class="${k === LEVEL ? 'on' : ''}"><b>${l.name}</b><small>${l.who}</small></button>`).join('')}</div>
    <ul class="how">
      <li>🧑‍🚀 <b>Drag astronauts</b> between rooms (or tap one, then tap a room). Outside they collect science ★ but have no protection.</li>
      <li>🚨 When the alarm sounds, get everyone <b>down to the Storm Shelter</b>.</li>
      <li>⚡ Share your power between air, water, food and the shield. <b>Every choice costs something.</b></li>
      <li>📡 Stuck? <b>Call Mission Control</b>. The answer takes 2.6 seconds to come back from Earth!</li>
    </ul>
    <p class="src" id="src">${srcText}</p>
    <button class="go" id="go" disabled>Start mission ▶</button>
    <div class="menu"><button id="custom">🧑‍🚀 Customize Commander</button><button id="lb">📖 Logbook <small>${Learn.log.cards.length}/${Object.keys(Learn.CARDS).length}</small></button><button id="srcs">🛰️ Real NASA data</button></div>`, meetCrew);
  $('#custom').onclick = customize; $('#lb').onclick = Learn.logbook; $('#srcs').onclick = Learn.sources;
  $('#levels').querySelectorAll('button').forEach(b => b.onclick = () => {
    LEVEL = b.dataset.l; try { localStorage.setItem('stormwatch.level', LEVEL); } catch (e) {}
    $('#levels').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); SFX.play('select'); render();
  });
  loaded = loaded || loadEvents();
  loaded.then(() => {
    const n = EVENTS.filter(e => e.fromNasa).length;
    srcText = n === EVENTS.length ? `● Live NASA data loaded. Storm 1 is the strongest flare of the last 30 days: ${EVENTS[0].cls} on ${EVENTS[0].date}.`
      : n ? `◐ ${n} of ${EVENTS.length} storms loaded live from NASA; the rest use saved NASA data.`
      : '○ NASA is unreachable right now. Using saved NASA DONKI data.';
    if ($('#src')) $('#src').textContent = srcText;
    if (S.phase === 'brief' && $('#go')) $('#go').disabled = false;
  });
}

// ---------- packing on Earth, then launch ----------
function afterMeet() { showPrep(); }
function showPrep() {
  S.phase = 'prep';
  const usedCrates = () => Object.entries(S.cargo).reduce((a, [k, n]) => a + n * CARGO[k].cost, 0);
  const paint = () => {
    const left = CRATES - usedCrates();
    showCard(`
      <h2>🚀 PACK YOUR ROCKET</h2>
      <p>You are still on Earth. Your rocket can lift only <b>${CRATES} crates</b>, so you cannot bring everything. Choose what matters most!</p>
      <div class="crates">${Array.from({ length: CRATES }, (_, i) => `<i class="${i < CRATES - left ? 'full' : ''}"></i>`).join('')}<b>${left} left</b></div>
      <div class="cargo">${Object.entries(CARGO).map(([k, c]) => `<div class="${S.cargo[k] ? 'has' : ''}"><span>${c.icon}</span><div><b>${c.name}</b> <em>${c.cost} crate${c.cost > 1 ? 's' : ''}</em><small>${c.tip}</small></div>
        <button data-k="${k}" data-d="-1" ${S.cargo[k] ? '' : 'disabled'} aria-label="Remove ${c.name}">−</button><strong>${S.cargo[k]}</strong><button data-k="${k}" data-d="1" ${S.cargo[k] < c.max && left >= c.cost ? '' : 'disabled'} aria-label="Add ${c.name}">+</button></div>`).join('')}</div>
      <p class="src">You start with tanks ${Math.round(START_FILL * 100)}% full, plus whatever you pack. There is no perfect answer: more supplies means less gear.</p>
      <button class="go" id="go">3, 2, 1… Launch ▶</button> <button id="auto">Mission Control's pick</button>`, launch);
    $('#card').querySelectorAll('.cargo button').forEach(b => b.onclick = () => { S.cargo[b.dataset.k] += +b.dataset.d; SFX.play(+b.dataset.d > 0 ? 'plug' : 'click'); paint(); });
    $('#auto').onclick = () => { S.cargo = { h2o: 2, o2: 2, food: 2, parts: 1, vest: 1, sci: 0, batt: 0 }; SFX.play('select'); paint(); };
  };
  paint();
  SFX.say('Commander, your rocket can lift ten crates. Choose carefully.', 'capcom', true);
}
function launch() {
  for (const k in CARGO_ADD) S.tanks[k] = Math.min(TANK[k], TANK[k] * START_FILL + S.cargo[k] * CARGO_ADD[k]);
  startCut('launch');
}
function startCut(type) {
  $('#modal').classList.remove('show'); Learn.closeOverlay();
  $('#caption').className = '';
  S.phase = 'cut'; S.cut = { type, t: 0, dur: type === 'launch' ? 8 : 26 };
  if (type === 'launch') { SFX.play('launch'); SFX.say('Three. Two. One. Lift off! Next stop, the Moon.', 'capcom', true); }
  else { SFX.play('aurora'); SFX.say('One more thing, Commander. The storm you just survived also reached Mars. The whole planet glowed with an aurora twenty five times brighter than any seen there before.', 'capcom', true); Learn.flash('aurora'); }
  render();
}
function endCut() {
  if (!S.cut) return;
  const type = S.cut.type; S.cut = null;
  if (type === 'launch') { startRound(); setTimeout(() => Learn.flash('packing'), 4000); }
  else if (!S.endless && S.round < EVENTS.length - 1) finaleIntro();
  else endGame();
}

// ---------- pointer input on the scene ----------
const toWorld = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
const zoneAt = (x, y) => Object.keys(ZONES).find(k => { const z = ZONES[k]; return x >= z.x && x <= z.x + z.w && y >= z.y - 10 && y <= z.y + z.h + 10; });
// On a small screen the scene is shrunk, so tap targets grow to stay at least ~22 px wide under a finger.
const reach = base => Math.max(base, 22 * W / cv.getBoundingClientRect().width);
const crewAt = (x, y) => { const r = reach(28); return S.crew.filter(c => !c.out && Math.abs(x - c.x) < r && y > c.y - 70 - r && y < c.y - 10 + r).sort((a, b) => Math.abs(x - a.x) - Math.abs(x - b.x))[0]; };
const fixAt = (x, y) => Object.keys(SYSTEMS).find(k => S.sys[k].broken && Math.hypot(x - SYSTEMS[k].at[0], y - SYSTEMS[k].at[1]) < reach(30));
let downAt = null;

cv.addEventListener('pointerdown', e => {
  SFX.unlock();
  if (S.cut) { if (S.cut.t > 1.2) endCut(); return; }
  if (!playing() || frozen()) return;
  const [x, y] = toWorld(e), fk = fixAt(x, y), c = crewAt(x, y);
  if (fk) return openFix(fk);
  if (canProtect() && Math.hypot(x - PROTECT_AT[0], y - PROTECT_AT[1]) < reach(34)) return openGarden();
  if (S.panelsDown && Math.hypot(x - REBOOT_AT[0], y - REBOOT_AT[1]) < reach(34)) return openReboot();
  if (c) { S.drag = S.sel = c.id; S.ptr = [x, y]; downAt = [x, y]; cv.setPointerCapture(e.pointerId); SFX.play('select'); }
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
cv.addEventListener('pointercancel', () => { S.drag = null; });

// ---------- toolbar ----------
$('#mute').onclick = () => { SFX.setMuted(!SFX.muted); $('#mute').textContent = SFX.muted ? '🔇' : '🔊'; };
$('#pause').onclick = () => { if (!playing() || S.gg || S.reading) return; S.paused = !S.paused; lastWalk = performance.now(); SFX.play('click'); if (S.paused) SFX.hush(); render(); };
$('#call').onclick = callHome;
$('#allShelter').onclick = () => { S.crew.forEach(c => orderMove(c, 'shelter', true)); SFX.play('drop'); log('Everybody to the shelter, go go go!', 'warn', 'cmd'); };
$('#srcbadge').onclick = Learn.sources;
$('#logbtn').onclick = Learn.logbook;
$('#chips').innerHTML = Learn.chips(['radiation', 'dose', 'flare', 'cme', 'regolith', 'delay']);

// Outside readout: real conditions at the lunar south pole, one line at a time.
const OUTSIDE = [
  '🌡️ Shadowed craters here are colder than −200 °C (NASA LRO Diviner)',
  '☢️ Background radiation outside: about 1.4 mSv every day (Chang\'e-4 LND)',
  '📡 Radio delay to Earth: 1.3 seconds each way (NASA Deep Space Network)',
  '☀️ Nearby ridges are sunlit most of the year: great for solar panels (NASA LRO)',
  '🪶 Gravity here is one sixth of Earth\'s: a 30 kg kid weighs like 5 kg',
  '💨 No air outside: sound cannot travel and the sky is always black',
  '🧊 Craters here hide water ice: future crews can turn it into water and oxygen (NASA LCROSS)',
];
let outsideI = 0;
const tickOutside = () => { const el = $('#outside'); el.classList.remove('in'); void el.offsetWidth; el.textContent = OUTSIDE[outsideI++ % OUTSIDE.length]; el.classList.add('in'); };
tickOutside(); setInterval(tickOutside, 7000);
document.addEventListener('visibilitychange', () => { if (document.hidden && playing() && !S.gg && !S.paused) { S.paused = true; SFX.hush(); render(); } });

newGame();
intro();
setInterval(tick, DT * 1000);
requestAnimationFrame(draw);
