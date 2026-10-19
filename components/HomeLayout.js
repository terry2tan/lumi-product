/* A shared file sidebar with conversation-scoped tabs. */
(() => {
  const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const card=make('section','home-card');card.id='home-card';card.setAttribute('aria-label','首页布局');
  const panel=make('aside','home-right-sidebar');panel.id='home-right-sidebar';panel.setAttribute('aria-label','右侧边栏');panel.hidden=true;
  let blankSequence=0;const sessions=new Map(),files=new Map();
  const usesConversationLayout=()=>state.nav==='首页'||isPageCopilotFullscreen();
  const thread=()=>state.nav==='首页'?ChatStore.get(state.activeThreadId||state.pendingThreadId):WorkspaceTabs.currentThread();
  const key=()=>thread()?.id||`${state.nav}:new`;
  const scopedKey=id=>`${state.nav==='首页'?'home':'copilot'}:${id}`;
  function session(id=key()){id=scopedKey(id);if(!sessions.has(id))sessions.set(id,{opened:false,tabs:[],active:null,expanded:false,fullscreenSidebarOpen:false,view:'conversation'});return sessions.get(id)}
  const fullscreenPreview=()=>state.nav==='首页'&&session().opened&&session().expanded&&session().view==='file';
  const leftSidebarOpened=()=>fullscreenPreview()?session().fullscreenSidebarOpen:!state.compact;
  const combinedTabs=()=>state.nav==='首页'&&session().opened&&session().expanded;
  const isOpen=()=>session().opened;
  function save(){
    const root=panel.querySelector('.workspace-document-preview'),file=root&&files.get(root.dataset.documentId);if(file&&!panel.hidden)file.scrollTop=root.scrollTop;
    const tree=panel.querySelector('.home-file-tree-view'),item=tree&&files.get(tree.dataset.treeId);if(item&&!panel.hidden)item.treeScrollTop=tree.querySelector('.home-file-tree').scrollTop;
    const profile=panel.querySelector('.lumi-profile-view');if(profile&&!panel.hidden)files.get('lumi-profile').scrollTop=profile.scrollTop;
  }
  function startFresh(){if(!thread())sessions.delete(scopedKey(key()))}
  function adoptThread(owner){
    const id=scopedKey(key());if(thread()||!sessions.has(id))return;
    save();sessions.set(scopedKey(owner.id),sessions.get(id));sessions.delete(id);
  }
  function prepare(){
    const home=usesConversationLayout();stage.classList.toggle('is-home-layout',home);stage.classList.toggle('is-fullscreen-copilot',isPageCopilotFullscreen());
    if(!home){if(surface.parentElement===card)stage.append(surface);card.hidden=true;panel.classList.add('page-right-sidebar');stage.append(panel);return}
    panel.classList.remove('page-right-sidebar');card.hidden=false;if(!card.isConnected)stage.append(card);
    const floating=window.FullscreenPreview?.sidebarVisible()||false;sidebarView.pane.classList.toggle('is-floating-history',floating);
    if(leftSidebarOpened()||floating)card.append(sidebarView.pane);else sidebarView.pane.remove();card.append(surface,panel);
  }
  function createBlank(){
    const number=++blankSequence,item={id:`home-blank-${number}`,title:'新建标签页',type:'blank'};
    files.set(item.id,item);const current=session();current.tabs.push(item.id);current.active=item.id;return item;
  }
  function setOpen(value){save();const current=session();current.opened=value;if(!value){current.expanded=false;current.view='conversation'}if(value&&!current.tabs.length)createBlank();sync()}
  function toggleFullscreen(){save();ConversationPage.save();FullscreenPreview.captureSidebar();const current=session();current.expanded=!current.expanded;current.fullscreenSidebarOpen=false;current.view=current.expanded?'file':'conversation';sync()}
  function toggleLeftSidebar(){
    if(fullscreenPreview()){save();session().fullscreenSidebarOpen=!session().fullscreenSidebarOpen;sync()}
    else{state.compact=!state.compact;state.preview=false;render({preservePage:isPageCopilotFullscreen()})}
    document.querySelector('.home-left-toggle[aria-controls="home-history-sidebar"]')?.focus({preventScroll:true});
  }
  function chooseConversation(){save();session().view='conversation';state.compact=false;sidebarRender();prepare();sync();document.querySelector('#surface .conversation-input')?.focus({preventScroll:true})}
  function updateButton(){const left=document.querySelector('.home-left-toggle[aria-controls="home-history-sidebar"]');if(left){left.setAttribute('aria-expanded',String(leftSidebarOpened()||window.FullscreenPreview?.sidebarVisible()));left.title=leftSidebarOpened()?'收起左侧边栏':'展开左侧边栏'}const button=document.querySelector('.home-right-toggle');if(!button)return;const opened=isOpen();button.setAttribute('aria-expanded',String(opened));button.removeAttribute('aria-pressed');button.title=opened?'收起右侧边栏':'展开右侧边栏';const full=document.querySelector('.home-preview-fullscreen');if(full){full.hidden=!opened;full.setAttribute('aria-label',session().expanded?'退出文件全屏':'全屏预览文件');full.title=full.getAttribute('aria-label');full.setAttribute('aria-pressed',String(session().expanded))}}
  function addToggle(parent){
    if(state.nav!=='首页')return;
    const button=make('button','home-right-toggle');button.type='button';button.setAttribute('aria-label','右侧边栏');button.setAttribute('aria-controls',panel.id);button.innerHTML='<img src="assets/99717.svg" alt="">';button.onclick=()=>setOpen(!isOpen());parent.append(button);const full=make('button','home-preview-fullscreen');full.type='button';full.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>';full.onclick=toggleFullscreen;parent.append(full);updateButton();
  }
  function addBlank(){save();const item=createBlank();session().opened=true;session().view='file';sync();requestAnimationFrame(()=>document.getElementById(`home-tab-label-${item.id}`)?.focus({preventScroll:true}))}
  function choose(id){if(!session().tabs.includes(id))return;save();session().active=id;session().view='file';sync()}
  function close(id){
    const current=session(),index=current.tabs.indexOf(id);if(index<0)return;save();current.tabs.splice(index,1);if(current.active===id)current.active=current.tabs[index-1]||current.tabs[0]||null;
    current.opened=current.tabs.length>0;if(!current.opened){current.expanded=false;current.view='conversation'}sync();document.querySelector('.home-right-toggle')?.focus({preventScroll:true});
  }
  function openFile(owner,message){
    openDocument(WorkspaceTabs.fileFor(owner,message),owner.id);
  }
  function openProfile(){openDocument({id:'lumi-profile',title:'Lumi个人资料',type:'lumi-profile'},'lumi')}
  function openRelatedTargets(owner,message){openDocument({id:`related-${owner.id}-${message.id}`,title:'相关标的',type:'lumi-related',ownerId:owner.id,messageId:message.id,relatedTargets:message.relatedTargets},owner.id)}
  function openDocument(source,ownerId=key()){
    if(WorkspaceTabs.isWorkspace()&&!['lumi-profile','blank','project-files','conversation-artifacts'].includes(source.type)){save();session().opened=false;WorkspaceTabs.openDocument(source);return}
    save();const file=files.get(source.id)||source;if(file!==source){file.title=source.title;file.text=source.text;if(source.relatedTargets)file.relatedTargets=source.relatedTargets}files.set(file.id,file);
    const current=session(ownerId);if(!current.tabs.includes(file.id))current.tabs.push(file.id);current.active=file.id;current.opened=true;current.view='file';sync();
  }
  function emptyTab(item){
    const root=make('section','home-empty-tab'),actions=make('div','home-empty-tab-actions');
    const entries=[['knowledge','知识库','知识库'],...(NativeBridge.available?[['project-files','工作目录文件','项目-收起']]:[]),['conversation-artifacts','对话产物','文件']];
    for(const [type,title,icon]of entries){
      const button=make('button','home-empty-tab-button');button.type='button';button.setAttribute('aria-label',`打开${title}`);
      const glyph=make('img');glyph.src=`assets/navigation/${icon}.svg`;glyph.alt='';button.append(glyph,make('span',null,`打开${title}`));
      button.onclick=type==='knowledge'?()=>navigate('知识库'):()=>{save();item.type=type;item.title=title;sync();requestAnimationFrame(()=>panel.querySelector('[role=treeitem]')?.focus({preventScroll:true}))};actions.append(button);
    }
    root.append(actions);return root;
  }
  function tab(item,current){
    const active=item.id===current.active&&(!combinedTabs()||current.view==='file'),row=make('div','top-workspace-tab'+(active?' is-active':''));row.dataset.tabId=item.id;
    const label=make('button','top-workspace-tab-label');label.type='button';label.id=`home-tab-label-${item.id}`;label.title=item.title;label.setAttribute('role','tab');label.setAttribute('aria-label',item.title);label.setAttribute('aria-selected',String(active));label.setAttribute('aria-controls','home-tab-content');label.tabIndex=active?0:-1;label.onclick=()=>choose(item.id);
   const icon=make('img','top-workspace-tab-icon');icon.src=item.type==='lumi-profile'?LumiProfile.avatar:`assets/navigation/${item.type==='project-files'?'项目-收起':'文件'}.svg`;if(item.type==='lumi-profile')icon.dataset.lumiAvatar='';icon.alt='';label.append(icon,make('span','top-workspace-tab-text',item.title));row.append(label);
    const remove=make('button','top-workspace-tab-close','×');remove.type='button';remove.setAttribute('aria-label',`关闭${item.title}`);remove.title=`关闭${item.title}`;remove.onclick=()=>close(item.id);row.append(remove);return row;
  }
  function conversationHeader(){
    if(state.nav!=='首页')return null;
    const owner=thread();if(!usesConversationLayout()||state.nav==='首页'&&!combinedTabs()&&(!owner||owner.kind==='personal'&&owner.onboarding?.phase==='welcome'||owner.kind!=='personal'&&!owner.messages.length))return null;
    const personal=owner?.kind==='personal'||state.nav!=='首页'&&state.pageCopilotKind==='lumi';
    const fresh=!owner||!personal&&!owner.messages.length,title=personal?'你的 Lumi':fresh?'新对话':owner.title,icon=make('img',combinedTabs()?'top-workspace-tab-icon':'conversation-title-icon');icon.src=personal?LumiProfile.avatar:`assets/navigation/${fresh?'新对话':'Copilot'}.svg`;icon.alt='';if(personal)icon.dataset.lumiAvatar='';
    if(!combinedTabs()){const heading=make('div','conversation-title');heading.title=title;heading.append(icon,make('span','conversation-title-text',title));return heading}
    const selected=!fullscreenPreview(),row=make('div','top-workspace-tab'+(selected?' is-active':''));row.dataset.tabId='home-conversation';
    const button=make('button','top-workspace-tab-label');button.type='button';button.id='home-conversation-tab';button.title=title;button.setAttribute('role','tab');button.setAttribute('aria-label',title);button.setAttribute('aria-selected',String(selected));button.setAttribute('aria-controls','surface');button.tabIndex=selected?0:-1;button.onclick=chooseConversation;
    button.append(icon,make('span','top-workspace-tab-text',title));row.append(button);return row;
  }
  function renderTabs(){
    document.getElementById('home-sidebar-titlebar')?.remove();document.getElementById('home-conversation-titlebar')?.remove();
    const current=session(),combined=combinedTabs(),conversation=conversationHeader();stage.classList.toggle('has-conversation-title',!!conversation);
    if(conversation&&!combined){const root=make('div','home-conversation-titlebar');root.id='home-conversation-titlebar';root.append(conversation);document.getElementById('titlebar').append(root)}
    if(isOpen()){
      const root=make('div','home-sidebar-titlebar'+(combined?' is-combined':''));root.id='home-sidebar-titlebar';
      const strip=make('div','workspace-tabs-strip'),list=make('div','top-workspace-tabs');list.setAttribute('role','tablist');list.setAttribute('aria-label',combined?'首页标签页':'右侧栏标签');
      if(combined&&conversation)list.append(conversation);for(const id of current.tabs)list.append(tab(files.get(id),current));
      const add=make('button','top-workspace-tab-add');add.type='button';add.title='新建右侧栏标签页';add.setAttribute('aria-label','新建右侧栏标签页');add.innerHTML='<img src="assets/navigation/添加.svg" alt="">';add.onclick=addBlank;
      strip.append(list,add);root.append(strip);document.getElementById('titlebar').append(root);TabOverflow.mount(root,list);
      list.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!event.target.matches('[role=tab]'))return;event.preventDefault();const tabs=[...list.querySelectorAll('[role=tab]')],index=tabs.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length,id=tabs[next].id;tabs[next].click();document.getElementById(id)?.focus({preventScroll:true})};
    }
    requestAnimationFrame(position);
  }
  function position(){
    const controls=document.querySelector('.home-navigation-controls'),start=(controls?.getBoundingClientRect().right||232)+8,narrow=innerWidth<=700,narrowStart=Math.max(72,sidebar.getBoundingClientRect().right+12);
    const conversation=document.getElementById('home-conversation-titlebar'),root=document.getElementById('home-sidebar-titlebar');
    const entry=document.querySelector('.copilot-entry-toggle'),titleReserve=entry&&CopilotDock.side()==='right'?innerWidth-entry.getBoundingClientRect().left+8:window.NativeBridge?.available?88:160;
    if(conversation){const end=narrow?innerWidth-8:isOpen()&&!panel.hidden?Math.min(innerWidth-titleReserve,panel.getBoundingClientRect().left-8):innerWidth-titleReserve,left=narrow?narrowStart:start,available=Math.max(0,end-left),width=isPageCopilotFullscreen()?Math.min(240,available*.45):available;Object.assign(conversation.style,{left:left+'px',top:(narrow?44:7)+'px',width:width+'px'})}
    if(root){const bounds=panel.getBoundingClientRect(),combined=combinedTabs(),left=combined?(narrow?narrowStart:start):bounds.left,right=combined?(narrow?innerWidth-8:innerWidth-titleReserve):(narrow?bounds.right:Math.min(bounds.right,innerWidth-titleReserve));Object.assign(root.style,{left:left+'px',top:(narrow?(WorkspaceTabs.isWorkspace()?84:44):7)+'px',width:Math.max(0,right-left)+'px'});root.querySelector('.top-workspace-tab.is-active')?.scrollIntoView({block:'nearest',inline:'nearest'})}
    if(root)TabOverflow.update(root);WorkspaceTabs.position();window.FullscreenPreview?.position();
  }
  function sync(){
    const opened=isOpen()&&(!combinedTabs()||fullscreenPreview());
    stage.classList.toggle('is-home-file-fullscreen',fullscreenPreview());
    const home=usesConversationLayout();stage.classList.toggle('has-right-sidebar',opened);stage.classList.toggle('has-page-right-sidebar',opened&&!home);card.classList.toggle('has-right-sidebar',opened&&home);panel.hidden=!opened;
    stage.classList.toggle('has-home-sidebar',home&&leftSidebarOpened());if(home)prepare();
    if(opened){
      const current=session();if(!current.tabs.length)createBlank();const file=files.get(current.active),old=panel.querySelector('.workspace-document-preview');
      const isTree=['project-files','conversation-artifacts'].includes(file.type);
      const content=file.type==='lumi-profile'?LumiProfile.render():file.type==='blank'?emptyTab(file):isTree?ConversationFileTree.render(file,thread(),openDocument):old?.dataset.documentId===file.id&&file.type!=='lumi-related'?old:WorkspaceTabs.preview(file);
      content.id='home-tab-content';content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby',`home-tab-label-${file.id}`);
      if(file.type!=='blank'&&!isTree){if(file.type!=='lumi-profile')content.classList.add('home-file-preview');const top=file.scrollTop||0;content.onscroll=()=>{if(content.isConnected&&!panel.hidden)file.scrollTop=content.scrollTop};requestAnimationFrame(()=>{if(content.isConnected&&!panel.hidden)content.scrollTop=top})}
      const hasPreviewHeader=!['blank','project-files','conversation-artifacts','lumi-profile'].includes(file.type);
      if(hasPreviewHeader)panel.replaceChildren(WorkbenchPage.previewHeader(file),content);
      else if(panel.firstElementChild!==content)panel.replaceChildren(content);
    }
    renderTabs();updateButton();window.FullscreenPreview?.sync();
    for(const button of surface.querySelectorAll('.artifact-open[data-file-id]'))button.setAttribute('aria-pressed',String(WorkspaceTabs.isWorkspace()?button.dataset.fileId===WorkspaceTabs.active():opened&&button.dataset.fileId===session().active));
    requestAnimationFrame(()=>{WorkspaceTabs.position();window.PanelResize?.sync()});
  }
  function isFileActive(owner,message){const id=WorkspaceTabs.fileFor(owner,message).id;if(WorkspaceTabs.isWorkspace())return WorkspaceTabs.active()===id;const current=session(owner.id);return current.opened&&current.active===id}
  addEventListener('resize',position);
  addEventListener('keydown',event=>{if(event.key==='Escape'&&isOpen()){setOpen(false);document.querySelector('.home-right-toggle')?.focus({preventScroll:true})}});
  addEventListener('conversation:changed',event=>{if(event.detail.reason!=='stream'&&event.detail.id===thread()?.id){save();sync()}});
  window.HomeLayout={prepare,sync,save,startFresh,adoptThread,addToggle,openFile,openDocument,openProfile,openRelatedTargets,isFileActive,usesConversationLayout,opened:isOpen,position,renderTabs,fullscreenPreview,leftSidebarOpened,toggleLeftSidebar};
})();
