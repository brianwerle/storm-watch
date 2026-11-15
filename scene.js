// STORM WATCH: everything drawn on the canvas (sky, Moon base, crew, storms, cutscenes).
// World units are 1200 x 640; the canvas is 2x that for sharp drawing.
const W = 1200, H = 640, SURF = 250, SHAFT = 600;
const cv = document.querySelector('#scene'), g = cv.getContext('2d');
// Lunar south pole: the Sun skims the horizon and Earth hangs low in the sky.
const EARTH = [1140, 176], SUN = [96, 226], DISH = [690, SURF - 34], REBOOT_AT = [910, 176];

function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function circ(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); }
function txt(s, x, y, size = 13, color = '#cfe6ff', align = 'left', font = '"Exo 2", "Segoe UI", sans-serif') {
  g.font = `bold ${size}px ${font}`; g.fillStyle = color; g.textAlign = align; g.fillText(s, x, y);
}
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------- painted once: starfield + mountains, and the underground ----------
function layer(w, h, paint) { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const x = c.getContext('2d'); x.scale(2, 2); paint(x); return c; }
const SKY = layer(W, SURF, x => {
  const sky = x.createLinearGradient(0, 0, 0, SURF); sky.addColorStop(0, '#01030a'); sky.addColorStop(0.6, '#050c1c'); sky.addColorStop(1, '#0b1730');
  x.fillStyle = sky; x.fillRect(0, 0, W, SURF);
  // soft nebula clouds and a Milky Way band
  [[820, 60, 260, '80,60,160'], [420, 30, 220, '30,90,140'], [980, 150, 200, '120,50,110'], [250, 140, 180, '40,70,150']].forEach(([cx, cy, r, col]) => {
    const n = x.createRadialGradient(cx, cy, 0, cx, cy, r); n.addColorStop(0, `rgba(${col},.22)`); n.addColorStop(1, `rgba(${col},0)`); x.fillStyle = n; x.fillRect(0, 0, W, SURF);
  });
  for (let i = 0; i < 520; i++) {
    const band = Math.random() < 0.45, sx = Math.random() * W, sy = band ? 40 + sx * 0.12 + rnd(-45, 45) : Math.random() * SURF;
    x.fillStyle = `rgba(${200 + rnd(0, 55) | 0},${210 + rnd(0, 45) | 0},255,${rnd(0.25, 0.95)})`; const s = Math.random() < 0.06 ? 1.8 : rnd(0.4, 1.1); x.fillRect(sx, sy, s, s);
  }
});
// distant ridges, painted on their own layer so the low Sun and Earth can sit behind them
const RIDGE = layer(W, SURF, x => {
  [[0.55, '#1a2233', '#2b3650', 34], [1, '#232c3d', '#46536e', 22]].forEach(([k, dark, lit, amp], row) => {
    let px = -20, py = SURF - 14 - row * 4; const pts = [[px, py]];
    while (px < W + 20) { px += rnd(26, 70); py = SURF - rnd(6, amp + 14) * (row ? 0.75 : 1); pts.push([px, py]); }
    const mg = x.createLinearGradient(0, SURF - 50, 0, SURF); mg.addColorStop(0, lit); mg.addColorStop(1, dark);
    x.fillStyle = mg; x.beginPath(); x.moveTo(-20, SURF); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(W + 20, SURF); x.fill();
    // sunlit rim on the Sun-facing peaks
    x.strokeStyle = `rgba(255,214,150,${row ? 0.35 : 0.2})`; x.lineWidth = 1.2; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
  });
});
const GROUND = layer(W, H - SURF, x => {
  const hh = H - SURF, gr = x.createLinearGradient(0, 0, 0, hh);
  gr.addColorStop(0, '#6a6f7a'); gr.addColorStop(0.06, '#474b55'); gr.addColorStop(0.5, '#2b2e36'); gr.addColorStop(1, '#17191e');
  x.fillStyle = gr; x.fillRect(0, 0, W, hh);
  for (let i = 0; i < 9; i++) {   // wavy rock layers
    x.strokeStyle = `rgba(0,0,0,${rnd(0.10, 0.22)})`; x.lineWidth = rnd(1, 3); x.beginPath(); const y0 = 30 + i * 42;
    for (let px = 0; px <= W; px += 40) x.lineTo(px, y0 + Math.sin(px / 90 + i * 2) * 8 + rnd(-2, 2)); x.stroke();
  }
  for (let i = 0; i < 150; i++) { const r = rnd(1.5, 7); x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${rnd(0.04, 0.2)})`; x.beginPath(); x.arc(rnd(0, W), rnd(14, hh), r, 0, 7); x.fill(); }
  for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(160,220,255,.5)'; x.fillRect(rnd(0, W), rnd(60, hh), 1.2, 1.2); }   // specks of buried ice
  // water-ice pockets (the south pole's shadowed craters hold real ice, found by NASA's LCROSS)
  const ice = (cx, cy, rw, rh) => {
    const ig = x.createRadialGradient(cx, cy, 2, cx, cy, rw); ig.addColorStop(0, 'rgba(200,240,255,.55)'); ig.addColorStop(1, 'rgba(120,190,240,0)');
    x.fillStyle = ig; x.beginPath(); x.ellipse(cx, cy, rw, rh, 0, 0, 7); x.fill();
    for (let i = 0; i < 9; i++) {      // little crystals
      const px = cx + rnd(-rw * 0.6, rw * 0.6), py = cy + rnd(-rh * 0.5, rh * 0.5), r = rnd(3, 7);
      x.fillStyle = `rgba(${190 + rnd(0, 50) | 0},235,255,${rnd(0.45, 0.85)})`; x.beginPath(); x.moveTo(px, py - r); x.lineTo(px + r * 0.6, py); x.lineTo(px, py + r * 0.8); x.lineTo(px - r * 0.6, py); x.fill();
    }
  };
  ice(110, 250, 70, 26); ice(1080, 300, 80, 28); ice(330, 340, 50, 18); ice(880, 345, 46, 16);
  x.font = 'bold 10px "Exo 2", "Segoe UI", sans-serif'; x.fillStyle = 'rgba(190,235,255,.75)'; x.textAlign = 'center';
  x.fillText('WATER ICE', 110, 286); x.fillText('WATER ICE', 1080, 338);
  // ice-mining pipe: from the ice pocket up to the workshop's water tank
  const pipe = pts => { [['#2a2f38', 9], ['#7b8594', 5], ['rgba(255,255,255,.25)', 1.5]].forEach(([col, lw]) => { x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }); pts.slice(1, -1).forEach(p => { x.fillStyle = '#9aa4b0'; x.fillRect(p[0] - 6, p[1] - 6, 12, 12); }); };
  pipe([[1080, 288], [1080, 214], [885, 214], [885, 182]]);
  x.fillStyle = '#5c6675'; x.fillRect(1068, 278, 24, 18); x.fillStyle = '#37d6ff'; x.fillRect(1073, 283, 14, 4);   // pump
  pipe([[110, 238], [110, 120], [228, 120]]);                                                                        // to the greenhouse
  x.fillStyle = '#5c6675'; x.fillRect(98, 228, 24, 18); x.fillStyle = '#4be38a'; x.fillRect(103, 233, 14, 4);
  // regolith blanket: the top layer of soil is the base's radiation shield
  x.fillStyle = 'rgba(200,190,170,.55)'; x.textAlign = 'left'; x.fillText('▲ REGOLITH: MOON SOIL SHIELD', 14, 32);
  x.fillStyle = '#9aa0ab'; x.fillRect(0, 0, W, 3);
  [[60, 30], [470, 22], [1150, 36], [300, 14]].forEach(([cx, w]) => {      // craters with bright rims
    x.fillStyle = '#3b3f48'; x.beginPath(); x.ellipse(cx, 4, w, 6, 0, 0, 7); x.fill();
    x.strokeStyle = '#b4bac6'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(cx, 3, w, 6, 0, Math.PI, 0); x.stroke();
  });
});
const twinkle = Array.from({ length: 34 }, () => [rnd(120, W), rnd(0, 190), rnd(0, 7), rnd(0.8, 1.9)]);
const rain = Array.from({ length: 130 }, () => ({ p: Math.random(), o: rnd(-250, 1250), depth: Math.random() }));
let shooting = null;

function drawSky(ts) {
  g.drawImage(SKY, 0, 0, W, SURF);
  twinkle.forEach(([x, y, ph, r]) => { g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(ts / 900 + ph)); g.fillStyle = '#fff'; circ(x, y, r * 0.7); g.fill(); });
  g.globalAlpha = 1;
  if (!shooting && Math.random() < 0.002) shooting = { x: rnd(300, 900), y: rnd(10, 90), t: 0 };
  if (shooting) {
    shooting.t += 0.03; const sx = shooting.x + shooting.t * 260, sy = shooting.y + shooting.t * 90;
    const sg = g.createLinearGradient(sx - 60, sy - 20, sx, sy); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, `rgba(255,255,255,${1 - shooting.t})`);
    g.strokeStyle = sg; g.lineWidth = 2; g.beginPath(); g.moveTo(sx - 60, sy - 20); g.lineTo(sx, sy); g.stroke(); if (shooting.t >= 1) shooting = null;
  }
  // Earth: glow, oceans, land, drifting clouds, night side
  const [ex, ey] = EARTH, er = 26;
  const halo = g.createRadialGradient(ex, ey, er * 0.8, ex, ey, er * 2); halo.addColorStop(0, 'rgba(90,170,255,.45)'); halo.addColorStop(1, 'rgba(90,170,255,0)');
  g.fillStyle = halo; circ(ex, ey, er * 2); g.fill();
  g.save(); circ(ex, ey, er); g.clip();
  const oc = g.createRadialGradient(ex - 8, ey - 8, 2, ex, ey, er); oc.addColorStop(0, '#5aa9ff'); oc.addColorStop(1, '#14408f'); g.fillStyle = oc; g.fillRect(ex - er, ey - er, er * 2, er * 2);
  const drift = (ts / 400) % (er * 4);
  g.fillStyle = '#3fae6a'; [[-10, -6, 10, 7], [8, 9, 8, 5], [-2, 12, 5, 4], [14, -10, 6, 4]].forEach(([a, b, w, h]) => { for (const off of [0, er * 4]) { g.beginPath(); g.ellipse(ex + a + drift - off + er, ey + b, w, h, 0.4, 0, 7); g.fill(); } });
  g.fillStyle = 'rgba(255,255,255,.75)'; [[-14, -12, 9, 2.5], [4, -2, 12, 2.5], [-8, 6, 10, 2]].forEach(([a, b, w, h]) => { for (const off of [0, er * 3]) { g.beginPath(); g.ellipse(ex + a + (ts / 250) % (er * 3) - off + er, ey + b, w, h, 0, 0, 7); g.fill(); } });
  g.fillStyle = 'rgba(1,3,10,.6)'; circ(ex + 16, ey + 2, er + 4); g.fill();
  g.restore();
  // Sun: spinning rays and a pulsing corona; angrier when a storm is on the way
  const hot = S.phase === 'warning' || S.phase === 'storm', [sx, sy] = SUN;
  const R = 120 + (hot ? 50 : 0) + Math.sin(ts / 280) * 8;
  const sg = g.createRadialGradient(sx, sy, 8, sx, sy, R); sg.addColorStop(0, '#fffbe0'); sg.addColorStop(0.28, hot ? '#ff7a1f' : '#ffc23d'); sg.addColorStop(1, 'rgba(255,120,30,0)');
  g.fillStyle = sg; g.fillRect(0, 0, 320, SURF);
  g.save(); g.translate(sx, sy); g.rotate(ts / 9000);
  for (let i = 0; i < 14; i++) { g.rotate(Math.PI / 7); const len = 70 + Math.sin(ts / 400 + i * 1.7) * 18 + (hot ? 40 : 0); g.fillStyle = `rgba(255,${hot ? 150 : 215},90,.16)`; g.beginPath(); g.moveTo(22, -5); g.lineTo(len, 0); g.lineTo(22, 5); g.fill(); }
  g.restore();
  if (hot) { g.strokeStyle = 'rgba(255,220,150,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(sx + 20, sy - 30, 16 + Math.sin(ts / 200) * 3, -2.4, 0.9); g.stroke(); }
  g.drawImage(RIDGE, 0, 0, W, SURF);
  // the storm front racing toward the base
  if (S.phase === 'warning') {
    const p = 1 - S.t / S.dur;
    for (let i = 0; i < 5; i++) {
      const rad = Math.max(1, 40 + p * 640 - i * 20);
      g.strokeStyle = `rgba(255,${110 + i * 22},60,${0.85 - i * 0.16})`; g.lineWidth = 6 - i; g.shadowColor = '#ff7a2a'; g.shadowBlur = 16;
      g.beginPath(); g.arc(sx, sy, rad, -0.75, 0.12); g.stroke();
    }
    g.shadowBlur = 0;
    for (let i = 0; i < 26; i++) { const a = -0.75 + (i / 26) * 0.87 + Math.sin(ts / 300 + i) * 0.02, rad = 46 + p * 640 + Math.sin(ts / 120 + i * 3) * 8; g.fillStyle = 'rgba(255,230,170,.9)'; circ(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad, 1.6); g.fill(); }
  }
  // radio beam to Earth and back (Call Mission Control)
  if (S.call) {
    const e = (performance.now() - S.call.t0) / 1000, k = Math.min(2, e / 1.3), out = Math.min(1, k), back = Math.max(0, k - 1);
    g.strokeStyle = 'rgba(120,255,200,.35)'; g.setLineDash([6, 8]); g.lineDashOffset = -ts / 30; g.lineWidth = 2;
    g.beginPath(); g.moveTo(DISH[0], DISH[1] - 16); g.lineTo(EARTH[0], EARTH[1]); g.stroke(); g.setLineDash([]);
    const q = back > 0 ? 1 - back : out, bx = lerp(DISH[0], EARTH[0], q), by = lerp(DISH[1] - 16, EARTH[1], q);
    g.fillStyle = back > 0 ? '#ffd84a' : '#7dffc8'; g.shadowColor = g.fillStyle; g.shadowBlur = 14; circ(bx, by, 5); g.fill(); g.shadowBlur = 0;
    txt(back > 0 ? 'answer coming back…' : 'signal travelling to Earth…', (DISH[0] + EARTH[0]) / 2, 74, 12, '#9dffd8', 'center');
    txt(`${Math.min(2.6, e).toFixed(1)} s`, (DISH[0] + EARTH[0]) / 2, 90, 13, '#fff', 'center');
  }
}

function drawSurface(ts) {
  g.drawImage(GROUND, 0, SURF, W, H - SURF);
  // rover
  g.fillStyle = '#d6dde6'; rr(58, 220, 54, 18, 5); g.fill();
  g.fillStyle = '#37d6ff'; rr(66, 208, 22, 13, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(69, 210, 6, 4);
  g.strokeStyle = '#9aa4b0'; g.lineWidth = 2; g.beginPath(); g.moveTo(102, 220); g.lineTo(108, 198); g.stroke(); g.fillStyle = Math.sin(ts / 300) > 0 ? '#ff4d5e' : '#5a1f28'; circ(108, 197, 2.5); g.fill();
  [70, 86, 102].forEach(wx => { g.fillStyle = '#23272e'; circ(wx, 243, 8); g.fill(); g.strokeStyle = '#6b7380'; g.lineWidth = 2; circ(wx, 243, 4); g.stroke(); });
  // flag and sample rocks that sparkle (science!)
  g.strokeStyle = '#c9d2dc'; g.lineWidth = 2; g.beginPath(); g.moveTo(498, SURF); g.lineTo(498, SURF - 44); g.stroke();
  g.fillStyle = '#37d6ff'; g.beginPath(); g.moveTo(498, SURF - 44); g.lineTo(524, SURF - 38); g.lineTo(498, SURF - 30); g.fill(); txt('★', 506, SURF - 34, 9, '#06101c', 'center');
  [[180, 6], [262, 9], [345, 6], [430, 8]].forEach(([x, r], i) => {
    g.fillStyle = '#7d828d'; g.beginPath(); g.moveTo(x - r, SURF + 1); g.lineTo(x - r * 0.5, SURF - r); g.lineTo(x + r * 0.6, SURF - r * 1.2); g.lineTo(x + r, SURF + 1); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(x - r * 0.5, SURF - r); g.lineTo(x + r * 0.6, SURF - r * 1.2); g.lineTo(x, SURF - r * 0.4); g.fill();
    const tw = Math.sin(ts / 260 + i * 2); if (tw > 0.7) txt('✦', x + r * 0.5, SURF - r * 1.3, 9 + tw * 3, '#ffe9a8', 'center');
  });
  // airlock dome with a glass window and beacon
  const dg = g.createLinearGradient(SHAFT - 36, 0, SHAFT + 36, 0); dg.addColorStop(0, '#dfe6ee'); dg.addColorStop(1, '#8b95a3');
  g.fillStyle = dg; g.beginPath(); g.arc(SHAFT, SURF, 36, Math.PI, 0); g.fill();
  g.fillStyle = '#0d1726'; rr(SHAFT - 12, SURF - 27, 24, 27, 5); g.fill(); g.fillStyle = 'rgba(55,214,255,.35)'; rr(SHAFT - 8, SURF - 23, 16, 10, 3); g.fill();
  const alert = S.phase === 'warning' || S.phase === 'storm';
  g.fillStyle = alert ? (Math.sin(ts / 110) > 0 ? '#ff4d5e' : '#5a1f28') : '#4be38a'; g.shadowColor = g.fillStyle; g.shadowBlur = 12; circ(SHAFT, SURF - 40, 4); g.fill(); g.shadowBlur = 0;
  // radio dish, always aimed at Earth
  const [dx, dy] = DISH, ang = Math.atan2(EARTH[1] - dy, EARTH[0] - dx);
  g.strokeStyle = '#9aa4b0'; g.lineWidth = 4; g.beginPath(); g.moveTo(dx, SURF); g.lineTo(dx, dy); g.stroke();
  g.save(); g.translate(dx, dy - 4); g.rotate(ang); g.fillStyle = '#e4eaf1'; g.beginPath(); g.ellipse(0, 0, 6, 18, 0, 0, 7); g.fill(); g.strokeStyle = '#7d8795'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(16, 0); g.stroke(); g.fillStyle = S.call ? '#7dffc8' : '#37d6ff'; circ(17, 0, 3); g.fill(); g.restore();
  // solar panels: follow the Sun, fold flat for a storm (or until they are rebooted)
  const want = S.phase === 'storm' || S.panelsDown ? 1 : 0; S.foldA = (S.foldA || 0) + (want - (S.foldA || 0)) * 0.08; const f = S.foldA;
  [760, 860, 960, 1060].forEach((x, i) => {
    const top = SURF - lerp(46, 11, f);
    g.strokeStyle = '#9aa4b0'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, SURF); g.lineTo(x, top); g.stroke();
    g.save(); g.translate(x, top); g.rotate(lerp(-1.2, 0, f));   // near-vertical to face the low polar Sun
    const pg = g.createLinearGradient(-40, 0, 40, 0); pg.addColorStop(0, f > 0.5 ? '#22324a' : '#3d86f0'); pg.addColorStop(1, f > 0.5 ? '#1b2a40' : '#1f4fa8');
    g.fillStyle = pg; rr(-40, -5, 80, 10, 2); g.fill();
    g.strokeStyle = 'rgba(190,220,255,.7)'; g.lineWidth = 1; for (let k = -40; k <= 40; k += 16) { g.beginPath(); g.moveTo(k, -5); g.lineTo(k, 5); g.stroke(); }
    if (f < 0.3) { const gl = ((ts / 14 + i * 40) % 220) - 60; g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(Math.max(-40, Math.min(34, gl)), -5, 6, 10); }
    g.restore();
  });
  txt(S.panelsDown ? 'SOLAR PANELS OFFLINE' : f > 0.5 ? 'SOLAR PANELS FOLDED' : 'SOLAR PANELS', 910, f > 0.5 ? SURF - 66 : SURF - 98, 11, f > 0.5 ? '#ff9aa4' : '#7f9cc0', 'center');
  if (S.panelsDown && playing()) bubble(REBOOT_AT[0], REBOOT_AT[1], '⚡', 'REBOOT', '#ffb938', ts);
}

function bubble(x, y, icon, label, col, ts) {
  const r = 20 + Math.sin(ts / 120) * 3;
  g.shadowColor = col; g.shadowBlur = 18; circ(x, y, r); g.fillStyle = col; g.fill(); g.shadowBlur = 0; g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke();
  txt(icon, x, y + 7, 19, '#fff', 'center', 'sans-serif'); txt(label, x, y + r + 16, 12, '#fff', 'center');
}

function drawShaft() {
  g.fillStyle = '#131c2a'; g.fillRect(SHAFT - 18, SURF, 36, 222);
  g.strokeStyle = '#5b6a85'; g.lineWidth = 3; g.strokeRect(SHAFT - 18, SURF, 36, 222);
  g.strokeStyle = '#a5b6cd'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(SHAFT - 8, SURF); g.lineTo(SHAFT - 8, 590); g.moveTo(SHAFT + 8, SURF); g.lineTo(SHAFT + 8, 590); g.stroke();
  for (let y = SURF + 10; y < 590; y += 14) { g.beginPath(); g.moveTo(SHAFT - 8, y); g.lineTo(SHAFT + 8, y); g.stroke(); }
  g.fillStyle = '#131c2a'; g.fillRect(SHAFT - 24, 380, 48, 42);
}

function drawRoom(k, ts) {
  const z = ZONES[k], storm = S.phase === 'storm', sh = lvl('shield');
  const hover = (S.drag && S.ptr && zoneAt(S.ptr[0], S.ptr[1]) === k) || (S.hint && S.hint.zone === k);
  // water-wall shield: a glowing, flowing blue wall around every room
  if (sh) { g.shadowColor = '#37d6ff'; g.shadowBlur = 10 + sh * 9; }
  rr(z.x, z.y, z.w, z.h, 16);
  const wall = g.createLinearGradient(0, z.y, 0, z.y + z.h); wall.addColorStop(0, k === 'shelter' ? '#173247' : '#1b2738'); wall.addColorStop(1, k === 'shelter' ? '#0e2030' : '#111926');
  g.fillStyle = wall; g.fill(); g.shadowBlur = 0;
  g.lineWidth = k === 'shelter' ? 10 : 5; g.strokeStyle = hover ? '#ffffff' : k === 'shelter' ? '#3f8f66' : '#5b6a85'; g.stroke();
  if (sh) { g.setLineDash([14, 10]); g.lineDashOffset = -ts / 25; g.lineWidth = 2 + sh; g.strokeStyle = `rgba(90,220,255,${0.45 + sh * 0.15})`; rr(z.x - 2, z.y - 2, z.w + 4, z.h + 4, 17); g.stroke(); g.setLineDash([]); }
  // ceiling lamp: warm when calm, sweeping red in a storm
  g.save(); rr(z.x, z.y, z.w, z.h, 16); g.clip();
  const lx = z.x + z.w / 2 + (storm ? Math.sin(ts / 260 + z.x) * z.w * 0.3 : 0);
  const lamp = g.createRadialGradient(lx, z.y, 4, lx, z.y, z.w * 0.6);
  lamp.addColorStop(0, storm ? `rgba(255,60,70,${0.3 + 0.15 * Math.sin(ts / 130)})` : S.phase === 'warning' ? 'rgba(255,190,80,.22)' : 'rgba(180,220,255,.16)'); lamp.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lamp; g.fillRect(z.x, z.y, z.w, z.h);
  if (k === 'shelter') {      // water-wall blocks, bunk beds, a supply shelf and a safe-zone glow
    const danger = S.phase === 'warning' || S.phase === 'storm', pulse = danger ? 0.5 + 0.5 * Math.sin(ts / 260) : 0;
    const fg = g.createRadialGradient(z.x + z.w / 2, z.floor, 10, z.x + z.w / 2, z.floor, z.w * 0.55);
    fg.addColorStop(0, `rgba(75,227,138,${0.16 + pulse * 0.18})`); fg.addColorStop(1, 'rgba(75,227,138,0)'); g.fillStyle = fg; g.fillRect(z.x, z.y, z.w, z.h);
    for (let i = 0; i < 4; i++) [z.x + 10, z.x + z.w - 32].forEach(bx => {
      g.fillStyle = 'rgba(60,150,255,.35)'; rr(bx, z.y + 30 + i * 24, 22, 20, 4); g.fill();
      g.fillStyle = 'rgba(160,220,255,.5)'; g.fillRect(bx + 3, z.y + 33 + i * 24, 16, 2);
    });
    // two bunk beds against the back wall
    [z.x + 52, z.x + 150].forEach(bx => {
      g.fillStyle = '#2c4660'; g.fillRect(bx, z.floor - 70, 4, 70); g.fillRect(bx + 80, z.floor - 70, 4, 70);
      [z.floor - 24, z.floor - 58].forEach(by => {
        g.fillStyle = '#2c4660'; rr(bx, by, 84, 6, 2); g.fill();
        g.fillStyle = '#3d6a8f'; rr(bx + 4, by - 7, 76, 8, 3); g.fill();
        g.fillStyle = '#d9e6f2'; rr(bx + 6, by - 9, 16, 7, 3); g.fill();
      });
    });
    g.fillStyle = '#24405a'; rr(z.x + 250, z.floor - 34, 60, 8, 3); g.fill(); rr(z.x + 250, z.floor - 60, 60, 8, 3); g.fill();
    [['#4be38a', 254, 66, 16], ['#ffb938', 274, 66, 12], ['#37d6ff', 254, 40, 12], ['#ff8a5c', 270, 40, 16], ['#d9e6f2', 290, 40, 12]].forEach(([c, dx, dy, w]) => { g.fillStyle = c; rr(z.x + dx, z.floor - dy, w, 6, 2); g.fill(); });
    txt('SAFE ZONE', z.x + z.w / 2, z.y + 44, 10, `rgba(75,227,138,${0.55 + pulse * 0.45})`, 'center');
  }
  if (k === 'work') {         // workbench, tool wall and a little status screen
    g.fillStyle = '#2a3950'; rr(z.x + 286, z.floor - 30, 52, 6, 2); g.fill(); g.fillRect(z.x + 290, z.floor - 24, 4, 24); g.fillRect(z.x + 330, z.floor - 24, 4, 24);
    g.fillStyle = '#0a1220'; rr(z.x + 292, z.y + 44, 40, 26, 4); g.fill(); g.strokeStyle = storm ? '#ff4d5e' : '#4be38a'; g.lineWidth = 1.5; g.beginPath();
    for (let i = 0; i <= 36; i += 3) g.lineTo(z.x + 294 + i, z.y + 57 + Math.sin(ts / 150 + i) * (storm ? 9 : 4)); g.stroke();
  }
  g.restore();
  g.fillStyle = '#33415a'; g.fillRect(z.x + 6, z.floor, z.w - 12, 6); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(z.x + 6, z.floor, z.w - 12, 1.5);
  txt(z.name, z.x + 16, z.y + 24, 13, '#e3f1ff');
  txt(z.tag, z.x + z.w - 16, z.y + 24, 11, k === 'shelter' ? '#4be38a' : '#7f9cc0', 'right');
}

function drawMachines(ts) {
  const blink = Math.sin(ts / 90) > 0;
  // greenhouse: grow lights and plants (taller with more food, browner when the garden is hurt)
  const gz = ZONES.green, lit = lvl('farm');
  g.fillStyle = lit ? `rgba(215,120,255,${0.35 + lit * 0.2})` : '#222a38'; rr(gz.x + 40, gz.y + 34, gz.w - 80, 6, 3); g.fill();
  if (lit) { const lg = g.createLinearGradient(0, gz.y + 40, 0, gz.floor); lg.addColorStop(0, `rgba(215,120,255,${0.09 * lit})`); lg.addColorStop(1, 'rgba(215,120,255,0)'); g.fillStyle = lg; g.fillRect(gz.x + 40, gz.y + 40, gz.w - 80, 90); }
  for (let i = 0; i < 7; i++) {
    const px = gz.x + 45 + i * 44, hgt = (10 + pct('food') * 0.4) * (0.8 + (i % 3) * 0.12), sway = Math.sin(ts / 700 + i) * 2.5;
    g.fillStyle = '#6b523c'; rr(px - 13, gz.floor - 9, 26, 9, 3); g.fill();
    const col = S.garden < 40 ? '#8a6a3a' : S.garden < 70 || pct('food') < 25 ? '#a59a3d' : '#4be38a';
    g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(px, gz.floor - 9); g.quadraticCurveTo(px + sway, gz.floor - 9 - hgt / 2, px + sway, gz.floor - 9 - hgt); g.stroke();
    g.fillStyle = col; g.beginPath(); g.ellipse(px - 7 + sway * 0.5, gz.floor - 9 - hgt * 0.55, 8, 3.5, -0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(px + 7 + sway, gz.floor - 9 - hgt * 0.85, 8, 3.5, 0.5, 0, 7); g.fill();
    if (i % 3 === 1 && S.garden > 60 && hgt > 22) { g.fillStyle = '#ff5d55'; circ(px + sway + 4, gz.floor - 9 - hgt * 0.4, 3.2); g.fill(); }
  }
  txt(`GARDEN ${Math.round(S.garden)}%`, gz.x + 16, gz.y + 42, 11, S.garden < 40 ? '#ff9aa4' : S.garden < 70 ? '#ffb938' : '#4be38a');
  if (canProtect()) bubble(PROTECT_AT[0], PROTECT_AT[1], '🌱', 'PROTECT', '#1f9d5a', ts);
  // workshop: the oxygen and water tanks are also the supply gauges
  [['o2', 715, '#9fe8ff', 'O₂'], ['h2o', 885, '#3d8bff', 'H₂O']].forEach(([k, x, col, label]) => {
    const y0 = 335, hh = 80, v = pct(k) / 100, dead = S.sys[k].broken;
    g.fillStyle = '#0a1220'; rr(x - 24, y0, 48, hh, 12); g.fill();
    g.save(); rr(x - 24, y0, 48, hh, 12); g.clip();
    const top = y0 + hh * (1 - v); g.fillStyle = v < 0.25 ? '#ff4d5e' : col; g.globalAlpha = dead ? 0.35 : 0.85;
    g.beginPath(); g.moveTo(x - 24, y0 + hh); g.lineTo(x - 24, top); for (let i = -24; i <= 24; i += 6) g.lineTo(x + i, top + Math.sin(ts / 260 + i) * 1.8); g.lineTo(x + 24, y0 + hh); g.fill();
    g.globalAlpha = 0.5; g.fillStyle = '#fff'; if (!dead) for (let b = 0; b < 3; b++) { const by = y0 + hh - ((ts / 25 + b * 31) % (hh * v + 1)); circ(x - 10 + b * 10, by, 1.6); g.fill(); }
    g.restore(); g.globalAlpha = 1;
    g.lineWidth = 3; g.strokeStyle = dead ? (blink ? '#ff4d5e' : '#5a1f28') : '#a5b6cd'; rr(x - 24, y0, 48, hh, 12); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.18)'; rr(x - 18, y0 + 6, 6, hh - 12, 3); g.fill();
    txt(label, x + 2, y0 + hh / 2 + 5, 14, '#06101c', 'center');
  });
  const sh = lvl('shield');
  g.fillStyle = sh ? '#37d6ff' : '#3a4558'; rr(SHAFT - 44, 458, 26, 14, 4); g.fill(); rr(SHAFT + 18, 458, 26, 14, 4); g.fill();
  // broken machines: sparks, smoke and a FIX bubble
  for (const k in SYSTEMS) if (S.sys[k].broken) {
    const [x, y] = SYSTEMS[k].at;
    g.strokeStyle = '#ffe36b'; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) { const a = Math.random() * 7, r = 20 + Math.random() * 22; g.beginPath(); g.moveTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
    if (Math.random() < 0.2) S.parts.push({ x, y: y - 10, vx: rnd(-8, 8), vy: -30, t: 1.2, life: 1.2, color: '120,130,150', size: 5 });
    bubble(x, y, '🔧', 'FIX', '#ff4d5e', ts);
  }
}

// The astronaut itself (suit, role sash, emblem, face behind the visor) is the team's original drawing code.
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
  // role sash across the chest + emblem badge
  g.save(); rr(x - 10, y - 40, 20, 26, 6); g.clip();
  const sx = c.dir > 0 ? 1 : -1;
  if (c.edge) { g.strokeStyle = c.edge; g.lineWidth = 7; g.beginPath(); g.moveTo(x - 11 * sx, y - 41); g.lineTo(x + 11 * sx, y - 17); g.stroke(); }
  g.strokeStyle = c.sash || c.color; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 11 * sx, y - 41); g.lineTo(x + 11 * sx, y - 17); g.stroke();
  g.restore();
  drawEmblem(c, x + 4.5 * sx, y - 34);
  g.strokeStyle = '#eef3f8'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(x - 9, y - 34); g.lineTo(x - 14 + sw * 0.6, y - 20); g.moveTo(x + 9, y - 34);
  if (c.wave) { const wx = x + 17 + Math.sin(ts / 140 + c.i) * 5, wy = y - 54; g.lineTo(wx, wy); g.stroke(); g.fillStyle = '#c9d2dc'; circ(wx, wy, 3.2); g.fill(); g.beginPath(); }   // waving hello
  else g.lineTo(x + 14 - sw * 0.6, y - 20);
  g.stroke();
  if (S.meet && S.meet.c === c && alpha === 1) {
    // crew introduction: helmet off, showing the photo or drawn portrait
    const h = headFor(c);
    g.save(); circ(x, y - 51, 13); g.fillStyle = '#0a1424'; g.fill(); g.clip();
    if (h.img.complete && h.img.naturalWidth) {
      g.imageSmoothingEnabled = !h.photo || !!h.art;
      const w = h.img.naturalWidth;
      if (h.photo && h.art) g.drawImage(h.img, w * 0.2, w * 0.06, w * 0.6, w * 0.6, x - 13, y - 64, 26, 26);   // avatar: crop to the face
      else if (h.photo) g.drawImage(h.img, x - 13, y - 64, 26, 26);
      else g.drawImage(h.img, w * 0.2, w * 0.1, w * 0.6, w * 0.6, x - 13, y - 64, 26, 26);   // avatar: crop to the face
    }
    g.restore(); g.imageSmoothingEnabled = true;
    g.strokeStyle = c.color; g.lineWidth = 1.5; circ(x, y - 51, 13); g.stroke();
    g.fillStyle = '#c9d2dc'; rr(x - 9, y - 40, 18, 4, 2); g.fill();   // suit neck ring
  } else {
    circ(x, y - 50, 12); g.fillStyle = '#eef3f8'; g.fill();
    // visor: the face shows through, then a tinted glass reflection
    const vx = x + c.dir * 3, V = visor(c);
    g.fillStyle = '#16263a'; g.beginPath(); g.ellipse(vx, y - 50, 7, 6, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(vx, y - 50, 7, 6, 0, 0, 7); g.clip();
    if (V.hijab) { g.fillStyle = V.hair; g.fillRect(vx - 7, y - 56, 14, 12); }
    else { g.fillStyle = V.hair; g.fillRect(vx - 7, y - 57, 14, 4); }
    g.fillStyle = V.skin; g.beginPath(); g.ellipse(vx + c.dir * 1, y - 49, 4.6, 4.8, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(30,60,95,.35)'; g.fillRect(vx - 7, y - 56, 14, 12);
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.75)'; circ(vx + c.dir * 4, y - 53, 1.3); g.fill();
  }
  g.lineCap = 'butt';
  g.restore();
}

function drawEmblem(c, x, y) {
  g.fillStyle = '#0d1726'; circ(x, y, 4.2); g.fill();
  if (c.emblem === 'leaf') { g.fillStyle = '#4be38a'; g.beginPath(); g.ellipse(x, y, 2.6, 1.4, -0.7, 0, 7); g.fill(); }
  else if (c.emblem === 'bearing') {   // ball bearing: outer ring, inner ring, balls between
    g.strokeStyle = '#c9d4e0'; g.lineWidth = 0.9; circ(x, y, 3.3); g.stroke(); circ(x, y, 1.1); g.stroke();
    g.fillStyle = '#eef3f8'; for (let a = 0; a < 6; a++) { circ(x + Math.cos(a * Math.PI / 3) * 2.2, y + Math.sin(a * Math.PI / 3) * 2.2, 0.55); g.fill(); }
  }
  else if (c.emblem === 'rock') { g.fillStyle = '#b3a596'; g.beginPath(); g.moveTo(x - 2.6, y + 1.8); g.lineTo(x - 1.8, y - 1.2); g.lineTo(x + 0.6, y - 2.2); g.lineTo(x + 2.6, y + 1.8); g.fill(); }
  else { g.fillStyle = c.color; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.2 : 2.8, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
}

// astronaut with a shadow, a little Moon-hop when walking outside, and emotes / speech bubbles
// astronauts are drawn 20% larger than their 62 px design so the faces read on screen
const CREW_SCALE = 1.2;
function drawAstroAt(c, x, y, ts, alpha) { g.save(); g.translate(x, y); g.scale(CREW_SCALE, CREW_SCALE); drawAstro(c, 0, 0, ts, alpha); g.restore(); }
// name tags: lift a tag when it would overlap a neighbour's on the same floor
function layoutTags() {
  g.font = 'bold 12px "Segoe UI", sans-serif';
  const placed = [];
  S.crew.filter(c => !c.out).sort((a, b) => a.x - b.x).forEach(c => {
    const w = g.measureText(c.name).width + 12; let lift = 0;
    while (placed.some(p => Math.abs(p.y - c.y) < 40 && p.lift === lift && Math.abs(p.x - c.x) < (p.w + w) / 2 + 2)) lift += 17;
    c.tag = { w, lift }; placed.push({ x: c.x, y: c.y, w, lift });
  });
}
function drawTag(c, y) {
  const { w, lift } = c.tag || { w: 40, lift: 0 }, ty = y - 84 - lift;
  g.fillStyle = 'rgba(6,12,24,.78)'; rr(c.x - w / 2, ty - 12, w, 22, 6); g.fill();
  txt(c.name, c.x, ty + 1, 12, c.color, 'center', '"Segoe UI", sans-serif');
  g.fillStyle = '#081120'; g.fillRect(c.x - w / 2 + 5, ty + 4, w - 10, 3);
  g.fillStyle = c.dose >= 60 ? '#ff4d5e' : '#ffb938'; g.fillRect(c.x - w / 2 + 5, ty + 4, (w - 10) * Math.min(1, c.dose / 100), 3);
  return ty - 12;
}
function drawCrew(c, ts) {
  const walking = c.path.length > 0, outside = c.y <= SURF + 1;
  const hop = walking && outside ? Math.abs(Math.sin(ts / 170 + c.i)) * 7 : !walking ? Math.sin(ts / 600 + c.i * 2) * 0.8 : 0;
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(c.x, c.y + 3, (14 - hop * 0.5) * CREW_SCALE, 4.5, 0, 0, 7); g.fill();
  drawAstroAt(c, c.x, c.y - hop, ts, 1);
  const top = S.meet && S.meet.c === c ? c.y - hop - 84 : drawTag(c, c.y - hop) - 4;
  if (c.emote && c.emote.t > 0) { const k = Math.min(1, (c.emote.life - c.emote.t) * 6); g.globalAlpha = Math.min(1, c.emote.t * 2); txt(c.emote.icon, c.x, top - 2, 14 + k * 8, '#fff', 'center', 'sans-serif'); g.globalAlpha = 1; }
  if (c.say && c.say.t > 0) {
    g.font = 'bold 12px "Exo 2", "Segoe UI", sans-serif'; const w = g.measureText(c.say.text).width + 16, bx = Math.max(6, Math.min(W - w - 6, c.x - w / 2));
    g.globalAlpha = Math.min(1, c.say.t * 2); g.fillStyle = '#fff'; rr(bx, top - 26, w, 22, 9); g.fill(); g.beginPath(); g.moveTo(c.x - 5, top - 5); g.lineTo(c.x, top + 3); g.lineTo(c.x + 5, top - 5); g.fill();
    txt(c.say.text, bx + w / 2, top - 11, 12, '#10202f', 'center'); g.globalAlpha = 1;
  }
}

function drawStorm(ts, dt) {
  if (S.phase !== 'storm') return;
  const k = Math.min(1, S.I / 5), sh = lvl('shield');
  g.lineWidth = 2.5; g.lineCap = 'round';
  rain.forEach(r => {
    if (!S.paused) r.p += dt * (0.9 + r.depth * 0.5);
    if (r.p > 1) { r.p = 0; r.o = rnd(-250, 1250); r.depth = Math.random(); }
    // most particles stop in the first metres of soil; very few reach the deep shelter
    const maxY = SURF + r.depth * r.depth * 330 * (1 - sh * 0.15), y = r.p * (H + 60) - 40;
    if (y > maxY) { if (r.p < 0.99 && y - maxY < 12 && maxY < SURF + 30 && Math.random() < 0.3) S.parts.push({ x: r.o + maxY * 0.55, y: maxY, vx: rnd(-30, 30), vy: rnd(-50, -10), t: 0.4, life: 0.4, color: '255,180,120', size: 2 }); return; }
    const x = r.o + y * 0.55, a = (y < SURF ? 0.8 : 0.8 * (1 - (y - SURF) / (maxY - SURF + 1))) * (0.3 + k * 0.7);
    const sg = g.createLinearGradient(x - 14, y - 26, x, y); sg.addColorStop(0, 'rgba(255,90,70,0)'); sg.addColorStop(1, `rgba(255,${120 + r.depth * 80 | 0},90,${a})`);
    g.strokeStyle = sg; g.beginPath(); g.moveTo(x - 14, y - 26); g.lineTo(x, y); g.stroke();
  });
  g.lineCap = 'butt';
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  vg.addColorStop(0, 'rgba(255,30,50,0)'); vg.addColorStop(1, `rgba(255,30,50,${0.16 + k * 0.22 * (0.6 + 0.4 * Math.sin(ts / 150))})`);
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

function drawHud(ts, dt) {
  // sparks, smoke and stars
  S.parts = S.parts.filter(p => (p.t -= dt) > 0);
  S.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; g.fillStyle = `rgba(${p.color},${p.t / p.life})`; circ(p.x, p.y, p.size * (p.color[0] === '1' && p.size > 3 ? 2 - p.t / p.life : 1)); g.fill(); });
  S.fx = S.fx.filter(f => (f.t -= dt) > 0);
  S.fx.forEach(f => { g.globalAlpha = Math.min(1, f.t); txt(f.text, f.x, f.y - (1.5 - f.t) * 24, f.size || 16, f.color, 'center'); g.globalAlpha = 1; });
  // radiation gauge
  const rx = 1034, ry = 118, lev = Math.min(1, S.I / 7.2);
  g.fillStyle = 'rgba(4,9,18,.7)'; rr(rx - 92, ry - 16, 240, 30, 10); g.fill();
  txt('☢ RADIATION', rx, ry + 4, 11, lev > 0.05 ? '#ff9aa4' : '#7f9cc0', 'right');
  g.fillStyle = '#081120'; rr(rx + 8, ry - 7, 130, 13, 6); g.fill();
  if (lev > 0) { const rg = g.createLinearGradient(rx + 8, 0, rx + 138, 0); rg.addColorStop(0, '#ffb938'); rg.addColorStop(1, '#ff2d4a'); g.fillStyle = rg; rr(rx + 8, ry - 7, Math.max(8, 130 * lev), 13, 6); g.fill(); }
  // tutorial pointer
  if (S.hint) {
    const bob = Math.sin(ts / 160) * 6, { x, y, text } = S.hint;
    g.font = 'bold 14px "Exo 2", "Segoe UI", sans-serif'; const w = g.measureText(text).width + 22, bx = Math.max(8, Math.min(W - w - 8, x - w / 2));
    g.fillStyle = '#ffd84a'; g.shadowColor = '#ffd84a'; g.shadowBlur = 14; rr(bx, y - 58 + bob, w, 28, 12); g.fill(); g.shadowBlur = 0;
    g.beginPath(); g.moveTo(x - 9, y - 31 + bob); g.lineTo(x, y - 16 + bob); g.lineTo(x + 9, y - 31 + bob); g.fill();
    txt(text, bx + w / 2, y - 39 + bob, 14, '#1c1400', 'center');
  }
  if (S.banner && (S.banner.t -= dt) > 0) {
    const k = Math.min(1, S.banner.t), pop = 1 + Math.max(0, S.banner.t - 1.9) * 1.2;
    g.globalAlpha = k; g.save(); g.translate(W / 2, 112); g.scale(pop, pop);
    g.shadowColor = S.banner.color; g.shadowBlur = 30; txt(S.banner.text, 0, 0, 56, S.banner.color, 'center', '"Orbitron", "Exo 2", sans-serif'); g.shadowBlur = 0;
    if (S.banner.sub) txt(S.banner.sub, 0, 30, 17, '#fff', 'center'); g.restore(); g.globalAlpha = 1;
  }
  if (S.paused) { g.fillStyle = 'rgba(3,6,12,.6)'; g.fillRect(0, 0, W, H); txt('PAUSED', W / 2, H / 2, 60, '#37d6ff', 'center', '"Orbitron", sans-serif'); txt('Tap ▶ to keep playing', W / 2, H / 2 + 36, 18, '#cfe6ff', 'center'); }
}

// ---------- cutscenes ----------
const cutStars = Array.from({ length: 160 }, () => [Math.random() * W, Math.random() * H, rnd(0.5, 1.6)]);
function drawLaunch(ts, t) {
  const lift = Math.max(0, t - 3), up = Math.min(1, lift / 3.2), space = Math.min(1, Math.max(0, (t - 5.2) / 2));
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, `rgb(${lerp(70, 2, up) | 0},${lerp(140, 4, up) | 0},${lerp(230, 14, up) | 0})`); sky.addColorStop(1, `rgb(${lerp(190, 6, up) | 0},${lerp(220, 12, up) | 0},${lerp(255, 30, up) | 0})`);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.globalAlpha = up; g.fillStyle = '#fff'; cutStars.forEach(([x, y, r]) => g.fillRect(x, (y + lift * 60 * r) % H, r, r)); g.globalAlpha = 1;
  const gy = H - 90 + up * up * 900;                                  // the ground falls away
  g.fillStyle = '#2f7d4f'; g.fillRect(0, gy, W, 400); g.fillStyle = '#6b7380'; g.fillRect(W / 2 - 150, gy - 6, 300, 12);
  g.fillStyle = '#8a94a3'; g.fillRect(W / 2 + 46, gy - 250, 14, 250); for (let i = 0; i < 6; i++) g.fillRect(W / 2 + 20, gy - 240 + i * 40, 30, 4);
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse((i * 290 + ts / 40) % (W + 200) - 100, 90 + i * 55 + up * 700, 70, 18, 0, 0, 7); g.fill(); }
  const shake = lift > 0 && up < 1 ? rnd(-3, 3) : 0, ry = H - 330 - up * 60 + shake, rx = W / 2 + shake;
  if (lift > 0) for (let i = 0; i < 16; i++) { const fy = ry + 232 + i * 14, fw = 26 + i * 5 * (1 - up * 0.6); g.fillStyle = `rgba(255,${200 - i * 9},${80 - i * 4},${0.9 - i * 0.05})`; g.beginPath(); g.ellipse(rx + rnd(-4, 4), fy, fw / 2, 12, 0, 0, 7); g.fill(); }
  if (lift > 0 && up < 0.5) for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(235,235,240,.5)'; circ(rx + rnd(-160, 160) * (0.3 + up * 2), gy - rnd(0, 40), rnd(18, 40)); g.fill(); }
  g.fillStyle = '#f2f5f9'; rr(rx - 24, ry, 48, 220, 8); g.fill(); g.beginPath(); g.moveTo(rx - 24, ry + 6); g.quadraticCurveTo(rx, ry - 70, rx + 24, ry + 6); g.fill();
  g.fillStyle = '#ff6a3d'; g.fillRect(rx - 24, ry + 60, 48, 10); g.fillRect(rx - 24, ry + 150, 48, 10);
  g.fillStyle = '#37d6ff'; circ(rx, ry + 30, 9); g.fill(); g.fillStyle = '#c3ccd8'; g.beginPath(); g.moveTo(rx - 24, ry + 170); g.lineTo(rx - 46, ry + 226); g.lineTo(rx - 24, ry + 220); g.fill(); g.beginPath(); g.moveTo(rx + 24, ry + 170); g.lineTo(rx + 46, ry + 226); g.lineTo(rx + 24, ry + 220); g.fill();
  g.save(); g.translate(rx + 5, ry + 130); g.rotate(-Math.PI / 2); txt('MOON CREW', 0, 0, 12, '#22324a', 'center'); g.restore();
  if (space > 0) { g.globalAlpha = space; const mr = 60 + space * 150; const mg = g.createRadialGradient(W - 220, 150, 10, W - 200, 170, mr); mg.addColorStop(0, '#eef1f5'); mg.addColorStop(1, '#8b919c'); g.fillStyle = mg; circ(W - 200, 170, mr); g.fill(); g.fillStyle = 'rgba(0,0,0,.14)'; [[-40, -20, 22], [30, 30, 30], [-10, 60, 16], [50, -50, 14]].forEach(([a, b, r]) => { circ(W - 200 + a * space * 1.6, 170 + b * space * 1.6, r * space); g.fill(); }); g.globalAlpha = 1; }
  const label = t < 1 ? '3' : t < 2 ? '2' : t < 3 ? '1' : t < 4.2 ? 'LIFT-OFF!' : space > 0.2 ? 'NEXT STOP: THE MOON' : '';
  if (label) { g.shadowColor = '#000'; g.shadowBlur = 12; txt(label, W / 2, t < 3 ? 150 : 110, t < 3 ? 110 : 54, '#fff', 'center', '"Orbitron", sans-serif'); g.shadowBlur = 0; }
  txt('384,400 km to go · about 3 days of travel', W / 2, H - 24, 15, 'rgba(255,255,255,.85)', 'center');
}
function drawAurora(ts, t) {
  g.fillStyle = '#02030a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; cutStars.forEach(([x, y, r]) => { g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(ts / 800 + x)); g.fillRect(x, y, r, r); }); g.globalAlpha = 1;
  const mx = 330, my = 240, mr = 128, k = Math.min(1, t / 3);
  for (let i = 0; i < 46; i++) {                                     // shimmering glow all around the planet
    const a = i / 46 * Math.PI * 2 + ts / 5000, wob = Math.sin(ts / 300 + i * 1.3) * 16 * k, r0 = mr + 4, r1 = mr + 20 * k + 26 * k * Math.abs(Math.sin(ts / 700 + i)) + wob;
    const ag = g.createLinearGradient(mx + Math.cos(a) * r0, my + Math.sin(a) * r0, mx + Math.cos(a) * r1, my + Math.sin(a) * r1);
    ag.addColorStop(0, `rgba(${i % 3 ? '150,90,255' : '90,255,190'},${0.7 * k})`); ag.addColorStop(1, 'rgba(120,90,255,0)');
    g.strokeStyle = ag; g.lineWidth = 26; g.beginPath(); g.moveTo(mx + Math.cos(a) * r0, my + Math.sin(a) * r0); g.lineTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1); g.stroke();
  }
  const mars = g.createRadialGradient(mx - 60, my - 60, 20, mx, my, mr); mars.addColorStop(0, '#f0906a'); mars.addColorStop(1, '#7c2f1c'); g.fillStyle = mars; circ(mx, my, mr); g.fill();
  g.save(); circ(mx, my, mr); g.clip(); g.fillStyle = 'rgba(70,20,10,.35)'; [[-50, -30, 60, 26], [40, 50, 70, 22], [-20, 90, 40, 14]].forEach(([a, b, w, h]) => { g.beginPath(); g.ellipse(mx + a, my + b, w, h, 0.3, 0, 7); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(mx, my - mr + 8, 46, 11, 0, 0, 7); g.fill(); g.fillStyle = `rgba(150,110,255,${0.25 * k})`; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2); g.fillStyle = 'rgba(2,3,10,.5)'; circ(mx + 110, my + 20, mr + 20); g.fill(); g.restore();
  const oa = ts / 1400, ox = mx + Math.cos(oa) * 200, oy = my + Math.sin(oa) * 70; g.fillStyle = '#e4eaf1'; g.fillRect(ox - 5, oy - 3, 10, 6); g.fillStyle = '#3d86f0'; g.fillRect(ox - 15, oy - 2, 8, 4); g.fillRect(ox + 7, oy - 2, 8, 4);
  txt('MAVEN', ox, oy - 10, 10, '#9fc4ff', 'center');
  txt('MARS · shown close up, not to scale', mx, my - mr - 44, 11, '#b9a6ff', 'center');
  txt('In Sept 2017 Mars was about 390 million km from the Moon', mx, my + mr + 58, 11, '#ffb49a', 'center');
  // the Moon in front: your crew on the horizon, looking toward Mars (drawn close up, not to scale)
  const MX = 130, MY = 730, RX = 280, RY = 160, ground = x => MY - RY * Math.sqrt(Math.max(0, 1 - ((x - MX) / RX) ** 2));
  const mg = g.createLinearGradient(0, MY - RY, 0, H); mg.addColorStop(0, '#9aa0ab'); mg.addColorStop(0.15, '#5d626d'); mg.addColorStop(1, '#2a2d34');
  g.fillStyle = mg; g.beginPath(); g.ellipse(MX, MY, RX, RY, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(MX, MY, RX, RY, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  [[70, 612, 16], [200, 600, 11], [140, 628, 8]].forEach(([x, y, r]) => { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y, r, r * 0.3, 0, 0, 7); g.fill(); });
  const crew = S.crew.filter(c => !c.out);
  crew.forEach((c, i) => {
    const x = crew.length === 1 ? 130 : 50 + i * 170 / (crew.length - 1), y = ground(x) + 4;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 2, 11, 3, 0, 0, 7); g.fill();
    const dir = c.dir, path = c.path; c.dir = 1; c.path = []; c.wave = true; g.save(); g.translate(x, y); g.scale(0.85, 0.85); drawAstro(c, 0, 0, ts); g.restore(); c.dir = dir; c.path = path; c.wave = false;
    txt(c.name, x, y + 16, 10, c.color, 'center');
  });
  txt(crew.length === 4 ? 'YOUR WHOLE CREW MADE IT' : `${crew.length} OF 4 CREW MADE IT`, MX, 512, 12, '#e3f1ff', 'center');
  g.globalAlpha = Math.min(1, t / 1.5);
  txt('SEPTEMBER 2017', 640, 150, 20, '#ffb938', 'left', '"Orbitron", sans-serif');
  txt('THE WHOLE PLANET GLOWED', 640, 192, 27, '#fff', 'left', '"Orbitron", sans-serif');
  ['The storm you just survived also hit Mars.', 'NASA\'s MAVEN spacecraft saw an aurora', '25 times brighter than any seen there before.', '', 'On the ground, the Curiosity rover measured more than', 'double its highest radiation reading since 2012.', '', 'Mars has no global magnetic shield, so future', 'Mars crews will need a storm shelter too.', 'Now you know how to run one.'].forEach((s, i) => txt(s, 640, 240 + i * 26, 17, i > 7 ? '#9dffd8' : '#cfe6ff'));
  txt('Source: NASA MAVEN and Curiosity RAD, September 2017', 640, 520, 12, '#7f9cc0');
  if (t > 3) txt('Tap to continue ▶', 640, 566, 18, Math.sin(ts / 300) > 0 ? '#fff' : '#9dffd8');
  g.globalAlpha = 1;
}

let lastTs = 0;
function draw(ts) {
  const dt = Math.min(0.1, (ts - lastTs) / 1000) || 0; lastTs = ts;
  walkClock();
  S.crew.forEach(c => { if (c.emote) c.emote.t -= dt; if (c.say) c.say.t -= dt; });
  if (S.cut) {
    g.setTransform(2, 0, 0, 2, 0, 0); S.cut.t += dt;
    (S.cut.type === 'launch' ? drawLaunch : drawAurora)(ts, S.cut.t);
    if (S.cut.dur && S.cut.t >= S.cut.dur) endCut();
    return requestAnimationFrame(draw);
  }
  const cam = S.cam, ease = 1 - Math.pow(0.03, dt);
  for (const k of ['z', 'x', 'y']) cam[k] += (cam.to[k] - cam[k]) * ease;
  const cx = Math.max(W / 2 / cam.z, Math.min(W - W / 2 / cam.z, cam.x)), cy = Math.max(H / 2 / cam.z, Math.min(H - H / 2 / cam.z, cam.y));
  g.setTransform(2 * cam.z, 0, 0, 2 * cam.z, 2 * (W / 2 - cam.z * cx), 2 * (H / 2 - cam.z * cy));
  if (S.shake > 0) { S.shake -= dt; g.translate(rnd(-5, 5), rnd(-5, 5)); }
  drawSky(ts); drawSurface(ts); drawShaft();
  ['green', 'work', 'shelter'].forEach(k => drawRoom(k, ts));
  const evaHover = (S.drag && S.ptr && zoneAt(S.ptr[0], S.ptr[1]) === 'eva') || (S.hint && S.hint.zone === 'eva');
  if (evaHover) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([8, 6]); rr(34, 120, 512, 128, 12); g.stroke(); g.setLineDash([]); }
  g.fillStyle = 'rgba(6,12,24,.72)'; rr(36, 180, 182, 38, 8); g.fill();
  txt('MOON SURFACE', 44, 196, 13, '#e3f1ff'); txt('no protection · science ★', 44, 212, 11, '#ffb938');
  drawMachines(ts);
  layoutTags(); S.crew.filter(c => !c.out).sort((a, b) => a.y - b.y).forEach(c => drawCrew(c, ts));
  drawStorm(ts, dt);
  if (S.drag && S.ptr) drawAstroAt(S.crew.find(c => c.id === S.drag), S.ptr[0], S.ptr[1] + 30, ts, 0.6);
  drawHud(ts, dt);
  requestAnimationFrame(draw);
}
