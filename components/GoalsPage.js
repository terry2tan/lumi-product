/* 目标（原「自动任务」）交互稿：线框保真度，主要流程可点。
   对应需求稿 lumi/docs/requirements-pool/workflow/proactive-agent/REQUIREMENTS.md（R4 目标、R5.4 活动、R6.5 盯不了、R8 定时任务并入）。
   目标下的检查项分两种：「盯」有实质变化才提醒；「定时」到点必给结果（原自动任务迁移而来）。 */
window.GoalsPage=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const P=()=>ProactiveStore;
 const S={view:'list',tab:'goals',goalId:null,q:'',showDone:false,openRun:null,form:null,editing:null};
 let root=null,toastTimer=0;
 const btn=(label,act,attrs='',cls='')=>`<button type="button" class="gl-btn ${cls}" data-act="${act}" ${attrs}>${esc(label)}</button>`;
 const chip=(text,cls='')=>`<span class="gl-chip ${cls}">${esc(text)}</span>`;
 function toast(text){clearTimeout(toastTimer);let t=root.querySelector('.gl-toast');if(!t){t=document.createElement('div');t.className='gl-toast';t.setAttribute('role','status');root.append(t)}t.textContent=text;t.hidden=false;toastTimer=setTimeout(()=>t.hidden=true,2600)}
 const nextLabel=g=>{const timed=P().timedCheck(g);if(g.status==='paused')return'已暂停';if(g.status==='done')return'已完成';return timed?`下次 ${timed.time}`:'有变化时提醒'};
 const kinds=g=>{const t=g.checks.filter(c=>c.kind==='timed').length,s=g.checks.filter(c=>c.kind==='signal').length;return[t?chip(`定时 ${P().timedCheck(g).time}`,'is-timed'):'',s?chip(`盯 ${s} 项`,'is-signal'):''].join('')};

 function goalCard(g){
  const latest=g.progress[0];
  return `<article class="gl-card${g.status==='done'?' is-done':''}" data-act="open-goal" data-id="${g.id}" tabindex="0" role="button" aria-label="打开目标 ${esc(g.title)}">
   <div class="gl-row"><h3 class="gl-grow">${esc(g.title)}</h3><span class="gl-status ${g.status}">${esc(nextLabel(g))}</span></div>
   <div class="gl-row gl-wrap">${kinds(g)}${g.migrated?chip('原自动任务','is-muted'):''}</div>
   <p class="gl-latest">${latest?`<span class="gl-sub">${esc(latest.at)}</span> ${esc(latest.text)}`:'<span class="gl-sub">还没有进展</span>'}</p>
   <p class="gl-sub">推送到：${esc(g.push.join('、'))}</p></article>`;
 }
 function listView(){
  const q=S.q.trim(),match=g=>!q||g.title.includes(q)||g.desc.includes(q);
  const active=P().goals.filter(g=>g.status!=='done'&&match(g)),done=P().goals.filter(g=>g.status==='done'&&match(g));
  const migrated=P().goals.filter(g=>g.migrated).length;
  return `${P().settings.migrationNotice?`<div class="gl-banner" role="note"><div class="gl-grow"><b>「自动任务」已并入目标</b><p>你的 ${migrated} 个自动任务已迁移为带「定时」的目标，执行时间、内容和推送渠道都没有变。定时的会到点给你结果；「盯」的只在有实质变化时提醒。</p></div>${btn('知道了','dismiss-notice','','is-small')}</div>`:''}
   ${P().candidates.length?`<section class="gl-section"><div class="gl-row"><h2 class="gl-grow">Lumi 的建议</h2><span class="gl-sub">从最近的对话里发现，你确认后才会开始</span></div>
    <div class="gl-suggest-list">${P().candidates.map(c=>`<div class="gl-suggest"><div class="gl-grow"><b>${esc(c.title)}</b><p>${esc(c.desc)}</p><p class="gl-sub">${esc(c.why)}</p></div><div class="gl-row">${btn('设为目标','accept',`data-id="${c.id}"`,'is-primary is-small')}${btn('不需要','dismiss',`data-id="${c.id}"`,'is-small')}</div></div>`).join('')}</div></section>`:''}
   <section class="gl-section"><div class="gl-row"><h2 class="gl-grow">进行中 · ${active.length}</h2></div>
    <div class="gl-grid">${active.map(goalCard).join('')||'<p class="gl-empty">没有匹配的目标。</p>'}</div></section>
   ${done.length?`<section class="gl-section"><button type="button" class="gl-link" data-act="toggle-done" aria-expanded="${S.showDone}">${S.showDone?'收起':'展开'}已完成 · ${done.length}</button>${S.showDone?`<div class="gl-grid">${done.map(goalCard).join('')}</div>`:''}</section>`:''}`;
 }
 function activityView(){
  const cap=P().settings.volume==='少'?[3,2]:[12,6];
  return `<div class="gl-stats"><div class="gl-stat"><span class="gl-sub">今天已运行</span><b>3 <small>/ ${cap[0]} 次</small></b><i style="--p:${300/cap[0]}%"></i></div><div class="gl-stat"><span class="gl-sub">今天已提醒</span><b>2 <small>/ ${cap[1]} 条</small></b><i style="--p:${200/cap[1]}%"></i></div><div class="gl-stat"><span class="gl-sub">当前频率</span><b>${esc(P().settings.volume)}</b>${btn('调整','adjust-volume','','is-small')}</div></div>
   <p class="gl-hint">每一次后台查看都记在这里，包括没有打扰你的。定时检查到点必给结果，不计入提醒条数。</p>
   <div class="gl-table" role="table" aria-label="后台活动"><div class="gl-tr gl-th" role="row"><span>时间</span><span>触发</span><span>目标</span><span>结论</span></div>
   ${P().runs.map((r,i)=>{const g=r.goal&&P().goal(r.goal);return `<div class="gl-tr" role="row"><span>${esc(r.at)}</span><span>${esc(r.trigger)}</span><span>${g?`<button type="button" class="gl-link" data-act="open-goal" data-id="${g.id}">${esc(g.title)}</button>`:'—'}</span><span><button type="button" class="gl-result ${r.tone}" data-act="toggle-run" data-i="${i}" aria-expanded="${S.openRun===i}">${esc(r.result)} ${S.openRun===i?'▴':'▾'}</button></span></div>
     ${S.openRun===i?`<div class="gl-run-detail"><p>${esc(r.detail)}</p>${r.card?btn('在「你的 Lumi」中查看','open-card',`data-card="${r.card}"`,'is-small'):''}${r.result.includes('拦截')?btn('仍要查看被拦下的内容','noop','','is-small'):''}</div>`:''}`}).join('')}</div>`;
 }
 function detailView(){
  const g=P().goal(S.goalId);if(!g){S.view='list';return listView()}
  const timed=P().timedCheck(g),muted=P().muted.has(g.id);
  return `<div class="gl-crumb"><button type="button" class="gl-link" data-act="back">目标</button><span>›</span><b>${esc(g.title)}</b></div>
   <header class="gl-head"><div class="gl-grow"><h1 tabindex="-1">${esc(g.title)}</h1><p class="gl-sub">${esc(g.desc)} · ${esc(g.origin)}</p></div>
    <div class="gl-head-tools">${g.status==='done'?'':btn(g.status==='paused'?'恢复':'暂停','pause')}${g.status==='done'?'':btn('标记完成','finish')}${btn('编辑','edit')}${btn('删除','delete','','is-danger')}</div></header>
   ${muted?`<div class="gl-banner is-warn"><p class="gl-grow">你已在「你的 Lumi」里选择不再提醒这个目标的同类内容；定时结果不受影响。</p>${btn('恢复提醒','unmute','','is-small')}</div>`:''}
   <section class="gl-panel"><div class="gl-row"><h2 class="gl-grow">检查项</h2><span class="gl-sub">「定时」到点必给；「盯」有实质变化才说</span></div>
    <div class="gl-checks">${g.checks.map(c=>{const l=P().checkLabel(c);return `<div class="gl-check${l.ready?'':' is-off'}">${chip(l.tag,c.kind==='timed'?'is-timed':'is-signal')}<div class="gl-grow"><b>${esc(l.name)}</b>${l.ready?'':`<p class="gl-sub">暂时盯不了：${esc(l.reason)}，数据就绪后自动开始</p>`}</div><span class="gl-sub">${esc(l.mode)}</span></div>`}).join('')||'<p class="gl-empty">还没有检查项。</p>'}</div>
    ${g.securities.length?`<p class="gl-sub">范围：${esc(g.securities.join('、'))}</p>`:''}
    <div class="gl-row">${btn('添加检查项','edit','','is-small')}</div></section>
   ${timed?`<section class="gl-panel"><div class="gl-row"><h2 class="gl-grow">定时执行</h2>${btn('立即执行','run-now','','is-primary is-small')}</div>
    <div class="gl-fields"><p class="gl-field"><span>时间</span>${esc(timed.rule)} ${esc(timed.time)}</p><p class="gl-field"><span>内容</span>${esc(timed.prompt)}</p><p class="gl-field"><span>推送到</span>${esc(g.push.join('、'))}</p><p class="gl-field"><span>保障</span>离线错过会提示且不补跑；连续 3 次失败自动暂停并通知你</p></div>
    <h3>执行记录</h3><div class="gl-table is-compact" role="table" aria-label="执行记录"><div class="gl-tr gl-th" role="row"><span>时间</span><span>结果</span><span>耗时</span></div>${(g.runs||[]).map(r=>`<div class="gl-tr" role="row"><span>${esc(r.at)}</span><span class="${r.status==='成功'?'':'gl-warn'}">${esc(r.status)}</span><span>${esc(r.took)}</span></div>`).join('')}</div></section>`:''}
   <section class="gl-panel"><div class="gl-row"><h2 class="gl-grow">进展</h2><button type="button" class="gl-link" data-act="open-feed" data-goal="${g.id}">在「你的 Lumi」中查看相关动态</button></div>
    <ol class="gl-timeline">${g.progress.map(p=>`<li class="${p.notified?'is-hit':''}"><span class="gl-sub">${esc(p.at)}${p.notified?' · 已提醒':''}</span><p>${esc(p.text)}${p.card?` <button type="button" class="gl-link" data-act="open-card" data-card="${p.card}">查看</button>`:''}</p></li>`).join('')||'<li><p class="gl-sub">还没有进展</p></li>'}</ol></section>
   <section class="gl-panel"><div class="gl-row"><h2 class="gl-grow">Lumi 的笔记</h2><span class="gl-sub">Lumi 为这个目标记下的要点，你可以修改</span></div>
    <textarea class="gl-textarea" data-input="note" aria-label="Lumi 的笔记">${esc(g.note)}</textarea><div class="gl-row">${btn('保存','save-note','','is-small')}</div></section>`;
 }
 function formView(){
  const f=S.form,groups=[...new Set(P().signals.map(s=>s.group))];
  return `<div class="gl-crumb"><button type="button" class="gl-link" data-act="back">目标</button><span>›</span><b>${S.editing?'编辑目标':'新建目标'}</b></div>
   <header class="gl-head"><h1 tabindex="-1">${S.editing?'编辑目标':'新建目标'}</h1></header>
   <section class="gl-panel"><label class="gl-label">想让 Lumi 持续帮你做什么<input class="gl-input" data-form="title" value="${esc(f.title)}" placeholder="例如：盯住铂力特的订单与交付；每天开盘前给我盘前要点"></label>
    <label class="gl-label">补充说明（可选）<textarea class="gl-textarea" data-form="desc" placeholder="你最在意的方面、什么情况下需要提醒你">${esc(f.desc)}</textarea></label>
    <label class="gl-label">涉及的标的（可选）<input class="gl-input" data-form="securities" value="${esc(f.securities)}" placeholder="用顿号分隔，例如：科华数据、太辰光"></label></section>
   <section class="gl-panel"><div class="gl-row"><h2 class="gl-grow">盯什么</h2><span class="gl-sub">有实质变化才提醒；后台只看不动</span></div>
    ${groups.map(group=>`<div class="gl-signal-group"><span class="gl-sub">${esc(group)}</span><div class="gl-row gl-wrap">${P().signals.filter(s=>s.group===group).map(s=>`<label class="gl-option${s.ready?'':' is-off'}"><input type="checkbox" data-signal="${s.id}" ${f.signals.includes(s.id)?'checked':''}> ${esc(s.name)}<small>${s.ready?esc(s.mode):'暂时盯不了 · '+esc(s.reason)}</small></label>`).join('')}</div></div>`).join('')}</section>
   <section class="gl-panel"><div class="gl-row"><h2 class="gl-grow">定时给我结果</h2><button type="button" class="gl-toggle ${f.timed?'is-on':''}" data-act="toggle-timed" role="switch" aria-checked="${f.timed}" aria-label="定时给我结果"><i></i></button></div>
    <p class="gl-hint">打开后，到点一定给你一份结果，没有变化也会写明「没有新变化」。原来的自动任务就是这一类。</p>
    ${f.timed?`<div class="gl-row gl-wrap"><label class="gl-label is-inline">频率<select data-form="rule">${['每个交易日','每天','每周一','仅一次'].map(o=>`<option ${o===f.rule?'selected':''}>${o}</option>`).join('')}</select></label><label class="gl-label is-inline">时间<select data-form="time">${['08:30','09:15','11:35','15:10','15:30','21:00'].map(o=>`<option ${o===f.time?'selected':''}>${o}</option>`).join('')}</select></label></div>
    <label class="gl-label">每次要做什么<textarea class="gl-textarea" data-form="prompt" placeholder="例如：整理隔夜外盘和我自选股的公告，生成 3 条盘前要点">${esc(f.prompt)}</textarea></label>`:''}</section>
   <section class="gl-panel"><h2>结果推送到</h2><div class="gl-row gl-wrap">${P().channels.map(c=>`<label class="gl-option"><input type="checkbox" data-push="${c}" ${f.push.includes(c)?'checked':''} ${c==='应用内'?'disabled':''}> ${c}${c==='应用内'?'<small>「你的 Lumi」信息流，始终开启</small>':''}</label>`).join('')}</div>
    <p class="gl-hint">「盯」的提醒推送到微信、飞书仍在评估（需求 R8.10），本稿暂按定时结果处理。</p></section>
   <div class="gl-row">${btn(S.editing?'保存':'创建目标','save-goal','','is-primary')}${btn('取消','back')}</div>`;
 }
 let lastKey='';
 function draw(){
  if(!root)return;const key=`${S.view}:${S.tab}:${S.goalId}`,scroll=key===lastKey?root.querySelector('.gl-scroll')?.scrollTop||0:0;lastKey=key;
  const head=S.view==='list'?`<header class="gl-head"><div class="gl-grow"><h1 tabindex="-1">目标</h1><p class="gl-sub">说一次，Lumi 持续替你盯着；需要定时的，到点给你结果。</p></div><div class="gl-head-tools">${S.tab==='goals'?`<input class="gl-input" type="search" data-input="q" value="${esc(S.q)}" placeholder="搜索目标" aria-label="搜索目标">`:''}${btn('新建目标','new-goal','','is-primary')}</div></header>
   <div class="gl-tabs" role="tablist">${[['goals','目标'],['activity','活动']].map(([id,label])=>`<button type="button" role="tab" aria-selected="${S.tab===id}" class="${S.tab===id?'is-active':''}" data-act="tab" data-tab="${id}">${label}</button>`).join('')}</div>`:'';
  const body=S.view==='detail'?detailView():S.view==='form'?formView():S.tab==='activity'?activityView():listView();
  root.innerHTML=`<div class="gl-scroll">${head}${body}</div>`;
  root.querySelector('.gl-scroll').scrollTop=scroll;
 }
 const blankForm=()=>({title:'',desc:'',securities:'',signals:[],timed:false,rule:'每个交易日',time:'08:30',prompt:'',push:['应用内']});
 function formFrom(g){const t=P().timedCheck(g);return{title:g.title,desc:g.desc,securities:g.securities.join('、'),signals:g.checks.filter(c=>c.kind==='signal').map(c=>c.signal),timed:!!t,rule:t?.rule||'每个交易日',time:t?.time||'08:30',prompt:t?.prompt||'',push:[...g.push]}}
 function saveGoal(){
  const f=S.form;if(!f.title.trim()){toast('请先写下想让 Lumi 做什么');root.querySelector('[data-form="title"]')?.focus();return}
  if(!f.signals.length&&!f.timed){toast('至少选一项要盯的内容，或打开「定时给我结果」');return}
  if(f.timed&&!f.prompt.trim()){toast('请写下每次定时要做什么');return}
  const checks=[...(f.timed?[{kind:'timed',rule:f.rule,time:f.time,prompt:f.prompt.trim()}]:[]),...f.signals.map(signal=>({kind:'signal',signal}))];
  const data={title:f.title.trim(),desc:f.desc.trim()||'（没有补充说明）',securities:f.securities.split(/[、,，\s]+/).filter(Boolean),checks,push:f.push};
  const off=f.signals.map(id=>P().signal(id)).filter(s=>!s.ready).map(s=>s.name);
  if(S.editing){P().updateGoal(S.editing,data);S.goalId=S.editing}else{S.goalId=P().addGoal(data).id}
  S.view='detail';S.editing=null;S.form=null;draw();toast(off.length?`已保存。${off.join('、')}暂时盯不了，数据就绪后自动开始`:'已保存');
 }
 function bind(){
  root.addEventListener('click',e=>{
   const el=e.target.closest('[data-act]');if(!el||!root.contains(el))return;const a=el.dataset.act,id=el.dataset.id;
   if(a==='tab'){S.tab=el.dataset.tab;S.openRun=null;return draw()}
   if(a==='open-goal'){S.view='detail';S.goalId=id;return draw()}
   if(a==='back'){S.view=S.goalId&&S.view==='form'&&S.editing?'detail':'list';S.form=null;S.editing=null;return draw()}
   if(a==='new-goal'){S.view='form';S.editing=null;S.form=blankForm();return draw()}
   if(a==='edit'){S.view='form';S.editing=S.goalId;S.form=formFrom(P().goal(S.goalId));return draw()}
   if(a==='toggle-timed'){S.form.timed=!S.form.timed;return draw()}
   if(a==='save-goal')return saveGoal();
   if(a==='dismiss-notice'){P().settings.migrationNotice=false;return draw()}
   if(a==='accept'){const g=P().acceptCandidate(id);draw();return toast(`已设为目标「${g.title}」`)}
   if(a==='dismiss'){P().dismissCandidate(id);draw();return toast('已忽略，Lumi 不会再建议同样的内容')}
   if(a==='toggle-done'){S.showDone=!S.showDone;return draw()}
   if(a==='toggle-run'){const i=Number(el.dataset.i);S.openRun=S.openRun===i?null:i;return draw()}
   if(a==='pause'){const g=P().goal(S.goalId);P().updateGoal(g.id,{status:g.status==='paused'?'active':'paused'});draw();return toast(g.status==='paused'?'已暂停，历史保留':'已恢复')}
   if(a==='finish'){P().updateGoal(S.goalId,{status:'done'});draw();return toast('已标记完成')}
   if(a==='delete'){const g=P().goal(S.goalId);if(!confirm(`删除目标「${g.title}」？已经推送过的消息不会被删除。`))return;P().removeGoal(g.id);S.view='list';S.goalId=null;draw();return toast('已删除')}
   if(a==='unmute'){P().toggleMute(S.goalId);return draw()}
   if(a==='run-now'){P().runNow(S.goalId);draw();return toast('已执行，结果放进了「你的 Lumi」')}
   if(a==='save-note'){const v=root.querySelector('[data-input="note"]').value;P().updateGoal(S.goalId,{note:v});return toast('笔记已保存')}
   if(a==='open-card')return LumiFeed.openCard(el.dataset.card);
   if(a==='open-feed')return LumiFeed.openWithGoal(el.dataset.goal);
   if(a==='adjust-volume'){P().settings.volume=P().settings.volume==='少'?'多':'少';draw();return toast(`频率已调为「${P().settings.volume}」`)}
   if(a==='noop')return toast('交互稿：此处展开被拦下的完整内容');
  });
  root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][data-act]')){e.preventDefault();e.target.click()}});
  root.addEventListener('input',e=>{
   const t=e.target;if(t.dataset.input==='q'){S.q=t.value;const pos=t.selectionStart;draw();const n=root.querySelector('[data-input="q"]');n.focus();n.setSelectionRange(pos,pos);return}
   if(t.dataset.form&&S.form)S.form[t.dataset.form]=t.value;
  });
  root.addEventListener('change',e=>{
   const t=e.target;if(!S.form)return;
   if(t.dataset.form)S.form[t.dataset.form]=t.value;
   if(t.dataset.signal){const set=new Set(S.form.signals);t.checked?set.add(t.dataset.signal):set.delete(t.dataset.signal);S.form.signals=[...set]}
   if(t.dataset.push){const set=new Set(S.form.push);t.checked?set.add(t.dataset.push):set.delete(t.dataset.push);S.form.push=P().channels.filter(c=>set.has(c))}
  });
 }
 function mount(wb){root=document.createElement('section');root.className='gl-page';root.dataset.morePage='goals';root.setAttribute('aria-label','目标');wb.append(root);bind();draw();return root}
 /* 供外部跳转：打开目标页的某个页签或某个目标。 */
 function open({tab='goals',goalId=null}={}){S.tab=tab;S.view=goalId?'detail':'list';S.goalId=goalId;S.form=null;S.editing=null;navigate('目标');if(root?.isConnected)draw()}
 window.addEventListener('proactive:changed',()=>{if(root?.isConnected&&S.view!=='form')draw()});
 return{mount,open};
})();
