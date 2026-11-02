// Pintor genérico para las recetas nuevas: recipiente + base + trozos + acabado, a partir de una ficha.
let AREA=null;
function radioDe(ret){ return typeof ret==='object' ? Math.min(ret.w,ret.h)*.5 : ret; }
function ponerTrozos(r,lista){
  for(const it of lista||[]){
    const [k,n,s,...extra]=it; if(!I[k]||!n) continue;
    if(Array.isArray(n)) n.forEach(([u,v,rot])=>I[k](CX+u*r,CY+v*r,s,rot||0,...extra));
    else if(AREA){ for(let i=0;i<Math.round(n*1.7);i++) I[k](AREA.x+30+R()*(AREA.w-60),AREA.y+30+R()*(AREA.h-60),s*rr(.88,1.12),...extra); }
    else esparcir((x,y)=>I[k](x,y,s*rr(.88,1.12),...extra),n,r*.8);
  }
}
function gratinado(a,color){ ctx.save(); rrect(a.x,a.y,a.w,a.h,22); ctx.clip(); ctx.fillStyle=color; ctx.fillRect(a.x,a.y,a.w,a.h);
  ctx.filter='blur(3px)'; for(let i=0;i<150;i++){ ctx.fillStyle=tone(pick([color,'#B86F24','#9A5518','#F3D58A']),rr(-.15,.1),rr(.35,.8)); blob(a.x+R()*a.w,a.y+R()*a.h,rr(6,20),.45,8); ctx.fill(); }
  ctx.filter='none'; textura(()=>rrect(a.x,a.y,a.w,a.h,22),.25); ctx.restore(); }
function tortillaPlato(r,color,omelette){ ctx.save(); sombra(60,.35); ctx.fillStyle=lit(CX,CY,r*.8,color,.25,-.3);
  if(omelette) blob(CX-10,CY,r*.82,.05,24,0,1.25,.62); else blob(CX,CY,r*.8,.04,24); ctx.fill(); ctx.restore();
  ctx.save(); if(omelette) blob(CX-10,CY,r*.82,.05,24,0,1.25,.62); else blob(CX,CY,r*.8,.04,24); ctx.clip();
  ctx.filter='blur(4px)'; for(let i=0;i<36;i++){ ctx.fillStyle=`rgba(160,95,30,${rr(.2,.45)})`; blob(...enCirculo(r*.8),rr(8,22),.4,8); ctx.fill(); } ctx.filter='none';
  if(color!=='#E8B54A'&&color!=='#EBC25A'&&!omelette) esparcir((x,y)=>{ ctx.fillStyle='rgba(70,110,45,.5)'; blob(x,y,rr(6,11),.4,8); ctx.fill(); },44,r*.76);
  ctx.restore(); }
function pizzaSobre(r,tops){ ctx.save(); sombra(60,.35); ctx.fillStyle=lit(CX,CY,r*.92,'#D59B50',.25,-.35); blob(CX,CY,r*.92,.03,30); ctx.fill(); ctx.restore();
  ctx.save(); ctx.fillStyle=lit(CX,CY,r*.8,'#B23A28',.1,-.2); blob(CX,CY,r*.8,.04,30); ctx.fill(); ctx.clip(); manchas(r*.8,'#B23A28',30,.12); ctx.restore();
  esparcir((x,y)=>I.mozzarella(x,y,rr(18,26)),11,r*.62);
  for(const t of tops) esparcir((x,y)=>{ if(t==='pimiento') I.pimiento(x,y,22,null,'tira'); else I[t](x,y,t==='jamonCocido'?16:(t==='calabacin'?16:(t==='bacon'?16:18))); },12,r*.64);
  ctx.strokeStyle='rgba(120,70,20,.35)'; ctx.lineWidth=2; for(let i=0;i<4;i++){ const a=i*Math.PI/4+.2; ctx.beginPath(); ctx.moveTo(CX-Math.cos(a)*r*.9,CY-Math.sin(a)*r*.9); ctx.lineTo(CX+Math.cos(a)*r*.9,CY+Math.sin(a)*r*.9); ctx.stroke(); } }
function rellenos(a,color){ const piezas=[[-.22,-.2,.08],[.22,-.05,-.06],[-.05,.25,.05]];
  for(const [u,v,rot] of piezas){ const x=CX+u*a.w, y=CY+v*a.h; ctx.save(); ctx.translate(x,y); ctx.rotate(rot); sombra(30,.35);
    ctx.fillStyle=lit(0,0,80,color,.3,-.3); blob(0,0,92,.08,16,0,1.3,.55); ctx.fill(); sinSombra();
    ctx.fillStyle=lit(0,0,70,'#9A4A26',.2,-.2); blob(0,0,70,.12,14,0,1.25,.42); ctx.fill();
    for(let i=0;i<26;i++){ ctx.fillStyle=pick(['#F2D98A','#E9C46A','#F7E6A6']); blob(rr(-70,70),rr(-22,22),rr(4,9),.4,7); ctx.fill(); }
    brillo(-30,-14,40,8,.45,0); ctx.restore(); } I.perejil(160,30); }
function empanada(r){ ctx.save(); sombra(60,.35); ctx.fillStyle=lit(CX,CY,r*.85,'#D9A04E',.3,-.35); rrect(CX-r*.85,CY-r*.62,r*1.7,r*1.24,40); ctx.fill(); ctx.restore();
  ctx.save(); rrect(CX-r*.85,CY-r*.62,r*1.7,r*1.24,40); ctx.clip(); textura(()=>rrect(CX-r*.85,CY-r*.62,r*1.7,r*1.24,40),.3);
  ctx.strokeStyle='rgba(140,80,25,.45)'; ctx.lineWidth=5; for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(CX+i*50-60,CY-r*.6); ctx.lineTo(CX+i*50+60,CY+r*.6); ctx.stroke(); } ctx.restore();
  ctx.save(); ctx.translate(CX+r*.35,CY+r*.05); ctx.fillStyle='#F3E6C6'; ctx.beginPath(); ctx.moveTo(0,-90); ctx.lineTo(120,-70); ctx.lineTo(120,70); ctx.lineTo(0,90); ctx.closePath(); ctx.fill(); ctx.fillStyle='#B23A28'; ctx.fillRect(10,-60,100,120);
  for(let i=0;i<20;i++){ ctx.fillStyle=pick(['#D9B38C','#C8402A','#7CB342']); blob(rr(20,100),rr(-50,50),rr(5,9),.4,7); ctx.fill(); } ctx.restore(); }
function tostas(){ const a=V.pizarra(); [[-58,-52,-.06],[52,46,.05]].forEach(([u,v,rot])=>{ I.tosta(CX+u,CY+v,196,86,rot); ctx.save(); ctx.translate(CX+u,CY+v); ctx.rotate(rot);
  ctx.globalAlpha=.85; for(let i=0;i<30;i++){ ctx.fillStyle=tone('#C8402E',rr(-.1,.15),.8); blob(rr(-80,80),rr(-28,28),rr(5,10),.4,7); ctx.fill(); } ctx.restore();
  for(let k=0;k<3;k++) I.jamonCocido(CX+u-50+k*50,CY+v+rr(-6,6),22); }); }
function sandwich(r){ [[-.22,-.18,-.25],[.2,.2,.35]].forEach(([u,v,rot])=>{ const x=CX+u*r,y=CY+v*r; ctx.save(); ctx.translate(x,y); ctx.rotate(rot); sombra(40,.35);
  ctx.fillStyle=lit(0,0,90,'#D49A4C',.3,-.3); ctx.beginPath(); ctx.moveTo(-95,-80); ctx.lineTo(95,-80); ctx.lineTo(-95,80); ctx.closePath(); ctx.fill(); sinSombra();
  ctx.fillStyle='#F2D48A'; ctx.fillRect(-90,-76,8,150); ctx.fillStyle='#E8A0A0'; ctx.beginPath(); ctx.moveTo(-86,-74); ctx.lineTo(80,-74); ctx.lineTo(-86,68); ctx.closePath(); ctx.globalAlpha=.35; ctx.fill(); ctx.globalAlpha=1; brillo(-30,-40,40,8,.4,0); ctx.restore(); });
  I.cherryMitad(CX+r*.6,CY-r*.5,16); I.lechuga(CX-r*.55,CY+r*.55,40); }
function nachos(a){ for(let i=0;i<46;i++){ const x=a.x+30+R()*(a.w-60), y=a.y+30+R()*(a.h-60); ctx.save(); ctx.translate(x,y); ctx.rotate(R()*6.3); sombra(14,.25);
  ctx.fillStyle=lit(0,0,30,pick(['#E9B44C','#E3A83E','#F0C25E']),.25,-.3); ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(28,22); ctx.lineTo(-28,22); ctx.closePath(); ctx.fill(); ctx.restore(); } }
function maizGranos(r,n=40){ esparcir((x,y)=>{ ctx.fillStyle=pick(['#F4CF3A','#F2C230','#F7DA5A']); ctx.beginPath(); ctx.ellipse(x,y,6,5,R()*3,0,6.3); ctx.fill(); },n,r*.7); }
function mejillones(r){ esparcir((x,y)=>{ ctx.save(); ctx.translate(x,y); ctx.rotate(R()*6.3); sombra(16,.3); ctx.fillStyle=lit(0,0,30,'#2A2F3A',.25,-.3); blob(0,0,30,.1,10,0,1.5,.75); ctx.fill(); sinSombra();
  ctx.fillStyle=lit(0,0,22,'#E89A4A',.25,-.2); blob(4,0,20,.12,10,0,1.4,.6); ctx.fill(); brillo(-10,-8,14,5,.5,0); ctx.restore(); },22,r*.8); }
function revuelto(r,extra){ esparcir((x,y)=>{ ctx.save(); sombra(20,.22); ctx.fillStyle=lit(x,y,20,pick(['#F2CF5A','#F5D96E','#EFC54A']),.3,-.2); blob(x,y,rr(14,24),.35,10); ctx.fill(); ctx.restore(); },46,r*.62); ponerTrozos(r*.8,extra); I.pan(CX+r*.62,CY+r*.52,32,-.5); I.pimienta(r*.6,40); }

function G(sp){ return ()=>{ if(sp.tosta){ tostas(); return; }
  const ret=sp.v==='cuenco'?V.cuenco(sp.vo||{}):V[sp.v](sp.vo||{}); const r=radioDe(ret); AREA=typeof ret==='object'?ret:null; if(AREA&&sp.fondo){ ctx.save(); rrect(AREA.x,AREA.y,AREA.w,AREA.h,22); ctx.clip(); ctx.fillStyle=sp.fondo; ctx.fillRect(AREA.x,AREA.y,AREA.w,AREA.h); manchas(240,sp.fondo,30,.1); ctx.restore(); }
  if(sp.gratin){ gratinado(ret,sp.gratin); I.perejil(140,30); return; }
  if(sp.rellenos){ rellenos(ret,sp.rellenos); return; }
  if(sp.pizza){ pizzaSobre(r/0.86*0.86,sp.pizza); return; }
  if(sp.empanada){ empanada(r); return; }
  if(sp.tosta){ return; }
  if(sp.tortilla){ ponerTrozos(r,sp.it); tortillaPlato(r*(sp.it&&sp.it.length?.8:1),sp.tortilla,sp.omelette); if(sp.quiche){ esparcir((x,y)=>I.calabacin(x,y,14),10,r*.6); } else if(!sp.omelette) I.pan(CX+r*.74,CY-r*.6,34,.6); return; }
  if(sp.revuelto){ revuelto(r,sp.revuelto); return; }
  if(sp.sandwich){ sandwich(r); return; }
  if(sp.nachos){ nachos(ret); ponerTrozos(r,sp.it); return; }
  if(sp.b){ const [k,...a]=sp.b; B[k](r,...a); }
  if(sp.mejillon) mejillones(r);
  ponerTrozos(r,sp.it);
  if(sp.maiz) maizGranos(r);
  if(['cazuela','cuenco','paellera'].includes(sp.v)) sombraInterior(r,.32);
  for(const [k,f,n] of (sp.fin||[['perejil',.55,24]])) I[k](r*f,n);
}; }
// Las tostas usan la pizarra entera
function GT(){ return ()=>tostas(); }
// Filete claro (pollo a la plancha o empanado)
I.fileteClaro=(x,y,s=70,rot=0,tipo='pollo')=>{ const col=tipo==='empanado'?'#D89A48':'#E3BE84'; ctx.save(); ctx.translate(x,y); ctx.rotate(rot); sombra(s,.35);
  ctx.fillStyle=lit(0,0,s,col,.3,-.35); blob(0,0,s,.1,14,0,1.25,.72); ctx.fill(); sinSombra(); textura(()=>blob(0,0,s,.1,14,0,1.25,.72),tipo==='empanado'?.55:.25);
  if(tipo==='empanado'){ for(let i=0;i<60;i++){ ctx.fillStyle=pick(['rgba(150,90,30,.45)','rgba(240,200,120,.5)']); blob(rr(-s,s),rr(-s*.6,s*.6),rr(2,4),.4,6); ctx.fill(); } }
  else { ctx.strokeStyle='rgba(120,70,25,.45)'; ctx.lineWidth=6; ctx.lineCap='round'; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*s*.35-s*.3,-s*.5); ctx.lineTo(i*s*.35+s*.3,s*.5); ctx.stroke(); } }
  brillo(-s*.4,-s*.3,s*.5,s*.16,.3); ctx.restore(); };
