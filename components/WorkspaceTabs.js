/* Navigation and artifact tabs accumulate in opening order outside Home. */
(() => {
  const files=new Map(),shared={active:null,lastContent:null,tabs:[]};let marketNode=null,blankSequence=0,currentNav=null;
  try{localStorage.removeItem('thsai-v4-workbench-tabs')}catch{}
  const sections=[['market','行情'],['workbench','工作台'],['catalog','商城'],['tasks','自动任务'],['documents','文件'],['projects','知识库'],['feedback','反馈'],['settings','系统设置'],['news','资讯','rss'],['funds','基金/ETF','chart-pie'],['futures','期货','chart-candlestick'],['backtest','策略回测','flask-conical']];
  const recentTabs=new Map([['market',[]],['workbench',[]]]);let recentMenu=null,recentAnchor=null;
  const section=id=>sections.find(item=>item[0]===id);
  const currentSection=()=>sections.find(item=>item[1]===state.nav);
  function selectNavigation(){
    currentNav=state.nav;const target=currentSection();if(!target)return;
    const id=target[0];if(!shared.tabs.includes(id))shared.tabs.push(id);
    shared.active=shared.lastContent=id;
  }
  function session(){if(currentNav!==state.nav)selectNavigation();return shared}
  const selectedId=()=>session().active;
  const isWorkspace=()=>sections.some(item=>item[1]===state.nav);
  const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const currentThread=()=>ChatStore.get(state.pageCopilotKind==='lumi'?'lumi':state.copilotThreadId);
  function focusSelected(){requestAnimationFrame(()=>document.querySelector('#workspace-titlebar .is-active [role=tab]')?.focus({preventScroll:true}))}
  function choose(id){
    const current=session();
    if(id==='chat'){if(!state.copilotExpanded)return;current.active=id;render({preservePage:true});return}
    if(!current.tabs.includes(id))return;
    saveContent();const target=section(id);
    if(target&&state.nav!==target[1]){navigate(target[1]);return}
    current.active=current.lastContent=id;rememberRecentTab(id);
    if(target)state.copilotExpanded=false;
    render({preservePage:true});
  }
  function close(id){
    const current=session(),index=current.tabs.indexOf(id);if(index<0)return;
    saveContent();rememberRecentTab(id);current.tabs.splice(index,1);
    if(!current.tabs.length){current.active=current.lastContent=null;navigate('首页');return}
    const next=current.tabs[Math.max(0,index-1)];
    if(current.active===id){choose(next);focusSelected();return}
    if(current.lastContent===id)current.lastContent=next;
    render({preservePage:true});focusSelected();
  }
  function openDocument(source){
    if(!isWorkspace())return;saveContent();const file=files.get(source.id)||source;if(file!==source)Object.assign(file,source);files.set(file.id,file);
    const current=session();if(!current.tabs.includes(file.id))current.tabs.push(file.id);current.active=current.lastContent=file.id;rememberRecentTab(file.id);render({preservePage:true});
  }
  function addBlank(){
    if(state.nav!=='行情')return;
    const sequence=++blankSequence,file={id:`blank-tab-${sequence}`,title:'新建标签页',type:'blank',text:''};
    openDocument(file);
    requestAnimationFrame(()=>document.querySelector('#workspace-titlebar .top-workspace-tab.is-active [role=tab]')?.focus());
  }
  function fileFor(thread,message){return message.document||{id:`file-${thread.id}-${message.id}`,title:'CPO 产业链研究报告',type:'cpo',text:message.text};}
  function open(thread,message){HomeLayout.openFile(thread,message)}
  function preview(file){
    if(file.type==='lumi-related')return LumiRelatedTargets.preview(file);
    const root=make('section','workspace-document-preview');root.dataset.documentId=file.id;root.setAttribute('aria-label','文件预览');
    if(file.type==='blank'){
      root.classList.add('workspace-blank-preview');root.setAttribute('aria-label','新建标签页');
      const page=make('article','workspace-blank-page'),body=make('div','workspace-blank-layout');
      body.setAttribute('aria-hidden','true');
      body.innerHTML=`<div class="wf-box workspace-blank-search"><span class="wf-line" style="--wf-line-width:38%"></span></div><div class="workspace-blank-tiles">${Array.from({length:3},()=>'<div class="wf-box workspace-blank-tile"><span class="workspace-blank-thumbnail"></span><div class="wf-text"><span class="wf-line" style="--wf-line-width:66%"></span><span class="wf-line" style="--wf-line-width:42%"></span></div></div>').join('')}</div>`;
      page.append(make('h1',null,file.title),body);root.append(page);
    }else if(state.nav==='工作台'&&file.type==='text'&&!file.text){
      const article=make('article','workspace-document-body'),body=make('div','workbench-content-placeholder');body.setAttribute('aria-hidden','true');
      body.innerHTML='<div class="wf-box workbench-placeholder-toolbar"><span class="wf-line" style="--wf-line-width:36%"></span></div><div class="workbench-placeholder-grid">'+Array.from({length:4},()=>'<div class="wf-box workbench-placeholder-block"><span class="wf-line" style="--wf-line-width:48%"></span><span class="wf-line" style="--wf-line-width:76%"></span><span class="wf-line" style="--wf-line-width:62%"></span></div>').join('')+'</div>';
      article.append(make('h1',null,file.title),body);root.append(article);
    }else if(file.type==='cpo'){const report=make('article','report workspace-report');report.append(fragment('Report'));root.append(report)}
    else{const article=make('article','workspace-document-body');article.append(make('h1',null,file.title));if(file.type!=='local')for(const paragraph of file.text.split('\n\n'))article.append(make('p',null,paragraph));if(file.type==='local'&&NativeBridge.available){const loading=make('p',null,'正在读取文件…');article.append(loading);NativeBridge.call('readFile',{path:file.path}).then(result=>{file.text=result.text;loading.remove();const copy=make('pre');copy.style.whiteSpace='pre-wrap';copy.style.overflowWrap='anywhere';copy.textContent=result.text;article.append(copy)}).catch(error=>loading.textContent=error.message);const reveal=make('button',null,'在 Finder 中显示');reveal.type='button';reveal.onclick=()=>NativeBridge.call('revealFile',{path:file.path}).catch(error=>loading.textContent=error.message);article.append(reveal)}root.append(article)}
    root.onscroll=()=>file.scrollTop=root.scrollTop;requestAnimationFrame(()=>{if(root.isConnected)root.scrollTop=file.scrollTop||0});return root;
  }
  function saveContent(){window.WorkbenchTabs?.save();const wb=document.querySelector('#surface>.workbench');wb?.marketToolReading?.save();const root=wb?.querySelector(':scope>.workspace-document-preview');const file=root&&files.get(root.dataset.documentId);if(file)file.scrollTop=root.scrollTop;}
  function syncContent(wb){
    if(!isWorkspace())return;if(state.nav==='行情'&&state.page==='market'){marketNode=wb;syncMarketPrimaryNavigation(wb)}
    const old=wb.querySelector(':scope>.workspace-document-preview'),file=files.get(selectedId()),same=old&&file&&old.dataset.documentId===file.id;
    if(old&&!same)old.remove();wb.querySelector(':scope>.workspace-preview-header')?.remove();
    if(file&&!same)wb.append(preview(file));
    if(file&&file.type!=='blank'){const header=WorkbenchPage.previewHeader(file);header.classList.add('workspace-preview-header');wb.append(header)}
    wb.classList.toggle('has-document-preview',!!file);wb.classList.toggle('has-preview-header',!!file&&file.type!=='blank');
    if(file){const top=file.scrollTop||0;requestAnimationFrame(()=>{const root=wb.querySelector(':scope>.workspace-document-preview');if(root?.isConnected)root.scrollTop=top})}
    const showWorkspace=state.copilotExpanded&&selectedId()!=='chat';surface.classList.toggle('show-full-workspace',showWorkspace);
    if(!file)wb.marketToolReading?.restore();
  }
  function tab(id,title,closable){
    const selected=selectedId()===id,row=make('div','top-workspace-tab'+(selected?' is-active':''));row.dataset.tabId=id;
    const b=make('button','top-workspace-tab-label');b.type='button';b.title=title;b.setAttribute('role','tab');b.setAttribute('aria-label',title);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;b.onclick=()=>choose(id);
    const glyph=section(id)?.[2],icon=make(glyph?'span':'img','top-workspace-tab-icon');
    if(glyph)icon.innerHTML=NavigationMoreMenu.icons[glyph];else{const personal=id==='chat'&&state.pageCopilotKind==='lumi',name=id==='settings'?'工具菜单':section(id)?.[1]||'文件';icon.src=id==='chat'?(personal?LumiProfile.avatar:'assets/navigation/Copilot.svg'):`assets/navigation/${name}.svg`;if(personal)icon.dataset.lumiAvatar='';icon.alt='';icon.draggable=false}icon.setAttribute('aria-hidden','true');
    b.append(icon,make('span','top-workspace-tab-text',title));row.append(b);
    if(closable){const c=make('button','top-workspace-tab-close','×');c.type='button';c.setAttribute('aria-label',`关闭${title}`);c.title=`关闭${title}`;c.onclick=()=>close(id);row.append(c)}return row;
  }
  function rememberRecentTab(id){
    const recent=recentTabs.get(currentSection()?.[0]);if(!recent||!files.has(id))return;
    const index=recent.indexOf(id);if(index>=0)recent.splice(index,1);recent.unshift(id);recent.length=Math.min(recent.length,30);
  }
  function closeRecentMenu(restore=false){
    recentMenu?.remove();recentMenu=null;recentAnchor?.setAttribute('aria-expanded','false');if(restore&&recentAnchor?.isConnected)recentAnchor.focus({preventScroll:true});recentAnchor=null;
  }
  function positionRecentMenu(){
    if(!recentMenu||!recentAnchor?.isConnected)return;
    const anchor=recentAnchor.getBoundingClientRect(),box=recentMenu.getBoundingClientRect();
    recentMenu.style.left=Math.max(8,Math.min(anchor.right-box.width,innerWidth-box.width-8))+'px';
    recentMenu.style.top=Math.max(8,Math.min(anchor.bottom+6,innerHeight-box.height-8))+'px';
  }
  function openRecentMenu(anchor,focus=false){
    if(recentMenu&&recentAnchor===anchor){if(focus)recentMenu.querySelector('button')?.focus();return}
    closeRecentMenu();recentAnchor=anchor;anchor.setAttribute('aria-expanded','true');
    recentMenu=make('div','workspace-recent-menu');recentMenu.id='workspace-recent-menu';recentMenu.setAttribute('role','menu');recentMenu.setAttribute('aria-label','最近打开的标签页');
    recentMenu.append(make('div','workspace-recent-heading','最近打开'));
    const open=new Set(session().tabs),recent=(recentTabs.get(currentSection()?.[0])||[]).filter(id=>!open.has(id)&&files.has(id));
    if(!recent.length)recentMenu.append(make('div','workspace-recent-empty','暂无最近关闭的标签页'));
    for(const id of recent){
      const file=files.get(id),item=make('button','workspace-recent-item');item.type='button';item.setAttribute('role','menuitem');item.title=file.title;item.dataset.fileId=id;
      const icon=make('img');icon.src='assets/navigation/文件.svg';icon.alt='';item.append(icon,make('span',null,file.title));
      item.onclick=()=>{closeRecentMenu();openDocument(file);requestAnimationFrame(()=>document.querySelector('#workspace-titlebar .is-active [role=tab]')?.focus({preventScroll:true}))};recentMenu.append(item);
    }
    recentMenu.onkeydown=event=>{const items=[...recentMenu.querySelectorAll('button')],index=items.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();closeRecentMenu(true)}else if(items.length&&['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length].focus()}};
    document.body.append(recentMenu);positionRecentMenu();if(focus)recentMenu.querySelector('button')?.focus();
  }
  function recentButton(){
    const button=make('button','workspace-recent-button');button.type='button';button.title='最近打开的标签页';button.setAttribute('aria-label',button.title);button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','workspace-recent-menu');
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2h10M5 6h14"/><rect width="18" height="12" x="3" y="10" rx="2"/></svg>';
    button.onclick=()=>recentMenu&&recentAnchor===button?closeRecentMenu(true):openRecentMenu(button,true);
    button.onkeydown=event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();openRecentMenu(button,true)}};return button;
  }
  document.addEventListener('pointerdown',event=>{if(recentMenu&&!recentMenu.contains(event.target)&&!recentAnchor?.contains(event.target))closeRecentMenu()});
  document.addEventListener('focusin',event=>{if(recentMenu&&!recentMenu.contains(event.target)&&!recentAnchor?.contains(event.target))closeRecentMenu()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&recentMenu){event.preventDefault();closeRecentMenu(true)}});
  function renderHeader(){
    closeRecentMenu();WorkbenchPage.hidePicker();
    CopilotDock.render();document.querySelector('#workspace-titlebar')?.remove();stage.classList.toggle('has-workspace-tabs',isWorkspace());if(!isWorkspace())return;
    const root=make('div','workspace-titlebar'),split=state.mode==='split',expanded=split&&state.copilotExpanded;root.id='workspace-titlebar';root.classList.toggle('is-split',split&&!expanded);root.classList.toggle('is-expanded',expanded);
    const thread=currentThread(),list=make('div','top-workspace-tabs');list.setAttribute('role','tablist');list.setAttribute('aria-label','工作区标签');
    if(expanded)list.append(tab('chat',thread?.title||'新对话',false));
    for(const id of session().tabs){const target=section(id),file=files.get(id);if(target||file)list.append(tab(id,target?.[1]||file.title,true))}
    const strip=make('div','workspace-tabs-strip');strip.append(list);root.append(strip);document.querySelector('#titlebar').append(root);TabOverflow.mount(root,list);requestAnimationFrame(position);
    list.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=[...list.querySelectorAll('[role=tab]')],index=tabs.indexOf(document.activeElement);if(index<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;const id=tabs[next].parentElement.dataset.tabId;choose(id);requestAnimationFrame(()=>document.querySelector(`#workspace-titlebar [data-tab-id="${id}"] [role=tab]`)?.focus())};
  }
  function position(){
    const root=document.querySelector('#workspace-titlebar');if(!root)return;
    const narrow=innerWidth<=700,wb=document.querySelector('#surface>.workbench'),start=(document.querySelector('.home-navigation-controls')?.getBoundingClientRect().right||196+(window.NativeBridge?.titleInset||0))+16,left=root.classList.contains('is-split')&&surface.classList.contains('is-horizontal-copilot')?wb?.getBoundingClientRect().left:start;
    root.style.left=narrow?'64px':Math.max(start,left||start)+'px';root.style.top=narrow?'44px':'7px';
    const panel=document.querySelector('#home-right-sidebar'),side=HomeLayout.opened()&&panel?.getClientRects().length?panel.getBoundingClientRect().left:null;
    const entry=document.querySelector('.copilot-entry-toggle'),entryReserve=entry&&CopilotDock.side()==='right'?innerWidth-entry.getBoundingClientRect().left+8:0;
    root.style.right=narrow?'8px':Math.max(entryReserve,side!==null?innerWidth-side+8:window.NativeBridge?.available?(state.copilotExpanded?92:56):120)+'px';
    if(surface.classList.contains('is-horizontal-copilot')&&wb){const box=wb.getBoundingClientRect();root.style.right=Math.max(parseFloat(root.style.right),innerWidth-box.right+8)+'px'}
    CopilotDock.position(start);TabOverflow.update(root);positionRecentMenu();
    root.querySelector('.top-workspace-tab.is-active')?.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  window.WorkspaceTabs={selectNavigation,isWorkspace,renderHeader,position,open,openDocument,close,choose,addBlank,fileFor,preview,saveContent,syncContent,currentThread,marketNode:()=>marketNode,restoreContent:()=>{const current=session();current.active=current.lastContent},enterChat:()=>{session().active='chat'},active:selectedId,files};
  addEventListener('resize',position);
})();

/* The conversation tab docks its existing panel on either side of the page. */
window.CopilotDock=(()=>{
 let side='left',drag=null,overlay=null,suppressClick=false;
 const make=(tag,cls)=>{const el=document.createElement(tag);el.className=cls;return el};
 function syncTitle(){
  const entry=document.querySelector('.copilot-entry-toggle');if(!entry)return;
  const thread=WorkspaceTabs.currentThread(),personal=state.pageCopilotKind==='lumi',hasConversation=!!thread&&(personal?thread.onboarding?.phase!=='welcome':thread.messages.length>0),show=hasConversation&&state.mode==='split'&&!state.copilotFloating&&!state.copilotExpanded;
  let label=entry.querySelector('.copilot-conversation-title');if(!label){label=make('span','copilot-conversation-title');entry.append(label)}
  label.textContent=show?(personal?'你的 Lumi':thread.title):'';label.hidden=!show;entry.classList.toggle('has-conversation',!!show);
 }
 function dock(next){if(!['left','right'].includes(next))return;side=next;NavigationHistory.syncCopilotEntry();PanelResize.sync()}
 function cleanup(){const button=drag?.button,pointer=drag?.pointer;drag=null;overlay?.remove();overlay=null;document.body.classList.remove('is-dragging-copilot');if(button?.hasPointerCapture(pointer))button.releasePointerCapture(pointer)}
 function target(event){const box=surface.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<0||event.clientY>box.bottom)return null;return event.clientX<box.left+box.width/2?'left':'right'}
 function move(event){
  if(!drag||event.pointerId!==drag.pointer)return;
  if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<6)return;
  drag.moved=true;drag.target=target(event);document.body.classList.add('is-dragging-copilot');
  if(!overlay){overlay=make('div','copilot-dock-target');overlay.setAttribute('aria-hidden','true');document.body.append(overlay)}
  overlay.hidden=!drag.target;if(!drag.target)return;
  const box=surface.getBoundingClientRect(),width=Math.min(box.width/2,document.getElementById('page-copilot').getBoundingClientRect().width);
  Object.assign(overlay.style,{left:(drag.target==='left'?box.left:box.right-width)+'px',top:box.top+'px',width:width+'px',height:box.height+'px'});
 }
 function bindDrag(handle){
  handle.classList.add('copilot-drag-handle');
  handle.onpointerdown=event=>{
   if(event.button!==0||state.mode!=='split'||state.copilotExpanded||state.copilotFloating)return;
   if(event.target.closest('button,input,textarea,a,[role=button]')&&event.target.closest('button,input,textarea,a,[role=button]')!==handle)return;
   suppressClick=false;drag={button:handle,pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false,target:null};handle.setPointerCapture(event.pointerId);
  };
  handle.onpointermove=move;
  handle.onpointerup=event=>{if(!drag||drag.button!==handle||event.pointerId!==drag.pointer)return;const next=drag.moved?target(event):null;suppressClick=drag.moved;cleanup();if(next)dock(next)};
  handle.onpointercancel=()=>{suppressClick=!!drag?.moved;cleanup()};handle.onlostpointercapture=()=>{if(drag?.button===handle)cleanup()};
 }
 function render(){
  cleanup();document.getElementById('copilot-titlebar')?.remove();syncTitle();
  if(!WorkspaceTabs.isWorkspace()||state.mode!=='split'||state.copilotExpanded||state.copilotFloating)return;
  const root=make('div','copilot-titlebar');root.id='copilot-titlebar';root.setAttribute('aria-hidden','true');root.append(make('span','copilot-tab-divider'));document.getElementById('titlebar').append(root);
 }
 function position(start){
  const root=document.getElementById('copilot-titlebar'),chat=document.getElementById('page-copilot'),entry=document.querySelector('.copilot-entry-toggle');
  if(entry){entry.style.left='';entry.style.right='';if(!entry.classList.contains('is-docked-left')&&chat&&state.mode==='split'&&!state.copilotFloating){entry.style.left=(chat.getBoundingClientRect().left+12)+'px';entry.style.right='auto'}}
  if(!root||!chat)return;const box=chat.getBoundingClientRect();Object.assign(root.style,{left:(side==='left'?box.right+6:box.left-6)+'px',top:(innerWidth<=700?44:7)+'px',width:'1px'});root.querySelector('.copilot-tab-divider').style.left='0';
 }
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&drag){suppressClick=drag.moved;cleanup();event.preventDefault()}});
 addEventListener('blur',cleanup);
 return {render,position,syncTitle,dock,bindDrag,side:()=>side,consumeDrag:()=>{const value=suppressClick;suppressClick=false;return value}};
})();

/* Shared mode selector for every embedded Copilot state. */
window.CopilotModeMenu=(()=>{
 let menu=null,anchor=null;
 function close(restore=false){menu?.remove();menu=null;anchor?.setAttribute('aria-expanded','false');if(restore&&anchor?.isConnected)anchor.focus({preventScroll:true});anchor=null}
 function open(trigger,focus=false){
  if(anchor===trigger&&menu){if(focus)menu.firstElementChild.focus();else close();return}close();anchor=trigger;trigger.setAttribute('aria-expanded','true');
  menu=document.createElement('div');menu.className='copilot-mode-menu';menu.id='copilot-mode-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','对话模式');
  for(const [label,personal]of [['新对话',false],['你的 Lumi',true]]){
   const item=document.createElement('button');item.type='button';item.setAttribute('role','menuitem');
   const img=document.createElement('img');img.src=personal?LumiProfile.avatar:'assets/navigation/新对话.svg';img.alt='';const text=document.createElement('span');text.textContent=label;item.append(img,text);
   item.onclick=()=>{close();if(personal)openPageConversation('lumi');else startPageCopilot();document.querySelector('#page-copilot .conversation-input,#page-copilot .editor')?.focus({preventScroll:true})};menu.append(item);
  }
  document.body.append(menu);const bounds=trigger.getBoundingClientRect(),box=menu.getBoundingClientRect();
  const sourceIcon=trigger.closest('.copilot-mode-controls')?.querySelector('.copilot-new-chat img'),itemIcon=menu.querySelector('img');
  const left=sourceIcon?sourceIcon.getBoundingClientRect().left-(itemIcon.getBoundingClientRect().left-box.left):bounds.left;
  menu.style.left=Math.max(8,Math.min(left,innerWidth-box.width-8))+'px';menu.style.top=Math.max(8,Math.min(bounds.bottom+6,innerHeight-box.height-8))+'px';
  menu.onkeydown=event=>{const choices=[...menu.children],index=choices.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true)}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?choices.length-1:(index+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length;choices[next].focus()}};
 }
 document.addEventListener('pointerdown',event=>{if(menu&&!menu.contains(event.target)&&!anchor?.contains(event.target))close()});
 document.addEventListener('focusin',event=>{if(menu&&!menu.contains(event.target)&&!anchor?.contains(event.target))close()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu){event.preventDefault();event.stopImmediatePropagation();close(true)}});
 addEventListener('resize',()=>close());return {open,close};
})();
window.createCopilotToolbar=function(){
 const bar=document.createElement('div');bar.className='copilot-toolbar';bar.dataset.nodeId='344:18705';bar.setAttribute('aria-label','Copilot 工具栏');
 const personal=state.pageCopilotKind==='lumi',left=document.createElement('div');left.className='copilot-mode-controls';
 const main=document.createElement('button');main.type='button';main.className='copilot-new-chat';main.setAttribute('aria-label',personal?'你的 Lumi':'新对话');
 const icon=document.createElement('img');icon.src=personal?LumiProfile.avatar:'assets/navigation/新对话.svg';icon.alt='';const text=document.createElement('span');text.textContent=personal?'你的 Lumi':'新对话';main.append(icon,text);main.onclick=()=>personal?openPageConversation('lumi'):startPageCopilot();
 const dropdown=document.createElement('button');dropdown.type='button';dropdown.className='copilot-toolbar-button copilot-mode-toggle';dropdown.setAttribute('aria-label','切换对话模式');dropdown.setAttribute('aria-haspopup','menu');dropdown.setAttribute('aria-expanded','false');dropdown.setAttribute('aria-controls','copilot-mode-menu');dropdown.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';dropdown.onclick=()=>CopilotModeMenu.open(dropdown);dropdown.onkeydown=event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();CopilotModeMenu.open(dropdown,true);const items=document.querySelectorAll('#copilot-mode-menu button');items[event.key==='ArrowDown'?0:items.length-1]?.focus()}};left.append(main,dropdown);
 const controls=document.createElement('div');controls.className='copilot-toolbar-group';
 const history=document.createElement('button');history.type='button';history.className='copilot-toolbar-button';history.setAttribute('aria-label','历史记录');history.title='历史记录';history.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11a9 9 0 1 1 2.4 7.1M3 4v7h7M12 7v5l3 2"/></svg>';history.onclick=()=>{CopilotModeMenu.close();CopilotHistory.open(history)};
 const close=document.createElement('button');close.type='button';close.className='copilot-toolbar-button';close.setAttribute('aria-label',state.copilotFloating?'关闭悬浮对话':'关闭 Copilot');close.title=state.copilotFloating?'关闭悬浮对话':'关闭 Copilot';close.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';close.onclick=()=>{closeConversation();document.querySelector('.copilot-entry-toggle')?.focus({preventScroll:true})};
 const divider=document.createElement('span');divider.className='copilot-mode-divider';divider.setAttribute('aria-hidden','true');left.append(divider,history);
 controls.append(CopilotPresentation.moreButton(),close);bar.append(left,controls);CopilotDock.bindDrag(bar);return bar;
};
