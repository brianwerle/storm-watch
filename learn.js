// STORM WATCH: the learning layer. Plain-language glossary chips, collectible fact cards,
// debrief quiz questions, the Cadet Logbook (saved on this device) and the NASA data sources panel.
const Learn = (() => {
  // ---------- words explained for ages 7-12 ----------
  const GLOSSARY = {
    radiation:    ['Radiation', 'Invisible energy that zooms through space. A tiny bit is normal. A lot at once can make people sick, so astronauts hide from it.'],
    dose:         ['Radiation dose (mSv)', 'How much radiation a body has soaked up. It is counted in millisieverts, written mSv. One chest X-ray is about 0.1 mSv.'],
    flare:        ['Solar flare', 'A giant flash of energy on the Sun. Flares get a letter: A, B, C, M or X. Each letter is 10 times stronger than the one before. X is the biggest.'],
    cme:          ['CME', 'Short for coronal mass ejection: a huge cloud of hot gas that the Sun throws out into space, sometimes faster than 2,000 km every second.'],
    sep:          ['Solar particles (SEP)', 'Super-fast bits of atoms shot out by a solar storm. They are the dangerous part: the radiation storm.'],
    microgravity: ['Microgravity', 'When everything floats, like on the Space Station. Bones and muscles get weaker because they do not have to work. On the Moon you weigh one sixth of what you do on Earth.'],
    sol:          ['Sol', 'One day on Mars. A sol is 24 hours and 39 minutes, a little longer than an Earth day.'],
    kw:           ['Kilowatt (kW)', 'A way to count electric power. One kilowatt runs about ten bright light bulbs. Your base only makes a few, so you have to share.'],
    regolith:     ['Regolith', 'The dusty, rocky soil that covers the Moon. Piled on top of a base, it works as a radiation shield.'],
    delay:        ['Signal delay', 'Radio travels at the speed of light, but space is big. A message takes about 1.3 seconds to reach the Moon and 4 to 24 minutes to reach Mars.'],
  };

  // ---------- collectible fact cards ----------
  // src = where the fact comes from; shown on the card so players know it is real.
  const CARDS = {
    shelter:  { icon: '🛡️', title: 'Dirt makes a great shield', text: 'Your Storm Shelter is deep under Moon soil. Thick layers of rock and soil soak up radiation before it reaches the crew.', src: 'NASA space radiation guidance' },
    outside:  { icon: '☢️', title: 'Nowhere to hide outside', text: 'Earth has thick air and a magnetic field that block most space radiation. The Moon has neither, so an astronaut outside gets the full storm.', src: 'NASA Heliophysics' },
    zap:      { icon: '⚡', title: 'Storms zap machines too', text: 'Fast solar particles can knock out electronics. Real spacecraft switch to a "safe mode" during big storms, just like your solar panels fold.', src: 'NASA CCMC space weather' },
    water:    { icon: '💧', title: 'Air made from water', text: 'The Space Station makes oxygen by splitting water with electricity. Your base does the same, so no water means no air.', src: 'NASA ISS Oxygen Generation System' },
    oxygen:   { icon: '💨', title: '0.84 kg of oxygen a day', text: 'Each astronaut breathes about 0.84 kg of oxygen every day. With four crew that is more than 3 kg a day, every day.', src: 'NASA Life Support BVAD' },
    salad:    { icon: '🥬', title: 'Space salad is real', text: 'In 2015 astronauts on the Space Station grew red romaine lettuce and ate it. Fresh food keeps a crew healthy and happy.', src: 'NASA Veggie experiment' },
    delay:    { icon: '📡', title: '1.3 seconds to the Moon', text: 'Your call to Mission Control took 2.6 seconds: 1.3 there and 1.3 back. On Mars the same call can take up to 24 minutes each way, so Mars crews must decide on their own.', src: 'NASA Deep Space Network' },
    backgnd:  { icon: '🌙', title: 'Radiation never stops', text: 'Even on a calm day the Moon\'s surface gets about 1.4 mSv of radiation every day. That is roughly what you get on Earth in half a year.', src: 'Chang\'e-4 lander LND instrument, 2020' },
    vest:     { icon: '🦺', title: 'A vest for space radiation', text: 'On Artemis I in 2022, two test dummies named Helga and Zohar flew around the Moon to measure radiation. Zohar wore a radiation vest called AstroRad.', src: 'NASA Artemis I, MARE experiment' },
    bones:    { icon: '🦴', title: 'Bones get weaker in space', text: 'Without gravity pulling on them, astronauts can lose 1 to 1.5 percent of their bone strength every month. Scientists study this with mice that flew in space.', src: 'NASA OSDR studies OSD-417 and OSD-342', link: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-417' },
    cells:    { icon: '🧬', title: 'What radiation does to cells', text: 'Radiation can break the tiny instructions (DNA) inside our cells. Scientists zap human cells in the lab to learn how the body repairs itself.', src: 'NASA OSDR study OSD-2', link: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-2' },
    aurora:   { icon: '🌌', title: 'A planet-wide aurora on Mars', text: 'The September 2017 storm lit up Mars with an aurora 25 times brighter than any seen there before. On the ground, the Curiosity rover measured more than double the highest radiation it had seen since landing in 2012.', src: 'NASA MAVEN and Curiosity RAD' },
    gannon:   { icon: '🌍', title: 'Auroras almost everywhere', text: 'The May 2024 storm was the strongest at Earth in over 20 years. People saw the northern lights much farther south than usual.', src: 'NASA / NOAA, May 2024' },
    cold:     { icon: '🥶', title: 'Colder than minus 200', text: 'Some craters near the Moon\'s south pole never see the Sun. They are colder than -200 °C, among the coldest places ever measured in the solar system.', src: 'NASA LRO Diviner instrument' },
    apollo:   { icon: '🚀', title: 'The Apollo near miss', text: 'In August 1972 a huge solar storm hit between the Apollo 16 and Apollo 17 Moon missions. Astronauts on the Moon then could have become very sick.', src: 'NASA history' },
    sunlight: { icon: '☀️', title: 'Almost endless sunshine', text: 'Some ridges near the Moon\'s south pole are sunlit most of the year. That makes them great spots for solar panels, and a reason crews want to live there.', src: 'NASA LRO / Moon Trek illumination maps' },
    classes:  { icon: '🔥', title: 'A, B, C, M, X', text: 'Solar flares are sorted by letter. Each step is 10 times stronger, so an X flare is 100 times stronger than a C flare.', src: 'NASA / NOAA flare scale' },
    speed:    { icon: '💨', title: 'Light first, particles later', text: 'A flare\'s light reaches us in 8 minutes. The fastest particles follow minutes to hours later. The big gas cloud can take one to three days.', src: 'NASA CCMC DONKI' },
    packing:  { icon: '🎒', title: 'Every kilogram counts', text: 'Rockets can only lift so much. Mission planners choose every item with care, because bringing more of one thing means less of another.', src: 'NASA mission planning' },
  };

  // ---------- NASA data used, shown inside the game ----------
  const SOURCES = [
    ['NASA CCMC DONKI', 'Every storm in the game: flare class, time, sunspot region, particle arrival and CME speed. Loaded live when you start.', 'https://ccmc.gsfc.nasa.gov/tools/DONKI/'],
    ['NASA Life Support BVAD', 'How much oxygen, water and food each astronaut uses per day (NASA/TP-2015-218570 Rev 2).', 'https://ntrs.nasa.gov/citations/20210024855'],
    ['NASA Open Science Data Repository (OSDR)', 'Bone-loss and radiation biology studies behind the fact cards that pop up with Bio-Telemetry alerts: OSD-417, OSD-342 and OSD-2. (The alert level itself is a game setting.)', 'https://osdr.nasa.gov/bio/repo/search'],
    ['NASA MAVEN and Curiosity RAD', 'The Mars aurora and record surface radiation (more than double Curiosity\'s previous high) from the September 2017 storm.', 'https://science.nasa.gov/mission/maven/'],
    ['NASA LRO (Diviner, Moon Trek)', 'South-pole temperatures and sunlight used in the Outside readout.', 'https://trek.nasa.gov/moon/'],
    ['NASA Artemis I (MARE)', 'The radiation vest you can pack was tested on the Artemis I flight in 2022.', 'https://www.nasa.gov/mission/artemis-i/'],
    ['NASA Deep Space Network', 'Signal delay for the Call Mission Control button: about 1.3 seconds each way to the Moon.', 'https://www.nasa.gov/communicating-with-missions/dsn/'],
    ['Chang\'e-4 LND (CNSA / Kiel University)', 'Background radiation on the Moon\'s surface, about 1.4 mSv per day. Not a NASA source.', 'https://www.science.org/doi/10.1126/sciadv.aaz1334'],
    ['NASA SDO imagery', 'Real Sun pictures and video inside the mini-games.', 'https://svs.gsfc.nasa.gov/12706'],
  ];

  const BADGES = {
    first:   ['🚀', 'First Storm', 'Finish your first storm'],
    safe:    ['🧑‍🚀', 'Everyone Home', 'Finish a mission with all four crew'],
    quiz:    ['🧠', 'Quiz Whiz', 'Answer every debrief question correctly in one mission'],
    garden:  ['🌱', 'Garden Hero', 'End a mission with the garden above 80%'],
    fixer:   ['🔧', 'Fix-It Pro', 'Repair five machines in one mission'],
    facts10: ['📚', 'Fact Finder', 'Collect 10 fact cards'],
    factsAll:['🏅', 'Space Scholar', 'Collect every fact card'],
    director:['⭐', 'Flight Director', 'Earn the top rating'],
    minis:   ['🎮', 'Game Master', 'Win all six mini-games in one mission'],
    swarm:   ['🔥', 'Swarm Survivor', 'Beat the Flare Swarm with all four crew'],
  };

  // ---------- saved progress (this device only) ----------
  let log = { cards: [], badges: [], best: 0, plays: 0 };
  try { log = { ...log, ...JSON.parse(localStorage.getItem('stormwatch.log') || '{}') }; } catch (e) {}
  const save = () => { try { localStorage.setItem('stormwatch.log', JSON.stringify(log)); } catch (e) {} };

  // ---------- small overlay for glossary / logbook / sources (does not disturb the game card) ----------
  const el = (html, cls) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return d; };
  function overlay(html, onClose) {
    closeOverlay();
    const o = el(`<div class="infobox">${html}<button class="go" id="infoClose">Got it ▶</button></div>`, 'info show');
    o.id = 'info'; document.body.appendChild(o);
    const close = () => { o.remove(); onClose && onClose(); };
    o.querySelector('#infoClose').onclick = close;
    o.onclick = e => { if (e.target === o) close(); };
    SFX.play('card');
  }
  function closeOverlay() { const o = document.getElementById('info'); if (o) o.remove(); }

  function explain(term) {
    const g = GLOSSARY[term]; if (!g) return;
    overlay(`<h2>${g[0]}</h2><p class="big">${g[1]}</p>`);
    SFX.say(g[1], 'base', true);
  }
  // glowing "?" chips: tap one to get a term explained
  const chip = (term, label) => `<button class="jchip" data-term="${term}" title="What does this mean?">${label || GLOSSARY[term][0]} <i>?</i></button>`;
  const chips = terms => terms.map(t => chip(t)).join('');
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.jchip'); if (b) { e.stopPropagation(); explain(b.dataset.term); } });

  // ---------- fact cards: pop up after something happens, then live in the Logbook ----------
  // During play a card pauses the base until the player taps "Got it", so nothing is missed while reading.
  // The game sets these: hold() = pause for this card?  wait() = not now (a mini-game or puzzle is open)  onHold(on) = pause / resume.
  const hooks = { hold: null, wait: null, onHold: null };
  let toastTimer, waitTimer, pending = [], shown = new Set();
  function flash(id, good = true) {
    const c = CARDS[id]; if (!c) return false;
    if (shown.has(id)) return false;                  // each card shows at most once per mission
    shown.add(id);
    const isNew = !log.cards.includes(id);
    if (isNew) { log.cards.push(id); save(); checkFactBadges(); }
    else if (Math.random() < 0.5) return false;       // already in the Logbook: only a reminder now and then
    pending.push({ id, good, isNew }); showNext();
    return isNew;
  }
  function showNext() {
    if (document.getElementById('fact') || !pending.length) return;
    if (hooks.wait && hooks.wait()) { clearTimeout(waitTimer); waitTimer = setTimeout(showNext, 600); return; }
    const hold = !!(hooks.hold && hooks.hold());
    const { id, good, isNew } = pending.shift(), c = CARDS[id];
    const t = el(`<div class="ficon">${c.icon}</div><div class="fbody"><small>${isNew ? '★ NEW FACT CARD' : 'FACT CARD'} · ${log.cards.length}/${Object.keys(CARDS).length}</small>
      <b>${c.title}</b><p>${c.text}</p><em>Source: ${c.src}</em>${hold ? '<i class="fpause">⏸ The base is paused while you read.</i>' : ''}</div>
      <button aria-label="${hold ? 'Got it, keep playing' : 'Close'}">${hold ? 'Got it ▶' : '✕'}</button>`, 'fact ' + (good ? 'good' : 'bad') + (hold ? ' hold' : ''));
    t.id = 'fact';
    let shade = null;
    if (hold) { shade = el('', 'factshade'); shade.id = 'factshade'; document.body.appendChild(shade); shade.appendChild(t); hooks.onHold && hooks.onHold(true); }
    else document.body.appendChild(t);
    const close = () => {
      clearTimeout(toastTimer); t.remove();
      if (shade) { shade.remove(); if (pending.length) return showNext(); hooks.onHold && hooks.onHold(false); return; }
      setTimeout(showNext, 300);
    };
    t.querySelector('button').onclick = close;
    if (hold) t.querySelector('button').focus(); else toastTimer = setTimeout(close, 11000);
    SFX.play(isNew ? 'badge' : 'card');
  }

  function award(id) {
    if (log.badges.includes(id) || !BADGES[id]) return false;
    log.badges.push(id); save(); return true;
  }
  function checkFactBadges() {
    if (log.cards.length >= 10) award('facts10');
    if (log.cards.length >= Object.keys(CARDS).length) award('factsAll');
  }

  // every badge, earned ones lit up (fresh = earned just now)
  const badgeGrid = (fresh = []) => `<div class="badges">${Object.entries(BADGES).map(([k, b]) => `<div class="${log.badges.includes(k) ? 'got' : ''}${fresh.includes(k) ? ' new' : ''}" title="${b[2]}"><span>${b[0]}</span><b>${b[1]}</b><small>${fresh.includes(k) ? 'NEW!' : b[2]}</small></div>`).join('')}</div>`;
  const reset = () => { shown = new Set(); pending = []; };
  function logbook() {
    const total = Object.keys(CARDS).length;
    overlay(`<h2>CADET LOGBOOK</h2>
      <p>Fact cards: <b>${log.cards.length} / ${total}</b> · Missions flown: <b>${log.plays}</b> · Best score: <b>${log.best}</b></p>
      <div class="badges">${Object.entries(BADGES).map(([k, b]) => `<div class="${log.badges.includes(k) ? 'got' : ''}" title="${b[2]}"><span>${b[0]}</span><b>${b[1]}</b><small>${b[2]}</small></div>`).join('')}</div>
      <div class="cards">${Object.entries(CARDS).map(([k, c]) => log.cards.includes(k)
        ? `<details><summary>${c.icon} ${c.title}</summary><p>${c.text}</p><em>Source: ${c.src}${c.link ? ` · <a href="${c.link}" target="_blank" rel="noopener">see the study</a>` : ''}</em></details>`
        : `<div class="locked">🔒 Not found yet</div>`).join('')}</div>`);
  }

  function sources() {
    overlay(`<h2>REAL NASA DATA</h2><p>Storm Watch is built on real space science. Here is what each data set does in the game.</p>
      <ul class="srclist">${SOURCES.map(s => `<li><a href="${s[2]}" target="_blank" rel="noopener">${s[0]}</a><span>${s[1]}</span></li>`).join('')}</ul>
      <p class="src">Storm strength in play, countdown lengths and difficulty are game settings, tuned for ages 7 to 12.</p>`);
  }

  // ---------- debrief quiz: one question per storm ----------
  // lv: 1 = Cadet (ages 7-9), 2 = Pilot (10-12), 3 = Commander (teens and up). type keeps two rounds in a row from feeling the same.
  const BANK = [
    // Cadet
    { id: 'safe', lv: 1, type: 'base', q: 'Where is the safest place during a radiation storm?', a: ['Deep in the Storm Shelter', 'In the Greenhouse', 'Outside on the surface'], why: 'Thick layers of Moon soil and water soak up radiation.' },
    { id: 'o2', lv: 1, type: 'air', q: 'What does the oxygen machine use to make air?', a: ['Water', 'Moon dust', 'Sunlight only'], why: 'It splits water into hydrogen and oxygen using electricity.' },
    { id: 'class', lv: 1, type: 'sun', q: 'Which solar flare is the strongest?', a: ['X class', 'M class', 'C class'], why: 'The letters go A, B, C, M, X. X is the biggest.' },
    { id: 'moon', lv: 1, type: 'space', q: 'Why is a storm more dangerous on the Moon than on Earth?', a: ['The Moon has no air or magnetic shield', 'The Moon is closer to the Sun', 'The Moon is made of metal'], why: 'Earth\'s air and magnetic field block most space radiation.' },
    { id: 'gravity', lv: 1, type: 'body', q: 'On the Moon, how heavy would you feel?', a: ['About one sixth as heavy', 'Twice as heavy', 'Exactly the same'], why: 'The Moon\'s gravity is about one sixth of Earth\'s, so a 30 kg kid feels like 5 kg.' },
    { id: 'sun8', lv: 1, type: 'sun', q: 'How long does light from the Sun take to reach the Moon?', a: ['About 8 minutes', 'About 1 second', 'About 1 year'], why: 'Sunlight travels about 150 million km in a little over 8 minutes.' },
    { id: 'plants', lv: 1, type: 'food', q: 'Why do astronauts grow plants on a Moon base?', a: ['For fresh food', 'To keep pets busy', 'To hide from storms'], why: 'Fresh vegetables add vitamins to space food. NASA astronauts already grow lettuce on the Space Station.' },
    { id: 'delay', lv: 1, type: 'space', q: 'How long does a radio message take to reach the Moon?', a: ['About 1.3 seconds', 'About 1 hour', 'It is instant'], why: 'Radio moves at the speed of light. Mars is much farther: 4 to 24 minutes.' },
    { id: 'bones', lv: 1, type: 'body', q: 'What happens to astronauts\' bones in low gravity?', a: ['They slowly get weaker', 'They grow longer', 'Nothing changes'], why: 'With less gravity to push against, bones can lose 1 to 1.5 percent of their strength a month in space.' },
    { id: 'wall', lv: 1, type: 'base', q: 'Why does the base put water in its walls?', a: ['Water soaks up radiation', 'To keep fish', 'To make the walls heavier for fun'], why: 'Water is full of hydrogen, which is very good at slowing down solar particles.' },
    // Pilot
    { id: 'msv', lv: 2, type: 'body', q: 'Which unit measures how much radiation a body soaks up?', a: ['Millisieverts (mSv)', 'Kilometres (km)', 'Kilowatts (kW)'], why: 'A radiation dose is counted in millisieverts. One chest X-ray is about 0.1 mSv.' },
    { id: 'scale', lv: 2, type: 'sun', q: 'An X flare compared to an M flare is about…', a: ['10 times stronger', '2 times stronger', 'The same'], why: 'Each letter (A, B, C, M, X) is 10 times stronger than the one before.' },
    { id: 'regolith', lv: 2, type: 'base', q: 'What is regolith?', a: ['The dusty, rocky soil on the Moon', 'A kind of rocket fuel', 'A Moon mineral that glows'], why: 'Piled on top of a base, a few metres of regolith make a great radiation shield.' },
    { id: 'cme', lv: 2, type: 'sun', q: 'What is a CME?', a: ['A huge cloud of gas thrown out by the Sun', 'A comet', 'A space station'], why: 'CME means coronal mass ejection. Some fly faster than 2,000 km every second.' },
    { id: 'ice', lv: 2, type: 'water', q: 'Where is water ice found on the Moon?', a: ['In dark craters near the poles', 'In big lakes on the surface', 'Nowhere at all'], why: 'In 2009 NASA\'s LCROSS mission crashed into a dark south-pole crater and found water ice in the plume.' },
    { id: 'split', lv: 2, type: 'air', q: 'Splitting water makes oxygen and…', a: ['Hydrogen', 'Carbon dioxide', 'Salt'], why: 'Water is H₂O: two hydrogen atoms and one oxygen atom.' },
    { id: 'magnet', lv: 2, type: 'space', q: 'What shields Earth from most solar particles?', a: ['Its magnetic field and thick air', 'The Moon', 'Clouds'], why: 'The Moon has neither, so Moon crews need a shelter.' },
    // Commander
    { id: 'career', lv: 3, type: 'body', q: 'NASA\'s career radiation limit for an astronaut is…', a: ['600 mSv', '6 mSv', '60,000 mSv'], why: 'NASA standard 3001 caps an astronaut\'s whole-career dose at 600 mSv. Go past it and you are grounded.' },
    { id: 'o2day', lv: 3, type: 'air', q: 'About how much oxygen does one resting astronaut breathe in a day?', a: ['Under 1 kg', 'About 10 kg', 'About 50 kg'], why: 'NASA\'s life-support baseline (BVAD) uses about 0.84 kg a day, more during hard work.' },
    { id: 'h2o16', lv: 3, type: 'water', q: 'To make 16 g of oxygen by splitting water, how much water do you need?', a: ['18 g', '2 g', '160 g'], why: 'A water molecule weighs 18 units and its oxygen atom 16, so 18 g of water gives 16 g of oxygen.' },
    { id: 'pole', lv: 3, type: 'base', q: 'Why does NASA want to land near the Moon\'s south pole?', a: ['Sunny ridges for power and ice nearby', 'It is warmer there', 'It faces away from the Sun'], why: 'Some ridges get sunlight most of the year, and dark craters next to them hold water ice.' },
    { id: 'goes', lv: 3, type: 'sun', q: 'Which satellites measure solar particles near Earth in this game\'s NASA data?', a: ['GOES weather satellites', 'The Hubble Space Telescope', 'GPS satellites'], why: 'NASA DONKI records particle events seen by the GOES satellites.' },
    { id: 'marsdelay', lv: 3, type: 'space', q: 'Why can\'t a Mars crew simply ask Mission Control in an emergency?', a: ['Each message can take up to 24 minutes', 'Mars has no radios', 'Mission Control sleeps'], why: 'Mars is so far that radio takes 4 to 24 minutes each way, so crews must decide on their own.' },
  ];
  function stormQuestions(ev) {
    return [
      ev.key === 'swarm' && { id: 'swarm', lv: 2, type: 'storm', q: 'In May 2024, how many X-class flares did one sunspot group fire in four days?', a: ['Seven', 'One', 'Fifty'], why: 'NASA DONKI lists seven X flares from region 13664 between May 8 and May 11, 2024. Big sunspots can fire again and again.' },
      ev.mins != null && { id: 'warn' + ev.key, lv: 2, type: 'storm', q: 'In real life, how long after this flare did the radiation arrive?', a: [`About ${ev.mins >= 120 ? Math.round(ev.mins / 60) + ' hours' : ev.mins + ' minutes'}`, 'About 3 days', 'A whole month'], why: 'The fastest particles race from the Sun in minutes to hours. That is all the warning a crew gets.' },
      ev.mins != null && { id: 'warnc' + ev.key, lv: 1, type: 'storm', q: 'After a big flare, how fast can the radiation reach the Moon?', a: ['In minutes to hours', 'Only after a year', 'Never'], why: `For this storm it took about ${ev.mins >= 120 ? Math.round(ev.mins / 60) + ' hours' : ev.mins + ' minutes'}.` },
      ev.key === '2017' && { id: 'aurora', lv: 1, type: 'storm', q: 'What did this storm do at Mars?', a: ['Lit up an aurora 25 times brighter than ever seen there', 'Made it rain', 'Melted the ice caps'], why: 'NASA\'s MAVEN spacecraft watched the whole planet glow, and Curiosity measured more than double its highest radiation reading on the ground.' },
      ev.key === '2024' && { id: 'gannon', lv: 1, type: 'storm', q: 'What did people on Earth see during this storm?', a: ['Auroras much farther south than usual', 'Two suns', 'A solar eclipse'], why: 'The May 2024 storm was the strongest at Earth in over 20 years.' },
    ].filter(Boolean);
  }
  const fits = (q, lv) => lv === 1 ? q.lv === 1 : lv === 2 ? q.lv <= 2 : q.lv >= 2;
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);
  function questionFor(ev, asked, lv = 1) {
    const lastType = asked.lastType, seen = log.seenQ || [];
    // storm questions get a new id for every storm, so also compare the wording: never the same question twice in a mission
    const used = q => asked.includes(q.id) || (asked.texts || []).includes(q.q);
    const ok = q => fits(q, lv) && !used(q) && q.type !== lastType;
    // about half the time ask about the storm you just survived, otherwise mix topics; prefer questions not seen in recent games
    const storm = stormQuestions(ev).filter(ok), rest = BANK.filter(ok);
    const pick = list => shuffle(list).sort((a, b) => seen.includes(a.id) - seen.includes(b.id))[0];
    return (storm.length && Math.random() < 0.5 && pick(storm)) || pick(rest) || pick(storm)
      || pick(BANK.filter(q => fits(q, lv) && !used(q))) || pick(BANK.filter(q => fits(q, lv)));
  }
  // Renders a question into `host`; calls done(correct) once answered.
  function quiz(host, ev, asked, done, lv) {
    const q = questionFor(ev, asked, lv), order = q.a.map((_, i) => i).sort(() => Math.random() - 0.5);
    asked.push(q.id); (asked.texts = asked.texts || []).push(q.q); asked.lastType = q.type;
    log.seenQ = [q.id, ...(log.seenQ || []).filter(id => id !== q.id)].slice(0, 16); save();
    host.innerHTML = `<h3>🧠 CADET QUESTION <small>+25 ★ if you get it right</small></h3><p class="qq">${q.q}</p>
      <div class="qa">${order.map(i => `<button data-i="${i}">${q.a[i]}</button>`).join('')}</div><p class="why" hidden></p>`;
    host.querySelectorAll('.qa button').forEach(b => b.onclick = () => {
      const ok = b.dataset.i === '0';
      host.querySelectorAll('.qa button').forEach(x => { x.disabled = true; x.classList.add(x.dataset.i === '0' ? 'right' : x === b ? 'wrong' : 'dim'); });
      const w = host.querySelector('.why'); w.hidden = false; w.textContent = (ok ? '✔ Correct! ' : '✘ Not quite. ') + q.why;
      SFX.play(ok ? 'correct' : 'wrong'); done(ok);
    });
  }

  return { GLOSSARY, CARDS, BADGES, hooks, badgeGrid, reset, chip, chips, explain, flash, award, logbook, sources, quiz, overlay, closeOverlay,
    get log() { return log; }, save };
})();
