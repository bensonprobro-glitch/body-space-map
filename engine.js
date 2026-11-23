// =====================================================================
// 時空身體地圖・空間篇｜共用引擎：設定讀取、計分（含規則追蹤）、照片處理、AI 點位、使用紀錄
// =====================================================================
const QN = {LU:'左上',RU:'右上',LD:'左下',RD:'右下'};
const QUADS = ['LU','RU','LD','RD'];
const DEMO_LM = { earL:[481,222,1], earR:[554,233,1], shL:[379,395,1], shR:[648,412,1], wrL:[349,780,.74], wrR:[683,801,.88], idxL:[344,824,.61], idxR:[680,845,.78], hipL:[429,764,1], hipR:[575,765,1], knL:[417,1075,.94], knR:[587,1084,.98], anL:[394,1359,.95], anR:[607,1361,.97], heL:[399,1407,.91], heR:[594,1406,.95] };
const PT_KEYS = Object.keys(DEMO_LM);
const PT_NAME = {ear:'耳',sh:'肩',wr:'手腕',idx:'手指',hip:'屁股',kn:'膝',an:'腳踝',he:'腳跟'};
const PT_DESC = [['ear','耳','耳朵的中間'],['sh','肩','手臂接到身體的關節（不是肩膀最高點）'],['wr','手腕','手腕最細的地方'],['idx','手指','食指的指尖'],['hip','屁股','屁股兩側、大腿接到身體的地方'],['kn','膝','膝蓋正中間'],['an','腳踝','腳踝骨的中間'],['he','腳跟','腳跟最後面、貼地的地方']];
const HOTSPOTS = [['頭頸',45.5,19.5,55.5,19.8],['肩膀',38.5,24.5,61.8,25.6],['上背',43,31.5,57.5,31.8],['手肘手腕',33.5,46,67.5,46.8],['腰',43.5,42.5,57,42.8],['屁股',43,53.5,56.5,53.8],['膝蓋',40.7,70,57.3,70.6],['腳踝腳跟',39,90.5,58.5,90.5]];
const PART_UP = ['頭頸','肩膀','上背','手肘手腕'], PART_DOWN = ['腰','屁股','膝蓋','腳踝腳跟'];
const $ = s => document.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ls(k,v){ try{ if(v===undefined) return JSON.parse(localStorage.getItem(k)||'null'); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,JSON.stringify(v)); }catch(e){ return null; } }
const clone = o => JSON.parse(JSON.stringify(o));

// ---------- 設定 ----------
const PREVIEW_KEY = 'sk_cfg_preview';
function migrateCfg(c){ if(!c||!c.sources) return c; const qs=c.sources.questions, i=qs.findIndex(q=>q.type==='bodymap'&&q.zone==null);
  if(i>=0){ const def=window.DEFAULT_CONFIG.sources.questions.filter(q=>q.type==='bodymap'); qs.splice(i,1,...clone(def)); }
  const D=window.DEFAULT_CONFIG; ['points','photoSteps','photoShot'].forEach(k=>{ if(!c.sources[k]) c.sources[k]=clone(D.sources[k]); }); if(c.explain&&!c.explain.levels) c.explain.levels=clone(D.explain.levels);
  (c.sources.compares||[]).forEach(cp=>{ if(cp.ex) cp.ex.forEach(e=>{ if(e[0]==='gen:ok') e[0]='img/knee_level.jpg'; if(e[0]==='gen:tilt') e[0]='img/knee_slant.jpg'; }); }); return c; }
function levelOf(v, levels){ const L=levels||(window.DEFAULT_CONFIG.explain.levels); return L.find(l=>v<=l.max)||L[L.length-1]; }
function loadCfg(){ const q=new URLSearchParams(location.search); if(q.get('preview')==='1'){ const c=ls(PREVIEW_KEY); if(c&&c.sources) return {cfg:migrateCfg(c), preview:true}; } return {cfg:clone(window.DEFAULT_CONFIG), preview:false}; }

// ---------- 計分（每一筆都留下規則文字，讓醫師看得懂是怎麼算的） ----------
function score(cfg, ans){
  const L=cfg.logic, votes=[], fw=L.feelWeight, maxFeel=Math.max(...Object.values(fw));
  const max={U:0,D:0}, addMax=(half,w)=>{ if(half==='U'||half==='D') max[half]+=w; else { max.U+=w; max.D+=w; } };
  cfg.sources.questions.filter(q=>q.enabled).forEach(q=>{
    const v=(ans.a||{})[q.key], sc=q.score||{mode:'none'};
    if(sc.mode==='quad'){ addMax('both', sc.w); if(v&&QN[v]) votes.push({src:'回答', id:q.id, half:v[1], side:v[0], w:sc.w, label:q.t.replace(/[？?]$/,'')+'：'+QN[v], rule:`${q.id} 回答「${QN[v]}」→ ${QN[v]} +${sc.w}`}); }
    if(sc.mode==='map'){ const mp=sc.map||{}; const halves=new Set(Object.values(mp).filter(Boolean).map(x=>x[1])); halves.forEach(h=>addMax(h, sc.w)); if(v&&mp[v]) votes.push({src:'回答', id:q.id, half:mp[v][1], side:mp[v][0], w:sc.w, label:q.t.replace(/[？?]$/,'')+'：'+v, rule:`${q.id} 回答「${v}」→ ${QN[mp[v]]} +${sc.w}`}); }
  });
  cfg.sources.moves.filter(m=>m.enabled).forEach(m=>{ addMax(m.half, maxFeel*m.w); const v=(ans.mv||{})[m.id];
    if(v&&(v.side==='左邊'||v.side==='右邊')){ const f=fw[v.feel]??Math.min(...Object.values(fw)), w=+(f*m.w).toFixed(2), q=(v.side==='左邊'?'L':'R')+m.half;
      votes.push({src:'動作', id:m.id, half:m.half, side:q[0], w, label:m.name+'：'+v.side+(v.feel?'（'+v.feel+'）':''), rule:`${m.id} ${m.name}「${v.side}${v.feel?'・'+v.feel:''}」→ ${QN[q]} +${f}×${m.w}=${w}`}); } });
  const cmpRes={};
  if(ans.cmp) cfg.sources.compares.filter(c=>c.enabled).forEach(c=>{ addMax(c.half, c.w); const v=ans.cmp[c.key]; cmpRes[c.key]=v||'x';
    if(v==='L'||v==='R'){ const q=v+c.half; votes.push({src:'照片', id:c.id, half:c.half, side:v, w:c.w, label:c.name+'：'+(v==='L'?'左邊':'右邊')+'比較明顯', rule:`${c.id} ${c.name}「${v==='L'?'左':'右'}」→ ${QN[q]} +${c.w}`}); } });
  const A=L.aiMeasure;
  if(A&&A.enabled&&ans.meas){ addMax('U',A.w); addMax('D',A.w);
    [['sh','U','肩膀'],['hip','D','骨盆']].forEach(([k,h,nm])=>{ const d=ans.meas[k]; if(d!=null&&Math.abs(d)>=A.minDeg){ const s=d>0?'L':'R'; votes.push({src:'電腦量', id:'AI', half:h, side:s, w:A.w, label:`電腦量的${nm}：${s==='L'?'左':'右'}邊高 ${Math.abs(d).toFixed(1)}°`, rule:`AI ${nm}傾斜 ${Math.abs(d).toFixed(1)}° ≥ ${A.minDeg}° → ${QN[s+h]} +${A.w}`}); } }); }
  const raw={LU:0,RU:0,LD:0,RD:0}; votes.forEach(v=>raw[v.side+v.half]+=v.w);
  const qs={}; QUADS.forEach(k=>qs[k]=max[k[1]]?Math.min(1,raw[k]/max[k[1]]):0);
  const order=Object.entries(qs).sort((a,b)=>b[1]-a[1]);
  let main=null, second=null; if(order[0][1]>=L.minScore){ main=order[0][0]; if(order[1][1]>=L.minScore) second=order[1][0]; }
  const agree=['回答','動作','照片'].map(s=>{ const t={LU:0,RU:0,LD:0,RD:0}; votes.filter(v=>v.src===s).forEach(v=>t[v.side+v.half]+=v.w); const top=Object.entries(t).sort((a,b)=>b[1]-a[1])[0]; return {src:s, top:top[1]>0?top[0]:null}; });
  const nAgree=main?agree.filter(a=>a.top===main).length:0, lean=main;
  const passScore = order[0][1]>=L.minScore, passAgree = nAgree>=L.minAgree;
  if(main&&!passAgree){ main=null; second=null; }
  const pain=(ans.a||{}).pain||[], pU=pain.some(z=>PART_UP.includes(z.slice(2))), pD=pain.some(z=>PART_DOWN.includes(z.slice(2))), sides=[...new Set(pain.map(z=>z[0]))];
  return {votes, raw, max, qs, main, second, agree, nAgree, lean, passScore, passAgree, cmpRes, pHalf:pU&&pD?'UD':pU?'U':pD?'D':null, pS:sides.length===1?sides[0]:null};
}
function traceText(cfg, r){
  const L=cfg.logic, lines=[];
  lines.push('// 1. 每一個提示加分');
  r.votes.forEach(v=>lines.push('  '+v.rule)); if(!r.votes.length) lines.push('  （沒有任何提示）');
  lines.push('', '// 2. 加總 ÷ 滿分 = 緊繃分數');
  QUADS.forEach(k=>lines.push(`  ${QN[k]}：${r.raw[k].toFixed(2)} ÷ ${r.max[k[1]].toFixed(2)} = ${Math.round(r.qs[k]*100)}`));
  lines.push('', '// 3. 判定規則');
  const top=Object.entries(r.qs).sort((a,b)=>b[1]-a[1])[0];
  lines.push(`  最高分 ${QN[top[0]]} ${Math.round(top[1]*100)} ${r.passScore?'≥':'<'} 門檻 ${Math.round(L.minScore*100)}  ${r.passScore?'✓':'✗'}`);
  lines.push(`  回答／動作／照片中，指向${r.lean?QN[r.lean]:'同一區'}的有 ${r.nAgree} 種 ${r.nAgree>=L.minAgree?'≥':'<'} 需要 ${L.minAgree} 種  ${r.nAgree>=L.minAgree?'✓':'✗'}`);
  lines.push(`    （回答→${r.agree[0].top?QN[r.agree[0].top]:'無'}、動作→${r.agree[1].top?QN[r.agree[1].top]:'無'}、照片→${r.agree[2].top?QN[r.agree[2].top]:'無'}）`);
  lines.push('', `// 結論：${r.main?'最緊繃＝'+QN[r.main]+(r.second?'，第二＝'+QN[r.second]:''):'不明顯（沒有通過上面的規則）'}`);
  return lines.join('\n');
}
function rulesText(cfg){
  const L=cfg.logic, s=cfg.sources, lines=['// 學員的每個答案，怎麼變成分數'];
  s.questions.filter(q=>q.enabled).forEach(q=>{ const sc=q.score||{};
    if(sc.mode==='quad') lines.push(`${q.id} ${q.t}\n   → 點到哪一塊，那一塊 +${sc.w}`);
    else if(sc.mode==='map') lines.push(`${q.id} ${q.t}\n   → ${Object.entries(sc.map||{}).filter(([,x])=>x).map(([o,x])=>`「${o}」→${QN[x]}`).join('、')}，各 +${sc.w}`);
    else lines.push(`${q.id} ${q.t}\n   → 不計分（只用在報告）`); });
  s.moves.filter(m=>m.enabled).forEach(m=>lines.push(`${m.id} ${m.name}（${m.half==='U'?'上半身':'下半身'}）\n   → 選左/右，那一側${m.half==='U'?'上':'下'}方 +（${Object.entries(L.feelWeight).map(([k,v])=>k.slice(0,4)+' '+v).join('／')}）× ${m.w}`));
  s.compares.filter(c=>c.enabled).forEach(c=>lines.push(`${c.id} 照片｜${c.name}（${c.half==='U'?'上半身':'下半身'}）\n   → 選左/右，那一側${c.half==='U'?'上':'下'}方 +${c.w}`));
  if(L.aiMeasure.enabled) lines.push(`AI 電腦量肩膀、骨盆傾斜\n   → 超過 ${L.aiMeasure.minDeg}°，較高那一側 +${L.aiMeasure.w}`);
  lines.push('', '// 判定', `緊繃分數 = 該區加分 ÷ 該半身滿分`, `最高分要 ≥ ${Math.round(L.minScore*100)}`, `回答、動作、照片三種來源，至少 ${L.minAgree} 種指向同一區`, `→ 通過才說「這一區最緊繃」，否則顯示「不明顯」`);
  return lines.join('\n');
}

// ---------- 圖片 ----------
function imgFromSrc(src){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=src; }); }
let DEMO_IMG=null; const demoP=imgFromSrc('img/demo_back.jpg').then(im=>{ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; c.getContext('2d').drawImage(im,0,0); DEMO_IMG=c; return c; });
function bodyBox(lm,W0,H0){ const xs=PT_KEYS.map(k=>lm[k][0]), ys=PT_KEYS.map(k=>lm[k][1]), pad=(Math.max(...ys)-Math.min(...ys))*.12; return [Math.max(0,Math.min(...xs)-pad*1.5), Math.max(0,Math.min(...ys)-pad*1.7), Math.min(W0,Math.max(...xs)+pad*1.5), Math.min(H0,Math.max(...ys)+pad*.5)]; }
// 不同人上傳的照片大小、遠近都不一樣：一律用身體範圍裁切，再補邊成固定比例（預設 3:5），讓每張身體圖大小、位置一致
function fitBox(box, aspect){ let [x0,y0,x1,y1]=box, w=x1-x0, h=y1-y0, cx=(x0+x1)/2, cy=(y0+y1)/2; if(w/h<aspect) w=h*aspect; else h=w/aspect; return [cx-w/2, cy-h/2, cx+w/2, cy+h/2]; }
function drawCrop(g, img, box, W, H, bg='#e9e3da'){ const [x0,y0,x1,y1]=box, sx=W/(x1-x0), sy=H/(y1-y0); g.fillStyle=bg; g.fillRect(0,0,W,H);
  const ix0=Math.max(0,x0), iy0=Math.max(0,y0), ix1=Math.min(img.width,x1), iy1=Math.min(img.height,y1); if(ix1>ix0&&iy1>iy0) g.drawImage(img, ix0,iy0,ix1-ix0,iy1-iy0, (ix0-x0)*sx,(iy0-y0)*sy,(ix1-ix0)*sx,(iy1-iy0)*sy); }
function partBox(lm, part){ const L=lm, top=Math.min(L.earL[1],L.earR[1]), hipY=(L.hipL[1]+L.hipR[1])/2, heel=Math.max(L.heL[1],L.heR[1]), Hb=heel-top, xs=PT_KEYS.map(k=>L[k][0]), xl=Math.min(...xs)-Hb*.08, xr=Math.max(...xs)+Hb*.08;
  if(part==='up') return fitBox([xl, top-Hb*.1, xr, hipY+Hb*.06], .9); if(part==='down') return fitBox([xl, hipY-Hb*.06, xr, heel+Hb*.05], .7); return fitBox(bodyBox(L,1e9,1e9), .6); }
function quadPhoto(img, lm, qs, main, W=520, labels=true){
  const [x0,y0,x1,y1]=fitBox(bodyBox(lm,1e9,1e9), .6), sc=W/(x1-x0), H=Math.round((y1-y0)*sc), c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'); drawCrop(g,img,[x0,y0,x1,y1],W,H);
  const P=p=>[(p[0]-x0)*sc,(p[1]-y0)*sc], midX=(P(lm.shL)[0]+P(lm.shR)[0]+P(lm.hipL)[0]+P(lm.hipR)[0])/4, hipY=(P(lm.hipL)[1]+P(lm.hipR)[1])/2;
  g.fillStyle='rgba(43,32,24,.18)'; g.fillRect(0,0,W,H);
  const R={LU:[0,0,midX,hipY],RU:[midX,0,W-midX,hipY],LD:[0,hipY,midX,H-hipY],RD:[midX,hipY,W-midX,H-hipY]};
  Object.entries(R).forEach(([q,[a,b,w,h]])=>{ const v=Math.min(1,(qs[q]||0)/.8); g.fillStyle=`rgba(122,86,56,${(v*.62).toFixed(3)})`; g.fillRect(a,b,w,h); });
  g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=Math.max(1,W/360); g.setLineDash([5,5]); g.beginPath(); g.moveTo(midX,0); g.lineTo(midX,H); g.moveTo(0,hipY); g.lineTo(W,hipY); g.stroke(); g.setLineDash([]);
  if(main){ const [a,b,w,h]=R[main]; g.strokeStyle='#f1d9b3'; g.lineWidth=Math.max(2,W/180); g.strokeRect(a+2,b+2,w-4,h-4); }
  if(labels){ const fs=Math.round(W/12), lv=Array.isArray(labels)?labels:null, fs2=Math.round(fs*.72);
    Object.entries(R).forEach(([q,[a,b,w,h]])=>{ const v=Math.round((qs[q]||0)*100), t=QN[q]+' '+v; g.font=`500 ${fs}px "Noto Sans TC",sans-serif`; let tw=g.measureText(t).width; const L=lv?levelOf(v,lv):null;
      if(L){ g.font=`500 ${fs2}px "Noto Sans TC",sans-serif`; tw=Math.max(tw,g.measureText(L.name).width); }
      const bh=L?fs+fs2+18:fs+10, tx=q[0]==='L'?a+8:a+w-tw-16, ty=q[1]==='U'?b+10:b+h-bh-10;
      g.fillStyle=L?L.color:(q===main?'rgba(122,86,56,.95)':'rgba(43,39,36,.65)'); g.globalAlpha=L?.94:1; g.fillRect(tx,ty,tw+12,bh); g.globalAlpha=1; g.fillStyle='#fff';
      g.font=`500 ${fs}px "Noto Sans TC",sans-serif`; g.fillText(t,tx+6,ty+fs+1); if(L){ g.font=`500 ${fs2}px "Noto Sans TC",sans-serif`; g.fillText(L.name,tx+6,ty+fs+fs2+8); } }); }
  return c.toDataURL('image/jpeg',.88);
}
function measure(lm){ const t=(a,b)=>Math.atan2(lm[b][1]-lm[a][1],lm[b][0]-lm[a][0])*180/Math.PI; return {sh:t('shL','shR'), hip:t('hipL','hipR')}; }
function makeCrops(img, lm){
  const Hb=Math.hypot((lm.heL[0]+lm.heR[0])/2-(lm.shL[0]+lm.shR[0])/2,(lm.heL[1]+lm.heR[1])/2-(lm.shL[1]+lm.shR[1])/2)*1.25, mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const box=(x0,y0,x1,y1,draw)=>{ const w=x1-x0,h=y1-y0,W=680,H=Math.round(W*h/w),c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
    g.fillStyle='#e9e3da'; g.fillRect(0,0,W,H); g.drawImage(img,x0,y0,w,h,0,0,W,H); const P=(x,y)=>[(x-x0)*W/w,(y-y0)*H/h];
    g.setLineDash([10,8]); g.lineWidth=3; g.strokeStyle='rgba(255,255,255,.95)'; g.shadowColor='rgba(0,0,0,.5)'; g.shadowBlur=4; draw(g,P,W,H); g.setLineDash([]); g.shadowBlur=0;
    g.font='500 24px "Noto Sans TC",sans-serif'; [['你的左邊',14,'left'],['你的右邊',W-14,'right']].forEach(([t,x,al])=>{ g.textAlign=al; const tw=g.measureText(t).width; g.fillStyle='rgba(43,32,24,.78)'; g.fillRect(al==='left'?x-6:x-tw-6,H-46,tw+12,34); g.fillStyle='#fff'; g.fillText(t,x,H-20); }); g.textAlign='left';
    return c.toDataURL('image/jpeg',.88); };
  const one=(cx,cy,size)=>{ const c=document.createElement('canvas'); c.width=c.height=360; const g=c.getContext('2d'); g.fillStyle='#e9e3da'; g.fillRect(0,0,360,360); g.drawImage(img,cx-size/2,cy-size/2,size,size,0,0,360,360); return c.toDataURL('image/jpeg',.85); };
  const crops={}, regions={};
  { const pad=Hb*.12, x0=lm.shL[0]-pad, x1=lm.shR[0]+pad, y0=Math.min(lm.earL[1],lm.earR[1])-Hb*.04, y1=Math.max(lm.shL[1],lm.shR[1])+Hb*.09, ly=Math.min(lm.shL[1],lm.shR[1])-Hb*.016;
    crops.U8={one:box(x0,y0,x1,y1,(g,P,W)=>{ const y=P(0,ly)[1]; g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); })}; regions.U8=['L','R'].map(s=>{ const p=mix(lm['sh'+s],lm['ear'+s],.3); return [p[0],p[1],Hb*.16]; }); }
  { const reg=s=>{ const p=mix(lm['wr'+s],lm['idx'+s],.45); return [p[0],p[1],Hb*.13]; }, l=reg('L'), r=reg('R'); crops.U4={L:one(l[0],l[1],l[2]), R:one(r[0],r[1],r[2])}; regions.U4=[l,r]; }
  { const pad=Hb*.1, x0=lm.knL[0]-pad, x1=lm.knR[0]+pad, yc=(lm.knL[1]+lm.knR[1])/2, y0=yc-Hb*.08, y1=yc+Hb*.08;
    crops.L2={one:box(x0,y0,x1,y1,(g,P)=>{ ['knL','knR'].forEach(k=>{ const [x,y]=P(lm[k][0],lm[k][1]), hw=(Hb*.055)*680/(x1-x0); g.beginPath(); g.moveTo(x-hw,y); g.lineTo(x+hw,y); g.stroke(); }); })}; regions.L2=[[lm.knL[0],lm.knL[1],Hb*.13],[lm.knR[0],lm.knR[1],Hb*.13]]; }
  { const pad=Hb*.09, x0=lm.heL[0]-pad, x1=lm.heR[0]+pad, y0=Math.min(lm.anL[1],lm.anR[1])-Hb*.12, y1=Math.max(lm.heL[1],lm.heR[1])+Hb*.04;
    crops.L1={one:box(x0,y0,x1,y1,(g,P,W,H)=>{ ['L','R'].forEach(s=>{ const x=P((lm['an'+s][0]+lm['he'+s][0])/2,0)[0]; g.beginPath(); g.moveTo(x,10); g.lineTo(x,H-56); g.stroke(); }); })}; regions.L1=['L','R'].map(s=>{ const p=mix(lm['an'+s],lm['he'+s],.55); return [p[0],p[1],Hb*.12]; }); }
  return {crops, regions};
}
async function kneeExample(kind){ await demoP; const L=DEMO_LM, Hb=L.heL[1]-L.earL[1], x0=L.knL[0]-Hb*.1, x1=L.knR[0]+Hb*.1, yc=(L.knL[1]+L.knR[1])/2, y0=yc-Hb*.06, y1=yc+Hb*.06, W=480, H=Math.round(W*(y1-y0)/(x1-x0));
  const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'); g.drawImage(DEMO_IMG,x0,y0,x1-x0,y1-y0,0,0,W,H); const P=(x,y)=>[(x-x0)*W/(x1-x0),(y-y0)*H/(y1-y0)], hw=Hb*.045*W/(x1-x0);
  g.lineWidth=5; g.lineCap='round'; g.strokeStyle='#e0a35c'; [['knL',kind==='tilt'?.32:0],['knR',0]].forEach(([k,ang])=>{ const [x,y]=P(L[k][0],L[k][1]-Hb*.004); g.beginPath(); g.moveTo(x-hw*Math.cos(ang),y+hw*Math.sin(ang)); g.lineTo(x+hw*Math.cos(ang),y-hw*Math.sin(ang)); g.stroke(); });
  return c.toDataURL('image/jpeg',.85); }
// ---------- AI 點位（MediaPipe，在瀏覽器裡跑，照片不上傳） ----------
let poseP=null;
function getPose(){ if(poseP) return poseP; poseP=(async()=>{ const V='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14'; const vision=await import(V+'/vision_bundle.mjs');
  const fileset={wasmLoaderPath:V+'/wasm/vision_wasm_internal.js', wasmBinaryPath:new URL('mp/vision_wasm_internal.wasm',location.href).href};
  const b64=(await (await fetch(new URL('mp/pose_model_b64.txt',location.href).href)).text()).replace(/\s/g,''); const bin=atob(b64), buf=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
  return vision.PoseLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetBuffer:buf,delegate:'CPU'},runningMode:'IMAGE',numPoses:1}); })(); return poseP; }
const withTimeout=(p,ms)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
async function fileToCanvas(file){ const im=await imgFromSrc(URL.createObjectURL(file)), scale=Math.min(1,1400/Math.max(im.width,im.height)), c=document.createElement('canvas'); c.width=Math.round(im.width*scale); c.height=Math.round(im.height*scale); c.getContext('2d').drawImage(im,0,0,c.width,c.height); return c; }
async function detect(c){
  try{ const pose=await withTimeout(getPose(),45000), out=pose.detect(c), p=out.landmarks&&out.landmarks[0]; if(!p) throw new Error('no person');
    const P=i=>[p[i].x*c.width,p[i].y*c.height,p[i].visibility??1], pair=(a,b)=>{ const A=P(a),B=P(b); return A[0]<=B[0]?[A,B]:[B,A]; };
    const [shL,shR]=pair(11,12),[earL,earR]=pair(7,8),[wrL,wrR]=pair(15,16),[idxL,idxR]=pair(19,20),[hipL,hipR]=pair(23,24),[knL,knR]=pair(25,26),[anL,anR]=pair(27,28),[heL,heR]=pair(29,30);
    return {lm:{earL,earR,shL,shR,wrL,wrR,idxL,idxR,hipL,hipR,knL,knR,anL,anR,heL,heR}, ai:'ok'};
  }catch(err){ const W=c.width,H=c.height,cx=W/2,top=H*.06,h=H*.89,at=(dx,fy)=>[cx+dx*h,top+fy*h,.3];
    return {lm:{earL:at(-.03,.09),earR:at(.03,.09),shL:at(-.09,.19),shR:at(.09,.19),wrL:at(-.1,.47),wrR:at(.1,.47),idxL:at(-.1,.53),idxR:at(.1,.53),hipL:at(-.06,.5),hipR:at(.06,.5),knL:at(-.045,.72),knR:at(.045,.72),anL:at(-.04,.93),anR:at(.04,.93),heL:at(-.04,.96),heR:at(.04,.96)}, ai:'fail'}; }
}
function groupBox(lm, keys){ const ks=keys.flatMap(k=>[k+'L',k+'R']), Hb=Math.max(lm.heL[1],lm.heR[1])-Math.min(lm.earL[1],lm.earR[1]), xs=ks.map(k=>lm[k][0]), ys=ks.map(k=>lm[k][1]), pad=Hb*.08, px=Hb*.21;
  return fitBox([Math.min(...xs)-px, Math.min(...ys)-pad, Math.max(...xs)+px, Math.max(...ys)+pad], 1.15); }
function drawPointsOn(cv, img, lm, onDrag, part='all'){
  const grp=Array.isArray(part)?part:null, KEYS=grp?PT_KEYS.filter(k=>grp.includes(k.replace(/[LR]$/,''))):PT_KEYS;
  const box=grp?groupBox(lm,grp):partBox(lm,part), [x0,y0,x1,y1]=box, W=Math.min(1000, Math.round(x1-x0)), sc=W/(x1-x0), H=Math.round((y1-y0)*sc); cv.width=W; cv.height=H; const g=cv.getContext('2d'); drawCrop(g,img,box,W,H);
  const P=k=>[(lm[k][0]-x0)*sc,(lm[k][1]-y0)*sc], r=grp?Math.max(14,W/30):Math.max(9,W/48);
  g.lineWidth=Math.max(2,W/300); g.strokeStyle='rgba(122,86,56,.85)';
  if(!grp) [['shL','shR'],['hipL','hipR'],['shL','wrL'],['shR','wrR'],['hipL','anL'],['hipR','anR']].forEach(([a,b])=>{ const A=P(a),B=P(b); g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); });
  const fs=Math.round(W/(grp?15:part==='all'?16:20)); g.font=`500 ${fs}px "Noto Sans TC",sans-serif`;
  const LB=[]; KEYS.forEach(k=>{ const [x,y]=P(k), v=lm[k][2]; if(x<-r||y<-r||x>W+r||y>H+r) return; g.beginPath(); g.arc(x,y,r,0,7); g.fillStyle=v<.5?'#b1463a':'#7a5638'; g.fill(); g.lineWidth=3; g.strokeStyle='#fff'; g.stroke();
    const nm=(grp?(k.endsWith('L')?'左':'右'):'')+PT_NAME[k.replace(/[LR]$/,'')], left=k.endsWith('L'), tw=g.measureText(nm).width; let tx=left?x-r-10-tw:x+r+10; if(tx<6||tx+tw>W-6) tx=left?x+r+10:x-r-10-tw; LB.push({x,y,ly:y,tx,tw,nm,side:tx<x}); });
  [true,false].forEach(sd=>{ const L=LB.filter(b=>b.side===sd).sort((a,b)=>a.y-b.y), gap=fs*1.5; for(let it=0;it<4;it++) for(let q=1;q<L.length;q++){ const d=L[q].ly-L[q-1].ly; if(d<gap){ const m=(gap-d)/2; L[q-1].ly-=m; L[q].ly+=m; } } });
  LB.forEach(b=>{ if(Math.abs(b.ly-b.y)>3){ g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=2; g.beginPath(); g.moveTo(b.x,b.y); g.lineTo(b.side?b.tx+b.tw+5:b.tx-5,b.ly); g.stroke(); }
    g.fillStyle='rgba(43,32,24,.78)'; g.fillRect(b.tx-5,b.ly-fs*.72,b.tw+10,fs*1.36); g.fillStyle='#fff'; g.fillText(b.nm,b.tx,b.ly+fs*.38); });
  if(!onDrag) return; let drag=null; const pos=ev=>{ const b=cv.getBoundingClientRect(); return [x0+(ev.clientX-b.left)*(x1-x0)/b.width, y0+(ev.clientY-b.top)*(y1-y0)/b.height, (x1-x0)/b.width]; };
  cv.onpointerdown=ev=>{ const [x,y,s]=pos(ev); let best=null,bd=1e9; KEYS.forEach(k=>{ const d=Math.hypot(lm[k][0]-x,lm[k][1]-y); if(d<bd){bd=d;best=k;} }); if(bd<(grp?60:36)*s){ drag=best; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); } };
  cv.onpointermove=ev=>{ if(!drag) return; const [x,y]=pos(ev); lm[drag]=[x,y,1]; drawPointsOn(cv,img,lm,null,part); }; cv.onpointerup=()=>{ if(drag){ drag=null; onDrag&&onDrag(); } };
}

// ---------- 後端與使用紀錄 ----------
function api(payload, beacon){
  const url=window.BACKEND; if(!url||url.startsWith('REPLACE')) return Promise.resolve(false);
  const body=JSON.stringify(payload);
  if(beacon&&navigator.sendBeacon){ try{ return Promise.resolve(navigator.sendBeacon(url, new Blob([body],{type:'text/plain'}))); }catch(e){} }
  return fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body,keepalive:body.length<60000}).then(()=>true).catch(()=>false);
}
const Tele = {
  sid:null, role:'', ver:'', q:[], cur:null, t0:0, timer:null,
  init(ver, role){ this.ver=ver; this.role=role||ls('sk_role')||''; this.sid=sessionStorage.getItem('sk_sid')||('s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)); try{ sessionStorage.setItem('sk_sid',this.sid); }catch(e){}
    this.ev('open',{k:location.pathname.split('/').pop()||'index', d:{w:innerWidth,h:innerHeight,ref:document.referrer.slice(0,120)}});
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'){ this.leave('hidden'); this.flush(true); } else { this.t0=Date.now(); this.ev('back',{n:this.cur}); } });
    addEventListener('pagehide',()=>{ this.leave('pagehide'); this.flush(true); });
    this.timer=setInterval(()=>this.flush(false), 8000); },
  setRole(r){ this.role=r; ls('sk_role',r); this.ev('role',{k:r}); },
  ev(t,o={}){ this.q.push({t, n:o.n??this.cur, ms:o.ms, k:o.k, d:o.d, at:Date.now()}); if(this.q.length>=30) this.flush(false); },
  screen(n){ if(this.cur===n) return; this.leave('next'); this.cur=n; this.t0=Date.now(); this.ev('view',{n}); },
  leave(why){ if(this.cur&&this.t0){ this.ev('leave',{n:this.cur, ms:Date.now()-this.t0, k:why}); this.t0=0; } },
  flush(beacon){ if(!this.q.length) return; const events=this.q.splice(0); api({type:'events', sid:this.sid, role:this.role, ver:this.ver, ua:navigator.userAgent.slice(0,160), events}, beacon); }
};
