// Mapa cest – verze jen pro GitHub Pages (bez databáze, data v telefonu)


const MAP = window.MAP;
const ORDER=["Evropa","Asie","Afrika","Severní Amerika","Jižní Amerika","Oceánie","Antarktida"];
const visited=new Set(); const dates={};
let viewing=null, people={}, uid=null, me={name:'',nameKey:'',home:'CZ',following:[]};
function km(a,b){const R=6371,r=Math.PI/180,[la1,lo1]=a,[la2,lo2]=b;const x=Math.sin((la2-la1)*r/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin((lo2-lo1)*r/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
function homeOf(p){return (p&&byId[p.home])?p.home:'CZ';}
function ptsOf(id,home){if(!byId[id])return 0;return Math.max(1,Math.ceil(km(byId[home||'CZ'].ll,byId[id].ll)/100));}
function scoreOf(arr,home){return arr.reduce((s,id)=>s+ptsOf(id,home),0);}
function shownHome(){return viewing?homeOf(people[viewing]):homeOf(me);}
function shownSet(){return viewing?new Set((people[viewing]?.visited)||[]):visited;}
function shownDates(){return viewing?((people[viewing]?.dates)||{}):dates;}
const byId={}; MAP.c.forEach(c=>byId[c.id]=c);
const NS="http://www.w3.org/2000/svg";
const svg=document.getElementById('map');
svg.setAttribute('viewBox',`0 0 ${MAP.W} ${MAP.H}`);
const g=document.createElementNS(NS,'g'); svg.appendChild(g);
const sp=document.createElementNS(NS,'path'); sp.setAttribute('d',MAP.sphere); sp.setAttribute('class','sphere'); g.appendChild(sp);
const els={};
MAP.c.forEach(c=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',c.d);p.setAttribute('class','c');p.dataset.id=c.id;g.appendChild(p);els[c.id]=p;});
const tip=document.getElementById('tip');

// view / zoom / pan
let vb={x:0,y:0,w:MAP.W,h:MAP.H};
function setVB(v){const minW=40;v.w=Math.max(minW,Math.min(MAP.W,v.w));v.h=v.w*MAP.H/MAP.W;
  v.x=Math.max(0,Math.min(MAP.W-v.w,v.x));v.y=Math.max(0,Math.min(MAP.H-v.h,v.y));vb=v;svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.w} ${v.h}`);}
function zoom(f,cx=vb.x+vb.w/2,cy=vb.y+vb.h/2){const w=vb.w/f;setVB({x:cx-(cx-vb.x)/f,y:cy-(cy-vb.y)/f,w});}
document.getElementById('zin').onclick=()=>zoom(1.6);
document.getElementById('zout').onclick=()=>zoom(1/1.6);
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();
  zoom(e.deltaY<0?1.25:0.8,vb.x+(e.clientX-r.left)/r.width*vb.w,vb.y+(e.clientY-r.top)/r.height*vb.h);},{passive:false});
const ptrs=new Map(); let moved=0, pinch0=null;
svg.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;svg.setPointerCapture(e.pointerId);svg.classList.add('drag');
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);}});
svg.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId)){const t=e.target.dataset?.id;if(t){tip.hidden=false;tip.textContent=byId[t].n+(visited.has(t)?' ✓':'');}else tip.hidden=true;return;}
  const prev=ptrs.get(e.pointerId);const r=svg.getBoundingClientRect();
  if(ptrs.size===2){ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);
    if(pinch0){zoom(d/pinch0,vb.x+((a.x+b.x)/2-r.left)/r.width*vb.w,vb.y+((a.y+b.y)/2-r.top)/r.height*vb.h);}pinch0=d;moved+=10;return;}
  const dx=e.clientX-prev.x,dy=e.clientY-prev.y;moved+=Math.abs(dx)+Math.abs(dy);
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  setVB({x:vb.x-dx/r.width*vb.w,y:vb.y-dy/r.height*vb.h,w:vb.w});});
function up(e){const wasTap=ptrs.size===1&&moved<6;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=null;if(!ptrs.size)svg.classList.remove('drag');
  if(wasTap){const el=document.elementFromPoint(e.clientX,e.clientY);const id=el?.dataset?.id;if(id){toggle(id);tip.hidden=false;tip.textContent=byId[id].n+(visited.has(id)?' ✓ navštíveno':' — odebráno');}}}
svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);svg.classList.remove('drag');});
svg.addEventListener('pointerleave',()=>{if(!ptrs.size)tip.hidden=true;});

// region chips
const regBox={};
const regionsEl=document.getElementById('regions');
function regionBox(r){if(regBox[r])return regBox[r];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  MAP.c.filter(c=>c.r===r).forEach(c=>{const b=els[c.id].getBBox();if(b.width*b.height>3000&&r!=="Oceánie")return; x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.width);y1=Math.max(y1,b.y+b.height);});
  return regBox[r]={x0,y0,x1,y1};}
const PRESET={"Evropa":[400,40,200],"Asie":[560,40,380],"Afrika":[400,170,250],"Severní Amerika":[60,30,380],"Jižní Amerika":[180,230,260],"Oceánie":[700,230,260]};
["Celý svět",...Object.keys(PRESET)].forEach(r=>{const b=document.createElement('button');b.className='chip';b.textContent=r;b.setAttribute('aria-pressed',r==="Celý svět");
  b.onclick=()=>{regionsEl.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');
    if(r==="Celý svět")setVB({x:0,y:0,w:MAP.W});else{const [x,y,w]=PRESET[r];setVB({x,y,w});}};regionsEl.appendChild(b);});

// list
const listEl=document.getElementById('list'), q=document.getElementById('q');
const rows={};
ORDER.forEach(r=>{const items=MAP.c.filter(c=>c.r===r).sort((a,b)=>a.n.localeCompare(b.n,'cs'));if(!items.length)return;
  const h=document.createElement('div');h.className='grp';h.textContent=r;h.dataset.r=r;listEl.appendChild(h);
  items.forEach(c=>{const d=document.createElement('div');d.className='row';d.tabIndex=0;d.setAttribute('role','checkbox');d.dataset.r=r;
    d.innerHTML='<span class="box"></span><span class="fl"></span><span class="nm"></span><span class="pt"></span>';d.querySelector('.fl').textContent=flag(c.id);d.querySelector('.nm').textContent=c.n;
    d.onclick=()=>toggle(c.id);d.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle(c.id);}};
    rows[c.id]=d;listEl.appendChild(d);});});
const fold=s=>s.toLocaleLowerCase('cs').normalize('NFD').replace(/\p{M}/gu,'');
let listReg=null;
function filterList(){const s=fold(q.value.trim());const vis={};
  MAP.c.forEach(c=>{const m=(!listReg||c.r===listReg)&&(!s||fold(c.n).includes(s)||fold(c.r).includes(s)||(s.length>=4&&fold(c.r).startsWith(s.slice(0,4))));rows[c.id].hidden=!m;if(m)vis[c.r]=1;});
  listEl.querySelectorAll('.grp').forEach(h=>h.hidden=!vis[h.dataset.r]);}
q.addEventListener('input',filterList);
const lchips=document.getElementById('lchips');
['Vše',...ORDER.filter(r=>r!=='Antarktida')].forEach(r=>{const bt=document.createElement('button');bt.className='chip';bt.textContent=r;bt.setAttribute('aria-pressed',r==='Vše');
  bt.onclick=()=>{listReg=r==='Vše'?null:r;lchips.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===bt));filterList();listEl.scrollTop=0;};lchips.appendChild(bt);});

// welcome box
const welcomeEl=document.getElementById('welcome');
function welcomeSeen(){try{return localStorage.getItem('mapa-welcome-ok')==='1';}catch(e){return false;}}
let welcomeOpen=!welcomeSeen();
document.getElementById('gotIt').onclick=()=>{welcomeOpen=false;try{localStorage.setItem('mapa-welcome-ok','1');}catch(e){}render();};
function renderWelcome(who){welcomeEl.hidden=!!who||!welcomeOpen;const sub=document.getElementById('sub');
  if(who){sub.textContent='Tady se jen díváš. Svoje země označuješ na své mapě.';sub.hidden=false;return;}
  sub.hidden=welcomeOpen;sub.textContent='Klepni na zemi na mapě nebo ji zaškrtni v seznamu. ';
  const b=document.createElement('button');b.className='howto';b.textContent='Jak to funguje?';b.onclick=()=>{welcomeOpen=true;render();welcomeEl.scrollIntoView({block:'nearest'});};sub.appendChild(b);}

// render
const TOTAL=MAP.c.filter(c=>c.r!=="Antarktida").length;
function render(){
  const SV=shownSet(), HOME=shownHome();
  MAP.c.forEach(c=>{const v=SV.has(c.id);els[c.id].classList.toggle('v',v);rows[c.id].classList.toggle('v',v);rows[c.id].setAttribute('aria-checked',v);rows[c.id].querySelector('.box').textContent=v?'✓':'';rows[c.id].querySelector('.pt').textContent='+'+ptsOf(c.id,HOME);});
  const n=SV.size;document.getElementById('n').textContent=n;document.getElementById('pts').textContent=scoreOf([...SV],HOME);
  const who=viewing?(people[viewing]?.name||'Cestovatel'):null;
  const ownerName=who||me.name;const poss=possessive(ownerName,'f');document.getElementById('title').textContent=poss?(poss+' mapa cest'):'Moje mapa cest';
  renderWelcome(who);
  document.getElementById('viewing').hidden=!who;if(who)document.getElementById('viewingTxt').textContent='Díváš se na mapu: '+who;
  document.getElementById('countriesPanel').classList.toggle('ro',!!who);
  document.getElementById('pct').textContent=`${n===1?'země':n>=2&&n<=4?'země':'zemí'} · ${Math.round(n/TOTAL*100)} % světa`;
  const bars=document.getElementById('bars');bars.innerHTML='';
  ORDER.filter(r=>r!=="Antarktida").forEach(r=>{const all=MAP.c.filter(c=>c.r===r);const k=all.filter(c=>SV.has(c.id)).length;
    const d=document.createElement('div');d.className='bar';d.innerHTML=`<div class="lab"><span></span><span>${k} / ${all.length}</span></div><div class="track"><div class="fill" style="width:${k/all.length*100}%"></div></div>`;
    d.querySelector('span').textContent=r;bars.appendChild(d);});
  const st=document.getElementById('stamps');st.innerHTML='';
  const vs=[...SV].filter(id=>byId[id]).sort((a,b)=>byId[a].n.localeCompare(byId[b].n,'cs'));
  if(!vs.length){const p=document.createElement('p');p.className='empty';p.textContent=viewing?'Zatím žádná razítka.':'Zatím žádná razítka. Začni třeba Českem.';st.appendChild(p);}
  vs.forEach(id=>{const b=document.createElement('button');b.className='stamp';b.textContent=byId[id].n;b.title='Ukázat na mapě';
    b.onclick=()=>{const bb=els[id].getBBox();const w=Math.max(60,Math.max(bb.width,bb.height*MAP.W/MAP.H)*2.5);setVB({x:bb.x+bb.width/2-w/2,y:bb.y+bb.height/2-w*MAP.H/MAP.W/2,w});
      els[id].classList.remove('flash');void els[id].getBBox();els[id].classList.add('flash');};st.appendChild(b);});
  renderSocial();renderRules();
}
function toggle(id){if(viewing){tip.hidden=false;tip.textContent='Tohle je mapa kamaráda. Svoje země označíš na své mapě.';return;}if(visited.has(id)){visited.delete(id);delete dates[id];}else{visited.add(id);dates[id]=Date.now();justAdded=id;}render();save();}
let justAdded=null;

// passport
const passEl=document.getElementById('pass');
const INKS=['#1d4f9a','#b0243b','#1f7a4d','#6a3d9a','#a35200','#0d7c86','#2f2f2f'];
const ICONS={
 turtle:'<ellipse cx="11.5" cy="13" rx="6" ry="4.5"/><circle cx="19.3" cy="12.2" r="1.8"/><path d="M8 16.8l-2 2.4M15 16.8l1.6 2.4M8 9.3L6 7M15 9.3l1.6-2.4M5.5 13H3.6M8.5 11l3 2 3-2M11.5 13v4"/>',
 palm:'<path d="M12 21c0-5 1.2-8.5 0-12M12 9C10 6 6 6 3.5 8c3 0 5.5 0 8.5 1zM12 9c2-3 6-3 8.5-1-3 0-5.5 0-8.5 1zM12 9c-1-3-4-5-6.5-5 2 1.8 4.5 3 6.5 5zM12 9c1-3 4-5 6.5-5-2 1.8-4.5 3-6.5 5zM5 21c3-1.5 11-1.5 14 0"/>',
 eiffel:'<path d="M12 2v3M10.6 5h2.8l3.4 16.5M10.6 5L7.2 21.5M8.6 12.5h6.8M7.9 16.8h8.2M9.8 21.5c0-3.2 4.4-3.2 4.4 0"/>',
 mountain:'<path d="M2 20l7-12 4 6 3-4 6 10zM7 11.4l2 1.6 2-1.6"/>',
 castle:'<path d="M4 21V8h3v2h2V8h2v3h2V8h2v2h2V8h3v13zM10 21v-4a2 2 0 014 0v4M12 3v5M12 3l3 1-3 1"/>',
 pyramid:'<path d="M2 20L9 7l7 13M10 20l5-9 7 9M2 20h20M5.5 14h7"/>',
 pagoda:'<path d="M12 2v2M5 7h14l-2-3H7zM7 7v3M17 7v3M4 13h16l-2-3H6zM7 13v8M17 13v8M10 21v-4h4v4M4 21h16"/>',
 tulip:'<path d="M12 22V12M12 12c-4 0-5-3-5-7l2.5 2L12 4l2.5 3L17 5c0 4-1 7-5 7zM12 19c-2-2-5-2-6-1 2 0 4 1 6 3M12 18c2-2 4-2 5-1-2 0-3 1-5 3"/>',
 maple:'<path d="M12 2l1.5 4 2.5-1-1 5 3-2 1 2.5L22 12l-3 1.5.5 2.5-4-1 .5 3.5-3-1.5h-2l-3 1.5.5-3.5-4 1 .5-2.5L2 12l3-1.5 1-2.5 3 2-1-5 2.5 1zM12 19v3"/>',
 crown:'<path d="M3 18L2 7l5 4 5-7 5 7 5-4-1 11zM3 21h18"/>',
 columns:'<path d="M3 9l9-6 9 6zM5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 18h18M2 21h20"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 star:'<path d="M12 2.5l2.9 6.2 6.8.9-5 4.7 1.3 6.7L12 17.7 6 21l1.3-6.7-5-4.7 6.8-.9z"/>',
 plane:'<path d="M21 4.5c-.8-.8-2.2-.6-3 .2L14.5 8 5 5.5 3.5 7l7.5 4.5-3 3H5l-1.5 1.5L7 17.5 8.5 21 10 19.5v-3l3-3 4.5 7.5 1.5-1.5L16.5 11l3.3-3.5c.8-.8 1-2.2.2-3z"/>'
};
const MOTIF={};
Object.entries({
 turtle:'MV SC EC',
 palm:'MU FJ BS JM CU DO BB LK ID PH PF WS TO VU KM CV TT AG LC VC GD KN BZ PW MH KI TV NR FM SB ST AE BH QA OM',
 eiffel:'FR', crown:'GB MC', tulip:'NL', maple:'CA', star:'US',
 mountain:'CH AT NP NO IS NZ PE BO CL KG TJ BT LI AD SI GE AM MN',
 castle:'CZ DE SK PL HU RO BE LU DK SE IE RS BG LT LV EE UA',
 columns:'IT GR VA SM MT CY TR',
 pyramid:'EG SD MX GT',
 pagoda:'JP CN KR TH VN LA KH MM TW SG IN HK MO KP',
 sun:'ES PT HR ME AL MA TN AU ZA KE TZ AR UY BR CO'
}).forEach(([k,v])=>v.split(' ').forEach(id=>MOTIF[id]=k));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MALE_A=new Set(['kuba','honza','jirka','pepa','franta','vojta','tonda','ondra','láďa','lukáš','mira','míra','jarda','standa','zbyňa','olda','venca','vašek','péťa','sáva','nikola','saša','míša','kája','tom']);
const MALE_A_ONLY=new Set(['kuba','honza','jirka','pepa','franta','vojta','tonda','ondra','láďa','míra','jarda','standa','zbyňa','olda','venca','péťa']);
const FEM_CONS=new Set(['ester','dagmar','miriam','ingrid','agnes','carmen','nicol','rút','ruth','noemi','karin','kristin','elisabeth','sarah','hannah','mirjam','ilse','lilian','vivian']);
// possessive of a first name; noun gender 'f' (mapa) or 'm' (pas)
function possessive(full,g){
  const w=(full||'').trim().split(/\s+/)[0];if(!w)return null;
  const low=w.toLocaleLowerCase('cs');const last=low.slice(-1);
  const F=g==='f';let stem,fem;
  if(last==='a'){
    if(MALE_A_ONLY.has(low)){stem=w.slice(0,-1);fem=false;}
    else{stem=w.slice(0,-1);fem=true;
      const pairs=[['ch','š'],['k','č'],['g','ž'],['h','ž'],['r','ř']];
      for(const [a,z] of pairs){if(stem.toLocaleLowerCase('cs').endsWith(a)){stem=stem.slice(0,-a.length)+z;break;}}}
  } else if(last==='e'||last==='ě'){stem=w.slice(0,-1);fem=true;}
  else if(last==='i'||last==='y'||last==='í'||last==='ý'){stem=w;fem=true;
    return stem+(F?'na':'n');}
  else if(last==='o'){stem=w.slice(0,-1);fem=false;}
  else if(FEM_CONS.has(low)){stem=low.endsWith('r')?w.slice(0,-1)+'ř':w;fem=true;}
  else{fem=false;stem=w;
    if(/[^aeiouyáéíóúůý]e[kcl]$/i.test(low)&&!/(ie|ue)[kcl]$/.test(low))stem=w.slice(0,-2)+w.slice(-1);}
  if(fem)return stem+(F?'ina':'in');
  return stem+(F?'ova':'ův');
}
function flag(id){return /^[A-Z]{2}$/.test(id)?String.fromCodePoint(...[...id].map(ch=>127397+ch.charCodeAt(0))):'🏳️';}
const SCH={AT:'A',BE:'B',BG:'BG',HR:'HR',CZ:'CZ',DK:'DK',EE:'EST',FI:'FIN',FR:'F',DE:'D',GR:'GR',HU:'H',IS:'IS',IT:'I',LV:'LV',LI:'FL',LT:'LT',LU:'L',MT:'M',NL:'NL',NO:'N',PL:'PL',PT:'P',RO:'RO',SK:'SK',SI:'SLO',ES:'E',SE:'S',CH:'CH'};
function schengenSVG(c,id,h,date){
  const code=SCH[id];let stars='';for(let i=0;i<12;i++){const a=i*Math.PI/6;stars+=`<text x="${(32+17*Math.sin(a)).toFixed(1)}" y="${(37-17*Math.cos(a)+2.6).toFixed(1)}" font-size="7" text-anchor="middle">★</text>`;}
  const cap=esc(c.n.toLocaleUpperCase('cs'));const fc=Math.max(7.5,Math.min(12,150/Math.max(1,cap.length)));
  const no=String(h%1000).padStart(3,'0');
  return `<svg viewBox="0 0 172 112" filter="url(#ink)" aria-hidden="true">
    <rect class="ln" x="2" y="2" width="168" height="108" stroke-width="3"/>
    ${stars}<text x="32" y="${code.length>2?40.5:41.5}" font-size="${code.length>2?10:13}" text-anchor="middle">${code}</text>
    <text x="60" y="30" font-size="${fc}" letter-spacing="1">${cap}</text>
    <text x="60" y="46" font-size="8" letter-spacing="1.2">SCHENGEN · VSTUP</text>
    <text x="86" y="77" font-size="17" text-anchor="middle" letter-spacing="1">${date}</text>
    <g class="ic" transform="translate(14 84) scale(.85)">${ICONS.plane}</g>
    <text x="44" y="100" font-size="13">➔</text>
    <text x="158" y="100" font-size="13" text-anchor="end" letter-spacing="1">${no}</text>
  </svg>`;}
function usSVG(c,id,h,date,ts){
  const until=ts?new Date(ts+90*864e5):null;const u=until?until.getDate()+'.'+(until.getMonth()+1)+'.'+until.getFullYear():'—';
  return `<svg viewBox="0 0 172 112" filter="url(#ink)" aria-hidden="true">
    <rect class="ln" x="2" y="2" width="168" height="108" rx="5" stroke-width="2.4"/>
    <text x="86" y="15" font-size="7" text-anchor="middle" textLength="148" lengthAdjust="spacingAndGlyphs">DEPARTMENT OF HOMELAND SECURITY</text>
    <text x="86" y="25" font-size="7" text-anchor="middle" textLength="148" lengthAdjust="spacingAndGlyphs">U.S. CUSTOMS AND BORDER PROTECTION</text>
    <text x="86" y="44" font-size="15" text-anchor="middle" letter-spacing="3">ADMITTED</text>
    <text x="86" y="61" font-size="13" text-anchor="middle">${date}</text>
    <text x="16" y="78" font-size="9">CLASS: WT</text>
    <text x="16" y="91" font-size="9">UNTIL: ${u}</text>
    <text x="86" y="104" font-size="8.5" text-anchor="middle" letter-spacing="1.2">SPOJENÉ STÁTY · USA</text>
  </svg>`;}
function stampSVG(c,id,h,date,ts){
  if(SCH[id])return schengenSVG(c,id,h,date);
  if(id==='US')return usSVG(c,id,h,date,ts);
  const ic=ICONS[MOTIF[id]||'plane'];
  const name=esc(c.n.toLocaleUpperCase('cs')), cap='';
  const no=String(1000+h%9000);
  if(h%3!==0){ // round stamp
    const fs=Math.max(8,Math.min(13,230/c.n.length));
    const bottom=('IMMIGRATION'+(cap?' · '+cap:'')); const fb=Math.max(7,Math.min(10,200/bottom.length));
    const dashed=h%5===0?' stroke-dasharray="2 2.5"':'';
    return `<svg viewBox="0 0 140 140" filter="url(#ink)" aria-hidden="true">
      <defs><path id="t${id}" d="M22 70a48 48 0 0 1 96 0"/><path id="b${id}" d="M16 70a54 54 0 0 0 108 0"/></defs>
      <circle class="ln" cx="70" cy="70" r="66" stroke-width="3"${dashed}/><circle class="ln" cx="70" cy="70" r="61" stroke-width="1.2"/>
      <circle class="ln" cx="70" cy="70" r="38" stroke-width="1.4"/>
      <text font-size="${fs}" letter-spacing="1.5"><textPath href="#t${id}" startOffset="50%" text-anchor="middle">${name}</textPath></text>
      <text font-size="${fb}" letter-spacing="1"><textPath href="#b${id}" startOffset="50%" text-anchor="middle">${esc(bottom)}</textPath></text>
      <text x="22" y="74" font-size="10">★</text><text x="110" y="74" font-size="10">★</text>
      <g class="ic" transform="translate(58 37)">${ic}</g>
      <text x="70" y="78" font-size="11.5" text-anchor="middle">${date}</text>
      <text x="70" y="93" font-size="8.5" text-anchor="middle" letter-spacing="1.5">▲ ADMITTED</text>
    </svg>`;
  }
  const fs=Math.max(8,Math.min(14,250/c.n.length));
  return `<svg viewBox="0 0 172 112" filter="url(#ink)" aria-hidden="true">
    <rect class="ln" x="2" y="2" width="168" height="108" rx="${h%2?10:3}" stroke-width="3"/>
    <rect class="ln" x="7" y="7" width="158" height="98" rx="${h%2?6:1}" stroke-width="1.2"/>
    <text x="86" y="24" font-size="${fs}" text-anchor="middle" letter-spacing="1.5">${name}</text>
    <path class="ln" d="M14 31h144M58 31v62" stroke-width="1.2"/>
    <g class="ic" transform="translate(18 42) scale(1.45)">${ic}</g>
    <text x="68" y="48" font-size="9" letter-spacing="1.2">▲ ARRIVED</text>
    <text x="68" y="66" font-size="14">${date}</text>
    <text x="68" y="82" font-size="9" letter-spacing="1">VSTUP · ENTRY</text>
    <text x="86" y="100" font-size="7.5" text-anchor="middle" letter-spacing="1.5">IMMIGRATION · No. ${no}</text>
  </svg>`;
}
function hash(s){let h=7;for(const ch of s)h=(h*31+ch.charCodeAt(0))>>>0;return h;}
function fmt(t){if(!t)return '—';const d=new Date(t);return d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();}
function renderPass(){
  const SV=shownSet(), SD=shownDates();
  const n=SV.size;const owner=(viewing?people[viewing]?.name:me.name)||'';const pp=possessive(owner,'m');document.getElementById('passTitle').textContent=(pp?pp+' pas':'Můj pas').toLocaleUpperCase('cs');
  document.querySelector('#pass .pass-top strong').textContent=owner?('Pas: '+owner):'Můj pas';document.getElementById('passCnt').textContent=`${n} ${n===1?'RAZÍTKO':n>=2&&n<=4?'RAZÍTKA':'RAZÍTEK'}`;
  const pages=document.getElementById('pages');pages.innerHTML='';
  const ids=[...SV].filter(id=>byId[id]).sort((a,b)=>(SD[a]||0)-(SD[b]||0)||byId[a].n.localeCompare(byId[b].n,'cs'));
  const fl=document.getElementById('flagList');fl.innerHTML='';const HOME=shownHome();
  if(!ids.length){const li=document.createElement('li');li.className='none';li.textContent='Zatím žádné země.';fl.appendChild(li);}
  ids.forEach(id=>{const li=document.createElement('li');li.innerHTML='<span class="fl"></span><span class="fn"></span><span class="fd"></span><span class="fp"></span>';
    li.querySelector('.fl').textContent=flag(id);li.querySelector('.fn').textContent=byId[id].n;li.querySelector('.fd').textContent=fmt(SD[id]);li.querySelector('.fp').textContent='+'+ptsOf(id,HOME);fl.appendChild(li);});
  const per=6;const count=Math.max(1,Math.ceil(ids.length/per));
  for(let p=0;p<count;p++){const pg=document.createElement('section');pg.className='page';
    pg.innerHTML=`<div class="ph">VÍZA · VISAS</div><div class="sgrid"></div><div class="pno">${p+1}</div>`;
    const grid=pg.querySelector('.sgrid');
    const chunk=ids.slice(p*per,p*per+per);
    if(!chunk.length){const e=document.createElement('p');e.className='none';e.textContent='Zatím tu nic není. Označ na mapě první zemi.';pg.replaceChild(e,grid);}
    chunk.forEach(id=>{const c=byId[id],h=hash(id);const s=document.createElement('div');
      s.className='st'+((h%3===0||SCH[id]||id==='US')?' rect':'')+(id===justAdded?' new':'');s.setAttribute('role','img');s.setAttribute('aria-label','Razítko '+c.n);
      s.style.setProperty('--c',INKS[(h>>3)%INKS.length]);s.style.setProperty('--r',((h>>6)%25-12)+'deg');
      s.innerHTML=stampSVG(c,id,h,fmt(SD[id]),SD[id]);grid.appendChild(s);});
    pages.appendChild(pg);}
  justAdded=null;
}
document.getElementById('openPass').onclick=()=>{renderPass();passEl.hidden=false;passEl.scrollTop=0;document.body.style.overflow='hidden';document.getElementById('closePass').focus();};
function closePass(){passEl.hidden=true;document.body.style.overflow='';document.getElementById('openPass').focus();}
document.getElementById('closePass').onclick=closePass;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!passEl.hidden)closePass();});

// ---------- storage (this device only) ----------
const statusEl=document.getElementById('status');
const KEY='mapa-cest-v1';
let saveTimer=null, loaded=true;
function newId(){return 'u'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{
  const data={me:{id:me.id,name:me.name,home:me.home},visited:[...visited].sort(),dates:{...dates},friends:Object.fromEntries(Object.entries(people).filter(([k])=>!k.startsWith('__')))};
  try{localStorage.setItem(KEY,JSON.stringify(data));statusEl.textContent='Uloženo v tomto telefonu';}
  catch(e){statusEl.textContent='Uložit se nepodařilo. Prohlížeč možná nedovoluje ukládání (anonymní okno?).';}},300);}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(!d)return;
  me={id:d.me?.id||newId(),name:d.me?.name||'',home:d.me?.home&&byId[d.me.home]?d.me.home:'CZ',following:[]};
  (d.visited||[]).forEach(id=>byId[id]&&visited.add(id));Object.assign(dates,d.dates||{});people=d.friends||{};}catch(e){}}

// social
const socialEl=document.getElementById('social'), joinEl=document.getElementById('join');
function nm(p){return (p&&p.name)||'Bez jména';}
function countWord(n){return n===1?'země':n>=2&&n<=4?'země':'zemí';}
function view(id){viewing=(id&&id!==uid)?id:null;render();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
document.getElementById('backMe').onclick=()=>view(null);
let sureRm=null;
function removeFriend(id){if(sureRm!==id){sureRm=id;renderSocial();return;}sureRm=null;delete people[id];if(viewing===id)viewing=null;render();save();}
let leagueMode='all';
function renderLeague(mine){
  const lg=document.getElementById('league');lg.hidden=!me.name;
  let ids=Object.keys(people).filter(id=>id!==uid&&!id.startsWith('__')&&people[id]?.name);
  ids=[uid,...ids];
  const rows=ids.map(id=>{const p=id===uid?mine:people[id];const v=(p.visited||[]).filter(x=>byId[x]);const home=homeOf(p);
    let far=null,fk=-1;v.forEach(x=>{const d=km(byId[home].ll,byId[x].ll);if(d>fk){fk=d;far=x;}});
    return {id,name:nm(p),n:v.length,s:scoreOf(v,home),far};}).sort((a,b)=>b.s-a.s||b.n-a.n||a.name.localeCompare(b.name,'cs'));
  const tb=document.getElementById('ltb');tb.innerHTML='';let pos=0,prev=null;
  rows.forEach((r,i)=>{if(r.s!==prev){pos=i+1;prev=r.s;}
    const tr=document.createElement('tr');tr.className=(r.id===uid?'me ':'')+(pos<=3&&r.s>0?'m'+pos:'')+(r.id===viewing?' on':'');tr.tabIndex=0;
    tr.innerHTML=`<td class="c-pos"><span class="pos">${pos}.</span></td><td class="c-name"></td><td class="c-num">${r.n}</td><td class="c-far"></td><td class="c-num c-pts">${r.s}</td>`;
    tr.querySelector('.c-name').textContent=r.name+(r.id===uid?' (ty)':'');tr.querySelector('.c-far').textContent=r.far?byId[r.far].n:'–';
    tr.onclick=()=>view(r.id);tr.onkeydown=e=>{if(e.key==='Enter')view(r.id);};tb.appendChild(tr);});
  if(rows.length===1){const tr=document.createElement('tr');tr.className='hint';tr.innerHTML='<td colspan="5"></td>';
    tr.firstChild.textContent='Zatím jsi v tabulce sám/sama. Pošli kamarádům odkaz na svou mapu a ať ti pošlou svůj.';tb.appendChild(tr);}
}
function renderSocial(){
  
  socialEl.hidden=!me.name;
  const mine={name:me.name,home:me.home,visited:[...visited]};
  renderLeague(mine);
  document.getElementById('meline').textContent=`${me.name} · ${visited.size} ${countWord(visited.size)} · ${scoreOf([...visited],homeOf(me))} bodů`;
  const fc=Object.keys(people).filter(k=>!k.startsWith('__')).length;document.getElementById('mine').textContent=fc?`V tabulce máš ${fc} ${fc===1?'kamaráda':fc<5?'kamarády':'kamarádů'}.`:'Zatím nemáš žádné kamarády. Pošli jim odkaz na svoji mapu.';
  const q=document.getElementById('pq').value.trim().toLocaleLowerCase('cs');
  const list=document.getElementById('people');list.innerHTML='';
  const others=Object.entries(people).filter(([id,p])=>id!==uid&&!id.startsWith('__')&&p&&p.name&&(!q||p.name.toLocaleLowerCase('cs').includes(q)))
    .sort((a,b)=>scoreOf(b[1].visited||[],homeOf(b[1]))-scoreOf(a[1].visited||[],homeOf(a[1]))).slice(0,30);
  if(!others.length){const li=document.createElement('li');li.className='none';li.textContent=q?'Nikoho takového mezi kamarády nemáš.':'Zatím tu nikdo není. Až ti kamarád pošle odkaz na svoji mapu, otevři ho a přidej si ho.';list.appendChild(li);}
  others.forEach(([id,p])=>{const n=(p.visited||[]).length;const sure=sureRm===id;const li=document.createElement('li');
    li.innerHTML=`<button class="who"><span class="nmx"></span><span class="meta">${n} ${countWord(n)} · ${scoreOf(p.visited||[],homeOf(p))} bodů · z: ${byId[homeOf(p)].n}</span></button><button class="btn small ghost rm ${sure?'sure':''}">${sure?'Opravdu odebrat?':'Odebrat'}</button>`;
    li.querySelector('.nmx').textContent=p.name;li.querySelector('.who').onclick=()=>view(id);li.querySelector('.btn').onclick=()=>removeFriend(id);list.appendChild(li);});
}
document.getElementById('pq').addEventListener('input',renderSocial);
const sorted=MAP.c.filter(c=>c.r!=='Antarktida').sort((a,b)=>a.n.localeCompare(b.n,'cs'));
['joinHome','homeSel'].forEach(sid=>{const sel=document.getElementById(sid);sorted.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.n;sel.appendChild(o);});sel.value='CZ';});
document.getElementById('homeSel').addEventListener('change',e=>{me.home=e.target.value;render();save();});
function renderRules(){const home=shownHome();const ex=['DE','IT','EG','MV','JP','AU'].filter(id=>id!==home).slice(0,5);
  const tb=document.getElementById('ruleEx');tb.innerHTML='';ex.forEach(id=>{const tr=document.createElement('tr');
    tr.innerHTML=`<td></td><td>${Math.round(km(byId[home].ll,byId[id].ll)).toLocaleString('cs-CZ')} km</td><td>${ptsOf(id,home)} b.</td>`;tr.firstChild.textContent=byId[home].n+' → '+byId[id].n;tb.appendChild(tr);});}
const norm=s=>s.toLocaleLowerCase('cs').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]/g,'');
function nameProblem(v){if(v.length<2)return 'Jméno musí mít aspoň 2 znaky.';
  const k=norm(v);if(!k)return 'Jméno musí obsahovat písmena nebo čísla.';
  return '';}
function setName(v,errEl,inp){const err=nameProblem(v);errEl.textContent=err;if(err){inp.focus();return false;}me.name=v;save();return true;}
joinEl.addEventListener('submit',e=>{e.preventDefault();const inp=document.getElementById('joinName');const v=inp.value.trim().replace(/\s+/g,' ').slice(0,24);
  me.home=document.getElementById('joinHome').value||'CZ';
  const code=(document.getElementById('importCode').value||'').toUpperCase().match(/[A-Z]{2}/g)||[];
  code.forEach(id=>{if(byId[id]&&!visited.has(id)){visited.add(id);dates[id]=Date.now();}});
  if(setName(v,document.getElementById('joinErr'),inp)){document.getElementById('homeSel').value=me.home;joinEl.hidden=true;render();}});
document.getElementById('rename').addEventListener('submit',e=>{e.preventDefault();const inp=document.getElementById('renameIn');const v=inp.value.trim().replace(/\s+/g,' ').slice(0,24);
  if(v===me.name){inp.value='';return;}
  if(setName(v,document.getElementById('renameErr'),inp)){inp.value='';render();}});

// ---------- sharing by link ----------
const appUrl=location.origin+location.pathname;
function enc(o){const b=new TextEncoder().encode(JSON.stringify(o));let s='';b.forEach(x=>s+=String.fromCharCode(x));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function dec(t){const s=atob(t.replace(/-/g,'+').replace(/_/g,'/'));const b=Uint8Array.from(s,ch=>ch.charCodeAt(0));return JSON.parse(new TextDecoder().decode(b));}
function shareUrl(){return appUrl+'?m='+enc({i:me.id,n:me.name,h:me.home,v:[...visited].sort().join(''),t:Date.now()});}
document.getElementById('inviteBtn').onclick=async()=>{const url=shareUrl();const msg=document.getElementById('inviteMsg');
  if(navigator.share){try{await navigator.share({title:'Mapa cest',text:me.name+' ti posílá svoji mapu cest',url});return;}catch(_){}}
  try{await navigator.clipboard.writeText(url);msg.textContent='Odkaz zkopírován. Pošli ho kamarádům.';}catch(_){msg.textContent=url;}};

let incoming=null;
function parseIncoming(){const t=new URLSearchParams(location.search).get('m');if(!t)return;
  try{const o=dec(t);const v=(String(o.v||'').match(/[A-Z]{2}/g)||[]).filter(id=>byId[id]);
    if(!o.i||!o.n)return;incoming={id:String(o.i).slice(0,24),name:String(o.n).slice(0,24),home:byId[o.h]?o.h:'CZ',visited:v,updated:Number(o.t)||Date.now()};}catch(e){}}
function renderIncoming(){const el=document.getElementById('incoming');
  if(!incoming){el.hidden=true;return;}el.hidden=false;
  const isMe=incoming.id===me.id, known=!!people[incoming.id];
  document.getElementById('inTitle').textContent=isMe?'Tohle je odkaz na tvoji mapu':incoming.name+' ti poslal/a svoji mapu';
  document.getElementById('inMeta').textContent=`${incoming.visited.length} ${countWord(incoming.visited.length)} · ${scoreOf(incoming.visited,incoming.home)} bodů · z: ${byId[incoming.home].n}`;
  const add=document.getElementById('inAdd');add.hidden=isMe;add.textContent=known?'Aktualizovat v tabulce':'Přidat do kamarádů';
  document.getElementById('inMine').hidden=isMe?false:!!(me.name||visited.size);
  if(isMe)document.getElementById('inMine').textContent='Obnovit moji mapu z odkazu';}
function clearIncoming(){incoming=null;delete people.__in;if(viewing==='__in')viewing=null;history.replaceState(null,'',appUrl);renderIncoming();}
document.getElementById('inAdd').onclick=()=>{people[incoming.id]={name:incoming.name,home:incoming.home,visited:incoming.visited,dates:{},updated:incoming.updated};
  const id=incoming.id;clearIncoming();save();view(id);};
document.getElementById('inMine').onclick=()=>{me.id=incoming.id;me.name=incoming.name;me.home=incoming.home;visited.clear();
  incoming.visited.forEach(id=>visited.add(id));incoming.visited.forEach(id=>{if(!dates[id])dates[id]=incoming.updated;});
  joinEl.hidden=true;document.getElementById('homeSel').value=me.home;clearIncoming();viewing=null;save();render();};
document.getElementById('inClose').onclick=()=>{clearIncoming();view(null);};

// ---------- start ----------
load();if(!me.id)me.id=newId();uid=me.id;
document.getElementById('homeSel').value=me.home;
joinEl.hidden=!!me.name;
statusEl.textContent=me.name?'Uloženo v tomto telefonu':'';
parseIncoming();
if(incoming&&incoming.id!==me.id){people.__in={name:incoming.name,home:incoming.home,visited:incoming.visited,dates:{}};viewing='__in';}
render();renderIncoming();
