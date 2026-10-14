/* 策略回测在对话中的流程（参照「SuperMind 接入 · 量化策略产品原型」）：
   识别策略意图 → 补齐模糊规则（选择卡）→ 确认结构化策略 → 生成代码 → 回测 → 结果卡片。
   页面与对话共用 BacktestPage 里的策略与运行：对话里确认的策略立即出现在「我的策略」，结果是同一份。 */
window.BacktestChat=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const pct=(x,sign=true)=>(sign&&x>=0?'+':'')+(x*100).toFixed(2)+'%';
 const INTENT=/回测|策略|低买高卖|买入|卖出|持有|选股|调仓|换仓|择时|定投|网格|轮动|均线|金叉|死叉|止损|止盈|布林|做T|做 T/;
 const EXPLAIN=/是什么|什么意思|解释|介绍|原理/;
 const VAGUE=/低买高卖|跌多了|涨多了|便宜|高位|低位|抄底|逢低/;
 const UNSUPPORTED=/分钟|日内|做T|做 T|tick|期货|期权|做空|融券|港股|美股/i;
 const MODIFY=/止损/;
 const sessions=new Map();let seq=0,mid=0;
 const isIntent=text=>INTENT.test(text)&&!(EXPLAIN.test(text)&&!/回测|生成|帮我|制定/.test(text));
 const changed=id=>dispatchEvent(new CustomEvent('conversation:changed',{detail:{id,reason:'update'}}));
 const now=()=>{try{return ChatStore.clock()}catch{return {}}};
 const msg=(role,text,extra={})=>({id:'bt-msg-'+(++mid),role,text,...now(),status:null,...extra});
 function say(thread,text,step,s){thread.messages.push(msg('assistant',text,step?{backtest:{sid:s.id,step}}:{}));thread.pendingScroll='bottom';changed(thread.id)}
 const later=(fn,ms=500)=>setTimeout(fn,ms);

 /* ---------- 流程 ---------- */
 function start(thread,text,carry={}){
  const s={id:'bs'+(++seq),thread:thread.id,text,stage:'intent',choice:carry.choice||null,buy:carry.buy||'',sell:carry.sell||'',codeOpen:false,reportOpen:false};sessions.set(s.id,s);
  if(UNSUPPORTED.test(text)&&!carry.daily){s.stage='unsupported';return say(thread,'已识别为策略回测请求。其中有一部分首期还做不到：首期只支持 A 股与场内 ETF 的日线级策略，暂不支持分钟级、日内做 T、期货期权与做空。','unsupported',s)}
  if(VAGUE.test(text)&&!s.choice&&!/布林|均线|价格|元/.test(text)){s.stage='clarify';return say(thread,'已识别为策略回测请求，正在检查交易条件。「低」和「高」还需要可计算的标准，你希望怎样定义买入和卖出？','clarify',s)}
  toSpec(thread,s);
 }
 function toSpec(thread,s){
  s.spec=BacktestPage.specFromText(s.text,s.choice,{buy:s.buy,sell:s.sell});s.stage='spec';
  say(thread,'下面是整理后的完整策略。原句没有说明的部分列在「补充假设」里，确认后按这份规则生成代码。','spec',s);
 }
 function assumptions(s){
  const sp=s.spec,set=sp.more.set,list=[];
  if(s.choice==='boll')list.push('「低买高卖」按布林带下轨买、上轨卖；布林带 20 日、2 倍标准差由 AI 补充');
  if(s.choice==='ma')list.push('「低买高卖」按偏离 60 日均线 10% 买、回到均线卖，参数由 AI 补充');
  if(s.choice==='price')list.push('买入价与卖出价由你填写');
  if(sp.kind==='timing')list.push('目标仓位 80%，空仓启动');
  if(sp.kind==='rotate')list.push('持仓等权，调仓日不在目标名单内的全部卖出');
  list.push(`回测区间 ${set.start} 至 ${set.end}（${sp.years===5&&!/近.年/.test(s.text)?'原句未说明，默认近 5 年':'按原句「近 '+sp.years+' 年」'}）`);
  if(sp.kind!=='dca')list.push('初始资金 100 万元');
  list.push('前一日收盘出信号，次日开盘价成交；佣金万分之三（最低 5 元）、印花税按现行税率、滑点 0.1%');
  return list;
 }
 const ACTS={
  choose(s,el){s.choice=el.dataset.choice;changed(s.thread)},
  'adopt-choice'(s){if(!s.choice)return;if(s.choice==='price'&&!(+s.buy>0&&+s.sell>+s.buy)){s.priceError='请填写正数价格，并确保卖出价高于买入价。';changed(s.thread);return}s.priceError='';s.stage='chosen';const thread=ChatStore.get(s.thread);changed(s.thread);later(()=>toSpec(thread,s))},
  daily(s){s.stage='done';const thread=ChatStore.get(s.thread);changed(s.thread);later(()=>start(thread,s.text,{daily:true}))},
  decline(s){s.stage='done';say(ChatStore.get(s.thread),'好的，这条就先不回测了。可以换一个日线级别的说法再试。')},
  confirm(s){const thread=ChatStore.get(s.thread);s.stage='code';s.stId=BacktestPage.createFromSpec(s.spec,thread.title||s.text.slice(0,10));changed(s.thread);later(()=>say(thread,'策略代码已就绪，并已收进「我的策略」。买卖、仓位与执行时点都按刚才确认的规则组织，可以先看代码，再开始回测。','code',s),700)},
  adjust(s){s.stage='adjust';say(ChatStore.get(s.thread),'好的，直接告诉我要改哪里，比如「回测近三年」「换成布林带」「持仓改成 20 只」，我会在原来的基础上重新整理。')},
  'toggle-code'(s){s.codeOpen=!s.codeOpen;changed(s.thread)},
  run(s){if(s.stage!=='code')return;s.stage='run';BacktestPage.run(s.stId);say(ChatStore.get(s.thread),'开始回测。','run',s);watch(s)},
  cancel(s){BacktestPage.cancel(s.stId)},
  'toggle-report'(s){s.reportOpen=!s.reportOpen;changed(s.thread)},
  open(s){BacktestPage.open(s.stId)},
  fix(s){BacktestPage.open(s.stId)}
 };
 /* 回测进度只更新卡片自身，不刷新整段对话；轮询挂在会话上而不是卡片上，对话不在屏幕上时也能在结束后追加结果 */
 function watch(s){
  if(s.watching)return;s.watching=true;
  const tick=()=>{
   const p=BacktestPage.progress(s.stId),node=document.querySelector('[data-bt-run="'+s.id+'"]');
   if(p.running){if(node){const bar=node.querySelector('.bt-chat-progress i'),label=node.querySelector('[data-progress-label]');if(bar)bar.style.width=p.pct+'%';if(label)label.textContent='已回测到 '+p.date}setTimeout(tick,300);return}
   s.watching=false;if(s.stage!=='run')return;const thread=ChatStore.get(s.thread);
   if(p.status==='ok'){s.stage='result';say(thread,'回测结果已就绪，已收进「我的策略」。可以直接看收益和文件，也可以打开策略回测查看完整结果。','result',s)}
   else if(p.status==='failed'){s.stage='failed';say(thread,'回测没有跑完。','failed',s)}
   else{s.stage='cancelled';say(thread,'已取消这次回测，策略保留在「我的策略」里，随时可以重新运行。')}
  };
  setTimeout(tick,300);
 }

 /* ---------- 卡片 ---------- */
 const button=(label,act,cls='',attrs='')=>`<button type="button" class="kb-btn is-small ${cls}" data-bt-act="${act}" ${attrs}>${esc(label)}</button>`;
 const chip=(text,cls='')=>`<span class="kb-chip ${cls}">${esc(text)}</span>`;
 function spark(eq,bm){
  const all=[...eq,...bm],lo=Math.min(...all),hi=Math.max(...all),W=300,H=64,line=a=>a.map((v,i)=>`${(i/(a.length-1)*W).toFixed(1)},${(H-2-(v-lo)/(hi-lo||1)*(H-4)).toFixed(1)}`).join(' ');
  return `<svg class="bt-chat-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline class="is-bench" points="${line(bm)}"/><polyline points="${line(eq)}"/></svg>`;
 }
 function body(step,s){
  const past=(...stages)=>!stages.includes(s.stage);
  if(step==='unsupported')return `<div class="bt-chat-head"><b>可以先用日线版本近似</b>${chip('待确认','is-notice')}</div><p class="bt-chat-sub">每日收盘后判断条件，下一交易日开盘成交。日内多次买卖的效果无法用日线还原。</p>${past('unsupported')?'':`<div class="bt-chat-actions">${button('按日线版本继续','daily','is-primary')}${button('不用了','decline')}</div>`}`;
  if(step==='clarify'){
   const opts=[['boll','布林带上下轨','建议','收盘触及下轨买入，触及上轨卖出，用来表达相对高低。'],['ma','偏离均线','','跌到 60 日均线下方 10% 买入，回到均线卖出。'],['price','指定买入与卖出价格','','你给出具体价格，按固定阈值触发。']];
   const done=past('clarify');
   return `<div class="bt-chat-head"><b>补齐交易规则</b>${chip('待明确：买卖阈值','is-notice')}</div>
    <div class="bt-chat-options">${opts.map(([id,label,tag,desc])=>`<button type="button" class="bt-chat-option ${s.choice===id?'is-active':''}" data-bt-act="choose" data-choice="${id}" ${done?'disabled':''}><b>${label}${tag?` <span class="kb-chip">${tag}</span>`:''}</b><span>${desc}</span></button>`).join('')}</div>
    ${s.choice==='price'?`<div class="bt-chat-fields"><label>买入价（元）<input class="kb-input" data-bt-input="buy" value="${esc(s.buy)}" placeholder="例如 8.00" ${done?'disabled':''}></label><label>卖出价（元）<input class="kb-input" data-bt-input="sell" value="${esc(s.sell)}" placeholder="例如 10.00" ${done?'disabled':''}></label></div>`:''}
    ${s.priceError?`<p class="bt-chat-error">${esc(s.priceError)}</p>`:''}
    ${done?`<p class="bt-chat-sub">已选择：${esc(opts.find(o=>o[0]===s.choice)?.[1]||'')}</p>`:`<div class="bt-chat-actions">${button('采用这套规则','adopt-choice','is-primary',s.choice?'':'disabled')}</div>`}`;
  }
  if(step==='spec'){
   const sp=s.spec,set=sp.more.set,rows=[['原始需求',s.text],...sp.more.rules.filter(r=>r[0]!=='采用的默认值'),['回测区间',`${set.start} — ${set.end}`],['执行 / 资金',sp.kind==='dca'?'按期追加资金，整百股买入':'次日开盘成交；100 万元；空仓启动'],['费用 / 滑点','佣金万分之三、最低 5 元；印花税按现行税率；滑点 0.1%']];
   const done=past('spec');
   return `<div class="bt-chat-head"><b>确认可执行规则</b>${done?chip(s.stage==='adjust'||s.stage==='done'?'已返回调整':'已确认'):chip('待确认','is-notice')}<span class="bt-chat-grow"></span><span class="bt-chat-sub">结构化策略 · ${esc(sp.name)}</span></div>
    <div class="bt-chat-rows">${rows.map(([k,v])=>`<div><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join('')}</div>
    <div class="bt-chat-assume"><b>补充假设</b> ${chip('AI 补充','is-ai')}<ul>${assumptions(s).map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>
    ${done?'':`<div class="bt-chat-actions">${button('返回调整','adjust')}${button('确认并生成代码','confirm','is-primary')}</div>`}`;
  }
  if(step==='code'){
   return `<div class="bt-chat-head"><b>Python · 策略 v1</b>${chip('代码已就绪')}<span class="bt-chat-grow"></span>${button(s.codeOpen?'收起代码':'查看代码','toggle-code')}</div>
    <ul class="bt-chat-checks"><li>规则与参数已关联</li><li>语法检查通过</li><li>只取信号日之前的数据</li><li>只使用回测环境预置的库</li></ul>
    ${s.codeOpen?`<pre class="bt-chat-code">${esc(codeOf(s))}</pre>`:''}
    ${s.stage==='code'?`<div class="bt-chat-actions">${button('开始回测','run','is-primary')}</div>`:''}`;
  }
  if(step==='run'){
   const p=BacktestPage.progress(s.stId),live=p.running;
   return `<div class="bt-chat-head"><b>${live?'回测中':'回测已结束'}</b>${live?chip('运行中','is-parsing'):''}</div>${live?`<div class="bt-chat-progress"><i style="width:${p.pct}%"></i></div><div class="bt-chat-actions"><span class="bt-chat-sub" data-progress-label>已回测到 ${esc(p.date)}</span><span class="bt-chat-grow"></span>${button('取消','cancel')}</div>`:''}`;
  }
  if(step==='failed'){
   const p=BacktestPage.progress(s.stId);
   return `<div class="bt-chat-head"><b>运行失败</b>${chip('失败','is-warn')}</div><p class="bt-chat-sub">${esc(p.error?`策略第 ${p.error.line} 行 · ${p.error.msg}`:'未知错误')}</p><div class="bt-chat-actions">${button('在策略回测中修复','fix','is-primary')}</div>`;
  }
  if(step==='result'){
   const r=BacktestPage.summary(s.stId);if(!r)return '<p class="bt-chat-sub">这次结果已不可用（策略可能已被删除）。</p>';
   const stat=(v,label)=>`<span><b>${v}</b>${label}</span>`,files=['回测报告.html','净值曲线.csv','交易记录.csv','日志.log'];
   return `<div class="bt-chat-head"><b>${esc(r.name)}</b>${chip('已完成')}<span class="bt-chat-grow"></span><span class="bt-chat-sub">${r.start} — ${r.end} · 基准${esc(r.benchmark)}</span></div>
    <div class="bt-chat-stats">${stat(pct(r.total),'累计收益')}${stat(pct(r.mdd,false),'最大回撤')}${stat(r.count+' 笔','实际成交')}${stat(pct(r.bench),'基准收益')}</div>
    ${spark(r.eq,r.bm)}<div class="bt-chat-legend"><span><i></i>策略收益</span><span class="is-bench"><i></i>${esc(r.benchmark)}</span></div>
    ${s.reportOpen?`<div class="bt-chat-rows">${[['年化收益',pct(r.annual)],['夏普比率',r.sharpe.toFixed(2)],['波动率',pct(r.vol,false)],['胜率',pct(r.win,false)],['超额收益',pct(r.total-r.bench)],['数据截至',r.dataDate]].map(([k,v])=>`<div><span>${k}</span><p>${v}</p></div>`).join('')}</div><p class="bt-chat-sub">历史回测不代表未来收益，不构成投资建议。成交与持仓明细、月度收益与运行日志在策略回测中查看。</p>`:''}
    <div class="bt-chat-files">${files.map(name=>`<button type="button" class="kb-chip is-action" data-bt-act="open">${name}</button>`).join('')}</div>
    <div class="bt-chat-actions">${button(s.reportOpen?'收起报告':'对话内展开报告','toggle-report')}${button('打开策略回测','open','is-primary')}<span class="bt-chat-grow"></span><span class="bt-chat-sub">用时 ${r.secs.toFixed(1)} 秒 · 策略 v${r.ver}</span></div>`;
  }
  return '';
 }
 const codeOf=s=>BacktestPage.codeOf(s.stId)||'';
 function card(message,thread){
  const {sid,step}=message.backtest,s=sessions.get(sid),node=document.createElement('section');node.className='bt-chat-card';
  if(!s){node.innerHTML='<p class="bt-chat-sub">这张卡片来自上一次打开的页面，刷新后不可再操作。</p>';return node}
  node.innerHTML=body(step,s);
  node.addEventListener('click',e=>{const el=e.target.closest('[data-bt-act]');if(!el||el.disabled)return;e.stopPropagation();ACTS[el.dataset.btAct]?.(s,el)});
  node.addEventListener('input',e=>{const key=e.target.dataset.btInput;if(key)s[key]=e.target.value});
  if(step==='run')node.dataset.btRun=s.id;
  return node;
 }

 /* ---------- 接入对话提交 ---------- */
 function install(){
  if(!window.ChatStore||ChatStore.__backtest)return;ChatStore.__backtest=true;
  const original=ChatStore.submit;
  ChatStore.submit=(id,text)=>{
   const thread=ChatStore.get(id),t=String(text||'').trim();
   if(!thread||thread.kind==='personal'||thread.pending||!t)return original(id,text);
   const open=[...sessions.values()].filter(x=>x.thread===id),adjusting=open.find(x=>x.stage==='adjust'),last=open.at(-1);
   const modify=last&&['result','code'].includes(last.stage)&&MODIFY.test(t)&&!/回测一下|帮我回测/.test(t);
   if(!adjusting&&!modify&&!isIntent(t))return original(id,text);
   thread.messages.push(msg('user',t));thread.draft='';thread.pendingScroll='bottom';changed(id);
   if(adjusting){adjusting.stage='done';later(()=>start(thread,adjusting.text+'；'+t,{choice:/布林/.test(t)?'boll':adjusting.choice,buy:adjusting.buy,sell:adjusting.sell}));return true}
   if(modify){later(()=>{if(!BacktestPage.aiStop(last.stId))return say(thread,'这个策略暂时没法自动修改：它已经有止损，或者你在策略页面上有未保存的手动编辑。');last.stage='run';say(thread,'已在策略里加入 8% 止损，保存为新版本并重新回测。改动的代码在「策略回测 › 策略 › 改动」里逐行标出，可以保留或撤销。','run',last);watch(last)});return true}
   later(()=>start(thread,t));return true;
  };
 }
 addEventListener('DOMContentLoaded',install);install();
 return {card,isIntent};
})();
