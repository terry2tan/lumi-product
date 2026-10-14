/* 「你的 Lumi」信息流：主动提醒、定时报告、预警跟进按时间排成卡片；点开卡片进入它自己的线程继续追问。
   对应需求稿 lumi/docs/requirements-pool/workflow/proactive-agent/REQUIREMENTS.md（R5.1、R8.4、R8.8）。
   进入「你的 Lumi」直接是信息流，不再先走 LumiWelcome 欢迎页与自我介绍。 */
window.LumiFeed=(()=>{
  const P=()=>ProactiveStore;
  const S={cardId:null,filter:'all',goal:'',menu:false,notes:false,noClient:false};
  const threads=new Map(),asks=new Map();
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const KIND={insight:['提醒','is-insight'],timed:['定时','is-timed'],alert:['预警','is-alert']};
  const dayLabel=date=>{const today=ChatStore.clock(),yesterday=ChatStore.clock(new Date(Date.now()-86400000));return date===today.date?'今天':date===yesterday.date?'昨天':date};
  /* 盘中由 LumiProactive 推来的观察，也作为「提醒」卡片进入信息流。 */
  function messageCards(){
    const lumi=ChatStore.get('lumi');if(!lumi)return[];
    return lumi.messages.filter(m=>m.origin==='proactive').map(m=>{
      const first=m.text.split('\n\n')[0],head=first.split(/[。]/)[0],title=head.length>30?head.slice(0,28)+'…':head;
      return{id:'m-'+m.id,messageId:m.id,kind:'insight',goal:null,source:`盘中观察 · ${m.topic||'市场'}`,day:dayLabel(m.date),time:m.time,unread:true,title,summary:first.slice(head.length+1)||first,body:m.text,evidence:[],follow:['这件事和我的自选股有关吗？']};
    }).reverse();
  }
  const allCards=()=>[...messageCards(),...P().feed];
  const card=id=>allCards().find(c=>c.id===id)||asks.get(id);
  function visibleCards(){
    return allCards().filter(c=>S.filter==='unread'?P().isUnread(c):S.filter==='goal'?c.goal===S.goal:true);
  }
  function lumiAvatar(){
    const control=make('button','lumi-floating-avatar');control.type='button';control.setAttribute('aria-label','打开 Lumi 个人资料');control.title='Lumi个人资料';control.setAttribute('aria-controls','home-right-sidebar');
    const avatar=make('img');avatar.dataset.lumiAvatar='';avatar.src=LumiProfile.avatar;avatar.alt=LumiProfile.name;avatar.draggable=false;
    control.append(avatar);LumiAvatarMotion.attach(control,avatar);control.onclick=()=>HomeLayout.openProfile();return control;
  }
  function cardView(c){
    const [label,cls]=KIND[c.kind],goal=c.goal&&P().goal(c.goal),button=make('button','lumi-feed-card');button.type='button';button.dataset.cardId=c.id;
    button.setAttribute('aria-label',`${label}：${c.title}`);
    button.innerHTML=`<span class="lumi-feed-meta"><span class="lumi-feed-tag ${cls}">${label}</span><span class="lumi-feed-source">${esc(c.source)}${goal&&!c.source.startsWith(goal.title)?` · ${esc(goal.title)}`:''}</span><span class="lumi-feed-time">${esc(c.time)}</span>${P().isUnread(c)?'<i class="lumi-feed-unread" aria-label="未读"></i>':''}</span><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p>${c.pushed?`<span class="lumi-feed-pushed">${esc(c.pushed)}</span>`:''}`;
    button.onclick=()=>openInPlace(c.id);return button;
  }
  function listBody(view){
    const body=make('div','lumi-feed-body'),log=make('div','conversation-log lumi-feed-log');log.tabIndex=0;log.setAttribute('aria-label','Lumi 动态');
    const inner=make('div','lumi-feed-inner'),bar=make('div','lumi-feed-toolbar');
    bar.append(make('h2','lumi-feed-title','动态'));
    const seg=make('div','lumi-feed-seg');seg.setAttribute('role','tablist');seg.setAttribute('aria-label','筛选动态');
    for(const [id,label] of [['all','全部'],['unread','未读']]){const b=make('button',S.filter===id?'is-active':'',label);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(S.filter===id));b.onclick=()=>{S.filter=id;S.goal='';draw(view)};seg.append(b)}
    const select=make('select','lumi-feed-select');select.setAttribute('aria-label','按目标筛选');
    select.innerHTML=`<option value="">按目标</option>${P().goals.filter(g=>g.status!=='done').map(g=>`<option value="${g.id}" ${S.filter==='goal'&&S.goal===g.id?'selected':''}>${esc(g.title)}</option>`).join('')}`;
    select.onchange=()=>{S.filter=select.value?'goal':'all';S.goal=select.value;draw(view)};
    bar.append(seg,select);inner.append(bar);
    if(S.filter==='goal'){const g=P().goal(S.goal);const note=make('div','lumi-feed-filter-note');note.innerHTML=`只看「${esc(g?.title)}」的动态 `;const clear=make('button','lumi-feed-link','看全部');clear.type='button';clear.onclick=()=>{S.filter='all';S.goal='';draw(view)};const manage=make('button','lumi-feed-link','打开这个目标');manage.type='button';manage.onclick=()=>GoalsPage.open({goalId:S.goal});note.append(clear,manage);inner.append(note)}
    let day='';const cards=visibleCards();
    for(const c of cards){if(c.day!==day){day=c.day;inner.append(make('div','lumi-feed-day',day))}inner.append(cardView(c))}
    if(!cards.length)inner.append(make('p','lumi-feed-empty',S.filter==='unread'?'没有未读的动态。':'这个目标还没有动态。有实质变化或到了定时时间，结果会出现在这里。'));
    log.append(inner);
    const bottom=make('div','conversation-bottom'),draft={kind:'regular',pending:false,draft:''};
    bottom.append(ChatComposer.create(draft,{placeholder:'问 Lumi，或说「帮我盯着……」「每天几点给我……」',submitDraft:text=>{ask(text);return true}}));
    bottom.append(make('p','conversation-disclaimer','AI生成内容仅供参考，不构成投资建议'));
    body.append(log,bottom);return body;
  }
  /* 卡片线程：首条为卡片全文；依据作为补充段落；后续问句放在输入框上方。 */
  function ensureThread(c){
    if(threads.has(c.id))return ChatStore.get(threads.get(c.id));
    const now=ChatStore.clock(),thread=ChatStore.create(c.title,{lumiCard:c.id});
    thread.messages=[{id:`message-lumi-card-${c.id}`,role:'assistant',text:c.body,after:c.evidence.length?`依据：\n${c.evidence.map(item=>'· '+item).join('\n')}`:undefined,...now,day:c.day==='今天'?now.day:c.day,time:c.time,origin:'lumi-card'}];
    threads.set(c.id,thread.id);return thread;
  }
  function ask(text){
    const thread=ChatStore.create(text.slice(0,18),{lumiAsk:true}),id='ask-'+thread.id,now=ChatStore.clock();
    asks.set(id,{id,kind:'insight',source:'你问 Lumi',day:'今天',time:now.time,title:thread.title,summary:text,body:'',evidence:[],follow:[]});
    threads.set(id,thread.id);ChatStore.submit(thread.id,text);S.cardId=id;S.menu=false;redraw();
  }
  function threadBody(view,c){
    const thread=ensureThread(c),body=make('div','lumi-feed-body lumi-feed-thread'),head=make('div','lumi-feed-thread-head');
    const back=make('button','lumi-feed-back','‹ 返回动态');back.type='button';back.onclick=()=>{S.cardId=null;S.menu=false;draw(view)};
    const goal=c.goal&&P().goal(c.goal),[label,cls]=KIND[c.kind]||KIND.insight;
    const meta=make('span','lumi-feed-meta');meta.innerHTML=`<span class="lumi-feed-tag ${cls}">${label}</span><span class="lumi-feed-source">${esc(c.source)}${goal&&!c.source.startsWith(goal.title)?` · ${esc(goal.title)}`:''}</span><span class="lumi-feed-time">${esc(c.day)} ${esc(c.time)}</span>`;
    head.append(back,meta);let actions=null;
    /* 「有用 / 不需要 / 更多」是对整张卡片的评价，放在正文下方、与带看入口同一行，而不是顶部标题栏。 */
    if(!c.id.startsWith('ask-')){
      actions=make('div','lumi-feed-thread-actions'),vote=P().votes.get(c.id);
      for(const [value,text] of [['up','有用'],['down','不需要']]){const b=make('button',vote===value?'is-selected':'',text);b.type='button';b.setAttribute('aria-pressed',String(vote===value));b.onclick=()=>{P().vote(c.id,value);draw(view)};actions.append(b)}
      const more=make('button','','更多');more.type='button';more.setAttribute('aria-expanded',String(S.menu));more.onclick=()=>{S.menu=!S.menu;draw(view)};actions.append(more);
      if(S.menu){const menu=make('div','lumi-feed-menu');menu.setAttribute('role','menu');
        const items=[...(goal?[[P().muted.has(goal.id)?'恢复提醒这类':'不再提醒这类',()=>{P().toggleMute(goal.id);toast(view,P().muted.has(goal.id)?`已不再提醒「${goal.title}」的同类内容，可在目标页恢复`:'已恢复提醒')}],['打开所属目标',()=>GoalsPage.open({goalId:goal.id})]]:[]),['为什么收到这条',()=>toast(view,c.kind==='timed'?'这是你设的定时检查，到点必给结果。':c.kind==='alert'?'你设的预警触发了，这里补充原因与后续观察点。':'它和你关注的内容有关，且近期没有提醒过同类内容。')],['查看后台活动',()=>GoalsPage.open({tab:'activity'})]];
        for(const [text,fn] of items){const b=make('button','',text);b.type='button';b.setAttribute('role','menuitem');b.onclick=()=>{S.menu=false;fn();if(view.isConnected)draw(view)};menu.append(b)}
        actions.append(menu)}
    }
    const host=make('div','lumi-feed-thread-host');body.append(head,host);
    {
      const nested=ConversationPage.mount(host,{id:thread.id});
      if(nested&&c.follow?.length&&!thread.messages.some(m=>m.role==='user')){
        const row=make('div','lumi-feed-follow');for(const q of c.follow){const b=make('button','conversation-inline-action',q);b.type='button';b.onclick=()=>{ChatStore.submit(thread.id,q);row.remove()};row.append(b)}
        nested.querySelector('.conversation-bottom')?.before(row);
      }
      /* 带看入口只在能力可用时出现（R7.2）；结束或失败的说明追加在这张卡片的线程里。 */
      const tour=make('div','lumi-feed-follow is-tour');
      if(c.kind!=='timed'&&!c.id.startsWith('ask-')&&/科华数据/.test(c.title)&&!S.noClient&&window.LumiTour?.available()){
        const b=make('button','conversation-inline-action','在行情图上带我看');b.type='button';
        b.onclick=()=>LumiTour.start({onEnd:text=>{thread.messages.push({id:`message-lumi-tour-${Date.now()}`,role:'assistant',text,...ChatStore.clock(),status:null,origin:'lumi-tour'});thread.pendingScroll='bottom';dispatchEvent(new CustomEvent('conversation:changed',{detail:{id:thread.id,reason:'update'}}))}});
        tour.append(b);
      }
      if(actions){const label=make('span','lumi-feed-ask','这条对你有用吗？');tour.append(label,actions)}
      if(tour.childElementCount)nested?.querySelector('.conversation-log')?.after(tour);
    }
    return body;
  }
  function toast(view,text){let t=view.querySelector('.lumi-feed-toast');if(!t){t=make('div','lumi-feed-toast');t.setAttribute('role','status');view.append(t)}t.textContent=text;t.hidden=false;clearTimeout(t.timer);t.timer=setTimeout(()=>t.hidden=true,3200)}
  function statusLine(view){
    let line=view.querySelector('.lumi-feed-status');if(!line){line=make('div','lumi-feed-status');view.append(line)}
    const lumi=ChatStore.get('lumi'),typing=!!lumi?.proactiveTyping;
    line.hidden=typing||!!S.cardId;line.replaceChildren();
    const unread=allCards().filter(c=>P().isUnread(c)).length,activity=make('button','lumi-feed-link',`今天查看了 3 次 · 提醒你 2 条${unread?` · ${unread} 条未读`:''}`);activity.type='button';activity.onclick=()=>GoalsPage.open({tab:'activity'});
    const goals=make('button','lumi-feed-link','目标 ›');goals.type='button';goals.onclick=()=>GoalsPage.open();
    line.append(activity,make('span','lumi-feed-dot','·'),goals);
    const label=view.querySelector('.lumi-typing-label');if(label){label.hidden=!typing||!!S.cardId;label.textContent='Lumi 正在查看你关注的变化…'}
  }
  /* ---------- 交互说明（摘自需求稿 proactive-agent/INTERACTION.html「信息流」「带看」） ---------- */
  const NOTES={
    list:['R8.4 「你的 Lumi」是一条按时间排列的卡片流，不再是一段长对话；卡片不进历史对话列表。','三类卡片：提醒（有事才报）、定时（原自动任务的结果，到点必报）、预警（预警触发后的跟进）。顶部统一写来源、所属目标与时间，未读有红点（R3.1）。','筛选：全部 / 未读 / 按目标；按目标时只看这个目标的来往，并可直接打开目标。','后台运行期间头像下方显示「Lumi 正在查看…」，不产生卡片；无事可报时状态消失，信息流里不留痕迹。','底部状态行：今天查看了几次、提醒了几条，点开进入目标页的「活动」（R3.3）。','R4.2 在下方输入框说「帮我盯着……」「每天几点给我……」会进入新建目标的对话。'],
    thread:['R8.8 / R2.4 点卡片进入它自己的线程：完整内容、依据与后续问句；追问留在这个线程里，不混进信息流。「返回动态」回到列表。','R6.6 依据列出用到的数据与时间。','后续问句点击即在本线程里发出；此后是普通的有人值守对话，不受后台只读限制。','R3.4 「有用 / 不需要」可改选；「更多」里有：不再提醒这类（按所属目标生效，可在目标页恢复）、打开所属目标、为什么收到这条、查看后台活动。','R7.2 已连接同花顺客户端且能力可用时才显示「在行情图上带我看」，点击后才开始：打开个股日 K，分步标出公告时间、近期成交和你画的支撑线；讲解栏里写明每一步对客户端做了什么（R7.10）。','R7.5 / R7.6 带看可上一步、下一步、退出（Esc）；自己操作图表或切换页面时暂停；最后询问是否保留标注，默认清除，只删 Lumi 本次加的，并回到带看前的页面与周期。','R7.7 / R7.8 锚点的时间与价格取自图表数据并在执行前校验，任一步失败即停止、清理并在本线程说明原因。']
  };
  function notes(view){
    view.querySelector(':scope>.kb-notes-toggle')?.remove();view.querySelector(':scope>.kb-notes')?.remove();
    const key=S.cardId?'thread':'list',toggle=make('button','kb-notes-toggle','交互说明');toggle.type='button';toggle.setAttribute('aria-expanded',String(S.notes));toggle.onclick=()=>{S.notes=!S.notes;notes(view)};view.append(toggle);
    if(!S.notes)return;
    const aside=make('aside','kb-notes');aside.setAttribute('aria-label','交互说明');aside.innerHTML=`<b>交互说明</b><ul>${NOTES[key].map(n=>`<li>${esc(n)}</li>`).join('')}</ul><b>状态演示</b>`;
    const seg=make('div','kb-seg kb-wrap');
    if(key==='list'){const b=make('button','','Lumi 正在查看');b.type='button';b.onclick=()=>{ChatStore.setProactiveTyping(true);setTimeout(()=>ChatStore.setProactiveTyping(false),3000)};seg.append(b)}
    else{const b=make('button',S.noClient?'is-active':'','未连接客户端');b.type='button';b.onclick=()=>{S.noClient=!S.noClient;draw(view)};seg.append(b)}
    aside.append(seg);view.append(aside);
  }
  function draw(view){
    const lumi=ChatStore.get('lumi');
    if(lumi?.pendingMessageId){const target='m-'+lumi.pendingMessageId;delete lumi.pendingMessageId;if(card(target))S.cardId=target}
    if(S.cardId&&!card(S.cardId))S.cardId=null;
    if(S.cardId)P().markRead(S.cardId);
    view.classList.toggle('personal-conversation',!S.cardId);view.classList.toggle('is-thread',!!S.cardId);
    view.querySelector('.lumi-floating-avatar').hidden=!!S.cardId;
    const old=view.querySelector('.lumi-feed-body'),scroll=!S.cardId&&old?.classList.contains('lumi-feed-thread')===false?old.querySelector('.lumi-feed-log')?.scrollTop||0:0;
    const next=S.cardId?threadBody(view,card(S.cardId)):listBody(view);
    old?old.replaceWith(next):view.append(next);
    const log=next.querySelector('.lumi-feed-log');if(log)log.scrollTop=scroll;
    statusLine(view);notes(view);
  }
  function mount(parent,{thread,embedded=false}={}){
    const view=make('section',`conversation-view personal-conversation lumi-feed${embedded?' chat-panel':''}`);view.dataset.threadId=thread.id;view.setAttribute('aria-label','你的 Lumi 动态');
    if(embedded&&navigationPages[state.nav]){view.id='page-copilot';view.append(createCopilotToolbar())}
    const label=make('span','lumi-typing-label');label.hidden=true;label.setAttribute('role','status');
    view.append(lumiAvatar(),label);parent.append(view);draw(view);return view;
  }
  function redraw(){for(const view of document.querySelectorAll('.lumi-feed'))if(view.isConnected)draw(view)}
  function openInPlace(id){S.cardId=id;S.menu=false;redraw()}
  /* 供桌面提醒、目标页等外部入口使用：打开 Lumi 并直接进入某张卡片的线程。 */
  function openCard(id){S.cardId=id;S.menu=false;openLumi();redraw()}
  function openWithGoal(goalId){S.cardId=null;S.filter='goal';S.goal=goalId;openLumi();redraw()}
  addEventListener('conversation:changed',event=>{
    const {id,reason}=event.detail;if(id!=='lumi')return;
    if(reason==='lumi-ready')setTimeout(()=>{for(const old of document.querySelectorAll('.conversation-view.personal-conversation[data-thread-id="lumi"]:not(.lumi-feed)')){const parent=old.parentElement,embedded=old.classList.contains('chat-panel'),viewId=old.id,following=old.nextSibling;old.remove();const next=mount(parent,{thread:ChatStore.get('lumi'),embedded});parent.insertBefore(next,following);if(viewId)next.id=viewId}},1600);
    if(['proactive','proactive-typing','related-targets'].includes(reason))for(const view of document.querySelectorAll('.lumi-feed'))if(view.isConnected){if(S.cardId)statusLine(view);else draw(view)}
  });
  addEventListener('proactive:changed',()=>{for(const view of document.querySelectorAll('.lumi-feed'))if(view.isConnected&&!S.cardId)draw(view)});
  return{mount,openCard,openWithGoal};
})();
