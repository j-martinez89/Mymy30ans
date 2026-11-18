/* Niveau de plateforme « La grotte aux cristaux » — adapté de la v1 pour le livre. */
window.Cave = (() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const CAVE_W = 3100, GROUND_Y = 465, VIEW_W = 600, VIEW_H = 540;
const cavePlatforms = [{x:260,y:390,w:150},{x:520,y:335,w:150},{x:820,y:390,w:150},{x:1080,y:330,w:160},{x:1370,y:380,w:150},{x:1630,y:320,w:170},{x:1940,y:385,w:150},{x:2200,y:330,w:160},{x:2490,y:385,w:160}];
const caveBlocks = [{x:440,y:420,w:42,h:45},{x:740,y:420,w:50,h:45},{x:980,y:420,w:42,h:45},{x:1280,y:420,w:60,h:45},{x:1530,y:420,w:44,h:45},{x:1850,y:420,w:60,h:45},{x:2110,y:420,w:46,h:45},{x:2400,y:420,w:58,h:45}];
const caveSpikes = [{x:590,w:48},{x:900,w:56},{x:1120,w:48},{x:1435,w:62},{x:1830,w:54},{x:2050,w:48},{x:2260,w:68},{x:2460,w:52},{x:2630,w:60}];
const caveFireTraps = [
 {x:780,baseY:340,range:62,r:19,speed:.0031,phase:0},{x:1195,baseY:265,range:52,r:18,speed:.0024,phase:1.7},
 {x:1745,baseY:325,range:70,r:20,speed:.0028,phase:3.2},{x:2180,baseY:255,range:58,r:18,speed:.0035,phase:2.1},
 {x:2515,baseY:335,range:66,r:21,speed:.0026,phase:4.4}];
function fireTrapY(h, now) { return h.baseY + Math.sin(now * h.speed + h.phase) * h.range; }
const caveCoinsMap = [[300,350],[360,350],[565,292],[625,292],[865,350],[930,350],[1120,285],[1180,285],[1420,340],[1480,340],[1680,275],[1740,275],[1985,345],[2045,345],[2245,285],[2305,285],[2535,345],[2595,345],[2740,405]];
const GAPS = [[650,735],[1510,1590],[2300,2380]];
const SHEET = new Image(); SHEET.src = "assets/sprites/mymy.png";
const CELL = { w: 139, h: 141 };

let root, caveCanvas, caveCtx, opts, running = false, raf = 0, last = 0;
let caveCamera = 0, caveCoins = 0, caveWon = false, caveLives = 3, caveDying = false, caveCheckpoint = 70, caveInvulnUntil = 0, gameOvers = 0;
let cavePlayer, caveHeld = { left: false, right: false }, collectedCoins = new Set();

function reset() {
  running = false; caveWon = false; caveCamera = 0; caveCoins = 0; caveLives = 3; caveDying = false; caveCheckpoint = 70; caveInvulnUntil = Date.now() + 1000; collectedCoins.clear();
  cavePlayer = { x: 70, y: GROUND_Y - 76, w: 58, h: 76, vy: 0, onGround: false, face: 1 }; caveHeld = { left: false, right: false };
  hud();
}
function hud() { $(".cv-lives", root).textContent = caveLives > 0 ? "❤️ ".repeat(caveLives).trim() : "♡"; $(".cv-coins", root).textContent = "🪙 " + caveCoins; }
function jump() { if (running && !caveWon && cavePlayer.onGround) { cavePlayer.vy = -14; cavePlayer.onGround = false; opts.snd.tone(520, .12, "square", .03); opts.snd.tone(780, .1, "square", .025, .06); } }
function die() {
  if (caveDying || caveWon) return;
  caveDying = true; running = false; caveLives--; hud();
  const d = $(".cv-death", root); $(".cv-dmsg", root).textContent = caveLives > 0 ? "Mymy a perdu une vie… Reprise au dernier point sûr !" : "Plus de vies ! On recommence depuis le début.";
  d.classList.add("show"); opts.snd.tone(190, .25, "sawtooth", .05); opts.snd.noise(.3, .06, 700);
  setTimeout(() => {
    d.classList.remove("show");
    if (caveLives <= 0) { caveLives = 3; caveCheckpoint = 70; gameOvers++; hud(); if (gameOvers >= 2) $(".cv-skip", root).style.display = "block"; }
    cavePlayer = { x: caveCheckpoint, y: GROUND_Y - 76, w: 58, h: 76, vy: 0, onGround: true, face: 1 };
    caveCamera = Math.max(0, cavePlayer.x - caveCanvas.width * .32);
    caveInvulnUntil = Date.now() + 1600; caveDying = false; running = true; last = 0;
  }, 1300);
}
function update(dt) {
  const p = cavePlayer, oldBottom = p.y + p.h; p.vy = Math.min(15, p.vy + .62 * dt);
  if (caveHeld.left) { p.x -= 4.2 * dt; p.face = -1; } if (caveHeld.right) { p.x += 4.2 * dt; p.face = 1; }
  p.x = Math.max(0, Math.min(CAVE_W - p.w, p.x)); p.y += p.vy * dt; p.onGround = false;
  const inGap = GAPS.some(([a, b]) => p.x + p.w > a && p.x < b);
  if (!inGap && p.y + p.h >= GROUND_Y && oldBottom <= GROUND_Y + 20 && p.vy >= 0) { p.y = GROUND_Y - p.h; p.vy = 0; p.onGround = true; }
  cavePlatforms.forEach(pl => { if (p.vy >= 0 && oldBottom <= pl.y + 12 && p.y + p.h >= pl.y && p.x + p.w > pl.x && p.x < pl.x + pl.w) { p.y = pl.y - p.h; p.vy = 0; p.onGround = true; } });
  if (p.y > 560) { die(); return; }
  if (Date.now() > caveInvulnUntil) {
    const spike = caveSpikes.find(sp => p.x + p.w > sp.x && p.x < sp.x + sp.w && p.y + p.h > GROUND_Y - 42 && p.y < GROUND_Y);
    if (spike) { die(); return; }
    const fire = caveFireTraps.find(hz => { const fy = fireTrapY(hz, Date.now()); return p.x + p.w > hz.x - hz.r && p.x < hz.x + hz.r && p.y + p.h > fy - hz.r && p.y < fy + hz.r; });
    if (fire) { die(); return; }
  }
  if (p.x > caveCheckpoint + 850 && caveCheckpoint < 1000) caveCheckpoint = 1050;
  if (p.x > caveCheckpoint + 850 && caveCheckpoint < 2020) caveCheckpoint = 2020;
  caveCoinsMap.forEach((c, i) => { if (collectedCoins.has(i)) return; if (Math.abs(p.x + p.w / 2 - c[0]) < 28 && Math.abs(p.y + p.h / 2 - c[1]) < 34) { collectedCoins.add(i); caveCoins++; hud(); opts.snd.tone(1250, .08, "square", .03); opts.snd.tone(1650, .1, "square", .03, .05); } });
  caveBlocks.forEach(b => { if (p.x + p.w > b.x && p.x < b.x + b.w && p.y + p.h > b.y && p.y < b.y + b.h) { if (oldBottom <= b.y + 10 && p.vy >= 0) { p.y = b.y - p.h; p.vy = 0; p.onGround = true; } else if (p.face > 0) p.x = b.x - p.w; else p.x = b.x + b.w; } });
  caveCamera = Math.max(0, Math.min(CAVE_W - caveCanvas.width, p.x - caveCanvas.width * .32));
  if (p.x > CAVE_W - 180) win();
}
let winAt = 0;
function win() {
  caveWon = true; winAt = Date.now(); caveHeld = { left: false, right: false };
  [784, 988, 1175, 1568].forEach((f, i) => opts.snd.tone(f, .4, "triangle", .06, i * .12));
  setTimeout(() => { if (!root || !root.isConnected) return; $(".cv-win", root).classList.add("show"); }, 1800);
}
function loop(ts) {
  if (!root || !root.isConnected) return;
  const dt = Math.min(1.8, (ts - last || 16.67) / 16.67); last = ts;
  if (running && !caveWon) update(dt);
  draw(); raf = requestAnimationFrame(loop);
}

function draw(){
 if(!caveCtx||!caveCanvas)return;
 const ctx=caveCtx,w=caveCanvas.width,h=caveCanvas.height,cam=caveCamera,now=Date.now();
 ctx.clearRect(0,0,w,h);
 // Deep cavern atmosphere and distant chamber silhouettes.
 const bg=ctx.createLinearGradient(0,0,0,h);
 bg.addColorStop(0,"#101326");bg.addColorStop(.38,"#20223b");bg.addColorStop(.72,"#49304b");bg.addColorStop(1,"#171627");
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const distant=ctx.createLinearGradient(0,70,0,GROUND_Y);
 distant.addColorStop(0,"#29263f");distant.addColorStop(1,"#55405b");
 ctx.fillStyle=distant;ctx.beginPath();ctx.moveTo(0,230);
 for(let x=0;x<=w+80;x+=80)ctx.lineTo(x,145+Math.sin((x+cam*.12)/115)*48+Math.cos((x+cam*.08)/73)*25);
 ctx.lineTo(w,GROUND_Y+25);ctx.lineTo(0,GROUND_Y+25);ctx.closePath();ctx.fill();
 // Far glowing fissures and mineral veins.
 for(let i=0;i<13;i++){
  const x=((i*173-cam*.16)%(w+90)+(w+90))%(w+90)-30,y=125+(i*67)%220;
  ctx.strokeStyle=i%2?"#9a70a455":"#70c4c455";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+8,y+14);ctx.lineTo(x-3,y+28);ctx.lineTo(x+12,y+42);ctx.stroke();
 }
 // Heavy ceiling rock, layered ledges and irregular stone blocks.
 ctx.fillStyle="#17182b";ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);ctx.lineTo(w,78);
 for(let x=w;x>=0;x-=42)ctx.lineTo(x,65+Math.sin((x+cam*.2)/53)*20+Math.cos(x/29)*8);
 ctx.closePath();ctx.fill();
 for(let x=-((cam*.34)%108)-108;x<w+120;x+=108){
  const y=70+Math.sin((x+cam*.34)/80)*14;
  ctx.fillStyle="#343047";ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+35,y-7);ctx.lineTo(x+93,y+4);ctx.lineTo(x+103,y+28);ctx.lineTo(x+12,y+32);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#75617a";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+16,y+8);ctx.lineTo(x+44,y+17);ctx.lineTo(x+57,y+10);ctx.stroke();
  ctx.strokeStyle="#17172b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+70,y+13);ctx.lineTo(x+61,y+24);ctx.lineTo(x+77,y+30);ctx.stroke();
 }
 // Stalactites hanging from the ceiling.
 for(let x=-((cam*.5)%126)-70;x<w+100;x+=126){
  const len=34+Math.abs(Math.sin((x+cam)/71))*55;
  ctx.fillStyle="#17172b";ctx.beginPath();ctx.moveTo(x-17,53);ctx.lineTo(x+18,53);ctx.lineTo(x+5,len+45);ctx.lineTo(x-4,len+26);ctx.closePath();ctx.fill();
  ctx.fillStyle="#62506d";ctx.beginPath();ctx.moveTo(x-7,58);ctx.lineTo(x+8,58);ctx.lineTo(x+3,len+28);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#9a7d94";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-2,70);ctx.lineTo(x+2,len+18);ctx.stroke();
 }
 // Side walls: rugged rock columns on both edges of the camera.
 for(let side=0;side<2;side++){
  const x=side===0?0:w-46;
  ctx.fillStyle="#262238";ctx.fillRect(x,120,46,GROUND_Y-105);
  for(let k=0;k<9;k++){
   const yy=132+k*39+Math.sin(k*3+cam*.008)*7;
   ctx.fillStyle=k%2?"#45354f":"#58405a";ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+42,yy-8);ctx.lineTo(x+46,yy+25);ctx.lineTo(x+4,yy+36);ctx.closePath();ctx.fill();
   ctx.strokeStyle="#80647b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+7,yy+4);ctx.lineTo(x+25,yy+12);ctx.lineTo(x+17,yy+23);ctx.stroke();
  }
 }
 // Crystal clusters glow in the distance.
 function crystal(x,y,scale=1,color="#6ce7ee"){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.shadowColor=color;ctx.shadowBlur=22;
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-31);ctx.lineTo(11,-8);ctx.lineTo(7,17);ctx.lineTo(-7,17);ctx.lineTo(-11,-8);ctx.closePath();ctx.fill();
  ctx.fillStyle="#e5ffff";ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(3,-5);ctx.lineTo(1,12);ctx.lineTo(-3,8);ctx.closePath();ctx.fill();
  ctx.fillStyle="#2d8499";ctx.fillRect(-3,17,6,7);ctx.restore();
 }
 for(let i=0;i<11;i++){
  const x=((i*277-cam*.62)%(w+140)+(w+140))%(w+140)-60,y=GROUND_Y-38-(i*29)%175;
  crystal(x,y,.55+(i%3)*.18,i%2?"#8ce8f2":"#c78be8");
  if(i%3===0)crystal(x+18,y+17,.38,"#f39bc9");
 }
 // A shimmering underground stream and waterfall in the far background.
 const falls=[850,1970,2740];
 falls.forEach((worldX,i)=>{
  const x=worldX-cam;if(x<-90||x>w+90)return;
  ctx.fillStyle="#213f5a99";ctx.fillRect(x,175,42,GROUND_Y-175);
  ctx.fillStyle="#63c6d7aa";ctx.fillRect(x+10,182,22,GROUND_Y-182);
  ctx.fillStyle="#d2fbff88";ctx.fillRect(x+14,188,5,GROUND_Y-188);
  ctx.fillStyle="#8be6ed55";ctx.beginPath();ctx.ellipse(x+22,GROUND_Y-2,62,12,0,0,Math.PI*2);ctx.fill();
  for(let k=0;k<8;k++){const yy=(now*.09+k*41)%Math.max(1,GROUND_Y-180)+180;ctx.fillStyle="#d6ffffaa";ctx.fillRect(x+12+(k%3)*6,yy,3,9);}
 });
 // Floating motes and dripping water.
 for(let i=0;i<30;i++){
  const x=((i*137-now*.018)%(w+30)+(w+30))%(w+30),y=100+(i*73)%290+Math.sin(now/520+i)*8;
  ctx.fillStyle=i%3?"#b4f4f0":"#ffe6a4";ctx.globalAlpha=.5+Math.sin(now/300+i)*.25;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.fillRect(x,y,3,3);ctx.shadowBlur=0;ctx.globalAlpha=1;
 }
 // Jagged stone floor with individual blocks and cracks.
 const gaps=[[650,735],[1510,1590],[2300,2380]];
 for(let x=Math.floor(cam/52)*52;x<cam+w+52;x+=52){
  if(gaps.some(([a,b])=>x+52>a&&x<b))continue;
  const sx=x-cam,seed=Math.abs(Math.floor(x/52));
  ctx.fillStyle=seed%2?"#514052":"#61485b";ctx.fillRect(sx,GROUND_Y,52,h-GROUND_Y);
  ctx.fillStyle="#a87977";ctx.fillRect(sx,GROUND_Y,52,9);
  ctx.fillStyle="#30283d";ctx.fillRect(sx+2,GROUND_Y+12,48,h-GROUND_Y-12);
  ctx.strokeStyle="#8b6677";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+7,GROUND_Y+20);ctx.lineTo(sx+19,GROUND_Y+31);ctx.lineTo(sx+12,GROUND_Y+45);ctx.moveTo(sx+38,GROUND_Y+15);ctx.lineTo(sx+31,GROUND_Y+29);ctx.stroke();
  ctx.fillStyle="#98717c";ctx.fillRect(sx+5,GROUND_Y+3,17,4);ctx.fillRect(sx+31,GROUND_Y+4,14,3);
 }
 // Stalagmites rising from the floor.
 for(let x=75-((cam*.42)%205);x<w+90;x+=205){
  const tall=24+Math.abs(Math.sin((x+cam)/51))*45;
  ctx.fillStyle="#29243a";ctx.beginPath();ctx.moveTo(x-22,GROUND_Y+6);ctx.lineTo(x-5,GROUND_Y-tall);ctx.lineTo(x+9,GROUND_Y-tall+8);ctx.lineTo(x+23,GROUND_Y+6);ctx.closePath();ctx.fill();
  ctx.fillStyle="#766077";ctx.beginPath();ctx.moveTo(x-5,GROUND_Y-2);ctx.lineTo(x-5,GROUND_Y-tall+4);ctx.lineTo(x+4,GROUND_Y-tall+12);ctx.lineTo(x+13,GROUND_Y+2);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#a98b9c";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-5,GROUND_Y-5);ctx.lineTo(x-5,GROUND_Y-tall+10);ctx.stroke();
 }
 // Cave platforms are made of chunky, cracked stone, not floating wooden blocks.
 cavePlatforms.forEach((pl,i)=>{
  const x=pl.x-cam;if(x+pl.w<0||x>w)return;
  ctx.fillStyle="#29263a";ctx.fillRect(x-3,pl.y+7,pl.w+6,21);
  ctx.fillStyle=i%2?"#786078":"#8b6b76";ctx.beginPath();ctx.moveTo(x,pl.y+5);ctx.lineTo(x+11,pl.y);ctx.lineTo(x+pl.w-8,pl.y+2);ctx.lineTo(x+pl.w,pl.y+10);ctx.lineTo(x+pl.w-5,pl.y+23);ctx.lineTo(x+5,pl.y+22);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#c49a91";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+5,pl.y+4);ctx.lineTo(x+pl.w-9,pl.y+5);ctx.stroke();
  ctx.strokeStyle="#4a394d";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+pl.w*.35,pl.y+7);ctx.lineTo(x+pl.w*.42,pl.y+16);ctx.lineTo(x+pl.w*.39,pl.y+20);ctx.stroke();
 });
 // Chunky boulders with shaded facets.
 caveBlocks.forEach((b,i)=>{
  const x=b.x-cam;if(x+b.w<0||x>w)return;
  ctx.fillStyle="#27243a";ctx.fillRect(x,b.y+5,b.w,b.h);
  ctx.fillStyle=i%2?"#8a6271":"#92707a";ctx.beginPath();ctx.moveTo(x+3,b.y+8);ctx.lineTo(x+11,b.y);ctx.lineTo(x+b.w-8,b.y+2);ctx.lineTo(x+b.w,b.y+12);ctx.lineTo(x+b.w-5,b.y+b.h);ctx.lineTo(x+4,b.y+b.h-3);ctx.closePath();ctx.fill();
  ctx.fillStyle="#c39a91";ctx.fillRect(x+9,b.y+5,Math.max(9,b.w-22),4);
  ctx.strokeStyle="#514154";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+b.w*.55,b.y+10);ctx.lineTo(x+b.w*.43,b.y+23);ctx.lineTo(x+b.w*.62,b.y+32);ctx.stroke();
 });
 // Jagged crystal spikes make the final platform route more demanding.
 caveSpikes.forEach((sp,i)=>{
  const x=sp.x-cam;if(x+sp.w<0||x>w)return;
  const count=Math.max(3,Math.floor(sp.w/13));
  for(let k=0;k<count;k++){
   const sx=x+k*(sp.w/count),sw=sp.w/count;
   ctx.fillStyle=i%2?"#9c6a9d":"#b46d82";
   ctx.beginPath();ctx.moveTo(sx,GROUND_Y);ctx.lineTo(sx+sw/2,GROUND_Y-31-(k%2)*7);ctx.lineTo(sx+sw,GROUND_Y);ctx.closePath();ctx.fill();
   ctx.strokeStyle="#f3c2d7";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+sw/2,GROUND_Y-29-(k%2)*7);ctx.lineTo(sx+sw*.68,GROUND_Y-8);ctx.stroke();
  }
 });
 // Moving fire orbs sweep through the cave and force Mymy to time her jumps.
 caveFireTraps.forEach(hz=>{
  const x=hz.x-cam,y=fireTrapY(hz,now);
  if(x<-40||x>w+40)return;
  ctx.save();ctx.shadowColor="#ff713e";ctx.shadowBlur=22;
  const flame=ctx.createRadialGradient(x,y,3,x,y,hz.r+13);
  flame.addColorStop(0,"#fff6b4");flame.addColorStop(.35,"#ffb347");flame.addColorStop(.72,"#f05a39");flame.addColorStop(1,"#a32c52");
  ctx.fillStyle=flame;ctx.beginPath();ctx.arc(x,y,hz.r+5,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.strokeStyle="#ffe7a0";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,hz.r-3,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#fff4cf";ctx.fillRect(x-3,y-4,6,8);ctx.restore();
 });
 // Coins float in the chamber, lighting the route.
 caveCoinsMap.forEach((coin,i)=>{
  if(collectedCoins.has(i))return;const x=coin[0]-cam;if(x<-20||x>w+20)return;
  const bob=Math.sin(now/170+i)*5;ctx.fillStyle="#ffe58a";ctx.shadowColor="#ffc84e";ctx.shadowBlur=15;
  ctx.beginPath();ctx.ellipse(x,coin[1]+bob,9,13,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle="#b87932";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#fff7c8";ctx.fillRect(x-2,coin[1]+bob-7,3,7);
 });
 
 // L'autel de pierre : la clé du coffre y flotte.
 const gx=2860-cam;
 if(gx<w+180&&gx>-180){
  const halo=ctx.createRadialGradient(gx+56,286,6,gx+56,286,170);halo.addColorStop(0,"#fff2b899");halo.addColorStop(.55,"#f2c45a33");halo.addColorStop(1,"#f2c45a00");ctx.fillStyle=halo;ctx.fillRect(gx-120,130,350,350);
  ctx.save();ctx.shadowColor="#ffe58a";ctx.shadowBlur=28;
  ctx.fillStyle="#342a42";ctx.fillRect(gx-8,363,128,94);
  ctx.fillStyle="#76647a";ctx.fillRect(gx,350,112,20);ctx.fillStyle="#9c8490";ctx.fillRect(gx+8,358,96,9);
  ctx.strokeStyle="#c9b0a0";ctx.lineWidth=4;ctx.strokeRect(gx+10,374,92,70);
  for(let k=0;k<3;k++){ctx.strokeStyle="#514354";ctx.beginPath();ctx.moveTo(gx+25+k*27,385);ctx.lineTo(gx+17+k*27,430);ctx.stroke();}
  ctx.restore();
  if(!caveWon)drawKey(ctx,gx+56,282+Math.sin(now/380)*6,1);
  ctx.save();ctx.fillStyle="#ffe8a2";ctx.font="bold 16px Georgia";ctx.textAlign="center";ctx.shadowColor="#000";ctx.shadowBlur=4;ctx.fillText("LA CLÉ DU COFFRE",gx+56,218);ctx.restore();
 }
 // Mymy (sprites du livre)
 const airborne=!cavePlayer.onGround||Math.abs(cavePlayer.vy)>1, moving=!!(caveHeld.left||caveHeld.right);
 let fk=0; if(airborne)fk=13; else if(moving)fk=8+Math.floor(now/90)%4; else fk=Math.floor(now/450)%2;
 if(SHEET.complete&&SHEET.naturalWidth){
  const dh=cavePlayer.h+6,dw=dh*CELL.w/CELL.h,dx=cavePlayer.x-cam+(cavePlayer.w-dw)/2,dy=cavePlayer.y-4;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(now<caveInvulnUntil&&Math.floor(now/110)%2===0)ctx.globalAlpha=.28;
  if(cavePlayer.face<0){ctx.translate(dx+dw,dy);ctx.scale(-1,1);ctx.drawImage(SHEET,fk*CELL.w,0,CELL.w,CELL.h,0,0,dw,dh);}
  else ctx.drawImage(SHEET,fk*CELL.w,0,CELL.w,CELL.h,dx,dy,dw,dh);
  ctx.restore();
 }
 if(caveWon){ // la clé s'élève au centre de l'écran
  const t=Math.min(1,(now-winAt)/900),x=w/2,y=h*.5-t*30;
  const g=ctx.createRadialGradient(x,y,6,x,y,200);g.addColorStop(0,"#fff6bdcc");g.addColorStop(.5,"#ffd95c55");g.addColorStop(1,"#ffd95c00");
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);drawKey(ctx,x,y,1.2+t*1.2);
 }
 ctx.fillStyle="#21172d";ctx.fillRect(18,18,190,14);ctx.fillStyle="#e879aa";ctx.fillRect(20,20,186*Math.min(1,cavePlayer.x/(CAVE_W-100)),10);
 ctx.strokeStyle="#ffe2ad";ctx.strokeRect(18,18,190,14);ctx.fillStyle="#fff0ce";ctx.font="bold 13px Arial";ctx.textAlign="left";ctx.fillText("PROGRESSION",18,48);
}
function drawKey(ctx,x,y,s){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.shadowColor="#ffe58a";ctx.shadowBlur=26;
 const g=ctx.createLinearGradient(-30,-60,30,60);g.addColorStop(0,"#fff3a6");g.addColorStop(.4,"#f3c64f");g.addColorStop(.75,"#bd7826");g.addColorStop(1,"#ffe58a");
 ctx.fillStyle=g;ctx.strokeStyle="#fff0ad";ctx.lineWidth=4;
 ctx.beginPath();ctx.arc(0,-34,22,0,Math.PI*2);ctx.arc(0,-34,10,0,Math.PI*2,true);ctx.fill("evenodd");ctx.stroke();
 ctx.fillRect(-6,-12,12,72);ctx.strokeRect(-6,-12,12,72);ctx.fillRect(6,34,22,10);ctx.strokeRect(6,34,22,10);ctx.fillRect(6,50,15,10);ctx.strokeRect(6,50,15,10);
 ctx.restore();
}

function key(e, down) {
  const k = e.key.toLowerCase();
  if (["arrowleft", "a", "q"].includes(k)) { caveHeld.left = down; e.preventDefault(); }
  if (["arrowright", "d"].includes(k)) { caveHeld.right = down; e.preventDefault(); }
  if (down && ["arrowup", " ", "w", "z"].includes(k)) { e.preventDefault(); jump(); }
}
const kd = e => { if (root && root.isConnected) key(e, true); }, ku = e => { if (root && root.isConnected) key(e, false); };

function start(book, o) {
  opts = o; if (root) root.remove();
  root = el("div", "cave");
  root.innerHTML = `<div class="cv-head"><div><div class="cv-kicker">NIVEAU SECRET</div><div class="cv-title">La grotte aux cristaux</div></div><div class="cv-hud"><span class="cv-coins">🪙 0</span><span class="cv-lives">❤️ ❤️ ❤️</span></div></div>
<canvas class="cv-canvas" width="${VIEW_W}" height="${VIEW_H}"></canvas>
<div class="cv-hint">Atteins l'autel au fond de la grotte pour récupérer la clé !</div>
<div class="cv-ctrl"><div class="cv-lr"><button data-k="left" aria-label="Gauche">◀</button><button data-k="right" aria-label="Droite">▶</button></div><button class="cv-jump" data-k="jump" aria-label="Sauter">⬆<small>SAUT</small></button></div>
<button class="cv-skip" style="display:none">Passer le niveau ➜</button>
<div class="cv-card cv-intro show"><div class="ic">🔒🗝️✨</div><h2>Le coffre est verrouillé !</h2><p>Une clé repose sur un autel, tout au fond de la grotte aux cristaux. Mymy s'y téléporte, seule.</p><p><b>◀ ▶</b> avancer &nbsp; <b>⬆</b> sauter<br>Évite les pics et les boules de feu : tu as 3 vies.</p><button class="cv-go">ENTRER DANS LA GROTTE ▶</button></div>
<div class="cv-death"><div class="cv-dcard"><h2>OH NON ! 💥</h2><p class="cv-dmsg"></p></div></div>
<div class="cv-card cv-win"><div class="ic">🗝️✨</div><h2>Tu as la clé !</h2><p>La clé dorée du coffre est à toi. Retour auprès de tes compagnons !</p><button class="cv-back">RETOURNER AU COFFRE ✨</button></div>`;
  book.append(root);
  caveCanvas = $(".cv-canvas", root); caveCtx = caveCanvas.getContext("2d"); caveCtx.imageSmoothingEnabled = false;
  reset(); draw();
  root.querySelectorAll("[data-k]").forEach(b => {
    const d = b.dataset.k;
    b.addEventListener("pointerdown", e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} opts.snd.init(); if (d === "jump") jump(); else caveHeld[d] = true; });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => b.addEventListener(ev, () => { if (d !== "jump") caveHeld[d] = false; }));
  });
  $(".cv-go", root).addEventListener("click", () => { opts.snd.init(); $(".cv-intro", root).classList.remove("show"); running = true; last = 0; opts.snd.tone(660, .1, "triangle", .04); });
  const finish = () => { const cb = opts.onWin; cancelAnimationFrame(raf); running = false; window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); cb(); };
  $(".cv-back", root).addEventListener("click", finish);
  $(".cv-skip", root).addEventListener("click", () => { running = false; caveWon = true; finish(); });
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  return root;
}
function close() { cancelAnimationFrame(raf); running = false; window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); if (root) { root.remove(); root = null; } }
return { start, close, _test: { to(x) { cavePlayer.x = x; cavePlayer.y = GROUND_Y - 76; cavePlayer.vy = 0; } } };
})();
