/* Session navigation between pages and home conversations. */
(() => {
  const fields=['nav','page','previousPage','mode','homeView','activeThreadId','pendingThreadId','copilotThreadId','pageCopilotKind','copilotExpanded','selectedPage','marketSecondary','compact','answer','draft','sentMessage'];
  const entries=[];let index=-1;
  const snapshot=()=>Object.fromEntries(fields.map(key=>[key,state[key]]));
  const route=view=>view.nav==='首页'
    ? `首页:${view.homeView}:${view.activeThreadId||view.pendingThreadId||'new'}`
    : `${view.nav}:${view.page}:${view.nav==='行情'?view.selectedPage+':'+(view.marketSecondary||''):''}`;
  const available=view=>view.nav!=='首页'||!(view.activeThreadId||view.pendingThreadId)||!!ChatStore.get(view.activeThreadId||view.pendingThreadId);
  const target=step=>{let next=index+step;while(next>=0&&next<entries.length){if(available(entries[next]))return next;next+=step}return -1};
  function remember(){if(index>=0&&route(entries[index])===route(state))entries[index]=snapshot()}
  function record(){
    const view=snapshot();
    if(index>=0&&route(entries[index])===route(view)){entries[index]=view;return}
    entries.splice(index+1);entries.push(view);index=entries.length-1;
  }
  function go(step){
    const next=target(step);if(next<0)return;
    remember();ConversationPage.save();
    const assistant={copilotThreadId:state.copilotThreadId,pageCopilotKind:state.pageCopilotKind,draft:state.draft,answer:state.answer,sentMessage:state.sentMessage};
    index=next;Object.assign(state,entries[index],assistant,{menu:null,context:null,preview:false,detached:false});
    if(state.nav!=='首页')Object.assign(state,assistant,{mode:state.copilotOpen?'split':'work',copilotExpanded:false});render();
  }
  function sync(){for(const button of document.querySelectorAll('.home-navigation-button'))button.disabled=target(Number(button.dataset.historyStep))<0}
  function addSidebarToggle(parent){
    const toggle=document.createElement('button');toggle.type='button';toggle.className='home-left-toggle';toggle.setAttribute('aria-label','收起或展开历史栏');toggle.setAttribute('aria-controls','home-history-sidebar');toggle.setAttribute('aria-expanded',String(HomeLayout.leftSidebarOpened()));toggle.title=HomeLayout.leftSidebarOpened()?'收起左侧边栏':'展开左侧边栏';
    toggle.innerHTML='<img src="assets/99717.svg" alt="">';toggle.onclick=HomeLayout.toggleLeftSidebar;parent.append(toggle);
  }
  function syncCopilotEntry(){
    const button=document.querySelector('.copilot-entry-toggle');if(!button)return;
    const left=CopilotDock.side()==='left',parent=document.querySelector(left?'.home-navigation-controls':'#titlebar');
    button.classList.toggle('is-docked-left',left);if(parent&&button.parentElement!==parent)parent.append(button);
    const opened=state.mode==='split'&&!state.copilotFloating;
    button.querySelector('img').src='assets/navigation/Copilot.svg';
    CopilotDock.syncTitle();
    button.title=(button.classList.contains('has-conversation')?button.textContent+' · ':'')+(opened?'收起 Copilot':'打开 Copilot');
    button.setAttribute('aria-expanded',String(opened));button.setAttribute('aria-pressed',String(opened));
  }
  function addControls(parent){
    const group=document.createElement('div');group.className='home-navigation-controls';group.setAttribute('aria-label','浏览导航');
    for(const [label,step,path] of [['返回',-1,'m12 5-7 7 7 7M5 12h14'],['前进',1,'m12 5 7 7-7 7M5 12h14']]){
      const button=document.createElement('button');button.type='button';button.className='home-navigation-button';button.setAttribute('aria-label',label);button.title=label;button.disabled=target(step)<0;
      button.dataset.historyStep=step;
      button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
      button.onclick=()=>go(step);group.append(button);
    }
    group.append(sidebarView.railToggle);
    if(HomeLayout.usesConversationLayout()){
      addSidebarToggle(group);
    }else if(canOpenPageCopilot()){
      const toggle=document.createElement('button');toggle.type='button';toggle.className='home-left-toggle titlebar-new-chat copilot-entry-toggle';toggle.setAttribute('aria-label','Copilot');toggle.setAttribute('aria-controls','page-copilot');toggle.setAttribute('aria-expanded',String(state.mode==='split'));toggle.setAttribute('aria-pressed',String(state.mode==='split'));toggle.title=state.mode==='split'?'关闭 Copilot':'打开 Copilot';
      toggle.innerHTML='<img src="assets/navigation/Copilot.svg" alt="">';toggle.onclick=event=>{if(CopilotDock.consumeDrag()){event.preventDefault();return}togglePageCopilot()};CopilotDock.bindDrag(toggle);parent.append(toggle);
    }
    parent.append(group);syncCopilotEntry();
  }
  addEventListener('conversation:changed',syncCopilotEntry);
  window.NavigationHistory={remember,record,addControls,addSidebarToggle,sync,syncCopilotEntry};
})();
