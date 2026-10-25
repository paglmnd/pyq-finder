(async function(){
'use strict';
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const view=$('#view'), top=$('#top');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={
  get(k,d){try{const v=localStorage.getItem('pyq_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem('pyq_'+k,JSON.stringify(v))}catch(e){}}
};
const state={
  bm:new Set(store.get('bm',[])), watched:new Set(store.get('watched',[])), later:new Set(store.get('later',[])),
  recents:store.get('recents',[]), hist:store.get('hist',[]), theme:store.get('theme','auto'), fs:store.get('fs',1),
  group:store.get('group',true), qsubj:'All', tab:'all', q:'', shown:30
};
const save=()=>{store.set('bm',[...state.bm]);store.set('watched',[...state.watched]);store.set('later',[...state.later]);store.set('recents',state.recents);store.set('hist',state.hist);store.set('theme',state.theme);store.set('fs',state.fs);store.set('group',state.group)};
function applyTheme(){document.documentElement.setAttribute('data-theme',state.theme);document.documentElement.style.setProperty('--fs',state.fs);
  const dark=state.theme==='dark'||(state.theme==='auto'&&matchMedia('(prefers-color-scheme:dark)').matches);
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=dark?'#181c33':'#4338ca'}
applyTheme();
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1600)}

/* ---------- data ---------- */
let DATA;
try{DATA=await (await fetch('data.json')).json()}catch(e){view.innerHTML='<div class="empty">Could not load data.json</div>';return}
const PY={Medicine:{c:'#1d4ed8',t:'#e8efff',s:'MED'},Surgery:{c:'#b91c1c',t:'#fdecec',s:'SUR'},'Obstetrics & Gynaecology':{c:'#be185d',t:'#fde8f1',s:'OBG'},Paediatrics:{c:'#b45309',t:'#fdf1e0',s:'PED'},ENT:{c:'#047857',t:'#e3f6ee',s:'ENT'},Ophthalmology:{c:'#6d28d9',t:'#efe9fd',s:'EYE'},Pharmacology:{c:'#0e7490',t:'#e0f4f8',s:'PHA'}};
const LS={'General Medicine':{c:'#1d4ed8',t:'#e8efff',p:'Medicine'},'General Surgery':{c:'#b91c1c',t:'#fdecec',p:'Surgery'},'Obstetrics & Gynaecology':{c:'#be185d',t:'#fde8f1',p:'Obstetrics & Gynaecology'},Paediatrics:{c:'#b45309',t:'#fdf1e0',p:'Paediatrics'},ENT:{c:'#047857',t:'#e3f6ee',p:'ENT'},Ophthalmology:{c:'#6d28d9',t:'#efe9fd',p:'Ophthalmology'},Dermatology:{c:'#9d174d',t:'#fce7f3'},Psychiatry:{c:'#4338ca',t:'#e8e9fd'},Orthopaedics:{c:'#92400e',t:'#fbeedd'},Anaesthesiology:{c:'#0f766e',t:'#dff5f2'},Radiology:{c:'#475569',t:'#eceff3'}};
const PYS=Object.keys(PY);
const SUBJ_ALIAS={medicine:'Medicine',med:'Medicine',surgery:'Surgery',surg:'Surgery',obg:'Obstetrics & Gynaecology',obs:'Obstetrics & Gynaecology',obstetrics:'Obstetrics & Gynaecology',gynae:'Obstetrics & Gynaecology',gynaecology:'Obstetrics & Gynaecology',paediatrics:'Paediatrics',pediatrics:'Paediatrics',peds:'Paediatrics',paeds:'Paediatrics',ent:'ENT',ophthalmology:'Ophthalmology',eye:'Ophthalmology',pharmacology:'Pharmacology',pharma:'Pharmacology'};
const ALIAS={dka:'diabetic ketoacidosis',mi:'myocardial infarction',ami:'acute myocardial infarction',acs:'acute coronary syndrome',ihd:'ischemic heart disease',mr:'mitral regurgitation',ms:'mitral stenosis',ar:'aortic regurgitation',as:'aortic stenosis',tb:'tuberculosis',copd:'chronic obstructive pulmonary disease',ards:'acute respiratory distress syndrome',uti:'urinary tract infection',hiv:'human immunodeficiency virus aids',pcos:'polycystic ovarian syndrome',pcod:'polycystic ovarian',pph:'postpartum hemorrhage',aph:'antepartum hemorrhage',iugr:'intrauterine growth restriction',iufd:'intrauterine fetal death',pet:'pre eclampsia',gdm:'gestational diabetes',mtp:'medical termination of pregnancy',iucd:'intrauterine device',ocp:'oral contraceptive',hrt:'hormone replacement therapy',ecg:'electrocardiogram',ckd:'chronic kidney disease',aki:'acute kidney injury',ra:'rheumatoid arthritis',sle:'systemic lupus erythematosus',itp:'immune thrombocytopenic purpura thrombocytopenic',cml:'chronic myeloid leukemia',aml:'acute myeloid leukemia',cll:'chronic lymphocytic leukemia',gerd:'gastroesophageal reflux',pud:'peptic ulcer',ibd:'inflammatory bowel disease',bph:'benign prostatic hyperplasia',dvt:'deep vein thrombosis',tof:'tetralogy of fallot',vsd:'ventricular septal defect',asd:'atrial septal defect',pda:'patent ductus arteriosus',ctev:'talipes equinovarus',ddh:'developmental dysplasia hip',csom:'chronic suppurative otitis media',pid:'pelvic inflammatory disease',hcg:'molar pregnancy',ors:'oral rehydration',sam:'severe acute malnutrition',lbw:'low birth weight',pem:'protein energy malnutrition',hie:'hypoxic ischemic encephalopathy',rds:'respiratory distress syndrome',ttn:'transient tachypnea',nsaid:'nonsteroidal',pcr:'polymerase',ca:'carcinoma cancer',cvs:'cardiovascular',cns:'central nervous',git:'gastrointestinal',gi:'gastrointestinal',ugib:'upper gastrointestinal bleeding',mnd:'motor neuron disease',gbs:'guillain barre',mg:'myasthenia gravis',tia:'transient ischemic attack',cva:'stroke cerebrovascular',mdr:'multidrug resistant',dots:'directly observed treatment tuberculosis',tpn:'total parenteral nutrition',gcs:'glasgow coma scale',eh:'extradural hematoma',edh:'extradural hematoma',cabg:'coronary bypass',pci:'percutaneous coronary',hf:'heart failure',chf:'congestive heart failure',htn:'hypertension',dm:'diabetes mellitus',ntm:'nontuberculous',lscs:'caesarean section',cs:'caesarean section',vbac:'vaginal birth after cesarean',art:'antiretroviral therapy',pep:'post exposure prophylaxis',pcv:'pneumococcal vaccine',ari:'acute respiratory infection',arf:'acute rheumatic fever renal failure',cn:'cranial nerve',lmn:'lower motor neuron',umn:'upper motor neuron',aids:'acquired immunodeficiency'};
const PSYN={Medicine:'med general medicine',Surgery:'surg general surgery','Obstetrics & Gynaecology':'obg obs gynae gynaecology obstetrics',Paediatrics:'paeds peds pediatrics pedia',ENT:'ent ear nose throat',Ophthalmology:'eye ophthal',Pharmacology:'pharma'};
const SYN={'heart attack':'myocardial infarction','sugar':'diabetes','fits':'seizure epilepsy','fit':'seizure','stones':'stone','piles':'hemorrhoids','goitre':'goiter','cataract':'cataract lens'};
const canon=w=>w.replace(/ae/g,'e').replace(/oe/g,'e').replace(/our\b/g,'or').replace(/ph(?=[aeiou])/g,'f').replace(/ee/g,'e').replace(/([a-z])\1+/g,'$1');
const toks=s=>(s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(Boolean));
const ctoks=s=>toks(s).map(canon);
const normk=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
function lev1(a,b){if(a===b)return true;const la=a.length,lb=b.length;if(Math.abs(la-lb)>1)return false;let i=0,j=0,e=0;while(i<la&&j<lb){if(a[i]===b[j]){i++;j++}else{if(++e>1)return false;if(la>lb)i++;else if(lb>la)j++;else{i++;j++}}}return e+(la-i)+(lb-j)<=1}

/* ---------- build model ---------- */
const LEC=new Map();DATA.lectures.forEach(l=>{LEC.set(l.c,Object.assign({qs:[],us:[],subjSet:new Set(),yrs:{}},l,{tk:new Set(ctoks(l.t+' '+l.g+' '+l.s)),nt:normk(l.t)}))});
const LSUBJ=[...new Set(DATA.lectures.map(l=>l.s))];
const PAPERS=DATA.papers;const PMAP=new Map(PAPERS.map(p=>[p.id,p]));
const QS=[],UNITS=[];
const tkSet=s=>new Set(ctoks(s));
PAPERS.forEach(p=>{
  p.sections.forEach((s,si)=>s.q.forEach((q,qi)=>{
    const Q={id:p.id+'-'+si+'-'+qi,p,si,qi,sec:s,q,subj:p.subject,year:p.year,links:new Map(),txt:''};
    const texts=[];
    q.a.forEach((a,ai)=>{
      if(a.s)texts.push(a.s);a.p.forEach(x=>texts.push(x.t));
      const add=(arr,part,text,key)=>{
        const u={Q,ai,part,text,key,links:arr.map(x=>x[0])};
        UNITS.push(u);
        arr.forEach(([c,ap])=>{
          const L=LEC.get(c);if(!L)return;
          let e=Q.links.get(c);if(!e){e={ap:true,parts:[],whole:false};Q.links.set(c,e)}
          e.ap=e.ap&&!!ap;if(part)e.parts.push('('+part+')'+(ai?' OR':''));else e.whole=true;
          u.apx=u.apx||{};u.apx[c]=!!ap;
        });
      };
      if(a.l.length)add(a.l,null,a.p.length?(a.s+' '+a.p.map(x=>'('+x.k+') '+x.t).join(' / ')):a.s,'');
      a.p.forEach(x=>{if(x.l.length)add(x.l,x.k,x.t,x.k)});
    });
    Q.txt=texts.join(' ');Q.tk=tkSet(Q.txt+' '+p.subject+' '+p.label);Q.nt=normk(Q.txt);
    QS.push(Q);
  }));
});
const QMAP=new Map(QS.map(q=>[q.id,q]));
UNITS.forEach(u=>u.links.forEach(c=>{const L=LEC.get(c);if(!L)return;L.us.push(u);if(!L.qs.includes(u.Q))L.qs.push(u.Q);L.subjSet.add(u.Q.subj);L.yrs[u.Q.year]=(L.yrs[u.Q.year]||0)+1}));
const lecCount=L=>L.qs.length;
function addHist(t,id){state.hist=[{t,id},...state.hist.filter(h=>!(h.t===t&&h.id===id))].slice(0,30);save()}
// unique unit groups per lecture (by text)
function lecGroups(L){const m=new Map();L.us.forEach(u=>{const k=normk(u.text);if(!m.has(k))m.set(k,[]);m.get(k).push(u)});return [...m.values()]}
LEC.forEach(L=>{L.groups=lecGroups(L);L.n_q=L.groups.length;L.density=L.m?L.n_q/(L.m/60):0});
const VOCAB=new Set();QS.forEach(q=>q.tk.forEach(t=>VOCAB.add(t)));LEC.forEach(l=>l.tk.forEach(t=>VOCAB.add(t)));

/* ---------- search ---------- */
function parseQuery(raw){
  let years=[],subjects=[];const words=[];
  let s=' '+raw.toLowerCase()+' ';
  Object.keys(SYN).forEach(k=>{if(s.includes(' '+k+' '))s=s.replace(' '+k+' ',' '+SYN[k]+' ')});
  const all=toks(s);
  all.forEach(w=>{
    if(/^(19|20)\d\d$/.test(w)){years.push(+w);return}
    words.push(w);
  });
  for(let i=words.length-1;i>=0;i--){const sj=SUBJ_ALIAS[words[i]];if(sj){subjects.push(sj);words.splice(i,1)}}
  const terms=words.map(w=>{
    const opts=[[canon(w)]];
    if(ALIAS[w])opts.push(ctoks(ALIAS[w]));
    return {w,opts};
  });
  return {raw,years,subjects,terms};
}
function tokScore(qt,D){
  if(D.has(qt))return 3;
  if(qt.length>=3){for(const d of D){if(d.startsWith(qt))return 2}}
  if(qt.length>=5){for(const d of D){if(lev1(qt,d))return 1}}
  return 0;
}
function termScore(term,D){
  let best=0;
  for(const opt of term.opts){let sum=0,ok=true;for(const t of opt){const sc=tokScore(t,D);if(!sc){ok=false;break}sum+=sc}if(ok)best=Math.max(best,sum/opt.length*(opt.length>1?1.3:1))}
  return best;
}
function scoreDoc(P,D,full,nt){
  let sum=0,matched=0;
  for(const t of P.terms){const s=termScore(t,D);if(s){matched++;sum+=s}}
  const ok=matched===P.terms.length;
  let sc=sum;
  if(ok&&P.terms.length>1&&nt&&nt.includes(normk(P.raw)))sc+=4;
  return {ok,matched,score:sc};
}
function search(raw){
  const P=parseQuery(raw);
  const res={P,lecs:[],qs:[],papers:[],partial:false};
  if(!P.terms.length&&!P.years.length&&!P.subjects.length)return res;
  // papers (years / subjects / labels)
  {const pw=[...P.years.map(String),...P.terms.map(t=>t.w)];
   const subjw=P.subjects.length?P.subjects:[];
   PAPERS.forEach(p=>{
     const D=new Set(ctoks(p.subject+' '+p.label+' '+p.yl+' '+p.sitting+' '+p.pid+' '+(PSYN[p.subject]||'')));
     if(!pw.length&&!subjw.length)return;
     let ok=true;for(const w of pw){const cw=canon(w);if(!(D.has(cw)||[...D].some(d=>d.startsWith(cw)&&cw.length>=3))){ok=false;break}}
     if(ok&&subjw.length&&!subjw.includes(p.subject))ok=false;
     if(ok)res.papers.push(p);
   });
   res.papers.sort((a,b)=>PYS.indexOf(a.subject)-PYS.indexOf(b.subject)||(b.year||0)-(a.year||0));}
  // lectures
  if(P.terms.length){
    LEC.forEach(L=>{
      const r=scoreDoc(P,L.tk,true,L.nt);
      if(r.ok){let sc=r.score+(L.nt.startsWith(normk(P.raw))?3:0);res.lecs.push({L,score:sc})}
    });
    res.lecs.sort((a,b)=>b.score-a.score||b.L.n_q-a.L.n_q);
  }
  // questions
  const seen=new Map();
  const consider=(Q,sc,via)=>{
    if(P.years.length&&!P.years.includes(Q.year))return;if(P.subjects.length&&!P.subjects.includes(Q.subj))return;
    const e=seen.get(Q.id);if(!e||e.score<sc)seen.set(Q.id,{Q,score:sc,via:e?e.via&&via:via});
  };
  if(P.terms.length){
    QS.forEach(Q=>{const r=scoreDoc(P,Q.tk,false,Q.nt);if(r.ok)consider(Q,r.score+1,false)});
    // via lectures (strong lecture matches)
    res.lecs.slice(0,8).forEach(({L,score})=>{if(score>=P.terms.length*2.5)L.qs.forEach(Q=>consider(Q,score*0.8,true))});
    if(!seen.size){ // partial OR
      res.partial=true;
      QS.forEach(Q=>{const r=scoreDoc(P,Q.tk,false,Q.nt);if(r.matched&&P.terms.length>1)consider(Q,r.score*0.5,false)});
    }
  }else{
    QS.forEach(Q=>consider(Q,1,false));
  }
  res.qs=[...seen.values()].sort((a,b)=>b.score-a.score||(b.Q.year-a.Q.year)||a.Q.id.localeCompare(b.Q.id,undefined,{numeric:true}));
  return res;
}
function hlRegex(P){
  const ws=[...new Set(P.terms.map(t=>t.w).filter(w=>w.length>1))];
  P.terms.forEach(t=>t.opts.slice(1).forEach(o=>o.forEach(x=>{if(x.length>3)ws.push(x)})));
  if(!ws.length)return null;
  return new RegExp('('+ws.sort((a,b)=>b.length-a.length).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','ig');
}
function fmt(text,re){
  // returns safe html with gap markers, notes and highlights
  let out='';const gapre=/\[[^\]]*(?:unprinted|torn|illegible|unclear|missing in source)[^\]]*\]|\[Note:[^\]]*\]/g;
  let last=0,m;
  const plain=s=>{s=esc(s);return re?s.replace(re,'<mark>$1</mark>'):s};
  const rawplain=s=>{if(!re)return esc(s);let o='',l=0,mm;re.lastIndex=0;while((mm=re.exec(s))){o+=esc(s.slice(l,mm.index))+'<mark>'+esc(mm[0])+'</mark>';l=mm.index+mm[0].length;if(mm[0].length===0)re.lastIndex++}return o+esc(s.slice(l))};
  while((m=gapre.exec(text))){out+=rawplain(text.slice(last,m.index));out+=m[0].startsWith('[Note')?'<span class="note">'+esc(m[0])+'</span>':'<span class="gap">[?] unreadable in source</span>';last=m.index+m[0].length}
  return out+rawplain(text.slice(last));
}

/* ---------- renderers ---------- */
const ico={play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'};
const lecChip=(code,info)=>{const L=LEC.get(code);if(!L)return'';const st=LS[L.s];
  return `<a class="lk" style="--c:${st.c};--t:${st.t}" href="#/lec/${code}">${ico.play}L${L.n} · ${esc(L.t.length>34?L.t.slice(0,33)+'…':L.t)} <small>${L.m}m${info&&info.ap?' · ≈':''}${info&&info.parts&&info.parts.length&&!info.whole?' · '+esc([...new Set(info.parts)].join(' ')):''}</small></a>`};
function qMeta(Q){const s=PY[Q.subj];const p=Q.p;
  return `<div class="meta"><span class="tag y" style="--c:${s.c}">${esc(p.yl)}</span><span class="tag">${esc(p.label)}</span>${p.sitting?`<span class="tag gr">${esc(p.sitting)}</span>`:''}<span class="tag gr">${esc(Q.sec.l||'')}${Q.sec.l?' · ':''}Q${Q.q.n==null?'•':Q.q.n}</span><span class="tag gr">${p.pid}</span></div>`}
function qBody(Q,re){
  return '<div class="q">'+Q.q.a.map((a,i)=>(i?'<div class="or">OR</div>':'')+(a.s?`<p class="stem">${fmt(a.s,re)}</p>`:'')+(a.p.length?'<ol>'+a.p.map(x=>`<li><i>(${esc(x.k)})</i><span>${fmt(x.t,re)}</span></li>`).join('')+'</ol>':'')).join('')+'</div>';
}
function qCard(Q,opts={}){
  const s=PY[Q.subj];const re=opts.re;
  const links=[...Q.links.entries()].sort((a,b)=>(a[1].ap-b[1].ap)||LEC.get(a[0]).n-LEC.get(b[0]).n);
  const bm=state.bm.has(Q.id);
  return `<article class="card" id="q-${Q.id}" style="--c:${s.c};--t:${s.t}">${qMeta(Q)}${qBody(Q,re)}
  <div class="links">${links.length?`<span class="lab">Watch</span>`+links.map(([c,e])=>lecChip(c,e)).join(''):'<span class="lab">No PrepLadder lecture for this topic</span>'}
  <span class="acts"><button class="ib ${bm?'on':''}" data-act="bm" data-id="${Q.id}" title="Save">${bm?'★':'☆'}</button><button class="ib" data-act="copy" data-id="${Q.id}" title="Copy">⧉</button>${opts.noopen?'':`<a class="ib" style="display:grid;place-items:center;text-decoration:none" href="#/paper/${Q.p.id}/${Q.si}-${Q.qi}" title="Open in paper">↗</a>`}</span></div></article>`;
}
function lecCard(L,re){
  const st=LS[L.s];const w=state.watched.has(L.c);
  return `<a class="card lecc ${w?'done':''}" style="--c:${st.c};--t:${st.t}" href="#/lec/${L.c}"><div class="top"><span class="num">${L.n}</span><div><h3>${fmt(L.t,re)}</h3><div class="ln">${esc(L.s)} · ${esc(L.g)} · ${L.m} min</div></div><div class="cnt"><b>${L.n_q}</b>PYQ${L.n_q===1?'':'s'}</div></div>
  <div class="links"><button class="chip ${w?'on':''}" data-act="watch" data-id="${L.c}" style="padding:4px 10px">${w?'✓ Watched':'Mark watched'}</button><button class="chip ${state.later.has(L.c)?'on':''}" data-act="later" data-id="${L.c}" style="padding:4px 10px">${state.later.has(L.c)?'★ Watch later':'☆ Watch later'}</button></div></a>`;
}
function unitCard(group,curCode){
  const u=group[0];const Q=u.Q;const s=PY[Q.subj];
  const others=new Set();group.forEach(x=>x.links.forEach(c=>{if(c!==curCode)others.add(c)}));
  const ap=group.every(x=>x.apx&&x.apx[curCode]);
  const ctx=u.part?`Part (${esc(u.part)}) of: ${esc((Q.q.a[u.ai].s||'').slice(0,90))}`:'';
  const bm=state.bm.has(Q.id);
  const more=group.length>1?`<div class="links"><span class="lab">Asked ${group.length}×</span>${group.map(x=>`<a class="lk" style="--c:${PY[x.Q.subj].c};--t:${PY[x.Q.subj].t}" href="#/paper/${x.Q.p.id}/${x.Q.si}-${x.Q.qi}">${esc(x.Q.p.yl)} · ${PY[x.Q.subj].s} · ${x.Q.p.pid}</a>`).join('')}</div>`:'';
  return `<article class="card" style="--c:${s.c};--t:${s.t}">${qMeta(Q)}${ap?'<div class="meta"><span class="tag ap">≈ related topic</span></div>':''}
  <div class="q"><p class="stem">${fmt(u.text,null)}</p>${ctx?`<div style="font-size:.74em;color:var(--mut)">${ctx}</div>`:''}</div>${more}
  ${others.size?`<div class="links"><span class="lab">Also in</span>${[...others].map(c=>lecChip(c)).join('')}</div>`:''}
  <div class="links"><span class="acts"><button class="ib ${bm?'on':''}" data-act="bm" data-id="${Q.id}">${bm?'★':'☆'}</button><button class="ib" data-act="copyu" data-id="${Q.id}|${UNITS.indexOf(u)}">⧉</button><a class="ib" style="display:grid;place-items:center;text-decoration:none" href="#/paper/${Q.p.id}/${Q.si}-${Q.qi}">↗</a></span></div></article>`;
}
const subjChips=(cur,attr='qsubj',list=PYS)=>`<div class="chips">${['All',...list].map(s=>{const st=PY[s]||LS[s];return `<button class="chip ${cur===s?'on':''} ${st?'c':''}" ${st?`style="--c:${st.c};--t:${st.t}"`:''} data-act="${attr}" data-id="${esc(s)}">${esc(s==='Obstetrics & Gynaecology'?'OBG':s)}</button>`}).join('')}</div>`;

/* ---------- header ---------- */
function setTop(opts){
  let h='';
  if(opts.search){
    h=`<div class="row"><div class="grow"><h1>PYQ Finder</h1><div class="sub">${QS.length} questions · ${LEC.size} lectures · ${PAPERS.length} papers</div></div><button class="ic" data-act="settings" title="Settings">⚙</button></div>
    <div class="sbox ${state.q?'has':''}"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search questions, lectures, papers, years, subjects…" value="${esc(state.q)}"><button data-act="clear">✕</button></div>`;
  }else{
    h=`<div class="row">${opts.back?'<button class="back" data-act="back">‹</button>':''}<div class="grow"><h1>${esc(opts.title)}</h1>${opts.sub?`<div class="sub">${opts.sub}</div>`:''}</div>${opts.right||''}</div>`;
  }
  top.innerHTML=h;
}
/* ---------- views ---------- */
let curTab='home';
function setNav(t){curTab=t;document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.t===t))}
function vHome(){
  setNav('home');setTop({search:true});
  const input=$('#q');
  input.oninput=()=>{state.q=input.value;state.shown=30;$('.sbox').classList.toggle('has',!!state.q);history.replaceState(null,'','#/'+(state.q?'?q='+encodeURIComponent(state.q):''));renderSearch()};
  input.onkeydown=e=>{if(e.key==='Enter'){input.blur();addRecent(state.q)}};
  renderSearch();
}
function addRecent(q){q=q.trim();if(q.length<2)return;state.recents=[q,...state.recents.filter(x=>x!==q)].slice(0,12);save()}
function histRow(h){
  if(h.t==='l'){const L=LEC.get(h.id);if(!L)return'';const st=LS[L.s];
    return `<a class="hrow" style="--c:${st.c};--t:${st.t}" href="#/lec/${L.c}"><span class="hi">▶</span><div><b>L${L.n} · ${esc(L.t)}</b><small>${esc(L.s)} · ${L.m} min · ${L.n_q} PYQs</small></div></a>`}
  const [pid,si,qi]=h.id.split('-');const Q=QMAP.get(h.id);if(!Q)return'';const st=PY[Q.subj];
  const txt=(Q.q.a[0].s||(Q.q.a[0].p[0]&&Q.q.a[0].p[0].t)||'').replace(/\s+/g,' ');
  return `<a class="hrow" style="--c:${st.c};--t:${st.t}" href="#/paper/${Q.p.id}/${Q.si}-${Q.qi}"><span class="hi">?</span><div><b>${esc(txt.length>78?txt.slice(0,77)+'…':txt)}</b><small>${esc(Q.p.yl)} · ${st.s} · Q${Q.q.n==null?'•':Q.q.n}</small></div></a>`}
function renderHome(){
  const counts={};QS.forEach(q=>counts[q.subj]=(counts[q.subj]||0)+1);
  const nl=QS.filter(q=>!q.links.size).length;
  let h='';
  h+=`<div class="sec-t" style="margin-top:6px">Browse by subject</div><div class="tiles">${PYS.map(s=>`<a class="tile" style="--c:${PY[s].c}" href="#/subject/${encodeURIComponent(s)}"><b>${esc(s)}</b><small>${counts[s]||0} questions</small></a>`).join('')}</div>`;
  const hs=state.hist.filter(x=>x.t==='l'?LEC.has(x.id):QMAP.has(x.id));
  if(hs.length){h+=`<div class="sec-t" style="display:flex;justify-content:space-between">Recently opened<button class="chip" style="padding:2px 9px;font-size:.9em" data-act="clearhist">Clear</button></div>`+hs.slice(0,state.histAll?30:6).map(histRow).join('');if(hs.length>6&&!state.histAll)h+=`<button class="btn alt more" data-act="histall">Show all (${hs.length})</button>`}
  if(state.recents.length)h+=`<div class="sec-t">Recent searches</div><div class="chips">${state.recents.slice(0,8).map(r=>`<button class="chip" data-act="q" data-id="${esc(r)}">↺ ${esc(r)}</button>`).join('')}</div>`;
  h+=`<a class="hrow" style="--c:#6b7280;--t:#f3f4f6;margin-top:14px" href="#/nolec"><span class="hi">!</span><div><b>Questions with no PrepLadder lecture</b><small>${nl} questions</small></div></a>`;
  return h;
}
function renderSearch(){
  const q=state.q.trim();
  if(!q){view.innerHTML=renderHome();return}
  const r=search(q);const re=hlRegex(r.P);
  const fq=r.qs.filter(x=>state.qsubj==='All'||x.Q.subj===state.qsubj);
  const fl=r.lecs.filter(x=>state.qsubj==='All'||x.L.subjSet.has(state.qsubj)||(LS[x.L.s].p===state.qsubj));
  const fp=(r.papers||[]).filter(p=>state.qsubj==='All'||p.subject===state.qsubj);
  const t=state.tab;
  let h=subjChips(state.qsubj);
  h+=`<div class="chips"><button class="chip ${t==='all'?'on':''}" data-act="tab" data-id="all">All</button><button class="chip ${t==='lec'?'on':''}" data-act="tab" data-id="lec">Lectures (${fl.length})</button><button class="chip ${t==='q'?'on':''}" data-act="tab" data-id="q">Questions (${fq.length})</button><button class="chip ${t==='p'?'on':''}" data-act="tab" data-id="p">Papers (${fp.length})</button></div>`;
  if(r.P.years.length||r.P.subjects.length)h+=`<div class="chips"><span class="tag">Filter: ${[...r.P.subjects,...r.P.years].join(', ')}</span></div>`;
  if(r.partial&&fq.length)h+=`<div class="empty" style="padding:6px">No exact match — showing partial matches</div>`;
  if(!fl.length&&!fq.length&&!fp.length){h+=`<div class="empty">No results for “${esc(q)}”.<br>Try a shorter word or another spelling.</div>`;view.innerHTML=h;return}
  if((t==='all'||t==='p')&&fp.length){h+=`<div class="sec-t">Papers (${fp.length})</div><div class="list">`+(t==='p'?fp:fp.slice(0,6)).map(paperRow).join('')+'</div>';if(t==='all'&&fp.length>6)h+=`<button class="btn alt more" data-act="tab" data-id="p">Show all ${fp.length} papers</button>`}
  if(t!=='q'&&t!=='p'&&fl.length){h+=`<div class="sec-t">Lectures to watch (${fl.length})</div>`;(t==='lec'?fl:fl.slice(0,6)).forEach(x=>h+=lecCard(x.L,re));if(t==='all'&&fl.length>6)h+=`<button class="btn alt more" data-act="tab" data-id="lec">Show all ${fl.length} lectures</button>`}
  if(t!=='lec'&&t!=='p'&&fq.length){h+=`<div class="sec-t">Questions (${fq.length})</div>`;fq.slice(0,state.shown).forEach(x=>h+=qCard(x.Q,{re}));if(fq.length>state.shown)h+=`<button class="btn alt more" data-act="more">Show more (${fq.length-state.shown} left)</button>`}
  view.innerHTML=h;
}
function vLectures(){
  setNav('lectures');setTop({title:'Lectures',sub:`${LEC.size} PrepLadder lectures`});
  const subj=state.lsub||'General Medicine',sort=state.lsort||'course',only=state.lonly!==false,hideW=!!state.lhide;
  let list=[...LEC.values()].filter(L=>L.s===subj&&(!only||L.n_q)&&(!hideW||!state.watched.has(L.c)));
  const tot=[...LEC.values()].filter(L=>L.s===subj);
  if(sort==='pyq')list.sort((a,b)=>b.n_q-a.n_q||a.n-b.n);else if(sort==='dens')list.sort((a,b)=>b.density-a.density);else list.sort((a,b)=>a.n-b.n);
  let h=`<div class="chips">${LSUBJ.map(s=>`<button class="chip c ${s===subj?'on':''}" style="--c:${LS[s].c};--t:${LS[s].t}" data-act="lsub" data-id="${esc(s)}">${esc(s)}</button>`).join('')}</div>
  <div class="row2" style="margin:4px 0 8px"><select data-act="lsort">${[['course','Course order'],['pyq','Most PYQs'],['dens','PYQs per hour']].map(([v,l])=>`<option value="${v}" ${v===sort?'selected':''}>${l}</option>`).join('')}</select>
  <label class="sw"><input type="checkbox" data-act="lonly" ${only?'checked':''}> PYQ only</label><label class="sw"><input type="checkbox" data-act="lhide" ${hideW?'checked':''}> Hide watched</label></div>
  <div style="font-size:.78em;color:var(--mut);margin:0 4px 8px">${list.length} of ${tot.length} lectures · ${Math.round(list.reduce((a,L)=>a+L.m,0)/60*10)/10} h</div>`;
  let cur=null;list.forEach(L=>{if(sort==='course'&&L.g!==cur){cur=L.g;h+=`<div class="grp" style="--c:${LS[subj].c}">${esc(cur)}</div>`}h+=lecCard(L)});
  view.innerHTML=h;
}
function vLecture(code){
  const L=LEC.get(code);if(!L){location.hash='#/lectures';return}
  setNav('lectures');setTop({back:true,title:`Lecture ${L.n}`,sub:esc(L.s)+' · '+esc(L.g)});
  addHist('l',code);
  const st=LS[L.s];const w=state.watched.has(code);
  const years=Object.keys(L.yrs).map(Number).sort((a,b)=>a-b);const mx=Math.max(1,...Object.values(L.yrs));
  const direct=L.groups.filter(g=>!g.every(x=>x.apx&&x.apx[code])).length;
  const subs=[...new Set(L.us.map(u=>u.Q.subj))];
  const f=state.lf&&state.lf.code===code?state.lf:{code,subj:'All',sort:'new'};state.lf=f;
  let groups=L.groups.filter(g=>f.subj==='All'||g[0].Q.subj===f.subj);
  if(!state.group)groups=groups.flatMap(g=>g.map(x=>[x]));
  groups.sort((a,b)=>f.sort==='freq'?(b.length-a.length)||(b[0].Q.year-a[0].Q.year):f.sort==='old'?(a[0].Q.year-b[0].Q.year):(Math.max(...b.map(x=>x.Q.year))-Math.max(...a.map(x=>x.Q.year))));
  const sameSub=[...LEC.values()].filter(x=>x.s===L.s).sort((a,b)=>a.n-b.n);const i=sameSub.indexOf(L);
  let h=`<div class="hero" style="--c:${st.c};border-left:5px solid ${st.c}"><h2>${esc(L.t)}</h2><div style="color:var(--mut);font-size:.82em">${esc(L.s)} · ${esc(L.g)} · ${L.m} min · PrepLadder lecture ${L.n}</div>
   <div style="display:flex;gap:18px;margin-top:10px"><div><b style="font-size:1.6em;color:${st.c}">${L.n_q}</b><div style="font-size:.72em;color:var(--mut)">PYQ topics</div></div><div><b style="font-size:1.6em;color:${st.c}">${L.qs.length}</b><div style="font-size:.72em;color:var(--mut)">questions</div></div><div><b style="font-size:1.6em;color:${st.c}">${direct}</b><div style="font-size:.72em;color:var(--mut)">direct match</div></div></div>
   ${years.length?`<div class="yrs" style="--c:${st.c};margin-bottom:16px">${years.map(y=>`<div style="height:${Math.max(6,L.yrs[y]/mx*100)}%" title="${y}: ${L.yrs[y]}"><span>${String(y).slice(2)}</span></div>`).join('')}</div>`:''}
   <div class="btns"><button class="btn ${w?'on':''}" data-act="watch" data-id="${code}">${w?'✓ Watched':'Mark as watched'}</button><button class="btn alt" data-act="later" data-id="${code}">${state.later.has(code)?'★ In watch later':'☆ Watch later'}</button><button class="btn alt" data-act="copylec" data-id="${code}">Copy questions</button></div></div>`;
  h+=`<div class="chips">${['All',...subs].map(s=>`<button class="chip ${f.subj===s?'on':''}" data-act="lfs" data-id="${esc(s)}">${esc(s==='Obstetrics & Gynaecology'?'OBG':s)}</button>`).join('')}</div>
  <div class="row2" style="margin:2px 0 8px"><select data-act="lfsort">${[['new','Newest first'],['old','Oldest first'],['freq','Most repeated']].map(([v,l])=>`<option value="${v}" ${v===f.sort?'selected':''}>${l}</option>`).join('')}</select><label class="sw"><input type="checkbox" data-act="grp" ${state.group?'checked':''}> Group repeats</label></div>`;
  if(!groups.length)h+='<div class="empty">No PYQs mapped to this lecture yet.</div>';
  groups.forEach(g=>h+=unitCard(g,code));
  h+=`<div class="row2" style="justify-content:space-between;margin-top:14px">${i>0?`<a class="btn alt" style="text-decoration:none" href="#/lec/${sameSub[i-1].c}">‹ L${sameSub[i-1].n}</a>`:'<span></span>'}${i<sameSub.length-1?`<a class="btn alt" style="text-decoration:none" href="#/lec/${sameSub[i+1].c}">L${sameSub[i+1].n} ›</a>`:''}</div>`;
  view.innerHTML=h;
}
function paperRow(p){const c=PY[p.subject];const n=p.sections.reduce((a,x)=>a+x.q.length,0);
  return `<a class="pp" style="--c:${c.c}" href="#/paper/${p.id}"><span class="yr">${esc(p.yl)}</span><div style="flex:1"><div style="font-weight:600">${esc(p.label)}${p.sitting?' · '+esc(p.sitting):''}</div><small>${p.pid} · ${n} questions</small></div><span style="color:var(--mut)">›</span></a>`}
function vPapers(){
  setNav('papers');setTop({title:'Papers',sub:`${PAPERS.length} university papers`});
  const s=state.psub||'All';
  let list=PAPERS.filter(p=>s==='All'||p.subject===s).sort((a,b)=>PYS.indexOf(a.subject)-PYS.indexOf(b.subject)||(b.year||0)-(a.year||0)||a.id-b.id);
  let h=subjChips(s,'psub')+'<div class="list">';
  let cur=null;list.forEach(p=>{const c=PY[p.subject];if(p.subject!==cur){cur=p.subject;h+=`<div class="grp" style="--c:${c.c}">${esc(cur)}</div>`}
    const n=p.sections.reduce((a,x)=>a+x.q.length,0);
    h+=`<a class="pp" style="--c:${c.c}" href="#/paper/${p.id}"><span class="yr">${esc(p.yl)}</span><div style="flex:1"><div style="font-weight:600">${esc(p.label)}${p.sitting?' · '+esc(p.sitting):''}</div><small>${p.pid} · ${n} questions${p.meta&&p.meta.marks?' · '+p.meta.marks+' marks':''}</small></div><span style="color:var(--mut)">›</span></a>`});
  view.innerHTML=h+'</div>';
}
function subjLecs(name){
  return [...LEC.values()].map(L=>({L,us:L.us.filter(u=>u.Q.subj===name)})).filter(x=>x.us.length).map(x=>{const g=new Map();x.us.forEach(u=>{const k=normk(u.text);if(!g.has(k))g.set(k,[]);g.get(k).push(u)});return {L:x.L,groups:[...g.values()]}}).sort((a,b)=>b.groups.length-a.groups.length||a.L.n-b.L.n)}
function vSubject(name,page){
  setNav('home');const c=PY[name];
  if(!c){location.hash='#/';return}
  const papers=PAPERS.filter(p=>p.subject===name).sort((a,b)=>(b.year||0)-(a.year||0)||a.id-b.id);
  if(page==='papers'){
    setTop({back:true,title:name+' papers',sub:papers.length+' papers'});
    let h='',cy=null;papers.forEach(p=>{h+=paperRow(p)});view.innerHTML='<div class="list">'+h+'</div>';return}
  const sl=subjLecs(name);
  if(page==='lectures'){
    setTop({back:true,title:'Top lectures · '+name,sub:sl.length+' lectures, most-asked first'});
    view.innerHTML=sl.map(({L,groups})=>{const st=LS[L.s];const w=state.watched.has(L.c);
      return `<a class="card lecc ${w?'done':''}" style="--c:${st.c};--t:${st.t}" href="#/lec/${L.c}"><div class="top"><span class="num">${L.n}</span><div><h3>${esc(L.t)}</h3><div class="ln">${esc(L.s)} · ${L.m} min</div></div><div class="cnt"><b>${groups.length}</b>PYQ${groups.length===1?'':'s'}</div></div>
      <div style="margin-top:8px;font-size:.82em;color:var(--mut);line-height:1.45">${groups.slice(0,3).map(g=>`<div style="padding:2px 0">• <span style="color:var(--ink)">${esc(g[0].text.length>90?g[0].text.slice(0,89)+'…':g[0].text)}</span> <small>${[...new Set(g.map(x=>x.Q.p.yl))].slice(0,4).join(', ')}</small></div>`).join('')}${groups.length>3?`<div style="color:${st.c};font-weight:700">+${groups.length-3} more PYQs ›</div>`:''}</div></a>`}).join('')||'<div class="empty">No lectures</div>';
    return}
  setTop({back:true,title:name,sub:(QS.filter(q=>q.subj===name).length)+' questions · '+papers.length+' papers'});
  view.innerHTML=`<a class="card" style="--c:${c.c};display:block;text-decoration:none;color:inherit;padding:18px" href="#/subject/${encodeURIComponent(name)}/lectures"><div style="font-size:1.15em;font-weight:800;color:${c.c}">▶ Top lectures for ${esc(name)}</div><div style="color:var(--mut);font-size:.85em;margin-top:4px">${sl.length} PrepLadder lectures ranked by number of PYQs, with their questions</div></a>
  <a class="card" style="--c:${c.c};display:block;text-decoration:none;color:inherit;padding:18px" href="#/subject/${encodeURIComponent(name)}/papers"><div style="font-size:1.15em;font-weight:800;color:${c.c}">📄 Papers</div><div style="color:var(--mut);font-size:.85em;margin-top:4px">${papers.length} university papers, year by year</div></a>`;
}
function vPaper(id,focus){
  const p=PMAP.get(+id);if(!p){location.hash='#/papers';return}
  setNav('papers');const c=PY[p.subject];
  setTop({back:true,title:`${p.yl} · ${p.label}`,sub:`${p.pid}${p.sitting?' · '+esc(p.sitting):''}${p.meta&&p.meta.time?' · '+esc(p.meta.time):''}${p.meta&&p.meta.marks?' · '+p.meta.marks+' marks':''}`});
  let h=`<div style="font-size:.74em;color:var(--mut);margin:0 4px 8px">${esc(p.title)}</div>`;
  p.sections.forEach((s,si)=>{
    if(s.l||s.sub||s.i)h+=`<div class="grp" style="--c:${c.c}">${esc([s.l,s.sub].filter(Boolean).join(' · '))}${s.i?`<div style="text-transform:none;letter-spacing:0;font-weight:500;color:var(--mut)">${esc(s.i)}</div>`:''}</div>`;
    s.q.forEach((q,qi)=>h+=qCard(QMAP.get(p.id+'-'+si+'-'+qi),{noopen:true}));
  });
  view.innerHTML=h;
  if(focus){addHist('q',id+'-'+focus);const e=document.getElementById('q-'+id+'-'+focus);if(e){e.classList.add('hl');setTimeout(()=>e.scrollIntoView({block:'center'}),30)}}
}
function vNoLec(){
  setNav('home');const l=QS.filter(q=>!q.links.size);setTop({back:true,title:'No lecture available',sub:l.length+' questions not covered by a PrepLadder lecture'});
  const f=state.nlf||'All';const list=l.filter(q=>f==='All'||q.subj===f);
  view.innerHTML=subjChips(f,'nlf')+list.map(q=>qCard(q)).join('')||'<div class="empty">None</div>';
}
function vSaved(){
  setNav('saved');setTop({title:'Saved',sub:'Bookmarked questions & watch-later lectures',right:'<button class="ic" data-act="exportsaved" title="Copy all">⧉</button>'});
  const tab=state.stab||'q';
  const bq=[...state.bm].map(id=>QMAP.get(id)).filter(Boolean);const bl=[...state.later].map(c=>LEC.get(c)).filter(Boolean);
  let h=`<div class="chips"><button class="chip ${tab==='q'?'on':''}" data-act="stab" data-id="q">Questions (${bq.length})</button><button class="chip ${tab==='l'?'on':''}" data-act="stab" data-id="l">Watch later (${bl.length})</button></div>`;
  if(tab==='q'){h+=bq.length?bq.map(q=>qCard(q)).join(''):'<div class="empty">No saved questions yet.<br>Tap ☆ on any question.</div>'}
  else h+=bl.length?bl.map(l=>lecCard(l)).join(''):'<div class="empty">No lectures in watch later.<br>Open a lecture and tap “Watch later”.</div>';
  view.innerHTML=h;
}
function vStats(){
  setNav('stats');setTop({title:'Progress',sub:'Track lectures you have watched'});
  const all=[...LEC.values()];const wl=all.filter(L=>state.watched.has(L.c));
  const tm=all.reduce((a,L)=>a+L.m,0),wm=wl.reduce((a,L)=>a+L.m,0);
  const pyq=all.filter(L=>L.n_q);const pw=pyq.filter(L=>state.watched.has(L.c));
  const cover=new Set();pw.forEach(L=>L.qs.forEach(q=>cover.add(q.id)));
  let h=`<div class="hero"><h2>${wl.length} / ${all.length} lectures watched</h2><div style="color:var(--mut);font-size:.82em;margin-bottom:8px">${Math.round(wm/60)} h of ${Math.round(tm/60)} h · PYQ lectures: ${pw.length}/${pyq.length} · questions covered: ${cover.size}/${QS.length}</div><div class="bar"><i style="width:${wl.length/all.length*100}%"></i></div></div>`;
  h+='<div class="sec-t">By subject</div>';
  LSUBJ.forEach(s=>{const ls=all.filter(L=>L.s===s);const w=ls.filter(L=>state.watched.has(L.c));
    h+=`<div class="hero" style="--c:${LS[s].c};padding:10px 12px"><div style="display:flex;justify-content:space-between;font-weight:700"><span>${esc(s)}</span><span style="color:var(--mut);font-weight:600;font-size:.85em">${w.length}/${ls.length}</span></div><div class="bar" style="margin-top:6px"><i style="width:${w.length/ls.length*100}%"></i></div></div>`});
  const sug=pyq.filter(L=>!state.watched.has(L.c)).sort((a,b)=>b.n_q-a.n_q).slice(0,10);
  h+='<div class="sec-t">Watch next (most PYQs, unwatched)</div>'+sug.map(L=>lecCard(L)).join('');
  h+='<div class="sec-t">Settings</div>'+settingsHTML();
  view.innerHTML=h;
}
function settingsHTML(){
  return `<div class="hero"><div class="row2" style="justify-content:space-between;margin-bottom:10px"><span>Theme</span><select data-act="theme">${['auto','light','dark'].map(t=>`<option ${t===state.theme?'selected':''}>${t}</option>`).join('')}</select></div>
  <div class="row2" style="justify-content:space-between;margin-bottom:10px"><span>Text size</span><select data-act="fs">${[[.9,'Small'],[1,'Normal'],[1.12,'Large'],[1.25,'Extra large']].map(([v,l])=>`<option value="${v}" ${v==state.fs?'selected':''}>${l}</option>`).join('')}</select></div>
  <div class="btns"><button class="btn alt" data-act="resetw">Reset watched</button><button class="btn alt" data-act="resetb">Clear saved</button><button class="btn alt" data-act="resetr">Clear recent searches</button></div>
  <div style="font-size:.74em;color:var(--mut);margin-top:12px">Data: ${PAPERS.length} papers · ${QS.length} questions · ${LEC.size} PrepLadder lectures. Works fully offline.</div></div>`;
}
/* ---------- router ---------- */
const scroll={};let lastHash='';
function route(){
  scroll[lastHash]=view.scrollTop;
  const hash=location.hash||'#/';const [path,qs]=hash.slice(1).split('?');const parts=path.split('/').filter(Boolean);
  const pq=new URLSearchParams(qs||'');
  switch(parts[0]){
    case undefined:case '':if(pq.has('q'))state.q=pq.get('q');vHome();break;
    case 'lectures':vLectures();break;
    case 'lec':vLecture(parts[1]);break;
    case 'papers':vPapers();break;
    case 'subject':vSubject(decodeURIComponent(parts[1]),parts[2]);break;
    case 'paper':vPaper(parts[1],parts[2]);break;
    case 'saved':vSaved();break;
    case 'nolec':vNoLec();break;
    case 'stats':vStats();break;
    default:vHome();
  }
  lastHash=hash;
  const sp=scroll[hash];if(sp&&!/paper\/\d+\/\d/.test(hash))view.scrollTop=sp;else if(!/paper\/\d+\/\d/.test(hash))view.scrollTop=0;
}
window.addEventListener('hashchange',route);
function rerender(){const y=view.scrollTop;route();view.scrollTop=y}
/* ---------- events ---------- */
function copy(t){try{navigator.clipboard.writeText(t);toast('Copied')}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();toast('Copied')}}
const qText=Q=>`${Q.p.yl} ${Q.p.label} (${Q.p.pid}) Q${Q.q.n}\n`+Q.q.a.map(a=>[a.s,...a.p.map(x=>`(${x.k}) ${x.t}`)].filter(Boolean).join('\n')).join('\nOR\n');
document.addEventListener('change',e=>{
  const a=e.target.dataset.act;if(!a)return;
  if(a==='lsort'){state.lsort=e.target.value;vLectures()}
  else if(a==='lonly'){state.lonly=e.target.checked;vLectures()}
  else if(a==='lhide'){state.lhide=e.target.checked;vLectures()}
  else if(a==='lfsort'){state.lf.sort=e.target.value;rerender()}
  else if(a==='grp'){state.group=e.target.checked;save();rerender()}
  else if(a==='theme'){state.theme=e.target.value;save();applyTheme()}
  else if(a==='fs'){state.fs=+e.target.value;save();applyTheme()}
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.tagName==='SELECT'||b.tagName==='INPUT')return;
  const a=b.dataset.act,id=b.dataset.id;
  if(b.closest('a')&&b.tagName==='BUTTON'){e.preventDefault()}
  switch(a){
    case 'back':if(history.length>1)history.back();else location.hash='#/';break;
    case 'clear':state.q='';history.replaceState(null,'','#/');vHome();$('#q').focus();break;
    case 'q':state.q=id;state.tab='all';state.shown=30;addRecent(id);history.replaceState(null,'','#/?q='+encodeURIComponent(id));vHome();break;
    case 'qsubj':state.qsubj=id;state.shown=30;renderSearch();break;
    case 'tab':state.tab=id;renderSearch();break;
    case 'more':state.shown+=40;renderSearch();break;
    case 'bm':{state.bm.has(id)?state.bm.delete(id):state.bm.add(id);save();toast(state.bm.has(id)?'Saved':'Removed');rerender();break}
    case 'copy':copy(qText(QMAP.get(id)));break;
    case 'copyu':{const [qid,ui]=id.split('|');copy(UNITS[+ui].text+'\n— '+qText(QMAP.get(qid)).split('\n')[0]);break}
    case 'watch':{state.watched.has(id)?state.watched.delete(id):state.watched.add(id);save();toast(state.watched.has(id)?'Marked as watched ✓':'Unmarked');rerender();break}
    case 'later':{state.later.has(id)?state.later.delete(id):state.later.add(id);save();toast(state.later.has(id)?'Added to watch later':'Removed');rerender();break}
    case 'lsub':state.lsub=id;vLectures();break;
    case 'psub':state.psub=id;vPapers();break;
    case 'clearhist':state.hist=[];save();renderSearch();break;
    case 'histall':state.histAll=true;renderSearch();break;
    case 'nlf':state.nlf=id;vNoLec();break;
    case 'lfs':state.lf.subj=id;rerender();break;
    case 'stab':state.stab=id;vSaved();break;
    case 'copylec':{const L=LEC.get(id);copy(`Lecture ${L.n}: ${L.t} (${L.s})\n\n`+L.groups.map(g=>`• [${g.map(x=>x.Q.p.yl).join(', ')}] ${g[0].text}`).join('\n'));break}
    case 'exportsaved':{const t=[...state.bm].map(i=>QMAP.get(i)).filter(Boolean).map(qText).join('\n\n');if(!t){toast('Nothing saved');break}if(navigator.share){navigator.share({text:t}).catch(()=>copy(t))}else copy(t);break}
    case 'settings':location.hash='#/stats';setTimeout(()=>view.scrollTo(0,view.scrollHeight),50);break;
    case 'resetw':if(confirm('Reset all watched lectures?')){state.watched.clear();save();vStats()}break;
    case 'resetb':if(confirm('Clear all saved questions and watch-later?')){state.bm.clear();state.later.clear();save();vStats()}break;
    case 'resetr':state.recents=[];save();toast('Cleared');break;
  }
});
// Android hardware back
document.addEventListener('deviceready',()=>{},false);
try{const App=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;if(App)App.addListener('backButton',()=>{if(location.hash&&location.hash!=='#/'&&location.hash!=='#'){history.back()}else App.exitApp()})}catch(e){}
route();
})();
