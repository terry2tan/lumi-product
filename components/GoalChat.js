/* 新建目标在对话中的流程（与 BacktestChat 新建策略一致）：
   识别目标意图 → 补齐要盯的内容（选择卡）→ 确认结构化目标 → 创建并收进「目标」。
   对话里确认的目标直接写入 ProactiveStore，目标页立即可见；编辑已有目标仍在目标页完成。 */
window.GoalChat=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const P=()=>ProactiveStore;
 const INTENT=/盯住|盯着|帮我盯|提醒我|告诉我|通知我|设成.*目标|设为目标|新建目标|持续跟踪|持续关注|帮我跟踪|给我.*(要点|总结|复盘|简报)/;
 const NOT=/回测|策略/;
 const TIMED=[[/每个交易日|交易日/,'每个交易日'],[/每天|每日/,'每天'],[/每周一|每周/,'每周一'],[/开盘前|盘前|收盘后|盘后|午间|午盘/,'每个交易日']];
 const TIMES=[[/(\d{1,2})[:：](\d{2})/,m=>m[1].padStart(2,'0')+':'+m[2]],[/开盘前|盘前/,()=>'08:30'],[/午间|午盘/,()=>'11:35'],[/收盘后|盘后|复盘/,()=>'15:30'],[/晚上|晚间/,()=>'21:00']];
 const SIGNALS=[[/公告|订单|业绩预告|增减持|回购/,'C1'],[/问询|立案|处罚|监管/,'C6'],[/研报|评级|目标价/,'E2'],[/涨跌|大涨|大跌|异动|涨停|跌停/,'A1'],[/放量|成交量/,'A3'],[/资金|主力/,'A4'],[/画的线|画线/,'A6'],[/预期/,'C2'],[/财报|披露日/,'D1'],[/持仓|盈亏|回撤/,'G1']];
 const NAMES=['铂力特','科华数据','太辰光','中际旭创','宁德时代','贵州茅台','沪深300ETF','自选股'];
 const OPTIONS=[['notice','重要公告与监管事项','订单、业绩预告、增减持；问询函、立案处罚',['C1','C6']],['market','行情异动','涨跌幅越阈、异常放量、主力资金异动',['A1','A3','A4']],['research','研报评级与目标价','机构评级上调下调、目标价变化',['E2']],['timed','定时给我一份结果','每个交易日 08:30 到点必给，没有变化也会写明',[]]];
 const sessions=new Map();let seq=0,mid=0;
 const isIntent=text=>INTENT.test(text)&&!NOT.test(text);
 const changed=id=>dispatchEvent(new CustomEvent('conversation:changed',{detail:{id,reason:'update'}}));
 const now=()=>{try{return ChatStore.clock()}catch{return {}}};
 const msg=(role,text,extra={})=>({id:'gl-msg-'+(++mid),role,text,...now(),status:null,...extra});
 function say(thread,text,step,s){thread.messages.push(msg('assistant',text,step?{goal:{sid:s.id,step}}:{}));thread.pendingScroll='bottom';changed(thread.id)}
 const later=(fn,ms=500)=>setTimeout(fn,ms);

 /* ---------- 从一句话整理出目标 ---------- */
 function specFromText(text,picks=[],base=text){
  const rule=TIMED.find(([re])=>re.test(text))?.[1]||(picks.includes('timed')?'每个交易日':null);
  const timeHit=TIMES.find(([re])=>re.test(text)),time=timeHit?timeHit[1](text.match(timeHit[0])):'08:30';
  const signals=[...new Set([...SIGNALS.filter(([re])=>re.test(text)).map(([,id])=>id),...OPTIONS.filter(o=>picks.includes(o[0])).flatMap(o=>o[3])])];
  const securities=NAMES.filter(n=>text.includes(n));
  const push=['应用内',...['微信','飞书'].filter(c=>text.includes(c))];
  const title=base.replace(/^(请|帮我|麻烦|你)+/,'').replace(/[，,。；;]?(有实质变化|有变化)?(时|的时候)?再?(提醒|告诉|通知)我.*$/,'').replace(/[，,。；;]+$/,'').slice(0,24)||base.slice(0,24);
  return{title,securities,signals,timed:rule?{kind:'timed',rule,time,prompt:base}:null,push};
 }
 function assumptions(s){
  const sp=s.spec,list=[];
  if(sp.signals.length)list.push('「盯」的内容只在有实质变化时提醒，同类消息合并；后台只看不动');
  if(sp.timed)list.push(TIMED.some(([re])=>re.test(s.text))?`按「${sp.timed.rule}」执行，到点必给结果，没有变化也会写明「没有新变化」`:'原句没有说明频率，默认每个交易日执行一次');
  if(sp.timed&&!TIMES.some(([re])=>re.test(s.text)))list.push('原句没有说明时间，默认 08:30');
  if(!sp.securities.length)list.push('原句没有点名标的，按你的自选股范围执行');
  if(sp.push.length===1)list.push('原句没有说明推送渠道，结果只放进「你的 Lumi」信息流');
  const off=sp.signals.map(id=>P().signal(id)).filter(x=>x&&!x.ready);
  if(off.length)list.push(`${off.map(x=>x.name).join('、')}暂时盯不了，数据就绪后自动开始`);
  return list;
 }

 /* ---------- 流程 ---------- */
 /* text 是原句加上历次调整，base 是原句：标题、说明与定时内容只取原句，调整只影响规则。 */
 function start(thread,text,picks=[],base=text){
  const s={id:'gs'+(++seq),thread:thread.id,text,base,stage:'intent',picks:[...picks]};sessions.set(s.id,s);
  const sp=specFromText(text,s.picks,base);
  if(!sp.signals.length&&!sp.timed){s.stage='clarify';return say(thread,'已识别为新建目标。还需要明确 Lumi 具体替你盯什么，或者是否定时给你结果：','clarify',s)}
  toSpec(thread,s);
 }
 function toSpec(thread,s){
  s.spec=specFromText(s.text,s.picks,s.base);s.stage='spec';
  say(thread,'下面是整理后的目标。原句没有说明的部分列在「补充假设」里，确认后开始执行。','spec',s);
 }
 const ACTS={
  pick(s,el){const id=el.dataset.pick,set=new Set(s.picks);set.has(id)?set.delete(id):set.add(id);s.picks=[...set];changed(s.thread)},
  'adopt-picks'(s){if(!s.picks.length)return;s.stage='chosen';const thread=ChatStore.get(s.thread);changed(s.thread);later(()=>toSpec(thread,s))},
  confirm(s){
   const thread=ChatStore.get(s.thread),sp=s.spec;s.stage='created';
   const g=P().addGoal({title:sp.title,desc:s.base,origin:'对话中确认 · 今天',securities:sp.securities,push:sp.push,checks:[...(sp.timed?[sp.timed]:[]),...sp.signals.map(signal=>({kind:'signal',signal}))],note:assumptions(s).join('\n')});
   s.goalId=g.id;changed(s.thread);later(()=>say(thread,'目标已创建，并已收进「目标」。之后的进展会出现在「你的 Lumi」里，也可以随时在目标页暂停、编辑或删除。','created',s),600);
  },
  adjust(s){s.stage='adjust';say(ChatStore.get(s.thread),'好的，直接告诉我要改哪里，比如「改成每天 15:30」「再盯一下研报评级」「也推送到微信」，我会在原来的基础上重新整理。')},
  open(s){GoalsPage.open({goalId:s.goalId})}
 };

 /* ---------- 卡片（沿用策略对话卡片的样式） ---------- */
 const button=(label,act,cls='',attrs='')=>`<button type="button" class="kb-btn is-small ${cls}" data-gl-act="${act}" ${attrs}>${esc(label)}</button>`;
 const chip=(text,cls='')=>`<span class="kb-chip ${cls}">${esc(text)}</span>`;
 function body(step,s){
  const past=(...stages)=>!stages.includes(s.stage);
  if(step==='clarify'){
   const done=past('clarify');
   return `<div class="bt-chat-head"><b>补齐要盯的内容</b>${chip('可多选','is-notice')}</div>
    <div class="bt-chat-options">${OPTIONS.map(([id,label,desc])=>`<button type="button" class="bt-chat-option ${s.picks.includes(id)?'is-active':''}" data-gl-act="pick" data-pick="${id}" aria-pressed="${s.picks.includes(id)}" ${done?'disabled':''}><b>${label}</b><span>${desc}</span></button>`).join('')}</div>
    ${done?`<p class="bt-chat-sub">已选择：${esc(OPTIONS.filter(o=>s.picks.includes(o[0])).map(o=>o[1]).join('、'))}</p>`:`<div class="bt-chat-actions">${button('就按这些','adopt-picks','is-primary',s.picks.length?'':'disabled')}</div>`}`;
  }
  if(step==='spec'){
   const sp=s.spec,done=past('spec'),watch=sp.signals.map(id=>{const x=P().signal(id);return x.ready?`${x.name}（${x.mode}）`:`${x.name}（暂时盯不了：${x.reason}）`});
   const rows=[['原始需求',s.base],...(s.text!==s.base?[['调整',s.text.slice(s.base.length+1)]]:[]),['目标',sp.title],['范围',sp.securities.join('、')||'自选股'],['盯什么',watch.join('；')||'—'],['定时给结果',sp.timed?`${sp.timed.rule} ${sp.timed.time}`:'不定时，有实质变化才提醒'],['推送到',sp.push.join('、')]];
   return `<div class="bt-chat-head"><b>确认目标</b>${done?chip(s.stage==='adjust'||s.stage==='done'?'已返回调整':'已确认'):chip('待确认','is-notice')}<span class="bt-chat-grow"></span><span class="bt-chat-sub">${sp.signals.length?`盯 ${sp.signals.length} 项`:''}${sp.signals.length&&sp.timed?' · ':''}${sp.timed?'定时':''}</span></div>
    <div class="bt-chat-rows">${rows.map(([k,v])=>`<div><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join('')}</div>
    <div class="bt-chat-assume"><b>补充假设</b> ${chip('AI 补充','is-ai')}<ul>${assumptions(s).map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>
    ${done?'':`<div class="bt-chat-actions">${button('返回调整','adjust')}${button('确认并创建目标','confirm','is-primary')}</div>`}`;
  }
  if(step==='created'){
   const g=P().goal(s.goalId);if(!g)return '<p class="bt-chat-sub">这个目标已被删除。</p>';
   const timed=P().timedCheck(g);
   return `<div class="bt-chat-head"><b>${esc(g.title)}</b>${chip(g.status==='paused'?'已暂停':g.status==='done'?'已完成':'进行中')}<span class="bt-chat-grow"></span><span class="bt-chat-sub">${timed?`下次 ${esc(timed.time)}`:'有变化时提醒'}</span></div>
    <ul class="bt-chat-checks">${g.checks.map(c=>{const l=P().checkLabel(c);return `<li>${esc(l.tag)} · ${esc(l.name)}${l.ready?'':'（暂时盯不了）'}</li>`}).join('')}</ul>
    <div class="bt-chat-actions">${button('打开目标','open','is-primary')}</div>`;
  }
  return '';
 }
 function card(message){
  const {sid,step}=message.goal,s=sessions.get(sid),node=document.createElement('section');node.className='bt-chat-card';
  if(!s){node.innerHTML='<p class="bt-chat-sub">这张卡片来自上一次打开的页面，刷新后不可再操作。</p>';return node}
  node.innerHTML=body(step,s);
  node.addEventListener('click',e=>{const el=e.target.closest('[data-gl-act]');if(!el||el.disabled)return;e.stopPropagation();ACTS[el.dataset.glAct]?.(s,el)});
  return node;
 }

 /* ---------- 接入对话提交（先于策略回测判断，「回测/策略」类请求放行给 BacktestChat） ---------- */
 function install(){
  if(!window.ChatStore||ChatStore.__goal)return;ChatStore.__goal=true;
  const original=ChatStore.submit;
  ChatStore.submit=(id,text)=>{
   const thread=ChatStore.get(id),t=String(text||'').trim();
   if(!thread||thread.kind==='personal'||thread.pending||!t)return original(id,text);
   const adjusting=[...sessions.values()].find(x=>x.thread===id&&x.stage==='adjust');
   if(!adjusting&&!isIntent(t))return original(id,text);
   thread.messages.push(msg('user',t));thread.draft='';thread.pendingScroll='bottom';changed(id);
   if(adjusting){adjusting.stage='done';later(()=>start(thread,adjusting.text+'；'+t,adjusting.picks,adjusting.base));return true}
   later(()=>start(thread,t));return true;
  };
 }
 addEventListener('DOMContentLoaded',install);install();
 return {card,isIntent};
})();
