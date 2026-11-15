// STORM WATCH: sound effects, ambience, music and radio voices.
// Everything is synthesized in the browser (Web Audio + the device's speech voices): no audio files.
const SFX = (() => {
  let ctx, master, noiseBuf, muted = false, mode = 'off', musicTimer, step = 0, hum, hiss;
  const NOTES = [196, 220, 261.6, 293.7, 329.6, 392, 440, 523.3];   // G major pentatonic-ish

  function ac() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return ctx; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
      master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }
  // one enveloped oscillator note
  function tone(f, dur, o = {}) {
    if (!ac()) return;
    const t = ctx.currentTime + (o.delay || 0), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.12, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + dur + 0.05);
  }
  // filtered noise burst (whooshes, static, rumbles)
  function noise(dur, o = {}) {
    if (!ac()) return;
    const t = ctx.currentTime + (o.delay || 0), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true;
    f.type = o.filter || 'bandpass'; f.frequency.setValueAtTime(o.f || 1200, t); f.Q.value = o.q || 0.8;
    if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.1, t + (o.attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + dur + 0.05);
  }
  const seq = (fs, gap, dur, o = {}) => fs.forEach((f, i) => tone(f, dur, { ...o, delay: (o.delay || 0) + i * gap }));

  const SOUNDS = {
    click:   () => tone(660, 0.05, { vol: 0.06 }),
    select:  () => { tone(520, 0.06, { vol: 0.07 }); tone(780, 0.08, { vol: 0.05, delay: 0.05 }); },
    drop:    () => { tone(300, 0.1, { to: 180, vol: 0.09, type: 'triangle' }); noise(0.08, { f: 500, vol: 0.04 }); },
    deny:    () => seq([200, 150], 0.09, 0.12, { type: 'square', vol: 0.05 }),
    step:    () => noise(0.05, { f: 300 + Math.random() * 200, vol: 0.025, filter: 'lowpass' }),
    star:    () => seq([1047, 1319, 1568], 0.06, 0.18, { vol: 0.06, type: 'triangle' }),
    power:   () => tone(180, 0.18, { to: 520, vol: 0.06, type: 'sawtooth' }),
    powerdn: () => tone(520, 0.18, { to: 180, vol: 0.06, type: 'sawtooth' }),
    break:   () => { noise(0.35, { f: 2500, fTo: 200, vol: 0.16 }); tone(110, 0.4, { to: 40, type: 'sawtooth', vol: 0.14 }); seq([1800, 900, 1500], 0.05, 0.05, { type: 'square', vol: 0.05 }); },
    fixed:   () => seq([523, 659, 784, 1047], 0.08, 0.25, { vol: 0.08, type: 'triangle' }),
    plug:    () => { tone(880, 0.07, { vol: 0.07 }); noise(0.04, { f: 3000, vol: 0.04 }); },
    alarm:   () => { for (let i = 0; i < 4; i++) { tone(880, 0.22, { type: 'square', vol: 0.07, delay: i * 0.5 }); tone(660, 0.22, { type: 'square', vol: 0.07, delay: i * 0.5 + 0.25 }); } },
    stormhit:() => { tone(70, 1.4, { to: 28, type: 'sawtooth', vol: 0.25 }); noise(1.6, { f: 200, fTo: 2500, vol: 0.18, filter: 'lowpass' }); },
    allclear:() => seq([392, 523, 659, 784], 0.12, 0.5, { vol: 0.07 }),
    whoosh:  () => noise(0.5, { f: 300, fTo: 3500, vol: 0.14 }),
    whooshout:() => noise(0.45, { f: 3500, fTo: 300, vol: 0.12 }),
    card:    () => { noise(0.08, { f: 4000, vol: 0.05 }); tone(990, 0.12, { vol: 0.05, delay: 0.04 }); },
    correct: () => seq([659, 880, 1319], 0.09, 0.3, { vol: 0.09, type: 'triangle' }),
    wrong:   () => seq([330, 262], 0.14, 0.25, { vol: 0.07, type: 'triangle' }),
    badge:   () => seq([523, 659, 784, 1047, 1319], 0.07, 0.4, { vol: 0.07, type: 'triangle' }),
    win:     () => { seq([523, 523, 523, 659, 784, 1047], 0.14, 0.5, { vol: 0.1, type: 'triangle' }); seq([262, 330, 392], 0.28, 0.9, { vol: 0.06, delay: 0.1 }); },
    lose:    () => seq([392, 349, 311, 262], 0.22, 0.6, { vol: 0.08, type: 'triangle' }),
    launch:  () => { noise(5.5, { f: 90, fTo: 900, vol: 0.3, filter: 'lowpass', attack: 1.2 }); tone(45, 5.5, { to: 110, type: 'sawtooth', vol: 0.12, attack: 1 }); },
    signal:  () => seq([1400, 1700, 1400, 1700], 0.08, 0.06, { vol: 0.04 }),
    aurora:  () => seq([262, 330, 392, 523, 659, 784, 1047], 0.35, 2.4, { vol: 0.05 }),
    quindarIn:  () => tone(2525, 0.25, { vol: 0.05 }),
    quindarOut: () => tone(2475, 0.25, { vol: 0.05 }),
    static:  () => noise(0.25, { f: 2200, vol: 0.05, q: 0.5 }),
  };
  function play(name) { if (!muted && SOUNDS[name]) try { SOUNDS[name](); } catch (e) {} }

  // Geiger-counter clicks: more radiation, more clicks. Call every game tick.
  function geiger(level) {
    if (muted || level <= 0) return;
    const n = Math.random() < Math.min(0.95, level * 0.35) ? 1 + Math.floor(Math.random() * level) : 0;
    for (let i = 0; i < Math.min(n, 5); i++) noise(0.012, { f: 3500, vol: 0.09, delay: Math.random() * 0.24, q: 2 });
  }

  // Background: a quiet base hum plus a few soft notes. mode = 'calm' | 'warning' | 'storm' | 'off'
  function ambience(m) {
    if (m === mode) return; mode = m;
    if (!ac()) return;
    if (!hum) {
      hum = ctx.createGain(); hum.gain.value = 0; hum.connect(master);
      [55, 82.5, 110.4].forEach(f => { const o = ctx.createOscillator(); o.frequency.value = f; o.type = 'sine'; o.connect(hum); o.start(); });
      hiss = ctx.createGain(); hiss.gain.value = 0;
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(); s.buffer = noiseBuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = 400;
      s.connect(f); f.connect(hiss); hiss.connect(master); s.start();
    }
    const t = ctx.currentTime;
    hum.gain.setTargetAtTime(m === 'off' ? 0 : 0.025, t, 0.5);
    hiss.gain.setTargetAtTime(m === 'storm' ? 0.07 : m === 'warning' ? 0.02 : 0, t, 0.6);
    clearInterval(musicTimer);
    if (m === 'calm') musicTimer = setInterval(() => { if (!muted && Math.random() < 0.75) tone(NOTES[Math.floor(Math.random() * NOTES.length)] * (Math.random() < 0.3 ? 2 : 1), 2.2, { vol: 0.03, attack: 0.3 }); }, 900);
    if (m === 'warning') musicTimer = setInterval(() => { if (muted) return; tone(step++ % 4 === 0 ? 98 : 73.4, 0.22, { type: 'triangle', vol: 0.09 }); }, 330);
    if (m === 'storm') musicTimer = setInterval(() => { if (muted) return; tone(step++ % 2 ? 65.4 : 61.7, 0.3, { type: 'sawtooth', vol: 0.06 }); }, 260);
  }

  // ---------- radio voices ----------
  // Uses the best speech voice the device has (natural/neural ones first). Mission Control messages are
  // framed like Apollo radio calls: a Quindar tone and a burst of static before and after the words.
  let voices = [], queue = [], talking = false;
  const loadVoices = () => { try { voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); } catch (e) {} };
  if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  const score = v => (/natural|neural|online/i.test(v.name) ? 8 : 0) + (/google/i.test(v.name) ? 5 : 0) + (/samantha|aria|jenny|guy|davis|daniel|karen/i.test(v.name) ? 3 : 0) + (/en-US/i.test(v.lang) ? 2 : 0) + (v.localService ? 0 : 1);
  // Each speaker asks for a particular voice first (prefer), then falls back to any low or high voice.
  // Whole-word matching matters here: "Female" contains "male".
  function voiceFor(kind, prefer) {
    if (!voices.length) loadVoices();
    const sorted = [...voices].sort((a, b) => score(b) - score(a));
    const wanted = prefer && sorted.find(v => prefer.test(v.name));
    const male = sorted.find(v => /\b(guy|davis|david|daniel|male|mark|ryan|christopher|eric)\b/i.test(v.name));
    const female = sorted.find(v => /\b(aria|jenny|samantha|zira|female|karen|michelle|ana|emma)\b/i.test(v.name));
    return wanted || (kind === 'low' ? male : kind === 'high' ? female : null) || sorted[0] || null;
  }
  const WHO = {
    capcom: { kind: 'low', pitch: 0.85, rate: 1.02, radio: true, prefer: /Google UK English Male|\bGuy\b|Daniel/i },
    cmd:    { kind: 'any', pitch: 1.05, rate: 1.05, prefer: /Google US English|Aria|Samantha/i },
    brian:  { kind: 'low', pitch: 0.75, rate: 1.0, prefer: /\bDavid\b|Davis/i },
    sidra:  { kind: 'high', pitch: 1.15, rate: 1.03, prefer: /Google UK English Female|Jenny|Karen/i },
    quan:   { kind: 'low', pitch: 1.2, rate: 1.1, prefer: /\bMark\b|Ryan|Eric/i },
    base:   { kind: 'high', pitch: 1.0, rate: 1.0, prefer: /Zira|Michelle|Emma/i },
  };
  function pump() {
    if (talking || !queue.length) return;
    const { text, who } = queue.shift(), w = WHO[who] || WHO.capcom;
    talking = true;
    const done = () => { if (w.radio) { play('static'); play('quindarOut'); } talking = false; setTimeout(pump, 250); };
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/[★🌱🔧⚡💧🛡️🚨📡]/gu, ''));
      const v = voiceFor(w.kind, w.prefer); if (v) u.voice = v;
      u.pitch = w.pitch; u.rate = w.rate; u.volume = 1;
      u.onend = done; u.onerror = done;
      if (w.radio) { play('quindarIn'); play('static'); setTimeout(() => speechSynthesis.speak(u), 320); }
      else speechSynthesis.speak(u);
    } catch (e) { talking = false; }
  }
  // say(text, who, urgent): urgent messages cut off whatever is being said
  function say(text, who = 'capcom', urgent = false) {
    if (muted || !window.speechSynthesis || !text) return;
    if (urgent) { queue = []; try { speechSynthesis.cancel(); } catch (e) {} talking = false; }
    if (queue.length > 2) queue.shift();
    queue.push({ text, who }); pump();
  }
  const hush = () => { queue = []; talking = false; try { speechSynthesis.cancel(); } catch (e) {} };
  const crewSay = (c, text) => { play('select'); say(text, WHO[c.id] ? c.id : 'cmd', true); };

  function setMuted(m) {
    muted = m; if (m) hush();
    if (ctx && master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
  }
  return { play, say, crewSay, hush, geiger, ambience, setMuted, get muted() { return muted; }, tone, unlock: ac };
})();

// older code calls beep(); keep it working
function beep(freq = 440, dur = 0.15, type = 'sine') { if (!SFX.muted) SFX.tone(freq, dur, { type, vol: 0.05 }); }
