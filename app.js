/* La Quête de Mymy — livre interactif */
(() => {
"use strict";

/* ====================== Utilitaires ====================== */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const U = n => `calc(var(--u)*${n})`;
const pick = a => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const book = $("#book");

/* ====================== Textes (exactement ceux de sa liste) ====================== */
const GIFTS = ["c'est bon la trentaine et là, un nouveau projet ? En tout cas il auras pas faim c'est déjà ça.", "Maintenant que tu nettoie la lune, il est temps de creuser la terre.", "Tu voulais des cocottes non ?", "futur frimeuse de pause café", "Désolé il vibre pas.", "Au moins celle là elle creverons pas", "on espère que les chats te ferons chier à 3h du mat", "ça te sera utile quand tu voudras plus parler ps : pas sure que ça soit efficace au taf", "Comme dit 50 cent \" I take to the candy shop \"", "Operationnel pour demain", "Le gros coûtais trop cher et prennait trop de place.", "C'est éxactement ce que tu crois...", "Faut le faire maintenant sinon c'est mort", "Askip tu vas kiffer", "Il vibre toujours pas MYLENE", "\" JE ME BATS EN DUEL AVEC UN CHEVAL \"", "Tu pourras le faire une seule fois, PROFITE BIEN", "Oui mylène, c'est le vrai..", "Parce que t'es une adultes responsable il te faut tout noter", "Non mais vraiment, t'es une adulte RESPONSABLE", "T'as PAL commence à être vraiment longue..", "+ 1 000 Aura", "On à jamais assez du chocolat", "C KWOAAAAAAAAAAA ?", "Non il vibre toujours pas, c'est long là !!", "Céqouaaaaaaaa ?", "P'tite battle d'Aura ?", "Et oui... Winter is Comming", "Tu commences à nous faire chier avec tes trucs lààààà faudra bientôt une pièce exprès."];
const FINAL_TXT = "Plus d'excuse possible, tu vas enfin pouvoir faire ton bras. Dépêche de l'appeler et de prendre rendez-vous, on t'aime.";
const MAP_TXT = "BAM ! Tu as une mission : découvre les 29 trésors dans le bon ordre, cachés dans la boîte mystérieuse (le gros carton), afin de découvrir ton trésor ultime !";

const PAGES = [{ k: "cover" }, { k: "intro" }, { k: "map" }]
  .concat(GIFTS.map((t, i) => ({ k: "gift", n: i + 1, t })))
  .concat([{ k: "final" }, { k: "back" }]);

/* ====================== Sauvegarde ====================== */
const KEY = "mymy-livre-v2";
let st = { max: 0, unlocked: {} };
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === "object") st = Object.assign(st, s); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

/* ====================== Sprites ====================== */
const META = {
  mymy: { w: 280, h: 292, frames: 16, ms: 180, u: 27.2 },
  dori: { w: 258, h: 286, frames: 16, ms: 180, u: 26.6 },
  elona: { w: 269, h: 310, frames: 16, ms: 180, u: 28.8 },
  jordan: { w: 357, h: 334, frames: 12, ms: 350, u: 31.1 },
  mathieu: { w: 251, h: 308, frames: 16, ms: 180, u: 28.6 },
  kithim: { w: 260, h: 302, frames: 16, ms: 180, u: 28.1 },
  kguit: { w: 240, h: 308, frames: 16, ms: 180, u: 28.6 },
  murphy: { w: 274, h: 198, frames: 20, ms: 200 },
  vaia: { w: 260, h: 193, frames: 20, ms: 160 },
  groupe: { w: 689, h: 196, frames: 9, ms: 120, u: 18.2 },
  trophee: { w: 501, h: 454, frames: 6, ms: 350 },
  tresor: { w: 510, h: 510, frames: 6, ms: 350 },
  mymy_run: { w: 132, h: 175, frames: 9, ms: 120, u: 26.0 },
  dori_run: { w: 128, h: 181, frames: 9, ms: 120, u: 26.9 },
  jordan_run: { w: 107, h: 182, frames: 9, ms: 120, u: 27.1 },
  elona_run: { w: 128, h: 178, frames: 9, ms: 120, u: 26.5 },
  mathieu_run: { w: 109, h: 189, frames: 9, ms: 120, u: 28.1 }
};
/* poses des modèles « dernière refonte » : idle / joy / run = [première, dernière] image ; step = pas rebondi (pas de cycle de marche) */
const HERO = {
  mymy: { idle: [9, 10], joy: [1, 3], runSheet: "mymy_run", jf: 6 },
  dori: { idle: [0, 0], joy: [12, 15], runSheet: "dori_run", jf: 6 },
  elona: { idle: [0, 1], joy: [12, 15], runSheet: "elona_run", jf: 6 },
  jordan: { idle: [0, 1], joy: [4, 7], runSheet: "jordan_run", jf: 5 },
  mathieu: { idle: [0, 0], joy: [6, 9], runSheet: "mathieu_run", jf: 5 },
  kithim: { idle: [0, 0], joy: [7, 7], run: [1, 6], jf: 6, rf: 11 }
};
const CATRUN = { murphy: [4, 10], vaia: [4, 9] };
const live = new Set();
function setFrame(e, k) { const s = e._s; s.k = k; e.style.backgroundPosition = (s.m.frames > 1 ? k / (s.m.frames - 1) * 100 : 0) + "% 0"; }
function spr(name, h) {
  const m = META[name], e = el("div", "spr");
  e._s = { m, k: 0, from: 0, to: 0, fps: 1000 / m.ms, acc: 0, loop: true, on: false, done: null, seen: false };
  e.style.width = U(h * m.w / m.h); e.style.height = U(h);
  e.style.backgroundImage = `url(assets/sprites/${name}.png)`;
  e.style.backgroundSize = `${m.frames * 100}% 100%`;
  setFrame(e, 0); live.add(e); return e;
}
function play(e, from, to, o = {}) {
  const s = e._s; s.from = from; s.to = to; s.fps = o.fps || 1000 / s.m.ms; s.loop = o.loop !== false; s.done = o.done || null; s.on = true; s.acc = 0; setFrame(e, from);
}
function still(e, k = 0) { e._s.on = false; setFrame(e, k); }
let lastT = 0;
function tick(t) {
  const dt = Math.min(100, t - lastT); lastT = t;
  for (const e of live) {
    if (!e.isConnected) { if (e._s.seen) live.delete(e); continue; }
    const s = e._s; s.seen = true;
    if (!s.on) continue;
    s.acc += dt; const step = 1000 / s.fps;
    while (s.acc >= step) {
      s.acc -= step; let k = s.k + 1;
      if (k > s.to) {
        if (s.loop) k = s.from;
        else { setFrame(e, s.to); s.on = false; const d = s.done; s.done = null; if (d) d(); break; }
      }
      setFrame(e, k);
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* acteur = conteneur positionnable (animations de rebond) + sprite */
function actor(name, h, o = {}) {
  const a = el("div", "actor" + (o.bob === false ? "" : " bob")), s = spr(name, h);
  a.append(s); a._spr = s; a._w = h * META[name].w / META[name].h; a._h = h;
  if (o.flip) s.classList.add("flip");
  if (o.l != null) a.style.left = U(o.l);
  if (o.cx != null) a.style.left = U(o.cx - a._w / 2);
  a.style.bottom = U(o.b != null ? o.b : 4);
  return a;
}
function hero(name, o = {}) {
  const c = HERO[name], m = META[name]; let h = o.h || m.u * (o.s || 1); if (o.maxw && h * m.w / m.h > o.maxw) h = o.maxw * m.h / m.w; const a = actor(name, h, o);
  a._name = name;
  if (c.idle[1] > c.idle[0]) play(a._spr, c.idle[0], c.idle[1], { fps: 2.2 }); else still(a._spr, c.idle[0]);
  return a;
}
/* change la planche d'un héros (pose normale <-> course) en gardant sa taille, ses pieds au sol et son centre */
function useSheet(a, sheet) {
  const e = a._spr, s = e._s; if (s.sheet === sheet) return; s.sheet = sheet;
  const m = META[sheet], f = a._h / META[a._name].u, h = m.u * f, w = h * m.w / m.h;
  s.m = m; e.style.width = U(w); e.style.height = U(h); e.style.marginLeft = U((a._w - w) / 2);
  e.style.backgroundImage = `url(assets/sprites/${sheet}.png)`; e.style.backgroundSize = `${m.frames * 100}% 100%`;
}
function heroIdle(a) { const c = HERO[a._name]; a.classList.remove("hop", "step"); useSheet(a, a._name); if (c.idle[1] > c.idle[0]) play(a._spr, c.idle[0], c.idle[1], { fps: 2.2 }); else still(a._spr, c.idle[0]); }
function heroJoy(a) { const c = HERO[a._name]; a.classList.remove("step"); a.classList.add("hop"); useSheet(a, a._name); if (c.joy[1] > c.joy[0]) play(a._spr, c.joy[0], c.joy[1], { fps: c.jf }); else still(a._spr, c.joy[0]); }
function heroRun(a) {
  const c = HERO[a._name]; a.classList.remove("hop", "step");
  if (c.runSheet) { useSheet(a, c.runSheet); play(a._spr, 0, META[c.runSheet].frames - 1, { fps: 13 }); }
  else { useSheet(a, a._name); play(a._spr, c.run[0], c.run[1], { fps: c.rf }); }
}
function cat(name, h, o = {}) {
  const a = actor(name, h, Object.assign({ bob: false }, o)); a._name = name;
  play(a._spr, 0, 1, { fps: 1.4 }); return a;
}

/* ====================== Sons ====================== */
const Snd = {
  on: true, ctx: null, iv: null, step: 0, track: null,
  init() {
    if (!this.on) return;
    try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; if (!this.ctx) this.ctx = new C(); if (this.ctx.state === "suspended") this.ctx.resume(); if (!this.pageBuf && !this.pageLoading) { this.pageLoading = true; fetch("assets/sfx/page.mp3").then(r => r.arrayBuffer()).then(b => new Promise((ok, ko) => this.ctx.decodeAudioData(b, ok, ko))).then(b => { this.pageBuf = b; }).catch(() => { this.pageLoading = false; }); } } catch (e) {}
  },
  tone(f, d = .2, type = "triangle", v = .05, w = 0) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + w, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, v), t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05);
  },
  noise(d = .3, v = .05, f = 1500) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    fl.type = "lowpass"; fl.frequency.value = f; g.gain.value = v; s.buffer = b; s.connect(fl); fl.connect(g); g.connect(c.destination); s.start();
  },
  /* vrai bruit de page (mp3), avec le froissement synthétique en secours */
  page() {
    const c = this.ctx;
    if (!this.pageBuf) {
      if (!this.pageLoading) {
        this.pageLoading = true;
        fetch("assets/sfx/page.mp3").then(r => r.arrayBuffer()).then(b => new Promise((ok, ko) => c.decodeAudioData(b, ok, ko))).then(b => { this.pageBuf = b; }).catch(() => { this.pageLoading = false; });
      }
      this.paper(); return;
    }
    const s = c.createBufferSource(), g = c.createGain(); g.gain.value = .6; s.buffer = this.pageBuf; s.connect(g); g.connect(c.destination); s.start();
  },
  /* bruit de page : froissement de papier doux (montée, crépitement, retombée) */
  paper() {
    const c = this.ctx, d = .7, n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0), t0 = c.currentTime;
    let g = 1;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      if (i % 110 === 0) g = .35 + Math.random() * .65;
      const env = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.1)), 1.8) * (1 - t * .45);
      x[i] = (Math.random() * 2 - 1) * env * g;
    }
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), hp = c.createBiquadFilter(), gn = c.createGain();
    bp.type = "bandpass"; bp.Q.value = .6; bp.frequency.setValueAtTime(1300, t0); bp.frequency.exponentialRampToValueAtTime(4300, t0 + d * .85);
    hp.type = "highpass"; hp.frequency.value = 700; gn.gain.value = .22;
    s.buffer = b; s.connect(bp); bp.connect(hp); hp.connect(gn); gn.connect(c.destination); s.start(t0);
    this.tone(150, .14, "sine", .018, .52); // petit « poc » étouffé quand la page se pose
  },
  sfx(n) {
    this.init(); if (!this.on || !this.ctx) return;
    if (n === "tap") this.tone(660, .09, "triangle", .04);
    else if (n === "tapn") { this.tone(520 + (arguments[1] || 0) * 90, .12, "triangle", .05); }
    else if (n === "flip") this.page();
    else if (n === "open") [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .3, "triangle", .05, i * .07));
    else if (n === "bam") { this.noise(.4, .12, 900); this.tone(110, .45, "sawtooth", .06); this.tone(880, .3, "square", .03, .05); }
    else if (n === "miss") { this.tone(300, .15, "sine", .04); this.tone(240, .2, "sine", .04, .1); }
    else if (n === "win") [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, .35, "triangle", .06, i * .12));
    else if (n === "step") this.tone(180, .05, "square", .012);
  },
  music(track) {
    if (this.track === track && this.iv) return;
    this.track = track; if (this.iv) { clearInterval(this.iv); this.iv = null; }
    if (!track || !this.on) return; this.init(); if (!this.ctx) return;
    const T = {
      main: { n: [392, 440, 523, 587, 659, 587, 523, 440, 392, 330, 392, 440, 523, 440, 392, 330], ms: 520, type: "triangle", v: .010 },
      night: { n: [330, 392, 440, 392, 330, 294, 330, 392, 262, 330, 392, 330, 294, 262, 247, 262], ms: 600, type: "sine", v: .011 },
      finale: { n: [523, 659, 784, 1047, 784, 659, 523, 659, 587, 740, 880, 1175, 880, 740, 587, 740], ms: 280, type: "triangle", v: .014 }
    }[track];
    this.step = 0;
    this.iv = setInterval(() => {
      if (!this.on || !this.ctx || document.hidden) return;
      const f = T.n[this.step % T.n.length]; this.tone(f, T.ms / 1000 * .9, T.type, T.v);
      if (this.step % 4 === 0) this.tone(f / 2, T.ms / 1000 * 2, "sine", T.v * .5, .02);
      this.step++;
    }, T.ms);
  },
  toggle() { this.on = !this.on; if (!this.on) { if (this.iv) { clearInterval(this.iv); this.iv = null; } } else { const t = this.track; this.track = null; this.init(); this.music(t || "main"); } return this.on; }
};

/* ====================== Effets ====================== */
const PETALS = ["#f7a8c4", "#ffd1e0", "#ffffff", "#f6c85f", "#ff8fb4"];
function burst(parent, x, y, n = 28) {
  const f = el("div", "fx"); f.style.left = U(x); f.style.top = U(y);
  for (let k = 0; k < n; k++) {
    const i = el("i"), a = rnd(0, Math.PI * 2), d = rnd(8, 30);
    i.style.setProperty("--dx", U((Math.cos(a) * d).toFixed(1))); i.style.setProperty("--dy", U((Math.sin(a) * d - 6).toFixed(1)));
    i.style.setProperty("--r", rnd(-300, 300).toFixed(0) + "deg"); i.style.animationDelay = rnd(0, .15).toFixed(2) + "s";
    if (k % 4 === 0) { i.textContent = pick(["✦", "✧", "♥", "★"]); i.style.color = pick(["#ffd45e", "#ff7aa8", "#fff"]); i.style.fontSize = U(rnd(2.5, 4.5)); }
    else { i.innerHTML = '<b class="petal"></b>'; i.firstChild.style.setProperty("--c", pick(PETALS)); }
    f.append(i);
  }
  parent.append(f); setTimeout(() => f.remove(), 1700);
}
function say(parent, text, x, y) { const s = el("div", "say", text); s.style.left = U(x); s.style.top = U(y); parent.append(s); setTimeout(() => s.remove(), 1400); }

/* ====================== Décors en SVG ====================== */
const THEMES = [
  { sky: ["#ffd1e3", "#fff0d9"], h1: "#b9dba0", h2: "#8fc27d", g: "#79b866", deco: "sun" },
  { sky: ["#7a4e9c", "#f5a36c"], h1: "#6c4f86", h2: "#4f3a6b", g: "#41704f", deco: "sun2" },
  { sky: ["#1d1a47", "#5b3f7e"], h1: "#2f2a5e", h2: "#241f4a", g: "#2f5a4a", deco: "stars" },
  { sky: ["#9bd0b0", "#eef7d2"], h1: "#6fae82", h2: "#4f8f66", g: "#5a9a58", deco: "trees" },
  { sky: ["#ffc3d9", "#ffeede"], h1: "#e6b3c8", h2: "#c98aa8", g: "#8bbf74", deco: "cherry" },
  { sky: ["#8ccbea", "#eaf7ff"], h1: "#9ed3a3", h2: "#6fb882", g: "#62a860", deco: "clouds" },
  { sky: ["#2b3a67", "#f4b58a"], h1: "#38604e", h2: "#274a3d", g: "#2f6a47", deco: "forest" }
];
const THEME_ORDER = [0, 4, 5, 3, 1, 2, 0, 5, 4, 3, 2, 1];
let svgN = 0;
function tree(x, y, s, c1, c2) {
  return `<rect x="${x - 1.4 * s}" y="${y}" width="${2.8 * s}" height="${(60 - y)}" fill="#7a4a3a"/><circle cx="${x}" cy="${y - 2 * s}" r="${8 * s}" fill="${c1}"/><circle cx="${x - 6 * s}" cy="${y + 3 * s}" r="${6 * s}" fill="${c2}"/><circle cx="${x + 6 * s}" cy="${y + 3 * s}" r="${6.5 * s}" fill="${c1}"/><circle cx="${x}" cy="${y - 8 * s}" r="${5.5 * s}" fill="${c2}"/>`;
}
function sceneBG(T, seed) {
  const R = seeded(seed * 97 + 13), id = "g" + (++svgN); let deco = "", front = "";
  if (T.deco === "stars") { for (let i = 0; i < 40; i++) deco += `<circle cx="${(R() * 98 + 1).toFixed(1)}" cy="${(R() * 38).toFixed(1)}" r="${(R() * .6 + .25).toFixed(2)}" fill="#fff6c8" opacity="${(R() * .5 + .5).toFixed(2)}"/>`; deco += `<circle cx="84" cy="13" r="6" fill="#fff3c0"/><circle cx="86.5" cy="11.5" r="5.2" fill="${T.sky[0]}"/>`; }
  if (T.deco === "sun") deco += `<circle cx="78" cy="16" r="12" fill="#fff6c0" opacity=".5"/><circle cx="78" cy="16" r="7" fill="#fff2a8"/>`;
  if (T.deco === "sun2") deco += `<circle cx="22" cy="40" r="14" fill="#ffd9a0" opacity=".55"/><circle cx="22" cy="40" r="8" fill="#ffe9bd"/>`;
  if (T.deco === "clouds" || T.deco === "cherry" || T.deco === "sun") for (let i = 0; i < 3; i++) { const x = 15 + i * 33 + R() * 8, y = 8 + R() * 12; deco += `<g fill="#fff" opacity=".85"><ellipse cx="${x}" cy="${y}" rx="9" ry="3.3"/><ellipse cx="${x + 5}" cy="${y - 2}" rx="5.5" ry="3"/><ellipse cx="${x - 5}" cy="${y - 1.2}" rx="4.5" ry="2.4"/></g>`; }
  if (T.deco === "cherry") { front += tree(4, 24, 1.3, "#f08fb3", "#e97aa2") + tree(95, 27, 1.15, "#f39bbb", "#e97aa2"); }
  if (T.deco === "trees") { front += tree(5, 30, 1.1, "#5aa66a", "#4a9060") + tree(94, 32, 1, "#63b070", "#4a9060") + tree(20, 36, .7, "#6cb878", "#58a066"); }
  if (T.deco === "forest") { for (let i = 0; i < 9; i++) front += tree(4 + i * 11.5 + R() * 3, 22 + R() * 10, .9 + R() * .5, "#2f7a52", "#25664a"); }
  let flowers = ""; for (let i = 0; i < 26; i++) flowers += `<circle cx="${(R() * 98 + 1).toFixed(1)}" cy="${(R() * 9 + 58.5).toFixed(1)}" r=".7" fill="${pick(["#ffd1e3", "#fff3a0", "#ffffff", "#ffb3cf"])}"/>`;
  return `<svg class="bg" viewBox="0 0 100 68" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset="1" stop-color="${T.sky[1]}"/></linearGradient></defs>
<rect width="100" height="68" fill="url(#${id})"/>${deco}
<path d="M0 46 Q18 30 38 44 T72 40 T100 42 V68 H0Z" fill="${T.h1}"/><path d="M0 54 Q28 42 52 52 T100 48 V68 H0Z" fill="${T.h2}"/>
<rect y="56" width="100" height="12" fill="${T.g}"/><rect y="56" width="100" height="1.2" fill="#ffffff44"/>${flowers}${front}</svg>`;
}
function scene(T, seed = 1) { const s = el("div", "scene", sceneBG(T, seed)); return s; }

const BOXCOLORS = [
  { b: "#e0709a", d: "#b94f78", l: "#f08db1", r: "#ffe08a" }, { b: "#8a6fd1", d: "#6a4fb0", l: "#a58ae6", r: "#ffd0f0" },
  { b: "#4fb7b0", d: "#2f8f8c", l: "#6fd0c9", r: "#fff0a8" }, { b: "#f0b04a", d: "#c78428", l: "#ffc968", r: "#d94f7a" },
  { b: "#f27d6b", d: "#c9574a", l: "#ff9a88", r: "#fff3c2" }, { b: "#7bc77f", d: "#559c5c", l: "#98dd9b", r: "#ff8fb4" },
  { b: "#5aa4e8", d: "#3b7fc4", l: "#7dbdf5", r: "#ffe08a" }, { b: "#a63f68", d: "#7a2a4e", l: "#c25a85", r: "#ffd98a" }
];
function boxSVG(c) {
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="7" width="14" height="9" fill="#3d1a2e"/><rect x="2" y="8" width="12" height="7" fill="${c.b}"/><rect x="3" y="7" width="10" height="1" fill="#fff2a0"/><rect x="2" y="14" width="12" height="1" fill="${c.d}"/><rect x="7" y="8" width="2" height="7" fill="${c.r}"/><rect x="3" y="9" width="2" height="1" fill="#ffffff99"/>
<g class="lid"><rect x="0" y="4" width="16" height="5" fill="#3d1a2e"/><rect x="1" y="5" width="14" height="3" fill="${c.l}"/><rect x="1" y="7" width="14" height="1" fill="${c.d}"/><rect x="7" y="5" width="2" height="3" fill="${c.r}"/><rect x="4" y="2" width="4" height="3" fill="#3d1a2e"/><rect x="8" y="2" width="4" height="3" fill="#3d1a2e"/><rect x="5" y="3" width="2" height="1" fill="${c.r}"/><rect x="9" y="3" width="2" height="1" fill="${c.r}"/><rect x="7" y="3" width="2" height="2" fill="${c.r}"/></g></svg>`;
}
const BUSH = `<svg viewBox="0 0 60 46"><ellipse cx="30" cy="40" rx="28" ry="6" fill="#0003"/><circle cx="14" cy="28" r="13" fill="#4f9a55"/><circle cx="46" cy="28" r="13" fill="#4f9a55"/><circle cx="30" cy="20" r="17" fill="#62b468"/><circle cx="20" cy="30" r="9" fill="#74c67a"/><circle cx="40" cy="31" r="9" fill="#5aa860"/><circle cx="24" cy="14" r="2.2" fill="#ffd1e3"/><circle cx="38" cy="22" r="2.2" fill="#fff3a0"/><circle cx="14" cy="26" r="2.2" fill="#ffb3cf"/><circle cx="46" cy="28" r="2.2" fill="#ffd1e3"/></svg>`;
function burstPoly(cx, cy, r1, r2, n) { const p = []; for (let k = 0; k < n * 2; k++) { const a = Math.PI * k / n, r = k % 2 ? r1 : r2; p.push((cx + Math.cos(a) * r).toFixed(1) + "," + (cy + Math.sin(a) * r).toFixed(1)); } return p.join(" "); }
const BAM = `<svg viewBox="0 0 124 88"><polygon points="${burstPoly(62, 44, 30, 60, 14)}" fill="#ffd34d" stroke="#c2185b" stroke-width="4" stroke-linejoin="round"/><polygon points="${burstPoly(62, 44, 22, 44, 14)}" fill="#fff3a0"/><text x="62" y="58" text-anchor="middle" font-size="36" font-weight="bold" font-family="Georgia,serif" font-style="italic" fill="#d6336c" stroke="#fff" stroke-width="3" paint-order="stroke">BAM !</text></svg>`;
const MAPSVG = `<svg viewBox="0 0 120 90"><g class="rays"><polygon points="${burstPoly(60, 45, 46, 74, 16)}" fill="#fff3a0" opacity=".65"/></g>
<path d="M6 10 L20 6 L40 11 L62 5 L84 10 L106 6 L114 12 L110 30 L115 48 L109 68 L113 82 L92 86 L70 81 L48 87 L26 82 L8 86 L12 66 L6 46 L11 28Z" fill="#f3dcab" stroke="#a8723c" stroke-width="3" stroke-linejoin="round"/>
<path d="M14 16 L40 15 M70 14 L100 16 M16 78 L44 80 M74 78 L100 76" stroke="#d9b97e" stroke-width="2" stroke-linecap="round"/>
<path d="M16 68 L30 46 L40 60 L52 40 L68 68Z" fill="#c9a36c" stroke="#8a5a2f" stroke-width="2" stroke-linejoin="round"/><path d="M52 40 L47 48 L52 46 L56 50Z" fill="#fff"/>
<path d="M72 60 q8 -6 16 0 t16 0" stroke="#6fb0d8" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<circle cx="96" cy="68" r="6" fill="#5aa660"/><rect x="95" y="68" width="2" height="7" fill="#7a4a3a"/>
<path class="mpath" pathLength="130" d="M22 76 C40 40 62 80 80 44 S92 34 98 25" stroke="#c0392b" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="130"/>
<g class="mx" stroke="#c0392b" stroke-width="6" stroke-linecap="round"><path d="M92 18 L104 30"/><path d="M104 18 L92 30"/></g></svg>`;
const CHEST = `<svg viewBox="0 0 100 80"><ellipse class="gl" cx="50" cy="34" rx="50" ry="34" fill="#ffe27a" opacity=".55"/>
<rect x="8" y="38" width="84" height="40" rx="4" fill="#8a4b2f" stroke="#3d1a1a" stroke-width="3"/><rect x="8" y="38" width="84" height="7" fill="#a45f3a"/><path d="M8 58H92" stroke="#5e3220" stroke-width="2"/>
<rect x="18" y="38" width="9" height="40" fill="#f0bd4b" stroke="#a8761f" stroke-width="2"/><rect x="73" y="38" width="9" height="40" fill="#f0bd4b" stroke="#a8761f" stroke-width="2"/>
<g class="gl"><ellipse cx="50" cy="39" rx="38" ry="6" fill="#fff2a0"/><circle cx="30" cy="36" r="4.5" fill="#f6c850" stroke="#a8761f"/><circle cx="44" cy="34" r="4.5" fill="#ffd96a" stroke="#a8761f"/><circle cx="58" cy="35" r="4.5" fill="#f6c850" stroke="#a8761f"/><circle cx="70" cy="36" r="4.5" fill="#ffd96a" stroke="#a8761f"/></g>
<text x="50" y="72" text-anchor="middle" font-size="31" font-weight="bold" font-family="Georgia,serif" fill="#fff3b0" stroke="#6a3410" stroke-width="3.5" paint-order="stroke">30</text>
<g class="lid"><path d="M8 40 Q8 8 50 8 Q92 8 92 40Z" fill="#9c5834" stroke="#3d1a1a" stroke-width="3"/><path d="M14 14 Q30 10 50 10" stroke="#c98456" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="18" y="12" width="9" height="28" fill="#f0bd4b" stroke="#a8761f" stroke-width="2"/><rect x="73" y="12" width="9" height="28" fill="#f0bd4b" stroke="#a8761f" stroke-width="2"/><rect x="43" y="30" width="14" height="14" rx="3" fill="#f6c850" stroke="#a8761f" stroke-width="2"/><circle cx="50" cy="36" r="2.2" fill="#6a3410"/></g></svg>`;
function badge(n) {
  return `<svg viewBox="0 0 60 52"><defs><linearGradient id="bg${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a73a64"/><stop offset="1" stop-color="#5a1e3d"/></linearGradient></defs><polygon points="15,2 45,2 58,26 45,50 15,50 2,26" fill="url(#bg${n})" stroke="#e8bd7d" stroke-width="3" stroke-linejoin="round"/><text x="30" y="35" text-anchor="middle" font-size="${n > 9 ? 25 : 29}" font-weight="bold" font-family="Georgia,serif" fill="#fff4e7">${n}</text></svg>`;
}
function chapter(html, n) { const c = el("div", "chap"); c.append(el("div", null, html)); if (n != null) c.append(el("div", "badge", badge(n))); return c; }

/* ====================== Cartes de texte ====================== */
function fit(card, txt, max = 4.6, min = 2.4) {
  const u = book.clientWidth / 100; let s = max; txt.style.fontSize = (s * u) + "px";
  while (txt.offsetHeight > card.clientHeight - 6 * u && s > min) { s -= .2; txt.style.fontSize = (s * u) + "px"; }
}
function setHint(card, t) { card.innerHTML = ""; card.append(el("div", "hint", t)); }
function setText(card, t) { card.innerHTML = ""; const x = el("div", "txt"); x.textContent = t; card.append(x); requestAnimationFrame(() => fit(card, x)); }
function newCard(hint) { const c = el("div", "card"); if (hint) setHint(c, hint); return c; }

/* ====================== Pages ====================== */
function pageEl(cls = "") { return el("div", "pg " + cls); }
function unlock(i) { st.unlocked[i] = true; save(); if (i === cur) Cat.pop(i); }

function bCover(i) {
  const p = pageEl("cover"); p.innerHTML = '<img src="assets/couverture.jpg" alt="Couverture : La Quête de Mymy">';
  st.unlocked[i] = true;
  if (st.max > 1) {
    const r = el("button", "chip sec", `Reprendre ma quête (page ${st.max + 1})`); r.style.left = U(4); r.style.transform = "none"; r.style.bottom = U(3);
    r.addEventListener("click", e => { e.stopPropagation(); Snd.init(); Snd.music("main"); jump(st.max); });
    p.append(r);
  }
  return p;
}

function bIntro(i) {
  const p = pageEl(), t = el("div", "intro-txt");
  const lines = ["Il était une fois une aventurière qui pensait simplement fêter ses 30 ans…", "Mais cette année, une quête extraordinaire l'attendait.", "Trente trésors ont été dispersés. Cinq compagnons ont répondu à l'appel.", "Et une seule héroïne pourra les retrouver…"];
  const ps = lines.map((l, k) => { const e = el("p", k === 3 ? "big" : "", l); t.append(e); return e; });
  p.append(t);
  const order = [["kithim", 13], ["mathieu", 28], ["elona", 43], ["mymy", 58], ["jordan", 73], ["dori", 88]], nm = { kithim: "Kithim", mathieu: "Mathieu", elona: "Elona", mymy: "Mymy", jordan: "Jordan", dori: "Dori" };
  order.forEach(([n, x]) => { const h = hero(n, { s: .72, maxw: 17, cx: x }); h.style.bottom = U(30); p.append(h); const l = el("div", "names", nm[n]); l.style.left = U(x); l.style.top = U(121); l.style.fontSize = U(2.6); p.append(l); });
  const done = !!st.unlocked[i];
  if (done) ps.forEach(e => e.classList.add("in"));
  p._start = () => {
    if (done) return;
    let k = 0, timer;
    const next = () => { if (!p.isConnected) return; if (k < ps.length) { ps[k++].classList.add("in"); Snd.sfx("tap"); timer = setTimeout(next, 1900); } else unlock(i); };
    p.addEventListener("pointerdown", () => { clearTimeout(timer); ps.forEach(e => e.classList.add("in")); k = ps.length; setTimeout(() => unlock(i), 700); }, { once: true });
    timer = setTimeout(next, 400);
  };
  return p;
}

function bMap(i) {
  const p = pageEl(); p.append(chapter("✦ Chapitre 1 ✦ La carte mystérieuse"));
  const sc = scene(THEMES[4], 3), card = newCard("✦ Les compagnons arrivent… ✦");
  p.append(sc, card);
  const done = !!st.unlocked[i];
  const names = [["kithim", 8], ["mathieu", 20.5], ["elona", 33], ["mymy", 45.5], ["jordan", 58], ["dori", 70.5]];
  const line = names.map(([n, x]) => { const a = hero(n, { s: .6, maxw: 14.5, cx: x + 2 }); a.style.bottom = U(4); a.style.opacity = done ? 1 : 0; a.style.transition = "opacity .5s"; sc.append(a); return a; });
  const map = el("div", "map", MAPSVG), bam = el("div", "bam", BAM);
  sc.append(map, bam);
  if (done) { map.classList.add("gone"); setText(card, MAP_TXT); }
  p._start = () => {
    if (done) return;
    const g = actor("groupe", 14, { l: -55, b: 3, bob: false }); g.style.transition = "left 2.6s linear"; sc.append(g); play(g._spr, 0, 8, { fps: 1000 / 120 });
    requestAnimationFrame(() => requestAnimationFrame(() => { g.style.left = U(16); }));
    setTimeout(() => {
      if (!p.isConnected) return;
      g.style.transition = "opacity .5s"; g.style.opacity = 0; line.forEach(a => a.style.opacity = 1); setTimeout(() => g.remove(), 600);
      ready = true; setHint(card, "✦ Touche la carte au trésor ! (0/5) ✦"); map.dataset.s = 0;
    }, 2700);
    let ready = false, taps = 0;
    map.addEventListener("pointerdown", e => {
      e.preventDefault(); if (!ready || taps >= 5) return; Snd.init(); taps++;
      map.classList.remove("tap"); void map.offsetWidth; map.classList.add("tap"); Snd.sfx("tapn", taps);
      burst(sc, 41, 14, 8);
      if (taps < 5) { map.dataset.s = taps; setHint(card, `✦ Encore ! Touche la carte (${taps}/5) ✦`); }
      else {
        ready = false; Snd.sfx("bam"); bam.classList.add("go"); map.classList.add("gone"); burst(sc, 41, 26, 46);
        line.forEach(a => heroJoy(a));
        setTimeout(() => { setText(card, MAP_TXT); line.forEach(a => heroIdle(a)); unlock(i); }, 1300);
      }
    });
  };
  return p;
}

const GTYPES = ["tap", "shake", "cat", "bushes", "hold", "run"];
const GHERO = ["mymy", "dori", "kithim", "jordan", "mathieu", "elona"];
const GHINT = { tap: "✦ Touche le cadeau pour l'ouvrir ✦", shake: "✦ Secoue le cadeau : touche-le 3 fois ✦", cat: "✦ Touche le chat : il va t'aider ✦", bushes: "✦ Le cadeau se cache sous un buisson ✦", hold: "✦ Maintiens ton doigt sur le cadeau ✦", run: "✦ Touche le sol : ton héros court au cadeau ✦" };
function bGift(i) {
  const def = PAGES[i], n = def.n, done = !!st.unlocked[i];
  const type = GTYPES[(n - 1) % 6], hn = GHERO[((n - 1) + Math.floor((n - 1) / 6)) % 6], T = THEMES[THEME_ORDER[(n - 1) % 12]], col = BOXCOLORS[(n - 1) % 8];
  const p = pageEl(); p.append(chapter("Cadeau n°", n));
  const sc = scene(T, n), card = newCard(GHINT[type]); p.append(sc, card);
  const h = hero(hn, { l: type === "bushes" ? -1 : type === "run" ? 2 : 5 });
  const cn = n % 2 ? "vaia" : "murphy", c = cat(cn, 10.5, { l: type === "cat" ? 66 : type === "run" ? 36 : 66 });
  let bx = { tap: 52, shake: 52, hold: 52, cat: 42, run: 70, bushes: 51 }[type];
  const box = el("div", "gbox idle", `<div class="glow"></div>${boxSVG(col)}<div class="ring"></div>`); box.style.left = U(bx);
  sc.append(h); if (type !== "bushes") sc.append(c); sc.append(box);
  let opened = false;
  const reveal = (user) => {
    if (opened) return; opened = true;
    box.classList.remove("idle", "shake"); box.style.display = ""; box.classList.add("open");
    if (user) { Snd.sfx("open"); burst(sc, bx, 40, 34); heroJoy(h); if (type !== "bushes") { c.classList.add("hop"); } setTimeout(() => { if (!p.isConnected) return; heroIdle(h); c.classList.remove("hop"); }, 2600); }
    setText(card, def.t); unlock(i);
  };
  if (done) { opened = true; box.classList.remove("idle"); box.classList.add("open"); setText(card, def.t); return p; }
  if (type === "tap") box.addEventListener("pointerdown", e => { e.preventDefault(); Snd.init(); reveal(true); });
  if (type === "shake") {
    let k = 0;
    box.addEventListener("pointerdown", e => {
      e.preventDefault(); Snd.init(); if (opened) return; k++; box.classList.remove("shake", "idle"); void box.offsetWidth; box.classList.add("shake"); Snd.sfx("tapn", k);
      if (k < 3) setHint(card, `✦ Encore ! (${k}/3) ✦`); else setTimeout(() => reveal(true), 250);
    });
  }
  if (type === "hold") {
    let raf = 0, t0 = 0;
    const stop = () => { cancelAnimationFrame(raf); if (!opened) { box.style.setProperty("--p", 0); box.querySelector(".ring").style.setProperty("--p", 0); box.classList.remove("holding"); } };
    const stepF = now => { const pr = Math.min(1, (now - t0) / 1300), r = box.querySelector(".ring"); r.style.setProperty("--p", pr * 100); if (pr >= 1) { box.classList.remove("holding"); reveal(true); } else raf = requestAnimationFrame(stepF); };
    box.addEventListener("pointerdown", e => { e.preventDefault(); Snd.init(); if (opened) return; box.classList.remove("idle"); box.classList.add("holding"); Snd.sfx("tap"); t0 = performance.now(); raf = requestAnimationFrame(stepF); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(ev => box.addEventListener(ev, stop));
  }
  if (type === "run") {
    let go = false;
    sc.addEventListener("pointerdown", e => {
      if (go || opened) return; Snd.init(); go = true; Snd.sfx("tap"); setHint(card, "✦ Il arrive ! ✦");
      h.style.transition = "left 1.2s linear"; h.style.left = U(bx - 7.5 - h._w + 5); heroRun(h);
      const sti = setInterval(() => Snd.sfx("step"), 200);
      setTimeout(() => { clearInterval(sti); if (!p.isConnected) return; heroIdle(h); reveal(true); }, 1250);
    });
  }
  if (type === "cat") {
    let go = false; c.style.cursor = "pointer"; c._spr.style.pointerEvents = "auto"; c.style.zIndex = 5;
    const hit = e => {
      e.preventDefault(); if (go || opened) return; Snd.init(); go = true; Snd.sfx("tap");
      c._spr.classList.add("flip"); c.style.transition = "left 1s linear"; c.style.left = U(bx + 7); play(c._spr, ...CATRUN[cn], { fps: 11 });
      setTimeout(() => { if (!p.isConnected) return; box.classList.remove("idle"); box.classList.add("bump"); say(sc, "Miaou !", bx + 12, 22); play(c._spr, 0, 1, { fps: 1.4 }); }, 1000);
      setTimeout(() => reveal(true), 1500);
    };
    c._spr.addEventListener("pointerdown", hit); box.addEventListener("pointerdown", hit);
  }
  if (type === "bushes") {
    box.style.display = "none"; const xs = [28, 51, 74], hid = Math.floor(Math.random() * 3); let found = false;
    xs.forEach((x, k) => {
      const b = el("div", "bush", BUSH); b.style.left = U(x); sc.append(b);
      b.addEventListener("pointerdown", e => {
        e.preventDefault(); Snd.init(); if (found || opened) return;
        if (k === hid) { found = true; Snd.sfx("tap"); b.classList.add("up"); box.style.left = U(x); bx = x; box.style.display = ""; box.classList.add("idle"); setTimeout(() => reveal(true), 700); }
        else { Snd.sfx("miss"); b.classList.remove("wig"); void b.offsetWidth; b.classList.add("wig"); say(sc, pick(["Rien ici…", "Pas là !", "Raté !"]), x, 36); }
      });
    });
  }
  return p;
}

function bFinal(i) {
  const done = !!st.unlocked[i];
  const p = pageEl(); p.append(chapter("Le trésor ultime · cadeau n°", 30));
  const sc = scene(THEMES[6], 30), card = newCard("✦ Les compagnons arrivent dans la clairière… ✦");
  p.append(sc, card);
  const chest = el("div", "chest", CHEST), bam = el("div", "bam", BAM); sc.append(chest, bam);
  const troph = actor("trophee", 42, { cx: 41, b: 3, bob: false }); troph.style.opacity = 0; troph.style.transition = "opacity .7s"; sc.append(troph);
  if (done) { play(troph._spr, 0, 5, { fps: 1000 / 350 }); troph.style.opacity = 1; setText(card, FINAL_TXT); return p; }
  p._start = () => {
    const g = actor("groupe", 14, { l: -55, b: 3, bob: false }); g.style.transition = "left 2.6s linear"; sc.append(g); play(g._spr, 0, 8, { fps: 1000 / 120 });
    requestAnimationFrame(() => requestAnimationFrame(() => { g.style.left = U(16); }));
    let stage = 0, taps = 0, dig = null;
    setTimeout(() => {
      if (!p.isConnected) return;
      dig = actor("tresor", 70, { cx: 41, b: 0, bob: false }); dig._spr.classList.add("fade"); still(dig._spr, 0); sc.append(dig); sc.style.background = "#1c2a1a"; sc.querySelector(".bg").style.opacity = 0;
      g.style.transition = "opacity .4s"; g.style.opacity = 0; setTimeout(() => g.remove(), 500);
      stage = 1; setHint(card, "✦ Touche pour creuser ! (0/3) ✦");
    }, 2800);
    sc.addEventListener("pointerdown", () => {
      if (stage !== 1) return; Snd.init(); taps++; Snd.sfx("tapn", taps); burst(sc, 41, 48, 10);
      if (taps === 1) play(dig._spr, 0, 1, { fps: 5, loop: false });
      if (taps === 2) play(dig._spr, 1, 2, { fps: 5, loop: false });
      if (taps < 3) { setHint(card, `✦ Creuse encore ! (${taps}/3) ✦`); return; }
      stage = 2; setHint(card, "✦ Il y a quelque chose… ✦");
      play(dig._spr, 2, 3, { fps: 3, loop: false, done: () => {
        setTimeout(() => {
          if (!p.isConnected) return;
          Snd.sfx("bam"); bam.classList.add("go"); sc.querySelector(".bg").style.opacity = 1; dig.style.transition = "opacity .5s"; dig.style.opacity = 0; burst(sc, 41, 30, 50);
          setTimeout(() => { chest.classList.add("in"); stage = 3; setHint(card, "✦ Touche le coffre ✦"); }, 900);
        }, 500);
      } });
    });
    let hasKey = false;
    const openChest = () => {
      stage = 4; Snd.sfx("win"); Snd.music("finale");
      chest.classList.add("open"); burst(sc, 41, 34, 60); setTimeout(() => burst(sc, 20, 30, 30), 300); setTimeout(() => burst(sc, 62, 30, 30), 500);
      setText(card, FINAL_TXT);
      setTimeout(() => { chest.style.transition = "opacity .8s"; chest.style.opacity = 0; troph.style.opacity = 1; play(troph._spr, 0, 5, { fps: 1000 / 350 }); burst(sc, 41, 20, 40); }, 2200);
      setTimeout(() => unlock(i), 1500);
    };
    chest.addEventListener("pointerdown", e => {
      e.preventDefault(); if (stage !== 3) return; Snd.init();
      if (hasKey) return;
      stage = 3.5; Snd.sfx("miss"); burst(sc, 41, 30, 10); say(sc, "Verrouillé ! 🔒", 41, 10);
      setText(card, "Le coffre est verrouillé ! Une clé est cachée dans la grotte aux cristaux…");
      setTimeout(() => {
        if (!p.isConnected) return;
        portal("La clé t'appelle…", () => {
          Snd.music("night");
          Cave.start(book, { snd: Snd, onWin: () => {
            portal("Retour au coffre…", () => {
              Cave.close(); hasKey = true; stage = 3.8; setHint(card, "✦ Tu as la clé ! ✦");
              const k = el("div", "keyfly", KEYSVG); sc.append(k);
              requestAnimationFrame(() => requestAnimationFrame(() => k.classList.add("go")));
              setTimeout(() => { k.remove(); if (p.isConnected) openChest(); }, 1300);
            });
          } });
        });
      }, 2200);
    });
  };
  return p;
}

const KEYSVG = '<svg viewBox="0 0 30 48"><defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a6"/><stop offset=".5" stop-color="#f3c64f"/><stop offset="1" stop-color="#bd7826"/></linearGradient></defs><g fill="url(#kg)" stroke="#fff0ad" stroke-width="2"><path d="M15 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill-rule="evenodd"/><rect x="12" y="19" width="6" height="26"/><rect x="18" y="33" width="9" height="4"/><rect x="18" y="40" width="6" height="4"/></g></svg>';
function portal(text, mid) {
  Snd.sfx("bam");
  const pt = el("div", "portal show", '<div class="pv"><i></i><i></i><i></i><b></b></div><div class="pm"></div><div class="pcap"></div>');
  pt.lastChild.textContent = text; const m = hero("mymy", { s: .95, bob: false }); m.className = "actor"; pt.querySelector(".pm").append(m); heroRun(m);
  book.append(pt);
  setTimeout(mid, 1200); setTimeout(() => pt.remove(), 2400);
}
function bBack(i) {
  const p = pageEl("back"); p.innerHTML = '<img src="assets/dos.jpg" alt="Dos du livre : La Quête de Mymy">';
  const r = el("button", "chip pulse", "↻ Rejouer l'aventure"); r.style.bottom = "auto"; r.style.top = U(2.5);
  r.addEventListener("click", () => { Snd.sfx("tap"); jump(0); });
  p.append(r); st.unlocked[i] = true; return p;
}
const BUILD = { cover: bCover, intro: bIntro, map: bMap, gift: bGift, final: bFinal, back: bBack };
function build(i) { return BUILD[PAGES[i].k](i); }

/* ====================== Le chat qui tourne les pages ====================== */
const Cat = {
  el: $("#navcat"), a: null,
  pop(i) {
    if (PAGES[i].k === "back") { this.hide(); return; }
    const n = i % 2 ? "murphy" : "vaia";
    this.el.className = ""; this.el.innerHTML = "";
    this.a = cat(n, 15, { bob: false }); this._n = n; this.el.append(this.a);
    this.el.append(el("div", "tip", i === 0 ? "Ouvre le livre !" : "Tourne la page !"));
    void this.el.offsetWidth; this.el.classList.add("show");
  },
  hide() { this.el.className = ""; this.el.innerHTML = ""; },
  run(cb) {
    if (!this.a) return; this.el.classList.add("run"); this.a._spr.classList.add("flip"); play(this.a._spr, ...CATRUN[this._n], { fps: 12 });
    setTimeout(cb, 300); setTimeout(() => this.hide(), 1000);
  }
};
Cat.el.addEventListener("pointerdown", e => {
  e.preventDefault(); if (busy || !Cat.el.classList.contains("show") || Cat.el.classList.contains("run")) return;
  Snd.init(); Snd.music(musicFor(cur)); Cat.run(() => go(cur + 1));
});

/* ====================== Navigation / tour de page ====================== */
let cur = 0, curEl = null, busy = false;
const prevBtn = $("#prev");
function musicFor(i) { const k = PAGES[i].k; if (k === "final") return "night"; if (k === "gift") { return THEMES[THEME_ORDER[(PAGES[i].n - 1) % 12]].deco === "stars" ? "night" : "main"; } return "main"; }
function afterMount(i, node) {
  cur = i; curEl = node; st.max = Math.max(st.max || 0, i); save();
  prevBtn.classList.toggle("show", i > 0);
  if (node._start) node._start();
  if (st.unlocked[i]) setTimeout(() => { if (cur === i && !busy) Cat.pop(i); }, 500);
  else Cat.hide();
  if (Snd.on && Snd.ctx) Snd.music(musicFor(i));
}
function mount(i) { const n = build(i); book.insertBefore(n, book.firstChild); if (n._post) n._post(); return n; }
function jump(i) {
  if (busy) return; Cat.hide(); if (window.Cave) Cave.close(); if (window.Village) Village.close(); document.querySelectorAll(".portal").forEach(x => x.remove()); if (curEl) curEl.remove(); document.querySelectorAll(".leaf").forEach(l => l.remove());
  afterMount(i, mount(i));
}
function go(i) {
  if (busy || i < 0 || i >= PAGES.length || i === cur) return;
  busy = true; prevBtn.classList.remove("show"); Snd.sfx("flip");
  const fwd = i > cur, old = curEl, leaf = el("div", "leaf"), front = el("div", "face front"), back = el("div", "face backface");
  leaf.append(front, back);
  const nu = build(i);
  if (fwd) {
    book.insertBefore(nu, book.firstChild); front.append(old); book.append(leaf);
    void leaf.offsetWidth; leaf.classList.add("turn");
  } else {
    book.insertBefore(old, book.firstChild); front.append(nu); leaf.classList.add("turn"); book.append(leaf);
    void leaf.offsetWidth; leaf.classList.remove("turn");
  }
  setTimeout(() => {
    if (fwd) { leaf.remove(); old.remove(); }
    else { book.insertBefore(nu, book.firstChild); leaf.remove(); old.remove(); }
    busy = false; afterMount(i, nu);
  }, 1000);
}
prevBtn.addEventListener("click", () => { Snd.init(); go(cur - 1); });
window.addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { if (Cat.el.classList.contains("show") && !busy) { e.preventDefault(); Cat.el.dispatchEvent(new Event("pointerdown")); } }
  if (e.key === "ArrowLeft") go(cur - 1);
});

/* ====================== Menu ====================== */
const menu = $("#menu");
$("#gear").addEventListener("click", () => { $("#mSound").textContent = Snd.on ? "🔊 Son activé" : "🔇 Son coupé"; $("#mConfirm").style.display = "none"; menu.classList.add("show"); });
$("#mClose").addEventListener("click", () => menu.classList.remove("show"));
$("#mSound").addEventListener("click", () => { const on = Snd.toggle(); $("#mSound").textContent = on ? "🔊 Son activé" : "🔇 Son coupé"; });
$("#mCover").addEventListener("click", () => { menu.classList.remove("show"); jump(0); });
$("#mReset").addEventListener("click", () => { $("#mConfirm").style.display = "block"; });
$("#mYes").addEventListener("click", () => { st = { max: 0, unlocked: {} }; save(); menu.classList.remove("show"); jump(0); village(); });
$("#mVillage").addEventListener("click", () => { menu.classList.remove("show"); jump(0); village(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden && Snd.ctx && Snd.on && Snd.ctx.state === "suspended") Snd.ctx.resume(); });

/* ====================== Démarrage ====================== */
function village() { window.__vil = Village.start(book, { el, U, hero, heroRun, heroIdle, heroJoy, cat, Snd, actor, play, META }, () => { st.village = true; save(); }); }
["assets/page-vierge.jpg", "assets/couverture.jpg", "assets/dos.jpg"].concat(Object.keys(META).map(k => `assets/sprites/${k}.png`)).forEach(s => { const im = new Image(); im.src = s; });
st.max = Math.min(st.max || 0, PAGES.length - 1);
cur = -1; curEl = null;
const first = mount(0); afterMount(0, first);
if (!st.village) village(); // le village (mots de chacun) s'ouvre avant le livre // on démarre toujours sur la couverture (un bouton permet de reprendre)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
window.__book = { go, jump, PAGES, st }; // pratique pour les tests
})();
