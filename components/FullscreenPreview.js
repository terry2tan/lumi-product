/* Collapsed home history floats on hover; full preview also keeps its composer. */
window.FullscreenPreview=(()=>{
  let hoverOpen=false,hideTimer=0,frame=0,composer=null,placeholder=null,sourceThreadId=null,root=null,observer=null,noticeObserver=null,historyBounds=null,composerWidth=0;
  const canHoverSidebar=()=>state.nav==='首页'&&!HomeLayout.leftSidebarOpened();
  const sidebarVisible=()=>hoverOpen&&canHoverSidebar();
  const toggle=()=>document.querySelector('.home-left-toggle[aria-controls="home-history-sidebar"]');
  const pane=()=>sidebarView.pane;
  function captureSidebar(){const node=pane();if(node.isConnected&&!node.classList.contains('is-floating-history')){const box=node.getBoundingClientRect();if(box.width&&box.height)historyBounds={width:box.width,height:box.height}}}
  function clearHide(){clearTimeout(hideTimer);hideTimer=0}
  function hideSidebar(){clearHide();if(!hoverOpen)return;hoverOpen=false;HomeLayout.sync()}
  function showSidebar(){
    clearHide();if(!canHoverSidebar()||hoverOpen)return;
    hoverOpen=true;HomeLayout.sync();
  }
  function scheduleHide(event){
    if(event?.relatedTarget&&(pane().contains(event.relatedTarget)||toggle()?.contains(event.relatedTarget)))return;
    clearHide();hideTimer=setTimeout(()=>{if(pane().matches(':hover')||toggle()?.matches(':hover')||pane().contains(document.activeElement))return;hideSidebar()},180);
  }
  function bindSidebar(){
    const button=toggle();if(!button||button.fullscreenHoverBound)return;button.fullscreenHoverBound=true;
    button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')showSidebar()});
    button.addEventListener('pointerleave',scheduleHide);
    button.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&canHoverSidebar()){event.preventDefault();showSidebar();pane().querySelector('button')?.focus({preventScroll:true})}});
    if(!pane().fullscreenHoverBound){pane().fullscreenHoverBound=true;pane().addEventListener('pointerenter',clearHide);pane().addEventListener('pointerleave',scheduleHide);pane().addEventListener('focusout',()=>requestAnimationFrame(()=>{if(sidebarVisible()&&!pane().contains(document.activeElement))scheduleHide()}))}
  }
  function position(){
    frame=0;const card=document.getElementById('home-card'),panel=document.getElementById('home-right-sidebar');
    if(!card||card.hidden||!panel)return;
    if(sidebarVisible()){
      const narrow=innerWidth<=700,style=getComputedStyle(document.documentElement),width=narrow?card.clientWidth:parseFloat(style.getPropertyValue('--home-sidebar-width'))||historyBounds?.width||248;
      const height=narrow?parseFloat(getComputedStyle(pane()).height)||320:historyBounds?.height||card.clientHeight;
      Object.assign(pane().style,{width:Math.min(width,card.clientWidth-8)+'px',height:Math.min(height,card.clientHeight-8)+'px'});
    }
    if(!HomeLayout.fullscreenPreview()||!root||!composer)return;
    const box=panel.getBoundingClientRect(),bounds=card.getBoundingClientRect(),width=Math.max(0,Math.min(720,box.width-(box.width<360?24:40)));
    Object.assign(root.style,{left:(box.left-bounds.left-card.clientLeft+box.width/2)+'px',width:width+'px'});
    let bottom=innerWidth<=700?16:24;const notice=document.getElementById('global-update-notice');
    if(notice&&!notice.hidden){const update=notice.getBoundingClientRect(),left=box.left+(box.width-width)/2;if(update.right+8>left&&update.left-8<left+width)bottom=Math.max(bottom,bounds.bottom-update.top+12)}
    root.style.bottom=bottom+'px';
    if(composerWidth!==width){composerWidth=width;composer.refreshComposer?.()}
    card.style.setProperty('--preview-composer-height',root.offsetHeight+'px');
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(position)}
  function resetSidebar(){
    clearHide();hoverOpen=false;pane().classList.remove('is-floating-history');pane().style.removeProperty('width');pane().style.removeProperty('height');
  }
  function restoreComposer(refresh=true){
    observer?.disconnect();observer=null;noticeObserver?.disconnect();noticeObserver=null;composerWidth=0;
    if(composer){
      if(placeholder?.isConnected)placeholder.replaceWith(composer);else composer.remove();
      composer.classList.remove('is-preview-floating','is-preview-compact');composer.querySelector('textarea').rows=2;composer.refreshComposer?.();
    }
    root?.remove();root=null;placeholder=null;composer=null;
    if(refresh&&sourceThreadId)ConversationPage.refresh(sourceThreadId);sourceThreadId=null;
  }
  function restore(refresh=true){captureSidebar();resetSidebar();restoreComposer(refresh)}
  function sync(){
    bindSidebar();
    if(!canHoverSidebar())resetSidebar();
    if(!HomeLayout.fullscreenPreview()){captureSidebar();restoreComposer();position();return}
    if(!composer){
      const form=surface.querySelector('.chat-composer');if(!form){schedule();return}
      composer=form;sourceThreadId=form.closest('.conversation-view')?.dataset.threadId||null;
      placeholder=document.createComment('composer position');form.before(placeholder);
      root=document.createElement('div');root.className='home-preview-input';root.id='home-preview-input';
      root.append(form);document.getElementById('home-card').append(root);form.classList.add('is-preview-floating');
      observer=new ResizeObserver(schedule);for(const node of [root,document.getElementById('home-card'),document.getElementById('home-right-sidebar')])observer.observe(node);
      const notice=document.getElementById('global-update-notice');if(notice){observer.observe(notice);noticeObserver=new MutationObserver(schedule);noticeObserver.observe(notice,{attributes:true,attributeFilter:['hidden']})}
      form.refreshComposer?.();
    }
    position();
  }
  document.addEventListener('pointerdown',event=>{if(sidebarVisible()&&!pane().contains(event.target)&&!toggle()?.contains(event.target))hideSidebar()},true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(HomeLayout.fullscreenPreview()&&document.getElementById('composer-model-menu')){event.preventDefault();event.stopImmediatePropagation();ChatComposer.closeMenu(true)}
    else if(sidebarVisible()&&!event.target.closest('#home-history-search')){event.preventDefault();event.stopImmediatePropagation();hideSidebar();toggle()?.focus({preventScroll:true})}
  },true);
  addEventListener('conversation:changed',event=>{
    if(!composer||event.detail.id!==sourceThreadId)return;
    const thread=ChatStore.get(sourceThreadId),input=composer.querySelector('textarea');
    if(thread?.clearSubmittedDraft){input.value='';thread.clearSubmittedDraft=false}
    if(thread?.restoreFailedDraft){if(!input.value)input.value=thread.draft;thread.restoreFailedDraft=false}
    if(thread?.kind==='personal')LumiReply.renderQuote(composer,thread);
    composer.refreshComposer?.();schedule();
  });
  addEventListener('resize',schedule);
  return {sync,restore,position,captureSidebar,sidebarVisible};
})();
