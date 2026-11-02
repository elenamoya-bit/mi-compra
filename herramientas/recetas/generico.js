// Pintor genérico para las recetas nuevas: recipiente + base + trozos + acabado, a partir de una ficha.
let AREA=null;
function radioDe(ret){ return typeof ret==='object' ? Math.min(ret.w,ret.h)*.5 : ret; }
// ——— v2: composición (principal + guarnición a un lado), tamaños mayores y recipientes llenos ———
const ESC={plato:1.3,cuenco:1.2,cazuela:1.2,fuente:1.4,tabla:1.45,paellera:1.15,pizarra:1.2};
const DENS={plato:1.15,cuenco:1.5,cazuela:1.5,fuente:1.0,tabla:1.1,paellera:1.3,pizarra:1};
let VASO='plato';
function ponerTrozos(r,lista){
  const hayPrincipal=(lista||[]).some(it=>Array.isArray(it[1])), hayGuar=(lista||[]).some(it=>!Array.isArray(it[1])&&it[1]);
  const lado=hayPrincipal&&hayGuar&&(VASO==='plato'||VASO==='tabla');
  const e=ESC[VASO]||1.2, dn=DENS[VASO]||1.2;
  // primero la guarnición (debajo), luego lo principal encima
  for(const it of lista||[]){ const [k,n,s,...extra]=it; if(!I[k]||!n||Array.isArray(n)) continue;
    const sz=s*Math.min(e,1.3);
    if(AREA){ for(let i=0;i<Math.round(n*1.7);i++) I[k](AREA.x+26+R()*(AREA.w-52),AREA.y+26+R()*(AREA.h-52),sz*rr(.88,1.12),...extra); }
    else if(lado){ const m=Math.round(n*1.25); for(let i=0;i<m;i++){ const a=rr(.1,1.15)*Math.PI, d=rr(.42,.86)*r; I[k](CX+Math.cos(a)*d,CY+Math.sin(a)*d,sz*rr(.88,1.12),...extra); } }
    else esparcir((x,y)=>I[k](x,y,sz*rr(.88,1.12),...extra),Math.round(n*dn),r*.84);
  }
  for(const it of lista||[]){ const [k,n,s,...extra]=it; if(!I[k]||!Array.isArray(n)) continue;
    n.forEach(([u,v,rot])=>{ let x,y; if(AREA){ x=CX+u*AREA.w*.95; y=CY+v*AREA.h*.95; } else if(lado){ x=CX+u*r*1.1-r*.14; y=CY+v*r*1.1-r*.12; } else { x=CX+u*r*1.08; y=CY+v*r*1.08; }
      I[k](x,y,s*(lado&&k!=='montonArroz'?1.08:e),rot||0,...extra); });
  }
}
// Acompañamientos que dan vida al plato
I.limonGajo=(x,y,s=34,rot=0)=>{ ctx.save(); ctx.translate(x,y); ctx.rotate(rot); sombra(14,.25); ctx.fillStyle='#F2D649'; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,s,-.55,.55); ctx.closePath(); ctx.fill(); sinSombra();
  ctx.fillStyle='#FBF0A0'; ctx.beginPath(); ctx.moveTo(4,0); ctx.arc(0,0,s*.82,-.48,.48); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(230,200,60,.9)'; ctx.lineWidth=1.5; for(const a of [-.25,0,.25]){ ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(Math.cos(a)*s*.8,Math.sin(a)*s*.8); ctx.stroke(); } ctx.restore(); };
I.cuenquito=(x,y,s=40,color='#B7392A')=>{ ctx.save(); sombra(20,.3); ctx.fillStyle='#F3F0EA'; ctx.beginPath(); ctx.arc(x,y,s,0,6.3); ctx.fill(); sinSombra(); ctx.fillStyle=lit(x,y,s*.78,color,.2,-.25); ctx.beginPath(); ctx.arc(x,y,s*.78,0,6.3); ctx.fill(); brillo(x-s*.3,y-s*.3,s*.3,s*.12,.5,0); ctx.restore(); };
function acompanar(r,acc){
  for(const a of acc||[]){ const [k,c]=a.split(':');
    if(k==='limon'){ if(AREA) I.limonGajo(AREA.x+AREA.w-46,AREA.y+44,30,2.4); else I.limonGajo(CX+r*.78,CY-r*.62,30,2.4); }
    if(k==='salsa'){ if(VASO==='tabla') I.cuenquito(CX+r*.78,CY-r*.66,40,c); else if(AREA) I.cuenquito(AREA.x+AREA.w-54,AREA.y+54,36,c); else I.cuenquito(CX+r*.66,CY-r*.66,34,c); }
    if(k==='pan'){ if(VASO==='cazuela'||VASO==='cuenco') I.pan(CX+r*1.02,CY+r*.82,40,-.6); else I.pan(CX+r*.78,CY+r*.62,32,-.5); }
  } }
function gratinado(a,color,asoma){ ctx.save(); rrect(a.x,a.y,a.w,a.h,22); ctx.clip(); ctx.fillStyle=color; ctx.fillRect(a.x,a.y,a.w,a.h);
  if(asoma){ for(let i=0;i<40;i++) I[asoma](a.x+20+R()*(a.w-40),a.y+20+R()*(a.h-40),asoma==='macarron'?18:(asoma==='brocoli'?30:22)); ctx.fillStyle=tone(color,.05,.55); ctx.fillRect(a.x,a.y,a.w,a.h); }
  ctx.filter='blur(3px)'; for(let i=0;i<190;i++){ ctx.fillStyle=tone(pick([color,'#C98530','#A85E1E','#F5DC94']),rr(-.15,.1),rr(.35,.85)); blob(a.x+R()*a.w,a.y+R()*a.h,rr(6,22),.45,8); ctx.fill(); }
  ctx.filter='blur(6px)'; ctx.strokeStyle='rgba(120,60,15,.45)'; ctx.lineWidth=22; rrect(a.x+4,a.y+4,a.w-8,a.h-8,20); ctx.stroke(); ctx.filter='none';
  for(let i=0;i<70;i++){ const x=a.x+R()*a.w, y=a.y+R()*a.h; ctx.fillStyle=`rgba(110,55,15,${rr(.25,.55)})`; blob(x,y,rr(3,7),.4,7); ctx.fill(); ctx.fillStyle='rgba(255,240,190,.55)'; blob(x-2,y-2,rr(1.5,3),.4,6); ctx.fill(); }
  textura(()=>rrect(a.x,a.y,a.w,a.h,22),.3); ctx.restore(); }
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

function G(sp){ return ()=>{ if(sp.tosta){ tostas(); return; } if(sp.usar&&P[sp.usar]){ P[sp.usar](); return; }
  const ret=sp.v==='cuenco'?V.cuenco(sp.vo||{}):V[sp.v](sp.vo||{}); VASO=sp.v; const r=radioDe(ret); AREA=typeof ret==='object'?ret:null; if(AREA&&sp.fondo){ ctx.save(); rrect(AREA.x,AREA.y,AREA.w,AREA.h,22); ctx.clip(); ctx.fillStyle=sp.fondo; ctx.fillRect(AREA.x,AREA.y,AREA.w,AREA.h); manchas(240,sp.fondo,30,.1); ctx.restore(); }
  if(sp.gratin){ gratinado(ret,sp.gratin,sp.asoma); I.perejil(150,34); acompanar(r,sp.acc); return; }
  if(sp.rellenos){ rellenos(ret,sp.rellenos); return; }
  if(sp.pizza){ pizzaSobre(r/0.86*0.86,sp.pizza); return; }
  if(sp.empanada){ empanada(r); return; }
  if(sp.tosta){ return; }
  if(sp.tortilla){ ponerTrozos(r,sp.it); tortillaPlato(r*(sp.it&&sp.it.length?.8:1),sp.tortilla,sp.omelette); if(sp.quiche){ esparcir((x,y)=>I.calabacin(x,y,14),10,r*.6); } else if(!sp.omelette) I.pan(CX+r*.74,CY-r*.6,34,.6); return; }
  if(sp.revuelto){ revuelto(r,sp.revuelto); return; }
  if(sp.sandwich){ sandwich(r); return; }
  if(sp.nachos){ nachos(ret); ponerTrozos(r,sp.it); return; }
  if(sp.b){ const [k,...a]=sp.b; B[k](r,...a); }
  if(sp.zonas){ const n=sp.zonas.length; sp.zonas.forEach((z,i)=>{ const [k,m,sz,...ex]=z; const a0=-Math.PI*.5+i*(Math.PI*2/n), a1=a0+Math.PI*2/n-.06;
    ctx.save(); ctx.beginPath(); ctx.moveTo(CX,CY); ctx.arc(CX,CY,r,a0,a1); ctx.closePath(); ctx.clip();
    for(let j=0;j<Math.round(m*1.7);j++){ const a=rr(a0,a1), d=rr(.25,.95)*r; I[k](CX+Math.cos(a)*d,CY+Math.sin(a)*d,sz*rr(.9,1.1),...ex); } ctx.restore(); }); }
  if(sp.mejillon) mejillones(r);
  ponerTrozos(r,sp.it);
  if(sp.maiz) maizGranos(r,60);
  if(sp.b&&sp.b[0]==='crema'){ B.aceite(r*.5,10,'#E3B23A'); }
  if(['cazuela','cuenco','paellera'].includes(sp.v)) sombraInterior(r,.32);
  for(const [k,f,n] of (sp.fin||[['perejil',.55,30]])) I[k](r*f,n);
  acompanar(r,sp.acc);
}; }
// Las tostas usan la pizarra entera
function GT(){ return ()=>tostas(); }
// Filete claro (pollo a la plancha o empanado)
I.fileteClaro=(x,y,s=70,rot=0,tipo='pollo')=>{ const col=tipo==='empanado'?'#D89A48':'#E3BE84'; ctx.save(); ctx.translate(x,y); ctx.rotate(rot); sombra(s,.35);
  ctx.fillStyle=lit(0,0,s,col,.3,-.35); blob(0,0,s,.1,14,0,1.25,.72); ctx.fill(); sinSombra(); textura(()=>blob(0,0,s,.1,14,0,1.25,.72),tipo==='empanado'?.55:.25);
  if(tipo==='empanado'){ for(let i=0;i<60;i++){ ctx.fillStyle=pick(['rgba(150,90,30,.45)','rgba(240,200,120,.5)']); blob(rr(-s,s),rr(-s*.6,s*.6),rr(2,4),.4,6); ctx.fill(); } }
  else { ctx.strokeStyle='rgba(120,70,25,.45)'; ctx.lineWidth=6; ctx.lineCap='round'; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*s*.35-s*.3,-s*.5); ctx.lineTo(i*s*.35+s*.3,s*.5); ctx.stroke(); } }
  brillo(-s*.4,-s*.3,s*.5,s*.16,.3); ctx.restore(); };
// Montoncito de arroz blanco como guarnición
I.montonArroz=(x,y,s=70,rot=0,color='#F7F1E1')=>{ ctx.save(); sombra(30,.25); ctx.fillStyle=lit(x,y,s,color,.2,-.3); blob(x,y,s,.12,16,rot,1.15,.85); ctx.fill(); sinSombra(); ctx.save(); blob(x,y,s,.12,16,rot,1.15,.85); ctx.clip();
  for(let i=0;i<260;i++){ const a=R()*6.3, d=Math.sqrt(R())*s; const xx=x+Math.cos(a)*d*1.1, yy=y+Math.sin(a)*d*.85; ctx.fillStyle=pick(['#FFFFFF','#F2EBD6','#E9E0C6','#FBF7EC']); ctx.beginPath(); ctx.ellipse(xx,yy,4.2,1.9,R()*3,0,6.3); ctx.fill(); }
  ctx.restore(); ctx.restore(); };
