/* 「在行情图上带我看」：Lumi 在个股页的日 K 上分步标注讲解（需求 R7.2–R7.10，交互见 lumi 需求目录 proactive-agent/INTERACTION.html「带看」）。
   只在用户点击后开始；开始前记下页面、标的与周期，结束时询问是否保留标注，默认清除并恢复。
   脚本随消息保存，执行时不再调用模型；锚点的时间与价格全部取自图表数据并在执行前校验，校验不过就停下、清理并说明原因。
   Lumi 加的标注用紫色，用户自己的画线用黄色；清除只删本次 Lumi 加的，不动用户画线。 */
window.UserDrawings=(()=>{
 /* 演示用：用户在客户端里已有的画线。个股图每次绘制都会带上，与带看无关。 */
 const lines={'002335.SZ':[{price:41,label:'你画的支撑线',at:'9月28日'}]};
 let highlight=null;
 function apply(chart,code){
  if(!chart?.price)return;const list=lines[code]||[];
  chart.price.setOption({series:[{id:'user-lines',type:'line',data:[],silent:true,markLine:{symbol:'none',silent:true,animation:false,data:list.map(l=>({yAxis:l.price,lineStyle:{color:'#e0b15c',width:highlight===code?2.6:1,type:'solid',opacity:highlight===code?1:.7},label:{position:'insideStartTop',color:'#e0b15c',formatter:`${l.label} ${l.price.toFixed(2)}`}}))}}]});
 }
 function setHighlight(code,chart){highlight=code;apply(chart,code||'')}
 return{lines,apply,setHighlight,get:code=>lines[code]||[]};
})();

window.LumiTour=(()=>{
 const STOCK='002335.SZ',NAME='科华数据',L='#c2b6ff';
 const FIELDS=['nav','page','previousPage','mode','homeView','activeThreadId','pendingThreadId','copilotThreadId','pageCopilotKind','copilotExpanded','selectedPage','marketSecondary','compact'];
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const md=d=>`${Number(d.slice(5,7))}月${Number(d.slice(8,10))}日`;
 let T=null;

 const page=()=>document.querySelector('.stock-detail-page');
 const chart=()=>page()?.stockChart;
 const onStock=()=>state.nav==='行情'&&state.selectedPage==='个股'&&page()?.dataset.thscode===STOCK;
 const available=()=>!!(window.echarts&&window.FuyaoData&&window.FuyaoPlot);

 /* ---------- 讲解脚本：由证据与图表数据生成，执行前校验 ---------- */
 function script(records){
  const day=r=>FuyaoPlot.day(r.date_ms),n=records.length;
  if(n<30)throw new Error('图表数据不足 30 个交易日');
  const last=records[n-1],lastDay=day(last),notice='2026-10-11',noticeAfter=notice>lastDay;
  const noticeAt=noticeAfter?lastDay:records.find(r=>day(r)>=notice)&&day(records.find(r=>day(r)>=notice));
  if(!noticeAt)throw new Error('公告时间不在图表数据范围内');
  const win=records.slice(-3),prior=records.slice(-23,-3),avg=a=>a.reduce((s,r)=>s+r.volume,0)/a.length;
  if(win.some(r=>!(r.volume>0))||prior.length<20)throw new Error('成交量数据不完整');
  const ratio=avg(win)/avg(prior),change=(last.close_price/records[n-2].close_price-1)*100;
  const lines=UserDrawings.get(STOCK),line=lines[0],lo=Math.min(...records.slice(-45).map(r=>r.low_price)),hi=Math.max(...records.slice(-45).map(r=>r.high_price));
  if(line&&!(line.price>=lo*.9&&line.price<=hi*1.1))throw new Error('你画的支撑线不在当前图表的价格范围内');
  const gap=line?(last.close_price/line.price-1)*100:0;
  return [
   {text:`先看时间点。${NAME}在 10 月 11 日 19:32 披露了新签数据中心订单的公告${noticeAfter?`，晚于图上最新一根 K 线（${md(lastDay)}），我把它标在最右侧`:'，我在图上标出了这个位置'}。`,
    did:'打开 科华数据 · 切换到日 K · 添加 1 条竖线和文字',marks:{notice:{at:noticeAt,label:noticeAfter?'10/11 19:32 公告 →':'10/11 19:32 公告'}}},
   {text:`再看公告前的成交。${md(day(win[0]))}到${md(lastDay)}这 3 个交易日，日均成交量约为此前 20 日的 ${ratio.toFixed(1)} 倍${ratio>=1.3?'，已经明显放量':'，没有明显放量'}；${md(lastDay)}当天${change>=0?'上涨':'下跌'} ${Math.abs(change).toFixed(1)}%。公告是在这之后发的，今天开盘后的反应可以接着看。`,
    did:'圈出最近 3 个交易日（K 线与成交量）· 添加文字',marks:{range:{from:day(win[0]),to:lastDay,label:`近 3 日均量 ×${ratio.toFixed(1)}`}}},
   ...(line?[{text:`最后对照你自己的判断。你${line.at}在 ${line.price.toFixed(2)} 画过一条支撑线，现在股价 ${last.close_price.toFixed(2)}，在它${gap>=0?'上方':'下方'} ${Math.abs(gap).toFixed(1)}%${gap>=0?'，这次波动还没有触及你设的观察位置':'，已经跌破你设的观察位置'}。`,
    did:'高亮你已有的水平线（未新增画线）',marks:{user:true}}]:[])
  ];
 }

 /* ---------- 图上标注 ---------- */
 function paint(){
  const c=chart();if(!c||!T)return;
  const upto=T.steps.slice(0,T.step+1),m=Object.assign({},...upto.map(s=>s.marks));
  const vline=m.notice?[{xAxis:m.notice.at,lineStyle:{color:L,type:'dashed',width:1.4},label:{color:L,position:'end',rotate:0,align:'right',formatter:m.notice.label}}]:[];
  const area=m.range?[[{xAxis:m.range.from,itemStyle:{color:'rgba(194,182,255,.12)',borderColor:L,borderWidth:1.2},label:{color:L,position:'insideTop',formatter:m.range.label}},{xAxis:m.range.to}]]:[];
  c.price.setOption({series:[{id:'lumi-tour',type:'line',data:[],silent:true,markLine:{symbol:'none',silent:true,animation:false,data:vline},markArea:{silent:true,animation:false,data:area}}]});
  c.volume.setOption({series:[{id:'lumi-tour-vol',type:'bar',data:[],silent:true,markArea:{silent:true,animation:false,data:area.map(([a,b])=>[{...a,label:{show:false}},b])}}]});
  UserDrawings.setHighlight(m.user?STOCK:null,c);
 }
 function clearMarks(){
  const c=chart();if(!c)return;
  c.price.setOption({series:[{id:'lumi-tour',type:'line',data:[],markLine:{data:[]},markArea:{data:[]}}]});
  c.volume.setOption({series:[{id:'lumi-tour-vol',type:'bar',data:[],markArea:{data:[]}}]});
  UserDrawings.setHighlight(null,c);
 }
 function focusRange(){const c=chart();if(!c)return;const n=c.records.length;T.zooming=true;c.price.dispatchAction({type:'dataZoom',start:Math.max(0,(n-45)/n*100),end:100});T.zooming=false}

 /* ---------- 讲解栏 ---------- */
 function place(){
  const p=T?.panel,s=document.querySelector('#surface');if(!p||!s)return;
  const r=s.getBoundingClientRect();p.style.top=r.top+'px';p.style.height=r.height+'px';p.style.left=Math.max(r.left,r.right-320)+'px';
 }
 function drawPanel(){
  if(!T)return;let p=T.panel;
  if(!p){p=T.panel=document.createElement('aside');p.className='lumi-tour';p.setAttribute('aria-label','带看');document.body.append(p);
   p.addEventListener('click',e=>{const a=e.target.closest('[data-tour]')?.dataset.tour;if(a)ACTS[a]?.()})}
  const i=T.step,s=T.steps[i],last=i===T.steps.length-1,btn=(label,act,cls='')=>`<button type="button" class="lumi-tour-btn ${cls}" data-tour="${act}">${label}</button>`;
  p.innerHTML=`<header class="lumi-tour-top"><img src="${esc(LumiProfile.avatar)}" alt=""><div><b>带看 · ${NAME}</b><span>第 ${i+1} / ${T.steps.length} 步</span></div><button type="button" class="lumi-tour-x" data-tour="exit" aria-label="退出带看">×</button></header>
   <div class="lumi-tour-steps" aria-hidden="true">${T.steps.map((_,k)=>`<i class="${k<=i?'is-on':''}"></i>`).join('')}</div>
   <div class="lumi-tour-body">${T.paused?`<p class="lumi-tour-pause">${esc(T.paused)}</p>`:''}<p class="lumi-tour-msg" aria-live="polite">${esc(s.text)}</p>
    <p class="lumi-tour-did"><span aria-hidden="true">✓</span>本步对客户端做了：${esc(s.did)}</p>
    <p class="lumi-tour-legend"><span><i class="is-lumi"></i>Lumi 本次添加</span><span><i class="is-user"></i>你自己的画线</span></p>
    <button type="button" class="kb-notes-toggle lumi-tour-notes-toggle" data-tour="notes" aria-expanded="${!!T.notes}">交互说明</button>
    ${T.notes?`<div class="kb-notes lumi-tour-notes"><b>交互说明</b><ul>${NOTES.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><b>状态演示</b><div class="kb-seg kb-wrap"><button type="button" data-tour="demo-fail">本步执行失败</button></div></div>`:''}</div>
   <footer class="lumi-tour-foot">${T.paused?`${btn('继续','resume','is-primary')}${btn('退出','exit')}`
    :last?`${btn('上一步','prev')}${btn('保留标注','keep')}${btn('清除并返回','exit','is-primary')}`
    :`${btn('上一步','prev',i?'':'is-off')}${btn('下一步','next','is-primary')}${btn('退出','exit')}`}
    <p>${last&&!T.paused?'看完了。要保留这些标注吗？默认清除，只删本次 Lumi 加的。':'你随时可以自己操作图表，带看会暂停。Esc 退出。'}</p></footer>`;
  place();
 }
 /* 交互说明（摘自需求稿 proactive-agent/INTERACTION.html「带看」与 R7） */
 const NOTES=['R7.2 只在点击「带我看」后开始；开始前记下当前页面、标的与周期。','R7.3 / R7.8 讲解脚本随消息保存，执行时不再调用模型；每步的时间与价格锚点取自图表数据，执行前校验。','R7.4 / R7.10 动作只限打开证券、切换周期、加标注、高亮已有画线；每步写明对客户端做了什么。紫色为 Lumi 本次添加，黄色为你自己的画线。','R7.5 上一步 / 下一步 / 退出，Esc 等同退出；自己操作图表或切换页面时暂停，可继续或退出。','R7.6 最后询问是否保留标注，默认清除；清除只删本次 Lumi 加的，不动你的画线，并回到带看前的页面与周期。','R7.7 任一步失败即停止、清理已加的标注，并在卡片线程里说明原因。'];
 const ACTS={
  notes(){T.notes=!T.notes;drawPanel()},
  'demo-fail'(){fail('客户端没有响应「添加画线」')},
  next(){if(T.step<T.steps.length-1){T.step++;paint();drawPanel()}},
  prev(){if(T.step>0){T.step--;paint();drawPanel()}},
  resume(){if(!onStock()){FuyaoData.openStock(DemoMarketData.directory().find(r=>r.thscode===STOCK));return ready(()=>{T.paused='';focusRange();paint();drawPanel()})}T.paused='';focusRange();paint();drawPanel()},
  keep(){finish(true)},
  exit(){finish(false)}
 };

 /* ---------- 开始、暂停、结束 ---------- */
 function ready(fn,tries=0){
  const c=chart(),body=page();
  if(onStock()&&c?.records?.length&&body.querySelector('.candles')?.dataset.period==='日K')return fn();
  if(onStock()&&!tries&&body.querySelector('.candles')?.dataset.period!=='日K')[...body.querySelectorAll('[aria-label="图表周期"] button')].find(b=>b.textContent.trim()==='日K')?.click();
  if(tries>40)return fail('个股页的行情数据没有在 4 秒内加载完成');
  setTimeout(()=>ready(fn,tries+1),100);
 }
 function start({onEnd}={}){
  if(T||!available())return;
  const body=page();
  T={onEnd,step:0,steps:[],paused:'',prev:{state:Object.fromEntries(FIELDS.map(k=>[k,state[k]])),code:body?.dataset.thscode,period:body?.querySelector('.candles')?.dataset.period}};
  FuyaoData.openStock(DemoMarketData.directory().find(r=>r.thscode===STOCK));
  ready(()=>{
   try{T.steps=script(chart().records)}catch(e){return fail(e.message)}
   focusRange();paint();drawPanel();watch();
  });
 }
 function pause(reason){if(!T||T.paused||!T.steps.length)return;T.paused=reason;drawPanel()}
 function watch(){
  const host=page()?.querySelector('.market-chart'),user=e=>{if(!T?.zooming&&!e.target.closest('.lumi-tour'))pause('你在自己操作图表，带看已暂停。')};
  host?.addEventListener('pointerdown',user,true);host?.addEventListener('wheel',user,{capture:true,passive:true});
  const key=e=>{if(e.key==='Escape')finish(false)},resize=()=>place();
  addEventListener('keydown',key);addEventListener('resize',resize);
  T.timer=setInterval(()=>{if(!T)return;if(!onStock())pause('你切换了页面，带看已暂停。');place()},400);
  T.unwatch=()=>{host?.removeEventListener('pointerdown',user,true);host?.removeEventListener('wheel',user,{capture:true});removeEventListener('keydown',key);removeEventListener('resize',resize);clearInterval(T.timer)};
 }
 function restore({state:prev,code,period}){
  const body=page();
  if(body&&period&&period!=='日K')[...body.querySelectorAll('[aria-label="图表周期"] button')].find(b=>b.textContent.trim()===period)?.click();
  if(body&&code&&code!==STOCK)body.fuyaoSelect?.(DemoMarketData.directory().find(r=>r.thscode===code));
  NavigationHistory.remember();Object.assign(state,prev,{menu:null,context:null,preview:false,detached:false});render();
 }
 function finish(keep){
  if(!T)return;const t=T;
  if(!keep)clearMarks();else UserDrawings.setHighlight(null,chart());
  t.unwatch?.();t.panel?.remove();T=null;
  if(!keep)restore(t.prev);
  t.onEnd?.(keep?'已保留本次标注，可以在个股页的画线列表里管理。':'已清除本次标注，你原有的画线没有改动，并回到了带看前的页面。');
 }
 function fail(reason){
  if(!T)return;const t=T,at=t.steps.length?`第 ${t.step+1} 步`:'开始时';
  clearMarks();t.unwatch?.();t.panel?.remove();T=null;restore(t.prev);
  t.onEnd?.(`带看在${at}停下了：${reason}。已清除本次添加的标注，页面也回到了带看前。消息里的内容照常可看。`);
 }
 return{start,available,get active(){return !!T}};
})();
