/* New-message notices share the conversation store and preserve their source message. */
(() => {
  const assets='assets/message-notices/',root=document.createElement('section');
  root.className='conversation-notices';root.setAttribute('aria-label','新消息通知');
  root.innerHTML=`<aside class="lumi-message-notice" aria-label="Lumi 新消息" hidden>
    <button type="button" class="lumi-notice-open" aria-label="查看 Lumi 新消息">
      <img class="lumi-notice-background" src="${assets}lumi-bubble.svg" alt="" aria-hidden="true">
      <img class="lumi-notice-avatar" src="${assets}lumi-avatar.png" alt="Lumi" draggable="false">
      <span class="lumi-notice-copy"><span class="lumi-notice-first"></span><span class="lumi-notice-second"></span></span>
      <span class="lumi-notice-detail">去看看</span>
    </button>
    <button type="button" class="lumi-notice-close" aria-label="关闭 Lumi 通知"><img src="${assets}close.svg" alt=""></button>
  </aside>
  <aside class="regular-message-notice" aria-label="普通对话新消息" hidden>
    <span class="regular-notice-avatar"><img class="regular-notice-avatar-background" src="${assets}chat-avatar-background.png" alt=""><img class="regular-notice-avatar-image" src="${assets}chat-avatar.png" alt="" draggable="false"></span>
    <h2>问财</h2>
    <button type="button" class="regular-notice-close" aria-label="关闭普通对话通知"><img src="${assets}close.svg" alt=""></button>
    <div class="regular-notice-copy"><p class="regular-notice-question"></p><p class="regular-notice-answer"></p></div>
    <div class="regular-notice-pagination">
      <button type="button" aria-label="上一条新消息"><img src="${assets}previous.svg" alt=""></button>
      <span class="regular-notice-page"></span>
      <button type="button" aria-label="下一条新消息"><img src="${assets}next.svg" alt=""></button>
    </div>
    <button type="button" class="regular-notice-open">去查看</button>
  </aside>
  <span class="notice-announcement" role="status" aria-live="polite" aria-atomic="true"></span>`;
  document.body.append(root);
  const lumi=root.querySelector('.lumi-message-notice'),regular=root.querySelector('.regular-message-notice'),announcement=root.querySelector('.notice-announcement');
  const previous=regular.querySelector('[aria-label="上一条新消息"]'),next=regular.querySelector('[aria-label="下一条新消息"]');
  let unread=[],regularIndex=0,dismissed={lumi:false,regular:false},scheduled=false,suppressFocus=false;
  let lumiDismissTimer=null,lumiDismissKey=null;
  function syncLumiDismissTimer(key){
    if(lumi.hidden){clearTimeout(lumiDismissTimer);lumiDismissTimer=null;lumiDismissKey=null;return}
    if(lumiDismissTimer!==null&&lumiDismissKey===key)return;
    clearTimeout(lumiDismissTimer);lumiDismissKey=key;
    lumiDismissTimer=setTimeout(()=>{lumiDismissTimer=null;lumiDismissKey=null;dismissed.lumi=true;draw()},5000);
  }
  const bound=new WeakSet(),compact=text=>text.replace(/\s+/g,' ').trim();
  const queue=kind=>{const items=unread.filter(item=>item.kind===kind);return kind==='regular'?items.reverse():items};
  const source=item=>{const thread=ChatStore.get(item.threadId);return{thread,message:thread?.messages.find(message=>message.id===item.messageId)}};
  function visible(id){
    if(document.hidden)return false;
    const view=document.querySelector(`.conversation-view[data-thread-id="${id}"]`);
    if(!view||view.closest('[inert],[aria-hidden="true"]'))return false;
    const log=view.querySelector('.conversation-log');if(log.closest('[inert],[aria-hidden="true"]'))return false;
    const rect=log.getBoundingClientRect();
    const left=Math.max(0,rect.left),right=Math.min(innerWidth,rect.right),top=Math.max(0,rect.top),bottom=Math.min(innerHeight,rect.bottom);
    if(right-left<1||bottom-top<1)return false;
    // A file/profile sidebar may cover the entire conversation in a narrow window.
    return [.25,.5,.75].some(ratio=>log.contains(document.elementFromPoint(left+(right-left)*ratio,top+(bottom-top)*.5)));
  }
  function homeButton(){return document.querySelector('.rail-button[data-control="首页"]')}
  function lumiButton(){return document.querySelector('.home-sidebar-action[data-your-lumi]')}
  function lumiAnchor(){const button=lumiButton();return state.nav==='首页'&&button?.getBoundingClientRect().width>0?button:null}
  function unreadCount(id){return unread.filter(item=>item.threadId===id).length}
  function bindLumi(){
    const button=lumiButton();if(!button)return;
    let badge=button.querySelector('.conversation-lumi-unread-badge');
    if(!badge){badge=document.createElement('span');badge.className='conversation-unread-badge conversation-lumi-unread-badge';badge.setAttribute('aria-hidden','true');badge.hidden=true;button.append(badge)}
    const count=unreadCount('lumi'),label=count>9?'9+':String(count);
    if(badge.textContent!==label)badge.textContent=label;
    if(badge.hidden!==!count)badge.hidden=!count;
    if(count)button.setAttribute('aria-description',`${count} 条未读消息，悬停或聚焦查看`);else button.removeAttribute('aria-description');
    if(!bound.has(button)){
      const reopen=()=>{if(suppressFocus){suppressFocus=false;return}if(unreadCount('lumi')){dismissed.lumi=false;draw()}};
      button.addEventListener('pointerenter',reopen);button.addEventListener('focus',reopen);bound.add(button);
    }
  }
  function bindThreadStates(){
    for(const button of document.querySelectorAll('[data-open-chat][data-thread-id],[data-history-thread]')){
      const id=button.dataset.threadId||button.dataset.historyThread,thread=ChatStore.get(id),slot=button.querySelector('em,.copilot-history-item-time');if(!slot)continue;
      let time=slot.querySelector('.conversation-thread-time'),indicator=slot.querySelector('.conversation-thread-indicator');
      if(!time){time=document.createElement('span');time.className='conversation-thread-time';time.append(...slot.childNodes);slot.append(time);indicator=document.createElement('span');indicator.className='conversation-thread-indicator';indicator.setAttribute('role','img');indicator.hidden=true;slot.append(indicator)}
      const status=thread?.pending?'generating':unreadCount(id)?'unread':'';
      if(time.hidden!==!!status)time.hidden=!!status;
      if(indicator.hidden!==!status)indicator.hidden=!status;
      if(indicator.dataset.status!==status){indicator.dataset.status=status;indicator.setAttribute('aria-label',status==='generating'?'正在生成回答':'未读消息');indicator.title=status==='generating'?'正在生成回答':'未读消息'}
    }
  }
  function bindIndicators(){bindHome();bindLumi();bindThreadStates();for(const button of [homeButton(),lumiButton()])if(button&&!observedAnchors.has(button)){observedAnchors.add(button);anchorObserver.observe(button)}}
  function bindHome(){
    const home=homeButton();if(!home)return;
    if(!home.querySelector('.conversation-unread-badge')){const badge=document.createElement('span');badge.className='conversation-unread-badge';badge.setAttribute('aria-hidden','true');badge.hidden=true;home.append(badge)}
    if(!bound.has(home)){
      const reopen=()=>{if(suppressFocus){suppressFocus=false;return}if(unread.length){dismissed={lumi:false,regular:false};draw()}};
      home.addEventListener('pointerenter',reopen);home.addEventListener('focus',reopen);bound.add(home);
    }
    const badge=home.querySelector('.conversation-unread-badge'),count=unread.length,label=count>9?'9+':String(count);
    if(badge.textContent!==label)badge.textContent=label;
    if(badge.hidden!==!count)badge.hidden=!count;
    if(count)home.setAttribute('aria-description',`${count} 条未读消息，悬停或聚焦查看`);else home.removeAttribute('aria-description');
  }
  function position(){
    const home=homeButton();if(!home)return;
    const rect=home.getBoundingClientRect(),anchor=lumiAnchor(),scale=Math.min(1,(innerWidth-20)/349),stacked=!anchor&&!lumi.hidden;
    const height=((lumi.hidden||anchor?0:66)+(regular.hidden?0:153)+(stacked&&!regular.hidden?10:0))*scale;
    const railTop=Math.max(8,Math.min(innerHeight-height-12,rect.top+(rect.height-66)/2));
    const place=(panel,reference,top,width,height,offset=0)=>{
      const left=Math.max(8,Math.min(reference.right+10+offset,innerWidth-width*scale-12));
      top=Math.max(8,Math.min(innerHeight-height*scale-12,top));
      panel.style.transform=scale<1?`scale(${scale})`:'';panel.style.left=left+'px';panel.style.top=top+'px';
      return{left,right:left+width*scale,top,bottom:top+height*scale};
    };
    const target=(anchor||home).getBoundingClientRect();
    const lumiRect=place(lumi,target,anchor?target.top+(target.height-66*scale)/2:railTop,349,66);
    const regularRect=place(regular,rect,railTop+(stacked?76*scale:0),338,153,11*scale);
    if(anchor&&!lumi.hidden&&!regular.hidden&&Math.min(lumiRect.right,regularRect.right)>Math.max(lumiRect.left,regularRect.left)&&Math.min(lumiRect.bottom,regularRect.bottom)>Math.max(lumiRect.top,regularRect.top))place(regular,rect,lumiRect.bottom+10*scale,338,153,11*scale);
    lumi.dataset.anchor=anchor?'lumi':'home';
  }
  function lumiCopy(text){
    const copy=lumi.querySelector('.lumi-notice-copy'),first=lumi.querySelector('.lumi-notice-first'),canvas=document.createElement('canvas'),context=canvas.getContext('2d');context.font=getComputedStyle(copy).font;
    const width=parseFloat(getComputedStyle(first).width);
    const chars=Array.from(compact(text));let split=0,line='';
    while(split<chars.length&&context.measureText(line+chars[split]).width<=width)line+=chars[split++];
    first.textContent=line;
    lumi.querySelector('.lumi-notice-second').textContent=chars.slice(split).join('');
  }
  function draw(){
    bindIndicators();
    const lumiItems=queue('lumi'),regularItems=queue('regular');
    lumi.hidden=!lumiItems.length||dismissed.lumi;regular.hidden=!regularItems.length||dismissed.regular;
    if(lumiItems.length){
      const {message}=source(lumiItems.at(-1));lumiCopy(message.text);
      const avatar=lumi.querySelector('.lumi-notice-avatar');avatar.src=LumiProfile.avatar==='assets/lumi-pink.png'?assets+'lumi-avatar.png':LumiProfile.avatar;avatar.alt=LumiProfile.name;
    }
    if(regularItems.length){
      regularIndex=Math.min(regularIndex,regularItems.length-1);
      const {thread,message}=source(regularItems[regularIndex]),index=thread.messages.indexOf(message),question=thread.messages.slice(0,index).findLast(item=>item.role==='user');
      const questionCopy=regular.querySelector('.regular-notice-question'),answerCopy=regular.querySelector('.regular-notice-answer');
      questionCopy.textContent=`${thread.title} 本次问题：${compact(question?.text||thread.title)}`;answerCopy.textContent=compact(message.text);
      questionCopy.title=questionCopy.textContent;answerCopy.title=answerCopy.textContent;
      regular.querySelector('.regular-notice-page').textContent=`${regularIndex+1}/${regularItems.length}`;
      previous.disabled=regularIndex===0;next.disabled=regularIndex===regularItems.length-1;
    }
    root.hidden=lumi.hidden&&regular.hidden;position();syncLumiDismissTimer(lumiItems.at(-1)?.key);
  }
  function sync(){
    scheduled=false;
    const remaining=unread.filter(item=>{const {thread,message}=source(item);return thread&&message&&!visible(item.threadId)});
    if(remaining.length!==unread.length){unread=remaining;draw()}else{bindIndicators();position()}
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync)}}
  function receive(event){
    const {id,reason,messageId}=event.detail;
    if(!['reply','proactive'].includes(reason)||!messageId){if(reason!=='stream')bindThreadStates();return}
    const thread=ChatStore.get(id),message=thread?.messages.find(item=>item.id===messageId);
    if(!thread||message?.role!=='assistant'||visible(id)){bindThreadStates();schedule();return}
    const kind=thread.kind==='personal'?'lumi':'regular',key=`${id}:${messageId}`;
    if(!unread.some(item=>item.key===key))unread.push({key,threadId:id,messageId,kind});
    dismissed[kind]=false;if(kind==='regular')regularIndex=0;
    draw();announcement.textContent=kind==='lumi'?`${LumiProfile.name} 有新消息`:`${thread.title} 有新回答`;
  }
  function open(item){
    if(!item)return;const {thread,message}=source(item);if(!thread||!message){sync();return}
    thread.pendingMessageId=message.id;
    if(thread.kind==='personal')openLumi();else openConversation(thread.id);
    // Make the target readable when a saved sidebar occupies the narrow conversation area.
    if(!visible(thread.id)&&HomeLayout.opened())document.querySelector('.home-right-toggle')?.click();
    schedule();
  }
  function dismiss(kind){
    dismissed[kind]=true;draw();suppressFocus=true;(kind==='lumi'?lumiAnchor()||homeButton():homeButton())?.focus({preventScroll:true});
  }
  lumi.querySelector('.lumi-notice-open').onclick=()=>open(queue('lumi').at(-1));
  lumi.querySelector('.lumi-notice-close').onclick=()=>dismiss('lumi');
  regular.querySelector('.regular-notice-open').onclick=()=>open(queue('regular')[regularIndex]);
  regular.querySelector('.regular-notice-close').onclick=()=>dismiss('regular');
  previous.onclick=()=>{regularIndex=Math.max(0,regularIndex-1);draw()};
  next.onclick=()=>{regularIndex=Math.min(queue('regular').length-1,regularIndex+1);draw()};
  root.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismissed={lumi:true,regular:true};draw();suppressFocus=true;(lumiAnchor()||homeButton())?.focus({preventScroll:true})}};
  const observedAnchors=new WeakSet(),anchorObserver=new ResizeObserver(schedule);
  new MutationObserver(schedule).observe(document.getElementById('stage'),{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','inert','aria-hidden']});
  addEventListener('conversation:changed',receive);addEventListener('resize',schedule);addEventListener('lumi:profile-changed',draw);document.addEventListener('visibilitychange',schedule);
  window.ConversationNotifications={get count(){return unread.length},unreadCount};
  draw();
})();
