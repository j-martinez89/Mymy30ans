/* Le village des six maisons — prélude avant d'ouvrir le livre */
window.Village = (() => {
"use strict";
const W = 605, BOOKX = 563, SPEED = 34;
const HOUSES = [
  { n: "Mymy", x: 40, wall: "#f0a3b6", roof: "#a93f69", room: ["#f4c8dc", "#c05b88"], who: "mymy",
    msg: "Bienvenue chez toi, Mymy ! ❤️ Aujourd'hui, tes compagnons t'ont préparé une aventure toute spéciale pour tes 30 ans. Sors découvrir le village : chacun t'attend dans sa maison avec un petit mot." },
  { n: "Dori", x: 125, wall: "#b9a6dc", roof: "#71559d", room: ["#ded3f3", "#8b6bb5"], who: "dori",
    msg: "Joyeux anniversaire Mymy ! ❤️ Profite de chaque instant, de chaque surprise et de cette nouvelle dizaine. Je suis sûre que tu vas trouver le trésor ultime. Je t'aime fort !" },
  { n: "Jordan", x: 210, wall: "#f0cf86", roof: "#b7793f", room: ["#f5dfaa", "#ba8a48"], who: "jordan",
    msg: "30 ans, ça se fête comme une vraie aventure ! Garde ton courage, suis les indices et ne lâche rien. Le plus beau trésor t'attend au bout du chemin. Joyeux anniversaire !" },
  { n: "Mathieu", x: 295, wall: "#eaa57e", roof: "#a74f3d", room: ["#f3c8ad", "#b66b50"], who: "mathieu",
    msg: "Ma chérie, joyeux anniversaire ! ❤️ Que cette quête soit remplie de surprises, de rires et de beaux souvenirs. Tu as déjà trouvé cinq compagnons… il ne manque plus que le trésor ultime !" },
  { n: "Elona", x: 380, wall: "#b4d49c", roof: "#5f8b61", room: ["#d4e5c7", "#6e9a68"], who: "elona",
    msg: "Joyeux 30 ans Mymy ! ✨ Je te souhaite plein de bonheur, de magie et de jolies découvertes. Continue d'avancer : on croit tous en toi, et on espère te voir ouvrir le dernier trésor !" },
  { n: "Kithim", x: 465, wall: "#8fd3cb", roof: "#3f8a86", room: ["#cfe9e4", "#4f9a95"], who: "kithim",
    msg: "Joyeux anniversaire Mymy ! 🎸 Je suis le dernier arrivé dans l'aventure, mais pas le moins motivé ! Ouvre grand les yeux : un trésor t'attend au bout du chemin. Je t'envoie plein de bonne humeur et de musique. Profite bien de ta journée !" }
];
let root = null, raf = 0, offs = [];

function tree(x, base, s) {
  const pink = ["#f2a2c0", "#f7bfd3"], green = ["#6fbf6a", "#8fd17f"], c = Math.random() < .6 ? pink : green;
  return `<g transform="translate(${x} ${base}) scale(${s})"><rect x="-1.4" y="-14" width="2.8" height="14" fill="#7a4a3a"/><circle cx="0" cy="-19" r="8" fill="${c[0]}"/><circle cx="-6" cy="-14" r="6" fill="${c[1]}"/><circle cx="6" cy="-14" r="6.4" fill="${c[0]}"/><circle cx="0" cy="-25" r="5.4" fill="${c[1]}"/></g>`;
}
function house(h, base) {
  const x = h.x, d = "#6b4540";
  return `<g>
  <rect x="${x - 17}" y="${base - 24}" width="34" height="24" fill="${h.wall}" stroke="${d}" stroke-width=".7"/>
  <rect x="${x + 8}" y="${base - 42}" width="5" height="12" fill="#8a5a4a" stroke="${d}" stroke-width=".5"/>
  <polygon points="${x - 22},${base - 22} ${x},${base - 41} ${x + 22},${base - 22}" fill="${h.roof}" stroke="${d}" stroke-width=".8" stroke-linejoin="round"/>
  <rect x="${x - 9.5}" y="${base - 31}" width="19" height="6.4" rx="1.2" fill="#fbeab8" stroke="${d}" stroke-width=".45"/>
  <text x="${x}" y="${base - 26.2}" text-anchor="middle" font-size="3.9" font-weight="bold" font-family="Georgia,serif" fill="#704052">${h.n}</text>
  <rect x="${x - 4.5}" y="${base - 15}" width="9" height="15" rx="4.5" ry="4.5" fill="#7a4a3a" stroke="${d}" stroke-width=".5"/>
  <circle cx="${x + 2}" cy="${base - 7}" r=".7" fill="#f0c36a"/>
  <rect x="${x - 15}" y="${base - 19}" width="7" height="8" fill="#fff0b0" stroke="${d}" stroke-width=".5"/><path d="M${x - 11.5} ${base - 19}v8M${x - 15} ${base - 15}h7" stroke="${d}" stroke-width=".4"/>
  <rect x="${x + 8}" y="${base - 19}" width="7" height="8" fill="#fff0b0" stroke="${d}" stroke-width=".5"/><path d="M${x + 11.5} ${base - 19}v8M${x + 8} ${base - 15}h7" stroke="${d}" stroke-width=".4"/>
  <rect x="${x - 7}" y="${base}" width="14" height="2.2" fill="#b89368"/>
  </g>`;
}
function scenery() {
  let s = 11; const R = () => (s = s * 16807 % 2147483647) / 2147483647;
  let o = `<svg viewBox="0 0 ${W} 150" preserveAspectRatio="none"><defs><linearGradient id="vgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ad57e"/><stop offset="1" stop-color="#6bb25a"/></linearGradient></defs>`;
  for (let x = 0; x < W; x += 105) { const y = 14 + R() * 18; o += `<g fill="#fff" opacity=".85"><ellipse cx="${x + 20}" cy="${y}" rx="12" ry="4.5"/><ellipse cx="${x + 30}" cy="${y - 3}" rx="8" ry="4.5"/><ellipse cx="${x + 11}" cy="${y - 1.5}" rx="7" ry="3.6"/></g>`; }
  let hd = "M0 80"; for (let x = 0; x < W; x += 60) hd += ` Q${x + 30} ${58 + R() * 14} ${x + 60} ${70 + R() * 6}`; hd += ` L${W} 90 L0 90Z`;
  o += `<path d="${hd}" fill="#b7dcae"/><rect x="0" y="76" width="${W}" height="74" fill="url(#vgg)"/>`;
  o += `<rect x="0" y="108" width="${W}" height="21" fill="#ecd5a0"/><rect x="0" y="108" width="${W}" height="1.4" fill="#cdb078"/><rect x="0" y="127.6" width="${W}" height="1.4" fill="#cdb078"/>`;
  for (let k = 0; k < 90; k++) o += `<ellipse cx="${R() * W}" cy="${111 + R() * 15}" rx="${.8 + R() * .9}" ry=".5" fill="#d4ba84"/>`;
  for (let k = 0; k < 150; k++) { const y = R() < .5 ? 79 + R() * 27 : 129.5 + R() * 20, c = ["#fff", "#ffd5e4", "#ffe58a", "#f59ab9"][Math.floor(R() * 4)]; o += `<circle cx="${R() * W}" cy="${y}" r=".75" fill="${c}"/>`; }
  for (let i = 0; i < HOUSES.length - 1; i++) { const m = (HOUSES[i].x + HOUSES[i + 1].x) / 2; o += tree(m - 8, 101, .95 + R() * .3) + tree(m + 10, 99, .8 + R() * .3); }
  o += tree(10, 100, 1) + tree(515, 100, 1) + tree(530, 98, .85) + tree(595, 101, 1.05);
  HOUSES.forEach(h => { o += house(h, 109); });
  return o + "</svg>";
}

function close() {
  if (raf) cancelAnimationFrame(raf); raf = 0;
  offs.forEach(f => f()); offs = [];
  if (root) { root.remove(); root = null; }
}

function start(book, A, onDone) {
  close();
  const { el, U, hero, heroRun, heroIdle, heroJoy, cat, Snd } = A;
  root = el("div", "vl");
  const world = el("div", "vw", scenery()); world.style.width = U(W); root.append(world);
  const place = (a, cx, b) => { a.style.left = U(cx - a._w / 2); a.style.bottom = U(b); world.append(a); return a; };
  // compagnons devant leurs maisons, chats dans le village
  HOUSES.forEach(h => { if (h.who !== "mymy") place(hero(h.who, { h: h.who === "kithim" ? 19 : 21 }), h.x + 25, 26); });
  place(cat("vaia", 10), 70, 25); place(cat("murphy", 9.5), 262, 25); place(cat("vaia", 10), 520, 25);
  // le livre lumineux au bout du chemin
  const bk = el("div", "vl-book", '<i></i><img src="assets/couverture.jpg" alt="">'); bk.style.left = U(BOOKX - 11); world.append(bk);
  const me = hero("mymy", { h: 22 }); me.style.bottom = U(24); world.append(me);

  const top = el("div", "vl-top", '<b>🌸 Le village des six maisons</b><span></span>'); root.append(top);
  const hint = top.lastChild;
  const ctrl = el("div", "vl-ctrl", '<button class="L" aria-label="Reculer">◀</button><button class="R" aria-label="Avancer">▶</button>'); root.append(ctrl);
  const openBtn = el("button", "vl-open", "📖 Ouvrir le livre ✨"); root.append(openBtn);
  const flash = el("div", "vl-flash"); root.append(flash);
  book.append(root);

  let px = 8, dir = 0, auto = false, ti = 0, busy = true, moving = false, face = 1, stepT = 0, last = 0, cam = 0, downT = 0, ended = false;
  const setHint = () => { hint.textContent = ti === 0 ? "Marche jusqu'à ta maison →" : ti < HOUSES.length ? "Va chez " + HOUSES[ti].n + " →" : "Toutes les maisons sont visitées ! Avance jusqu'au livre lumineux →"; };
  setHint();

  /* --- écran d'accueil --- */
  const intro = el("div", "vl-intro", '<div class="vi-box"><small>✦ AVANT D\'OUVRIR LE LIVRE ✦</small><h2>Le village des six maisons</h2><p>Tes compagnons t\'ont laissé chacun un petit mot chez eux. Passe leur dire bonjour, maison après maison, avant de découvrir le livre…</p><button>Entrer dans le village 🌿</button></div>');
  root.append(intro);
  intro.querySelector("button").addEventListener("click", () => {
    Snd.init(); Snd.music("main"); Snd.sfx("win"); intro.remove(); busy = false;
  });

  /* --- intérieur d'une maison --- */
  function enter(i) {
    busy = true; auto = false; dir = 0; if (moving) { moving = false; heroIdle(me); }
    const h = HOUSES[i]; Snd.sfx("open");
    const r = el("div", "vr", `<div class="vr-t"><small>✦ À L'INTÉRIEUR ✦</small><b>Maison ${/^[AEIOUY]/.test(h.n) ? "d'" : "de "}${h.n}</b></div><div class="vr-room"><div class="vr-win"><i></i></div><div class="vr-pic"></div><div class="vr-floor"></div><div class="vr-rug"></div></div><div class="vr-card"><p></p><button>Continuer ➜</button></div>`);
    r.style.setProperty("--w", h.room[0]); r.style.setProperty("--a", h.room[1]);
    const room = r.querySelector(".vr-room"), p = r.querySelector("p"), btn = r.querySelector("button");
    const put = (a, cx, b) => { a.style.left = U(cx - a._w / 2); a.style.bottom = U(b); room.append(a); return a; };
    let who;
    if (h.who === "mymy") { who = put(hero("mymy", { h: 34 }), 44, 5); put(cat("vaia", 14), 14, 5); put(cat("murphy", 13), 76, 5); }
    else who = put(hero(h.who, { h: h.who === "kithim" ? 32 : 36 }), 44, 5);
    if (h.who === "kithim") { heroIdle(who); who.classList.add("hop"); } else { heroJoy(who); who.classList.remove("hop"); }
    const ch = Array.from(h.msg); let k = 0, tw = 0;
    btn.style.visibility = "hidden";
    const fin = () => { clearInterval(tw); tw = 0; p.textContent = h.msg; btn.style.visibility = "visible"; };
    tw = setInterval(() => { k += 2; p.textContent = ch.slice(0, k).join(""); if (k % 12 === 0) Snd.sfx("tap"); if (k >= ch.length) fin(); }, 30);
    r.querySelector(".vr-card").addEventListener("pointerdown", () => { if (tw) fin(); });
    btn.addEventListener("click", () => {
      clearInterval(tw); r.remove(); Snd.sfx("tap");
      px = h.x + 10; ti = i + 1; busy = false; setHint();
    });
    root.append(r);
  }

  /* --- boucle principale --- */
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (!busy && !ended) {
      const d = auto ? 1 : dir;
      const lo = ti > 0 ? HOUSES[ti - 1].x + 10 : 4, hi = ti < HOUSES.length ? HOUSES[ti].x : BOOKX - 14;
      if (d) { px = Math.max(lo, Math.min(hi, px + d * SPEED * dt)); face = d; }
      const mv = d !== 0 && !(d < 0 && px <= lo) && !(d > 0 && px >= hi);
      if (mv !== moving) { moving = mv; if (mv) heroRun(me); else heroIdle(me); }
      if (mv) { stepT += dt; if (stepT > .27) { stepT = 0; Snd.sfx("step"); } }
      if (px >= hi - .01 && ti < HOUSES.length) { auto = false; enter(ti); }
      if (px >= hi - .01 && ti >= HOUSES.length) auto = false;
    }
    me._spr.classList.toggle("flip", face < 0);
    me.style.left = U(px - me._w / 2);
    const want = Math.max(0, Math.min(W - 100, px - 38)); cam += (want - cam) * Math.min(1, dt * 8);
    world.style.transform = `translate3d(calc(var(--u)*${(-cam).toFixed(2)}),0,0)`;
    openBtn.style.display = !busy && ti >= HOUSES.length && px >= BOOKX - 14.1 && !ended ? "block" : "none";
  }
  raf = requestAnimationFrame(frame);

  /* --- commandes --- */
  const bL = ctrl.querySelector(".L"), bR = ctrl.querySelector(".R");
  const hold = (b, v) => {
    b.addEventListener("pointerdown", e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} Snd.init(); dir = v; auto = false; downT = performance.now(); });
    const up = () => { if (dir !== v) return; dir = 0; if (v > 0 && performance.now() - downT < 280) auto = true; };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", () => { if (dir === v) dir = 0; });
  };
  hold(bL, -1); hold(bR, 1);
  const kd = e => { if (e.key === "ArrowRight") { if (!dir) downT = performance.now(); dir = 1; auto = false; } if (e.key === "ArrowLeft") { dir = -1; auto = false; } };
  const ku = e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const was = dir; dir = 0; if (was > 0 && performance.now() - downT < 280) auto = true; } };
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku); offs.push(() => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); });

  openBtn.addEventListener("click", () => {
    if (ended) return; ended = true; Snd.sfx("win"); heroJoy(me); flash.classList.add("on");
    setTimeout(() => { close(); if (onDone) onDone(); }, 1100);
  });

  return { _test: { st: () => ({ px, ti, busy, ended }), at: x => { px = x; } } };
}

return { start, close, get open() { return !!root; } };
})();
