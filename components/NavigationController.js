/* Persistent navigation and the reused history records. */
window.NavigationController=class {
  constructor() {
    this.rail=document.createElement('nav');
    this.rail.className='navigation-rail';
    this.rail.id='main-navigation';
    this.rail.setAttribute('aria-label','主导航');
    this.rail.innerHTML='<div class="rail-main"></div><div class="rail-bottom"></div>';
    for(const label of ['首页','行情','工作台','资讯','交易','商城','目标','反馈','个人中心']) {
      const button=document.createElement('button');
      button.type='button';
      button.className='rail-button';
      button.dataset.control=label;
      button.setAttribute('aria-label',label);
      button.setAttribute('aria-pressed','false');
      const icon=label==='知识库'?'项目-收起':label;
      button.innerHTML=label==='首页'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house preview-icon" aria-hidden="true" focusable="false"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'
        : `<img src="assets/navigation/${icon}.svg" alt="" draggable="false">`;
      button.onclick=e=>{
        e.stopPropagation();this.hideTooltip();
        if(label==='个人中心') {
          state.menu=state.menu==='account'?null:'account';
          state.context=null;renderOverlays();
        } else if(label!=='交易') navigate(label);
      };
      button.onmouseenter=()=>this.showTooltip(button,label);
      button.onmouseleave=()=>this.hideTooltip();
      button.onfocus=()=>this.showTooltip(button,label);
      button.onblur=()=>this.hideTooltip();
      $(['反馈','个人中心'].includes(label)?'.rail-bottom':'.rail-main',this.rail).append(button);
    }
    this.moreMenu=new NavigationMoreMenu($('.rail-main',this.rail),{beforeOpen:()=>{this.hideTooltip();this.closeLocalMenus()},onSelect:label=>navigate(label),onPinsChanged:()=>this.syncRailSelection()});
    for(const [label,button]of this.moreMenu.shortcuts){
      button.onmouseenter=()=>this.showTooltip(button,label);
      button.onmouseleave=()=>this.hideTooltip();
      button.onfocus=()=>this.showTooltip(button,label);
      button.onblur=()=>this.hideTooltip();
    }
    const separator=document.createElement('div');
    separator.className='rail-separator';
    separator.setAttribute('role','separator');
    separator.setAttribute('aria-orientation','horizontal');
    $('.rail-main',this.rail).append(separator,$('[data-control="交易"]',this.rail));
    this.pane=document.createElement('section');
    this.pane.className='home-sidebar';
    this.pane.id='home-history-sidebar';
    this.pane.setAttribute('aria-label','首页侧栏');
    this.pane.innerHTML=`<div class="home-sidebar-actions">
      <button type="button" class="home-sidebar-action" data-new-chat aria-label="新对话" aria-pressed="false"><img src="assets/navigation/新对话.svg" alt=""><span>新对话</span></button>
      <button type="button" class="home-sidebar-action lumi-entry" data-your-lumi aria-label="你的 Lumi" aria-pressed="false"><img src="${LumiProfile.avatar}" alt="Lumi"><span>你的 Lumi</span></button>
      <button type="button" class="home-sidebar-action" data-open-artifacts aria-label="对话产物" aria-pressed="false"><img src="assets/navigation/文件.svg" alt=""><span>对话产物</span></button>
    </div><div class="home-sidebar-search-area">
      <div class="home-sidebar-history-heading"><h2>全部历史</h2><button type="button" class="home-sidebar-search-toggle" aria-label="搜索历史" aria-expanded="false" aria-controls="home-history-search" title="搜索历史"><img src="assets/pages/377a9.svg" alt=""></button></div>
      <div class="home-sidebar-search" id="home-history-search" hidden><img src="assets/pages/377a9.svg" alt=""><input type="search" placeholder="搜索" aria-label="搜索对话" autocomplete="off"><button type="button" class="home-sidebar-search-close" aria-label="收起历史搜索" title="收起搜索">×</button></div>
    </div><div class="home-sidebar-search-results" aria-label="搜索结果" hidden><div class="home-sidebar-search-list"></div><p class="home-sidebar-search-empty" role="status" hidden>未找到结果</p></div><div class="conversation-scroll">${NavigationHistoryTemplate()}</div>`;
    this.pane.onclick=e=>this.handlePaneClick(e);
    for(const button of $$('[data-sidebar-section-toggle]',this.pane))button.setAttribute('aria-label',`折叠或展开${$('span',button).textContent}分组`);
    this.pane.oncontextmenu=e=>{
      const row=e.target.closest('.sidebar-chat-row');
      if(!row)return;
      e.preventDefault();this.openRecordMenu(row,e.clientX,e.clientY);
    };
    this.tooltip=document.createElement('div');
    this.tooltip.className='navigation-tooltip';
    this.tooltip.id='navigation-tooltip';
    this.tooltip.setAttribute('role','tooltip');
    this.tooltip.hidden=true;
    stage.append(this.tooltip);
    document.addEventListener('click',e=>{if(!this.pane.contains(e.target))this.closeLocalMenus()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){this.closeLocalMenus();this.hideTooltip()}});
    this.setupRail();
    this.bindSearch();
    this.setActionLabels();
    if(window.NativeBridge?.available)for(const thread of ChatStore.threads.values())if(thread.kind==='regular'&&thread.messages.length&&!this.pane.querySelector(`[data-thread-id="${thread.id}"]`))this.addThread(thread);
  }
  render() {
    this.moreMenu.close();
    this.marketMenu.close();
    this.syncRailLayout();
    this.hideTooltip();
    const visible=HomeLayout.usesConversationLayout()&&HomeLayout.leftSidebarOpened();
    stage.classList.toggle('has-home-sidebar',visible);
    sidebar.replaceChildren(this.rail,...(visible?[this.pane]:[]));
    // CSS controls the width, including the compact arrangement at small sizes.
    sidebar.style.width='';surface.style.left='';
    this.syncRailSelection();
    this.syncSelection();
    this.searchRecords();
  }
  syncRailSelection() {
    for(const button of $$('.rail-button',this.rail)) {
      const active=button.dataset.control===state.nav||(button.dataset.control==='个人中心'&&state.nav==='系统设置')||(button===this.moreMenu.button&&!this.moreMenu.pinned.has(state.nav)&&NavigationMoreMenu.items.some(([label])=>label===state.nav));
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    }
    this.moreMenu.setCurrent(state.nav);
    this.marketMenu?.setCurrent(state.nav==='行情'?state.selectedPage:null);
  }
  setupRail() {
    const main=$('.rail-main',this.rail),market=$('[data-control="行情"]',this.rail);
    this.marketMenu=new NavigationMoreMenu(main,{items:MarketNavigation.categories.filter(label=>!['交易','我的'].includes(label)).map(label=>[label,null]),pinned:['自选','个股'],id:'navigation-market-menu',beforeOpen:()=>{this.moreMenu.close();this.hideTooltip()},onSelect:label=>selectMarketCategory(label),onPinsChanged:()=>this.syncRailSelection()});
    this.marketMenu.menu.setAttribute('aria-label','行情导航');
    this.marketMenu.menu.classList.add('navigation-market-menu');
    this.marketMenu.button.className='rail-market-more';this.marketMenu.button.removeAttribute('data-control');
    this.marketMenu.button.setAttribute('aria-label','更多行情页面');this.marketMenu.button.innerHTML='<span>更多</span><span aria-hidden="true">›</span>';
    this.marketMenu.strip.className='rail-market-pins';
    for(const [label,button]of this.marketMenu.shortcuts){button.className='rail-market-page';button.textContent=label}
    this.marketChildren=document.createElement('div');this.marketChildren.className='rail-market-children';this.marketChildren.append(this.marketMenu.strip,this.marketMenu.button);market.after(this.marketChildren);
    this.marketMenu.alternateAnchor=market;this.marketMenu.anchor=()=>state.railExpanded?this.marketMenu.button:market;
    market.setAttribute('aria-haspopup','menu');market.setAttribute('aria-controls',this.marketMenu.menu.id);
    market.onmouseenter=market.onfocus=()=>{if(!state.railExpanded&&!this.marketMenu.skipFocusOpen)this.marketMenu.open()};
    market.onmouseleave=market.onblur=()=>this.marketMenu.scheduleClose();
    market.onkeydown=e=>{if(!state.railExpanded&&['ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();this.marketMenu.open();this.marketMenu.items()[0].focus()}};
    for(const button of [...$$('.rail-button',this.rail),...this.moreMenu.shortcuts.values()]){
      if(button.querySelector('.rail-label'))continue;
      const label=document.createElement('span');label.className='rail-label';label.textContent=button.dataset.control;button.append(label);
    }
    this.railToggle=document.createElement('button');this.railToggle.type='button';this.railToggle.className='rail-layout-toggle';this.railToggle.setAttribute('aria-controls',this.rail.id);
    this.railToggle.onclick=()=>{state.railExpanded=!state.railExpanded;render({preservePage:true});this.railToggle.focus({preventScroll:true})};
    const before=this.moreMenu.beforeOpen;this.moreMenu.beforeOpen=()=>{this.marketMenu.close();before?.()};
  }
  syncRailLayout() {
    document.documentElement.style.setProperty('--rail-width',state.railExpanded?'176px':'72px');
    this.rail.classList.toggle('is-expanded',state.railExpanded);this.marketChildren.hidden=!state.railExpanded;
    this.railToggle.setAttribute('aria-label',state.railExpanded?'收起主导航':'展开主导航');this.railToggle.setAttribute('aria-expanded',String(state.railExpanded));
    this.railToggle.title=state.railExpanded?'收起主导航':'展开主导航';
    const glyph=state.railExpanded?'panel-left-close':'panel-left-open',chevron=state.railExpanded?'m16 15-3-3 3-3':'m14 9 3 3-3 3';
    this.railToggle.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${glyph}" aria-hidden="true" focusable="false"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="${chevron}"/></svg>`;
  }
  bindSearch() {
    const input=$('.home-sidebar-search input',this.pane),close=$('.home-sidebar-search-close',this.pane);
    const area=$('.home-sidebar-search-area',this.pane),heading=$('.home-sidebar-history-heading',area),search=$('.home-sidebar-search',area),toggle=$('.home-sidebar-search-toggle',area);
    const setOpen=(opened,focus=true)=>{heading.hidden=opened;search.hidden=!opened;toggle.setAttribute('aria-expanded',String(opened));if(focus)(opened?input:toggle).focus({preventScroll:true})};
    const reset=()=>{input.value='';this.searchRecords();input.focus()};
    toggle.onclick=e=>{e.stopPropagation();setOpen(true)};
    input.oninput=()=>this.searchRecords();
    input.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(input.value)reset();else setOpen(false)}};
    close.onclick=e=>{e.stopPropagation();input.value='';this.searchRecords();setOpen(false)};
    area.onfocusout=e=>{if(!area.contains(e.relatedTarget)&&!input.value)setOpen(false,false)};
    document.addEventListener('pointerdown',e=>{if(!area.contains(e.target)&&!input.value)setOpen(false,false)});
  }
  searchRecords() {
    const input=$('.home-sidebar-search input',this.pane),term=input.value.trim().toLowerCase();
    const results=$('.home-sidebar-search-results',this.pane),list=$('.home-sidebar-search-list',results),empty=$('.home-sidebar-search-empty',results);
    $('.conversation-scroll',this.pane).hidden=!!term;results.hidden=!term;list.replaceChildren();
    if(!term)return;
    const addResult=(name,kind,onSelect)=>{
      const button=document.createElement('button');button.type='button';button.className='home-sidebar-search-result';button.title=name;button.setAttribute('aria-label',name);
      const title=document.createElement('span');title.textContent=name;const type=document.createElement('small');type.textContent=kind;button.append(title,type);
      button.onclick=e=>{e.stopPropagation();onSelect()};list.append(button);
    };
    const seen=new Set();
    for(const chat of $$('[data-open-chat]',this.pane)){
      const name=chat.dataset.openChat,id=chat.dataset.threadId;
      if(seen.has(id)||!name.toLowerCase().includes(term))continue;
      seen.add(id);addResult(name,'对话',()=>openConversation(id));
    }
    empty.hidden=!!list.children.length;
  }
  showTooltip(button,label) {
    if(button.querySelector(".rail-label"))return;
    if(label==='首页'&&window.ConversationNotifications?.count){this.hideTooltip();return}
    this.moreMenu.close();
    const rect=button.getBoundingClientRect();
    this.tooltip.textContent=label;this.tooltip.hidden=false;
    this.tooltip.style.left=(rect.right+10)+'px';
    this.tooltip.style.top=Math.max(8,Math.min(innerHeight-this.tooltip.offsetHeight-8,rect.top+(rect.height-this.tooltip.offsetHeight)/2))+'px';
    button.setAttribute('aria-describedby',this.tooltip.id);
    this.tooltipButton=button;
  }
  hideTooltip() {
    this.tooltip.hidden=true;
    this.tooltipButton?.removeAttribute('aria-describedby');
  }
  clearCurrent() {
    $$('.is-current',this.pane).forEach(row=>row.classList.remove('is-current'));
    $$('[data-open-chat]',this.pane).forEach(button=>button.setAttribute('aria-pressed','false'));
    $('[data-your-lumi]',this.pane).setAttribute('aria-pressed','false');
  }
  syncSelection() {
    const full=isPageCopilotFullscreen(),current=full?WorkspaceTabs.currentThread():ChatStore.get(state.activeThreadId),view=full?(current?.kind==='personal'?'lumi':current?.messages.length?'conversation':'new'):state.homeView;
    for(const button of $$('.home-sidebar-actions button',this.pane)) {
      const active=button.matches('[data-new-chat]')?view==='new':button.matches('[data-your-lumi]')&&view==='lumi';
      button.classList.toggle('is-current',active);button.setAttribute('aria-pressed',String(active));
    }
    for(const button of $$('[data-open-chat]',this.pane)) {
      const active=view==='conversation'&&button.dataset.threadId===current?.id;
      button.closest('.sidebar-chat-row').classList.toggle('is-current',active);button.setAttribute('aria-pressed',String(active));
    }
  }
  historyRecords() {
    const record=button=>({kind:'thread',id:button.dataset.threadId,title:$('b',button)?.textContent||button.dataset.openChat,time:$('em',button)?.textContent||''});
    return Array.from($('.conversation-scroll',this.pane).children).filter(block=>block.classList.contains('sidebar-block')).map(block=>{
      const heading=$('[data-sidebar-section-toggle]',block),entries=$$('.history-list:not([hidden]) [data-open-chat]',block).map(record);
      return {name:$('span',heading).textContent,expanded:heading.getAttribute('aria-expanded')!=='false',entries};
    });
  }
  addThread(thread,list=$('#sidebar-history-list',this.pane)) {
    let row=$$('[data-open-chat]',this.pane).find(button=>button.dataset.threadId===thread.id)?.closest('.sidebar-chat-row');
    if(!row){row=document.createElement('div');row.className='sidebar-chat-row';row.innerHTML='<button class="history-row" type="button" data-open-chat><b></b><em>刚刚</em></button><div class="sidebar-hover-actions"><button type="button" data-pin-chat title="置顶"><img src="assets/navigation/pin-outline.svg" alt=""></button><button class="is-danger" type="button" data-delete-chat title="删除"><img src="assets/navigation/删除.svg" alt=""></button></div>';list.prepend(row)}
    const main=$('[data-open-chat]',row);main.dataset.threadId=thread.id;main.dataset.openChat=thread.title;$('b',main).textContent=thread.title;row.dataset.threadId=thread.id;this.setActionLabels();return row;
  }
  setActionLabels() {
    for(const button of $$('.conversation-scroll [data-new-chat]',this.pane))button.setAttribute('aria-label','新建历史对话');
    for(const row of $$('.sidebar-chat-row',this.pane)) {
      const main=$('[data-open-chat]',row),name=main.dataset.openChat;
      if(!main.dataset.threadId)main.dataset.threadId=ChatStore.seed(name).id;
      row.dataset.threadId=main.dataset.threadId;
      const pin=$('[data-pin-chat]',row),pinned=row.classList.contains('is-pinned');
      if(pin){const action=`${pinned?'取消置顶':'置顶'}${name}`;pin.setAttribute('aria-label',action);pin.setAttribute('aria-pressed',String(pinned));pin.title=action;$('img',pin).src=PinIcon.src(pinned);}
      $('[data-delete-chat]',row)?.setAttribute('aria-label',`删除${name}`);
    }
    this.searchRecords();
  }
  closeLocalMenus() {
    $$('[data-sidebar-organize-menu]',this.pane).forEach(menu=>menu.hidden=true);
    $$('[data-sidebar-history-more]',this.pane).forEach(button=>button.setAttribute('aria-expanded','false'));
  }
  openRecordMenu(row,x,y) {
    this.closeLocalMenus();state.context={kind:'history',row,x,y};state.menu='history';renderOverlays();
  }
  openArtifacts() {
    if(state.nav!=='首页')navigate('首页');
    HomeLayout.openDocument({id:'home-conversation-artifacts',title:'对话产物',type:'conversation-artifacts'});
  }
  handlePaneClick(e) {
    const button=e.target.closest('button');if(!button)return;
    e.stopPropagation();
    if(button.matches('[data-new-chat]'))return startNewChat();
    if(button.matches('[data-your-lumi]'))return openLumi();
    if(button.matches('[data-open-artifacts]'))return this.openArtifacts();
    if(button.matches('[data-sidebar-section-toggle]')) {
      const expanded=button.getAttribute('aria-expanded')!=='false';
      button.setAttribute('aria-expanded',String(!expanded));
      button.closest('.sidebar-block').classList.toggle('is-section-collapsed',expanded);return;
    }
    if(button.matches('[data-open-chat]'))return openConversation(button.dataset.threadId);
    if(button.matches('[data-pin-chat]')) {
      const row=button.closest('.sidebar-chat-row'),pinned=row.classList.toggle('is-pinned');
      if(pinned){row.dataset.pinOrigin=row.parentElement.id;$('#sidebar-pinned-list',this.pane).append(row)}
      else (document.getElementById(row.dataset.pinOrigin)||$('#sidebar-history-list',this.pane)).append(row);
      button.title=pinned?'取消置顶':'置顶';this.setActionLabels();return;
    }
    if(button.matches('[data-delete-chat]'))return this.deleteRecord(button.closest('.sidebar-chat-row'));
    if(button.matches('[data-sidebar-history-more]')) {
      const block=button.closest('.sidebar-block');let menu=$('[data-sidebar-organize-menu]',block);
      if(!menu){menu=document.createElement('div');menu.className='sidebar-organize-menu';menu.dataset.sidebarOrganizeMenu='';menu.setAttribute('role','menu');menu.innerHTML='<p>排序方式</p><button type="button" data-sort-mode="最近更新">最近更新</button><button type="button" data-sort-mode="手动排序">手动排序</button>';$('.sidebar-section-head',block).append(menu);menu.hidden=true}
      const visible=menu.hidden;this.closeLocalMenus();menu.hidden=!visible;button.setAttribute('aria-expanded',String(visible));return;
    }
    if(button.matches('[data-sort-mode]')) {
      const block=button.closest('.sidebar-block');
      for(const list of $$('.history-list',block)) {
        if(!list._manualOrder)list._manualOrder=Array.from(list.children);
        const rows=Array.from(list.children),rank=row=>{const time=$('em',row)?.textContent||'';return time.startsWith('今天')?0.5:{'刚刚':0,'1天':1,'2天':2,'3天':3}[time]??4};
        rows.sort(button.dataset.sortMode==='最近更新'?(a,b)=>rank(a)-rank(b):(a,b)=>list._manualOrder.indexOf(a)-list._manualOrder.indexOf(b));list.append(...rows);
      }
      for(const item of $$('[data-sort-mode]',block)){item.classList.toggle('is-selected',item===button);item.setAttribute('aria-checked',String(item===button))}
      this.closeLocalMenus();
    }
  }
  renameRecord(row) {
    const label=$('b',row);if(!label)return;
    const old=label.textContent,input=document.createElement('input');input.className='record-rename';input.value=old;input.setAttribute('aria-label','重命名记录');label.replaceWith(input);input.focus();input.select();
    let finished=false;
    const finish=save=>{if(finished||!input.isConnected)return;finished=true;input.onblur=null;const name=save&&input.value.trim()?input.value.trim():old;label.textContent=name;input.replaceWith(label);const button=$('[data-open-chat]',row);if(button){button.dataset.openChat=name;ChatStore.rename(button.dataset.threadId,name);const title=$(`.conversation-view[data-thread-id="${button.dataset.threadId}"] .conversation-heading>span`);if(title)title.textContent=name;updateConversationTitle()}this.setActionLabels()};
    input.onclick=e=>e.stopPropagation();input.onblur=()=>finish(true);input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')finish(true);if(e.key==='Escape')finish(false)};
  }
  deleteRecord(row) {
    const ids=[row.dataset.threadId].filter(Boolean);ids.forEach(id=>ChatStore.remove(id));
    row.remove();
    this.searchRecords();
    NavigationHistory.sync();
    if(ids.includes(state.pendingThreadId))state.pendingThreadId=null;
    if(ids.includes(state.copilotThreadId)){state.copilotThreadId=null;state.answer=false}
    if(ids.includes(state.activeThreadId))startNewChat();
    else if(state.mode==='split'&&navigationPages[state.nav])render({preservePage:true});
  }
};
