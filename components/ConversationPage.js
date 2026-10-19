/* Shared message renderer, with separate regular and personal conversation layouts. */
(() => {
  const paths={plus:'M12 5v14M5 12h14',send:'m5 12 7-7 7 7M12 5v14',mic:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0zM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8',copy:'M9 9h11v11H9zM15 5V3H3v12h2',up:'M7 10v11H3V10zM7 11l5-8h2v6h6l1 2-2 10H7',down:'M7 14V3H3v11zM7 13l5 8h2v-6h6l1-2-2-10H7',audio:'m3 9 5 0 5-4v14l-5-4H3zM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14',refresh:'M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5',more:'M4 12h.01M12 12h.01M20 12h.01',crop:'M5 3v16h16M3 5h16v16M16 3l5 5M3 16l5 5',new:'M18 8V4H4v16l4-4h10v-4M16 6h6M19 3v6',expand:'M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5',close:'M6 6l12 12M18 6 6 18',work:'M3 4h18v14H3zM8 22h8M12 18v4',clock:'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.more}"/></svg>`;
  const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n};
  const isLumiTyping=thread=>thread.kind==='personal'&&(thread.pending?thread.pendingPhase==='waiting'&&!thread.pendingAnswer?.text&&!thread.pendingAnswer?.reasoning:!!(thread.proactiveTyping||thread.introTyping));
  function typingBubble(){const bubble=el('div','conversation-typing');bubble.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)bubble.append(el('span'));return bubble;}
  function typingLabel(){const label=el('span','lumi-typing-label','正在输入...');label.hidden=true;label.setAttribute('role','status');return label;}
  function button(label,name,action){const b=el('button','conversation-icon-button');b.type='button';b.setAttribute('aria-label',label);b.title=label;b.innerHTML=icon(name);b.onclick=action;return b;}
  function paragraphs(text,parent){for(const textPart of text.split('\n\n'))parent.append(el('p',null,textPart));}
  function thinkingView(message){
    const details=el('details','conversation-thinking');details.setAttribute('aria-label','思考过程');
    const summary=el('summary'),spinner=el('span','conversation-thinking-spinner');spinner.setAttribute('aria-hidden','true');
    summary.append(spinner,el('span','conversation-thinking-label'));details.append(summary,el('p','conversation-thinking-copy'));
    summary.onclick=event=>{event.preventDefault();message.thinkingOpen=!details.open;details.open=message.thinkingOpen};
    updateThinking(details,message);details.ontoggle=()=>message.thinkingOpen=details.open;return details;
  }
  function updateThinking(details,message){
    details.classList.toggle('is-thinking',!!message.thinking);
    details.querySelector('.conversation-thinking-label').textContent=message.thinking?'正在思考':'思考完成';
    details.querySelector('.conversation-thinking-copy').textContent=message.reasoning;
    const open=message.thinkingOpen??!!message.thinking;if(details.open!==open)details.open=open;
  }
  function updateStreaming(item,message){
    item.classList.toggle('conversation-streaming',!!message.streaming);
    let thinking=item.querySelector('.conversation-thinking');
    if(message.reasoning){if(!thinking){thinking=thinkingView(message);item.prepend(thinking)}else updateThinking(thinking,message)}
    let activity=item.querySelector('.codex-activity');if(message.activities?.length){const next=CodexUI.activityView(message);if(activity){next.open=activity.open;activity.replaceWith(next)}else item.prepend(next)}
    const content=item.querySelector('.conversation-message-content');content.hidden=!message.text;
    const parts=message.text.split('\n\n');
    parts.forEach((part,index)=>{let paragraph=content.children[index];if(!paragraph){paragraph=el('p');content.append(paragraph)}if(paragraph.textContent!==part)paragraph.textContent=part});
    while(content.children.length>parts.length)content.lastChild.remove();
  }
  function inlineAction(action){
    const control=el('button','conversation-inline-action');control.type='button';control.setAttribute('aria-label',action.label);
    control.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M6 19v-1a6 6 0 0 1 12 0v1"/></svg>';
    control.append(el('span',null,action.label));const arrow=el('span','conversation-inline-action-arrow','›');arrow.setAttribute('aria-hidden','true');control.append(arrow);
    if(action.type==='lumi-profile'){
      control.setAttribute('aria-controls','home-right-sidebar');control.onclick=()=>HomeLayout.openProfile();
    }else control.onclick=()=>{const input=control.closest('.conversation-view').querySelector('.conversation-input');input.value=[input.value.trim(),action.prompt].filter(Boolean).join('\n');input.oninput();input.focus({preventScroll:true})};
    return control;
  }
  function tableView(data){const wrap=el('div','conversation-table-wrap'),table=el('table','conversation-table'),head=document.createElement('thead'),row=document.createElement('tr');data.headers.forEach(h=>{const cell=el('th',null,h);cell.scope='col';row.append(cell)});head.append(row);table.append(head);const body=document.createElement('tbody');data.rows.forEach(values=>{const row=document.createElement('tr');values.forEach(v=>row.append(el('td',null,v)));body.append(row)});table.append(body);wrap.append(table);return wrap;}
  async function copyText(text){if(window.NativeBridge?.available){await NativeBridge.copyText(text);return}try{await navigator.clipboard.writeText(text)}catch{const input=el('textarea');input.value=text;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();document.execCommand('copy');input.remove()}}
  function replyActions(message,thread){
    const row=el('div','conversation-reply-actions');
    const copy=button('复制回答','copy',async()=>{await copyText(message.text+(message.after?'\n\n'+message.after:''));copy.classList.add('is-selected');copy.setAttribute('aria-pressed','true');copy.title='已复制';setTimeout(()=>{if(copy.isConnected){copy.classList.remove('is-selected');copy.setAttribute('aria-pressed','false');copy.title='复制回答'}},1200)});copy.setAttribute('aria-pressed','false');row.append(copy);
    const audio=button('朗读回答','audio',()=>{const active=audio.getAttribute('aria-pressed')!=='true';audio.setAttribute('aria-pressed',String(active));audio.classList.toggle('is-selected',active);if('speechSynthesis' in window){speechSynthesis.cancel();if(active){const utterance=new SpeechSynthesisUtterance(message.text);utterance.lang='zh-CN';utterance.onend=utterance.onerror=()=>{audio.setAttribute('aria-pressed','false');audio.classList.remove('is-selected')};speechSynthesis.speak(utterance)}}});audio.setAttribute('aria-pressed','false');row.append(audio);
    for(const [vote,label] of [['up','赞同回答'],['down','不赞同回答']]){const b=button(label,vote,()=>{message.vote=message.vote===vote?null:vote;for(const control of row.querySelectorAll('[data-vote]')){const selected=message.vote===control.dataset.vote;control.setAttribute('aria-pressed',String(selected));control.classList.toggle('is-selected',selected)}});b.dataset.vote=vote;b.setAttribute('aria-pressed',String(message.vote===vote));b.classList.toggle('is-selected',message.vote===vote);row.append(b)}
    const repeat=button('重新生成回答','refresh',()=>ChatStore.regenerate(thread.id,message.id));repeat.disabled=thread.pending;row.append(repeat);
    const more=button('更多回答操作','more',()=>{menu.hidden=!menu.hidden;more.setAttribute('aria-expanded',String(!menu.hidden))});more.setAttribute('aria-expanded','false');row.append(more);
    const menu=el('div','conversation-reply-menu');menu.hidden=true;const copyAll=el('button',null,'复制完整回答');copyAll.type='button';copyAll.onclick=async()=>{menu.hidden=true;more.setAttribute('aria-expanded','false');const parts=[message.text];if(message.table)parts.push([message.table.headers,...message.table.rows].map(r=>r.join('\t')).join('\n'));if(message.after)parts.push(message.after);await copyText(parts.join('\n\n'));copy.classList.add('is-selected');copy.setAttribute('aria-pressed','true');setTimeout(()=>{copy.classList.remove('is-selected');copy.setAttribute('aria-pressed','false')},1200)};menu.append(copyAll);const saveKb=el('button',null,'保存到知识库');saveKb.type='button';saveKb.onclick=()=>{menu.hidden=true;more.setAttribute('aria-expanded','false');KnowledgeChat.saveAnswer(message,thread)};menu.append(saveKb);row.append(menu);
    row.append(el('span','conversation-reply-time',`${message.day} ${message.time}`));if(message.elapsed){const time=el('span','conversation-elapsed');time.innerHTML=icon('clock');time.append(document.createTextNode(message.elapsed));row.append(time)}return row;
  }
  function messageView(message,thread,showStatus=false){
    const personal=thread.kind==='personal',item=el('article',`conversation-message ${message.role}`);item.dataset.messageId=message.id;item.setAttribute('aria-label',message.role==='user'?'你的消息':personal?'Lumi 的消息':'AI 的回答');
    item.classList.toggle('conversation-streaming',!!message.streaming);
    if(message.reasoning)item.append(thinkingView(message));if(message.activities?.length)item.append(CodexUI.activityView(message));
    if(message.steps){const details=el('details','conversation-steps');details.open=!!message.stepsOpen;details.append(el('summary',null,message.steps.title),el('p',null,message.steps.text));details.ontoggle=()=>message.stepsOpen=details.open;item.append(details)}
    const content=el('div','conversation-message-content');content.hidden=!!message.streaming&&!message.text;if(message.quote)content.append(LumiReply.quotedMessage(message.quote));paragraphs(message.text,content);if(message.table)content.append(tableView(message.table));if(message.after)paragraphs(message.after,content);
    if(personal&&message.role==='assistant'&&!message.streaming&&message.relatedTargets?.length){const related=LumiRelatedTargets.render(message,thread);if(related)content.append(related);}
    if(message.report||message.document)content.append(WorkbenchPage.artifactCard(WorkspaceTabs.fileFor(thread,message),thread));
    if(message.attachments?.length){const files=el('div','codex-attachments');for(const file of message.attachments)files.append(el('span','codex-attachment',file.name));content.prepend(files)}
    if(message.files?.length)for(const file of message.files)content.append(WorkbenchPage.artifactCard(file,thread));
    if(message.task){const task=el('div','conversation-task');task.append(el('span',null,message.task.title),el('span','conversation-task-status',message.task.status));content.append(task)}
    if(message.backtest&&window.BacktestChat)content.append(BacktestChat.card(message,thread));
    if(message.goal&&window.GoalChat)content.append(GoalChat.card(message,thread));
    if(message.kb&&window.KnowledgeChat)content.append(KnowledgeChat.card(message,thread));
    item.append(personal&&message.role==='assistant'&&!message.streaming&&!message.interrupted?LumiReply.messageRow(message,thread,content):content);if(message.action)item.append(inlineAction(message.action));
    if(personal&&showStatus&&message.status)item.append(el('div','conversation-message-status',message.status==='已读'?`已读 ${message.receiptTime||message.time}`:message.status));
    if(!personal&&message.role==='assistant'&&!message.streaming&&!message.interrupted)item.append(replyActions(message,thread));return item;
  }
  function lumiAvatar(){
    const control=el('button','lumi-floating-avatar');control.type='button';control.setAttribute('aria-label','打开 Lumi 个人资料');control.title='Lumi个人资料';control.setAttribute('aria-controls','home-right-sidebar');
    const avatar=el('img');avatar.dataset.lumiAvatar='';avatar.src=LumiProfile.avatar;avatar.alt=LumiProfile.name;avatar.draggable=false;
    control.append(avatar);LumiAvatarMotion.attach(control,avatar);control.onclick=()=>HomeLayout.openProfile();return control;
  }
  function composer(thread,options={}){return ChatComposer.create(thread,options);}
  function header(thread,embedded){
    const head=el('header','conversation-header'),title=el('div','conversation-heading');
    title.setAttribute('aria-label','当前对话标题');title.title=thread.title;title.append(el('span',null,thread.title));head.append(title);return head;
  }
  function restoreScroll(view,thread){
    const log=view.querySelector('.conversation-log'),top=thread.scrollTop,intent=thread.pendingScroll,messageId=thread.pendingMessageId;
    const revision=view.scrollRevision=(view.scrollRevision||0)+1;thread.pendingScroll=null;
    const apply=()=>{
      if(!view.isConnected||!view.getClientRects().length)return;
      const target=messageId&&[...log.querySelectorAll('.conversation-message')].find(item=>item.dataset.messageId===messageId),last=log.querySelector('.conversation-message:last-of-type');
      if(target){log.scrollTop+=target.getBoundingClientRect().top-log.getBoundingClientRect().top-24;target.tabIndex=-1;target.focus({preventScroll:true});delete thread.pendingMessageId}
      else if(intent==='bottom'||top===null&&thread.kind==='personal')log.scrollTop=log.scrollHeight;
      else if(intent==='answer'&&last)log.scrollTop=Math.max(0,last.offsetTop-24);
      else log.scrollTop=top??0;
      thread.scrollTop=log.scrollTop;
    };
    apply();const appliedTop=log.scrollTop;
    requestAnimationFrame(()=>{
      if(view.scrollRevision!==revision||Math.abs(log.scrollTop-appliedTop)>1)return;
      if(!messageId)apply();
    });
  }
  function timeDivider(message,previous,today,yesterday){
    if(previous&&message.date===previous.date&&Number.isFinite(message.timestamp)&&Number.isFinite(previous.timestamp)&&message.timestamp-previous.timestamp<=180000)return null;
    const day=message.date===today.date?'今天':message.date===yesterday.date?'昨天':message.date&&message.date.slice(0,4)!==today.date.slice(0,4)?`${message.date.slice(0,4)}年${message.day}`:message.day;
    const divider=el('time','conversation-time-divider',`${day} ${message.time}`);
    if(Number.isFinite(message.timestamp))divider.dateTime=new Date(message.timestamp).toISOString();return divider;
  }
  function fillLog(view,thread){
    const log=view.querySelector('.conversation-log'),inner=el('div','conversation-log-inner'),latestUserMessage=thread.messages.findLast(message=>message.role==='user'),today=ChatStore.clock(),yesterday=ChatStore.clock(new Date(Date.now()-86400000));
    const preview=thread.pendingAnswer,hasPreview=preview&&(preview.text||preview.reasoning);
    thread.messages.forEach((message,index)=>{
      if(thread.kind==='personal'){const divider=timeDivider(message,thread.messages[index-1],today,yesterday);if(divider)inner.append(divider)}
      inner.append(messageView(hasPreview&&thread.pendingTargetId===message.id?preview:message,thread,message===latestUserMessage));
    });
    if(hasPreview&&!thread.pendingTargetId)inner.append(messageView(preview,thread));
    if(thread.failedAnswer)inner.append(messageView(thread.failedAnswer,thread));
    const typing=isLumiTyping(thread);if(typing)inner.append(typingBubble());
    const label=view.querySelector('.lumi-typing-label');if(label)label.hidden=!typing;
    if(thread.error){const error=el('div','conversation-error');error.setAttribute('role','alert');error.append(el('p',null,thread.error.message));const retry=el('button',null,'重试');retry.type='button';retry.onclick=()=>ChatStore.retry(thread.id);error.append(retry);inner.append(error)}log.replaceChildren(inner);restoreScroll(view,thread);
  }
  function mount(parent,{id,embedded=false}={}){
    const thread=ChatStore.get(id);if(!thread)return;if(thread.kind==='personal'&&thread.onboarding?.phase==='welcome')return LumiWelcome.mount(parent,{thread,embedded});
    /* 主动服务：Lumi 介绍完成后，「你的 Lumi」呈现为推送信息流（LumiFeed）。 */
    if(thread.kind==='personal'&&thread.onboarding?.phase==='complete'&&window.LumiFeed)return LumiFeed.mount(parent,{thread,embedded});const personal=thread.kind==='personal',view=el('section',`conversation-view ${personal?'personal-conversation':'regular-conversation'}${embedded?' chat-panel':''}`);view.dataset.threadId=id;view.setAttribute('aria-label',personal?'你的 Lumi 对话':'对话流');if(embedded&&navigationPages[state.nav]){view.id='page-copilot';view.append(createCopilotToolbar())}else if(!personal&&state.nav!=='首页')view.append(header(thread,embedded));if(personal)view.append(lumiAvatar(),typingLabel());const log=el('div','conversation-log');log.tabIndex=0;log.setAttribute('aria-label','对话记录');log.onscroll=()=>thread.scrollTop=log.scrollTop;view.append(log);const bottom=el('div','conversation-bottom');bottom.append(composer(thread));bottom.append(el('p','conversation-disclaimer','AI生成内容仅供参考，不构成投资建议'));view.append(bottom);parent.append(view);fillLog(view,thread);if(personal)ChatStore.resumeLumiIntroduction();return view;
  }
  function refresh(id,{proactive=false,stream=false}={}){
    const view=document.querySelector(`.conversation-view[data-thread-id="${id}"]`),thread=ChatStore.get(id);
    if(!view||!thread||!view.getClientRects().length)return;
    if(view.classList.contains('lumi-feed'))return;
    if(view.classList.contains('lumi-welcome')){
      if(thread.onboarding?.phase!=='welcome'){
        const parent=view.parentElement,embedded=view.classList.contains('chat-panel'),viewId=view.id,following=view.nextSibling;
        view.remove();const next=mount(parent,{id,embedded});parent.insertBefore(next,following);if(viewId)next.id=viewId;
        next.querySelector('.conversation-input')?.focus({preventScroll:true});
      }
      return;
    }
    const log=view.querySelector('.conversation-log'),personal=thread.kind==='personal',following=log.scrollHeight-log.scrollTop-log.clientHeight<=(personal?2:80);
    const explicitBottom=thread.pendingScroll==='bottom'&&!proactive&&!stream;thread.scrollTop=log.scrollTop;
    if(personal&&!explicitBottom&&!thread.pendingMessageId)thread.pendingScroll=following?'bottom':null;
    if(stream&&thread.pendingAnswer){
      const preview=thread.pendingAnswer,item=[...log.querySelectorAll('.conversation-message')].find(item=>item.dataset.messageId===preview.id);
      if(item&&item.classList.contains('conversation-streaming')){thread.pendingScroll=null;updateStreaming(item,preview)}
      else {thread.pendingScroll=following?'bottom':null;fillLog(view,thread)}
      if(following){log.scrollTop=log.scrollHeight;thread.scrollTop=log.scrollTop}
    }else{
      if(proactive&&!following)thread.pendingScroll=null;fillLog(view,thread);
    }
    const input=view.querySelector('.conversation-input');
    if(thread.clearSubmittedDraft){input.value='';thread.clearSubmittedDraft=false}
    if(thread.restoreFailedDraft){if(!input.value)input.value=thread.draft;thread.restoreFailedDraft=false}
    if(thread.kind==='personal')LumiReply.refresh(view,thread);
    view.querySelector('.chat-composer')?.refreshComposer?.();
    const send=view.querySelector('.conversation-send,[data-lumi-send]');if(send)send.disabled=!thread.pending&&!input.value.trim();
  }
  function save(){for(const view of document.querySelectorAll('.conversation-view')){const thread=ChatStore.get(view.dataset.threadId);if(thread&&view.getClientRects().length)thread.scrollTop=view.querySelector('.conversation-log').scrollTop}}
  window.addEventListener('conversation:changed',e=>refresh(e.detail.id,{proactive:e.detail.reason.startsWith('proactive'),stream:e.detail.reason==='stream'}));window.ConversationPage={mount,refresh,save,composer};
})();
